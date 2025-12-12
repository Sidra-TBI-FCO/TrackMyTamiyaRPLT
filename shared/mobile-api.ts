/**
 * Mobile API Types for TrackMyRC
 * 
 * This file documents the API endpoints and types for the React Native mobile app.
 * The mobile app should use these types for type-safe API calls.
 */

// Auth Types
export interface MobileUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  authProvider: string;
  isVerified: boolean | null;
  modelLimit: number | null;
}

export interface AuthResponse {
  user: MobileUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until access token expires
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface GoogleAuthRequest {
  idToken?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Pagination Types
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// Model Types (from schema)
export interface Model {
  id: number;
  userId: string;
  name: string;
  itemNumber: string;
  chassis: string | null;
  releaseYear: number | null;
  buildStatus: string;
  buildType: string;
  totalCost: string | null;
  boxArt: string | null;
  manualUrl: string | null;
  notes: string | null;
  scale: string | null;
  driveType: string | null;
  chassisMaterial: string | null;
  differentialType: string | null;
  motorSize: string | null;
  batteryType: string | null;
  bodyName: string | null;
  bodyItemNumber: string | null;
  bodyManufacturer: string | null;
  tamiyaUrl: string | null;
  tamiyaBaseUrl: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateModelRequest {
  name: string;
  itemNumber: string;
  chassis?: string;
  releaseYear?: number;
  buildStatus?: string;
  buildType?: string;
  totalCost?: string;
  notes?: string;
  scale?: string;
  driveType?: string;
  chassisMaterial?: string;
  differentialType?: string;
  motorSize?: string;
  batteryType?: string;
  bodyName?: string;
  bodyItemNumber?: string;
  bodyManufacturer?: string;
  tags?: string[];
}

// Photo Types
export interface Photo {
  id: number;
  modelId: number;
  filename: string;
  originalName: string;
  url: string;
  caption: string | null;
  metadata: any;
  isBoxArt: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface SignedUrlRequest {
  modelId: number;
  filename: string;
  contentType: string;
}

export interface SignedUrlResponse {
  uploadUrl: string;
  filename: string;
  fileUrl: string;
  expiresAt: string;
}

export interface ConfirmPhotoRequest {
  modelId: number;
  filename: string;
  originalName: string;
  caption?: string;
  isBoxArt?: boolean;
}

// Build Log Types
export interface BuildLogEntry {
  id: number;
  modelId: number;
  entryNumber: number;
  title: string;
  content: string | null;
  voiceNoteUrl: string | null;
  transcription: string | null;
  entryDate: string;
  createdAt: string;
}

// Hop-Up Parts Types
export interface HopUpPart {
  id: number;
  modelId: number;
  name: string;
  itemNumber: string | null;
  category: string;
  supplier: string | null;
  manufacturer: string | null;
  cost: string | null;
  quantity: number;
  installationStatus: string;
  installationDate: string | null;
  notes: string | null;
  photoId: number | null;
  isTamiyaBrand: boolean;
  productUrl: string | null;
  createdAt: string;
}

/**
 * API Endpoints Reference
 * 
 * Authentication:
 * - POST /api/auth/mobile/login - Login with email/password, returns JWT tokens
 * - POST /api/auth/mobile/register - Register new account, returns JWT tokens
 * - POST /api/auth/mobile/refresh - Refresh access token using refresh token
 * - POST /api/auth/mobile/google - Login/register with Google OAuth token
 * - GET /api/auth/mobile/user - Get current user (requires Bearer token)
 * 
 * Models:
 * - GET /api/models - List user's models (supports ?page=1&limit=20)
 * - GET /api/models/:id - Get single model details
 * - POST /api/models - Create new model
 * - PUT /api/models/:id - Update model
 * - DELETE /api/models/:id - Delete model
 * 
 * Photos:
 * - GET /api/models/:modelId/photos - List model photos (supports pagination)
 * - POST /api/mobile/photos/signed-url - Get signed URL for direct upload
 * - POST /api/mobile/photos/confirm - Confirm photo after signed URL upload
 * - DELETE /api/photos/:id - Delete photo
 * 
 * Build Log:
 * - GET /api/models/:modelId/build-log - List build log entries
 * - POST /api/build-log-entries - Create build log entry
 * - PUT /api/build-log-entries/:id - Update build log entry
 * - DELETE /api/build-log-entries/:id - Delete build log entry
 * 
 * Hop-Up Parts:
 * - GET /api/models/:modelId/hop-up-parts - List hop-up parts
 * - POST /api/hop-up-parts - Create hop-up part
 * - PUT /api/hop-up-parts/:id - Update hop-up part
 * - DELETE /api/hop-up-parts/:id - Delete hop-up part
 * 
 * Files:
 * - GET /api/files/:filename - Serve file (photos, etc.)
 * 
 * Authentication Header:
 * All protected endpoints require: Authorization: Bearer <accessToken>
 */

export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-production-url.run.app'
  : 'http://localhost:5000';
