import { useRouter } from 'next/router';
import AppHeader from '@/components/AppHeader';

export default function PaymentFailPage() {
  const router = useRouter();
  const code = String(router.query.code || '');
  const message = String(router.query.message || '결제가 취소되었거나 실패했습니다.');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">결제 실패</h1>
          <p className="text-slate-600 mb-2">{message}</p>
          {code ? <p className="text-xs text-slate-400 mb-6">코드: {code}</p> : <div className="mb-6" />}
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl"
          >
            메인으로 돌아가기
          </button>
        </div>
      </main>
    </div>
  );
}
