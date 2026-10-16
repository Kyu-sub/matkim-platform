import React, { useMemo, useState } from 'react';
import Link from 'next/link';

const WORKS = [
  { id: 'interior', label: '부분 인테리어', unit: 380, items: ['도배·바닥', '조명', '가구 배치'] },
  { id: 'remodel', label: '올수리 리모델링', unit: 550, items: ['철거', '설비', '마감'] },
  { id: 'extend', label: '증축·대수선', unit: 620, items: ['구조 보강', '인허가', '외장'] },
  { id: 'new', label: '신축', unit: 700, items: ['설계', '골조', '마감'] },
];

export default function RemodelPage() {
  const [workId, setWorkId] = useState('remodel');
  const [pyeong, setPyeong] = useState(28);
  const work = WORKS.find((w) => w.id === workId) || WORKS[1];
  const quote = useMemo(() => {
    const mid = pyeong * work.unit;
    return { low: Math.round(mid * 0.85), high: Math.round(mid * 1.18), unit: work.unit };
  }, [pyeong, work]);

  return (
    <div className="min-h-screen bg-emerald-50/40 text-slate-800 font-sans">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-black text-blue-600">
          Matkim
        </Link>
        <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full border border-emerald-200">
          건축·리모델링 견적
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <p className="text-xs font-black text-emerald-700 mb-2">유형 고르고, 평수 넣고, 금액 구간을 보는 흐름</p>
        <h1 className="text-3xl font-black mb-6 leading-tight">우리 집 공사는 얼마 구간인가요?</h1>

        <div className="grid grid-cols-2 gap-2 mb-6">
          {WORKS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWorkId(w.id)}
              className={`p-3 rounded-2xl border text-left ${
                workId === w.id ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white border-slate-200'
              }`}
            >
              <span className="block text-sm font-extrabold">{w.label}</span>
              <span className={`text-[11px] ${workId === w.id ? 'text-emerald-100' : 'text-slate-500'}`}>평당 {w.unit}만</span>
            </button>
          ))}
        </div>

        <label className="block text-xs font-bold mb-2">시공 면적 {pyeong}평</label>
        <input type="range" min={8} max={120} value={pyeong} onChange={(e) => setPyeong(Number(e.target.value))} className="w-full mb-6" />

        <div className="rounded-3xl bg-white border border-emerald-100 p-6 mb-6 shadow-sm">
          <p className="text-xs text-slate-500">예상 총액</p>
          <p className="text-3xl font-black text-emerald-800 mt-1">
            {quote.low.toLocaleString()} ~ {quote.high.toLocaleString()}만 원
          </p>
          <ul className="mt-4 space-y-2">
            {work.items.map((item) => (
              <li key={item} className="flex justify-between text-sm border-b border-slate-100 pb-2">
                <span>{item}</span>
                <span className="font-bold text-slate-500">포함</span>
              </li>
            ))}
          </ul>
        </div>

        <Link href="/land" className="block text-center py-3 mb-3 rounded-2xl border border-emerald-300 font-bold text-emerald-800">
          이 토지 용적률·층수 확인
        </Link>
        <Link href="/" className="block text-center py-4 rounded-2xl bg-slate-900 text-white font-extrabold">
          견적 타당성 1만원 Q&A
        </Link>
      </main>
    </div>
  );
}
