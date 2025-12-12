-- ============================================================================
-- TrackMyRC Community Model Sharing Migration
-- Date: December 2025
-- Description: Adds community sharing fields to users and models tables
-- Target: Google Cloud PostgreSQL Production Database
-- ============================================================================

-- ============================================================================
-- PART 1: Users Table - Share Preference
-- ============================================================================

DO $$
BEGIN
    -- Add share_preference column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'share_preference'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN share_preference VARCHAR(20) NOT NULL DEFAULT 'private';
        
        RAISE NOTICE '✅ Added share_preference column to users table';
    ELSE
        RAISE NOTICE 'ℹ️  share_preference column already exists in users table';
    END IF;
END $$;

-- ============================================================================
-- PART 2: Models Table - Sharing Fields
-- ============================================================================

DO $$
BEGIN
    -- Add is_shared column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'is_shared'
    ) THEN
        ALTER TABLE models 
        ADD COLUMN is_shared BOOLEAN DEFAULT false;
        
        RAISE NOTICE '✅ Added is_shared column to models table';
    ELSE
        RAISE NOTICE 'ℹ️  is_shared column already exists in models table';
    END IF;
    
    -- Add public_slug column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'models' AND column_name = 'public_slug'
    ) THEN
        ALTER TABLE models 
        ADD COLUMN public_slug VARCHAR(100) UNIQUE;
        
        RAISE NOTICE '✅ Added public_slug column to models table';
    ELSE
        RAISE NOTICE 'ℹ️  public_slug column already exists in models table';
    END IF;
END $$;

-- ============================================================================
-- PART 3: Create Index for Public Slug Lookups
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_models_public_slug 
  ON models(public_slug) 
  WHERE public_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_models_is_shared 
  ON models(is_shared) 
  WHERE is_shared = true;

-- ============================================================================
-- PART 4: Verification Queries
-- ============================================================================

-- Verify users columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'users' 
  AND column_name = 'share_preference'
ORDER BY ordinal_position;

-- Verify models columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'models' 
  AND column_name IN ('is_shared', 'public_slug')
ORDER BY ordinal_position;

-- ============================================================================
-- PART 5: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Community Sharing Migration completed successfully!';
    RAISE NOTICE 'New features available:';
    RAISE NOTICE '1. Share models from Model Detail page using toggle';
    RAISE NOTICE '2. Control visibility in Settings > Community Sharing';
    RAISE NOTICE '3. Browse shared models at /community';
END $$;
