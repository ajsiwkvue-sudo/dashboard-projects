-- =====================================================================
-- ax_port_schema.sql  —  콘솔 기능 이식용 Supabase(Postgres) 스키마
-- 실행: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- 주의: RLS 정책은 내부용 "전체 허용"으로 두었습니다. 운영 시 병원 정책에 맞게 좁히세요.
-- =====================================================================

-- ── 1) 설정(초점/잠금/기준일) : 기존 ax_sched_cfg 확장 or 신규 ax_cfg ────────
create table if not exists ax_cfg (
  id         text primary key default 'main',
  focus_text text,                       -- 이번 분기 초점 카드
  locked     boolean default false,      -- 편집 잠금
  base_date  date,                       -- 진척 기준일(계획대비/지연 판정)
  updated_at timestamptz default now()
);
insert into ax_cfg(id) values('main') on conflict do nothing;

-- ── 2) KPI 트래커 (목표/실적 · 상한 · All-or-None · 과제매핑) ───────────────
create table if not exists ax_kpi (
  id         uuid primary key default gen_random_uuid(),
  grp        text,                       -- 영역(전략/거버넌스/인프라 …)
  name       text not null,
  target_num numeric not null default 1, -- 목표치(=상한)
  unit       text default '',
  current    numeric not null default 0, -- 0 ≤ current ≤ target_num (앱에서 클램프)
  binary     boolean default false,      -- true면 All-or-None(체크박스)
  task_id    text,                       -- ax_schedules.id 매핑 (예: '1-1')
  goal       int,
  sort       int default 0
);

-- ── 3) 리스크 보드 (H/M/L) ────────────────────────────────────────────────
create table if not exists ax_risks (
  id       uuid primary key default gen_random_uuid(),
  sev      text not null default 'M',    -- 'H' | 'M' | 'L'
  text     text default '',
  task_id  text,                          -- 선택: 특정 과제 연계
  sort     int default 0
);

-- ── 4) 기대산출물 (완료체크 · 파일 · 파일서버 링크) ─────────────────────────
create table if not exists ax_outputs (
  id         uuid primary key default gen_random_uuid(),
  task_id    text not null,               -- ax_schedules.id
  idx        int default 0,
  text       text default '',
  done       boolean default false,
  link       text default '',             -- 망분리 파일서버 경로/URL
  file_path  text default '',             -- Supabase Storage 경로(업로드 시)
  updated_at timestamptz default now()
);

-- ── 5) 변경 이력(감사 로그) ───────────────────────────────────────────────
create table if not exists ax_audit (
  id      bigint generated always as identity primary key,
  ts      timestamptz default now(),
  usr     text,                            -- 작성자(presence 이름)
  action  text,                            -- 예: '상태 변경', 'KPI 실적 입력'
  target  text                             -- 대상(과제/지표명 등)
);
create index if not exists ax_audit_ts on ax_audit(ts desc);

-- ── 6) [그룹 C · 선택] 세부추진과제 계층 ──────────────────────────────────
create table if not exists ax_subtasks (
  id       uuid primary key default gen_random_uuid(),
  task_id  text not null,                  -- ax_schedules.id
  phase    int default 0,                  -- 단계 index
  ord      int default 0,                  -- 정렬
  num      text default '',                -- 표기 번호(1.1 …)
  name     text default '',
  start    date, "end" date,
  progress numeric default 0,              -- 0~100
  outp     text default '',                -- 산출물 표기
  note     text default '',
  dep      text default ''                 -- 선행: 'phase:ord' 형태 (지연위험 계산)
);
create index if not exists ax_subtasks_task on ax_subtasks(task_id);

-- ── 7) 상태 수동 오버라이드 : ax_schedules 에 칼럼 추가 ────────────────────
alter table ax_schedules add column if not exists status_override text; -- 예정/진행중/지연/완료/보류/null

-- ── 8) 실시간(Realtime) 구독 대상 등록 ────────────────────────────────────
alter publication supabase_realtime add table ax_kpi, ax_risks, ax_outputs, ax_audit, ax_cfg, ax_subtasks;

-- ── 9) RLS (내부용 전체 허용 — 운영 시 좁힐 것) ───────────────────────────
do $$ declare t text;
begin
  foreach t in array array['ax_cfg','ax_kpi','ax_risks','ax_outputs','ax_audit','ax_subtasks']
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists p_all on %I;', t);
    execute format('create policy p_all on %I for all using (true) with check (true);', t);
  end loop;
end $$;
