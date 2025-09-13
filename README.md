# TrackMyRC - RC Collection Manager

A comprehensive web application for tracking and managing RC car model collections. TrackMyRC helps enthusiasts organize their models, document build progress, track hop-up parts, and manage photo galleries with professional slideshow capabilities.

## 🏁 Overview

TrackMyRC is designed for RC car enthusiasts who want to:
- **Organize their collection** with detailed model information and Tamiya item number integration
- **Document build progress** with timeline-based logging and voice note transcription
- **Track performance upgrades** with hop-up parts inventory and cost analysis
- **Manage photo galleries** with metadata, captions, and slideshow presentation modes
- **Access on mobile** with responsive design optimized for workshop and field use

## ✨ Key Features

### 🚗 Model Management
- **Comprehensive Model Database**: Track Tamiya RC models with automatic data scraping from item numbers
- **Build Status Tracking**: Monitor progress through planning, building, built, and maintenance phases
- **Box Art Integration**: Designate and display official box art alongside model photos
- **Custom Metadata**: Add personal notes, purchase dates, and custom categorization
- **Search & Filter**: Advanced filtering by status, category, and custom attributes

### 📸 Photo System
- **Multi-File Upload**: Drag-and-drop interface supporting JPG, PNG, GIF, WebP, HEIC, and HEIF formats
- **Smart Organization**: Automatic file type detection and metadata extraction
- **Gallery Management**: Lightbox viewing with caption editing and batch operations
- **Box Art Selection**: Designate official product photos for model representation
- **Mobile Optimized**: Enhanced compatibility with mobile camera uploads (15MB max for high-quality photos)
- **Cloud Storage**: Integrated with Google Cloud Storage for reliable, scalable file management

### 📝 Build Logging
- **Timeline Documentation**: Chronological build progress with rich text entries
- **Voice Note Integration**: Record voice notes with automatic transcription support
- **Photo Attachments**: Link multiple photos to specific build entries
- **Progress Tracking**: Visual timeline showing build phases and completion status
- **Search & Export**: Full-text search across all build entries with export capabilities

### ⚙️ Hop-Up Parts Tracking
- **Parts Catalog**: Comprehensive database of performance upgrades and modifications
- **Installation Status**: Track installed, planned, and wishlist items
- **Cost Analysis**: Monitor investment with detailed cost breakdowns and ROI calculations
- **Supplier Management**: Track vendors, part numbers, and purchase history
- **Photo Documentation**: Visual record of modifications and installations
- **Category Organization**: Group parts by type (engine, suspension, drivetrain, etc.)

### 🎨 Slideshow & Presentation
- **Photo Frame Mode**: Full-screen slideshow for displaying collection photos
- **Customizable Transitions**: Multiple transition effects and timing controls
- **Metadata Display**: Optional overlay of model information and build details
- **Remote Control**: Touch and keyboard navigation for presentation control
- **Export Options**: Generate presentation-ready photo collections

### 🔐 Authentication & Security
- **Dual Authentication System**: 
  - **Replit OIDC**: Quick login for Replit users with automatic profile sync
  - **Email/Password**: Traditional registration with email verification
- **Session Management**: Secure session handling with automatic timeout
- **Environment Detection**: Automatic auth method selection based on deployment environment
- **Password Security**: Bcrypt hashing with salt for secure password storage
- **Email Verification**: Token-based email verification system (ready for SMTP integration)

### 🎨 Theming & Customization
- **Dual Color Schemes**:
  - **Military Theme** (Default): Green primary with orange accents
  - **Tamiya Theme**: Classic red primary with blue accents
- **Dark/Light Mode**: Automatic theme switching with CSS variable system
- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Brand Consistency**: Cohesive color system across all components and pages

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type-safe component development
- **Wouter** for lightweight client-side routing
- **TanStack Query** for server state management and caching
- **React Hook Form** with Zod validation for robust form handling
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** with custom design tokens and theme system
- **Framer Motion** for smooth animations and transitions

### Backend Architecture
- **Express.js** with TypeScript for RESTful API development
- **Drizzle ORM** with PostgreSQL for type-safe database operations
- **Multer** middleware for multipart file upload handling
- **Passport.js** for authentication strategy management
- **Express Session** with connect-pg-simple for session persistence
- **Bcrypt** for secure password hashing

### Database Schema
```typescript
// Core entities with relationships
Users ──── Models ──── Photos
  │         │          │
  └─── BuildLogEntries ─┘
  │         │
  └─── HopUpParts ───── BuildLogPhotos
```

**Key Tables:**
- **users**: Authentication and profile data
- **models**: RC model information with Tamiya integration
- **photos**: File storage with metadata and captions
- **buildLogEntries**: Timeline-based build documentation
- **hopUpParts**: Performance upgrade tracking
- **buildLogPhotos**: Junction table linking photos to build entries

### Cloud Infrastructure
- **Google Cloud SQL**: Managed PostgreSQL with connection pooling
- **Google Cloud Storage**: Scalable object storage for photos and files
- **Google Cloud Run**: Containerized deployment with auto-scaling
- **Google Cloud Build**: CI/CD pipeline with GitHub integration
- **Google OAuth 2.0**: Secure authentication integration

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm
- PostgreSQL database (local or cloud)
- Google Cloud account (for production deployment)

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/trackmyrc.git
   cd trackmyrc
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure database connection
   DATABASE_URL="postgresql://user:password@localhost:5432/trackmyrc"
   
   # Set authentication keys (optional for development)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

4. **Database setup**:
   ```bash
   # Generate and apply database schema
   npm run db:generate
   npm run db:push
   ```

5. **Start development server**:
   ```bash
   npm run dev
   ```

   Access the application at `http://localhost:5000`

### Production Deployment

#### Google Cloud Platform

1. **Enable required APIs**:
   ```bash
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   gcloud services enable sqladmin.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Create Cloud SQL database**:
   ```bash
   gcloud sql instances create trackmyrc-db \
     --database-version=POSTGRES_14 \
     --tier=db-f1-micro \
     --region=us-central1
   
   gcloud sql databases create trackmyrc \
     --instance=trackmyrc-db
   ```

3. **Create Cloud Storage bucket**:
   ```bash
   gsutil mb gs://trackmyrc-photos
   ```

4. **Deploy with Cloud Build**:
   ```bash
   # Create build trigger (for public repositories)
   gcloud builds triggers create github \
     --name="trackmyrc-deploy" \
     --repo-name=trackmyrc \
     --repo-owner=yourusername \
     --branch-pattern="^main$" \
     --build-config=cloudbuild.yaml
   ```

5. **Configure environment variables**:
   ```bash
   gcloud run services update trackmyrc \
     --set-env-vars="NODE_ENV=production" \
     --set-env-vars="DATABASE_URL=postgresql://user:pass@/trackmyrc?host=/cloudsql/project:region:instance" \
     --region=us-central1
   ```

## 📖 Usage Guide

### Model Management

1. **Adding a New Model**:
   - Navigate to Models page
   - Click "Add Model" button
   - Enter Tamiya item number for automatic data population
   - Add custom notes and categorization
   - Upload box art and initial photos

2. **Tracking Build Progress**:
   - Select model from collection
   - Update build status (Planning → Building → Built → Maintenance)
   - Add build log entries with photos and voice notes
   - Monitor completion percentage

### Photo Organization

1. **Uploading Photos**:
   - Use drag-and-drop interface or file selector
   - Multiple file formats supported (JPG, PNG, GIF, WebP, HEIC, HEIF)
   - Automatic metadata extraction and thumbnail generation
   - Add captions and categorize photos

2. **Gallery Management**:
   - Browse photos in grid or list view
   - Use lightbox for detailed viewing
   - Edit captions and metadata
   - Designate box art for models

### Build Logging

1. **Creating Build Entries**:
   - Select model and click "Add Build Entry"
   - Write detailed progress notes
   - Record voice notes for hands-free documentation
   - Attach relevant photos to the entry

2. **Voice Note Features**:
   - Browser-based recording with automatic transcription
   - Edit transcribed text for accuracy
   - Link voice notes to specific build phases

### Hop-Up Parts Tracking

1. **Adding Performance Parts**:
   - Browse parts catalog or add custom parts
   - Set installation status (Planned, Installed, Wishlist)
   - Track costs and suppliers
   - Document installation with photos

2. **Cost Analysis**:
   - View total investment per model
   - Generate cost reports by category
   - Track ROI and performance improvements

## 🔧 API Documentation

### Authentication Endpoints

```typescript
POST /auth/register
// Register new user with email/password
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}

POST /auth/login
// Login with email/password
{
  "email": "user@example.com", 
  "password": "securepassword"
}

GET /auth/google
// Initiate Google OAuth flow

POST /auth/logout
// Logout current user
```

### Models API

```typescript
GET /api/models
// Get all models for authenticated user

POST /api/models
// Create new model
{
  "tamiyaItemNumber": "58001",
  "name": "Sand Rover",
  "status": "planning",
  "notes": "First buggy build"
}

PUT /api/models/:id
// Update model details

DELETE /api/models/:id
// Delete model and associated data
```

### Photos API

```typescript
GET /api/photos
// Get all photos with optional model filter

POST /api/photos
// Upload photos (multipart/form-data)
// Files: photo files
// Fields: modelId, captions

PUT /api/photos/:id
// Update photo metadata

DELETE /api/photos/:id
// Delete photo from storage and database
```

### Build Log API

```typescript
GET /api/models/:id/build-log
// Get build log entries for model

POST /api/models/:id/build-log
// Create build log entry
{
  "content": "Installed new motor",
  "voiceNote": "audio file (optional)",
  "photoIds": ["photo1", "photo2"]
}

PUT /api/build-log/:id
// Update build log entry

DELETE /api/build-log/:id
// Delete build log entry
```

### Hop-Up Parts API

```typescript
GET /api/hop-up-parts
// Get hop-up parts with optional filters

POST /api/hop-up-parts
// Add new hop-up part
{
  "name": "Ball Bearing Set",
  "category": "drivetrain",
  "modelId": "model123",
  "status": "installed",
  "cost": 29.99,
  "supplier": "Tamiya"
}

PUT /api/hop-up-parts/:id
// Update part information

DELETE /api/hop-up-parts/:id
// Delete hop-up part
```

## 🛠️ Development

### Project Structure
```
trackmyrc/
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/           # Route-specific page components
│   ├── lib/             # Utilities and configurations
│   └── hooks/           # Custom React hooks
├── server/              # Express.js backend
│   ├── routes.ts        # API route definitions
│   ├── db.ts            # Database configuration
│   ├── storage-service.ts # File storage handling
│   └── auth/            # Authentication strategies
├── shared/              # Shared TypeScript types
│   └── schema.ts        # Database schema and types
├── cloudbuild.yaml      # Google Cloud Build configuration
├── Dockerfile           # Container configuration
└── package.json         # Dependencies and scripts
```

### Database Schema Management

```bash
# Generate schema changes
npm run db:generate

# Apply changes to database
npm run db:push

# Reset database (development only)
npm run db:push --force
```

### Code Quality

```bash
# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## 🎨 Customization

### Theme Configuration

Modify `client/src/index.css` to customize colors:

```css
:root {
  /* Military theme (default) */
  --theme-primary: hsl(120, 30%, 25%);    /* Green */
  --theme-secondary: hsl(25, 90%, 55%);   /* Orange */
}

.tamiya-theme {
  /* Tamiya theme */
  --theme-primary: hsl(0, 80%, 50%);      /* Red */
  --theme-secondary: hsl(220, 80%, 50%);  /* Blue */
}
```

### Component Customization

All UI components use the centralized theme system:

```typescript
// Use theme colors in components
className="bg-[var(--theme-primary)] text-white"
className="border-[var(--theme-secondary)]"
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/new-feature`
3. **Follow coding standards**: TypeScript, ESLint configuration
4. **Add tests** for new functionality
5. **Update documentation** as needed
6. **Submit pull request** with detailed description

### Development Guidelines

- **Type Safety**: Use TypeScript throughout, avoid `any` types
- **Error Handling**: Implement comprehensive error boundaries and validation
- **Accessibility**: Follow WCAG guidelines, use semantic HTML and ARIA labels
- **Performance**: Optimize images, implement lazy loading, minimize bundle size
- **Security**: Validate all inputs, sanitize data, use HTTPS in production

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs and feature requests via GitHub Issues
- **Discussions**: Community support via GitHub Discussions
- **Email**: Contact maintainers for security issues

## 🔮 Roadmap

### Planned Features
- **PDF Export**: Generate detailed collection reports and build documentation
- **Advanced Search**: Full-text search across all content with filters
- **Social Features**: Share builds and photos with the RC community
- **Mobile App**: Native iOS/Android applications
- **Integration APIs**: Connect with hobby store inventories and pricing
- **Advanced Analytics**: Build time tracking, cost analysis, and performance metrics

### Technical Improvements
- **Progressive Web App**: Offline functionality and app-like experience
- **Real-time Sync**: Live updates across multiple devices
- **Advanced Caching**: Improved performance with service workers
- **Backup & Export**: Complete data export and import functionality
- **Admin Dashboard**: User management and system monitoring tools

---

**TrackMyRC** - Built with ❤️ for the RC community

[![Deploy to Google Cloud](https://github.com/GoogleCloudPlatform/github-actions/workflows/Deploy%20to%20Cloud%20Run/badge.svg)](https://github.com/GoogleCloudPlatform/github-actions/workflows/Deploy%20to%20Cloud%20Run)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Google Cloud](https://img.shields.io/badge/Google_Cloud-4285F4?style=flat&logo=google-cloud&logoColor=white)](https://cloud.google.com/)
# Trigger new build
# Trigger new build