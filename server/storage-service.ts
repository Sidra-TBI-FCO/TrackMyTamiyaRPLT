import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

// Use Replit Object Storage for persistent storage in production
const useReplitStorage = process.env.NODE_ENV === 'production' && process.env.REPLIT_DB_URL;

let replitStorage: Client | null = null;

if (useReplitStorage) {
  try {
    // Initialize with a bucket name for Replit Object Storage
    replitStorage = new Client();
    console.log('Replit Object Storage initialized successfully');
  } catch (error) {
    console.log('Replit Object Storage not available, falling back to local storage:', error);
    useReplitStorage && console.log('Note: Replit Object Storage requires proper setup for persistent file storage');
  }
}

export interface FileStorageService {
  uploadFile(file: Express.Multer.File, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
}

class LocalFileStorage implements FileStorageService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    // File is already saved by multer, just return the filename
    return filename;
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getFileUrl(filename: string): string {
    return `/uploads/${filename}`;
  }
}

class ReplitObjectStorage implements FileStorageService {
  private bucketName = 'MyTamTrackPhotos'; // Use the user's created bucket

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    if (!replitStorage) {
      throw new Error('Replit Object Storage not initialized');
    }

    const fileBuffer = fs.readFileSync(file.path);
    
    try {
      // Upload to Replit Object Storage
      await replitStorage.uploadFromBytes(filename, fileBuffer);

      // Clean up local temp file
      fs.unlinkSync(file.path);

      return filename;
    } catch (error) {
      console.error('Replit storage upload error:', error);
      throw new Error(`Failed to upload file to Replit storage: ${(error as any).message}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    if (!replitStorage) return;

    try {
      await replitStorage.delete(filename);
    } catch (error) {
      console.error('Replit storage delete error:', error);
      // Don't throw error for delete failures
    }
  }

  getFileUrl(filename: string): string {
    if (!replitStorage) {
      return `/uploads/${filename}`;
    }
    
    try {
      // For Replit Object Storage, we need to serve files through our own endpoint
      return `/api/files/${filename}`;
    } catch (error) {
      console.error('Failed to get Replit storage URL:', error);
      return `/uploads/${filename}`;
    }
  }
}

// Export the appropriate storage service
export const fileStorage: FileStorageService = (replitStorage)
  ? new ReplitObjectStorage() 
  : new LocalFileStorage();

export const isUsingReplitStorage = replitStorage !== null;

// Log which storage is being used
console.log(`File storage: ${isUsingReplitStorage ? 'Replit Object Storage (persistent)' : 'Local filesystem (temporary in production)'}`);