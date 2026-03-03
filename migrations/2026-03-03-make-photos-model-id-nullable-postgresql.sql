-- ============================================================================
-- TrackMyRC: Make photos.model_id Nullable
-- Date: March 03, 2026
-- Target: PostgreSQL (local dev / Neon)
-- Description: Removes the NOT NULL constraint from photos.model_id so that
--              photos uploaded for electronics items (motors, ESCs, servos,
--              receivers) can be stored without being tied to a specific model.
--              Previously, electronics photo uploads were silently failing
--              because the NOT NULL constraint rejected null model_id values.
-- ============================================================================

ALTER TABLE photos ALTER COLUMN model_id DROP NOT NULL;
