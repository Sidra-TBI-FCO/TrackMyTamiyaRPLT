-- ============================================================================
-- TrackMyRC: Add Supplier and Cost to Hop-Up Library
-- Date: December 2025
-- Target: Google BigQuery
-- Description: Adds supplier and cost columns to hop_up_library table
-- ============================================================================

ALTER TABLE hop_up_library
ADD COLUMN supplier STRING,
ADD COLUMN cost NUMERIC;
