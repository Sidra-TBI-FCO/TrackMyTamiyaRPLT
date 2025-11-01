-- ============================================================================
-- TrackMyRC Complete Database Migration
-- Date: January 2025
-- Description: Screenshot management + Hop-up parts photo support
-- Target: Google Cloud PostgreSQL Production Database
-- ============================================================================

-- ============================================================================
-- PART 1: Hop-Up Parts Schema (with Product Photo Support)
-- ============================================================================

-- Ensure hop_up_parts table has photo_id column for product photos
-- This is likely already in your database, but we'll ensure it exists

DO $$
BEGIN
    -- Add photo_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'photo_id'
    ) THEN
        ALTER TABLE hop_up_parts 
        ADD COLUMN photo_id INTEGER REFERENCES photos(id);
        
        CREATE INDEX idx_hop_up_parts_photo_id ON hop_up_parts(photo_id);
    END IF;
    
    -- Add product_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'product_url'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN product_url TEXT;
    END IF;
    
    -- Add tamiya_base_url column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'tamiya_base_url'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN tamiya_base_url TEXT;
    END IF;
    
    -- Add store_urls column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'store_urls'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN store_urls JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- Add compatibility column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'compatibility'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN compatibility TEXT[] DEFAULT '{}'::text[];
    END IF;
    
    -- Add color column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'color'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN color TEXT;
    END IF;
    
    -- Add material column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'hop_up_parts' AND column_name = 'material'
    ) THEN
        ALTER TABLE hop_up_parts ADD COLUMN material TEXT;
    END IF;
END $$;

-- ============================================================================
-- PART 2: Feature Screenshots Table
-- ============================================================================

-- Create the feature_screenshots table for managing marketing screenshots
CREATE TABLE IF NOT EXISTS feature_screenshots (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL, -- Values: "mobile", "desktop", "admin"
  image_url TEXT NOT NULL, -- URL to screenshot in Replit Object Storage
  route VARCHAR, -- App route this screenshot showcases (e.g., "/models", "/admin")
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for feature_screenshots
CREATE INDEX IF NOT EXISTS idx_feature_screenshots_category 
  ON feature_screenshots(category);

CREATE INDEX IF NOT EXISTS idx_feature_screenshots_is_active 
  ON feature_screenshots(is_active);

CREATE INDEX IF NOT EXISTS idx_feature_screenshots_sort_order 
  ON feature_screenshots(sort_order);

CREATE INDEX IF NOT EXISTS idx_feature_screenshots_active_sorted 
  ON feature_screenshots(is_active, sort_order) 
  WHERE is_active = true;

-- ============================================================================
-- PART 3: Verification Queries
-- ============================================================================

-- Verify hop_up_parts columns
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'hop_up_parts' 
  AND column_name IN ('photo_id', 'product_url', 'tamiya_base_url', 'store_urls', 'compatibility', 'color', 'material')
ORDER BY ordinal_position;

-- Verify feature_screenshots table
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'feature_screenshots'
ORDER BY ordinal_position;

-- Count existing hop-up parts with photos
SELECT COUNT(*) as parts_with_photos 
FROM hop_up_parts 
WHERE photo_id IS NOT NULL;

-- Count feature screenshots
SELECT COUNT(*) as screenshot_count 
FROM feature_screenshots;

-- ============================================================================
-- PART 4: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Test admin screenshot upload at /admin (Screenshots tab)';
    RAISE NOTICE '2. View screenshots at /screenshots page';
    RAISE NOTICE '3. Test hop-up parts with product photos';
    RAISE NOTICE '4. Check pricing page at /pricing';
END $$;

-- ============================================================================
-- ROLLBACK SCRIPT (commented out - uncomment if you need to undo)
-- ============================================================================

/*
-- Drop feature_screenshots indexes
DROP INDEX IF EXISTS idx_feature_screenshots_active_sorted;
DROP INDEX IF EXISTS idx_feature_screenshots_sort_order;
DROP INDEX IF EXISTS idx_feature_screenshots_is_active;
DROP INDEX IF EXISTS idx_feature_screenshots_category;

-- Drop feature_screenshots table
DROP TABLE IF EXISTS feature_screenshots;

-- Remove hop_up_parts new columns (only if you want to rollback)
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS material;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS color;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS compatibility;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS store_urls;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS tamiya_base_url;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS product_url;
-- ALTER TABLE hop_up_parts DROP COLUMN IF EXISTS photo_id;
*/
