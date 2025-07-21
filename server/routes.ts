import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertModelSchema, insertPhotoSchema, insertBuildLogEntrySchema, insertHopUpPartSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileStorage } from "./storage-service";

// Multer configuration for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_multer,
  fileFilter: (req, file, cb) => {
    console.log(`File upload attempt: ${file.originalname}, MIME: ${file.mimetype}, Size: ${file.size || 'unknown'}`);
    
    // Very flexible file type checking for mobile compatibility
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/aac',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/octet-stream', 'binary/octet-stream', '' // Mobile browsers sometimes send empty MIME types
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.pdf', '.doc', '.docx'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Be very permissive for mobile uploads
    const isImageFile = file.mimetype.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'].includes(extension);
    const isAudioFile = file.mimetype.startsWith('audio/') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].includes(extension);
    const isDocFile = file.mimetype.includes('pdf') || file.mimetype.includes('document') || ['.pdf', '.doc', '.docx'].includes(extension);
    const isMobileUpload = !file.mimetype || file.mimetype === 'application/octet-stream';
    
    if (isImageFile || isAudioFile || isDocFile || (isMobileUpload && allowedExtensions.includes(extension))) {
      console.log(`✓ Accepted file: ${file.originalname}`);
      cb(null, true);
    } else {
      console.log(`✗ Rejected file: ${file.originalname}, type: ${file.mimetype}, extension: ${extension}`);
      cb(new Error(`Invalid file type. Allowed: JPG, PNG, GIF, WebP, HEIC, MP3, WAV, PDF, DOC`) as any, false);
    }
  },
  limits: {
    fileSize: 15 * 1024 * 1024, // Increased to 15MB for HEIC and high-quality mobile photos
    files: 10, // Allow up to 10 files per upload
    fieldSize: 2 * 1024 * 1024, // 2MB field size
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files with error handling for missing files
  app.use('/uploads', express.static(uploadDir));

  // Handle missing files gracefully for legacy uploads path
  app.get('/uploads/*', (req, res) => {
    res.status(404).json({ error: 'File not found in this environment' });
  });

  // Mock user authentication - in production, use proper auth
  app.use('/api', (req, res, next) => {
    // For demo purposes, use a mock user ID (matches our demo user)
    (req as any).userId = 2;
    next();
  });

  // Models routes
  app.get('/api/models', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const models = await storage.getModels(userId);
      res.json(models);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/models/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id, userId);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.json(model);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelData = insertModelSchema.parse({ ...req.body, userId });
      const model = await storage.createModel(modelData);
      res.status(201).json(model);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/models/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const modelData = insertModelSchema.partial().parse(req.body);
      const model = await storage.updateModel(id, userId, modelData);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.json(model);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/models/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteModel(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Model not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Photos routes
  app.get('/api/models/:modelId/photos', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      const photos = await storage.getPhotos(modelId, userId);
      res.json(photos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/photos', upload.array('photos', 10), async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      const files = req.files as Express.Multer.File[];
      
      console.log('Upload request received:', {
        modelId,
        filesCount: files?.length || 0,
        body: req.body,
        files: files?.map(f => ({ name: f.originalname, type: f.mimetype, size: f.size }))
      });
      
      if (!files || files.length === 0) {
        console.log('No files received in request');
        return res.status(400).json({ message: 'No photos uploaded' });
      }

      const photos = [];
      for (const file of files) {
        console.log(`Processing file: ${file.originalname}, type: ${file.mimetype}`);
        
        try {
          // Upload file using storage service (Replit Object Storage or local)
          const savedFilename = await fileStorage.uploadFile(file, file.filename);
          const fileUrl = fileStorage.getFileUrl(savedFilename);
          
          const photoData = insertPhotoSchema.parse({
            modelId,
            filename: savedFilename,
            originalName: file.originalname,
            url: fileUrl,
            caption: req.body.caption || null,
            metadata: req.body.metadata ? JSON.parse(req.body.metadata) : null,
            isBoxArt: req.body.isBoxArt === 'true' && photos.length === 0, // Only first photo can be box art
          });

          const photo = await storage.createPhoto(photoData);
          photos.push(photo);
          console.log(`File uploaded to Replit Object Storage: ${savedFilename}`);
        } catch (uploadError: any) {
          console.error(`Failed to upload file ${file.originalname}:`, uploadError);
          // Return partial success with error details for better mobile debugging
          if (photos.length === 0) {
            return res.status(500).json({ 
              message: `Upload failed: ${uploadError.message}`,
              error: 'UPLOAD_FAILED',
              filename: file.originalname
            });
          }
          // Continue with other files if some succeeded
        }
      }

      console.log(`Successfully uploaded ${photos.length} photos`);
      res.status(201).json(photos);
    } catch (error: any) {
      console.error('Photo upload error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/photos/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const photoData = insertPhotoSchema.partial().parse(req.body);
      
      // If setting isBoxArt to true, first set all other photos of the same model to false
      if (photoData.isBoxArt === true) {
        const photo = await storage.getPhoto(id, userId);
        if (photo) {
          await storage.clearModelBoxArt(photo.modelId, userId);
        }
      }
      
      const updatedPhoto = await storage.updatePhoto(id, userId, photoData);
      if (!updatedPhoto) {
        return res.status(404).json({ message: 'Photo not found' });
      }
      res.json(updatedPhoto);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/photos/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const deleted = await storage.deletePhoto(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Photo not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Build log routes
  app.get('/api/models/:modelId/build-logs', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      const entries = await storage.getBuildLogEntries(modelId, userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/build-logs', upload.single('voiceNote'), async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      
      const entryData = insertBuildLogEntrySchema.parse({
        modelId,
        title: req.body.title,
        content: req.body.content,
        voiceNoteUrl: req.file ? `/uploads/${req.file.filename}` : null,
        transcription: req.body.transcription || null,
        entryDate: req.body.entryDate ? new Date(req.body.entryDate) : new Date(),
      });

      const entry = await storage.createBuildLogEntry(entryData);
      
      // Add photos to entry if provided
      if (req.body.photoIds) {
        const photoIds = JSON.parse(req.body.photoIds);
        await storage.addPhotosToEntry(entry.id, photoIds);
      }

      res.status(201).json(entry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/build-logs/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const entryData = insertBuildLogEntrySchema.partial().parse(req.body);
      const entry = await storage.updateBuildLogEntry(id, userId, entryData);
      if (!entry) {
        return res.status(404).json({ message: 'Build log entry not found' });
      }
      res.json(entry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/build-logs/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBuildLogEntry(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Build log entry not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Hop-up parts routes
  app.get('/api/models/:modelId/hop-up-parts', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      const parts = await storage.getHopUpParts(modelId, userId);
      res.json(parts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/hop-up-parts', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const modelId = parseInt(req.params.modelId);
      const partData = insertHopUpPartSchema.parse({ ...req.body, modelId });
      const part = await storage.createHopUpPart(partData);
      res.status(201).json(part);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/hop-up-parts/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const partData = insertHopUpPartSchema.partial().parse(req.body);
      const part = await storage.updateHopUpPart(id, userId, partData);
      if (!part) {
        return res.status(404).json({ message: 'Hop-up part not found' });
      }
      res.json(part);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/hop-up-parts/:id', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteHopUpPart(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Hop-up part not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const userId = (req as any).userId;
      const stats = await storage.getCollectionStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // File serving endpoint for Replit Object Storage
  app.get('/api/files/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      console.log(`Attempting to serve file: ${filename}`);
      
      const { Client } = await import('@replit/object-storage');
      const client = new Client();
      
      // Get raw bytes from Replit Object Storage
      console.log(`Downloading file: ${filename}`);
      
      // The downloadAsBytes returns a wrapped response
      const result = await client.downloadAsBytes(filename);
      console.log('Raw result type:', typeof result);
      console.log('Array check:', Array.isArray(result));
      console.log('Result keys:', Object.keys(result || {}));
      
      let buffer: Buffer;
      
      // The result appears to be an object that directly contains the Buffer data array
      if (result && typeof result === 'object' && Array.isArray(result) && result.length > 0 && result[0].type === 'Buffer' && result[0].data) {
        // Direct array format: [{"type":"Buffer","data":[...]}]
        buffer = Buffer.from(result[0].data);
        console.log(`Successfully extracted buffer from array, size: ${buffer.length} bytes`);
      } else if (result && typeof result === 'object' && (result as any).ok && (result as any).value) {
        // Wrapped format: {"ok":true,"value": Buffer } - the value might be a Buffer directly
        console.log('Found wrapped format with ok and value');
        const value = (result as any).value;
        console.log('Value is array:', Array.isArray(value));
        
        if (Buffer.isBuffer(value)) {
          // Value is directly a Buffer
          buffer = value;
          console.log(`Successfully extracted buffer directly from value, size: ${buffer.length} bytes`);
        } else if (value instanceof Uint8Array) {
          // Value is a Uint8Array  
          buffer = Buffer.from(value);
          console.log(`Successfully converted Uint8Array to buffer, size: ${buffer.length} bytes`);
        } else if (Array.isArray(value) && value.length === 1) {
          // Value is an array with one element - extract the buffer from the array
          const bufferData = value[0];
          if (Buffer.isBuffer(bufferData)) {
            buffer = bufferData;
            console.log(`Successfully extracted buffer from array element, size: ${buffer.length} bytes`);
          } else if (bufferData instanceof Uint8Array) {
            buffer = Buffer.from(bufferData);
            console.log(`Successfully converted Uint8Array from array, size: ${buffer.length} bytes`);
          } else {
            // Try to create buffer from the array element data  
            try {
              buffer = Buffer.from(bufferData);
              console.log(`Successfully created buffer from array element, size: ${buffer.length} bytes`);
            } catch (error) {
              console.error('Failed to create buffer from array element:', typeof bufferData);
              throw new Error('Unable to process array element as buffer');
            }
          }
        } else {
          // Try to interpret as raw bytes
          try {
            buffer = Buffer.from(value);
            console.log(`Successfully created buffer from raw data, size: ${buffer.length} bytes`);
          } catch (error) {
            console.error('Failed to create buffer from value:', {
              valueType: typeof value,
              isArray: Array.isArray(value),
              valueConstructor: value?.constructor?.name
            });
            throw new Error('Unable to process value as buffer data');
          }
        }
      } else if (result && typeof result === 'object' && !Array.isArray(result)) {
        // The result is an object, let's check if it contains the buffer data directly
        const keys = Object.keys(result);
        console.log('Object keys:', keys);
        
        // Check if this is the Buffer object format with type and data properties
        if ((result as any).type === 'Buffer' && (result as any).data) {
          buffer = Buffer.from((result as any).data);
          console.log(`Successfully extracted buffer from object, size: ${buffer.length} bytes`);
        } else {
          console.error('Unexpected object structure:', JSON.stringify(result).substring(0, 200));
          throw new Error('Unable to parse buffer from storage response');
        }
      } else if (result instanceof Uint8Array) {
        buffer = Buffer.from(result);
      } else if (Buffer.isBuffer(result)) {
        buffer = result;
      } else {
        console.error('Unexpected result structure:', typeof result, Object.keys(result || {}));
        throw new Error('Unable to process file data from storage');
      }
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.pdf': 'application/pdf'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', buffer.length.toString());
      
      console.log(`Successfully serving file: ${filename}, type: ${contentType}, size: ${buffer.length} bytes`);
      res.send(buffer);
    } catch (error: any) {
      console.error('File serving error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        filename: req.params.filename
      });
      res.status(404).json({ message: 'File not found', error: error.message });
    }
  });

  // Tamiya scraping route
  app.post('/api/scrape-tamiya', async (req, res) => {
    try {
      const { itemNumber } = req.body;
      if (!itemNumber) {
        return res.status(400).json({ message: 'Item number is required' });
      }

      // This would implement actual scraping logic
      // For now, return mock data
      const mockData = {
        name: `Model ${itemNumber}`,
        chassis: 'TT-02',
        releaseYear: 2023,
        boxArt: null,
        manualUrl: null,
      };

      res.json(mockData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
