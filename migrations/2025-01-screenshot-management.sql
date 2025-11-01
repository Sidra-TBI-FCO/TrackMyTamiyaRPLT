-- ============================================================================
-- TrackMyRC Database Migration: Screenshot Management Feature
-- Date: January 2025
-- Author: TrackMyRC Development
-- Target: Google Cloud PostgreSQL Production Database
-- ============================================================================

-- ============================================================================
-- PART 1: Create feature_screenshots table
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

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_feature_screenshots_category 
  ON feature_screenshots(category);

-- Create index on is_active for filtering active screenshots
CREATE INDEX IF NOT EXISTS idx_feature_screenshots_is_active 
  ON feature_screenshots(is_active);

-- Create index on sort_order for ordering
CREATE INDEX IF NOT EXISTS idx_feature_screenshots_sort_order 
  ON feature_screenshots(sort_order);

-- Create composite index for active screenshots ordered by sort_order
CREATE INDEX IF NOT EXISTS idx_feature_screenshots_active_sorted 
  ON feature_screenshots(is_active, sort_order) 
  WHERE is_active = true;

-- ============================================================================
-- PART 2: Insert sample data (optional - remove if not needed)
-- ============================================================================

-- Sample screenshots (uncomment if you want initial data)
/*
INSERT INTO feature_screenshots (title, description, category, image_url, route, sort_order, is_active)
VALUES 
  ('Dashboard Overview', 'Main dashboard showing collection statistics and recent activity', 'desktop', 'https://example.com/screenshot1.png', '/home', 1, true),
  ('Model Management', 'Comprehensive model catalog with filtering and search', 'desktop', 'https://example.com/screenshot2.png', '/models', 2, true),
  ('Photo Gallery', 'Organized photo galleries with lightbox viewing', 'mobile', 'https://example.com/screenshot3.png', '/photo-gallery', 3, true),
  ('Build Logging', 'Timeline-based build documentation with voice notes', 'mobile', 'https://example.com/screenshot4.png', '/build-logs', 4, true),
  ('Hop-Up Parts', 'Performance parts tracking and cost analysis', 'desktop', 'https://example.com/screenshot5.png', '/parts', 5, true),
  ('Admin Panel', 'Comprehensive admin dashboard for user and system management', 'admin', 'https://example.com/screenshot6.png', '/admin', 6, true);
*/

-- ============================================================================
-- PART 3: Update admin audit log to track screenshot actions
-- ============================================================================

-- The admin_audit_log table should already exist. If screenshot-related actions
-- need to be logged, they will use the existing admin_audit_log table with
-- actions like: 'upload_screenshot', 'create_screenshot', 'update_screenshot', 
-- 'delete_screenshot'

-- No schema changes needed for admin_audit_log

-- ============================================================================
-- PART 4: Verification Queries
-- ============================================================================

-- Run these queries after migration to verify everything is correct:

-- Check that feature_screenshots table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'feature_screenshots'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'feature_screenshots';

-- Count screenshots (should be 0 unless sample data was inserted)
SELECT COUNT(*) as screenshot_count FROM feature_screenshots;

-- ============================================================================
-- ROLLBACK SCRIPT (Use only if you need to undo this migration)
-- ============================================================================

/*
-- Drop indexes first
DROP INDEX IF EXISTS idx_feature_screenshots_active_sorted;
DROP INDEX IF EXISTS idx_feature_screenshots_sort_order;
DROP INDEX IF EXISTS idx_feature_screenshots_is_active;
DROP INDEX IF EXISTS idx_feature_screenshots_category;

-- Drop the table
DROP TABLE IF EXISTS feature_screenshots;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- After running this migration:
-- 1. Verify table creation with verification queries above
-- 2. Test the admin screenshots interface at /admin (Screenshots tab)
-- 3. Upload a test screenshot to verify storage integration
-- 4. Check the public screenshots page at /screenshots
-- 5. Verify Stripe checkout integration on /pricing page

-- Notes:
-- - This migration is idempotent (safe to run multiple times)
-- - Indexes are created to optimize common queries
-- - The table supports soft deletion via is_active flag
-- - sort_order allows manual ordering of screenshots
-- - category field allows filtering by platform (mobile/desktop/admin)
-- - image_url stores the full URL from Replit Object Storage
-- - route field optionally links screenshots to specific app routes
