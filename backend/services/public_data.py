import math
import os
from typing import Any, Dict, Optional, Tuple

import httpx

VWORLD_ADDRESS = "https://api.vworld.kr/req/address"
VWORLD_DATA = "https://api.vworld.kr/req/data"

ZONING_RULES = {
    "제1종전용주거지역": {"bcr": 50.0, "far": 100.0, "floors": 3},
    "제2종전용주거지역": {"bcr": 50.0, "far": 150.0, "floors": 4},
    "제1종일반주거지역": {"bcr": 60.0, "far": 150.0, "floors": 4},
    "제2종일반주거지역": {"bcr": 60.0, "far": 200.0, "floors": 5},
    "제3종일반주거지역": {"bcr": 50.0, "far": 250.0, "floors": 7},
    "준주거지역": {"bcr": 70.0, "far": 400.0, "floors": 10},
    "근린상업지역": {"bcr": 70.0, "far": 900.0, "floors": 15},
    "일반상업지역": {"bcr": 80.0, "far": 800.0, "floors": 15},
    "중심상업지역": {"bcr": 90.0, "far": 1500.0, "floors": 20},
}

COST_PER_M2 = 3_120_000


def _nested(data: Any, *keys, default=None):
    cur = data
    for key in keys:
        if not isinstance(cur, dict) or key not in cur:
            return default
        cur = cur[key]
    return cur


def _pick_zoning_name(properties: Dict[str, Any]) -> Optional[str]:
    if not properties:
        return None
    candidates = []
    for key, value in properties.items():
        if value is None:
            continue
        text = str(value)
        if "주거" in text or "상업" in text or "공업" in text or "녹지" in text:
            candidates.append(text)
        if key.lower() in ("uname", "dgm_nm", "prposareanm", "zon_nm", "dyy_nm"):
            candidates.insert(0, text)
    for name in candidates:
        for zoning in ZONING_RULES:
            if zoning in name:
                return zoning
        if name:
            return name
    return None


def _estimate_area_m2(geometry: Optional[dict]) -> Optional[float]:
    if not geometry:
        return None
    coords = geometry.get("coordinates")
    if not coords:
        return None
    ring = coords[0][0] if geometry.get("type") == "MultiPolygon" else coords[0]
    if not ring or len(ring) < 3:
        return None
    # Approximate planar area from WGS84 degrees near Korea.
    area = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        area += (x1 * y2) - (x2 * y1)
    area = abs(area) / 2.0
    lat = ring[0][1]
    m_per_deg_lat = 110_540
    m_per_deg_lon = 111_320 * math.cos(math.radians(lat))
    return round(area * m_per_deg_lat * m_per_deg_lon, 1)


def _fallback_report(address: str, reason: str) -> Dict[str, Any]:
    zoning = "제2종일반주거지역"
    rules = ZONING_RULES[zoning]
    land_area_m2 = 216.2
    building_area = round(land_area_m2 * (rules["far"] / 100.0), 1)
    return {
        "address": address,
        "land_area_m2": land_area_m2,
        "land_area_pyeong": round(land_area_m2 / 3.3058, 1),
        "zoning_district": zoning,
        "max_building_coverage_ratio": rules["bcr"],
        "max_floor_area_ratio": rules["far"],
        "recommended_max_floors": rules["floors"],
        "total_building_area_m2": building_area,
        "estimated_construction_cost": int(building_area * COST_PER_M2),
        "estimated_roi": 7.8,
        "estimated_months": 14,
        "vacation_guarantee_ratio": 10.0,
        "status": "completed",
        "data_source": "fallback_mock",
        "parse_note": reason,
    }


def _vworld_domain() -> str:
    return os.getenv("VWORLD_DOMAIN", "http://localhost:3000")


def _address_candidates(address: str):
    raw = " ".join(address.strip().split())
    parts = raw.split()
    candidates = [raw]
    for i in range(1, len(parts)):
        shortened = " ".join(parts[i:])
        if any("동" in p or "리" in p or "가" in p for p in shortened.split()):
            candidates.append(shortened)
    seen = set()
    unique = []
    for item in candidates:
        if item not in seen:
            seen.add(item)
            unique.append(item)
    return unique


async def _geocode(client: httpx.AsyncClient, address: str, api_key: str) -> Optional[Tuple[str, str, str]]:
    for candidate in _address_candidates(address):
        for addr_type in ("PARCEL", "ROAD"):
            params = {
                "service": "address",
                "request": "GetCoord",
                "version": "2.0",
                "crs": "epsg:4326",
                "address": candidate,
                "refine": "true",
                "simple": "false",
                "format": "json",
                "type": addr_type,
                "key": api_key,
                "domain": _vworld_domain(),
            }
            res = await client.get(VWORLD_ADDRESS, params=params)
            payload = res.json()
            status = _nested(payload, "response", "status")
            if status != "OK":
                continue
            point = _nested(payload, "response", "result", "point") or {}
            x, y = point.get("x"), point.get("y")
            if x and y:
                refined = _nested(payload, "response", "refined", "text") or candidate
                return str(x), str(y), str(refined)
    return None


async def _get_feature(client: httpx.AsyncClient, dataset: str, lon: str, lat: str, api_key: str) -> Dict[str, Any]:
    params = {
        "service": "data",
        "request": "GetFeature",
        "data": dataset,
        "key": api_key,
        "format": "json",
        "size": "10",
        "page": "1",
        "geometry": "true",
        "attribute": "true",
        "crs": "EPSG:4326",
        "geomFilter": f"POINT({lon} {lat})",
        "domain": _vworld_domain(),
    }
    res = await client.get(VWORLD_DATA, params=params)
    try:
        payload = res.json()
    except Exception:
        return {}
    features = _nested(payload, "response", "result", "featureCollection", "features") or []
    if not features:
        return {}
    return features[0]


async def analyze_address(address: str) -> Dict[str, Any]:
    api_key = os.getenv("VWORLD_API_KEY", "").strip()
    if not api_key:
        return _fallback_report(address, "VWORLD_API_KEY 미설정. 브이월드/토지이음 실데이터 대신 폴백 값을 반환합니다.")

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            geo = await _geocode(client, address, api_key)
            if not geo:
                return _fallback_report(address, "Vworld 지오코딩 결과가 없습니다.")

            lon, lat, refined_address = geo
            parcel = await _get_feature(client, "LP_PA_CBND_BUBUN", lon, lat, api_key)
            zoning_feat = await _get_feature(client, "LT_C_UQ111", lon, lat, api_key)

            parcel_props = (parcel.get("properties") or {}) if parcel else {}
            zoning_props = (zoning_feat.get("properties") or {}) if zoning_feat else {}
            zoning = _pick_zoning_name(zoning_props) or "제2종일반주거지역"
            rules = ZONING_RULES.get(zoning, ZONING_RULES["제2종일반주거지역"])

            area_m2 = None
            for key in ("area", "lndpcl_ar", "agia", "pnu_area"):
                if parcel_props.get(key):
                    try:
                        area_m2 = float(str(parcel_props[key]).replace(",", ""))
                        break
                    except ValueError:
                        pass
            if area_m2 is None:
                area_m2 = _estimate_area_m2(parcel.get("geometry"))
            if not area_m2:
                area_m2 = 216.2

            building_area = round(area_m2 * (rules["far"] / 100.0), 1)
            return {
                "address": parcel_props.get("addr") or refined_address or address,
                "land_area_m2": round(area_m2, 1),
                "land_area_pyeong": round(area_m2 / 3.3058, 1),
                "zoning_district": zoning,
                "max_building_coverage_ratio": rules["bcr"],
                "max_floor_area_ratio": rules["far"],
                "recommended_max_floors": rules["floors"],
                "total_building_area_m2": building_area,
                "estimated_construction_cost": int(building_area * COST_PER_M2),
                "estimated_roi": 7.8,
                "estimated_months": 14,
                "vacation_guarantee_ratio": 10.0,
                "status": "completed",
                "data_source": "vworld",
                "parse_note": "Vworld 지오코딩 + 연속지적도 + 용도지역(토지이음 동일 레이어) 파싱",
                "lon": lon,
                "lat": lat,
                "pnu": parcel_props.get("pnu"),
            }
    except Exception as exc:
        return _fallback_report(address, f"공공데이터 파싱 중 예외: {exc}")
