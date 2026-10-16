import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [b2bLeads, setB2bLeads] = useState<any[]>([]);
  const [qnaReports, setQnaReports] = useState<any[]>([]);
  const [mouRows, setMouRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState('');

  const mockStats = {
    totalMembers: 1420,
    mouUnions: 3,
    totalQnaCount: 384,
    totalRevenue: 3840000,
    issuedMkp: 452000,
  };

  useEffect(() => {
    async function fetchAdminData() {
      if (supabase) {
        try {
          const [leadsRes, qnaRes, mouRes] = await Promise.all([
            supabase.from('matkim_b2b_leads').select('*').order('created_at', { ascending: false }),
            supabase.from('matkim_qna_reports').select('*').order('created_at', { ascending: false }).limit(20),
            supabase.from('matkim_mou_proposals').select('*').order('created_at', { ascending: false }).limit(20),
          ]);
          const errors = [leadsRes.error, qnaRes.error, mouRes.error].filter(Boolean).map((e) => e!.message);
          if (errors.length) setError(errors.join(' / '));
          if (leadsRes.data) setB2bLeads(leadsRes.data);
          if (qnaRes.data) setQnaReports(qnaRes.data);
          if (mouRes.data) setMouRows(mouRes.data);
        } catch (err) {
          console.warn('Supabase Fetch Warning:', err);
        }
      }
      setLoading(false);
    }
    fetchAdminData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b pb-4 border-slate-300">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Matkim Admin</h1>
              <span className="bg-blue-600 text-white text-xs font-bold px-2.5 py-0.5 rounded-full">
                노조 자산관리 어드민
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              MOU 체결 노동조합 조합원 자산 컨설팅 및 Q&A/리워드 통합 관리자 화면
            </p>
          </div>
          <Link
            href="/"
            className="text-xs sm:text-sm font-bold bg-white text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl border border-slate-300 shadow-sm transition"
          >
            ← 메인 서비스로 이동
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block font-semibold mb-1">MOU 체결 노조</span>
            <strong className="text-xl sm:text-2xl text-blue-600 font-extrabold">{mockStats.mouUnions}개 곳</strong>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block font-semibold mb-1">가입 조합원 수</span>
            <strong className="text-xl sm:text-2xl text-slate-900 font-extrabold">{mockStats.totalMembers.toLocaleString()}명</strong>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block font-semibold mb-1">누적 Q&A 컨설팅</span>
            <strong className="text-xl sm:text-2xl text-emerald-600 font-extrabold">{mockStats.totalQnaCount}건</strong>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 block font-semibold mb-1">총 결제 매출액</span>
            <strong className="text-xl sm:text-2xl text-indigo-600 font-extrabold">{(mockStats.totalRevenue / 10000).toLocaleString()}만원</strong>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm col-span-2 sm:col-span-1">
            <span className="text-xs text-slate-500 block font-semibold mb-1">지급된 맡김 포인트</span>
            <strong className="text-xl sm:text-2xl text-amber-600 font-extrabold">{mockStats.issuedMkp.toLocaleString()} MKP</strong>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center justify-between">
            <span>📋 Supabase DB 실시간 접수 데이터 (`matkim_b2b_leads`)</span>
            <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-bold">
              실시간 데이터베이스 연동 중
            </span>
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">데이터 불러오는 중...</div>
          ) : b2bLeads.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm border-2 border-dashed rounded-xl">
              등록된 B2B 매집 물건 또는 Q&A 접수 내역이 없습니다.<br />
              메인 화면에서 물건 등록 테스트를 진행해보세요!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold text-xs">
                    <th className="p-3">ID</th>
                    <th className="p-3">주소 / 질문건</th>
                    <th className="p-3">희망 매각가 (억원)</th>
                    <th className="p-3">명도 유보금 (%)</th>
                    <th className="p-3">특이사항</th>
                    <th className="p-3">등록일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {b2bLeads.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-xs font-mono text-slate-400">{item.id}</td>
                      <td className="p-3 font-bold text-slate-800">{item.address}</td>
                      <td className="p-3 font-semibold text-blue-600">{item.desired_price_hundred_million}억원</td>
                      <td className="p-3">{item.earnest_guarantee_ratio}%</td>
                      <td className="p-3 text-xs text-slate-600 max-w-xs truncate">{item.special_notes || '-'}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">Q&A 리포트 (`matkim_qna_reports`)</h2>
          {qnaReports.length === 0 ? (
            <p className="text-sm text-slate-500">저장된 Q&A가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs">
                    <th className="p-3">카테고리</th>
                    <th className="p-3">질문</th>
                    <th className="p-3">상태</th>
                    <th className="p-3">점수</th>
                    <th className="p-3">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {qnaReports.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="p-3 font-bold">{row.category}</td>
                      <td className="p-3 max-w-xs truncate">{row.question}</td>
                      <td className="p-3">{row.payment_status}</td>
                      <td className="p-3">{row.safety_score ?? '-'}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-slate-200 p-6 mt-6">
          <h2 className="text-lg font-extrabold text-slate-900 mb-4">MOU 제휴 신청 (`matkim_mou_proposals`)</h2>
          {mouRows.length === 0 ? (
            <p className="text-sm text-slate-500">저장된 제휴 신청이 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-50 text-xs">
                    <th className="p-3">노조명</th>
                    <th className="p-3">담당자</th>
                    <th className="p-3">연락처</th>
                    <th className="p-3">상태</th>
                    <th className="p-3">시각</th>
                  </tr>
                </thead>
                <tbody>
                  {mouRows.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100">
                      <td className="p-3 font-bold">{row.union_name}</td>
                      <td className="p-3">{row.contact_name}</td>
                      <td className="p-3">{row.phone}</td>
                      <td className="p-3">{row.status}</td>
                      <td className="p-3 text-xs text-slate-400">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
