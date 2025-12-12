import { Router } from "express";
import { db } from "./db";
import { 
  users, models, photos, purchases, pricingTiers, adminAuditLog, userActivityLog,
  featureScreenshots, insertPricingTierSchema, insertPurchaseSchema, insertAdminAuditLogSchema,
  insertFeatureScreenshotSchema
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin, getClientIP } from "./adminMiddleware";
import { sendPasswordResetEmail } from "./emailService";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import { fileStorage } from "./storage-service";
import { storage } from "./storage";

const router = Router();

// Multer configuration for screenshot uploads - use disk storage like other uploads
const uploadDir = path.join(process.cwd(), 'uploads');
const storage_multer = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'screenshot-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

// Helper function to get user ID from authenticated user
function getUserId(req: any): string {
  return req.user?.id;
}

// Helper function to log admin actions
async function logAdminAction(
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: any,
  ipAddress: string
) {
  await db.insert(adminAuditLog).values({
    adminId,
    action,
    targetUserId,
    details: details || {},
    ipAddress,
  });
}

// GET /api/admin/dashboard - Dashboard statistics
router.get("/dashboard", requireAdmin, async (req, res) => {
  try {
    const user = req.user as any;
    
    // Get total users
    const [userCount] = await db.select({ count: sql<number>`count(*)::int` }).from(users);
    
    // Get total revenue
    const [revenue] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount), 0)::numeric` })
      .from(purchases)
      .where(eq(purchases.status, "completed"));
    
    // Get active users (logged in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const [activeUsers] = await db
      .select({ count: sql<number>`count(DISTINCT user_id)::int` })
      .from(userActivityLog)
      .where(
        and(
          eq(userActivityLog.activityType, "login"),
          sql`${userActivityLog.createdAt} > ${thirtyDaysAgo}`
        )
      );
    
    // Get model count
    const [modelCount] = await db.select({ count: sql<number>`count(*)::int` }).from(models);
    
    // Get recent activity
    const recentActivity = await db
      .select()
      .from(userActivityLog)
      .orderBy(desc(userActivityLog.createdAt))
      .limit(10);
    
    res.json({
      totalUsers: userCount.count,
      activeUsers: activeUsers.count,
      totalRevenue: revenue.total,
      totalModels: modelCount.count,
      recentActivity,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);
    res.status(500).json({ message: "Failed to load dashboard" });
  }
});

// GET /api/admin/users - Get all users with stats
router.get("/users", requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    
    // Get stats for each user
    const usersWithStats = await Promise.all(
      allUsers.map(async (user) => {
        const [modelCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(models)
          .where(eq(models.userId, user.id));
        
        const [photoStats] = await db
          .select({ 
            count: sql<number>`count(*)::int`,
            size: sql<number>`COALESCE(SUM(CAST(metadata->>'size' AS bigint)), 0)::bigint`
          })
          .from(photos)
          .innerJoin(models, eq(photos.modelId, models.id))
          .where(eq(models.userId, user.id));
        
        const [totalSpent] = await db
          .select({ total: sql<number>`COALESCE(SUM(amount), 0)::numeric` })
          .from(purchases)
          .where(and(
            eq(purchases.userId, user.id),
            eq(purchases.status, "completed")
          ));
        
        const [lastLogin] = await db
          .select({ time: userActivityLog.createdAt })
          .from(userActivityLog)
          .where(and(
            eq(userActivityLog.userId, user.id),
            eq(userActivityLog.activityType, "login")
          ))
          .orderBy(desc(userActivityLog.createdAt))
          .limit(1);
        
        return {
          ...user,
          modelCount: modelCount.count,
          storageUsed: photoStats.size || 0,
          totalSpent: totalSpent.total,
          lastLogin: lastLogin?.time || null,
        };
      })
    );
    
    res.json(usersWithStats);
  } catch (error) {
    console.error("Admin users list error:", error);
    res.status(500).json({ message: "Failed to load users" });
  }
});

// POST /api/admin/users/:userId/grant-models - Manually grant models to user
router.post("/users/:userId/grant-models", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { modelCount } = req.body;
    const adminId = getUserId(req);
    
    if (!modelCount || modelCount <= 0) {
      return res.status(400).json({ message: "Invalid model count" });
    }
    
    // Update user's manually granted models
    await db
      .update(users)
      .set({ 
        manuallyGrantedModels: sql`${users.manuallyGrantedModels} + ${modelCount}`,
        modelLimit: sql`${users.modelLimit} + ${modelCount}`
      })
      .where(eq(users.id, userId));
    
    // Log the action
    await logAdminAction(
      adminId,
      "grant_models",
      userId,
      { modelCount },
      getClientIP(req)
    );
    
    res.json({ message: "Models granted successfully" });
  } catch (error) {
    console.error("Grant models error:", error);
    res.status(500).json({ message: "Failed to grant models" });
  }
});

// POST /api/admin/users/:userId/reset-password - Send password reset email
router.post("/users/:userId/reset-password", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = getUserId(req);
    
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      })
      .where(eq(users.id, userId));
    
    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);
    
    // Log the action
    await logAdminAction(
      adminId,
      "reset_password",
      userId,
      { email: user.email },
      getClientIP(req)
    );
    
    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Admin reset password error:", error);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
});

// DELETE /api/admin/users/:userId - Delete user and all their data
router.delete("/users/:userId", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = getUserId(req);
    
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get all user's models to delete associated data
    const userModels = await db.select({ id: models.id }).from(models).where(eq(models.userId, userId));
    const modelIds = userModels.map(m => m.id);
    
    // Delete all associated data in correct order
    if (modelIds.length > 0) {
      // Delete build log photos, build log entries, hop-up parts, and photos for each model
      for (const modelId of modelIds) {
        await db.delete(photos).where(eq(photos.modelId, modelId));
      }
      // Delete all models
      await db.delete(models).where(eq(models.userId, userId));
    }
    
    // Delete user's purchases and activity logs
    await db.delete(purchases).where(eq(purchases.userId, userId));
    await db.delete(userActivityLog).where(eq(userActivityLog.userId, userId));
    
    // Delete admin audit logs where user is admin or target
    await db.delete(adminAuditLog).where(eq(adminAuditLog.adminId, userId));
    await db.delete(adminAuditLog).where(eq(adminAuditLog.targetUserId, userId));
    
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
    
    // Log the action
    await logAdminAction(
      adminId,
      "delete_user",
      userId,
      { email: user.email, modelsDeleted: modelIds.length },
      getClientIP(req)
    );
    
    res.json({ message: "User and all associated data deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
});

// POST /api/admin/users/:userId/make-admin - Grant admin privileges
router.post("/users/:userId/make-admin", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = getUserId(req);
    
    await db.update(users).set({ isAdmin: true }).where(eq(users.id, userId));
    
    // Log the action
    await logAdminAction(
      adminId,
      "make_admin",
      userId,
      {},
      getClientIP(req)
    );
    
    res.json({ message: "User promoted to admin" });
  } catch (error) {
    console.error("Make admin error:", error);
    res.status(500).json({ message: "Failed to promote user" });
  }
});

// POST /api/admin/users/:userId/remove-admin - Revoke admin privileges
router.post("/users/:userId/remove-admin", requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = getUserId(req);
    
    // Prevent removing own admin access
    if (userId === adminId) {
      return res.status(400).json({ message: "Cannot remove your own admin privileges" });
    }
    
    await db.update(users).set({ isAdmin: false }).where(eq(users.id, userId));
    
    // Log the action
    await logAdminAction(
      adminId,
      "remove_admin",
      userId,
      {},
      getClientIP(req)
    );
    
    res.json({ message: "Admin privileges revoked" });
  } catch (error) {
    console.error("Remove admin error:", error);
    res.status(500).json({ message: "Failed to revoke admin privileges" });
  }
});

// GET /api/admin/pricing - Get all pricing tiers
router.get("/pricing", requireAdmin, async (req, res) => {
  try {
    const tiers = await db.select().from(pricingTiers).orderBy(pricingTiers.modelCount);
    res.json(tiers);
  } catch (error) {
    console.error("Get pricing error:", error);
    res.status(500).json({ message: "Failed to load pricing" });
  }
});

// PUT /api/admin/pricing/:id - Update pricing tier
router.put("/pricing/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getUserId(req);
    const validated = insertPricingTierSchema.parse(req.body);
    
    await db
      .update(pricingTiers)
      .set({
        modelCount: validated.modelCount,
        basePrice: validated.basePrice.toString(),
        discountPercent: validated.discountPercent,
        finalPrice: validated.finalPrice.toString(),
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(pricingTiers.id, parseInt(id)));
    
    // Log the action
    await logAdminAction(
      adminId,
      "update_pricing",
      null,
      { tierId: id, ...validated },
      getClientIP(req)
    );
    
    res.json({ message: "Pricing updated successfully" });
  } catch (error) {
    console.error("Update pricing error:", error);
    res.status(500).json({ message: "Failed to update pricing" });
  }
});

// GET /api/admin/activity-log - Get admin audit log
router.get("/activity-log", requireAdmin, async (req, res) => {
  try {
    const logs = await db
      .select({
        id: adminAuditLog.id,
        action: adminAuditLog.action,
        details: adminAuditLog.details,
        ipAddress: adminAuditLog.ipAddress,
        createdAt: adminAuditLog.createdAt,
        adminEmail: users.email,
        targetUserEmail: sql<string>`target_user.email`,
      })
      .from(adminAuditLog)
      .leftJoin(users, eq(adminAuditLog.adminId, users.id))
      .leftJoin(sql`users AS target_user`, sql`${adminAuditLog.targetUserId} = target_user.id`)
      .orderBy(desc(adminAuditLog.createdAt))
      .limit(100);
    
    res.json(logs);
  } catch (error) {
    console.error("Get activity log error:", error);
    res.status(500).json({ message: "Failed to load activity log" });
  }
});

// GET /api/admin/user-activity - Get user activity log
router.get("/user-activity", requireAdmin, async (req, res) => {
  try {
    const logs = await db
      .select({
        id: userActivityLog.id,
        activityType: userActivityLog.activityType,
        details: userActivityLog.details,
        ipAddress: userActivityLog.ipAddress,
        userAgent: userActivityLog.userAgent,
        createdAt: userActivityLog.createdAt,
        userEmail: users.email,
      })
      .from(userActivityLog)
      .leftJoin(users, eq(userActivityLog.userId, users.id))
      .orderBy(desc(userActivityLog.createdAt))
      .limit(200);
    
    res.json(logs);
  } catch (error) {
    console.error("Get user activity error:", error);
    res.status(500).json({ message: "Failed to load user activity" });
  }
});

// GET /api/admin/purchases - Get all purchases
router.get("/purchases", requireAdmin, async (req, res) => {
  try {
    const allPurchases = await db
      .select({
        id: purchases.id,
        modelCount: purchases.modelCount,
        amount: purchases.amount,
        currency: purchases.currency,
        paymentProvider: purchases.paymentProvider,
        paymentId: purchases.paymentId,
        status: purchases.status,
        createdAt: purchases.createdAt,
        userEmail: users.email,
        userId: users.id,
      })
      .from(purchases)
      .leftJoin(users, eq(purchases.userId, users.id))
      .orderBy(desc(purchases.createdAt));
    
    res.json(allPurchases);
  } catch (error) {
    console.error("Get purchases error:", error);
    res.status(500).json({ message: "Failed to load purchases" });
  }
});

// Screenshot Management Routes

// POST /api/admin/upload-screenshot - Upload screenshot file
router.post("/upload-screenshot", requireAdmin, upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    const adminId = getUserId(req);
    const filename = `screenshot-${Date.now()}-${Math.random().toString(36).substring(7)}.${req.file.originalname.split('.').pop()}`;
    
    // Upload to Replit Object Storage
    const savedFilename = await fileStorage.uploadFile(req.file as any, filename);
    const url = fileStorage.getFileUrl(savedFilename);
    
    // Log the action
    await logAdminAction(
      adminId,
      "upload_screenshot",
      null,
      { filename, url },
      getClientIP(req)
    );
    
    res.json({ url, filename });
  } catch (error: any) {
    console.error("Screenshot upload error:", error);
    res.status(500).json({ message: error.message || "Failed to upload screenshot" });
  }
});

// GET /api/admin/screenshots - Get all screenshots
router.get("/screenshots", requireAdmin, async (req, res) => {
  try {
    const screenshots = await db
      .select()
      .from(featureScreenshots)
      .orderBy(featureScreenshots.sortOrder, desc(featureScreenshots.createdAt));
    
    res.json(screenshots);
  } catch (error) {
    console.error("Get screenshots error:", error);
    res.status(500).json({ message: "Failed to load screenshots" });
  }
});

// POST /api/admin/screenshots - Create screenshot
router.post("/screenshots", requireAdmin, async (req, res) => {
  try {
    const adminId = getUserId(req);
    const validated = insertFeatureScreenshotSchema.parse(req.body);
    
    const [screenshot] = await db
      .insert(featureScreenshots)
      .values(validated)
      .returning();
    
    // Log the action
    await logAdminAction(
      adminId,
      "create_screenshot",
      null,
      { screenshotId: screenshot.id, title: validated.title },
      getClientIP(req)
    );
    
    res.status(201).json(screenshot);
  } catch (error) {
    console.error("Create screenshot error:", error);
    res.status(500).json({ message: "Failed to create screenshot" });
  }
});

// PUT /api/admin/screenshots/:id - Update screenshot
router.put("/screenshots/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getUserId(req);
    const validated = insertFeatureScreenshotSchema.partial().parse(req.body);
    
    const [updated] = await db
      .update(featureScreenshots)
      .set({ ...validated, updatedAt: new Date() })
      .where(eq(featureScreenshots.id, parseInt(id)))
      .returning();
    
    if (!updated) {
      return res.status(404).json({ message: "Screenshot not found" });
    }
    
    // Log the action
    await logAdminAction(
      adminId,
      "update_screenshot",
      null,
      { screenshotId: id, changes: validated },
      getClientIP(req)
    );
    
    res.json(updated);
  } catch (error) {
    console.error("Update screenshot error:", error);
    res.status(500).json({ message: "Failed to update screenshot" });
  }
});

// DELETE /api/admin/screenshots/:id - Delete screenshot
router.delete("/screenshots/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = getUserId(req);
    
    const [deleted] = await db
      .delete(featureScreenshots)
      .where(eq(featureScreenshots.id, parseInt(id)))
      .returning();
    
    if (!deleted) {
      return res.status(404).json({ message: "Screenshot not found" });
    }
    
    // Log the action
    await logAdminAction(
      adminId,
      "delete_screenshot",
      null,
      { screenshotId: id, title: deleted.title },
      getClientIP(req)
    );
    
    res.status(204).send();
  } catch (error) {
    console.error("Delete screenshot error:", error);
    res.status(500).json({ message: "Failed to delete screenshot" });
  }
});

// ============================================================================
// Shared Models Management Routes
// ============================================================================

// GET /api/admin/shared-models - Get all shared models for admin review
router.get("/shared-models", requireAdmin, async (req, res) => {
  try {
    const sharedModels = await storage.getAllSharedModelsForAdmin();
    res.json(sharedModels);
  } catch (error) {
    console.error("Get shared models error:", error);
    res.status(500).json({ message: "Failed to load shared models" });
  }
});

// POST /api/admin/shared-models/:id/unshare - Admin force unshare a model
router.post("/shared-models/:id/unshare", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = getUserId(req);
    const modelId = parseInt(id);
    
    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ message: "Reason is required" });
    }
    
    // Get model info before unsharing for logging
    const sharedModels = await storage.getAllSharedModelsForAdmin();
    const targetModel = sharedModels.find(sm => sm.model.id === modelId);
    
    if (!targetModel) {
      return res.status(404).json({ message: "Shared model not found" });
    }
    
    // Unshare the model
    const updatedModel = await storage.adminUnshareModel(modelId);
    
    if (!updatedModel) {
      return res.status(500).json({ message: "Failed to unshare model" });
    }
    
    // Log admin action
    await logAdminAction(
      adminId,
      "admin_unshare_model",
      targetModel.owner.id,
      {
        modelId: modelId,
        modelName: targetModel.model.name,
        reason: reason.trim(),
        previousSlug: targetModel.model.publicSlug,
      },
      getClientIP(req)
    );
    
    // Also log to user activity for transparency
    await db.insert(userActivityLog).values({
      userId: targetModel.owner.id,
      activityType: 'model_unshared_by_admin',
      details: {
        modelId: modelId,
        modelName: targetModel.model.name,
        reason: reason.trim(),
        adminId: adminId,
      },
      ipAddress: getClientIP(req),
      userAgent: 'Admin Panel',
    });
    
    res.json({ 
      message: "Model unshared successfully",
      model: updatedModel 
    });
  } catch (error) {
    console.error("Admin unshare model error:", error);
    res.status(500).json({ message: "Failed to unshare model" });
  }
});

export default router;
