-- Migration: Add success_rates column to hospitals table

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='hospitals' AND column_name='success_rates'
    ) THEN
        ALTER TABLE hospitals ADD COLUMN success_rates jsonb NOT NULL DEFAULT '{}'::jsonb;
    END IF;
END $$;
