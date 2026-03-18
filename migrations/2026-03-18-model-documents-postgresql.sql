-- ============================================================================
-- TrackMyRC Model Documents (Resources) Migration
-- Date: 2026-03-18
-- Target: PostgreSQL (Neon / Cloud SQL)
-- ============================================================================
--
-- This migration adds the model_documents table, which stores documents
-- (manuals, setup sheets, leaflets, etc.) that users upload per model.
--
-- Files are stored in Google Cloud Storage under the prefix:
--   model-documents/<modelId>-<timestamp>-<random>.<ext>
--
-- Documents are only accessible to the owning user via a protected API
-- endpoint: GET /api/models/:modelId/documents/:docId/download
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_documents (
    id            SERIAL PRIMARY KEY,
    model_id      INTEGER   NOT NULL REFERENCES models(id) ON DELETE CASCADE,
    user_id       VARCHAR   NOT NULL REFERENCES users(id),
    filename      TEXT      NOT NULL,
    original_name TEXT      NOT NULL,
    url           TEXT      NOT NULL,
    description   TEXT,
    document_type VARCHAR(50) NOT NULL DEFAULT 'other',
    file_size     INTEGER   NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookups by model + user (the most common query pattern)
CREATE INDEX IF NOT EXISTS idx_model_documents_model_user
    ON model_documents (model_id, user_id);

-- ============================================================================
-- Notes:
--
-- 1. `document_type` accepted values: 'manual', 'setup_sheet', 'leaflet', 'other'.
--    Enforced at the API layer; add a CHECK constraint below if stricter DB-level
--    validation is desired:
--    ALTER TABLE model_documents
--        ADD CONSTRAINT chk_document_type
--        CHECK (document_type IN ('manual', 'setup_sheet', 'leaflet', 'other'));
--
-- 2. `filename` holds the GCS object key (e.g. "model-documents/59-1234-abc.pdf").
--    `url` holds the GCS public URL at time of upload; clients are served the
--    protected-endpoint URL at query time instead of the raw GCS URL.
--
-- 3. ON DELETE CASCADE on model_id means all documents are automatically removed
--    when their parent model is deleted. The API also deletes the GCS file on
--    explicit document delete (DELETE /api/models/:modelId/documents/:docId).
--
-- 4. This table was originally applied to the development database via executeSql
--    (TLS workaround). Run this script on production (Neon / Cloud SQL) to apply
--    the same schema.
-- ============================================================================
