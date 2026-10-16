import os

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import Client, create_client

from backend.services.public_data import analyze_address

router = APIRouter(prefix="/api/v1/autodev", tags=["Matkim AutoDev"])

class AddressRequest(BaseModel):
    address: str


@router.post("/analyze")
async def analyze_and_save_property(payload: AddressRequest):
    if not payload.address or not payload.address.strip():
        raise HTTPException(status_code=400, detail="지번 또는 도로명 주소를 입력해 주세요.")

    analysis_data = await analyze_address(payload.address.strip())
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_ANON_KEY", "")

    saved_report = analysis_data
    if supabase_url and supabase_key and supabase_url.startswith("http"):
        try:
            supabase: Client = create_client(supabase_url, supabase_key)
            db_row = {k: v for k, v in analysis_data.items() if k not in ("lon", "lat", "pnu", "parse_note", "data_source")}
            response = supabase.table("matkim_analysis_reports").insert(db_row).execute()
            if response.data:
                saved_report = {**analysis_data, **response.data[0]}
        except Exception as exc:
            print(f"[Supabase Save Warning]: {exc}")

    return {
        "success": True,
        "message": "Matkim AutoDev 분석이 성공적으로 완료되었습니다.",
        "data": saved_report,
    }
