-- ============================================================================
-- TrackMyRC: Add Supplier and Cost to Hop-Up Library
-- Date: December 2025
-- Target: PostgreSQL (Cloud SQL / Neon)
-- Description: Adds supplier and cost columns to hop_up_library table
-- ============================================================================

ALTER TABLE hop_up_library
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2);
