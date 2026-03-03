-- ============================================================================
-- TrackMyRC: Add Theme Settings to Users
-- Date: March 03, 2026
-- Target: Google BigQuery
-- Description: Adds a theme_settings column to the users table so that a
--              user's chosen colour scheme and dark mode preference are
--              persisted server-side and remain consistent across all devices
--              and browser sessions.
-- ============================================================================

ALTER TABLE users
ADD COLUMN theme_settings JSON;
