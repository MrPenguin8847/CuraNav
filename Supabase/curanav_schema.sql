-- CuraNav: Supabase/Postgres schema
-- Run this first, then curanav_seed_data.sql

create table if not exists hospitals (
  hospital_id            text primary key,
  name                   text not null,
  city                   text not null,
  state                  text not null,
  pincode                text not null,
  address                text not null,
  latitude               double precision not null,
  longitude              double precision not null,
  specialties            text[] not null default '{}',
  procedures             text[] not null default '{}',
  cost_min               integer not null,
  cost_max               integer not null,
  currency               text not null default 'INR',
  facilities             text[] not null default '{}',
  accreditation          text[] not null default '{}',
  pmjay_empanelled       boolean not null default false,
  annual_procedure_volume integer,
  outcome_metric         text,
  icu_beds               integer,
  source_type            text not null check (source_type in ('official','public','synthetic')),
  verification_status    text not null check (verification_status in ('verified','pending','simulated')),
  source_url             text,
  last_verified          date,
  last_updated           date not null,
  data_status            text not null default 'synthetic_demo_data',
  review_status          text not null default 'approved' check (review_status in ('pending', 'approved', 'rejected')),
  condition_tag          text,  -- convenience column for demo filtering/seeding only
  success_rates          jsonb not null default '{}'::jsonb
);

create index if not exists idx_hospitals_city on hospitals (city);
create index if not exists idx_hospitals_specialties on hospitals using gin (specialties);
create index if not exists idx_hospitals_facilities on hospitals using gin (facilities);
create index if not exists idx_hospitals_verification on hospitals (verification_status);
create index if not exists idx_hospitals_review_status on hospitals (review_status);
