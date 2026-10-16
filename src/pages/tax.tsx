import React, { useState } from 'react';
import Link from 'next/link';

const CASES = [
  {
    id: 'two-home',
    title: '일시적 2주택 양도세',
    docs: ['등기부등본', '주민등록등본', '매매계약서'],
    steps: [
      { t: '요건 확인', d: '신규 주택 취득 후 종전 주택 처분 기한' },
      { t: '비과세 판단', d: '실거주·보유 기간 체크' },
      { t: '신고', d: '잔금일로부터 신고·납부 일정 잡기' },
    ],
  },
  {
    id: 'gift',
    title: '부모 주택 증여',
    docs: ['가족관계증명서', '감정평가 또는 기준시가', '증여세 신고서'],
    steps: [
      { t: '평가', d: '시가 또는 기준시가 중 적용 가능한 가액' },
      { t: '공제', d: '직계존속 증여재산공제 한도' },
      { t: '신고', d: '증여일이 속하는 달의 말일부터 3개월' },
    ],
  },
  {
    id: 'deposit',
    title: '보증금 미반환',
    docs: ['임대차계약서', '내용증명', '임차권등기 신청서'],
    steps: [
      { t: '최고', d: '내용증명으로 반환 기한 통지' },
      { t: '등기', d: '임차권등기명령으로 대항력 유지' },
      { t: '강제', d: '지급명령 또는 경매 검토' },
    ],
  },
];

export default function TaxPage() {
  const [id, setId] = useState('two-home');
  const current = CASES.find((c) => c.id === id) || CASES[0];

  return (
    <div className="min-h-screen bg-indigo-50/30 text-slate-800 font-sans">
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-3 flex justify-between items-center">
        <Link href="/" className="text-xl font-black text-blue-600">
          Matkim
        </Link>
        <span className="text-[11px] font-bold bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-full border border-indigo-200">
          세무·법무 가이드
        </span>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8">
        <p className="text-xs font-black text-indigo-700 mb-2">상황 고르고, 절차와 서류를 한 화면에</p>
        <h1 className="text-3xl font-black mb-6 leading-tight">지금 내 상황에 맞는 다음 한 장은?</h1>

        <div className="flex flex-col gap-2 mb-6">
          {CASES.map((c) => (
            <button
              key={c.id}
              onClick={() => setId(c.id)}
              className={`text-left p-4 rounded-2xl border font-extrabold ${
                id === c.id ? 'bg-indigo-700 text-white border-indigo-700' : 'bg-white border-slate-200'
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        <ol className="space-y-3 mb-6">
          {current.steps.map((s, i) => (
            <li key={s.t} className="bg-white rounded-2xl border border-indigo-100 p-4 flex gap-3">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 text-sm font-black flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="font-black">{s.t}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
          <p className="text-xs font-black text-slate-500 mb-2">챙길 서류</p>
          <ul className="space-y-1.5 text-sm">
            {current.docs.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span className="text-emerald-600 font-black">✓</span> {d}
              </li>
            ))}
          </ul>
        </div>

        <Link href="/" className="block text-center py-4 rounded-2xl bg-indigo-700 text-white font-extrabold">
          이 상황으로 1만원 Q&A 받기
        </Link>
        <p className="text-[11px] text-slate-400 mt-3 text-center">세액은 개인 요건에 따라 달라집니다. 신고 전 전문가 확인이 필요합니다.</p>
      </main>
    </div>
  );
}
