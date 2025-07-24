# TrackMyTamiya - RC Collection Manager

## Overview

TrackMyTamiya is a comprehensive web application for tracking and managing Tamiya RC car model collections. The application provides features for model management, photo organization, build logging with voice notes, hop-up parts tracking, and a photo frame slideshow mode. It's designed with Tamiya's signature red, white, and blue branding and targets mobile-first usage for on-the-go collection management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a full-stack TypeScript architecture with a React frontend, Express.js backend, and PostgreSQL database. It uses modern web technologies including shadcn/ui components, Tailwind CSS for styling, and Drizzle ORM for database management.

### Architecture Pattern
- **Frontend**: Single Page Application (SPA) with React and TypeScript
- **Backend**: REST API built with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Build System**: Vite for frontend bundling, esbuild for backend compilation
- **Styling**: Tailwind CSS with custom Tamiya brand colors
- **Component Library**: shadcn/ui with Radix UI primitives

## Key Components

### Frontend Architecture
- **Router**: Wouter for client-side routing
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Framework**: React with TypeScript, shadcn/ui components
- **Styling**: Tailwind CSS with custom design tokens matching Tamiya branding
- **File Structure**: Feature-based organization with shared components

### Backend Architecture
- **Server Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints with consistent error handling
- **File Uploads**: Multer middleware for photo and audio file handling
- **Database Layer**: Drizzle ORM with connection pooling via Neon serverless
- **Authentication**: Placeholder mock authentication (to be implemented)

### Database Schema
The application uses a relational PostgreSQL schema with the following main entities:

- **Users**: Basic user authentication and identification
- **Models**: RC car model information with Tamiya item numbers, build status, and metadata
- **Photos**: Image storage with metadata, captions, and box art designation
- **Build Log Entries**: Timeline-based build documentation with voice notes and transcription
- **Hop-Up Parts**: Performance upgrade tracking with installation status and costs
- **Build Log Photos**: Junction table linking photos to build entries

### Core Features Implementation

1. **Model Management**
   - CRUD operations for Tamiya RC models
   - Automatic data scraping from TamiyaBase using item numbers
   - Build status tracking (planning, building, built, maintenance)
   - Photo gallery integration with box art selection

2. **Photo System**
   - Multi-file upload with drag-and-drop
   - Image storage with metadata and captions
   - Gallery view with lightbox functionality
   - Box art designation and sorting capabilities

3. **Build Logging**
   - Timeline-based entry system
   - Voice recording with transcription support
   - Rich text content with photo attachments
   - Progress tracking integration

4. **Hop-Up Parts Tracking**
   - Parts catalog with categories and suppliers
   - Installation status and cost tracking
   - Photo documentation for modifications
   - Investment calculation and reporting

## Data Flow

### Client-Server Communication
- REST API endpoints with JSON payloads
- File uploads via multipart form data
- Real-time UI updates using TanStack Query mutations
- Error handling with toast notifications

### Database Operations
- Drizzle ORM provides type-safe database queries
- Connection pooling through Neon serverless PostgreSQL
- Automatic schema migrations via drizzle-kit
- Foreign key relationships maintain data integrity

### File Storage
- **Unified Storage**: Replit Object Storage integration with bucket "MyTamTrackPhotos" for persistent storage across all environments
- Supports multiple file types: images (JPG, PNG, GIF, WebP, HEIC, HEIF), audio (MP3, WAV, AAC), documents (PDF, DOC)
- Enhanced mobile compatibility with flexible file type detection
- Unique filename generation to prevent conflicts
- File type validation and size limits (15MB max for high-quality mobile photos)
- Direct file serving through optimized API endpoints with proper MIME type detection
- Comprehensive CORS support for mobile browsers and production deployments

## External Dependencies

### Primary Dependencies
- **Database**: Neon PostgreSQL serverless with connection pooling
- **UI Components**: Radix UI primitives through shadcn/ui
- **Styling**: Tailwind CSS with PostCSS processing
- **File Handling**: Multer for multipart uploads
- **Voice Processing**: Web Speech API with server-side transcription fallback
- **Data Scraping**: Planned integration with TamiyaBase and official Tamiya sources

### Development Tools
- **Build Tools**: Vite for frontend, esbuild for backend
- **Type Safety**: TypeScript with strict configuration
- **Schema Validation**: Zod with Drizzle integration
- **Code Quality**: ESLint and Prettier (implied by structure)

### Runtime Dependencies
- **Query Management**: TanStack React Query for server state
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for formatting and manipulation
- **Routing**: Wouter for lightweight client-side routing

## Deployment Strategy

### Development Environment
- Hot reload development server via Vite
- TypeScript compilation with watch mode
- Database schema synchronization through drizzle-kit
- Environment variable configuration for database connection

### Production Build
- Frontend assets bundled and optimized by Vite
- Backend compiled to ESM modules via esbuild
- Static file serving for uploaded content
- Database migrations applied automatically

### Environment Configuration
- Database URL configuration via environment variables
- Upload directory creation and file serving
- Production-ready error handling and logging
- Session management preparation for authentication

The application is designed to be mobile-first with responsive design, supporting both light and dark themes with dynamic Tamiya color swapping (red/blue elements swap in dark mode for optimal branding consistency). The architecture supports future enhancements including PDF export, advanced search, and social features while maintaining clean separation of concerns and type safety throughout the stack.

## Recent Changes (January 2025)

- **Marketing Website**: Complete marketing site with landing, features, screenshots, and download pages
- **Replit Authentication**: Integrated Replit Auth with string-based user IDs and session management
- **Database Migration**: Updated schema to support authentication with proper foreign key constraints
- **Dark Mode Enhancement**: Implemented red-to-blue color swapping in dark mode across all components
- **Tamiya Branding**: Consistent star logo and color scheme throughout marketing and main application
- **Dual Authentication System**: Added traditional email/password registration alongside Replit OIDC authentication
  - Production deployment supports both Replit login and email/password registration
  - Created comprehensive `/auth` page with dual authentication interface
  - Updated database schema with password hashing and authentication provider tracking
  - Landing page offers both "Quick Login (Replit)" and "Create Account" options
  - Environment detection ensures development uses mock auth, production uses real authentication
  - Successfully deployed at https://mytamiyatracker.replit.app/ with working Replit authentication