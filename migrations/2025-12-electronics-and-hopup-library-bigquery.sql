-- ============================================================================
-- TrackMyRC Electronics System & Hop-Up Library Migration
-- Date: December 2025
-- Target: Google BigQuery
-- ============================================================================

-- Motors Table
CREATE TABLE IF NOT EXISTS motors (
    id INT64 NOT NULL,
    user_id STRING NOT NULL,
    name STRING NOT NULL,
    manufacturer STRING,
    item_number STRING,
    motor_type STRING NOT NULL,
    is_sensored BOOL,
    kv INT64,
    turns INT64,
    diameter STRING,
    can_size STRING,
    cost NUMERIC,
    notes STRING,
    photo_id INT64,
    created_at TIMESTAMP NOT NULL
);

-- ESCs (Electronic Speed Controllers) Table
CREATE TABLE IF NOT EXISTS escs (
    id INT64 NOT NULL,
    user_id STRING NOT NULL,
    name STRING NOT NULL,
    manufacturer STRING,
    item_number STRING,
    esc_type STRING NOT NULL,
    max_amps INT64,
    max_voltage STRING,
    bec STRING,
    programmable BOOL,
    cost NUMERIC,
    notes STRING,
    photo_id INT64,
    created_at TIMESTAMP NOT NULL
);

-- Servos Table
CREATE TABLE IF NOT EXISTS servos (
    id INT64 NOT NULL,
    user_id STRING NOT NULL,
    name STRING NOT NULL,
    manufacturer STRING,
    item_number STRING,
    servo_type STRING NOT NULL,
    torque STRING,
    speed STRING,
    voltage STRING,
    gear_type STRING,
    is_digital BOOL,
    is_waterproof BOOL,
    cost NUMERIC,
    notes STRING,
    photo_id INT64,
    created_at TIMESTAMP NOT NULL
);

-- Receivers Table
CREATE TABLE IF NOT EXISTS receivers (
    id INT64 NOT NULL,
    user_id STRING NOT NULL,
    name STRING NOT NULL,
    manufacturer STRING,
    item_number STRING,
    protocol STRING,
    channels INT64,
    frequency STRING,
    has_gyro BOOL,
    has_telemetry BOOL,
    cost NUMERIC,
    notes STRING,
    photo_id INT64,
    created_at TIMESTAMP NOT NULL
);

-- Model Electronics Junction Table
CREATE TABLE IF NOT EXISTS model_electronics (
    id INT64 NOT NULL,
    model_id INT64 NOT NULL,
    motor_id INT64,
    esc_id INT64,
    servo_id INT64,
    receiver_id INT64,
    notes STRING,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

-- Hop-Up Library Table (Global Parts Catalog)
CREATE TABLE IF NOT EXISTS hop_up_library (
    id INT64 NOT NULL,
    user_id STRING NOT NULL,
    name STRING NOT NULL,
    item_number STRING,
    category STRING NOT NULL,
    manufacturer STRING,
    is_tamiya_brand BOOL,
    product_url STRING,
    tamiya_base_url STRING,
    compatibility ARRAY<STRING>,
    color STRING,
    material STRING,
    notes STRING,
    photo_id INT64,
    created_at TIMESTAMP NOT NULL
);
