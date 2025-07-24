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
  authProvider: varchar("auth_provider").notNull().default("email"), // "replit" or "email"
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  resetPasswordToken: varchar("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  models: many(models),
}));

export const modelsRelations = relations(models, ({ one, many }) => ({
  user: one(users, {
    fields: [models.userId],
    references: [users.id],
  }),
  photos: many(photos),
  buildLogEntries: many(buildLogEntries),
  hopUpParts: many(hopUpParts),
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

// Insert schemas
export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
  verificationToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
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

// Extended types with relations
export type ModelWithRelations = Model & {
  photos: Photo[];
  buildLogEntries: BuildLogEntry[];
  hopUpParts: HopUpPart[];
};

export type BuildLogEntryWithPhotos = BuildLogEntry & {
  photos: { photo: Photo }[];
};
