-- BigQuery migration: Add brand_logos table for admin-managed print card logos
-- Run this in BigQuery console

CREATE TABLE IF NOT EXISTS `your_dataset.brand_logos` (
  id INT64 NOT NULL,
  keyword STRING NOT NULL,
  display_name STRING NOT NULL,
  url STRING NOT NULL,
  is_tamiya_stamp BOOL NOT NULL DEFAULT false
);

-- Note: BigQuery doesn't support SERIAL/AUTO_INCREMENT.
-- Manage IDs from application layer or use ROW_NUMBER in queries.
-- The PostgreSQL production version uses: id SERIAL PRIMARY KEY with UNIQUE on keyword.
