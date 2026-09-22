-- CuraNav: migration to add admin review workflow
-- Run this in the Supabase SQL editor AFTER curanav_schema.sql / curanav_seed_data.sql
--
-- Why a separate column from verification_status:
--   verification_status = trust label shown to end users (verified / pending / simulated)
--   review_status        = admin curation workflow (pending / approved / rejected) —
--                           controls whether a record is eligible to appear in
--                           public search results at all.

alter table hospitals
  add column if not exists review_status text not null default 'approved'
  check (review_status in ('pending', 'approved', 'rejected'));

-- Backfill: all 24 existing seed records are already wired into the live search/compare
-- flow, so mark them approved so nothing disappears from the demo.
update hospitals set review_status = 'approved' where review_status is null;

create index if not exists idx_hospitals_review_status on hospitals (review_status);

-- Optional, do this once the admin dashboard is live and you've approved fresh test
-- uploads: filter the public /api/hospitals route to review_status = 'approved' only,
-- so records an admin hasn't reviewed yet don't show up in citizen-facing search.
-- Left out of the API route for now so this migration doesn't change existing behavior.
