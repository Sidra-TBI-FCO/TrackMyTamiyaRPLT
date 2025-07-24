import { 
  users, models, photos, buildLogEntries, buildLogPhotos, hopUpParts,
  type User, type UpsertUser,
  type Model, type InsertModel, type ModelWithRelations,
  type Photo, type InsertPhoto,
  type BuildLogEntry, type InsertBuildLogEntry, type BuildLogEntryWithPhotos,
  type HopUpPart, type InsertHopUpPart,
  type BuildLogPhoto
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth and traditional auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  updateUserVerificationToken(userId: string, token: string): Promise<void>;

  // Model methods
  getModels(userId: string): Promise<ModelWithRelations[]>;
  getModel(id: number, userId: string): Promise<ModelWithRelations | undefined>;
  createModel(model: InsertModel): Promise<Model>;
  updateModel(id: number, userId: string, model: Partial<InsertModel>): Promise<Model | undefined>;
  deleteModel(id: number, userId: string): Promise<boolean>;

  // Photo methods
  getPhotos(modelId: number, userId: string): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  updatePhoto(id: number, userId: string, photo: Partial<InsertPhoto>): Promise<Photo | undefined>;
  deletePhoto(id: number, userId: string): Promise<boolean>;

  // Build log methods
  getAllBuildLogEntries(userId: string): Promise<BuildLogEntryWithPhotos[]>;
  getBuildLogEntries(modelId: number, userId: string): Promise<BuildLogEntryWithPhotos[]>;
  createBuildLogEntry(entry: InsertBuildLogEntry): Promise<BuildLogEntry>;
  updateBuildLogEntry(id: number, userId: string, entry: Partial<InsertBuildLogEntry>): Promise<BuildLogEntry | undefined>;
  deleteBuildLogEntry(id: number, userId: string): Promise<boolean>;
  addPhotosToEntry(entryId: number, photoIds: number[]): Promise<BuildLogPhoto[]>;

  // Hop-up parts methods
  getHopUpParts(modelId: number, userId: string): Promise<HopUpPart[]>;
  createHopUpPart(part: InsertHopUpPart): Promise<HopUpPart>;
  updateHopUpPart(id: number, userId: string, part: Partial<InsertHopUpPart>): Promise<HopUpPart | undefined>;
  deleteHopUpPart(id: number, userId: string): Promise<boolean>;

  // Stats methods
  getCollectionStats(userId: string): Promise<{
    totalModels: number;
    activeBuilds: number;
    totalInvestment: string;
    totalPhotos: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user || undefined;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db.update(users)
      .set({ 
        isVerified: true, 
        verificationToken: null,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserVerificationToken(userId: string, token: string): Promise<void> {
    await db.update(users)
      .set({ 
        verificationToken: token,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async getModels(userId: string): Promise<ModelWithRelations[]> {
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

  async getModel(id: number, userId: string): Promise<ModelWithRelations | undefined> {
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

  async updateModel(id: number, userId: string, model: Partial<InsertModel>): Promise<Model | undefined> {
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

  async deleteModel(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(models)
      .where(and(eq(models.id, id), eq(models.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getPhotos(modelId: number, userId: string): Promise<Photo[]> {
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

  async updatePhoto(id: number, userId: string, photo: Partial<InsertPhoto>): Promise<Photo | undefined> {
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

  async deletePhoto(id: number, userId: string): Promise<boolean> {
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

  async clearModelBoxArt(modelId: number, userId: string): Promise<void> {
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

  async getPhoto(id: number, userId: string): Promise<Photo | undefined> {
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

  async getAllBuildLogEntries(userId: string): Promise<BuildLogEntryWithPhotos[]> {
    try {
      // Use a simpler approach: get all models with their build log entries
      const userModels = await db.query.models.findMany({
        where: eq(models.userId, userId),
        with: {
          buildLogEntries: {
            with: {
              photos: {
                with: {
                  photo: true,
                },
              },
            },
            orderBy: desc(buildLogEntries.createdAt),
          },
        },
      });
      
      // Flatten the build log entries and add model info
      const allEntries: (BuildLogEntryWithPhotos & { model: { id: number; name: string } })[] = [];
      
      for (const model of userModels) {
        for (const entry of model.buildLogEntries) {
          allEntries.push({
            ...entry,
            model: {
              id: model.id,
              name: model.name,
            },
          });
        }
      }
      
      // Sort by creation date
      return allEntries.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error('Error in getAllBuildLogEntries:', error);
      throw error;
    }
  }

  async getBuildLogEntries(modelId: number, userId: string): Promise<BuildLogEntryWithPhotos[]> {
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

  async updateBuildLogEntry(id: number, userId: string, entry: Partial<InsertBuildLogEntry>): Promise<BuildLogEntry | undefined> {
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

  async deleteBuildLogEntry(id: number, userId: string): Promise<boolean> {
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

  async getHopUpParts(modelId: number, userId: string): Promise<HopUpPart[]> {
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

  async updateHopUpPart(id: number, userId: string, part: Partial<InsertHopUpPart>): Promise<HopUpPart | undefined> {
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

  async deleteHopUpPart(id: number, userId: string): Promise<boolean> {
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

  async getCollectionStats(userId: string): Promise<{
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
