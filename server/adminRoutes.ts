import { Router } from "express";
import { db } from "./db";
import { 
  users, models, photos, purchases, pricingTiers, adminAuditLog, userActivityLog,
  insertPricingTierSchema, insertPurchaseSchema, insertAdminAuditLogSchema
} from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { requireAdmin, getClientIP } from "./adminMiddleware";
import { sendPasswordResetEmail } from "./emailService";
import crypto from "crypto";

const router = Router();

// Helper function to get user ID from either auth type
function getUserId(req: any): string {
  const userId = req.user?.claims?.sub || req.user?.id;
  console.log('🆔 getUserId in adminRoutes:', { 
    userId, 
    hasClaims: !!req.user?.claims,
    hasId: !!req.user?.id,
    user: req.user 
  });
  return userId;
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
    
    // Delete user (cascade will handle models, photos, etc.)
    await db.delete(users).where(eq(users.id, userId));
    
    // Log the action
    await logAdminAction(
      adminId,
      "delete_user",
      userId,
      { email: user.email },
      getClientIP(req)
    );
    
    res.json({ message: "User deleted successfully" });
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

export default router;
