-- ============================================================================
-- TrackMyRC Electronics System & Hop-Up Library Migration
-- Date: December 2025
-- Description: Creates electronics tables (motors, ESCs, servos, receivers)
--              and hop-up library for global parts catalog
-- Target: Google Cloud PostgreSQL Production Database
-- ============================================================================

-- ============================================================================
-- PART 1: Motors Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS motors (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    motor_type VARCHAR NOT NULL DEFAULT 'brushed', -- brushed, brushless
    is_sensored BOOLEAN DEFAULT false,
    kv INTEGER, -- KV rating for brushless
    turns INTEGER, -- Turn count for brushed
    diameter VARCHAR, -- e.g., "540", "380"
    can_size VARCHAR, -- e.g., "3650", "3660", "4268"
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 2: ESCs (Electronic Speed Controllers) Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS escs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    esc_type VARCHAR NOT NULL DEFAULT 'brushed', -- brushed, brushless, sensored
    max_amps INTEGER,
    max_voltage VARCHAR, -- e.g., "2S", "3S", "6S"
    bec VARCHAR, -- BEC output specs e.g., "6V/3A"
    programmable BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 3: Servos Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS servos (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    servo_type VARCHAR NOT NULL DEFAULT 'standard', -- standard, low-profile, mini, micro
    torque VARCHAR, -- e.g., "10kg-cm" or "140 oz-in"
    speed VARCHAR, -- e.g., "0.12s/60°"
    voltage VARCHAR, -- e.g., "4.8V-7.4V"
    gear_type VARCHAR, -- plastic, metal, titanium
    is_digital BOOLEAN DEFAULT false,
    is_waterproof BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 4: Receivers Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS receivers (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL REFERENCES users(id),
    name TEXT NOT NULL,
    manufacturer TEXT,
    item_number TEXT,
    protocol VARCHAR, -- e.g., "FHSS", "AFHDS2A", "SFHSS", "FrSky"
    channels INTEGER,
    frequency VARCHAR, -- e.g., "2.4GHz"
    has_gyro BOOLEAN DEFAULT false,
    has_telemetry BOOLEAN DEFAULT false,
    cost NUMERIC(10, 2),
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 5: Model Electronics Junction Table
-- ============================================================================

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

-- ============================================================================
-- PART 6: Hop-Up Library Table (Global Parts Catalog)
-- ============================================================================

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
    compatibility TEXT[] DEFAULT '{}',
    color TEXT,
    material TEXT,
    notes TEXT,
    photo_id INTEGER REFERENCES photos(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PART 7: Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_motors_user_id ON motors(user_id);
CREATE INDEX IF NOT EXISTS idx_escs_user_id ON escs(user_id);
CREATE INDEX IF NOT EXISTS idx_servos_user_id ON servos(user_id);
CREATE INDEX IF NOT EXISTS idx_receivers_user_id ON receivers(user_id);
CREATE INDEX IF NOT EXISTS idx_model_electronics_model_id ON model_electronics(model_id);
CREATE INDEX IF NOT EXISTS idx_hop_up_library_user_id ON hop_up_library(user_id);
CREATE INDEX IF NOT EXISTS idx_hop_up_library_category ON hop_up_library(category);

-- ============================================================================
-- PART 8: Verification Queries
-- ============================================================================

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('motors', 'escs', 'servos', 'receivers', 'model_electronics', 'hop_up_library')
ORDER BY table_name;

-- ============================================================================
-- PART 9: Success Message
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Electronics System & Hop-Up Library Migration completed successfully!';
    RAISE NOTICE 'New tables created:';
    RAISE NOTICE '  - motors: Track motor specifications (brushed/brushless, KV, turns)';
    RAISE NOTICE '  - escs: Track ESC details (amps, voltage, BEC)';
    RAISE NOTICE '  - servos: Track servo specs (torque, speed, gear type)';
    RAISE NOTICE '  - receivers: Track receiver details (protocol, channels)';
    RAISE NOTICE '  - model_electronics: Link electronics to specific models';
    RAISE NOTICE '  - hop_up_library: Global parts catalog for reuse across models';
END $$;
