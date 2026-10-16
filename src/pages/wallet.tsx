import React, { useState } from 'react';
import Link from 'next/link';

type LedgerItem = {
  title: string;
  date: string;
  amount: number;
};

const INITIAL_LEDGER: LedgerItem[] = [
  { title: '📅 일일 자산 출석체크 보상', date: '2026. 10. 16.', amount: 100 },
  { title: '🔍 AI Q&A 분석 참여 보상', date: '2026. 10. 16.', amount: 50 },
  { title: '🎉 가입 축하 기프트', date: '2026. 10. 15.', amount: 1050 },
];

export default function WalletPage() {
  const [mkpBalance, setMkpBalance] = useState<number>(1200);
  const [unionName] = useState<string>('전국금속노동조합 OO지부');
  const [isVerified] = useState<boolean>(true);
  const [ledger, setLedger] = useState<LedgerItem[]>(INITIAL_LEDGER);

  const handleExchangeCoupon = (amount: number) => {
    if (mkpBalance < amount) {
      alert('맡김 포인트(MKP)가 부족합니다.');
      return;
    }
    setMkpBalance((prev) => prev - amount);
    setLedger((prev) => [
      {
        title: `🎟️ ${amount.toLocaleString()}원 Q&A 결제 할인 쿠폰 교환`,
        date: '2026. 10. 16.',
        amount: -amount,
      },
      ...prev,
    ]);
    alert(
      `🎉 ${amount.toLocaleString()} MKP가 차감되었으며, 1만 원 Q&A 결제 할인 쿠폰(${amount.toLocaleString()}원 상당)이 발급되었습니다!`
    );
  };

  const handleSwapToken = () => {
    alert(
      '🚀 현재 1단계 가상화폐 포인트 적립 단계입니다. 2단계 토큰 메인넷 교환 및 상장 시 등록된 계좌/지갑으로 현금화가 진행됩니다.'
    );
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b pb-4 border-slate-300">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span>🪙</span> 맡김 월렛 (Matkim Wallet)
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              조합원 전용 리워드 포인트(MKP) 및 가상화폐 자산 관리
            </p>
          </div>
          <Link
            href="/"
            className="text-xs font-bold bg-white text-slate-700 hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-300 shadow-sm transition"
          >
            ← 메인 서비스
          </Link>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-800 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">
              🛡️
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold block">소속 노동조합</span>
              <strong className="text-sm text-slate-900 font-extrabold">{unionName}</strong>
            </div>
          </div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
            {isVerified ? 'MOU 조합원 인증완료' : '미인증'}
          </span>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-7 rounded-3xl shadow-xl mb-6">
          <span className="text-xs text-amber-400 font-bold block mb-1">총 보유 맡김 가상화폐</span>
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-4xl font-black text-amber-400 tracking-tight">
              {mkpBalance.toLocaleString()} <span className="text-lg font-bold text-slate-300">MKP</span>
            </h2>
            <span className="text-xs text-slate-400">약 {mkpBalance.toLocaleString()}원 상당</span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-700/80">
            <button
              onClick={() => handleExchangeCoupon(1000)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 rounded-xl text-xs transition shadow cursor-pointer"
            >
              🎟️ 1,000원 결제 할인 쿠폰 교환
            </button>
            <button
              onClick={handleSwapToken}
              className="bg-slate-700 hover:bg-slate-600 text-white font-extrabold py-3 rounded-xl text-xs transition shadow cursor-pointer"
            >
              🔄 토큰 현금화 / 스왑 신청
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex justify-between items-center">
            <span>📜 MKP 적립/사용 내역</span>
            <span className="text-xs text-slate-400 font-normal">최근 30일</span>
          </h3>

          <div className="space-y-3 text-xs">
            {ledger.map((item, idx) => (
              <div
                key={`${item.title}-${idx}`}
                className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div>
                  <strong className="block text-slate-800 text-sm mb-0.5">{item.title}</strong>
                  <span className="text-slate-400">{item.date}</span>
                </div>
                <span
                  className={`font-black text-sm ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {item.amount >= 0 ? '+' : ''}
                  {item.amount.toLocaleString()} MKP
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
