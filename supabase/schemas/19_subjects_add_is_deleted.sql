-- ============================================================================
-- Add is_deleted to public.subjects
-- ============================================================================
--
-- The schema FILE (03_academic.sql) declares this column, but the live
-- prod database was provisioned before it was added — so every query in
-- dataService.ts that does `.eq('is_deleted', false)` on `subjects`
-- errored server-side. Supabase-js silently returned undefined, the
-- frontend fell back to [], and students saw "No subjects yet" even
-- though 10 chapters and 2 subjects existed in their batch.
--
-- Safe additive migration: adds the column with DEFAULT false NOT NULL,
-- so every existing subject row stays visible (is_deleted = false) and
-- soft-delete via dataService.deleteSubject can now flip it to true.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is a no-op after the first run.

ALTER TABLE public.subjects
    ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT false;
