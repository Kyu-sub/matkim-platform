-- Matkim Phase 10: Supabase PostgreSQL 통합 스키마
-- 사용법: Supabase Dashboard → SQL Editor → 붙여넣기 → Run
-- 이미 있는 테이블은 그대로 두고, 없는 테이블만 만듭니다.

-- 1. 사용자 및 노조원 프로필
CREATE TABLE IF NOT EXISTS public.matkim_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    user_name VARCHAR(100) NOT NULL,
    union_name VARCHAR(150),
    is_union_verified BOOLEAN DEFAULT FALSE,
    mkp_points INTEGER DEFAULT 1000,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 1만원 Q&A 결제 및 분석 리포트
CREATE TABLE IF NOT EXISTS public.matkim_qna_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.matkim_users(id) ON DELETE SET NULL,
    category VARCHAR(50) NOT NULL,
    question TEXT NOT NULL,
    order_id VARCHAR(100) NOT NULL,
    payment_status VARCHAR(30) DEFAULT 'COMPLETED',
    amount INTEGER DEFAULT 10000,
    safety_score INTEGER,
    report_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. B2B 매집 물건 (이미 있으면 건너뜀)
CREATE TABLE IF NOT EXISTS public.matkim_b2b_leads (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    desired_price_hundred_million NUMERIC(10, 2),
    earnest_guarantee_ratio NUMERIC(5, 2) DEFAULT 10.0,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 출석체크 및 리워드 히스토리
CREATE TABLE IF NOT EXISTS public.matkim_point_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.matkim_users(id) ON DELETE CASCADE,
    point_change INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 노동조합 MOU 제휴 신청
CREATE TABLE IF NOT EXISTS public.matkim_mou_proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    union_name VARCHAR(150) NOT NULL,
    contact_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    member_count VARCHAR(50),
    status VARCHAR(30) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 토지/가설계 분석 리포트 (기존 FastAPI autodev 저장용)
CREATE TABLE IF NOT EXISTS public.matkim_analysis_reports (
    id BIGSERIAL PRIMARY KEY,
    address VARCHAR(255) NOT NULL,
    land_area_m2 NUMERIC(12, 1),
    land_area_pyeong NUMERIC(12, 1),
    zoning_district VARCHAR(100),
    max_building_coverage_ratio NUMERIC(6, 2),
    max_floor_area_ratio NUMERIC(8, 2),
    recommended_max_floors INTEGER,
    total_building_area_m2 NUMERIC(12, 1),
    estimated_construction_cost BIGINT,
    estimated_roi NUMERIC(6, 2),
    estimated_months INTEGER,
    vacation_guarantee_ratio NUMERIC(6, 2),
    status VARCHAR(30) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_qna_reports_user ON public.matkim_qna_reports (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qna_reports_category ON public.matkim_qna_reports (category);
CREATE INDEX IF NOT EXISTS idx_point_logs_user ON public.matkim_point_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mou_status ON public.matkim_mou_proposals (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_b2b_leads_created ON public.matkim_b2b_leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created ON public.matkim_analysis_reports (created_at DESC);

ALTER TABLE public.matkim_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matkim_qna_reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matkim_b2b_leads DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matkim_point_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matkim_mou_proposals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matkim_analysis_reports DISABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_qna_reports TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_b2b_leads TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_point_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_mou_proposals TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matkim_analysis_reports TO anon, authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
