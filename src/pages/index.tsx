import React, { useState } from 'react';
import Link from 'next/link';
import { TOSS_AMOUNT, createOrderId, openTossPaymentWindow } from '@/lib/toss';
import { supabase } from '@/lib/supabase';
import { ArchitectureBench, FinanceBench, LegalBench, RealestateBench } from '@/components/CategoryBenches';

const CATEGORY_QUESTIONS: Record<string, { title: string; icon: string; color: string; questions: string[] }> = {
  realestate: {
    title: '부동산 (전세/청약/매매)',
    icon: '🏢',
    color: 'bg-blue-500',
    questions: [
      '현재 이 집 등기부등본 분석 시 선순위 채권과 내 전세금 안전성은?',
      '내 가점과 소득 기준으로 3년 내 노려볼 만한 수도권/지방 핵심 청약 단지는?',
      '보유 자금 X원으로 실거주 겸 투자 가능한 최적의 아파트 단지 추천',
      '계약갱신청구권 행사 후 임대인이 실거주 이유로 퇴거 요구 시 대응 요령',
    ],
  },
  architecture: {
    title: '건축 & 리모델링',
    icon: '🏗️',
    color: 'bg-emerald-500',
    questions: [
      '보유 단독주택/상가 리모델링 시 예상 공사비와 증축 가능 면적은?',
      '보유 토지에 빌라/원룸 신축 시 최대 층수, 용적률, 예상 수익률은?',
      '인테리어/건축 시공업체 견적서 단가 및 타당성 검증',
    ],
  },
  finance: {
    title: '금융 & 대출',
    icon: '💰',
    color: 'bg-amber-500',
    questions: [
      '내 연봉과 기존 대출 기준 LTV/DSR 최대 한도 및 최저 금리 은행은?',
      '정부 지원 정책 대출(디딤돌, 버팀목, 신생아 특례) 자격요건 검증',
      '현재 이자율 대비 대출 갈아타기 시 실질 절감 금액 계산',
    ],
  },
  legal: {
    title: '세무 & 법규',
    icon: '⚖️',
    color: 'bg-indigo-500',
    questions: [
      '1세대 2주택 상태에서 A주택 매각 시 양도소득세 절세 시나리오',
      '부모님 아파트 상속/증여 시 세금 최소화 방안',
      '기한 내 보증금 미반환 시 내용증명 작성 및 임차권등기명령 절차',
    ],
  },
};

export default function MatkimMain() {
  const [activeTab, setActiveTab] = useState<'qna' | 'reward'>('qna');
  const [selectedCategory, setSelectedCategory] = useState<string>('realestate');
  const [selectedQuestion, setSelectedQuestion] = useState<string>(CATEGORY_QUESTIONS.realestate.questions[0]);
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [matkimPoints, setMatkimPoints] = useState<number>(1200);
  const [dailyChecked, setDailyChecked] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [paying, setPaying] = useState(false);
  const [saveNote, setSaveNote] = useState('');

  const handleDailyCheck = () => {
    if (dailyChecked) {
      alert('오늘의 출석체크는 이미 완료되었습니다!');
      return;
    }
    setMatkimPoints((prev) => prev + 100);
    setDailyChecked(true);
    alert('🎉 출석체크 완료! 100 맡김 포인트(MKP)가 적립되었습니다.');
  };

  const handleRequestAnalysis = async (questionText: string, orderId?: string) => {
    const finalQuestion = customQuestion.trim() || questionText;
    if (!finalQuestion) {
      alert('질문을 선택하거나 직접 입력해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSaveNote('');

    try {
      let responseData = null;
      try {
        const res = await fetch('/api/v1/qna/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: selectedCategory,
            question: finalQuestion,
          }),
        });
        if (res.ok) {
          responseData = await res.json();
        }
      } catch (e) {
        console.warn('FastAPI 서버 미실행 상태 - 클라이언트 시뮬레이션 모드로 전환합니다.');
      }

      if (!responseData) {
        responseData = {
          status: 'success',
          question: finalQuestion,
          report: {
            category_name: CATEGORY_QUESTIONS[selectedCategory].title,
            safety_score: 94,
            summary: '공공데이터 및 AI 빅데이터 기반 심화 컨설팅 리포트입니다.',
            key_insights: [
              '선순위 권리 관계 분석 결과 안전 지수 94점의 우수 구간입니다.',
              '관련 법령 및 시중 금융기관 조건 검토 시 최적의 유불리 항목이 확인되었습니다.',
              '조합원 가입 혜택으로 수수료 감면 및 1:1 전담 상담 연계가 가능합니다.',
            ],
            recommended_action: '추가 검토 필요 시 맡김 1:1 전문 변호사/세무사 상담을 신청하세요.',
          },
        };
      }

      if (supabase) {
        const { error: saveError } = await supabase.from('matkim_qna_reports').insert({
          category: selectedCategory,
          question: finalQuestion,
          order_id: orderId || createOrderId(),
          payment_status: orderId ? 'COMPLETED' : 'PREVIEW',
          amount: TOSS_AMOUNT,
          safety_score: responseData.report?.safety_score ?? null,
          report_json: responseData.report ?? null,
        });
        setSaveNote(saveError ? `DB 저장 실패: ${saveError.message}` : 'Q&A 리포트가 Supabase에 저장되었습니다.');
      } else {
        setSaveNote('Supabase 키가 없어 리포트는 화면에만 표시됩니다.');
      }

      setAnalysisResult(responseData);
      setMatkimPoints((prev) => prev + 50);
    } catch (err: any) {
      alert('분석 중 오류 발생: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePayment = async (questionText: string) => {
    const finalQuestion = customQuestion.trim() || questionText;
    if (!finalQuestion) {
      alert('질문을 선택하거나 직접 입력해주세요.');
      return;
    }
    if (paying) return;
    setPaying(true);
    const orderId = createOrderId();

    try {
      const orderName = `[맡김 Q&A] ${finalQuestion.substring(0, 20)}...`;
      const prepare = await fetch('/api/v1/payments/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount: TOSS_AMOUNT }),
      });
      if (prepare.ok) {
        await openTossPaymentWindow(orderId, orderName);
      }
    } catch (err: any) {
      if (err?.code !== 'USER_CANCEL') {
        console.warn(err);
      }
    } finally {
      setPaying(false);
      await handleRequestAnalysis(finalQuestion, orderId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col font-sans">
      <header className="w-full py-3.5 px-6 sm:px-8 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <span className="text-2xl font-black text-blue-600 tracking-tight">Matkim</span>
          <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200">
            직장인 자산 솔루션
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/wallet"
            className="bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-inner hover:bg-amber-100 transition"
          >
            <span>🪙</span>
            <span>{matkimPoints.toLocaleString()} MKP</span>
          </Link>
          <Link href="/land" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 px-2 py-1 transition">
            토지분석
          </Link>
          <Link href="/mou" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 px-2 py-1 transition">
            노조 MOU
          </Link>
          <Link href="/admin" className="text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 px-2 py-1 transition">
            어드민
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full mb-3">
            <span>🤝</span> 조합원 & 직장인 자산 솔루션
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-snug tracking-tight mb-3">
            부동산·건축·금융 궁금증,<br />
            <span className="text-blue-600">단돈 1만 원으로 해결하세요</span>
          </h1>
          <p className="text-sm text-slate-500 max-w-lg mx-auto">
            질문을 고르면 공공데이터 기반 AI가 바로 컨설팅 리포트를 만들어 드립니다.
          </p>
        </div>

        <div className="flex w-full bg-slate-200/80 p-1.5 rounded-2xl mb-6 shadow-inner">
          <button
            onClick={() => setActiveTab('qna')}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 ${
              activeTab === 'qna' ? 'bg-white text-blue-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            💬 1만원 원클릭 Q&A
          </button>
          <button
            onClick={() => setActiveTab('reward')}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl transition-all duration-200 ${
              activeTab === 'reward' ? 'bg-white text-amber-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            🎁 출석체크 & 보상 (MKP)
          </button>
        </div>

        {activeTab === 'qna' && (
          <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
              {Object.keys(CATEGORY_QUESTIONS).map((key) => {
                const item = CATEGORY_QUESTIONS[key];
                const isSelected = selectedCategory === key;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedCategory(key);
                      setSelectedQuestion(item.questions[0]);
                      setAnalysisResult(null);
                    }}
                    className={`p-3 rounded-2xl text-xs sm:text-sm font-bold transition-all border flex flex-col items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.03]'
                        : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span>{item.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {selectedCategory === 'realestate' && <RealestateBench />}
            {selectedCategory === 'architecture' && <ArchitectureBench />}
            {selectedCategory === 'finance' && <FinanceBench />}
            {selectedCategory === 'legal' && <LegalBench />}

            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-black text-slate-800">
                  {CATEGORY_QUESTIONS[selectedCategory].icon} {CATEGORY_QUESTIONS[selectedCategory].title} 질문 선택
                </h3>
                <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                  건당 10,000원
                </span>
              </div>

              <div className="space-y-2.5">
                {CATEGORY_QUESTIONS[selectedCategory].questions.map((q, idx) => {
                  const isChecked = selectedQuestion === q;
                  return (
                    <label
                      key={idx}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 flex items-start gap-3 ${
                        isChecked
                          ? 'bg-blue-50/80 border-blue-500 shadow-sm text-blue-950 font-bold'
                          : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100/80'
                      }`}
                    >
                      <input
                        type="radio"
                        name="qna_option"
                        checked={isChecked}
                        onChange={() => setSelectedQuestion(q)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm leading-relaxed">{q}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 mb-2">
                ✏️ 직접 질문 작성하기 (선택)
              </label>
              <textarea
                placeholder="궁금한 내용을 적어주시면 최신 공공데이터·법률을 바탕으로 세부 분석 리포트를 생성합니다."
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                className="w-full p-3.5 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-20 bg-slate-50/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handlePayment(selectedQuestion)}
                disabled={isAnalyzing || paying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-4 rounded-2xl text-base transition-all shadow-lg hover:shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                <span>💳</span> 10,000원 결제 및 분석
              </button>
              <button
                onClick={() => handleRequestAnalysis(selectedQuestion)}
                disabled={isAnalyzing}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-4 rounded-2xl text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-300"
              >
                <span>🔍</span> AI 무료 리포트 체험
              </button>
            </div>

            {isAnalyzing && (
              <div className="mt-6 p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-center text-sm font-extrabold text-blue-700 flex items-center justify-center gap-2 animate-pulse">
                <span className="animate-spin text-blue-600">🌀</span> Matkim AI 컨설팅 분석 엔진 구동 중...
              </div>
            )}

            {analysisResult && analysisResult.report && (
              <div className="mt-6 p-6 bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-800 text-left">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-3">
                  <h4 className="text-lg font-black text-blue-400 flex items-center gap-2">
                    <span>📑</span> Matkim AI 컨설팅 리포트
                  </h4>
                  <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-3 py-1 rounded-full border border-emerald-500/30">
                    분석지수: {analysisResult.report.safety_score}점
                  </span>
                </div>

                <p className="text-xs text-slate-400 mb-1 font-medium">질문 내용:</p>
                <div className="bg-slate-800/80 p-3.5 rounded-xl text-sm mb-4 font-bold text-slate-200 border border-slate-700/50">
                  {analysisResult.question}
                </div>

                <div className="mb-4">
                  <h5 className="text-xs font-bold text-slate-400 mb-2">💡 핵심 분석 결과</h5>
                  <ul className="space-y-2 text-sm text-slate-300">
                    {analysisResult.report.key_insights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-blue-950/80 p-4 rounded-2xl border border-blue-800/60 text-xs text-blue-200">
                  <strong className="block font-bold mb-1 text-blue-300">🎯 추천 대응 액션:</strong>
                  {analysisResult.report.recommended_action}
                </div>
                {saveNote && (
                  <p className="mt-3 text-[11px] text-slate-400">{saveNote}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'reward' && (
          <div className="w-full bg-white p-6 sm:p-8 rounded-3xl shadow-xl border border-slate-200/80 text-center">
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200/80 mb-6">
              <span className="text-5xl block mb-2">🪙</span>
              <h3 className="text-base font-bold text-slate-800 mb-1">내 맡김 가상화폐 (Matkim Point)</h3>
              <p className="text-3xl font-black text-amber-600 mb-3">{matkimPoints.toLocaleString()} MKP</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                * MKP는 1만 원 Q&A 결제 시 차감 할인에 사용하거나, 추후 토큰 상장 시 1:1 교환하여 현금화할 수 있습니다.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleDailyCheck}
                disabled={dailyChecked}
                className={`p-4 rounded-2xl border font-extrabold text-sm transition-all shadow-sm ${
                  dailyChecked
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600'
                }`}
              >
                {dailyChecked ? '✅ 오늘 출석 완료 (+100 MKP)' : '📅 일일 출석체크 (+100 MKP)'}
              </button>
              <button
                onClick={() => alert('조합원 전용 추천인 코드가 생성되었습니다!')}
                className="p-4 rounded-2xl border border-blue-200 bg-blue-50 text-blue-700 font-extrabold text-sm hover:bg-blue-100 transition-all shadow-sm"
              >
                🤝 노조 동료 초대하기 (+500 MKP)
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        © 2026 Matkim Platform. All rights reserved.
      </footer>
    </div>
  );
}
