-- ============================================================================
-- TrackMyRC Model Comments Migration
-- Date: December 2025
-- Description: Creates model_comments table for community model commenting
-- Target: Google Cloud PostgreSQL Production Database
-- ============================================================================

-- ============================================================================
-- PART 1: Create model_comments Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_comments (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_model_comments_model_id 
  ON model_comments(model_id);

CREATE INDEX IF NOT EXISTS idx_model_comments_user_id 
  ON model_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_model_comments_created_at 
  ON model_comments(created_at DESC);

-- ============================================================================
-- PART 3: Verification Query
-- ============================================================================

SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'model_comments'
ORDER BY ordinal_position;

-- ============================================================================
-- PART 4: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Model Comments Migration completed successfully!';
    RAISE NOTICE 'Users can now comment on shared models in the community gallery.';
END $$;
