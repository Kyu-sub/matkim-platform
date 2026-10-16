import os
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET

import httpx

MOLIT_TRADE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev"
MOLIT_RENT = "https://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
FSS_MORTGAGE = "https://finlife.fss.or.kr/finlifeapi/mortgageLoanProductsSearch.json"

# 시군구명 → 법정동코드(5자리). 주소에 포함된 구 단위로 매칭합니다.
LAWD_BY_SIGUNGU = [
    ("울산광역시 남구", "31140"),
    ("서울특별시 양천구", "11470"),
    ("서울특별시 강남구", "11680"),
    ("서울특별시 마포구", "11440"),
    ("부산광역시 해운대구", "26350"),
    ("경기도 성남시 분당구", "41135"),
]


def resolve_lawd_cd(address: str) -> Optional[Tuple[str, str]]:
    text = " ".join((address or "").split())
    for name, code in LAWD_BY_SIGUNGU:
        if name in text:
            return code, name
        parts = name.split()
        if len(parts) >= 2 and parts[-1] in text and parts[0][:2] in text:
            return code, name
    if "남구" in text and "울산" in text:
        return "31140", "울산광역시 남구"
    if "신정동" in text:
        return "31140", "울산광역시 남구"
    if "목동" in text:
        return "11470", "서울특별시 양천구"
    if "우동" in text or "해운대" in text:
        return "26350", "부산광역시 해운대구"
    return None


def _service_key() -> str:
    return os.getenv("DATA_GO_KR_SERVICE_KEY", "").strip()


def _finlife_key() -> str:
    return os.getenv("FINLIFE_API_KEY", "").strip() or _service_key()


def _deal_months(count: int = 2) -> List[str]:
    now = datetime.now()
    months = []
    year, month = now.year, now.month
    for _ in range(count):
        months.append(f"{year}{month:02d}")
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return months


def _text(node: Optional[ET.Element], tag: str) -> str:
    if node is None:
        return ""
    child = node.find(tag)
    if child is None or child.text is None:
        return ""
    return child.text.strip()


def _parse_items(payload: Any) -> List[ET.Element]:
    if isinstance(payload, dict):
        body = (((payload.get("response") or {}).get("body") or {}).get("items") or {})
        items = body.get("item") or []
        if isinstance(items, dict):
            return [items]
        return items if isinstance(items, list) else []
    return []


def _parse_xml_items(xml_text: str) -> List[ET.Element]:
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        return []
    return list(root.iter("item"))


def _to_item_dict(item: Any) -> Dict[str, str]:
    if isinstance(item, dict):
        return {str(k): str(v).strip() if v is not None else "" for k, v in item.items()}
    out = {}
    for child in list(item):
        out[child.tag] = (child.text or "").strip()
    return out


async def _molit_get(client: httpx.AsyncClient, url: str, lawd_cd: str, deal_ymd: str, key: str) -> List[Dict[str, str]]:
    params = {
        "serviceKey": key,
        "LAWD_CD": lawd_cd,
        "DEAL_YMD": deal_ymd,
        "pageNo": "1",
        "numOfRows": "20",
        "_type": "json",
    }
    res = await client.get(url, params=params, timeout=12.0)
    ctype = res.headers.get("content-type", "")
    if "json" in ctype:
        try:
            data = res.json()
        except Exception:
            data = {}
        raw_items = _parse_items(data)
        return [_to_item_dict(x) for x in raw_items]
    return [_to_item_dict(x) for x in _parse_xml_items(res.text)]


def _trade_row(raw: Dict[str, str]) -> Dict[str, Any]:
    amount = (raw.get("dealAmount") or raw.get("거래금액") or "").replace(",", "").replace(" ", "")
    try:
        man = int(amount)
    except ValueError:
        man = 0
    area = raw.get("excluUseAr") or raw.get("전용면적") or ""
    floor = raw.get("floor") or raw.get("층") or ""
    name = raw.get("aptNm") or raw.get("아파트") or "아파트"
    dong = raw.get("umdNm") or raw.get("법정동") or ""
    year = raw.get("dealYear") or raw.get("년") or ""
    month = raw.get("dealMonth") or raw.get("월") or ""
    day = raw.get("dealDay") or raw.get("일") or ""
    return {
        "type": "매매",
        "deal": "sale",
        "title": f"{dong} {name}".strip(),
        "spec": f"{area}㎡ · {floor}층 · {year}.{month}.{day}".replace("· 층", "· "),
        "price": f"{man:,}만" if man else "-",
        "amount_man": man,
        "source": "molit_rtms",
    }


def _rent_row(raw: Dict[str, str]) -> Dict[str, Any]:
    deposit = (raw.get("deposit") or raw.get("보증금액") or "").replace(",", "").replace(" ", "")
    monthly = (raw.get("monthlyRent") or raw.get("월세금액") or "0").replace(",", "").replace(" ", "")
    try:
        dep = int(deposit)
    except ValueError:
        dep = 0
    try:
        month_fee = int(monthly)
    except ValueError:
        month_fee = 0
    area = raw.get("excluUseAr") or raw.get("전용면적") or ""
    name = raw.get("aptNm") or raw.get("아파트") or "아파트"
    dong = raw.get("umdNm") or raw.get("법정동") or ""
    kind = "월세" if month_fee else "전세"
    price = f"월 {month_fee}만" if month_fee else f"{dep:,}만"
    return {
        "type": kind,
        "deal": "jeonse",
        "title": f"{dong} {name}".strip(),
        "spec": f"{area}㎡ · 보증 {dep:,}만",
        "price": price,
        "amount_man": dep,
        "source": "molit_rtms",
    }


async def fetch_trades(address: str) -> Dict[str, Any]:
    resolved = resolve_lawd_cd(address)
    key = _service_key()
    if not resolved:
        return {"ok": False, "source": "none", "note": "시군구 코드를 찾지 못했습니다.", "items": []}
    lawd_cd, region = resolved
    if not key:
        return {
            "ok": False,
            "source": "need_key",
            "lawd_cd": lawd_cd,
            "region": region,
            "note": "DATA_GO_KR_SERVICE_KEY가 없어 국토부 실거래가를 호출하지 못했습니다. data.go.kr 일반 인증키를 .env에 넣으면 살아납니다.",
            "items": [],
        }

    items: List[Dict[str, Any]] = []
    note = ""
    try:
        async with httpx.AsyncClient() as client:
            for ymd in _deal_months(2):
                trades = await _molit_get(client, MOLIT_TRADE, lawd_cd, ymd, key)
                rents = await _molit_get(client, MOLIT_RENT, lawd_cd, ymd, key)
                items.extend(_trade_row(x) for x in trades)
                items.extend(_rent_row(x) for x in rents)
    except Exception as exc:
        note = f"실거래 API 오류: {exc}"

    items = [x for x in items if x.get("title")]
    items.sort(key=lambda x: x.get("amount_man") or 0, reverse=True)
    return {
        "ok": bool(items),
        "source": "molit_rtms" if items else "molit_empty",
        "lawd_cd": lawd_cd,
        "region": region,
        "note": note or ("국토부 아파트 실거래가(최근 2개월)" if items else "해당 월 실거래 건이 없습니다."),
        "items": items[:30],
    }


async def fetch_mortgage_rates() -> Dict[str, Any]:
    key = _finlife_key()
    if not key:
        return {
            "ok": False,
            "source": "need_key",
            "note": "FINLIFE_API_KEY 또는 DATA_GO_KR_SERVICE_KEY가 없어 금융감독원 금리 API를 호출하지 못했습니다.",
            "items": [],
        }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            res = await client.get(
                FSS_MORTGAGE,
                params={"auth": key, "topFinGrpNo": "020000", "pageNo": "1"},
            )
            data = res.json()
    except Exception as exc:
        return {"ok": False, "source": "fss_error", "note": str(exc), "items": []}

    result = data.get("result") or {}
    base_list = result.get("baseList") or []
    option_list = result.get("optionList") or []
    option_by_code: Dict[str, List[Dict[str, Any]]] = {}
    for opt in option_list:
        option_by_code.setdefault(str(opt.get("fin_prdt_cd")), []).append(opt)

    items = []
    for product in base_list[:12]:
        code = str(product.get("fin_prdt_cd") or "")
        opts = option_by_code.get(code) or [{}]
        first = opts[0]
        lend = str(first.get("lend_rate_type_nm") or product.get("lend_rate_type_nm") or "금리")
        try:
            rate = float(first.get("lend_rate_min") or first.get("lend_rate_avg") or 0)
        except (TypeError, ValueError):
            rate = 0.0
        items.append(
            {
                "name": f"{product.get('kor_co_nm', '')} {product.get('fin_prdt_nm', '')}".strip(),
                "type": lend,
                "rate": rate,
                "source": "fss_finlife",
            }
        )

    items = [x for x in items if x["rate"]]
    items.sort(key=lambda x: x["rate"])
    return {
        "ok": bool(items),
        "source": "fss_finlife" if items else "fss_empty",
        "note": "금융감독원 금융상품한눈에 주택담보대출" if items else "금리 상품을 찾지 못했습니다.",
        "items": items[:8],
    }
