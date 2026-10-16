from fastapi import APIRouter, Query

from backend.services.market_data import fetch_mortgage_rates, fetch_trades

router = APIRouter(prefix="/api/v1/market", tags=["Market Data"])


@router.get("/trades")
async def market_trades(address: str = Query(..., min_length=2)):
    return await fetch_trades(address)


@router.get("/rates")
async def market_rates():
    return await fetch_mortgage_rates()
