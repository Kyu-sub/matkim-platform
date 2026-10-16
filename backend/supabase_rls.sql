-- 연습용: 저장 잠금(RLS)을 끕니다.
alter table public.matkim_b2b_leads disable row level security;
alter table public.matkim_analysis_reports disable row level security;

grant insert, select, update, delete on public.matkim_b2b_leads to anon, authenticated;
grant insert, select, update, delete on public.matkim_analysis_reports to anon, authenticated;
