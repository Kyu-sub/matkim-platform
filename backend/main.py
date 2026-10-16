import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env", override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import autodev, market, payments, qna

app = FastAPI(title="Matkim API Server")

_origins = [o.strip() for o in os.getenv("ALLOWED_ORIGINS", "*").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(autodev.router)
app.include_router(payments.router)
app.include_router(qna.router)
app.include_router(market.router)


@app.get("/")
def read_root():
    return {"message": "Matkim 백엔드 API 서버가 정상적으로 작동 중입니다!"}
