-- ============================================================================
-- TrackMyRC Electronics System & Hop-Up Library Migration
-- Date: December 2025
-- Target: PostgreSQL (Cloud SQL / Neon)
-- ============================================================================

-- Motors Table
CREATE TABLE IF NOT EXISTS motors (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    motor_type VARCHAR NOT NULL DEFAULT 'brushed',
    is_sensored BOOLEAN DEFAULT false,
    kv INTEGER,
    turns INTEGER,
    diameter VARCHAR,
    can_size VARCHAR,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ESCs (Electronic Speed Controllers) Table
CREATE TABLE IF NOT EXISTS escs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    esc_type VARCHAR NOT NULL DEFAULT 'brushed',
    max_amps INTEGER,
    max_voltage VARCHAR,
    bec VARCHAR,
    programmable BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Servos Table
CREATE TABLE IF NOT EXISTS servos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    servo_type VARCHAR NOT NULL DEFAULT 'standard',
    torque VARCHAR,
    speed VARCHAR,
    voltage VARCHAR,
    gear_type VARCHAR,
    is_digital BOOLEAN DEFAULT false,
    is_waterproof BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Receivers Table
CREATE TABLE IF NOT EXISTS receivers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    protocol VARCHAR,
    channels INTEGER,
    frequency VARCHAR,
    has_gyro BOOLEAN DEFAULT false,
    has_telemetry BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Model Electronics Junction Table
CREATE TABLE IF NOT EXISTS model_electronics (
    id SERIAL PRIMARY KEY,
    model_id INTEGER NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    motor_id INTEGER REFERENCES motors(id) ON DELETE SET NULL,
    esc_id INTEGER REFERENCES escs(id) ON DELETE SET NULL,
    servo_id INTEGER REFERENCES servos(id) ON DELETE SET NULL,
    receiver_id INTEGER REFERENCES receivers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Hop-Up Library Table (Global Parts Catalog)
CREATE TABLE IF NOT EXISTS hop_up_library (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    item_number TEXT,
    category TEXT NOT NULL,
    manufacturer TEXT,
    is_tamiya_brand BOOLEAN DEFAULT false,
    product_url TEXT,
    tamiya_base_url TEXT,
    compatibility TEXT[],
    color TEXT,
    material TEXT,
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_motors_user_id ON motors(user_id);
CREATE INDEX IF NOT EXISTS idx_escs_user_id ON escs(user_id);
CREATE INDEX IF NOT EXISTS idx_servos_user_id ON servos(user_id);
CREATE INDEX IF NOT EXISTS idx_receivers_user_id ON receivers(user_id);
CREATE INDEX IF NOT EXISTS idx_model_electronics_model_id ON model_electronics(model_id);
CREATE INDEX IF NOT EXISTS idx_hop_up_library_user_id ON hop_up_library(user_id);
CREATE INDEX IF NOT EXISTS idx_hop_up_library_category ON hop_up_library(category);
