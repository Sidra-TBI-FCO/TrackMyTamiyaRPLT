CREATE TABLE IF NOT EXISTS brand_logos (
  id SERIAL PRIMARY KEY,
  keyword TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  url TEXT NOT NULL,
  is_tamiya_stamp BOOLEAN NOT NULL DEFAULT false
);
