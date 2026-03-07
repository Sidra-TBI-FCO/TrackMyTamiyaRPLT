# TrackMyRC - RC Collection Manager

### Overview
TrackMyRC is a comprehensive web application for tracking and managing RC car model collections. It enables users to manage models, organize photos, log builds with voice notes, track hop-up parts, and view photo slideshows. The application is designed with a mobile-first approach, featuring a green and orange color scheme, and aims to be the go-to platform for RC enthusiasts to manage their collections. It supports community sharing of models, build logs, and comments, alongside administrative tools for managing dropdown field options.

### User Preferences
- Preferred communication style: Simple, everyday language.
- Production database: Google BigQuery (NOT PostgreSQL) - always write migrations in BigQuery SQL syntax.

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
-   **Schema:** Includes Users, Models, Photos, Build Log Entries, Hop-Up Parts, Build Log Photos, Model Comments, and Field Options tables.
-   **Key Features:**
    -   **Model Management:** CRUD operations, build status tracking, TamiyaBase data scraping integration.
    -   **Photo System:** Multi-file upload, metadata, box art designation, Replit Object Storage integration for unified storage.
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

### Recent Migrations
-   **2025-12-field-options-management.sql**: Creates the field_options table for admin-managed dropdown values. Automatically populates with existing values from models and hop_up_parts tables, plus default options. Run this on production database to enable the Field Options admin feature.
-   **2025-12-electronics-and-hopup-library.sql**: Creates tables for electronics tracking (motors, escs, servos, receivers, model_electronics) and hop_up_library for global parts catalog. Written in BigQuery SQL syntax.