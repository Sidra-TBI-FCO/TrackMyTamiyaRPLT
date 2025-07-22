import { pgTable, text, serial, integer, boolean, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const models = pgTable("models", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  itemNumber: text("item_number").notNull(),
  chassis: text("chassis"),
  releaseYear: integer("release_year"),
  buildStatus: text("build_status").notNull().default("planning"), // planning, building, built, maintenance
  modelType: text("model_type").notNull().default("kit"), // 'kit' or 'chassis_body'
  bodyName: text("body_name"), // Used when modelType is 'chassis_body'
  bodyItemNumber: text("body_item_number"), // Used when modelType is 'chassis_body'
  totalCost: numeric("total_cost", { precision: 10, scale: 2 }).default("0"),
  boxArt: text("box_art"),
  manualUrl: text("manual_url"),
  notes: text("notes"),
  tags: text("tags").array().default([]), // Array of tags for organization
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
  supplier: text("supplier"),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  installationStatus: text("installation_status").notNull().default("planned"), // planned, installed, removed
  installationDate: timestamp("installation_date"),
  notes: text("notes"),
  photoId: integer("photo_id").references(() => photos.id),
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
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertModelSchema = createInsertSchema(models).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true,
});

export const insertBuildLogEntrySchema = createInsertSchema(buildLogEntries).omit({
  id: true,
  createdAt: true,
});

export const insertHopUpPartSchema = createInsertSchema(hopUpParts).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
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
