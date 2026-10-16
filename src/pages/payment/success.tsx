import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import AppHeader from '@/components/AppHeader';
import { TOSS_AMOUNT } from '@/lib/toss';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [message, setMessage] = useState('결제 승인 중입니다...');

  useEffect(() => {
    if (!router.isReady) return;

    const paymentKey = String(router.query.paymentKey || '');
    const orderId = String(router.query.orderId || '');
    const amount = Number(router.query.amount || 0);

    if (!paymentKey || !orderId) {
      setStatus('error');
      setMessage('결제 정보가 올바르지 않습니다.');
      return;
    }

    if (amount !== TOSS_AMOUNT) {
      setStatus('error');
      setMessage('결제 금액이 변조되었을 수 있어 승인을 중단했습니다.');
      return;
    }

    fetch('/api/v1/payments/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || body.success === false) {
          throw new Error(body.detail || body.message || '결제 승인에 실패했습니다.');
        }
        setStatus('ok');
        setMessage('1만원 AI Q&A 결제가 완료되었습니다.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.message || '결제 승인 중 오류가 발생했습니다.');
      });
  }, [router.isReady, router.query]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-xl p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
            {status === 'ok' ? '결제 완료' : status === 'error' ? '결제 확인 실패' : '결제 확인 중'}
          </h1>
          <p className="text-slate-600 mb-6">{message}</p>
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
