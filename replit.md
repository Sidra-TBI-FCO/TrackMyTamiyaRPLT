# TrackMyRC - RC Collection Manager

### Overview
TrackMyRC is a comprehensive web application for tracking and managing RC car model collections. It enables users to manage models, organize photos, log builds with voice notes, track hop-up parts, and view photo slideshows. The application is designed with a mobile-first approach, featuring a green and orange color scheme, and aims to be the go-to platform for RC enthusiasts to manage their collections. It supports community sharing of models, build logs, and comments, alongside administrative tools for managing dropdown field options.

### User Preferences
Preferred communication style: Simple, everyday language.

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

### Recent Migrations
-   **2025-12-field-options-management.sql**: Creates the field_options table for admin-managed dropdown values. Automatically populates with existing values from models and hop_up_parts tables, plus default options. Run this on production database to enable the Field Options admin feature.