import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertModelSchema, insertPhotoSchema, insertBuildLogEntrySchema, insertHopUpPartSchema, insertFeedbackPostSchema, pricingTiers, purchases, users, feedbackPosts } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileStorage } from "./storage-service";
import { JSDOM } from "jsdom";
import { db } from "./db";
import { models, photos, buildLogEntries, userActivityLog, hopUpParts, featureScreenshots } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import adminRoutes from "./adminRoutes";
import { logUserActivity } from "./activityLogger";
import { sendFeedbackThankYouEmail, sendFeedbackAdminNotification } from "./emailService";
import Stripe from "stripe";

// Initialize Stripe (blueprint:javascript_stripe)
let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
  });
  console.log('✅ Stripe initialized');
} else {
  console.warn('⚠️  Stripe not configured - payment features will be disabled');
}

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

// Helper function to get user ID from authenticated user
function getUserId(req: any): string {
  return req.user?.id;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);
  
  // Register admin routes
  app.use("/api/admin", adminRoutes);
  
  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      // Handle both Replit OAuth and traditional auth user structures
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return user without sensitive fields
      const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeUser } = user;
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Serve uploaded files with error handling for missing files
  app.use('/uploads', express.static(uploadDir));

  // Handle missing files gracefully for legacy uploads path
  app.get('/uploads/*', (req, res) => {
    res.status(404).json({ error: 'File not found in this environment' });
  });

  // Protect all API routes except auth routes and public marketing routes
  app.use('/api', (req, res, next) => {
    // Skip auth for public routes: auth, file serving, storage status, pricing, screenshots, feedback (GET only), community (GET only), field-options (GET only)
    if (req.path.startsWith('/auth/') || 
        req.path === '/login' || 
        req.path === '/logout' || 
        req.path === '/callback' || 
        req.path.startsWith('/files/') || 
        req.path === '/storage/status' ||
        req.path === '/pricing-tiers' ||
        req.path === '/screenshots' ||
        (req.path === '/feedback' && req.method === 'GET') ||
        (req.path.startsWith('/community/') && req.method === 'GET') ||
        (req.path.startsWith('/field-options') && req.method === 'GET')) {
      return next();
    }
    
    console.log('🔐 Auth middleware - checking:', {
      path: req.path,
      method: req.method,
      hasUser: !!req.user,
      contentType: req.headers['content-type']
    });
    
    return isAuthenticated(req, res, next);
  });

  // Public pricing tiers route - accessible to all users
  app.get('/api/pricing-tiers', async (req, res) => {
    try {
      const tiers = await db.select().from(pricingTiers)
        .where(eq(pricingTiers.isActive, true))
        .orderBy(pricingTiers.modelCount);
      res.json(tiers);
    } catch (error) {
      console.error("Pricing tiers error:", error);
      res.status(500).json({ message: "Failed to fetch pricing tiers" });
    }
  });

  // Public field options route - for form dropdowns (returns grouped by fieldKey)
  app.get('/api/field-options', async (req, res) => {
    try {
      const options = await storage.getAllFieldOptions();
      // Group by field key and only return active options
      const grouped = options
        .filter(opt => opt.isActive)
        .reduce((acc, opt) => {
          if (!acc[opt.fieldKey]) {
            acc[opt.fieldKey] = [];
          }
          acc[opt.fieldKey].push(opt.value);
          return acc;
        }, {} as Record<string, string[]>);
      
      res.json(grouped);
    } catch (error) {
      console.error("Field options fetch error:", error);
      res.status(500).json({ message: "Failed to fetch field options" });
    }
  });

  // Public screenshots route - for marketing page
  app.get('/api/screenshots', async (req, res) => {
    try {
      const screenshots = await db.select().from(featureScreenshots)
        .where(eq(featureScreenshots.isActive, true))
        .orderBy(featureScreenshots.sortOrder);
      res.json(screenshots);
    } catch (error) {
      console.error("Screenshots fetch error:", error);
      res.status(500).json({ message: "Failed to fetch screenshots" });
    }
  });

  // ==================== FEEDBACK ROUTES ====================
  
  // Get all feedback posts (public, but shows vote status if authenticated)
  app.get('/api/feedback', async (req: any, res) => {
    try {
      const { category, status } = req.query;
      const currentUserId = req.user?.id;
      
      const posts = await storage.getFeedbackPosts(
        currentUserId,
        category as string | undefined,
        status as string | undefined
      );
      res.json(posts);
    } catch (error) {
      console.error("Feedback fetch error:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Create a new feedback post (requires auth)
  app.post('/api/feedback', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "You must be signed in to post feedback" });
      }

      const parsed = insertFeedbackPostSchema.safeParse({ ...req.body, userId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid feedback data", errors: parsed.error.errors });
      }

      const post = await storage.createFeedbackPost(parsed.data);
      
      // Send email notifications (fire and forget - don't block response)
      const user = await storage.getUser(userId);
      if (user?.email) {
        const userName = user.firstName || 'User';
        const title = parsed.data.title || 'Feedback';
        const description = parsed.data.description || '';
        const category = parsed.data.category || 'other';
        
        Promise.allSettled([
          sendFeedbackThankYouEmail(
            user.email,
            userName,
            title,
            category
          ),
          sendFeedbackAdminNotification(
            title,
            description,
            category,
            userName,
            user.email
          )
        ]).then(results => {
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.error(`Email ${index} failed:`, result.reason);
            }
          });
        });
      }
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Feedback create error:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Vote for a feedback post (requires auth)
  app.post('/api/feedback/:id/vote', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "You must be signed in to vote" });
      }

      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const success = await storage.voteFeedback(feedbackId, userId);
      if (!success) {
        return res.status(400).json({ message: "Already voted or feedback not found" });
      }

      res.json({ message: "Vote recorded" });
    } catch (error) {
      console.error("Vote error:", error);
      res.status(500).json({ message: "Failed to record vote" });
    }
  });

  // Remove vote from a feedback post (requires auth)
  app.delete('/api/feedback/:id/vote', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "You must be signed in to vote" });
      }

      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      await storage.unvoteFeedback(feedbackId, userId);
      res.json({ message: "Vote removed" });
    } catch (error) {
      console.error("Unvote error:", error);
      res.status(500).json({ message: "Failed to remove vote" });
    }
  });

  // Delete own feedback post (requires auth)
  app.delete('/api/feedback/:id', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const feedbackId = parseInt(req.params.id);
      if (isNaN(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
      }

      const success = await storage.deleteFeedbackPost(feedbackId, userId);
      if (!success) {
        return res.status(404).json({ message: "Feedback not found or not owned by you" });
      }

      res.json({ message: "Feedback deleted" });
    } catch (error) {
      console.error("Feedback delete error:", error);
      res.status(500).json({ message: "Failed to delete feedback" });
    }
  });

  // Admin: Update feedback status
  app.patch('/api/feedback/:id/status', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user is admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const feedbackId = parseInt(req.params.id);
      const { status } = req.body;
      
      const validStatuses = ['open', 'planned', 'in_progress', 'completed', 'declined'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateFeedbackPostStatus(feedbackId, status);
      if (!updated) {
        return res.status(404).json({ message: "Feedback not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Status update error:", error);
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // ==================== END FEEDBACK ROUTES ====================

  // ==================== COMMUNITY/SHARING ROUTES ====================
  
  // Get all shared models (public, but auth-required models need login)
  app.get('/api/community/models', async (req: any, res) => {
    try {
      const viewerUserId = req.user?.id;
      const models = await storage.getSharedModels(viewerUserId);
      res.json(models);
    } catch (error) {
      console.error("Community models fetch error:", error);
      res.status(500).json({ message: "Failed to fetch community models" });
    }
  });

  // Get a specific shared model by slug
  app.get('/api/community/models/:slug', async (req: any, res) => {
    try {
      const { slug } = req.params;
      const viewerUserId = req.user?.id;
      const model = await storage.getSharedModelBySlug(slug, viewerUserId);
      
      if (!model) {
        return res.status(404).json({ message: "Model not found or not shared" });
      }
      
      res.json(model);
    } catch (error) {
      console.error("Community model fetch error:", error);
      res.status(500).json({ message: "Failed to fetch model" });
    }
  });

  // Get photos for a shared model
  app.get('/api/community/models/:slug/photos', async (req: any, res) => {
    try {
      const { slug } = req.params;
      const viewerUserId = req.user?.id;
      const photos = await storage.getSharedModelPhotos(slug, viewerUserId);
      res.json(photos);
    } catch (error) {
      console.error("Community photos fetch error:", error);
      res.status(500).json({ message: "Failed to fetch photos" });
    }
  });

  // Get hop-ups for a shared model (costs hidden)
  app.get('/api/community/models/:slug/hopups', async (req: any, res) => {
    try {
      const { slug } = req.params;
      const viewerUserId = req.user?.id;
      const hopups = await storage.getSharedModelHopUps(slug, viewerUserId);
      res.json(hopups);
    } catch (error) {
      console.error("Community hop-ups fetch error:", error);
      res.status(500).json({ message: "Failed to fetch hop-ups" });
    }
  });

  // Get build logs for a shared model
  app.get('/api/community/models/:slug/buildlogs', async (req: any, res) => {
    try {
      const { slug } = req.params;
      const viewerUserId = req.user?.id;
      const buildLogs = await storage.getSharedModelBuildLogs(slug, viewerUserId);
      res.json(buildLogs);
    } catch (error) {
      console.error("Community build logs fetch error:", error);
      res.status(500).json({ message: "Failed to fetch build logs" });
    }
  });

  // Get comments for a shared model
  app.get('/api/community/models/:slug/comments', async (req: any, res) => {
    try {
      const { slug } = req.params;
      const viewerUserId = req.user?.id;
      
      // First get the model to verify it's shared
      const model = await storage.getSharedModelBySlug(slug, viewerUserId);
      if (!model) {
        return res.status(404).json({ message: "Model not found or not shared" });
      }
      
      const comments = await storage.getModelComments(model.id);
      res.json(comments);
    } catch (error) {
      console.error("Community comments fetch error:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Add a comment to a shared model (requires auth)
  app.post('/api/community/models/:slug/comments', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "You must be logged in to comment" });
      }
      
      const { slug } = req.params;
      const { content } = req.body;
      
      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Get the model to verify it's shared and get the id
      const model = await storage.getSharedModelBySlug(slug, userId);
      if (!model) {
        return res.status(404).json({ message: "Model not found or not shared" });
      }
      
      const comment = await storage.createModelComment({
        modelId: model.id,
        userId,
        content: content.trim(),
      });
      
      res.status(201).json(comment);
    } catch (error) {
      console.error("Comment creation error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // Delete a comment (only owner can delete)
  app.delete('/api/community/comments/:id', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      const commentId = parseInt(req.params.id);
      const deleted = await storage.deleteModelComment(commentId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Comment not found or you don't have permission to delete it" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Comment deletion error:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Update user share preference (requires auth)
  app.patch('/api/user/share-preference', async (req: any, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { sharePreference } = req.body;
      const validPreferences = ['public', 'authenticated', 'private'];
      if (!validPreferences.includes(sharePreference)) {
        return res.status(400).json({ message: "Invalid share preference" });
      }

      const user = await storage.updateUserSharePreference(userId, sharePreference);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ sharePreference: user.sharePreference });
    } catch (error) {
      console.error("Share preference update error:", error);
      res.status(500).json({ message: "Failed to update share preference" });
    }
  });

  // ==================== END COMMUNITY/SHARING ROUTES ====================

  // Purchase complete route - records purchase after Stripe payment succeeds
  app.post('/api/purchase/complete', async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { tierId, paymentId } = req.body;

      if (!tierId || !paymentId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // CRITICAL: Verify payment with Stripe before granting models
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);

      // Verify payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment has not succeeded" });
      }

      // Verify payment belongs to this user
      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ message: "Payment does not belong to this user" });
      }

      // Verify payment matches the requested tier
      if (paymentIntent.metadata.tierId !== tierId.toString()) {
        return res.status(400).json({ message: "Payment does not match requested tier" });
      }

      // Get the tier info from database
      const [tier] = await db.select().from(pricingTiers)
        .where(eq(pricingTiers.id, parseInt(tierId)))
        .limit(1);

      if (!tier) {
        return res.status(404).json({ message: "Pricing tier not found" });
      }

      // Verify payment amount matches tier price
      const expectedAmount = Math.round(parseFloat(tier.finalPrice) * 100);
      if (paymentIntent.amount !== expectedAmount) {
        return res.status(400).json({ message: "Payment amount does not match tier price" });
      }

      // Verify currency
      if (paymentIntent.currency !== 'usd') {
        return res.status(400).json({ message: "Invalid payment currency" });
      }

      // Check if this payment was already processed
      const existingPurchase = await db.select().from(purchases)
        .where(eq(purchases.paymentId, paymentId))
        .limit(1);

      if (existingPurchase.length > 0) {
        return res.status(400).json({ message: "Payment already processed" });
      }

      // All validations passed - record the purchase
      await db.insert(purchases).values({
        userId,
        modelCount: tier.modelCount,
        amount: tier.finalPrice,
        currency: "USD",
        paymentProvider: "stripe",
        paymentId: paymentId,
        status: "completed",
      });

      // Get current user model limit
      const [currentUser] = await db.select().from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Update user's model limit
      await db.update(users)
        .set({
          modelLimit: sql`${users.modelLimit} + ${tier.modelCount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      const newModelLimit = (currentUser?.modelLimit || 0) + tier.modelCount;

      // Log the activity
      await logUserActivity(userId, 'purchase_completed', {
        tierId: tier.id,
        modelCount: tier.modelCount,
        amount: tier.finalPrice,
        paymentId: paymentId
      }, req);

      res.json({ 
        message: "Purchase completed successfully",
        newModelLimit: newModelLimit
      });
    } catch (error) {
      console.error("Purchase complete error:", error);
      res.status(500).json({ message: "Failed to complete purchase" });
    }
  });

  // Stripe payment intent creation (blueprint:javascript_stripe)
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const userId = getUserId(req);
      
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { tierId } = req.body;

      if (!tierId) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Fetch tier from database to get authoritative price
      const [tier] = await db.select().from(pricingTiers)
        .where(eq(pricingTiers.id, parseInt(tierId)))
        .limit(1);

      if (!tier || !tier.isActive) {
        return res.status(404).json({ message: "Pricing tier not found or inactive" });
      }

      // Use server-side price to prevent tampering
      const amount = parseFloat(tier.finalPrice);

      // Create Stripe payment intent with authoritative price
      if (!stripe) {
        return res.status(503).json({ message: "Payment processing is not configured" });
      }
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          tierId: tierId.toString(),
          modelCount: tier.modelCount.toString(),
        },
      });

      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Models routes
  app.get('/api/models', async (req, res) => {
    try {
      // Handle both Replit OAuth and traditional auth user structures
      const userId = getUserId(req);
      
      // Support pagination for mobile clients
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;
      
      const models = await storage.getModels(userId);
      
      // Return paginated response if pagination params provided
      if (req.query.page || req.query.limit) {
        const paginatedModels = models.slice(offset, offset + limit);
        res.json({
          data: paginatedModels,
          pagination: {
            page,
            limit,
            total: models.length,
            totalPages: Math.ceil(models.length / limit),
            hasMore: offset + limit < models.length
          }
        });
      } else {
        // Backward compatible: return array for web app
        res.json(models);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/models/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const model = await storage.getModel(id, userId);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }
      console.log('📸 Model photos:', model.photos.map(p => ({ id: p.id, caption: p.caption, isBoxArt: p.isBoxArt })));
      res.json(model);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models', async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelData = insertModelSchema.parse({ ...req.body, userId });
      const model = await storage.createModel(modelData);
      
      // Log model creation activity
      await logUserActivity(userId, 'model_created', { 
        modelId: model.id,
        modelName: model.name,
        itemNumber: model.itemNumber
      }, req);
      
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
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const modelData = insertModelSchema.partial().parse(req.body);
      
      // Get existing model to check for sharing changes
      const existingModel = await storage.getModel(id, userId);
      if (!existingModel) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      // Generate publicSlug if sharing is being enabled and no slug exists
      if (modelData.isShared && !req.body.publicSlug && !existingModel.publicSlug) {
        const slugBase = existingModel.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 30);
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        modelData.publicSlug = `${slugBase}-${randomSuffix}`;
      }
      
      const model = await storage.updateModel(id, userId, modelData);
      if (!model) {
        return res.status(404).json({ message: 'Model update failed' });
      }
      
      // Log sharing changes
      if (modelData.isShared !== undefined && modelData.isShared !== existingModel.isShared) {
        await logUserActivity(userId, modelData.isShared ? 'model_shared' : 'model_unshared', {
          modelId: id,
          modelName: existingModel.name,
          publicSlug: model.publicSlug,
        }, req);
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
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      
      // Get model details before deletion for logging
      const model = await storage.getModel(id, userId);
      
      const deleted = await storage.deleteModel(id, userId);
      if (!deleted) {
        return res.status(404).json({ message: 'Model not found' });
      }
      
      // Log model deletion activity
      if (model) {
        await logUserActivity(userId, 'model_deleted', { 
          modelId: id,
          modelName: model.name,
          itemNumber: model.itemNumber
        }, req);
      }
      
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Photos routes
  app.get('/api/models/:modelId/photos', async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      const photos = await storage.getPhotos(modelId, userId);
      
      // Support pagination for mobile clients
      const page = parseInt(req.query.page as string) || 1;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const offset = (page - 1) * limit;
      
      if (req.query.page || req.query.limit) {
        const paginatedPhotos = photos.slice(offset, offset + limit);
        res.json({
          data: paginatedPhotos,
          pagination: {
            page,
            limit,
            total: photos.length,
            totalPages: Math.ceil(photos.length / limit),
            hasMore: offset + limit < photos.length
          }
        });
      } else {
        res.json(photos);
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mobile: Generate signed URL for direct photo upload to Google Cloud Storage
  app.post('/api/mobile/photos/signed-url', async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { modelId, filename, contentType } = req.body;
      
      if (!modelId || !filename || !contentType) {
        return res.status(400).json({ message: 'modelId, filename, and contentType are required' });
      }

      // Verify user owns the model
      const model = await storage.getModel(parseInt(modelId), userId);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }

      // Generate unique filename to prevent conflicts
      const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${filename}`;
      
      // Generate signed URL for upload
      const result = await fileStorage.generateSignedUploadUrl(uniqueFilename, contentType);
      
      res.json({
        uploadUrl: result.uploadUrl,
        filename: result.filename,
        fileUrl: fileStorage.getFileUrl(result.filename),
        expiresAt: result.expiresAt.toISOString()
      });
    } catch (error: any) {
      console.error('Signed URL generation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Mobile: Confirm photo upload after using signed URL
  app.post('/api/mobile/photos/confirm', async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const { modelId, filename, originalName, caption, isBoxArt } = req.body;
      
      if (!modelId || !filename || !originalName) {
        return res.status(400).json({ message: 'modelId, filename, and originalName are required' });
      }

      // Verify user owns the model
      const model = await storage.getModel(parseInt(modelId), userId);
      if (!model) {
        return res.status(404).json({ message: 'Model not found' });
      }

      // Create photo record in database
      const photoData = insertPhotoSchema.parse({
        modelId: parseInt(modelId),
        filename: filename,
        originalName: originalName,
        url: fileStorage.getFileUrl(filename),
        caption: caption || null,
        isBoxArt: isBoxArt || false
      });

      const photo = await storage.createPhoto(photoData);
      
      res.status(201).json(photo);
    } catch (error: any) {
      console.error('Photo confirmation error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/photos', upload.array('photos', 10), async (req, res) => {
    console.log('📸 Photo upload endpoint hit!', {
      modelId: req.params.modelId,
      hasUser: !!req.user,
      contentType: req.headers['content-type'],
      method: req.method,
      url: req.url
    });
    
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      const files = req.files as Express.Multer.File[];
      
      console.log('Upload request received:', {
        modelId,
        userId,
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
      
      // Log activity for photo upload
      await logUserActivity(userId, 'photo_uploaded', {
        modelId,
        photoCount: photos.length,
        photoIds: photos.map(p => p.id)
      }, req);
      
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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

  // Get all hop-up parts for a user (for export)
  app.get('/api/hop-up-parts/all', async (req, res) => {
    try {
      const userId = getUserId(req);
      const hopUps = await storage.getAllHopUpParts(userId);
      res.json(hopUps);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Build log routes
  app.get('/api/build-log-entries', async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log('Fetching all build log entries for user:', userId);
      
      // Fallback approach: get all models and their entries separately if needed
      const entries = await storage.getAllBuildLogEntries(userId);
      console.log('Retrieved entries:', entries.length);
      res.json(entries);
    } catch (error: any) {
      console.error('Error fetching all build log entries:', error);
      
      // Fallback: return empty array instead of failing
      console.log('Falling back to empty array for deployment stability');
      res.json([]);
    }
  });

  app.get('/api/models/:modelId/build-log-entries', async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      const entries = await storage.getBuildLogEntries(modelId, userId);
      res.json(entries);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/build-log-entries', async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      
      const entryData = insertBuildLogEntrySchema.parse({
        modelId,
        entryNumber: req.body.entryNumber,
        title: req.body.title,
        content: req.body.content,
        entryDate: req.body.entryDate ? new Date(req.body.entryDate) : new Date(),
      });

      const entry = await storage.createBuildLogEntry(entryData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Photo upload for build log entries
  app.post('/api/build-log-entries/:entryId/photos', upload.array('photos', 10), async (req, res) => {
    try {
      const userId = getUserId(req);
      const entryId = parseInt(req.params.entryId);
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }

      // Get the build log entry to find the modelId
      const entry = await storage.getBuildLogEntry(entryId, userId);
      if (!entry) {
        return res.status(404).json({ message: 'Build log entry not found' });
      }

      const uploadedPhotos = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = req.body[`caption_${i}`] || '';

        // Upload file to storage
        const storedFile = await fileStorage.uploadFile(file, file.originalname);
        
        // Create photo record with actual modelId from entry
        const photoData = {
          modelId: entry.modelId,
          filename: storedFile,
          originalName: file.originalname,
          url: `/api/files/${storedFile}`,
          caption,
          isBoxArt: false,
        };

        const photo = await storage.createPhoto(photoData);
        
        // Link photo to build log entry
        await storage.addPhotosToEntry(entryId, [photo.id]);
        
        uploadedPhotos.push(photo);
      }

      res.status(201).json(uploadedPhotos);
    } catch (error: any) {
      console.error('Build log photo upload error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/build-log-entries/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      
      // Custom schema for updates that accepts string dates
      const updateSchema = insertBuildLogEntrySchema.partial().extend({
        entryDate: z.string().optional().transform((val) => val ? new Date(val) : undefined)
      });
      
      const entryData = updateSchema.parse(req.body);
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

  app.delete('/api/build-log-entries/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
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

  // Link existing photos to build log entries
  app.post('/api/build-log-entries/:entryId/existing-photos', async (req, res) => {
    try {
      const userId = getUserId(req);
      const entryId = parseInt(req.params.entryId);
      const { photoId } = req.body;

      if (!photoId) {
        return res.status(400).json({ message: 'Photo ID is required' });
      }

      // Verify the entry exists and belongs to user by checking through models
      const userModels = await db.query.models.findMany({
        where: eq(models.userId, userId),
        with: {
          buildLogEntries: true,
        },
      });
      
      const targetEntry = userModels
        .flatMap(model => model.buildLogEntries)
        .find(entry => entry.id === entryId);
      
      if (!targetEntry) {
        return res.status(404).json({ message: 'Build log entry not found' });
      }

      // Verify the photo belongs to the same model
      const photo = await db.query.photos.findFirst({
        where: and(eq(photos.id, photoId), eq(photos.modelId, targetEntry.modelId)),
      });

      if (!photo) {
        return res.status(404).json({ message: 'Photo not found or does not belong to this model' });
      }

      // Add the photo to the entry
      const result = await storage.addPhotosToEntry(entryId, [photoId]);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error linking existing photo to build log entry:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Hop-up parts routes
  app.get('/api/models/:modelId/hop-up-parts', async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      const parts = await storage.getHopUpParts(modelId, userId);
      console.log('🔧 Hop-up parts:', JSON.stringify(parts, null, 2));
      // Disable cache to force fresh data
      res.setHeader('Cache-Control', 'no-store');
      res.json(parts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post('/api/models/:modelId/hop-up-parts', upload.single('productPhoto'), async (req, res) => {
    try {
      const userId = getUserId(req);
      const modelId = parseInt(req.params.modelId);
      
      // Normalize multipart form data fields (multer makes everything strings)
      const normalizedBody: any = { ...req.body, modelId };
      
      // Coerce numeric fields
      if (normalizedBody.quantity) normalizedBody.quantity = parseInt(normalizedBody.quantity);
      if (normalizedBody.cost) normalizedBody.cost = parseFloat(normalizedBody.cost);
      
      // Coerce boolean fields
      if (normalizedBody.isTamiyaBrand !== undefined) {
        normalizedBody.isTamiyaBrand = normalizedBody.isTamiyaBrand === 'true' || normalizedBody.isTamiyaBrand === true;
      }
      
      // Parse arrays
      if (normalizedBody.compatibility) {
        normalizedBody.compatibility = typeof normalizedBody.compatibility === 'string' 
          ? JSON.parse(normalizedBody.compatibility) 
          : normalizedBody.compatibility;
      }
      
      // Validate hop-up part data BEFORE uploading photo
      const partData = insertHopUpPartSchema.parse(normalizedBody);
      
      // Now handle product photo upload if validation passed
      let photoId = null;
      if (req.file) {
        const savedFilename = await fileStorage.uploadFile(req.file, req.file.originalname);
        const fileUrl = fileStorage.getFileUrl(savedFilename);
        
        const photoData = insertPhotoSchema.parse({
          modelId,
          filename: savedFilename,
          originalName: req.file.originalname,
          url: fileUrl,
          caption: 'Product photo',
          isBoxArt: false,
        });
        
        const photo = await storage.createPhoto(photoData);
        photoId = photo.id;
        partData.photoId = photoId;
      }
      
      const part = await storage.createHopUpPart(partData);
      
      // Fetch the part with photo relation to return complete data
      const partWithPhoto = await db.query.hopUpParts.findFirst({
        where: eq(hopUpParts.id, part.id),
        with: {
          photo: true,
        },
      });
      
      res.status(201).json(partWithPhoto);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put('/api/hop-up-parts/:id', upload.single('productPhoto'), async (req, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      
      // Normalize multipart form data fields (multer makes everything strings)
      const normalizedBody: any = { ...req.body };
      
      // Coerce numeric fields
      if (normalizedBody.quantity) normalizedBody.quantity = parseInt(normalizedBody.quantity);
      if (normalizedBody.cost) normalizedBody.cost = parseFloat(normalizedBody.cost);
      if (normalizedBody.modelId) normalizedBody.modelId = parseInt(normalizedBody.modelId);
      
      // Coerce boolean fields
      if (normalizedBody.isTamiyaBrand !== undefined) {
        normalizedBody.isTamiyaBrand = normalizedBody.isTamiyaBrand === 'true' || normalizedBody.isTamiyaBrand === true;
      }
      
      // Parse arrays
      if (normalizedBody.compatibility) {
        normalizedBody.compatibility = typeof normalizedBody.compatibility === 'string' 
          ? JSON.parse(normalizedBody.compatibility) 
          : normalizedBody.compatibility;
      }
      
      // Validate hop-up part data BEFORE uploading photo
      const partData = insertHopUpPartSchema.partial().parse(normalizedBody);
      
      // Now handle product photo upload if validation passed
      if (req.file) {
        // Get modelId from body or query database
        let modelId = normalizedBody.modelId || null;
        
        if (!modelId) {
          // Query database directly to get modelId from hop-up part
          const [existingPart] = await db.select()
            .from(hopUpParts)
            .where(eq(hopUpParts.id, id))
            .limit(1);
          
          if (!existingPart) {
            return res.status(404).json({ message: 'Hop-up part not found' });
          }
          modelId = existingPart.modelId;
        }
        
        const savedFilename = await fileStorage.uploadFile(req.file, req.file.originalname);
        const fileUrl = fileStorage.getFileUrl(savedFilename);
        
        const photoData = insertPhotoSchema.parse({
          modelId,
          filename: savedFilename,
          originalName: req.file.originalname,
          url: fileUrl,
          caption: 'Product photo',
          isBoxArt: false,
        });
        
        const photo = await storage.createPhoto(photoData);
        partData.photoId = photo.id;
      }
      
      const part = await storage.updateHopUpPart(id, userId, partData);
      if (!part) {
        return res.status(404).json({ message: 'Hop-up part not found' });
      }
      
      // Fetch the part with photo relation to return complete data
      const partWithPhoto = await db.query.hopUpParts.findFirst({
        where: eq(hopUpParts.id, id),
        with: {
          photo: true,
        },
      });
      
      res.json(partWithPhoto);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete('/api/hop-up-parts/:id', async (req, res) => {
    try {
      const userId = getUserId(req);
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
      const userId = getUserId(req);
      const stats = await storage.getCollectionStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/recent-activity', async (req, res) => {
    try {
      const userId = getUserId(req);
      const limit = parseInt(req.query.limit as string) || 10;
      
      const activities = await db.select()
        .from(userActivityLog)
        .where(eq(userActivityLog.userId, userId))
        .orderBy(desc(userActivityLog.createdAt))
        .limit(limit);
      
      res.json(activities);
    } catch (error: any) {
      console.error('Recent activity error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // File serving endpoint for Google Cloud Storage
  app.get('/api/files/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      console.log(`📥 Serving file from GCS: ${filename}`);
      
      // Download file from Google Cloud Storage
      const buffer = await fileStorage.downloadFile(filename);
      
      // Set appropriate content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      const contentTypes: { [key: string]: string } = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.heic': 'image/heic',
        '.heif': 'image/heif',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.aac': 'audio/aac',
        '.m4a': 'audio/m4a',
        '.ogg': 'audio/ogg',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
      
      const contentType = contentTypes[ext] || 'application/octet-stream';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Length', buffer.length.toString());
      
      res.send(buffer);
    } catch (error: any) {
      console.error(`❌ File serving error for ${req.params.filename}:`, error.message);
      res.status(404).json({ message: 'File not found', error: error.message });
    }
  });

  // Storage status check endpoint
  app.get('/api/storage/status', async (req, res) => {
    try {
      const { GoogleCloudStorage } = await import('./storage-service');
      const gcsStorage = new GoogleCloudStorage();
      
      // Try to list files to verify connection works
      await gcsStorage.listFiles();
      
      res.json({
        status: 'ok',
        provider: 'Google Cloud Storage',
        bucket: 'trackmyrc-bucket',
        message: 'Storage is connected and working properly'
      });
    } catch (error: any) {
      console.error('Storage status check failed:', error);
      res.status(500).json({
        status: 'error',
        provider: 'Google Cloud Storage',
        bucket: 'trackmyrc-bucket',
        message: error.message || 'Storage connection failed',
        error: error.message
      });
    }
  });

  // Helper function to parse data from URL when scraping fails
  function parseDataFromUrl(url: string) {
    const urlParsedData: any = {
      name: '',
      manufacturer: '',
      category: '',
      supplier: '',
      material: '',
      color: '',
      compatibility: [],
      itemNumber: '',
      cost: null
    };

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const pathname = urlObj.pathname.toLowerCase();
      
      // Extract supplier from domain
      if (hostname.includes('rcmart.com')) {
        urlParsedData.supplier = 'RC Mart';
      } else if (hostname.includes('amainhobbies.com')) {
        urlParsedData.supplier = 'AMain Hobbies';
      } else if (hostname.includes('towerhobbies.com')) {
        urlParsedData.supplier = 'Tower Hobbies';
      } else if (hostname.includes('horizonhobby.com')) {
        urlParsedData.supplier = 'Horizon Hobby';
      } else if (hostname.includes('tamiyabase.com')) {
        urlParsedData.supplier = 'TamiyaBase';
      } else if (hostname.includes('hlj.com') || hostname.includes('hobbylinkjapan.com')) {
        urlParsedData.supplier = 'HobbyLink Japan';
      } else if (hostname.includes('plazajapan.com')) {
        urlParsedData.supplier = 'Plaza Japan';
      }
      
      // Extract product info from URL path
      const pathSegments = pathname.split('-').join(' ').split('/').join(' ');
      const urlText = decodeURIComponent(pathSegments).toLowerCase();
      
      // Extract manufacturer from URL
      if (urlText.includes('xtra-speed') || urlText.includes('xtra_speed')) {
        urlParsedData.manufacturer = 'Xtra Speed';
      } else if (urlText.includes('yeah-racing') || urlText.includes('yeah_racing')) {
        urlParsedData.manufacturer = 'Yeah Racing';
      } else if (urlText.includes('tamiya')) {
        urlParsedData.manufacturer = 'Tamiya';
      } else if (urlText.includes('mst')) {
        urlParsedData.manufacturer = 'MST';
      } else if (urlText.includes('3racing')) {
        urlParsedData.manufacturer = '3Racing';
      } else if (urlText.includes('gpm-racing') || urlText.includes('gpm_racing')) {
        urlParsedData.manufacturer = 'GPM Racing';
      } else if (urlText.includes('hot-racing') || urlText.includes('hot_racing')) {
        urlParsedData.manufacturer = 'Hot Racing';
      }
      
      // Extract material from URL
      if (urlText.includes('aluminum') || urlText.includes('aluminium')) {
        urlParsedData.material = 'Aluminum';
      } else if (urlText.includes('carbon')) {
        urlParsedData.material = 'Carbon Fiber';
      } else if (urlText.includes('steel')) {
        urlParsedData.material = 'Steel';
      } else if (urlText.includes('plastic')) {
        urlParsedData.material = 'Plastic';
      }
      
      // Extract color from URL
      if (urlText.includes('red')) urlParsedData.color = 'Red';
      else if (urlText.includes('blue')) urlParsedData.color = 'Blue';
      else if (urlText.includes('black')) urlParsedData.color = 'Black';
      else if (urlText.includes('silver')) urlParsedData.color = 'Silver';
      else if (urlText.includes('gold')) urlParsedData.color = 'Gold';
      else if (urlText.includes('green')) urlParsedData.color = 'Green';
      else if (urlText.includes('white')) urlParsedData.color = 'White';
      else if (urlText.includes('orange')) urlParsedData.color = 'Orange';
      
      // Extract category from URL
      if (urlText.includes('chassis')) urlParsedData.category = 'Chassis';
      else if (urlText.includes('suspension') || urlText.includes('damper') || urlText.includes('shock')) urlParsedData.category = 'Suspension';
      else if (urlText.includes('wheel') || urlText.includes('rim')) urlParsedData.category = 'Wheels';
      else if (urlText.includes('tire') || urlText.includes('tyre')) urlParsedData.category = 'Tires';
      else if (urlText.includes('motor')) urlParsedData.category = 'Motor';
      else if (urlText.includes('servo')) urlParsedData.category = 'Servo';
      else if (urlText.includes('battery')) urlParsedData.category = 'Battery';
      else if (urlText.includes('body') || urlText.includes('shell')) urlParsedData.category = 'Body';
      else if (urlText.includes('wing') || urlText.includes('spoiler')) urlParsedData.category = 'Wing';
      
      // Extract chassis compatibility from URL
      const chassisPattern = /(ta0?[0-9]{1,2}(?:sw)?|tb0?[0-9]{1,2}|tt0?[0-9]{1,2}|df0?[0-9]{1,2}|m0?[0-9]{1,2}|tc0?[0-9]{1,2}|xv0?[0-9]{1,2}|cc0?[0-9]{1,2}|ff0?[0-9]{1,2})/gi;
      const chassisMatches = urlText.match(chassisPattern);
      if (chassisMatches) {
        urlParsedData.compatibility = Array.from(new Set(chassisMatches.map((c: string) => c.toUpperCase())));
      }
      
      // Extract item numbers from URL - look for patterns
      const itemNumberMatches = pathname.match(/(\d{5,6})/g);
      if (itemNumberMatches && itemNumberMatches.length > 0) {
        urlParsedData.itemNumber = itemNumberMatches[0];
      }
      
      // Try to extract a reasonable product name from URL path
      const cleanPath = pathname
        .split('/')
        .pop()
        ?.replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .replace(/\d{8,}/g, '') // Remove long numbers that are likely IDs
        .trim();
      
      if (cleanPath && cleanPath.length > 5) {
        // Capitalize words and clean up
        urlParsedData.name = cleanPath
          .split(' ')
          .filter(word => word.length > 1)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }
      
    } catch (error) {
      console.error('URL parsing error:', error);
    }
    
    return urlParsedData;
  }

  // Product page scraping route
  app.post('/api/scrape-product', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      console.log(`Scraping product page: ${url}`);
      
      // Fetch the page content with better headers to avoid bot detection
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });
      
      if (!response.ok) {
        // If scraping fails, automatically use URL parsing to extract what we can
        console.log(`Scraping failed with status ${response.status}, falling back to URL parsing`);
        
        const urlParsedData = parseDataFromUrl(url);
        
        return res.status(200).json({
          message: `Page scraping blocked (${response.status}), but extracted data from URL structure`,
          fallbackUsed: true,
          ...urlParsedData
        });
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      // Initialize result object
      const scrapedData: any = {
        name: '',
        manufacturer: '',
        category: '',
        material: '',
        color: '',
        compatibility: [],
        itemNumber: '',
        cost: null
      };
      
      // RC Mart specific scraping - try multiple selectors
      if (url.includes('rcmart.com')) {
        // Product title - try multiple selectors
        const titleSelectors = [
          'h1.product-title',
          '.product-name h1', 
          '.product-info h1',
          'h1[data-test="product-title"]',
          '.product-detail h1',
          'h1.title',
          '.product-name',
          'h1'
        ];
        
        for (const selector of titleSelectors) {
          const titleElement = document.querySelector(selector);
          if (titleElement && titleElement.textContent?.trim()) {
            scrapedData.name = titleElement.textContent.trim();
            break;
          }
        }
        
        // Extract manufacturer from title
        const title = scrapedData.name.toLowerCase();
        if (title.includes('xtra speed')) scrapedData.manufacturer = 'Xtra Speed';
        else if (title.includes('yeah racing')) scrapedData.manufacturer = 'Yeah Racing';
        else if (title.includes('tamiya')) scrapedData.manufacturer = 'Tamiya';
        else if (title.includes('mst')) scrapedData.manufacturer = 'MST';
        else if (title.includes('3racing')) scrapedData.manufacturer = '3Racing';
        
        // Extract material from title
        if (title.includes('aluminum') || title.includes('aluminium')) scrapedData.material = 'Aluminum';
        else if (title.includes('carbon')) scrapedData.material = 'Carbon Fiber';
        else if (title.includes('steel')) scrapedData.material = 'Steel';
        else if (title.includes('plastic')) scrapedData.material = 'Plastic';
        
        // Extract color from title
        const colors = ['red', 'blue', 'black', 'white', 'silver', 'gold', 'green', 'orange'];
        const foundColor = colors.find(color => title.includes(color));
        if (foundColor) scrapedData.color = foundColor.charAt(0).toUpperCase() + foundColor.slice(1);
        
        // Extract chassis compatibility from title
        const chassisPattern = /(ta0?[0-9]{1,2}(?:sw)?|tb0?[0-9]{1,2}|tt0?[0-9]{1,2}|df0?[0-9]{1,2}|m0?[0-9]{1,2}|tc0?[0-9]{1,2}|xv0?[0-9]{1,2}|cc0?[0-9]{1,2}|ff0?[0-9]{1,2})/gi;
        const chassisMatches = title.match(chassisPattern);
        if (chassisMatches) {
          scrapedData.compatibility = Array.from(new Set(chassisMatches.map((c: string) => c.toUpperCase())));
        }
        
        // Try to find price
        const priceElement = document.querySelector('.price, .product-price, .current-price');
        if (priceElement) {
          const priceText = priceElement.textContent?.replace(/[^0-9.]/g, '');
          if (priceText) scrapedData.cost = parseFloat(priceText);
        }
        
        // Category detection based on title keywords
        if (title.includes('damper') || title.includes('shock')) scrapedData.category = 'Suspension';
        else if (title.includes('upright') || title.includes('knuckle')) scrapedData.category = 'Suspension';
        else if (title.includes('chassis')) scrapedData.category = 'Chassis';
        else if (title.includes('wheel') || title.includes('rim')) scrapedData.category = 'Wheels';
        else if (title.includes('motor')) scrapedData.category = 'Motor';
        else if (title.includes('servo')) scrapedData.category = 'Servo';
      }
      
      console.log('Scraped data:', scrapedData);
      res.json(scrapedData);
      
    } catch (error: any) {
      console.error('Scraping error:', error);
      res.status(500).json({ message: `Scraping failed: ${error.message}` });
    }
  });

  // Tamiya database scraping endpoint
  app.post('/api/scrape-tamiya', async (req, res) => {
    try {
      const { itemNumber } = req.body;
      
      if (!itemNumber) {
        return res.status(400).json({ message: 'Item number is required' });
      }

      // For now, return null to indicate no data found
      // This prevents the JSON parsing error and allows form to work without scraping
      console.log(`Tamiya scraping requested for item ${itemNumber} - not implemented yet`);
      res.json(null);
      
    } catch (error: any) {
      console.error('Tamiya scraping error:', error);
      res.status(500).json({ message: `Tamiya scraping failed: ${error.message}` });
    }
  });

  // URL-only parsing endpoint (when scraping is not needed)
  app.post('/api/parse-url-only', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: 'URL is required' });
      }

      console.log(`Parsing URL only: ${url}`);
      const urlParsedData = parseDataFromUrl(url);
      
      console.log('URL parsed data:', urlParsedData);
      res.json(urlParsedData);
      
    } catch (error: any) {
      console.error('URL parsing error:', error);
      res.status(500).json({ message: `URL parsing failed: ${error.message}` });
    }
  });

  // Product text parsing endpoint
  app.post('/api/parse-product-text', async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || !text.trim()) {
        return res.status(400).json({ message: 'Text is required' });
      }

      console.log(`Parsing product text: ${text.substring(0, 100)}...`);
      
      // Initialize result object
      const parsedData: any = {
        name: '',
        manufacturer: '',
        category: '',
        material: '',
        color: '',
        compatibility: [],
        itemNumber: '',
        cost: null
      };
      
      const textLower = text.toLowerCase();
      const lines = text.split('\n').map((line: string) => line.trim()).filter((line: string) => line);
      
      // Extract product name - usually the first substantial line or contains key product terms
      for (const line of lines) {
        if (line.length > 10 && (
          line.toLowerCase().includes('racing') ||
          line.toLowerCase().includes('aluminum') ||
          line.toLowerCase().includes('carbon') ||
          line.toLowerCase().includes('chassis') ||
          line.toLowerCase().includes('motor') ||
          line.toLowerCase().includes('part') ||
          line.toLowerCase().includes('tamiya')
        )) {
          parsedData.name = line;
          break;
        }
      }
      
      // If no specific product name found, use the first substantial line
      if (!parsedData.name && lines.length > 0) {
        parsedData.name = lines.find((line: string) => line.length > 5) || lines[0];
      }
      
      // Extract manufacturer from text
      if (textLower.includes('xtra speed')) parsedData.manufacturer = 'Xtra Speed';
      else if (textLower.includes('yeah racing')) parsedData.manufacturer = 'Yeah Racing';
      else if (textLower.includes('tamiya')) parsedData.manufacturer = 'Tamiya';
      else if (textLower.includes('mst')) parsedData.manufacturer = 'MST';
      else if (textLower.includes('3racing')) parsedData.manufacturer = '3Racing';
      else if (textLower.includes('gpm racing')) parsedData.manufacturer = 'GPM Racing';
      else if (textLower.includes('hot racing')) parsedData.manufacturer = 'Hot Racing';
      
      // Extract category from text
      if (textLower.includes('chassis')) parsedData.category = 'Chassis';
      else if (textLower.includes('suspension') || textLower.includes('damper') || textLower.includes('shock')) parsedData.category = 'Suspension';
      else if (textLower.includes('wheel') || textLower.includes('rim')) parsedData.category = 'Wheels';
      else if (textLower.includes('tire') || textLower.includes('tyre')) parsedData.category = 'Tires';
      else if (textLower.includes('motor')) parsedData.category = 'Motor';
      else if (textLower.includes('esc') || textLower.includes('speed control')) parsedData.category = 'ESC';
      else if (textLower.includes('servo')) parsedData.category = 'Servo';
      else if (textLower.includes('battery')) parsedData.category = 'Battery';
      else if (textLower.includes('body') || textLower.includes('shell')) parsedData.category = 'Body';
      else if (textLower.includes('wing') || textLower.includes('spoiler')) parsedData.category = 'Wing';
      else if (textLower.includes('drivetrain') || textLower.includes('drive') || textLower.includes('gear')) parsedData.category = 'Drivetrain';
      
      // Extract material from text
      if (textLower.includes('carbon fiber') || textLower.includes('carbon fibre')) parsedData.material = 'Carbon Fiber';
      else if (textLower.includes('aluminum') || textLower.includes('aluminium')) parsedData.material = 'Aluminum';
      else if (textLower.includes('steel')) parsedData.material = 'Steel';
      else if (textLower.includes('plastic')) parsedData.material = 'Plastic';
      else if (textLower.includes('titanium')) parsedData.material = 'Titanium';
      
      // Extract color from text
      if (textLower.includes('red')) parsedData.color = 'Red';
      else if (textLower.includes('blue')) parsedData.color = 'Blue';
      else if (textLower.includes('black')) parsedData.color = 'Black';
      else if (textLower.includes('silver')) parsedData.color = 'Silver';
      else if (textLower.includes('gold')) parsedData.color = 'Gold';
      else if (textLower.includes('green')) parsedData.color = 'Green';
      
      // Extract item number - look for patterns like TA01-123, 47479, etc.
      const itemNumberPatterns = [
        /[A-Z]{2,4}-?\d{2,6}/g,  // TA01-123 or TA01123
        /\b\d{4,6}\b/g,          // 47479
        /Item\s*#?:?\s*([A-Z0-9-]+)/gi,
        /Part\s*#?:?\s*([A-Z0-9-]+)/gi,
        /Model\s*#?:?\s*([A-Z0-9-]+)/gi
      ];
      
      for (const pattern of itemNumberPatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          parsedData.itemNumber = matches[0].replace(/Item\s*#?:?\s*/gi, '').replace(/Part\s*#?:?\s*/gi, '').replace(/Model\s*#?:?\s*/gi, '').trim();
          break;
        }
      }
      
      // Extract price - look for currency symbols and numbers
      const pricePatterns = [
        /\$\s*(\d+\.?\d*)/g,
        /USD\s*(\d+\.?\d*)/gi,
        /Price\s*:?\s*\$?\s*(\d+\.?\d*)/gi
      ];
      
      for (const pattern of pricePatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          const priceMatch = matches[0].match(/(\d+\.?\d*)/);
          if (priceMatch) {
            parsedData.cost = parseFloat(priceMatch[1]);
            break;
          }
        }
      }
      
      // Extract chassis compatibility from text
      const chassisTypes = ['TA01', 'TA02', 'TA03', 'TA04', 'TA05', 'TA06', 'TA07', 'TA08', 'TB01', 'TB02', 'TB03', 'TB04', 'TB05', 'TC01', 'TC02', 'TC03', 'TT01', 'TT02', 'TT03', 'DF01', 'DF02', 'DF03', 'DF04', 'M01', 'M02', 'M03', 'M04', 'M05', 'M06', 'M07', 'M08', 'XV01', 'XV02'];
      
      for (const chassis of chassisTypes) {
        if (textLower.includes(chassis.toLowerCase())) {
          parsedData.compatibility.push(chassis);
        }
      }
      
      console.log('Parsed product text data:', parsedData);
      res.json(parsedData);
      
    } catch (error: any) {
      console.error('Text parsing error:', error);
      res.status(500).json({ message: `Text parsing failed: ${error.message}` });
    }
  });

  // Public endpoint for fetching screenshots (for marketing /screenshots page)
  app.get('/api/public/screenshots', async (req, res) => {
    try {
      const { featureScreenshots } = await import("@shared/schema");
      const { desc } = await import("drizzle-orm");
      
      const screenshots = await db
        .select()
        .from(featureScreenshots)
        .where(eq(featureScreenshots.isActive, true))
        .orderBy(featureScreenshots.sortOrder, desc(featureScreenshots.createdAt));
      
      res.json(screenshots);
    } catch (error: any) {
      console.error('Get public screenshots error:', error);
      res.status(500).json({ message: 'Failed to load screenshots' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
