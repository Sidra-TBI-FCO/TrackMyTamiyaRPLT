import { Storage } from '@google-cloud/storage';
import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

// Initialize Google Cloud Storage
let googleStorage: Storage | null = null;
let replitStorage: Client | null = null;

try {
  // Parse the service account JSON from environment variable
  const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    googleStorage = new Storage({
      projectId: credentials.project_id,
      credentials: credentials
    });
    console.log('Google Cloud Storage initialized successfully');
  } else {
    console.log('Google Cloud Storage credentials not found, falling back to Replit Object Storage');
  }
} catch (error) {
  console.error('Failed to initialize Google Cloud Storage:', error);
  console.log('Falling back to Replit Object Storage');
}

try {
  // Initialize Replit Object Storage as fallback
  replitStorage = new Client();
  console.log('Replit Object Storage initialized successfully');
} catch (error) {
  console.error('Failed to initialize Replit Object Storage:', error);
  if (!googleStorage) {
    throw new Error('No storage service is available');
  }
}

export interface FileStorageService {
  uploadFile(file: Express.Multer.File, filename: string): Promise<string>;
  deleteFile(filename: string): Promise<void>;
  getFileUrl(filename: string): string;
  downloadFile(filename: string): Promise<Buffer>;
}

class GoogleCloudStorage implements FileStorageService {
  private bucketName = 'trackmyrc-bucket';

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    if (!googleStorage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    const fileBuffer = fs.readFileSync(file.path);
    const bucket = googleStorage.bucket(this.bucketName);
    const fileObj = bucket.file(filename);
    
    try {
      // Upload to Google Cloud Storage
      await fileObj.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype || 'application/octet-stream',
        },
        resumable: false
      });

      // Clean up local temp file
      fs.unlinkSync(file.path);

      return filename;
    } catch (error) {
      console.error('Google Cloud Storage upload error:', error);
      throw new Error(`Failed to upload file to Google Cloud Storage: ${(error as any).message}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    if (!googleStorage) return;

    try {
      const bucket = googleStorage.bucket(this.bucketName);
      await bucket.file(filename).delete();
    } catch (error) {
      console.error('Google Cloud Storage delete error:', error);
      // Don't throw error for delete failures
    }
  }

  getFileUrl(filename: string): string {
    // For Google Cloud Storage, we'll serve files through our own endpoint
    // to maintain consistent authentication and access control
    return `/api/files/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    if (!googleStorage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = googleStorage.bucket(this.bucketName);
      const file = bucket.file(filename);
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      console.error('Google Cloud Storage download error:', error);
      throw new Error(`Failed to download file from Google Cloud Storage: ${(error as any).message}`);
    }
  }
}

class ReplitObjectStorage implements FileStorageService {
  private bucketName = 'MyTamTrackPhotos';

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
    return `/api/files/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    if (!replitStorage) {
      throw new Error('Replit Object Storage not initialized');
    }

    try {
      const result = await replitStorage.downloadAsBytes(filename);
      
      let buffer: Buffer;
      
      // Handle different response formats from Replit Object Storage
      if (result && typeof result === 'object' && Array.isArray(result) && result.length > 0 && result[0].type === 'Buffer' && result[0].data) {
        buffer = Buffer.from(result[0].data);
      } else if (result && typeof result === 'object' && (result as any).ok && (result as any).value) {
        const value = (result as any).value;
        if (Buffer.isBuffer(value)) {
          buffer = value;
        } else if (value instanceof Uint8Array) {
          buffer = Buffer.from(value);
        } else if (Array.isArray(value) && value.length === 1) {
          const bufferData = value[0];
          if (Buffer.isBuffer(bufferData)) {
            buffer = bufferData;
          } else if (bufferData instanceof Uint8Array) {
            buffer = Buffer.from(bufferData);
          } else {
            throw new Error('Unable to parse buffer from Replit Object Storage response');
          }
        } else {
          throw new Error('Unable to parse buffer from Replit Object Storage response');
        }
      } else {
        throw new Error('Invalid response format from Replit Object Storage');
      }

      return buffer;
    } catch (error) {
      console.error('Replit storage download error:', error);
      throw new Error(`Failed to download file from Replit storage: ${(error as any).message}`);
    }
  }
}

// Hybrid storage that tries Google Cloud Storage first, falls back to Replit Object Storage
class HybridFileStorage implements FileStorageService {
  private googleCloudStorage = new GoogleCloudStorage();
  private replitObjectStorage = new ReplitObjectStorage();

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    // Always upload to Google Cloud Storage if available
    if (googleStorage) {
      return await this.googleCloudStorage.uploadFile(file, filename);
    } else {
      return await this.replitObjectStorage.uploadFile(file, filename);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    // Try to delete from both storage systems (for migration purposes)
    if (googleStorage) {
      await this.googleCloudStorage.deleteFile(filename);
    }
    if (replitStorage) {
      await this.replitObjectStorage.deleteFile(filename);
    }
  }

  getFileUrl(filename: string): string {
    // Always use the same URL format for consistency
    return `/api/files/${filename}`;
  }

  async downloadFile(filename: string): Promise<Buffer> {
    // Try Google Cloud Storage first, fall back to Replit Object Storage
    if (googleStorage) {
      try {
        return await this.googleCloudStorage.downloadFile(filename);
      } catch (error) {
        console.log(`File not found in Google Cloud Storage, trying Replit Object Storage: ${filename}`);
        // Fall back to Replit Object Storage for existing files
        if (replitStorage) {
          return await this.replitObjectStorage.downloadFile(filename);
        }
        throw error;
      }
    } else {
      return await this.replitObjectStorage.downloadFile(filename);
    }
  }
}

// Use hybrid storage to support migration from Replit to Google Cloud Storage
export const fileStorage: FileStorageService = new HybridFileStorage();

// Log which storage system is being used
if (googleStorage) {
  console.log('File storage: Google Cloud Storage (primary) with Replit Object Storage (fallback)');
} else {
  console.log('File storage: Replit Object Storage only');
}