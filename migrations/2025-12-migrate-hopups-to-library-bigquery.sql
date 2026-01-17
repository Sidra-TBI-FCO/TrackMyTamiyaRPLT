-- ============================================================================
-- TrackMyRC: Migrate Existing Hop-Up Parts to Hop-Up Library
-- Date: December 2025
-- Target: Google BigQuery
-- Description: Copies unique hop-up parts from hop_up_parts table to 
--              hop_up_library for reuse across models
-- ============================================================================

-- Insert unique parts into hop_up_library (deduplicated by name + item_number + user)
-- This preserves user ownership while creating a reusable parts catalog

INSERT INTO hop_up_library (
    id,
    user_id,
    name,
    item_number,
    category,
    manufacturer,
    is_tamiya_brand,
    product_url,
    tamiya_base_url,
    compatibility,
    color,
    material,
    notes,
    photo_id,
    created_at
)
SELECT
    ROW_NUMBER() OVER() as id,
    user_id,
    name,
    item_number,
    category,
    manufacturer,
    is_tamiya_brand,
    product_url,
    tamiya_base_url,
    compatibility,
    color,
    material,
    notes,
    photo_id,
    created_at
FROM (
    SELECT DISTINCT
        hp.user_id,
        hp.name,
        hp.item_number,
        hp.category,
        hp.manufacturer,
        hp.is_tamiya_brand,
        hp.product_url,
        hp.tamiya_base_url,
        hp.compatibility,
        hp.color,
        hp.material,
        hp.notes,
        hp.photo_id,
        hp.created_at
    FROM hop_up_parts hp
    INNER JOIN models m ON hp.model_id = m.id
    WHERE hp.name IS NOT NULL
)
WHERE NOT EXISTS (
    SELECT 1 FROM hop_up_library lib 
    WHERE lib.user_id = user_id 
    AND lib.name = name 
    AND COALESCE(lib.item_number, '') = COALESCE(item_number, '')
);
