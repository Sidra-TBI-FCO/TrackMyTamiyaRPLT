-- Migration: Field Options Management
-- Date: December 2025
-- Description: Creates the field_options table for admin-managed dropdown values
--              and populates it with existing values from models and hop_up_parts tables

-- Create the field_options table
CREATE TABLE IF NOT EXISTS field_options (
  id SERIAL PRIMARY KEY,
  field_key VARCHAR(100) NOT NULL,
  value VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(field_key, value)
);

-- Create index for faster lookups by field_key
CREATE INDEX IF NOT EXISTS idx_field_options_field_key ON field_options(field_key);

-- Populate with existing model scale values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'scale', scale, ROW_NUMBER() OVER (ORDER BY scale)
FROM models WHERE scale IS NOT NULL AND scale != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model driveType values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'driveType', drive_type, ROW_NUMBER() OVER (ORDER BY drive_type)
FROM models WHERE drive_type IS NOT NULL AND drive_type != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model chassisMaterial values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'chassisMaterial', chassis_material, ROW_NUMBER() OVER (ORDER BY chassis_material)
FROM models WHERE chassis_material IS NOT NULL AND chassis_material != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model differentialType values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'differentialType', differential_type, ROW_NUMBER() OVER (ORDER BY differential_type)
FROM models WHERE differential_type IS NOT NULL AND differential_type != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model motorSize values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'motorSize', motor_size, ROW_NUMBER() OVER (ORDER BY motor_size)
FROM models WHERE motor_size IS NOT NULL AND motor_size != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model batteryType values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'batteryType', battery_type, ROW_NUMBER() OVER (ORDER BY battery_type)
FROM models WHERE battery_type IS NOT NULL AND battery_type != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing model buildStatus values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'buildStatus', build_status, ROW_NUMBER() OVER (ORDER BY build_status)
FROM models WHERE build_status IS NOT NULL AND build_status != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Populate with existing hop-up category values
INSERT INTO field_options (field_key, value, sort_order)
SELECT DISTINCT 'hopUpCategory', category, ROW_NUMBER() OVER (ORDER BY category)
FROM hop_up_parts WHERE category IS NOT NULL AND category != ''
ON CONFLICT (field_key, value) DO NOTHING;

-- Add default options if none exist (fallback values)
-- Scale defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('scale', '1/10', 1),
  ('scale', '1/12', 2),
  ('scale', '1/8', 3),
  ('scale', '1/14', 4),
  ('scale', '1/16', 5),
  ('scale', '1/18', 6),
  ('scale', '1/24', 7),
  ('scale', '1/32', 8)
ON CONFLICT (field_key, value) DO NOTHING;

-- Drive type defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('driveType', '4WD', 1),
  ('driveType', 'RWD', 2),
  ('driveType', 'FWD', 3),
  ('driveType', 'AWD', 4),
  ('driveType', '2WD', 5)
ON CONFLICT (field_key, value) DO NOTHING;

-- Chassis material defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('chassisMaterial', 'Plastic', 1),
  ('chassisMaterial', 'Carbon Fiber', 2),
  ('chassisMaterial', 'Aluminum', 3),
  ('chassisMaterial', 'Carbon/Alu', 4),
  ('chassisMaterial', 'FRP', 5),
  ('chassisMaterial', 'Glass Fiber', 6),
  ('chassisMaterial', 'Steel', 7),
  ('chassisMaterial', 'Composite', 8)
ON CONFLICT (field_key, value) DO NOTHING;

-- Differential type defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('differentialType', 'Gears', 1),
  ('differentialType', 'Oil', 2),
  ('differentialType', 'Ball Diff', 3),
  ('differentialType', 'One-way', 4),
  ('differentialType', 'Limited Slip', 5),
  ('differentialType', 'Spool', 6)
ON CONFLICT (field_key, value) DO NOTHING;

-- Motor size defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('motorSize', '540', 1),
  ('motorSize', '380', 2),
  ('motorSize', 'Brushless', 3),
  ('motorSize', '13.5T', 4),
  ('motorSize', '17.5T', 5),
  ('motorSize', '21.5T', 6),
  ('motorSize', '25.5T', 7),
  ('motorSize', 'Custom', 8)
ON CONFLICT (field_key, value) DO NOTHING;

-- Battery type defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('batteryType', '7.2V NiMH', 1),
  ('batteryType', '7.4V LiPo 2S', 2),
  ('batteryType', '11.1V LiPo 3S', 3),
  ('batteryType', '14.8V LiPo 4S', 4),
  ('batteryType', '6V NiMH', 5),
  ('batteryType', '8.4V NiMH', 6),
  ('batteryType', 'LiFe', 7),
  ('batteryType', 'Custom', 8)
ON CONFLICT (field_key, value) DO NOTHING;

-- Build status defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('buildStatus', 'planning', 1),
  ('buildStatus', 'building', 2),
  ('buildStatus', 'built', 3),
  ('buildStatus', 'maintenance', 4)
ON CONFLICT (field_key, value) DO NOTHING;

-- Hop-up category defaults
INSERT INTO field_options (field_key, value, sort_order) VALUES
  ('hopUpCategory', 'Motor', 1),
  ('hopUpCategory', 'ESC', 2),
  ('hopUpCategory', 'Servo', 3),
  ('hopUpCategory', 'Receiver', 4),
  ('hopUpCategory', 'Battery', 5),
  ('hopUpCategory', 'Chassis', 6),
  ('hopUpCategory', 'Suspension', 7),
  ('hopUpCategory', 'Wheels', 8),
  ('hopUpCategory', 'Tires', 9),
  ('hopUpCategory', 'Drivetrain', 10),
  ('hopUpCategory', 'Body', 11),
  ('hopUpCategory', 'Wing', 12),
  ('hopUpCategory', 'Interior', 13),
  ('hopUpCategory', 'Lights', 14),
  ('hopUpCategory', 'Electronics', 15),
  ('hopUpCategory', 'Tools', 16),
  ('hopUpCategory', 'Maintenance', 17),
  ('hopUpCategory', 'Other', 18)
ON CONFLICT (field_key, value) DO NOTHING;
