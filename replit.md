# TrackMyRC - RC Collection Manager

### Overview
TrackMyRC is a comprehensive web application for tracking and managing RC car model collections. It enables users to manage models, organize photos, log builds with voice notes, track hop-up parts, and view photo slideshows. The application is designed with a mobile-first approach, featuring a green and orange color scheme, and aims to be the go-to platform for RC enthusiasts to manage their collections. It supports community sharing of models, build logs, and comments, alongside administrative tools for managing dropdown field options.

### User Preferences
- Preferred communication style: Simple, everyday language.
- Production database: Google BigQuery (NOT PostgreSQL) - always write migrations in BigQuery SQL syntax.
- Public-facing contact/feedback email: `trackmyrc25@gmail.com` (used on pricing page and feedback links — NOT the personal email)

### System Architecture
The application employs a full-stack TypeScript architecture, utilizing React for the frontend, Express.js for the backend, and PostgreSQL as the database. It leverages modern web technologies including shadcn/ui components, Tailwind CSS for styling, and Drizzle ORM for database interactions.

**Frontend:**
-   **Framework:** React with TypeScript
-   **Routing:** Wouter
-   **State Management:** TanStack Query for server state
-   **UI:** shadcn/ui components, Tailwind CSS for styling with customizable green/orange themes and responsive design.

**Backend:**
-   **Framework:** Express.js with TypeScript
-   **API:** RESTful endpoints
-   **File Uploads:** Multer middleware for handling photos and audio.
-   **Authentication:** Supports Replit OIDC authentication, traditional email/password, and JWT-based authentication for mobile API.
-   **Mobile API:** JWT-based authentication, signed URL endpoints for photo uploads, and paginated endpoints.

**Database:**
-   **Type:** PostgreSQL with Drizzle ORM.
-   **Hosting:** Neon serverless with connection pooling.
-   **Schema:** Includes Users, Models, Photos, Build Log Entries, Hop-Up Parts, Build Log Photos, Model Comments, Field Options, Electronics, and Hop-Up Library tables.
-   **Key Features:**
    -   **Model Management:** CRUD operations, build status tracking, TamiyaBase data scraping integration.
    -   **Photo System:** Multi-file upload, metadata, box art designation, Replit Object Storage integration for unified storage. Photos with `modelId = null` are used for standalone library item photos.
    -   **Build Logging:** Timeline-based entries, voice recording with transcription support.
    -   **Hop-Up Parts Tracking:** Catalog management, installation status, cost tracking.
    -   **Community Features:** Model sharing with public/authenticated/private visibility, community gallery, comments on shared models, sequential build log display.
    -   **Admin Features:** Dynamic management of dropdown field options (scale, drive type, chassis material, etc.) with add/edit/delete/replace functionality.

**Deployment Strategy:**
-   **Development:** Vite for frontend hot reload, TypeScript compilation, database schema synchronization.
-   **Production:** Optimized frontend assets, backend compiled to ESM modules, static file serving, environment variable configuration for services.

### External Dependencies
-   **Database:** Neon PostgreSQL (serverless).
-   **UI Components:** Radix UI primitives (via shadcn/ui).
-   **Styling:** Tailwind CSS.
-   **File Handling:** Multer (for uploads), Replit Object Storage (for persistent file storage).
-   **Voice Processing:** Web Speech API (with server-side transcription fallback).
-   **Data Scraping:** TamiyaBase (planned integration).
-   **Query Management:** TanStack React Query.
-   **Form Handling:** React Hook Form with Zod validation.
-   **Date Handling:** date-fns.
-   **Routing:** Wouter.

### Username & Profile System
- `username VARCHAR(50) UNIQUE` and `show_real_name BOOLEAN DEFAULT FALSE` on `users` table (T001 migration applied)
- Usernames auto-generated for all existing users on migration; changeable in Settings → Profile
- `showRealName` flag: when false, community shows `username`; when true, shows `firstName + lastName`
- `displayName` computed server-side by `computeDisplayName()` in storage.ts and returned in all community API responses
- Profile image upload: `POST /api/user/profile-image` → saved to GCS under `profile-images/<userId>.<ext>`
- New API routes: `GET /api/user/check-username/:username`, `PUT /api/user/username`, `PUT /api/user/show-real-name`, `POST /api/user/profile-image`
- Community pages (community.tsx, community-model-detail.tsx) use `displayName` + `CommunityAvatar` (photo or colored initial)
- Settings page has "Profile" section: photo upload circle, username input with debounced availability check, show-real-name toggle

### Brand Logos System
- Brand logos for "Print Model Cards" are now admin-managed via the Admin Panel → Logos tab
- Logos are stored in the `brand_logos` table (keyword, display_name, url, is_tamiya_stamp)
- One logo can be marked as "Tamiya Stamp" (shown on all cards top-left); others match by keyword against model names
- The print function fetches logos from `/api/brand-logos` at runtime; falls back to `/brand_logos/*.png` static files in `client/public/brand_logos/`
- Adding new logos no longer requires code changes — upload via admin panel instead

### Print Card Layout Preferences
- Per-user card print settings stored in `card_print_prefs` JSONB column on `users` table
- API: `GET /api/user/card-print-prefs` and `PUT /api/user/card-print-prefs`
- Toggles: RC Brand Logo, Car Make Logo, Chassis, Scale, Item Number, Release Year
- Managed in Settings page → "Print Card Layout" section
- Print function fetches prefs at runtime before generating PDF; defaults shown when unset

### Hop-Up Library System
- The library (`hop_up_library` table) is a **shared, global community database** — all authenticated users can browse and search all items. Edit/delete is owner-only (filtered by `userId`).
- `HopUpLibraryItemWithPhoto` type (in schema.ts) extends `HopUpLibraryItem` with a `photoUrl?: string | null` field, populated by `getHopUpLibraryItems()` via a secondary photos lookup.
- **Auto-population:** when a user adds a new hop-up part to a model that includes an item number, it is automatically added to the shared library (if not already present by item number match). `photoId` is intentionally NOT copied from model parts to library items — model photos are private.
- **Library photos:** users can upload a dedicated photo when adding/editing a library item (`POST/PUT /api/hop-up-library` accept `multipart/form-data` with `libraryPhoto` field). Library photos are stored in the `photos` table with `modelId = null` (standalone, not tied to any model).
- **Add from library to model:** `POST /api/models/:modelId/hop-up-parts/from-library` copies all fields from the library item to a new model part. `photoId` is only copied when the library item has a standalone photo (`modelId = null`).
- Library page (`client/src/pages/hop-up-library.tsx`) shows: explanation banner, photo on each card, photo upload in add/edit dialog.

### Electronics Page
- Electronics items (motors, ESCs, servos, receivers) display product photos at `h-32` (128px) with `object-contain` and a neutral background, so the full component is always visible without cropping.
- Component files: `client/src/pages/electronics.tsx`, `client/src/components/electronics/`

### Model Resources Section
- `model_documents` table: `id`, `model_id`, `user_id`, `filename`, `original_name`, `url`, `description`, `document_type` (manual / setup_sheet / leaflet / other), `file_size`, `created_at`
- Files stored in GCS under `model-documents/<modelId>-<timestamp>-<rand>.<ext>`
- API: `GET/POST /api/models/:modelId/documents`, `PATCH/DELETE /api/models/:modelId/documents/:docId`
- Protected download: `GET /api/models/:modelId/documents/:docId/download` — verifies ownership before streaming from GCS; all URLs returned to clients point to this endpoint (not raw GCS URLs)
- `documentType` validated against explicit enum ('manual', 'setup_sheet', 'leaflet', 'other') in POST and PATCH routes
- Document scanner: camera or file picker → perspective-correction UI with 4 draggable corner handles → homography warp → corrected JPEG uploaded
- **ModelResources** card appears in the model-detail sidebar below Quick Actions; supports Upload File, Scan Document, inline edit (type + description), delete
- Components: `client/src/components/resources/DocumentScanner.tsx`, `client/src/components/resources/ModelResources.tsx`
- BigQuery migration: `migrations/2026-03-model-documents-bigquery.sql`

### Print Card Preview Widget
- Live 270×180 px HTML card mock (exact 90×60mm ratio) rendered inside Settings → Print Card Layout section
- Updates **instantly** as toggles are changed (local state layer on top of server prefs, no API round-trip delay)
- Shows: Tamiya stamp (if RC Brand Logo ON), Lancia logo (if Car Make Logo ON), name "Lancia Delta HF Integrale", chassis "TT-01E" (if Chassis ON), scale "1/10" (if Scale ON), year "1993" (if Release Year ON), item number "58422" (if Item Number ON)
- `ModelCardPreview` component defined inline in `client/src/pages/settings.tsx`
- `cardPrintPrefs` state is now `Partial<typeof DEFAULT_CARD_PREFS>` (starts empty, populated only on toggle) so server prefs are respected on load and local overrides apply immediately on toggle

### Recent Migrations
-   **2025-12-field-options-management.sql**: Creates the field_options table for admin-managed dropdown values. Automatically populates with existing values from models and hop_up_parts tables, plus default options. Run this on production database to enable the Field Options admin feature.
-   **2025-12-electronics-and-hopup-library.sql**: Creates tables for electronics tracking (motors, escs, servos, receivers, model_electronics) and hop_up_library for global parts catalog. Written in BigQuery SQL syntax.
-   **2026-03-model-documents**: `CREATE TABLE model_documents` — applied via executeSql (TLS workaround).
