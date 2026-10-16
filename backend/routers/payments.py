import base64
import os
from typing import Dict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/payments", tags=["Toss Payments"])

PENDING_ORDERS: Dict[str, int] = {}
TOSS_CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm"


class PrepareRequest(BaseModel):
    orderId: str
    amount: int = 10000


class ConfirmRequest(BaseModel):
    paymentKey: str
    orderId: str
    amount: int


@router.post("/prepare")
async def prepare_payment(payload: PrepareRequest):
    if payload.amount != 10000:
        raise HTTPException(status_code=400, detail="AI Q&A 결제 금액은 10,000원만 허용됩니다.")
    PENDING_ORDERS[payload.orderId] = payload.amount
    return {"success": True, "orderId": payload.orderId, "amount": payload.amount}


@router.post("/confirm")
async def confirm_payment(payload: ConfirmRequest):
    expected = PENDING_ORDERS.get(payload.orderId, 10000)
    if payload.amount != expected:
        raise HTTPException(status_code=400, detail="주문 금액이 일치하지 않습니다.")

    secret = os.getenv("TOSS_SECRET_KEY", "").strip()
    if not secret:
        raise HTTPException(
            status_code=500,
            detail="TOSS_SECRET_KEY 가 없습니다. 토스페이먼츠 개발자센터의 시크릿 키를 서버 환경변수에 넣어 주세요.",
        )

    token = base64.b64encode(f"{secret}:".encode("utf-8")).decode("utf-8")
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.post(
            TOSS_CONFIRM_URL,
            headers={
                "Authorization": f"Basic {token}",
                "Content-Type": "application/json",
            },
            json={
                "paymentKey": payload.paymentKey,
                "orderId": payload.orderId,
                "amount": payload.amount,
            },
        )

    body = res.json() if res.content else {}
    if res.status_code >= 400:
        raise HTTPException(status_code=res.status_code, detail=body.get("message") or "토스 결제 승인 실패")

    PENDING_ORDERS.pop(payload.orderId, None)
    return {"success": True, "data": body}
