import React, { useMemo, useState } from 'react';
import Link from 'next/link';

const listings = [
  { name: '신정동 469-26 필지', tag: '토지', meta: '제2종일반주거 · 약 59평', price: '건축 규모 확인' },
  { name: '목동 아파트 전세', tag: '전세', meta: '전세가율·선순위 점검', price: '안전진단' },
  { name: '해운대 실거주 매매', tag: '매매', meta: 'DSR·자금 시나리오', price: '한도 보기' },
];

export function RealestateBench() {
  const [deal, setDeal] = useState('전세');
  const [picked, setPicked] = useState(0);

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700">지도·매물 카드형 탐색</p>
        <Link href="/land" className="text-[11px] font-bold text-blue-600">
          필지 지도 열기 →
        </Link>
      </div>
      <div className="flex gap-1.5 mb-3">
        {['전세', '매매', '청약', '토지'].map((d) => (
          <button
            key={d}
            onClick={() => setDeal(d)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              deal === d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {listings.map((item, idx) => (
          <button
            key={item.name}
            onClick={() => setPicked(idx)}
            className={`w-full text-left p-3 rounded-xl border bg-white flex justify-between gap-3 ${
              picked === idx ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200'
            }`}
          >
            <div>
              <span className="text-[10px] font-black text-blue-600 mr-1.5">{item.tag}</span>
              <span className="text-sm font-extrabold text-slate-900">{item.name}</span>
              <p className="text-[11px] text-slate-500 mt-0.5">{item.meta}</p>
            </div>
            <span className="text-[11px] font-bold text-slate-500 shrink-0">{item.price}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function ArchitectureBench() {
  const [work, setWork] = useState<'interior' | 'remodel' | 'new'>('remodel');
  const [pyeong, setPyeong] = useState(24);
  const unit = work === 'interior' ? 400 : work === 'remodel' ? 550 : 700;
  const mid = pyeong * unit * 10000;
  const low = Math.round(mid * 0.85);
  const high = Math.round(mid * 1.2);

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700">공사 유형 · 평수 견적</p>
        <Link href="/remodel" className="text-[11px] font-bold text-emerald-700">
          상세 견적 →
        </Link>
      </div>
      <div className="flex gap-1.5 mb-3">
        {(
          [
            ['interior', '인테리어'],
            ['remodel', '리모델링'],
            ['new', '신축'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setWork(id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              work === id ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1">시공 평수 {pyeong}평</label>
      <input
        type="range"
        min={8}
        max={80}
        value={pyeong}
        onChange={(e) => setPyeong(Number(e.target.value))}
        className="w-full mb-3"
      />
      <div className="rounded-xl bg-white border border-emerald-100 p-3">
        <p className="text-[11px] text-slate-500">예상 공사비 구간 (평당 {unit}만 원 기준)</p>
        <p className="text-xl font-black text-emerald-800 mt-1">
          {(low / 100000000).toFixed(1)}억 ~ {(high / 100000000).toFixed(1)}억
        </p>
      </div>
    </div>
  );
}

export function FinanceBench() {
  const [income, setIncome] = useState(6000);
  const [debt, setDebt] = useState(80);

  const result = useMemo(() => {
    const annual = income * 10000;
    const dsrCap = annual * 0.4;
    const existing = debt * 10000 * 12;
    const room = Math.max(0, dsrCap - existing);
    const usedPct = Math.min(100, Math.round((existing / dsrCap) * 100));
    return { room, usedPct, cap: dsrCap };
  }, [income, debt]);

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700">DSR 한도 · 금리 비교</p>
        <Link href="/finance" className="text-[11px] font-bold text-amber-800">
          대출 시뮬레이터 →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <label className="text-[11px] font-bold text-slate-600">
          연소득 (만 원)
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(Number(e.target.value) || 0)}
            className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-sm font-extrabold"
          />
        </label>
        <label className="text-[11px] font-bold text-slate-600">
          기존 원리금 (만 원/월)
          <input
            type="number"
            value={debt}
            onChange={(e) => setDebt(Number(e.target.value) || 0)}
            className="mt-1 w-full p-2 rounded-lg border border-slate-200 text-sm font-extrabold"
          />
        </label>
      </div>
      <div className="h-2 rounded-full bg-slate-200 overflow-hidden mb-2">
        <div className="h-full bg-amber-500" style={{ width: `${result.usedPct}%` }} />
      </div>
      <p className="text-sm font-black text-slate-900">
        DSR 40% 기준 여유 원리금 약 {Math.round(result.room / 10000).toLocaleString()}만 원/년
      </p>
      <p className="text-[11px] text-slate-500 mt-1">사용률 {result.usedPct}% · 참고용 간이 계산입니다.</p>
    </div>
  );
}

export function LegalBench() {
  const [caseId, setCaseId] = useState('capital-gains');
  const cases = [
    { id: 'capital-gains', label: '양도세', steps: ['보유기간 확인', '비과세 요건', '신고·납부'] },
    { id: 'gift', label: '증여·상속', steps: ['재산 평가', '공제 적용', '신고서 제출'] },
    { id: 'deposit', label: '보증금', steps: ['내용증명', '임차권등기', '소송·경매'] },
  ];
  const current = cases.find((c) => c.id === caseId) || cases[0];

  return (
    <div className="mb-6 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-black text-slate-700">상황별 절세·법무 절차</p>
        <Link href="/tax" className="text-[11px] font-bold text-indigo-700">
          세무 가이드 →
        </Link>
      </div>
      <div className="flex gap-1.5 mb-3">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => setCaseId(c.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              caseId === c.id ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {current.steps.map((step, idx) => (
          <li key={step} className="bg-white rounded-xl border border-indigo-100 p-2 text-center">
            <span className="block text-[10px] font-black text-indigo-500">{idx + 1}단계</span>
            <span className="text-[11px] font-bold text-slate-800">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
