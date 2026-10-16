import React, { useMemo, useState } from 'react';
import Link from 'next/link';

type LandReport = {
  address: string;
  land_area_m2: number;
  land_area_pyeong: number;
  zoning_district: string;
  max_building_coverage_ratio: number;
  max_floor_area_ratio: number;
  recommended_max_floors: number;
  total_building_area_m2: number;
  estimated_construction_cost: number;
  estimated_roi?: number;
  estimated_months?: number;
  data_source?: string;
  parse_note?: string;
  lat?: string;
  lon?: string;
  pnu?: string;
};

const DEAL_CHIPS = [
  { id: 'land', label: '토지·필지' },
  { id: 'build', label: '건축 가능' },
  { id: 'jeonse', label: '전세 안전' },
  { id: 'sale', label: '매매·실거주' },
];

const PRESET_ADDRESSES = ['신정동 469-26', '서울특별시 양천구 목동', '부산광역시 해운대구 우동'];

function mapEmbedUrl(lat?: string, lon?: string) {
  if (!lat || !lon) {
    return 'https://www.openstreetmap.org/export/embed.html?bbox=126.9,37.48,127.1,37.6&layer=mapnik';
  }
  const y = Number(lat);
  const x = Number(lon);
  const d = 0.006;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${x - d},${y - d},${x + d},${y + d}&layer=mapnik&marker=${y},${x}`;
}

function formatWon(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}억 원`;
  if (value >= 10000) return `${Math.round(value / 10000).toLocaleString()}만 원`;
  return `${value.toLocaleString()}원`;
}

function officialPriceRows(areaM2: number) {
  const years = [2022, 2023, 2024, 2025, 2026];
  const yoyRates = [0, 4.1, 2.8, 1.6, 1.2];
  let unit = 1_720_000;
  return years.map((year, i) => {
    unit = Math.round(unit * (1 + yoyRates[i] / 100));
    return {
      year,
      unit,
      total: Math.round(unit * areaM2),
      yoy: yoyRates[i],
    };
  });
}

function nearbyListings(address: string, pyeong: number, dealChip: string) {
  const loc = address.replace(/[0-9-]+$/, '').trim() || address;
  const all = [
    { deal: 'sale', type: '매매', title: `${loc} 인근 아파트`, spec: '84㎡ · 중층 · 2008년', price: '3억 2,000' },
    { deal: 'jeonse', type: '전세', title: `${loc} 역세권 전세`, spec: '59㎡ · 저층 · 보증 가능', price: '1억 8,500' },
    { deal: 'sale', type: '매매', title: `${loc} 다가구`, spec: `${Math.max(20, Math.round(pyeong))}평 · 대지 공유`, price: '4억 1,000' },
    { deal: 'land', type: '토지', title: `${loc} 인접 필지`, spec: '제2종일반주거 · 약 40평', price: '2억 6,000' },
    { deal: 'jeonse', type: '월세', title: `${loc} 원룸`, spec: '보증 500 / 월 45', price: '월 45만' },
  ];
  if (dealChip === 'build' || dealChip === 'land') return all.filter((x) => x.deal === 'land' || x.deal === 'sale');
  if (dealChip === 'jeonse') return all.filter((x) => x.deal === 'jeonse');
  if (dealChip === 'sale') return all.filter((x) => x.deal === 'sale' || x.deal === 'land');
  return all;
}

export default function LandInsightPage() {
  const [query, setQuery] = useState('신정동 469-26');
  const [chip, setChip] = useState('land');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [report, setReport] = useState<LandReport | null>(null);
  const [tradeItems, setTradeItems] = useState<any[]>([]);
  const [tradeNote, setTradeNote] = useState('');
  const [tradeSource, setTradeSource] = useState('');

  const embed = useMemo(() => mapEmbedUrl(report?.lat, report?.lon), [report?.lat, report?.lon]);

  const handleAnalyze = async (address = query) => {
    const trimmed = address.trim();
    if (!trimmed) {
      setError('지번 또는 도로명 주소를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/autodev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: trimmed }),
      });
      const json = await res.json();
      if (!res.ok || !json?.data) {
        throw new Error(json?.detail || '분석에 실패했습니다.');
      }
      setReport(json.data as LandReport);
      try {
        const marketRes = await fetch(`/api/v1/market/trades?address=${encodeURIComponent(trimmed)}`);
        const marketJson = await marketRes.json();
        setTradeItems(Array.isArray(marketJson.items) ? marketJson.items : []);
        setTradeNote(marketJson.note || '');
        setTradeSource(marketJson.source || '');
      } catch {
        setTradeItems([]);
        setTradeNote('실거래가 조회에 실패했습니다.');
        setTradeSource('');
      }
    } catch (err: any) {
      setError(err.message || '분석 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const priceRows = report ? officialPriceRows(report.land_area_m2) : [];
  const liveListings = tradeItems.filter((item) => {
    if (chip === 'jeonse') return item.deal === 'jeonse';
    if (chip === 'sale' || chip === 'land' || chip === 'build') return item.deal === 'sale' || item.deal === 'land';
    return true;
  });
  const listings = liveListings.length
    ? liveListings
    : report
      ? nearbyListings(report.address, report.land_area_pyeong, chip)
      : [];
  const latestPrice = priceRows[priceRows.length - 1];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col">
      <header className="shrink-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Link href="/" className="text-xl font-black text-blue-600 tracking-tight">
            Matkim
          </Link>
          <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
            토지·입지 분석
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
          <Link href="/wallet" className="text-slate-600 hover:text-blue-600">
            월렛
          </Link>
          <Link href="/" className="text-slate-600 hover:text-blue-600">
            Q&A
          </Link>
        </div>
      </header>

      <div className="shrink-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAnalyze();
          }}
          className="flex gap-2"
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="주소 검색 (예: 신정동 469-26)"
            className="flex-1 h-12 px-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-extrabold disabled:bg-slate-300"
          >
            {loading ? '분석 중' : '필지 보기'}
          </button>
        </form>

        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {DEAL_CHIPS.map((item) => (
            <button
              key={item.id}
              onClick={() => setChip(item.id)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold border transition ${
                chip === item.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {PRESET_ADDRESSES.map((addr) => (
            <button
              key={addr}
              onClick={() => {
                setQuery(addr);
                handleAnalyze(addr);
              }}
              className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
            >
              {addr}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-[52vh]">
        <div className="relative h-[42vh] lg:h-auto lg:min-h-[52vh] bg-slate-200">
          <iframe title="입지 지도" src={embed} className="absolute inset-0 w-full h-full border-0" />
          <div className="absolute left-3 bottom-3 bg-white/95 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-500 shadow">
            공공 지도 위에 브이월드 필지 좌표를 표시합니다.
          </div>
        </div>

        <aside className="bg-white border-t lg:border-t-0 lg:border-l border-slate-200 overflow-y-auto p-4 sm:p-5">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">{error}</div>
          )}

          {!report && !loading && (
            <div className="h-full flex flex-col justify-center text-center py-10 px-4">
              <p className="text-lg font-black text-slate-900 mb-2">주소를 찍으면 필지 정보가 열립니다</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                검색창에 지번을 넣고 필지 보기를 누르세요. 용도지역, 면적, 건폐율·용적률, 예상 건축 규모가 오른쪽(모바일은 아래) 카드로 나옵니다.
              </p>
            </div>
          )}

          {loading && (
            <div className="py-16 text-center text-sm font-bold text-blue-600 animate-pulse">공공데이터로 필지를 찾는 중...</div>
          )}

          {report && !loading && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-blue-600 mb-1">분석 주소</p>
                <h1 className="text-lg font-black text-slate-900 leading-snug">{report.address}</h1>
                {report.pnu && <p className="mt-1 text-[11px] font-mono text-slate-400">PNU {report.pnu}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Metric label="대지면적" value={`${report.land_area_pyeong}평`} sub={`${report.land_area_m2}㎡`} />
                <Metric label="용도지역" value={report.zoning_district} />
                <Metric label="건폐율" value={`${report.max_building_coverage_ratio}%`} />
                <Metric label="용적률" value={`${report.max_floor_area_ratio}%`} />
              </div>

              {(chip === 'land' || chip === 'build') && (
                <div className="rounded-2xl bg-slate-900 text-white p-4">
                  <p className="text-xs font-bold text-amber-300 mb-2">건축 가능 규모 (추정)</p>
                  <ul className="space-y-1.5 text-sm">
                    <li>최고 {report.recommended_max_floors}층 · 연면적 {report.total_building_area_m2}㎡</li>
                    <li>예상 공사비 {formatWon(report.estimated_construction_cost)}</li>
                    {report.estimated_roi != null && <li>참고 수익률 {report.estimated_roi}%</li>}
                  </ul>
                </div>
              )}

              {chip === 'jeonse' && (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                  전세 안전은 권리분석(선순위 채권, 보증보험)이 핵심입니다. 이 필지 주소를 메인 Q&A에서 선택하면 1만원 리포트로 이어서 볼 수 있습니다.
                </div>
              )}

              {chip === 'sale' && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  실거주·매매는 용도지역과 건축 가능 규모를 먼저 본 뒤, 메인 Q&A에서 자금·DSR 질문을 이어가면 됩니다.
                </div>
              )}

              <Link
                href="/"
                className="block text-center py-3 rounded-2xl bg-blue-600 text-white text-sm font-extrabold hover:bg-blue-700"
              >
                이 주소로 1만원 Q&A 이어가기
              </Link>

              {latestPrice && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-400">참고 공시지가 (2026)</p>
                  <p className="text-sm font-black text-slate-900 mt-1">{formatWon(latestPrice.total)}</p>
                  <p className="text-[11px] text-slate-500">{latestPrice.unit.toLocaleString()}원/㎡</p>
                </div>
              )}

              {report.parse_note && (
                <p className="text-[11px] text-slate-400 leading-relaxed">{report.parse_note}</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 sm:p-6 border-t border-slate-200 bg-white">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">주변 매물 리스트</h2>
            <span className="text-[11px] text-slate-400">
              {tradeSource === 'molit_rtms' ? '국토부 실거래가' : '참고용 카드'}
            </span>
          </div>
          {!report ? (
            <p className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-2xl">
              필지를 먼저 조회하면 주변 매물 카드가 열립니다.
            </p>
          ) : (
            <div className="space-y-2">
              {listings.map((item, idx) => (
                <article key={`${item.type}-${item.title}-${idx}`} className="flex gap-3 p-3 rounded-2xl border border-slate-200 bg-slate-50">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-300 to-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black text-blue-600">{item.type}</span>
                    <h3 className="text-sm font-extrabold truncate">{item.title}</h3>
                    <p className="text-[11px] text-slate-500">{item.spec}</p>
                  </div>
                  <p className="text-sm font-black text-slate-900 shrink-0">{item.price}</p>
                </article>
              ))}
              {tradeNote && <p className="text-[11px] text-slate-400 pt-1">{tradeNote}</p>}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black text-slate-900">공시지가 추이</h2>
            <span className="text-[11px] text-slate-400">㎡당 · 필지 면적 환산 참고</span>
          </div>
          {!report ? (
            <p className="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-200 rounded-2xl">
              필지를 먼저 조회하면 연도별 공시지가 표가 열립니다.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-900 text-white text-[11px]">
                  <tr>
                    <th className="text-left font-bold p-3">기준연도</th>
                    <th className="text-right font-bold p-3">원/㎡</th>
                    <th className="text-right font-bold p-3">필지 환산</th>
                    <th className="text-right font-bold p-3">전년 대비</th>
                  </tr>
                </thead>
                <tbody>
                  {priceRows.map((row) => (
                    <tr key={row.year} className="border-t border-slate-100">
                      <td className="p-3 font-bold">{row.year}</td>
                      <td className="p-3 text-right tabular-nums">{row.unit.toLocaleString()}</td>
                      <td className="p-3 text-right font-extrabold text-blue-700">{formatWon(row.total)}</td>
                      <td className={`p-3 text-right font-bold ${row.yoy > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {row.yoy === 0 ? '-' : `+${row.yoy}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 p-3 bg-slate-50">
                국토부 개별공시지가 원장이 아니라, 면적 기준 참고 시뮬입니다. 과세·담보 평가에 쓰지 마세요.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-[11px] font-bold text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-black text-slate-900 leading-snug">{value}</p>
      {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}
