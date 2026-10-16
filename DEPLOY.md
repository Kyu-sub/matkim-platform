# 맡김 운영 배포 체크리스트

로컬(`localhost:3000`, `localhost:8000`)이 아니라 인터넷에서 열려면 **프론트(Vercel) + API(Render) + DB(Supabase)** 세 곳이 필요합니다. `matkim.kr` 도메인은 따로 사서 Vercel에 연결해야 합니다.

## 1. 배포 전에 할 일

- [ ] Supabase SQL Editor에서 `backend/supabase_schema.sql` 을 Run 했는지
- [ ] Table Editor에 `matkim_qna_reports`, `matkim_mou_proposals` 가 보이는지
- [ ] 토스 키는 **위젯 v2** (`test_gck_` / `test_gsk_`). `test_ck_` v1 키는 쓰지 않습니다
- [ ] GitHub에 이 저장소를 올렸는지 (`.env` 는 올리지 않음)

## 2. FastAPI → Render

1. [Render](https://render.com) 에서 New → Web Service → GitHub 저장소 연결
2. Root Directory는 저장소 루트
3. Build: `pip install -r backend/requirements.txt`
4. Start: `python -m uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Environment에 넣을 값:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `TOSS_SECRET_KEY`
   - `VWORLD_API_KEY`
   - `ALLOWED_ORIGINS` = `https://your-app.vercel.app` (커스텀 도메인이 있으면 `,https://matkim.kr` 추가)
6. 배포 후 브라우저로 `https://xxxx.onrender.com/` 이 JSON 메시지를 주면 성공입니다. 이 URL을 복사합니다.

무료 플랜은 잠자기 때문에 첫 요청이 느릴 수 있습니다. 결제 `prepare` 목록은 서버 메모리라, 재시작되면 사라집니다.

## 3. Next.js → Vercel

1. [Vercel](https://vercel.com) → Import GitHub 저장소
2. Framework: Next.js
3. Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_TOSS_CLIENT_KEY` (`test_gck_` 또는 라이브 `live_gck_`)
   - `BACKEND_URL` = Render에서 받은 FastAPI URL (`https://xxxx.onrender.com`, 끝 슬래시 없이)
4. Deploy
5. 토스 개발자센터에 **결제 성공/실패 리다이렉트 도메인**으로 Vercel 주소(및 `matkim.kr`)를 등록합니다.

프론트는 `/api/v1/...` 으로 호출하고, Next가 `BACKEND_URL`로 넘깁니다.

## 4. 주소 안내 (배포 후)

| 화면 | 경로 |
| --- | --- |
| 조합원 Q&A | `https://your-app.vercel.app/` |
| 토지·입지 | `/land` |
| 대출 시뮬 | `/finance` |
| 건축 견적 | `/remodel` |
| 세무 가이드 | `/tax` |
| MOU | `/mou` |
| 월렛 | `/wallet` |
| 어드민 | `/admin` |

`https://matkim.kr` 을 쓰려면 도메인을 산 뒤 Vercel → Domains 에 연결하면 됩니다.

## 5. 라이브 결제

테스트 키로 먼저 배포하세요. 실제 카드 결제는 토스 **라이브 키**와 사업자 심사 후에만 바꿉니다.

## 6. 아직 로컬에서 확인

```
npm run dev
python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

`BACKEND_URL` 을 비워 두면 기본값 `http://127.0.0.1:8000` 입니다.
