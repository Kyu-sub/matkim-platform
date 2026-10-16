import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

const BANKS = [
  { name: 'A은행 주담대', rate: 3.42, type: '변동' },
  { name: 'B은행 정책대출', rate: 2.85, type: '디딤돌' },
  { name: 'C은행 대환', rate: 3.71, type: '고정' },
];

export default function FinancePage() {
  const [income, setIncome] = useState(6000);
  const [monthlyDebt, setMonthlyDebt] = useState(80);
  const [homePrice, setHomePrice] = useState(50000);
  const [rateCards, setRateCards] = useState(BANKS);
  const [rateNote, setRateNote] = useState('참고 금리입니다. 금융감독원 키가 있으면 실제 공시 금리로 바뀝니다.');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/v1/market/rates');
        const json = await res.json();
        if (cancelled) return;
        if (Array.isArray(json.items) && json.items.length) {
          setRateCards(json.items);
          setRateNote(json.note || '금융감독원 금융상품한눈에');
        } else {
          setRateNote(json.note || '공공 금리 키가 없어 참고 금리를 보여 줍니다.');
        }
      } catch {
        if (!cancelled) setRateNote('금리 API 호출에 실패해 참고 금리를 보여 줍니다.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const calc = useMemo(() => {
    const annualIncome = income * 10000;
    const dsrCap = annualIncome * 0.4;
    const existingYear = monthlyDebt * 10000 * 12;
    const roomYear = Math.max(0, dsrCap - existingYear);
    const ltv = Math.round(homePrice * 10000 * 0.7);
    const used = annualIncome ? Math.min(100, Math.round((existingYear / dsrCap) * 100)) : 0;
    return { dsrCap, roomYear, ltv, used };
  }, [income, monthlyDebt, homePrice]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-black text-blue-600">
          Matkim
        </Link>
        <span className="text-[11px] font-bold bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
          대출 한도 시뮬레이터
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <p className="text-xs font-black text-amber-700 mb-2">한도부터 보고, 금리를 고르는 흐름</p>
        <h1 className="text-3xl font-black mb-6 leading-tight">내 소득으로 얼마까지 빌릴 수 있나요?</h1>

        <div className="rounded-3xl bg-slate-900 text-white p-6 mb-6">
          <p className="text-xs text-amber-300 font-bold">DSR 40% 여유 원리금 (연)</p>
          <p className="text-4xl font-black mt-1">{Math.round(calc.roomYear / 10000).toLocaleString()}만 원</p>
          <p className="text-xs text-slate-400 mt-2">LTV 70% 참고 한도 {Math.round(calc.ltv / 10000).toLocaleString()}만 원</p>
          <div className="h-2 bg-slate-700 rounded-full mt-4 overflow-hidden">
            <div className="h-full bg-amber-400" style={{ width: `${calc.used}%` }} />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">현재 DSR 사용 {calc.used}%</p>
        </div>

        <div className="space-y-3 mb-8">
          <Field label="연소득 (만 원)" value={income} onChange={setIncome} />
          <Field label="기존 대출 원리금 (만 원/월)" value={monthlyDebt} onChange={setMonthlyDebt} />
          <Field label="주택 가격 (만 원)" value={homePrice} onChange={setHomePrice} />
        </div>

        <h2 className="text-sm font-black mb-1">은행 금리 카드</h2>
        <p className="text-[11px] text-slate-500 mb-3">{rateNote}</p>
        <div className="space-y-2 mb-8">
          {rateCards.map((b) => (
            <div key={b.name} className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-extrabold">{b.name}</p>
                <p className="text-[11px] text-slate-500">{b.type}</p>
              </div>
              <p className="text-lg font-black text-blue-600">연 {b.rate}%</p>
            </div>
          ))}
        </div>

        <Link href="/" className="block text-center py-4 rounded-2xl bg-blue-600 text-white font-extrabold">
          이 한도로 1만원 Q&A 받기
        </Link>
        <p className="text-[11px] text-slate-400 mt-3 text-center">실제 심사가 아닙니다. 은행 조건은 달라질 수 있습니다.</p>
      </main>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block text-xs font-bold text-slate-600">
      {label}
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full p-3 rounded-2xl border border-slate-200 bg-white text-base font-black"
      />
    </label>
  );
}
