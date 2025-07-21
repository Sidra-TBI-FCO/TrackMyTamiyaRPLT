import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertModelSchema, insertPhotoSchema, insertBuildLogEntrySchema, insertHopUpPartSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileStorage, isUsingReplitStorage } from "./storage-service";

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
    // More flexible file type checking - mobile browsers may send different MIME types
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a',
      'application/octet-stream' // Some mobile browsers send this for images
    ];
    
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.wav', '.ogg', '.m4a'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    // Accept if MIME type is correct OR if extension is valid (handles mobile browser issues)
    const isValidMimeType = file.mimetype.startsWith('image/') || 
                           file.mimetype.startsWith('audio/') || 
                           allowedTypes.includes(file.mimetype);
    const isValidExtension = allowedExtensions.includes(extension);
    
    if (isValidMimeType || isValidExtension) {
      cb(null, true);
    } else {
      console.log(`Rejected file: ${file.originalname}, type: ${file.mimetype}, extension: ${extension}`);
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: JPG, PNG, GIF, WebP, MP3, WAV`) as any, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve uploaded files with error handling for missing files
  app.use('/uploads', express.static(uploadDir));
  
  // Serve files from Replit Object Storage or handle missing files gracefully
  app.get('/api/files/:filename', async (req, res) => {
    try {
      const filename = req.params.filename;
      
      if (isUsingReplitStorage) {
        // Import the Client here to access the storage
        const { Client } = await import('@replit/object-storage');
        const storageClient = new Client();
        
        try {
          const fileBytes = await storageClient.downloadAsBytes(filename);
          if (fileBytes && fileBytes.length > 0) {
            res.set({
              'Content-Type': 'application/octet-stream',
              'Content-Disposition': `inline; filename="${filename}"`,
            });
            res.send(Buffer.from(fileBytes));
            return;
          }
        } catch (storageError) {
          console.error('Failed to download from Replit Object Storage:', storageError);
        }
      }
      
      // Fallback to local file or 404
      res.status(404).json({ error: 'File not found in this environment' });
    } catch (error) {
      console.error('File serve error:', error);
      res.status(404).json({ error: 'File not found' });
    }
  });

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
          console.log(`File uploaded to ${isUsingReplitStorage ? 'Replit Object Storage' : 'local storage'}: ${savedFilename}`);
        } catch (uploadError) {
          console.error(`Failed to upload file ${file.originalname}:`, uploadError);
          // Continue with other files
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
      const photo = await storage.updatePhoto(id, userId, photoData);
      if (!photo) {
        return res.status(404).json({ message: 'Photo not found' });
      }
      res.json(photo);
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
