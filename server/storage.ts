import { 
  users, models, photos, buildLogEntries, buildLogPhotos, hopUpParts,
  type User, type InsertUser,
  type Model, type InsertModel, type ModelWithRelations,
  type Photo, type InsertPhoto,
  type BuildLogEntry, type InsertBuildLogEntry, type BuildLogEntryWithPhotos,
  type HopUpPart, type InsertHopUpPart,
  type BuildLogPhoto
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Model methods
  getModels(userId: number): Promise<ModelWithRelations[]>;
  getModel(id: number, userId: number): Promise<ModelWithRelations | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, userId: number, model: Partial<InsertModel>): Promise<Model | undefined>;
  deleteModel(id: number, userId: number): Promise<boolean>;

  // Photo methods
  getPhotos(modelId: number, userId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, userId: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number, userId: number): Promise<boolean>;

  // Build log methods
  getBuildLogEntries(modelId: number, userId: number): Promise<BuildLogEntryWithPhotos[]>;
  createBuildLogEntry(entry: InsertBuildLogEntry): Promise<BuildLogEntry>;
  updateBuildLogEntry(id: number, userId: number, entry: Partial<InsertBuildLogEntry>): Promise<BuildLogEntry | undefined>;
  deleteBuildLogEntry(id: number, userId: number): Promise<boolean>;
  addPhotosToEntry(entryId: number, photoIds: number[]): Promise<BuildLogPhoto[]>;

  // Hop-up parts methods
  getHopUpParts(modelId: number, userId: number): Promise<HopUpPart[]>;
  createHopUpPart(part: InsertHopUpPart): Promise<HopUpPart>;
  updateHopUpPart(id: number, userId: number, part: Partial<InsertHopUpPart>): Promise<HopUpPart | undefined>;
  deleteHopUpPart(id: number, userId: number): Promise<boolean>;

  // Stats methods
  getCollectionStats(userId: number): Promise<{
    totalModels: number;
    activeBuilds: number;
    totalInvestment: string;
    totalPhotos: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getModels(userId: number): Promise<ModelWithRelations[]> {
    return await db.query.models.findMany({
      where: eq(models.userId, userId),
      with: {
        photos: {
          orderBy: desc(photos.createdAt),
        },
        buildLogEntries: {
          orderBy: desc(buildLogEntries.entryDate),
          limit: 3,
        },
        hopUpParts: {
          orderBy: desc(hopUpParts.createdAt),
        },
      },
      orderBy: desc(models.updatedAt),
    });
  }

  async getModel(id: number, userId: number): Promise<ModelWithRelations | undefined> {
    return await db.query.models.findFirst({
      where: and(eq(models.id, id), eq(models.userId, userId)),
      with: {
        photos: {
          orderBy: desc(photos.createdAt),
        },
        buildLogEntries: {
          orderBy: desc(buildLogEntries.entryDate),
        },
        hopUpParts: {
          orderBy: desc(hopUpParts.createdAt),
        },
      },
    });
  }

  async createModel(model: InsertModel): Promise<Model> {
    const [newModel] = await db.insert(models).values({
      ...model,
      totalCost: model.totalCost?.toString()
    }).returning();
    return newModel;
  }

  async updateModel(id: number, userId: number, model: Partial<InsertModel>): Promise<Model | undefined> {
    const [updated] = await db
      .update(models)
      .set({ 
        ...model, 
        totalCost: model.totalCost?.toString(),
        updatedAt: new Date() 
      })
      .where(and(eq(models.id, id), eq(models.userId, userId)))
      .returning();
    return updated || undefined;
  }

  async deleteModel(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(models)
      .where(and(eq(models.id, id), eq(models.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getPhotos(modelId: number, userId: number): Promise<Photo[]> {
    // Verify model belongs to user first
    const model = await db.query.models.findFirst({
      where: and(eq(models.id, modelId), eq(models.userId, userId)),
    });
    
    if (!model) return [];

    return await db.select().from(photos)
      .where(eq(photos.modelId, modelId))
      .orderBy(desc(photos.createdAt));
  }

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values(photo).returning();
    return newPhoto;
  }

  async updatePhoto(id: number, userId: number, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
    // Verify photo belongs to user's model
    const existingPhoto = await db.query.photos.findFirst({
      where: eq(photos.id, id),
      with: {
        model: true,
      },
    });

    if (!existingPhoto || existingPhoto.model.userId !== userId) {
      return undefined;
    }

    const [updated] = await db
      .update(photos)
      .set(photo)
      .where(eq(photos.id, id))
      .returning();
    return updated || undefined;
  }

  async deletePhoto(id: number, userId: number): Promise<boolean> {
    // Verify photo belongs to user's model
    const existingPhoto = await db.query.photos.findFirst({
      where: eq(photos.id, id),
      with: {
        model: true,
      },
    });

    if (!existingPhoto || existingPhoto.model.userId !== userId) {
      return false;
    }

    const result = await db.delete(photos).where(eq(photos.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async clearModelBoxArt(modelId: number, userId: number): Promise<void> {
    // Verify model belongs to user
    const model = await db.query.models.findFirst({
      where: and(eq(models.id, modelId), eq(models.userId, userId)),
    });
    
    if (!model) return;

    // Set all photos in this model to isBoxArt = false
    await db
      .update(photos)
      .set({ isBoxArt: false })
      .where(eq(photos.modelId, modelId));
  }

  async getPhoto(id: number, userId: number): Promise<Photo | undefined> {
    const photo = await db.query.photos.findFirst({
      where: eq(photos.id, id),
      with: {
        model: true,
      },
    });

    if (!photo || photo.model.userId !== userId) {
      return undefined;
    }

    return photo;
  }

  async getBuildLogEntries(modelId: number, userId: number): Promise<BuildLogEntryWithPhotos[]> {
    // Verify model belongs to user
    const model = await db.query.models.findFirst({
      where: and(eq(models.id, modelId), eq(models.userId, userId)),
    });
    
    if (!model) return [];

    return await db.query.buildLogEntries.findMany({
      where: eq(buildLogEntries.modelId, modelId),
      with: {
        photos: {
          with: {
            photo: true,
          },
        },
      },
      orderBy: desc(buildLogEntries.entryDate),
    });
  }

  async createBuildLogEntry(entry: InsertBuildLogEntry): Promise<BuildLogEntry> {
    const [newEntry] = await db.insert(buildLogEntries).values(entry).returning();
    return newEntry;
  }

  async updateBuildLogEntry(id: number, userId: number, entry: Partial<InsertBuildLogEntry>): Promise<BuildLogEntry | undefined> {
    // Verify entry belongs to user's model
    const existingEntry = await db.query.buildLogEntries.findFirst({
      where: eq(buildLogEntries.id, id),
      with: {
        model: true,
      },
    });

    if (!existingEntry || existingEntry.model.userId !== userId) {
      return undefined;
    }

    const [updated] = await db
      .update(buildLogEntries)
      .set(entry)
      .where(eq(buildLogEntries.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteBuildLogEntry(id: number, userId: number): Promise<boolean> {
    // Verify entry belongs to user's model
    const existingEntry = await db.query.buildLogEntries.findFirst({
      where: eq(buildLogEntries.id, id),
      with: {
        model: true,
      },
    });

    if (!existingEntry || existingEntry.model.userId !== userId) {
      return false;
    }

    const result = await db.delete(buildLogEntries).where(eq(buildLogEntries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async addPhotosToEntry(entryId: number, photoIds: number[]): Promise<BuildLogPhoto[]> {
    const values = photoIds.map(photoId => ({ buildLogEntryId: entryId, photoId }));
    return await db.insert(buildLogPhotos).values(values).returning();
  }

  async getHopUpParts(modelId: number, userId: number): Promise<HopUpPart[]> {
    // Verify model belongs to user
    const model = await db.query.models.findFirst({
      where: and(eq(models.id, modelId), eq(models.userId, userId)),
    });
    
    if (!model) return [];

    return await db.select().from(hopUpParts)
      .where(eq(hopUpParts.modelId, modelId))
      .orderBy(desc(hopUpParts.createdAt));
  }

  async createHopUpPart(part: InsertHopUpPart): Promise<HopUpPart> {
    const [newPart] = await db.insert(hopUpParts).values({
      ...part,
      cost: part.cost?.toString()
    }).returning();
    return newPart;
  }

  async updateHopUpPart(id: number, userId: number, part: Partial<InsertHopUpPart>): Promise<HopUpPart | undefined> {
    // Verify part belongs to user's model
    const existingPart = await db.query.hopUpParts.findFirst({
      where: eq(hopUpParts.id, id),
      with: {
        model: true,
      },
    });

    if (!existingPart || existingPart.model.userId !== userId) {
      return undefined;
    }

    const [updated] = await db
      .update(hopUpParts)
      .set({
        ...part,
        cost: part.cost?.toString()
      })
      .where(eq(hopUpParts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteHopUpPart(id: number, userId: number): Promise<boolean> {
    // Verify part belongs to user's model
    const existingPart = await db.query.hopUpParts.findFirst({
      where: eq(hopUpParts.id, id),
      with: {
        model: true,
      },
    });

    if (!existingPart || existingPart.model.userId !== userId) {
      return false;
    }

    const result = await db.delete(hopUpParts).where(eq(hopUpParts.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getCollectionStats(userId: number): Promise<{
    totalModels: number;
    activeBuilds: number;
    totalInvestment: string;
    totalPhotos: number;
  }> {
    const userModels = await db.query.models.findMany({
      where: eq(models.userId, userId),
      with: {
        photos: true,
      },
    });

    const totalModels = userModels.length;
    const activeBuilds = userModels.filter(m => m.buildStatus === 'building').length;
    const totalInvestment = userModels
      .reduce((sum, model) => sum + parseFloat(model.totalCost || '0'), 0)
      .toFixed(2);
    const totalPhotos = userModels.reduce((sum, model) => sum + model.photos.length, 0);

    return {
      totalModels,
      activeBuilds,
      totalInvestment,
      totalPhotos,
    };
  }
}

export const storage = new DatabaseStorage();
