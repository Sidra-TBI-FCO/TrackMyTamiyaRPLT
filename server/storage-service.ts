import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

// Always use Replit Object Storage for consistent persistent storage
let replitStorage: Client | null = null;

try {
  // Initialize with a bucket name for Replit Object Storage
  replitStorage = new Client();
  console.log('Replit Object Storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Replit Object Storage:', error);
  throw new Error('Replit Object Storage is required but not available');
}

export interface FileStorageService {
  uploadFile(file: Express.Multer.File, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
}

// Removed LocalFileStorage - only using Replit Object Storage now

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

// Always use Replit Object Storage
export const fileStorage: FileStorageService = new ReplitObjectStorage();

// Log that we're using Replit Object Storage
console.log('File storage: Replit Object Storage (persistent)');