import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Check if we should use cloud storage or local storage
const useCloudStorage = process.env.NODE_ENV === 'production' && 
                       process.env.SUPABASE_URL && 
                       process.env.SUPABASE_ANON_KEY;

let supabase: any = null;

if (useCloudStorage) {
  supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!
  );
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

class CloudFileStorage implements FileStorageService {
  private bucket = 'trackmytamiya-uploads';

  async uploadFile(file: Express.Multer.File, filename: string): Promise<string> {
    const fileBuffer = fs.readFileSync(file.path);
    
    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(filename, fileBuffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Cloud upload error:', error);
      throw new Error(`Failed to upload file to cloud storage: ${error.message}`);
    }

    // Clean up local temp file
    fs.unlinkSync(file.path);

    return filename;
  }

  async deleteFile(filename: string): Promise<void> {
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove([filename]);

    if (error) {
      console.error('Cloud delete error:', error);
      // Don't throw error for delete failures
    }
  }

  getFileUrl(filename: string): string {
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(filename);
    
    return data.publicUrl;
  }
}

// Export the appropriate storage service
export const fileStorage: FileStorageService = useCloudStorage 
  ? new CloudFileStorage() 
  : new LocalFileStorage();

export const isUsingCloudStorage = useCloudStorage;