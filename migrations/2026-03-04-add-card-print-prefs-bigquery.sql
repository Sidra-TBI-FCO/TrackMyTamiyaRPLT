-- Add card_print_prefs column to users table (BigQuery)
-- BigQuery does not support DEFAULT values in ALTER TABLE
ALTER TABLE `your_dataset.users` ADD COLUMN card_print_prefs JSON;
