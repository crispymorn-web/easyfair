-- ============================================================
-- easyfair Database Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── user_profiles ───────────────────────────────────────────
create table if not exists user_profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text not null,
  full_name   text,
  company_name text,
  plan        text not null default 'free' check (plan in ('free','pro','business')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 신규 사용자 가입 시 자동 프로필 생성
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── venues ──────────────────────────────────────────────────
create table if not exists venues (
  id                        text primary key,  -- e.g. "impact_bkk"
  name                      text not null,
  name_ko                   text not null,
  country                   text not null,
  country_code              char(2) not null,
  city                      text not null,
  website                   text,
  raw_space_usd_sqm_min     numeric not null default 0,
  raw_space_usd_sqm_max     numeric not null default 0,
  shell_scheme_usd_sqm_min  numeric not null default 0,
  shell_scheme_usd_sqm_max  numeric not null default 0,
  max_height_m              numeric not null default 4.0,
  union_labor_required      boolean not null default false,
  eac_required              boolean not null default false,
  vat_rate                  numeric not null default 0,
  local_cost_factor         numeric not null default 1.0,
  notes                     text not null default '',
  active                    boolean not null default true,
  created_at                timestamptz not null default now()
);

-- 초기 전시장 데이터
insert into venues (id, name, name_ko, country, country_code, city,
  raw_space_usd_sqm_min, raw_space_usd_sqm_max,
  max_height_m, union_labor_required, eac_required, vat_rate, local_cost_factor, notes)
values
  ('lacc',      'Los Angeles Convention Center', 'LA 컨벤션센터',   'United States', 'US', 'Los Angeles', 400, 500, 6.1, true,  true,  0,    1.00, 'Union labor 의무. EAC 사전 신청 필수.'),
  ('impact_bkk','IMPACT Muang Thong Thani',      'IMPACT 방콕',      'Thailand',      'TH', 'Bangkok',      90,  100, 4.0, false, false, 0.07, 0.38, 'VAT 7% 현지 서비스 적용.'),
  ('kintex',    'KINTEX',                         'KINTEX 킨텍스',   'South Korea',   'KR', 'Goyang',       120, 150, 5.0, false, false, 0.10, 0.52, '부스 높이 5m 이하. 반입 D-2.'),
  ('coex',      'COEX',                           'COEX 코엑스',     'South Korea',   'KR', 'Seoul',        130, 160, 4.5, false, false, 0.10, 0.55, '도심 위치로 물류비 추가.'),
  ('tokyo_bs',  'Tokyo Big Sight',                '도쿄 빅사이트',   'Japan',         'JP', 'Tokyo',        200, 250, 6.0, false, true,  0.10, 0.75, 'EAC 신청 필수. 일본 소비세 10%.'),
  ('messe_ffm', 'Messe Frankfurt',                '메세 프랑크푸르트','Germany',       'DE', 'Frankfurt',    280, 350, 7.0, false, true,  0.19, 0.82, 'EU VAT 19%. 독일 시공사 의무 사용 규정 확인.'),
  ('sg_expo',   'Singapore Expo',                 '싱가포르 엑스포', 'Singapore',     'SG', 'Singapore',    160, 200, 5.0, false, false, 0.09, 0.65, 'GST 9%.'),
  ('bitec_bkk', 'BITEC Bangkok',                  'BITEC 방콕',      'Thailand',      'TH', 'Bangkok',       85,  95, 4.0, false, false, 0.07, 0.36, '외각 위치로 물류 유리.')
on conflict (id) do nothing;

-- ── quotes ──────────────────────────────────────────────────
create table if not exists quotes (
  id                    uuid primary key default uuid_generate_v4(),
  user_id               uuid not null references user_profiles(id) on delete cascade,
  status                text not null default 'draft' check (status in ('draft','complete','shared')),
  -- 전시 정보
  event_name            text not null,
  venue_id              text not null references venues(id),
  venue_name            text not null,
  country               text not null,
  city                  text not null,
  show_month            text not null,          -- "2026-05"
  booth_type            text not null default 'raw_space',
  booth_width           numeric not null,
  booth_depth           numeric not null,
  booth_sqm             numeric not null,
  -- 참가사 정보
  client_name           text not null,
  contact_name          text,
  notes                 text,
  -- 환율
  exchange_rate_usd_krw numeric not null default 1370,
  exchange_rate_usd_thb numeric,
  -- 금액
  total_usd             numeric not null default 0,
  total_krw             bigint  not null default 0,
  -- AI
  ai_analyzed           boolean not null default false,
  -- 파일
  rendering_urls        text[] not null default '{}',
  drawing_urls          text[] not null default '{}',
  -- 시간
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ── quote_items ─────────────────────────────────────────────
create table if not exists quote_items (
  id              uuid primary key default uuid_generate_v4(),
  quote_id        uuid not null references quotes(id) on delete cascade,
  no              text not null,
  description     text not null,
  quantity        numeric not null default 1,
  unit            text not null default '식',
  unit_price_usd  numeric not null default 0,
  amount_usd      numeric not null default 0,
  amount_krw      bigint  not null default 0,
  notes           text not null default '',
  section         text not null,
  ai_confidence   int check (ai_confidence between 0 and 100),
  sort_order      int not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists idx_quote_items_quote_id on quote_items(quote_id);
create index if not exists idx_quotes_user_id on quotes(user_id);
create index if not exists idx_quotes_created_at on quotes(created_at desc);

-- ── Row Level Security ───────────────────────────────────────
alter table user_profiles enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;

-- user_profiles: 본인만 읽기/쓰기
create policy "users_own_profile" on user_profiles
  for all using (auth.uid() = id);

-- quotes: 본인만 CRUD
create policy "users_own_quotes" on quotes
  for all using (auth.uid() = user_id);

-- quote_items: 해당 견적 소유자만
create policy "users_own_quote_items" on quote_items
  for all using (
    auth.uid() = (select user_id from quotes where id = quote_id)
  );

-- venues: 전체 공개 읽기
alter table venues enable row level security;
create policy "venues_public_read" on venues
  for select using (true);
