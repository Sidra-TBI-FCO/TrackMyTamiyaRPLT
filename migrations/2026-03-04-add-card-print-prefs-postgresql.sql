-- Add card_print_prefs column to users table (PostgreSQL)
ALTER TABLE users ADD COLUMN IF NOT EXISTS card_print_prefs JSONB;
