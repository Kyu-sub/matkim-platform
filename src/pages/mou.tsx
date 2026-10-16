import React, { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function UnionMouPage() {
  const [unionName, setUnionName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [memberCount, setMemberCount] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitNote, setSubmitNote] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmitMou = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unionName || !contactName || !phone) {
      alert('노동조합명, 담당자 성함, 연락처를 모두 입력해 주세요.');
      return;
    }

    setSaving(true);
    setSubmitNote('');
    if (supabase) {
      const { error } = await supabase.from('matkim_mou_proposals').insert({
        union_name: unionName,
        contact_name: contactName,
        phone,
        member_count: memberCount || null,
        status: 'PENDING',
      });
      if (error) {
        setSubmitNote(`DB 저장 실패: ${error.message}`);
        setSaving(false);
        return;
      }
      setSubmitNote('Supabase에 제휴 신청이 저장되었습니다.');
    } else {
      setSubmitNote('Supabase 키가 없어 화면에만 접수 처리했습니다.');
    }

    alert(
      `🎉 [MOU 제휴 제안 접수 완료]\n\n· 노동조합: ${unionName}\n· 담당자: ${contactName}님\n\n담당 팀장이 24시간 내 연락드려 조합원 복지 혜택 세부안 및 MOU 협약서를 전달해 드리겠습니다.`
    );
    setSubmitted(true);
    setUnionName('');
    setContactName('');
    setPhone('');
    setMemberCount('');
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="w-full py-4 px-6 sm:px-8 bg-slate-950/80 border-b border-slate-800 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl font-black text-blue-500 tracking-tight">Matkim</span>
          <span className="text-xs font-bold bg-blue-900/60 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-700/50">
            노조 자산관리 파트너십
          </span>
        </div>
        <Link
          href="/"
          className="text-xs sm:text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl border border-slate-700 transition"
        >
          ← 메인 서비스
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <span className="inline-block bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-black px-3.5 py-1.5 rounded-full mb-4">
            🤝 노동조합 & 직장인 전용 자산 보호 복지
          </span>
          <h1 className="text-3xl sm:text-5xl font-black leading-tight tracking-tight mb-4 text-slate-100">
            조합원의 부동산·금융·자산,<br />
            <span className="text-blue-500">맡김 MOU로 안전하게 지켜주세요</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            전세사기 예방, DSR/LTV 최적 대출, 양도세 절세, 토지/리모델링 가설계까지
            <br className="hidden sm:block" />
            조합원이 겪는 자산 문제를 단돈 1만 원에 원스톱으로 해결합니다.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-lg">
            <span className="text-4xl block mb-3">🛡️</span>
            <h3 className="text-lg font-black text-slate-100 mb-2">1. 조합원 자산 안전망</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              전세 계약 전 등기부등본 권리 분석 및 보증금 안전 진단 무료 제공으로 조합원의 피해를 사전 예방합니다.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-lg">
            <span className="text-4xl block mb-3">🎁</span>
            <h3 className="text-lg font-black text-slate-100 mb-2">2. 조합원 전용 할인 & MKP</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1만 원 Q&A 분석 할인 쿠폰 지급 및 일일 출석체크로 가상화폐 포인트(MKP)를 적립해 드립니다.
            </p>
          </div>

          <div className="bg-slate-800/80 p-6 rounded-3xl border border-slate-700/80 shadow-lg">
            <span className="text-4xl block mb-3">📊</span>
            <h3 className="text-lg font-black text-slate-100 mb-2">3. 노조 전용 어드민 제공</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              노조위원장 및 간부진에게 조합원 자산 컨설팅 현황 및 포인트를 한눈에 볼 수 있는 관리자 화면을 무료 지원합니다.
            </p>
          </div>
        </div>

        <div className="bg-slate-950 p-6 sm:p-10 rounded-3xl border border-blue-900/50 shadow-2xl max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-black text-center text-slate-100 mb-2">
            📝 노동조합 MOU 협약 제안 신청
          </h2>
          <p className="text-xs text-center text-slate-400 mb-8">
            양식 제출 시 조합원 맞춤형 제안서와 협약서(안)을 전달해 드립니다.
          </p>

          {(submitted || submitNote) && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm text-center font-semibold">
              {submitNote || '제휴 제안이 접수되었습니다. 24시간 내 담당자가 연락드립니다.'}
            </div>
          )}

          <form onSubmit={handleSubmitMou} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">노동조합명 *</label>
              <input
                type="text"
                placeholder="예: 전국금속노동조합 OO지부"
                value={unionName}
                onChange={(e) => setUnionName(e.target.value)}
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">담당자 성함/직책 *</label>
                <input
                  type="text"
                  placeholder="예: 홍길동 위원장 / 사무국장"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">연락처 *</label>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">예상 조합원 수 (선택)</label>
              <input
                type="text"
                placeholder="예: 약 1,500명"
                value={memberCount}
                onChange={(e) => setMemberCount(e.target.value)}
                className="w-full p-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-4 rounded-2xl text-base transition shadow-lg mt-4 cursor-pointer disabled:opacity-50"
            >
              {saving ? '저장 중...' : '🤝 노조 MOU 제휴 신청하기'}
            </button>
          </form>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-slate-500 border-t border-slate-800 mt-12">
        © 2026 Matkim Platform. All rights reserved.
      </footer>
    </div>
  );
}
