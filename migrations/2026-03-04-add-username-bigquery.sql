-- Add username and show_real_name columns to users table (BigQuery)
-- BigQuery does not support UNIQUE constraints or DEFAULT in ALTER TABLE
ALTER TABLE `your_dataset.users` ADD COLUMN username STRING;
ALTER TABLE `your_dataset.users` ADD COLUMN show_real_name BOOL;

-- Generate usernames for existing users (run as a separate UPDATE after adding columns)
-- BigQuery UPDATE syntax:
UPDATE `your_dataset.users`
SET
  username = LOWER(
    REGEXP_REPLACE(
      COALESCE(
        NULLIF(TRIM(CONCAT(COALESCE(first_name, ''), '_', COALESCE(last_name, ''))), '_'),
        SPLIT(email, '@')[OFFSET(0)]
      ),
      '[^a-z0-9_]', ''
    )
  ),
  show_real_name = FALSE
WHERE username IS NULL;

-- Note: BigQuery does not support window functions in UPDATE statements.
-- If duplicate base names exist, you will need to run a follow-up UPDATE
-- to append numeric suffixes manually, or handle deduplication in application code.
