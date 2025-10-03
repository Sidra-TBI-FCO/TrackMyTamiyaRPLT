import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

// Initialize Google Cloud Storage
let googleStorage: Storage | null = null;

try {
  const serviceAccountJson = process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    const credentials = JSON.parse(serviceAccountJson);
    googleStorage = new Storage({
      projectId: credentials.project_id,
      credentials: credentials
    });
    console.log('✅ Google Cloud Storage initialized successfully');
  } else {
    console.error('❌ Google Cloud Storage credentials not found - GOOGLE_CLOUD_SERVICE_ACCOUNT_JSON missing');
    throw new Error('Google Cloud Storage is required but not configured');
  }
} catch (error) {
  console.error('❌ Failed to initialize Google Cloud Storage:', error);
  throw error;
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
      await fileObj.save(fileBuffer, {
        metadata: {
          contentType: file.mimetype || 'application/octet-stream',
        },
        resumable: false
      });

      // Clean up local temp file
      fs.unlinkSync(file.path);

      console.log(`✅ Uploaded file to GCS: ${filename} (${fileBuffer.length} bytes)`);
      return filename;
    } catch (error) {
      console.error('❌ Google Cloud Storage upload error:', error);
      throw new Error(`Failed to upload file to Google Cloud Storage: ${(error as any).message}`);
    }
  }

  async deleteFile(filename: string): Promise<void> {
    if (!googleStorage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = googleStorage.bucket(this.bucketName);
      await bucket.file(filename).delete();
      console.log(`✅ Deleted file from GCS: ${filename}`);
    } catch (error) {
      console.error('❌ Google Cloud Storage delete error:', error);
      // Don't throw error for delete failures
    }
  }

  getFileUrl(filename: string): string {
    // Serve files through our own endpoint for authentication and access control
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
      console.log(`✅ Downloaded file from GCS: ${filename} (${buffer.length} bytes)`);
      return buffer;
    } catch (error) {
      console.error(`❌ Failed to download file from GCS: ${filename}`, error);
      throw new Error(`Failed to download file from Google Cloud Storage: ${(error as any).message}`);
    }
  }

  async listFiles(prefix?: string): Promise<string[]> {
    if (!googleStorage) {
      throw new Error('Google Cloud Storage not initialized');
    }

    try {
      const bucket = googleStorage.bucket(this.bucketName);
      const [files] = await bucket.getFiles(prefix ? { prefix } : {});
      return files.map(file => file.name);
    } catch (error) {
      console.error('❌ Google Cloud Storage list files error:', error);
      throw new Error(`Failed to list files from Google Cloud Storage: ${(error as any).message}`);
    }
  }
}

// Export singleton instance
export const fileStorage: FileStorageService = new GoogleCloudStorage();

// Export the class for testing purposes
export { GoogleCloudStorage };
