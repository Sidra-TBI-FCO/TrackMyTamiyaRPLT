-- BigQuery migration: Add brand_logos table for admin-managed print card logos
-- Run this in BigQuery console

CREATE TABLE IF NOT EXISTS `your_dataset.brand_logos` (
  id INT64 NOT NULL,
  keyword STRING NOT NULL,
  display_name STRING NOT NULL,
  url STRING NOT NULL,
  is_tamiya_stamp BOOL NOT NULL
);

-- Note: BigQuery does not support DEFAULT values or SERIAL/AUTO_INCREMENT.
-- is_tamiya_stamp should be explicitly set to false on INSERT when not the stamp logo.
-- id must be managed from the application layer (no auto-increment in BigQuery).
