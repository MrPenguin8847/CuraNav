-- CuraNav: Migration to support real NHA PMJAY hospital data
-- Run this BEFORE curanav_seed_data.sql
--
-- Changes:
--   1. Makes geo/cost/location fields nullable (not available in NHA data)
--   2. Adds new columns: phone, facility_type, date_of_establishment
--   3. Deletes all previous synthetic data

-- ── Step 1: Make columns nullable ─────────────────────────────────
ALTER TABLE hospitals ALTER COLUMN city DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN state DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN pincode DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN latitude DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN longitude DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN cost_min DROP NOT NULL;
ALTER TABLE hospitals ALTER COLUMN cost_max DROP NOT NULL;

-- ── Step 2: Add new columns from NHA data ─────────────────────────
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS facility_type text;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS date_of_establishment text;

-- ── Step 3: Delete all previous data ──────────────────────────────
DELETE FROM hospitals;
