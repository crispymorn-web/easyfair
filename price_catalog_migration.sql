-- ── price_catalog ───────────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor after the main supabase_schema.sql
create table if not exists price_catalog (
  id              uuid primary key default uuid_generate_v4(),
  venue_id        uuid references venues(id) on delete set null,  -- null = 전체 기본값
  section         text not null check (section in (
    'SPACE_VENUE','STRUCTURE','GRAPHICS','AV_ELECTRICAL','FURNITURE','LOGISTICS'
  )),
  item_key        text not null,              -- e.g. "wall_panel_sqm"
  label_ko        text not null,
  label_en        text not null,
  unit            text not null default '식',
  unit_price_usd  numeric not null default 0,
  price_type      text not null default 'base' check (price_type in ('base','absolute')),
                  -- base  = 단가 × venue local_cost_factor
                  -- absolute = 그대로 적용 (venue factor 무시)
  keywords        text[] not null default '{}',   -- 설명 매핑용 키워드
  active          boolean not null default true,
  sort_order      int not null default 0,
  notes           text not null default '',
  updated_at      timestamptz not null default now()
);

create index if not exists idx_price_catalog_section  on price_catalog(section);
create index if not exists idx_price_catalog_venue_id on price_catalog(venue_id);
create index if not exists idx_price_catalog_active   on price_catalog(active) where active = true;

-- RLS: 읽기는 누구나, 쓰기는 service_role만
alter table price_catalog enable row level security;
create policy "price_catalog_public_read" on price_catalog
  for select using (true);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists price_catalog_updated_at on price_catalog;
create trigger price_catalog_updated_at
  before update on price_catalog
  for each row execute function update_updated_at();

-- ── 초기 시드 데이터 (LA 기준 USD, base type) ────────────────────────────────
insert into price_catalog (section, item_key, label_ko, label_en, unit, unit_price_usd, price_type, keywords, sort_order) values

-- SPACE & VENUE
('SPACE_VENUE', 'raw_space_sqm',            '부스 면적비 (raw)',   'Raw Space Fee',          'sqm',  450,  'base', ARRAY['raw space','부스면적','면적비'],    10),
('SPACE_VENUE', 'exhibitor_badge_person',   '전시자 배지',          'Exhibitor Badge',        '인',   120,  'base', ARRAY['badge','배지','exhibitor'],        20),
('SPACE_VENUE', 'move_in_out',              '반입반출비',            'Move In/Out',            '식',   600,  'base', ARRAY['move','반입','반출','move-in'],     30),
('SPACE_VENUE', 'cleaning_day',             '청소비 (일)',           'Cleaning Fee / Day',     '일',    30,  'base', ARRAY['clean','청소','cleaning'],          40),

-- STRUCTURE
('STRUCTURE', 'wall_panel_sqm',             '벽 패널',              'Wall Panel',             'sqm',   95,  'base', ARRAY['wall','벽','panel','파티션'],        10),
('STRUCTURE', 'wood_laminate_sqm',          '목재 라미네이트',       'Wood Laminate',          'sqm',  130,  'base', ARRAY['laminate','라미네이트','wood laminate'], 20),
('STRUCTURE', 'ceiling_sqm',                '천장 시공',             'Ceiling Construction',   'sqm',   70,  'base', ARRAY['ceiling','천장'],                   30),
('STRUCTURE', 'storage_room',               '창고 룸',               'Storage Room',           '식',  1200,  'base', ARRAY['storage','창고','스토리지'],         40),
('STRUCTURE', 'carpet_sqm',                 '카펫 (바닥)',            'Carpet',                 'sqm',   35,  'base', ARRAY['carpet','카펫','바닥재'],            50),
('STRUCTURE', 'display_counter',            '디스플레이 카운터',      'Display Counter',        '개',  1800,  'base', ARRAY['counter','카운터','display counter'], 60),
('STRUCTURE', 'moss_wall',                  '모스월 장식',            'Moss Wall',              '식',   650,  'base', ARRAY['moss','모스','moss wall'],           70),
('STRUCTURE', 'labor_day',                  '시공 인건비 (일)',        'Labor / Day',            '일',  1200,  'base', ARRAY['labor','인건','목공','carpentry'],   80),

-- GRAPHICS
('GRAPHICS', 'header_signage',              '헤더 사이니지',          'Header Signage',         '식',   850,  'base', ARRAY['header','헤더','signage'],           10),
('GRAPHICS', 'graphic_large',               '대형 그래픽',            'Large Graphic',          '식',   480,  'base', ARRAY['large','대형','main','메인'],        20),
('GRAPHICS', 'graphic_medium',              '중형 그래픽',            'Medium Graphic',         '식',   320,  'base', ARRAY['medium','중형','graphic'],           30),
('GRAPHICS', 'graphic_small',               '소형 그래픽',            'Small Graphic',          '식',   250,  'base', ARRAY['small','소형'],                     40),
('GRAPHICS', 'vinyl_lettering',             '비닐 레터링',            'Vinyl Lettering',        '식',   180,  'base', ARRAY['letter','레터','vinyl','cut-out'],   50),
('GRAPHICS', 'graphic_design',              '그래픽 디자인',           'Graphic Design',         '식',  1200,  'base', ARRAY['design','디자인'],                  60),

-- AV & ELECTRICAL
('AV_ELECTRICAL', 'tv_55_rental',           'TV 55" 렌탈',           '55" TV Rental',          '대',   900,  'base', ARRAY['tv','55','monitor','모니터'],        10),
('AV_ELECTRICAL', 'electrical_5kw',         '전기 5kW',              'Electrical 5kW',         '식',   650,  'base', ARRAY['electrical','전기','5kw','power'],   20),
('AV_ELECTRICAL', 'led_spotlight',          'LED 스포트라이트',        'LED Spotlight',          '개',    65,  'base', ARRAY['led','spot','spotlight','조명'],     30),
('AV_ELECTRICAL', 'power_distribution',     '분전반',                 'Power Distribution',     '식',   180,  'base', ARRAY['power distribution','분전','distribution'], 40),

-- FURNITURE
('FURNITURE', 'round_table',                '라운드 테이블',           'Round Table',            '개',   120,  'base', ARRAY['table','테이블','round'],            10),
('FURNITURE', 'chair',                      '의자',                   'Chair',                  '개',    45,  'base', ARRAY['chair','의자'],                     20),
('FURNITURE', 'brochure_stand',             '브로슈어 스탠드',         'Brochure Stand',         '개',   150,  'base', ARRAY['brochure','브로슈어','stand'],       30),
('FURNITURE', 'misc_accessories',           '기타 소품',               'Misc Accessories',       '식',    80,  'base', ARRAY['misc','기타','accessories','소품'], 40),

-- LOGISTICS
('LOGISTICS', 'pm_day',                     'PM 관리비 (일)',          'Project Mgmt / Day',     '일',   500,  'base', ARRAY['pm','manage','관리','project management'], 10),
('LOGISTICS', 'transport',                  '운송비',                  'Transport',              '식',   800,  'base', ARRAY['transport','운송','물류','logistics'], 20),
('LOGISTICS', 'teardown',                   '철거비',                  'Teardown',               '식',   600,  'base', ARRAY['teardown','철거','dismantle'],       30)

on conflict do nothing;
