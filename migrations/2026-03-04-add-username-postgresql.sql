-- Add username and show_real_name columns to users table (PostgreSQL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_real_name BOOLEAN NOT NULL DEFAULT FALSE;

-- Generate usernames for all existing users
-- LOWER() applied before REGEXP_REPLACE so uppercase letters are not stripped
-- Base: lowercase first_name_last_name stripped to alphanumeric+underscore
-- Fallback: email prefix if names are null
-- Deduplication: _2, _3, etc. for collisions
WITH base AS (
  SELECT
    id,
    REGEXP_REPLACE(
      LOWER(
        COALESCE(
          NULLIF(TRIM(COALESCE(first_name,'') || '_' || COALESCE(last_name,'')), '_'),
          SPLIT_PART(email, '@', 1)
        )
      ),
      '[^a-z0-9_]', '', 'g'
    ) AS base_name
  FROM users
  WHERE username IS NULL
),
ranked AS (
  SELECT
    id,
    base_name,
    ROW_NUMBER() OVER (PARTITION BY base_name ORDER BY id) AS rn
  FROM base
)
UPDATE users u
SET username = CASE WHEN r.rn = 1 THEN r.base_name ELSE r.base_name || '_' || r.rn END
FROM ranked r
WHERE u.id = r.id AND u.username IS NULL;
