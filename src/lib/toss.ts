import { loadTossPayments, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

export const TOSS_AMOUNT = 10000;
export const TOSS_ORDER_NAME = 'Matkim AI Q&A 리포트';

export function getTossClientKey() {
  return process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
}

export function createOrderId() {
  return `matkim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function openTossPaymentWindow(orderId: string, orderName = TOSS_ORDER_NAME) {
  const clientKey = getTossClientKey();
  if (!clientKey) {
    throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다. 토스페이먼츠 개발자센터의 테스트 클라이언트 키를 .env 에 넣어 주세요.');
  }

  const tossPayments = await loadTossPayments(clientKey);
  const widgets = tossPayments.widgets({ customerKey: ANONYMOUS });
  await widgets.setAmount({ currency: 'KRW', value: TOSS_AMOUNT });

  const origin = window.location.origin;
  const paymentWindow = await widgets.renderPaymentWindow({
    orderName,
  });

  paymentWindow.on('paymentRequest', async () => {
    await widgets.requestPayment({
      orderId,
      orderName,
      successUrl: `${origin}/payment/success`,
      failUrl: `${origin}/payment/fail`,
    });
  });

  return paymentWindow;
}
