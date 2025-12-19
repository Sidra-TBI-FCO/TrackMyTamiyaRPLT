import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table supporting both Replit Auth and traditional email/password
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Traditional auth fields
  password: varchar("password"), // Hashed password for email/password auth
  authProvider: varchar("auth_provider").notNull().default("email"), // "replit" or "email" or "google"
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  // Admin and subscription fields
  isAdmin: boolean("is_admin").default(false),
  modelLimit: integer("model_limit").default(2), // Free tier: 2 models
  manuallyGrantedModels: integer("manually_granted_models").default(0), // Admin can grant extra models
  // Sharing preferences: 'public' (anyone), 'authenticated' (logged-in users), 'private' (no sharing)
  sharePreference: varchar("share_preference").notNull().default("private"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  itemNumber: text("item_number").notNull(),
  chassis: text("chassis"),
  releaseYear: integer("release_year"),
  buildStatus: text("build_status").notNull().default("planning"), // planning, building, built, maintenance
  buildType: text("build_type").notNull().default("kit"), // kit, custom
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).default("0"),
  boxArt: text("box_art"),
  manualUrl: text("manual_url"),
  notes: text("notes"),
  scale: text("scale"), // 1/10, 1/12, 1/8, etc.
  driveType: text("drive_type"), // RWD, FWD, 4WD
  chassisMaterial: text("chassis_material"), // Plastic, Carbon, Aluminium
  differentialType: text("differential_type"), // Gears, Oil, Ball Diff, etc.
  motorSize: text("motor_size"), // 540, 380, brushless specifications
  batteryType: text("battery_type"), // NiMH, LiPo, battery specifications
  bodyName: text("body_name"), // For custom builds - separate body
  bodyItemNumber: text("body_item_number"), // For custom builds - body item number
  bodyManufacturer: text("body_manufacturer"), // For custom builds - body manufacturer
  tamiyaUrl: text("tamiya_url"), // Link to official Tamiya page
  tamiyaBaseUrl: text("tamiya_base_url"), // Link to TamiyaBase page
  tags: text("tags").array().default(sql`'{}'::text[]`), // Array of tags for organization
  // Sharing fields
  isShared: boolean("is_shared").default(false), // User wants to share this model
  publicSlug: varchar("public_slug").unique(), // Unique slug for public URL
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  url: text("url").notNull(),
  caption: text("caption"),
  metadata: jsonb("metadata"), // EXIF data, dimensions, etc.
  isBoxArt: boolean("is_box_art").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buildLogEntries = pgTable("build_log_entries", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  entryNumber: integer("entry_number").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  voiceNoteUrl: text("voice_note_url"),
  transcription: text("transcription"),
  entryDate: timestamp("entry_date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buildLogPhotos = pgTable("build_log_photos", {
  id: serial("id").primaryKey(),
  buildLogEntryId: integer("build_log_entry_id").references(() => buildLogEntries.id, { onDelete: "cascade" }).notNull(),
  photoId: integer("photo_id").references(() => photos.id, { onDelete: "cascade" }).notNull(),
});

export const hopUpParts = pgTable("hop_up_parts", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  itemNumber: text("item_number"),
  category: text("category").notNull(), // motor, suspension, tires, body, electronics, etc.
  supplier: text("supplier"), // Store/retailer where purchased
  manufacturer: text("manufacturer"), // Brand that makes the part
  cost: numeric("cost", { precision: 10, scale: 2 }),
  quantity: integer("quantity").notNull().default(1), // Number of this part used on the model
  installationStatus: text("installation_status").notNull().default("planned"), // planned, installed, removed
  installationDate: timestamp("installation_date"),
  notes: text("notes"),
  photoId: integer("photo_id").references(() => photos.id),
  isTamiyaBrand: boolean("is_tamiya_brand").default(false),
  productUrl: text("product_url"),
  tamiyaBaseUrl: text("tamiya_base_url"), // Link to TamiyaBase part page
  storeUrls: jsonb("store_urls").default(sql`'{}'::jsonb`), // Object with store names as keys and URLs as values
  compatibility: text("compatibility").array().default(sql`'{}'::text[]`), // Compatible chassis types
  color: text("color"),
  material: text("material"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pricing tiers - admin configurable pricing for model packs
export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  modelCount: integer("model_count").notNull().unique(), // 10, 20, 50, 100
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull(), // Price without discount
  discountPercent: integer("discount_percent").notNull().default(0), // 0, 5, 10, 20, 30
  finalPrice: numeric("final_price", { precision: 10, scale: 2 }).notNull(), // Calculated price after discount
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Purchase history - track all model pack purchases
export const purchases = pgTable("purchases", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  modelCount: integer("model_count").notNull(), // Number of models purchased
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(), // Amount paid
  currency: varchar("currency").notNull().default("USD"),
  paymentProvider: varchar("payment_provider").notNull(), // "stripe", "playstore", "appstore"
  paymentId: varchar("payment_id"), // External payment ID from provider
  status: varchar("status").notNull().default("completed"), // "pending", "completed", "failed", "refunded"
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Admin audit log - track all admin actions
export const adminAuditLog = pgTable("admin_audit_log", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // "grant_models", "reset_password", "delete_user", "make_admin", etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  details: jsonb("details"), // Additional context about the action
  ipAddress: varchar("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User activity log - track logins and model operations
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  activityType: varchar("activity_type").notNull(), // "login", "model_created", "model_deleted", "photo_uploaded"
  details: jsonb("details"), // Additional context
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Feature screenshots - admin-managed screenshots for marketing pages
export const featureScreenshots = pgTable("feature_screenshots", {
  id: serial("id").primaryKey(),
  title: varchar("title").notNull(),
  description: text("description"),
  category: varchar("category").notNull(), // "mobile", "desktop", "admin"
  imageUrl: text("image_url").notNull(), // URL to screenshot in object storage
  route: varchar("route"), // App route this screenshot showcases (e.g., "/models", "/admin")
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback posts - user feature requests and feedback
export const feedbackPosts = pgTable("feedback_posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category").notNull().default("feature"), // "feature", "bug", "improvement", "other"
  status: varchar("status").notNull().default("open"), // "open", "planned", "in_progress", "completed", "declined"
  voteCount: integer("vote_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Feedback votes - track who voted for what (prevents duplicates)
export const feedbackVotes = pgTable("feedback_votes", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => feedbackPosts.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_feedback_votes_unique").on(table.feedbackId, table.userId),
]);

// Community model comments - comments on shared models
export const modelComments = pgTable("model_comments", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => models.id, { onDelete: "cascade" }).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  models: many(models),
  purchases: many(purchases),
  activityLogs: many(userActivityLog),
  feedbackPosts: many(feedbackPosts),
  feedbackVotes: many(feedbackVotes),
  modelComments: many(modelComments),
}));

export const feedbackPostsRelations = relations(feedbackPosts, ({ one, many }) => ({
  user: one(users, {
    fields: [feedbackPosts.userId],
    references: [users.id],
  }),
  votes: many(feedbackVotes),
}));

export const feedbackVotesRelations = relations(feedbackVotes, ({ one }) => ({
  feedbackPost: one(feedbackPosts, {
    fields: [feedbackVotes.feedbackId],
    references: [feedbackPosts.id],
  }),
  user: one(users, {
    fields: [feedbackVotes.userId],
    references: [users.id],
  }),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  user: one(users, {
    fields: [models.userId],
    references: [users.id],
  }),
  photos: many(photos),
  buildLogEntries: many(buildLogEntries),
  hopUpParts: many(hopUpParts),
  comments: many(modelComments),
}));

export const photosRelations = relations(photos, ({ one, many }) => ({
  model: one(models, {
    fields: [photos.modelId],
    references: [models.id],
  }),
  buildLogPhotos: many(buildLogPhotos),
  hopUpPart: one(hopUpParts),
}));

export const buildLogEntriesRelations = relations(buildLogEntries, ({ one, many }) => ({
  model: one(models, {
    fields: [buildLogEntries.modelId],
    references: [models.id],
  }),
  photos: many(buildLogPhotos),
}));

export const buildLogPhotosRelations = relations(buildLogPhotos, ({ one }) => ({
  buildLogEntry: one(buildLogEntries, {
    fields: [buildLogPhotos.buildLogEntryId],
    references: [buildLogEntries.id],
  }),
  photo: one(photos, {
    fields: [buildLogPhotos.photoId],
    references: [photos.id],
  }),
}));

export const hopUpPartsRelations = relations(hopUpParts, ({ one }) => ({
  model: one(models, {
    fields: [hopUpParts.modelId],
    references: [models.id],
  }),
  photo: one(photos, {
    fields: [hopUpParts.photoId],
    references: [photos.id],
  }),
}));

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
}));

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(users, {
    fields: [adminAuditLog.adminId],
    references: [users.id],
  }),
  targetUser: one(users, {
    fields: [adminAuditLog.targetUserId],
    references: [users.id],
  }),
}));

export const userActivityLogRelations = relations(userActivityLog, ({ one }) => ({
  user: one(users, {
    fields: [userActivityLog.userId],
    references: [users.id],
  }),
}));

export const modelCommentsRelations = relations(modelComments, ({ one }) => ({
  model: one(models, {
    fields: [modelComments.modelId],
    references: [models.id],
  }),
  user: one(users, {
    fields: [modelComments.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

// Schema for email/password registration
export const registerUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

// Schema for email/password login
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertModelSchema = createInsertSchema(models, {
  releaseYear: z.coerce.number().optional(),
  totalCost: z.coerce.number().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scale: z.string().optional(),
  driveType: z.string().optional(),
  chassisMaterial: z.string().optional(),
  differentialType: z.string().optional(),
  motorSize: z.string().optional(),
  batteryType: z.string().optional(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertBuildLogEntrySchema = createInsertSchema(buildLogEntries).omit({
  id: true,
  createdAt: true,
});

export const insertHopUpPartSchema = createInsertSchema(hopUpParts, {
  cost: z.coerce.number().optional(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertPricingTierSchema = createInsertSchema(pricingTiers, {
  basePrice: z.coerce.number(),
  finalPrice: z.coerce.number(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPurchaseSchema = createInsertSchema(purchases, {
  amount: z.coerce.number(),
}).omit({
  id: true,
  createdAt: true,
});

export const insertAdminAuditLogSchema = createInsertSchema(adminAuditLog).omit({
  id: true,
  createdAt: true,
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
  id: true,
  createdAt: true,
});

export const insertFeatureScreenshotSchema = createInsertSchema(featureScreenshots).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackPostSchema = createInsertSchema(feedbackPosts).omit({
  id: true,
  voteCount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFeedbackVoteSchema = createInsertSchema(feedbackVotes).omit({
  id: true,
  createdAt: true,
});

export const insertModelCommentSchema = createInsertSchema(modelComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertModel = z.infer<typeof insertModelSchema>;
export type Model = typeof models.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertBuildLogEntry = z.infer<typeof insertBuildLogEntrySchema>;
export type BuildLogEntry = typeof buildLogEntries.$inferSelect;
export type InsertHopUpPart = z.infer<typeof insertHopUpPartSchema>;
export type HopUpPart = typeof hopUpParts.$inferSelect;
export type BuildLogPhoto = typeof buildLogPhotos.$inferSelect;
export type PricingTier = typeof pricingTiers.$inferSelect;
export type InsertPricingTier = z.infer<typeof insertPricingTierSchema>;
export type Purchase = typeof purchases.$inferSelect;
export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type AdminAuditLog = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = z.infer<typeof insertAdminAuditLogSchema>;
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;
export type FeatureScreenshot = typeof featureScreenshots.$inferSelect;
export type InsertFeatureScreenshot = z.infer<typeof insertFeatureScreenshotSchema>;
export type FeedbackPost = typeof feedbackPosts.$inferSelect;
export type InsertFeedbackPost = z.infer<typeof insertFeedbackPostSchema>;
export type FeedbackVote = typeof feedbackVotes.$inferSelect;
export type InsertFeedbackVote = z.infer<typeof insertFeedbackVoteSchema>;
export type ModelComment = typeof modelComments.$inferSelect;
export type InsertModelComment = z.infer<typeof insertModelCommentSchema>;

// Extended types with user info
export type ModelCommentWithUser = ModelComment & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'>;
};

// Extended feedback type with user info and vote status
export type FeedbackPostWithUser = FeedbackPost & {
  user: Pick<User, 'id' | 'firstName' | 'lastName' | 'profileImageUrl'>;
  hasVoted?: boolean;
};

// Extended types with relations
export type HopUpPartWithPhoto = HopUpPart & {
  photo?: Photo | null;
};

export type ModelWithRelations = Model & {
  photos: Photo[];
  buildLogEntries: BuildLogEntry[];
  hopUpParts: HopUpPartWithPhoto[];
};

export type BuildLogEntryWithPhotos = BuildLogEntry & {
  photos: { photo: Photo }[];
};

export type UserWithStats = User & {
  modelCount: number;
  storageUsed: number;
  totalSpent: number;
};

export type PurchaseWithUser = Purchase & {
  user: User;
};
