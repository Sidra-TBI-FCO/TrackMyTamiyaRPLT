-- ============================================================================
-- TrackMyRC Model Documents (Resources) Migration
-- Date: 2026-03-18
-- Target: Google BigQuery
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
    id            INT64     NOT NULL,
    model_id      INT64     NOT NULL,
    user_id       STRING    NOT NULL,
    filename      STRING    NOT NULL,
    original_name STRING    NOT NULL,
    url           STRING    NOT NULL,
    description   STRING,
    document_type STRING    NOT NULL,
    file_size     INT64     NOT NULL,
    created_at    TIMESTAMP NOT NULL
);

-- ============================================================================
-- Notes for BigQuery usage:
--
-- 1. BigQuery does not support AUTO_INCREMENT — the application generates
--    the `id` value at insert time (using PostgreSQL SERIAL on the
--    primary database; replicated here as INT64 for BigQuery analytics).
--
-- 2. `document_type` is one of: 'manual', 'setup_sheet', 'leaflet', 'other'.
--    The application enforces this constraint at the API layer.
--
-- 3. `filename` holds the GCS object key (e.g. "model-documents/59-1234-abc.pdf").
--    `url` holds the GCS public URL at time of upload (may differ from the
--    protected-endpoint URL returned to clients at query time).
--
-- 4. Ownership is enforced via `user_id`; `model_id` scopes documents to
--    a specific model and must match a row in the `models` table.
-- ============================================================================
