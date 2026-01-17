import { 
  users, models, photos, buildLogEntries, buildLogPhotos, hopUpParts,
  feedbackPosts, feedbackVotes, modelComments, fieldOptions,
  motors, escs, servos, receivers, modelElectronics, hopUpLibrary,
  type User, type UpsertUser,
  type Model, type InsertModel, type ModelWithRelations,
  type Photo, type InsertPhoto,
  type BuildLogEntry, type InsertBuildLogEntry, type BuildLogEntryWithPhotos,
  type HopUpPart, type InsertHopUpPart, type HopUpPartWithPhoto,
  type BuildLogPhoto,
  type FeedbackPost, type InsertFeedbackPost, type FeedbackPostWithUser,
  type ModelComment, type InsertModelComment, type ModelCommentWithUser,
  type FieldOption, type InsertFieldOption,
  type Motor, type InsertMotor,
  type Esc, type InsertEsc,
  type Servo, type InsertServo,
  type Receiver, type InsertReceiver,
  type HopUpLibraryItem, type InsertHopUpLibraryItem,
  type ModelElectronics, type InsertModelElectronics, type ModelElectronicsWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";

export interface IStorage {
  // User methods for Replit Auth and traditional auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  verifyUserEmail(userId: string): Promise<void>;
  updateUserVerificationToken(userId: string, token: string): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  updateResetPasswordToken(userId: string, token: string | null, expires: Date | null): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

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
  getBuildLogEntry(entryId: number, userId: string): Promise<BuildLogEntry | undefined>;
  createBuildLogEntry(entry: InsertBuildLogEntry): Promise<BuildLogEntry>;
  updateBuildLogEntry(id: number, userId: string, entry: Partial<InsertBuildLogEntry>): Promise<BuildLogEntry | undefined>;
  deleteBuildLogEntry(id: number, userId: string): Promise<boolean>;
  addPhotosToEntry(entryId: number, photoIds: number[]): Promise<BuildLogPhoto[]>;

  // Hop-up parts methods
  getHopUpParts(modelId: number, userId: string): Promise<HopUpPartWithPhoto[]>;
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

  // Feedback methods
  getFeedbackPosts(currentUserId?: string, category?: string, status?: string): Promise<FeedbackPostWithUser[]>;
  getFeedbackPost(id: number, currentUserId?: string): Promise<FeedbackPostWithUser | undefined>;
  createFeedbackPost(post: InsertFeedbackPost): Promise<FeedbackPost>;
  updateFeedbackPostStatus(id: number, status: string): Promise<FeedbackPost | undefined>;
  deleteFeedbackPost(id: number, userId: string): Promise<boolean>;
  voteFeedback(feedbackId: number, userId: string): Promise<boolean>;
  unvoteFeedback(feedbackId: number, userId: string): Promise<boolean>;
  hasUserVoted(feedbackId: number, userId: string): Promise<boolean>;

  // Community/Sharing methods
  updateUserSharePreference(userId: string, preference: string): Promise<User | undefined>;
  getSharedModels(viewerUserId?: string): Promise<ModelWithRelations[]>;
  getSharedModelBySlug(slug: string, viewerUserId?: string): Promise<ModelWithRelations | undefined>;
  getSharedModelPhotos(slug: string, viewerUserId?: string): Promise<Photo[]>;
  getSharedModelHopUps(slug: string, viewerUserId?: string): Promise<HopUpPartWithPhoto[]>;
  getSharedModelBuildLogs(slug: string, viewerUserId?: string): Promise<BuildLogEntryWithPhotos[]>;
  getSharedModelElectronics(slug: string, viewerUserId?: string): Promise<ModelElectronicsWithDetails | null>;
  
  // Model comments methods
  getModelComments(modelId: number): Promise<ModelCommentWithUser[]>;
  createModelComment(comment: InsertModelComment): Promise<ModelComment>;
  deleteModelComment(id: number, userId: string): Promise<boolean>;

  // Field options methods (admin-managed dropdown options)
  getFieldOptions(fieldKey: string): Promise<FieldOption[]>;
  getAllFieldOptions(): Promise<FieldOption[]>;
  createFieldOption(option: InsertFieldOption): Promise<FieldOption>;
  updateFieldOption(id: number, option: Partial<InsertFieldOption>): Promise<FieldOption | undefined>;
  deleteFieldOption(id: number): Promise<boolean>;
  replaceFieldOptionValue(fieldKey: string, oldValue: string, newValue: string): Promise<number>;
  getFieldOptionUsageCount(fieldKey: string, value: string): Promise<number>;

  // Electronics methods
  getMotors(userId: string): Promise<Motor[]>;
  getMotor(id: number, userId: string): Promise<Motor | undefined>;
  createMotor(motor: InsertMotor): Promise<Motor>;
  updateMotor(id: number, userId: string, motor: Partial<InsertMotor>): Promise<Motor | undefined>;
  deleteMotor(id: number, userId: string): Promise<boolean>;

  getEscs(userId: string): Promise<Esc[]>;
  getEsc(id: number, userId: string): Promise<Esc | undefined>;
  createEsc(esc: InsertEsc): Promise<Esc>;
  updateEsc(id: number, userId: string, esc: Partial<InsertEsc>): Promise<Esc | undefined>;
  deleteEsc(id: number, userId: string): Promise<boolean>;

  getServos(userId: string): Promise<Servo[]>;
  getServo(id: number, userId: string): Promise<Servo | undefined>;
  createServo(servo: InsertServo): Promise<Servo>;
  updateServo(id: number, userId: string, servo: Partial<InsertServo>): Promise<Servo | undefined>;
  deleteServo(id: number, userId: string): Promise<boolean>;

  getReceivers(userId: string): Promise<Receiver[]>;
  getReceiver(id: number, userId: string): Promise<Receiver | undefined>;
  createReceiver(receiver: InsertReceiver): Promise<Receiver>;
  updateReceiver(id: number, userId: string, receiver: Partial<InsertReceiver>): Promise<Receiver | undefined>;
  deleteReceiver(id: number, userId: string): Promise<boolean>;

  // Hop-up library methods (shared global library - no user filtering for read)
  getHopUpLibraryItems(): Promise<HopUpLibraryItem[]>;
  getHopUpLibraryItem(id: number): Promise<HopUpLibraryItem | undefined>;
  createHopUpLibraryItem(item: InsertHopUpLibraryItem): Promise<HopUpLibraryItem>;
  updateHopUpLibraryItem(id: number, userId: string, item: Partial<InsertHopUpLibraryItem>): Promise<HopUpLibraryItem | undefined>;
  deleteHopUpLibraryItem(id: number, userId: string): Promise<boolean>;

  // Model electronics methods (assign electronics to specific models)
  getModelElectronics(modelId: number, userId: string): Promise<ModelElectronicsWithDetails | undefined>;
  upsertModelElectronics(modelId: number, userId: string, data: Partial<InsertModelElectronics>): Promise<ModelElectronics>;
  deleteModelElectronics(modelId: number, userId: string): Promise<boolean>;
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
    // First check if a user with this email already exists
    const existingUser = await this.getUserByEmail(userData.email);
    
    if (existingUser) {
      // Update the existing user with Google auth data (link accounts)
      const [user] = await db
        .update(users)
        .set({
          // Update with new Google data but preserve existing fields
          firstName: userData.firstName || existingUser.firstName,
          lastName: userData.lastName || existingUser.lastName,
          profileImageUrl: userData.profileImageUrl || existingUser.profileImageUrl,
          // Set auth provider to Google if coming from Google OAuth
          authProvider: userData.authProvider || existingUser.authProvider,
          updatedAt: new Date(),
        })
        .where(eq(users.email, userData.email))
        .returning();
      
      return user;
    } else {
      // Create new user if no existing user with this email
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

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetPasswordToken, token));
    return user || undefined;
  }

  async updateResetPasswordToken(userId: string, token: string | null, expires: Date | null): Promise<void> {
    await db.update(users)
      .set({ 
        resetPasswordToken: token,
        resetPasswordExpires: expires,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    await db.update(users)
      .set({ 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
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
          with: {
            photo: true,
          },
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
          with: {
            photo: true,
          },
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

  async getBuildLogEntry(entryId: number, userId: string): Promise<BuildLogEntry | undefined> {
    const entry = await db.query.buildLogEntries.findFirst({
      where: eq(buildLogEntries.id, entryId),
      with: {
        model: true,
      },
    });
    
    if (!entry || entry.model.userId !== userId) {
      return undefined;
    }
    
    return entry;
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

  async getHopUpParts(modelId: number, userId: string): Promise<HopUpPartWithPhoto[]> {
    // Verify model belongs to user
    const model = await db.query.models.findFirst({
      where: and(eq(models.id, modelId), eq(models.userId, userId)),
    });
    
    if (!model) return [];

    return await db.query.hopUpParts.findMany({
      where: eq(hopUpParts.modelId, modelId),
      with: {
        photo: true,
      },
      orderBy: desc(hopUpParts.createdAt),
    });
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

  async getAllHopUpParts(userId: string): Promise<(HopUpPart & { model: { name: string } })[]> {
    // Get all models for the user first
    const userModels = await db.query.models.findMany({
      where: eq(models.userId, userId),
      columns: { id: true, name: true },
    });

    const userModelIds = userModels.map(m => m.id);
    
    if (userModelIds.length === 0) {
      return [];
    }

    // Get hop-up parts for user's models
    const parts = await db.query.hopUpParts.findMany({
      with: {
        model: {
          columns: {
            name: true,
          },
        },
      },
      where: inArray(hopUpParts.modelId, userModelIds),
      orderBy: desc(hopUpParts.createdAt),
    });

    return parts;
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

  // Feedback methods
  async getFeedbackPosts(currentUserId?: string, category?: string, status?: string): Promise<FeedbackPostWithUser[]> {
    const conditions = [];
    if (category) {
      conditions.push(eq(feedbackPosts.category, category));
    }
    if (status) {
      conditions.push(eq(feedbackPosts.status, status));
    }

    const posts = await db.query.feedbackPosts.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
      orderBy: desc(feedbackPosts.voteCount),
    });

    // If we have a current user, check which posts they've voted for
    if (currentUserId) {
      const userVotes = await db.select({ feedbackId: feedbackVotes.feedbackId })
        .from(feedbackVotes)
        .where(eq(feedbackVotes.userId, currentUserId));
      
      const votedIds = new Set(userVotes.map(v => v.feedbackId));
      
      return posts.map(post => ({
        ...post,
        hasVoted: votedIds.has(post.id),
      }));
    }

    return posts.map(post => ({ ...post, hasVoted: false }));
  }

  async getFeedbackPost(id: number, currentUserId?: string): Promise<FeedbackPostWithUser | undefined> {
    const post = await db.query.feedbackPosts.findFirst({
      where: eq(feedbackPosts.id, id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
      },
    });

    if (!post) return undefined;

    let hasVoted = false;
    if (currentUserId) {
      hasVoted = await this.hasUserVoted(id, currentUserId);
    }

    return { ...post, hasVoted };
  }

  async createFeedbackPost(post: InsertFeedbackPost): Promise<FeedbackPost> {
    const [newPost] = await db.insert(feedbackPosts).values(post).returning();
    return newPost;
  }

  async updateFeedbackPostStatus(id: number, status: string): Promise<FeedbackPost | undefined> {
    const [updated] = await db
      .update(feedbackPosts)
      .set({ status, updatedAt: new Date() })
      .where(eq(feedbackPosts.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteFeedbackPost(id: number, userId: string): Promise<boolean> {
    // Users can only delete their own posts
    const result = await db
      .delete(feedbackPosts)
      .where(and(eq(feedbackPosts.id, id), eq(feedbackPosts.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async voteFeedback(feedbackId: number, userId: string): Promise<boolean> {
    try {
      // Use transaction with unique constraint to prevent duplicates
      await db.transaction(async (tx) => {
        // Try to insert vote - will fail if already exists due to unique constraint
        await tx.insert(feedbackVotes).values({ feedbackId, userId });
        await tx.update(feedbackPosts)
          .set({ voteCount: sql`${feedbackPosts.voteCount} + 1` })
          .where(eq(feedbackPosts.id, feedbackId));
      });

      return true;
    } catch (error: any) {
      // If unique constraint violation, user already voted
      if (error.code === '23505') {
        return false;
      }
      console.error('Error voting for feedback:', error);
      return false;
    }
  }

  async unvoteFeedback(feedbackId: number, userId: string): Promise<boolean> {
    try {
      // Remove vote and decrement count atomically
      await db.transaction(async (tx) => {
        const result = await tx.delete(feedbackVotes)
          .where(and(
            eq(feedbackVotes.feedbackId, feedbackId),
            eq(feedbackVotes.userId, userId)
          ));

        if ((result.rowCount ?? 0) > 0) {
          await tx.update(feedbackPosts)
            .set({ voteCount: sql`GREATEST(${feedbackPosts.voteCount} - 1, 0)` })
            .where(eq(feedbackPosts.id, feedbackId));
        }
      });

      return true;
    } catch (error) {
      console.error('Error removing vote:', error);
      return false;
    }
  }

  async hasUserVoted(feedbackId: number, userId: string): Promise<boolean> {
    const [vote] = await db.select()
      .from(feedbackVotes)
      .where(and(
        eq(feedbackVotes.feedbackId, feedbackId),
        eq(feedbackVotes.userId, userId)
      ));
    return !!vote;
  }

  // Community/Sharing methods
  async updateUserSharePreference(userId: string, preference: string): Promise<User | undefined> {
    const validPreferences = ['public', 'authenticated', 'private'];
    if (!validPreferences.includes(preference)) {
      return undefined;
    }
    
    const [user] = await db.update(users)
      .set({ sharePreference: preference, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getSharedModels(viewerUserId?: string): Promise<ModelWithRelations[]> {
    // Get all models that are:
    // 1. Marked as shared (isShared = true)
    // 2. Owner has sharePreference != 'private'
    // 3. If sharePreference = 'authenticated', viewer must be logged in
    
    const sharedModels = await db
      .select({
        model: models,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          sharePreference: users.sharePreference,
        }
      })
      .from(models)
      .innerJoin(users, eq(models.userId, users.id))
      .where(
        and(
          eq(models.isShared, true),
          sql`${users.sharePreference} != 'private'`
        )
      )
      .orderBy(desc(models.updatedAt));

    // Filter based on sharePreference and viewer auth status
    const filteredModels = sharedModels.filter(({ owner }) => {
      if (owner.sharePreference === 'public') return true;
      if (owner.sharePreference === 'authenticated' && viewerUserId) return true;
      return false;
    });

    // Get photos and counts for each model
    const results: ModelWithRelations[] = [];
    for (const { model, owner } of filteredModels) {
      const modelPhotos = await db.select().from(photos).where(eq(photos.modelId, model.id));
      const hopUpList = await db.select().from(hopUpParts).where(eq(hopUpParts.modelId, model.id));
      
      results.push({
        ...model,
        photos: modelPhotos,
        buildLogEntries: [],
        hopUpParts: [],
        hopUpCount: hopUpList.length,
        owner: {
          firstName: owner.firstName,
          lastName: owner.lastName,
          profileImageUrl: owner.profileImageUrl,
        }
      } as ModelWithRelations);
    }
    
    return results;
  }

  async getSharedModelBySlug(slug: string, viewerUserId?: string): Promise<ModelWithRelations | undefined> {
    const [result] = await db
      .select({
        model: models,
        owner: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          sharePreference: users.sharePreference,
        }
      })
      .from(models)
      .innerJoin(users, eq(models.userId, users.id))
      .where(
        and(
          eq(models.publicSlug, slug),
          eq(models.isShared, true),
          sql`${users.sharePreference} != 'private'`
        )
      );

    if (!result) return undefined;

    // Check auth requirement
    if (result.owner.sharePreference === 'authenticated' && !viewerUserId) {
      return undefined;
    }

    // Get photos and hop-ups
    const modelPhotos = await db.select().from(photos).where(eq(photos.modelId, result.model.id));
    const hopUpList = await db.select().from(hopUpParts).where(eq(hopUpParts.modelId, result.model.id));

    return {
      ...result.model,
      photos: modelPhotos,
      buildLogEntries: [],
      hopUpParts: [],
      hopUpCount: hopUpList.length,
      owner: {
        firstName: result.owner.firstName,
        lastName: result.owner.lastName,
        profileImageUrl: result.owner.profileImageUrl,
      }
    } as ModelWithRelations;
  }

  async getSharedModelPhotos(slug: string, viewerUserId?: string): Promise<Photo[]> {
    const model = await this.getSharedModelBySlug(slug, viewerUserId);
    if (!model) return [];
    
    return db.select().from(photos).where(eq(photos.modelId, model.id)).orderBy(photos.sortOrder);
  }

  async getSharedModelHopUps(slug: string, viewerUserId?: string): Promise<HopUpPartWithPhoto[]> {
    const model = await this.getSharedModelBySlug(slug, viewerUserId);
    if (!model) return [];
    
    const parts = await db.select().from(hopUpParts).where(eq(hopUpParts.modelId, model.id));
    
    // Get photos for parts
    const result: HopUpPartWithPhoto[] = [];
    for (const part of parts) {
      let photo: Photo | null = null;
      if (part.photoId) {
        const [p] = await db.select().from(photos).where(eq(photos.id, part.photoId));
        photo = p || null;
      }
      // Exclude cost info for public viewing
      result.push({
        ...part,
        cost: null, // Hide cost from public
        photo
      } as HopUpPartWithPhoto);
    }
    
    return result;
  }

  // Admin methods for shared models management
  async getAllSharedModelsForAdmin(): Promise<Array<{
    model: Model;
    owner: { id: string; email: string; firstName: string | null; lastName: string | null; sharePreference: string };
    photoCount: number;
  }>> {
    const sharedModels = await db
      .select({
        model: models,
        owner: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          sharePreference: users.sharePreference,
        }
      })
      .from(models)
      .innerJoin(users, eq(models.userId, users.id))
      .where(eq(models.isShared, true))
      .orderBy(desc(models.updatedAt));

    const results = [];
    for (const { model, owner } of sharedModels) {
      const [{ count: photoCount }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(photos)
        .where(eq(photos.modelId, model.id));
      
      results.push({
        model,
        owner,
        photoCount: photoCount || 0,
      });
    }

    return results;
  }

  async adminUnshareModel(modelId: number): Promise<Model | undefined> {
    const [model] = await db
      .update(models)
      .set({ isShared: false })
      .where(eq(models.id, modelId))
      .returning();
    
    return model || undefined;
  }

  // Get build logs for a shared model (public access)
  async getSharedModelBuildLogs(slug: string, viewerUserId?: string): Promise<BuildLogEntryWithPhotos[]> {
    const model = await this.getSharedModelBySlug(slug, viewerUserId);
    if (!model) return [];
    
    const entries = await db.query.buildLogEntries.findMany({
      where: eq(buildLogEntries.modelId, model.id),
      with: {
        photos: {
          with: {
            photo: true,
          },
        },
      },
      orderBy: desc(buildLogEntries.entryDate),
    });
    
    return entries;
  }

  // Get electronics for a shared model (public access)
  async getSharedModelElectronics(slug: string, viewerUserId?: string): Promise<ModelElectronicsWithDetails | null> {
    const model = await this.getSharedModelBySlug(slug, viewerUserId);
    if (!model) return null;

    const [electronics] = await db.select().from(modelElectronics).where(eq(modelElectronics.modelId, model.id));
    if (!electronics) return null;

    const [motor] = electronics.motorId ? await db.select().from(motors).where(eq(motors.id, electronics.motorId)) : [null];
    const [esc] = electronics.escId ? await db.select().from(escs).where(eq(escs.id, electronics.escId)) : [null];
    const [servo] = electronics.servoId ? await db.select().from(servos).where(eq(servos.id, electronics.servoId)) : [null];
    const [receiver] = electronics.receiverId ? await db.select().from(receivers).where(eq(receivers.id, electronics.receiverId)) : [null];

    return { ...electronics, motor, esc, servo, receiver };
  }

  // Model comments methods
  async getModelComments(modelId: number): Promise<ModelCommentWithUser[]> {
    const comments = await db.query.modelComments.findMany({
      where: eq(modelComments.modelId, modelId),
      with: {
        user: true,
      },
      orderBy: desc(modelComments.createdAt),
    });
    
    return comments.map(comment => ({
      ...comment,
      user: {
        id: comment.user.id,
        firstName: comment.user.firstName,
        lastName: comment.user.lastName,
        profileImageUrl: comment.user.profileImageUrl,
      }
    }));
  }

  async createModelComment(comment: InsertModelComment): Promise<ModelComment> {
    const [newComment] = await db.insert(modelComments).values(comment).returning();
    return newComment;
  }

  async deleteModelComment(id: number, userId: string): Promise<boolean> {
    // Only allow deletion by comment owner
    const [comment] = await db.select().from(modelComments).where(eq(modelComments.id, id));
    if (!comment || comment.userId !== userId) {
      return false;
    }
    
    const result = await db.delete(modelComments).where(eq(modelComments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Field options methods (admin-managed dropdown options)
  async getFieldOptions(fieldKey: string): Promise<FieldOption[]> {
    return db.select()
      .from(fieldOptions)
      .where(eq(fieldOptions.fieldKey, fieldKey))
      .orderBy(fieldOptions.sortOrder);
  }

  async getAllFieldOptions(): Promise<FieldOption[]> {
    return db.select()
      .from(fieldOptions)
      .orderBy(fieldOptions.fieldKey, fieldOptions.sortOrder);
  }

  async createFieldOption(option: InsertFieldOption): Promise<FieldOption> {
    const [newOption] = await db.insert(fieldOptions).values(option).returning();
    return newOption;
  }

  async updateFieldOption(id: number, option: Partial<InsertFieldOption>): Promise<FieldOption | undefined> {
    const [updated] = await db.update(fieldOptions)
      .set({ ...option, updatedAt: new Date() })
      .where(eq(fieldOptions.id, id))
      .returning();
    return updated;
  }

  async deleteFieldOption(id: number): Promise<boolean> {
    const result = await db.delete(fieldOptions).where(eq(fieldOptions.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async replaceFieldOptionValue(fieldKey: string, oldValue: string, newValue: string): Promise<number> {
    // Map field keys to their database columns
    const fieldToColumn: Record<string, string> = {
      'scale': 'scale',
      'driveType': 'drive_type',
      'chassisMaterial': 'chassis_material',
      'differentialType': 'differential_type',
      'motorSize': 'motor_size',
      'batteryType': 'battery_type',
      'buildStatus': 'build_status',
      'hopUpCategory': 'category', // for hop_up_parts table
    };

    const column = fieldToColumn[fieldKey];
    if (!column) return 0;

    let result;
    if (fieldKey === 'hopUpCategory') {
      // Update hop-up parts category
      result = await db.execute(
        sql`UPDATE hop_up_parts SET ${sql.identifier(column)} = ${newValue} WHERE ${sql.identifier(column)} = ${oldValue}`
      );
    } else {
      // Update models table
      result = await db.execute(
        sql`UPDATE models SET ${sql.identifier(column)} = ${newValue} WHERE ${sql.identifier(column)} = ${oldValue}`
      );
    }
    return result.rowCount ?? 0;
  }

  async getFieldOptionUsageCount(fieldKey: string, value: string): Promise<number> {
    const fieldToColumn: Record<string, string> = {
      'scale': 'scale',
      'driveType': 'drive_type',
      'chassisMaterial': 'chassis_material',
      'differentialType': 'differential_type',
      'motorSize': 'motor_size',
      'batteryType': 'battery_type',
      'buildStatus': 'build_status',
      'hopUpCategory': 'category',
    };

    const column = fieldToColumn[fieldKey];
    if (!column) return 0;

    let result;
    if (fieldKey === 'hopUpCategory') {
      result = await db.execute(
        sql`SELECT COUNT(*) as count FROM hop_up_parts WHERE ${sql.identifier(column)} = ${value}`
      );
    } else {
      result = await db.execute(
        sql`SELECT COUNT(*) as count FROM models WHERE ${sql.identifier(column)} = ${value}`
      );
    }
    return Number(result.rows[0]?.count ?? 0);
  }

  // Electronics methods - Motors
  async getMotors(userId: string): Promise<Motor[]> {
    return await db.select().from(motors).where(eq(motors.userId, userId)).orderBy(desc(motors.createdAt));
  }

  async getMotor(id: number, userId: string): Promise<Motor | undefined> {
    const [motor] = await db.select().from(motors).where(and(eq(motors.id, id), eq(motors.userId, userId)));
    return motor;
  }

  async createMotor(motor: InsertMotor): Promise<Motor> {
    const dbMotor = { ...motor, cost: motor.cost?.toString() || null };
    const [created] = await db.insert(motors).values(dbMotor as any).returning();
    return created;
  }

  async updateMotor(id: number, userId: string, motor: Partial<InsertMotor>): Promise<Motor | undefined> {
    const dbMotor = motor.cost !== undefined ? { ...motor, cost: motor.cost?.toString() || null } : motor;
    const [updated] = await db.update(motors).set(dbMotor as any).where(and(eq(motors.id, id), eq(motors.userId, userId))).returning();
    return updated;
  }

  async deleteMotor(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(motors).where(and(eq(motors.id, id), eq(motors.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Electronics methods - ESCs
  async getEscs(userId: string): Promise<Esc[]> {
    return await db.select().from(escs).where(eq(escs.userId, userId)).orderBy(desc(escs.createdAt));
  }

  async getEsc(id: number, userId: string): Promise<Esc | undefined> {
    const [esc] = await db.select().from(escs).where(and(eq(escs.id, id), eq(escs.userId, userId)));
    return esc;
  }

  async createEsc(esc: InsertEsc): Promise<Esc> {
    const dbEsc = { ...esc, cost: esc.cost?.toString() || null };
    const [created] = await db.insert(escs).values(dbEsc as any).returning();
    return created;
  }

  async updateEsc(id: number, userId: string, esc: Partial<InsertEsc>): Promise<Esc | undefined> {
    const dbEsc = esc.cost !== undefined ? { ...esc, cost: esc.cost?.toString() || null } : esc;
    const [updated] = await db.update(escs).set(dbEsc as any).where(and(eq(escs.id, id), eq(escs.userId, userId))).returning();
    return updated;
  }

  async deleteEsc(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(escs).where(and(eq(escs.id, id), eq(escs.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Electronics methods - Servos
  async getServos(userId: string): Promise<Servo[]> {
    return await db.select().from(servos).where(eq(servos.userId, userId)).orderBy(desc(servos.createdAt));
  }

  async getServo(id: number, userId: string): Promise<Servo | undefined> {
    const [servo] = await db.select().from(servos).where(and(eq(servos.id, id), eq(servos.userId, userId)));
    return servo;
  }

  async createServo(servo: InsertServo): Promise<Servo> {
    const dbServo = { ...servo, cost: servo.cost?.toString() || null };
    const [created] = await db.insert(servos).values(dbServo as any).returning();
    return created;
  }

  async updateServo(id: number, userId: string, servo: Partial<InsertServo>): Promise<Servo | undefined> {
    const dbServo = servo.cost !== undefined ? { ...servo, cost: servo.cost?.toString() || null } : servo;
    const [updated] = await db.update(servos).set(dbServo as any).where(and(eq(servos.id, id), eq(servos.userId, userId))).returning();
    return updated;
  }

  async deleteServo(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(servos).where(and(eq(servos.id, id), eq(servos.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Electronics methods - Receivers
  async getReceivers(userId: string): Promise<Receiver[]> {
    return await db.select().from(receivers).where(eq(receivers.userId, userId)).orderBy(desc(receivers.createdAt));
  }

  async getReceiver(id: number, userId: string): Promise<Receiver | undefined> {
    const [receiver] = await db.select().from(receivers).where(and(eq(receivers.id, id), eq(receivers.userId, userId)));
    return receiver;
  }

  async createReceiver(receiver: InsertReceiver): Promise<Receiver> {
    const dbReceiver = { ...receiver, cost: receiver.cost?.toString() || null };
    const [created] = await db.insert(receivers).values(dbReceiver as any).returning();
    return created;
  }

  async updateReceiver(id: number, userId: string, receiver: Partial<InsertReceiver>): Promise<Receiver | undefined> {
    const dbReceiver = receiver.cost !== undefined ? { ...receiver, cost: receiver.cost?.toString() || null } : receiver;
    const [updated] = await db.update(receivers).set(dbReceiver as any).where(and(eq(receivers.id, id), eq(receivers.userId, userId))).returning();
    return updated;
  }

  async deleteReceiver(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(receivers).where(and(eq(receivers.id, id), eq(receivers.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Hop-up library methods - returns ALL items across all users (shared global library)
  async getHopUpLibraryItems(): Promise<HopUpLibraryItem[]> {
    return await db.select().from(hopUpLibrary).orderBy(desc(hopUpLibrary.createdAt));
  }

  async getHopUpLibraryItem(id: number): Promise<HopUpLibraryItem | undefined> {
    const [item] = await db.select().from(hopUpLibrary).where(eq(hopUpLibrary.id, id));
    return item;
  }

  async createHopUpLibraryItem(item: InsertHopUpLibraryItem): Promise<HopUpLibraryItem> {
    const [created] = await db.insert(hopUpLibrary).values(item).returning();
    return created;
  }

  async updateHopUpLibraryItem(id: number, userId: string, item: Partial<InsertHopUpLibraryItem>): Promise<HopUpLibraryItem | undefined> {
    const [updated] = await db.update(hopUpLibrary).set(item).where(and(eq(hopUpLibrary.id, id), eq(hopUpLibrary.userId, userId))).returning();
    return updated;
  }

  async deleteHopUpLibraryItem(id: number, userId: string): Promise<boolean> {
    const result = await db.delete(hopUpLibrary).where(and(eq(hopUpLibrary.id, id), eq(hopUpLibrary.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Model electronics methods
  async getModelElectronics(modelId: number, userId: string): Promise<ModelElectronicsWithDetails | undefined> {
    const model = await db.select().from(models).where(and(eq(models.id, modelId), eq(models.userId, userId))).limit(1);
    if (!model.length) return undefined;

    const [electronics] = await db.select().from(modelElectronics).where(eq(modelElectronics.modelId, modelId));
    if (!electronics) return undefined;

    const [motor] = electronics.motorId ? await db.select().from(motors).where(eq(motors.id, electronics.motorId)) : [null];
    const [esc] = electronics.escId ? await db.select().from(escs).where(eq(escs.id, electronics.escId)) : [null];
    const [servo] = electronics.servoId ? await db.select().from(servos).where(eq(servos.id, electronics.servoId)) : [null];
    const [receiver] = electronics.receiverId ? await db.select().from(receivers).where(eq(receivers.id, electronics.receiverId)) : [null];

    return { ...electronics, motor, esc, servo, receiver };
  }

  async upsertModelElectronics(modelId: number, userId: string, data: Partial<InsertModelElectronics>): Promise<ModelElectronics> {
    const model = await db.select().from(models).where(and(eq(models.id, modelId), eq(models.userId, userId))).limit(1);
    if (!model.length) throw new Error("Model not found");

    const existing = await db.select().from(modelElectronics).where(eq(modelElectronics.modelId, modelId)).limit(1);
    
    if (existing.length) {
      const [updated] = await db.update(modelElectronics)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(modelElectronics.modelId, modelId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(modelElectronics)
        .values({ modelId, ...data })
        .returning();
      return created;
    }
  }

  async deleteModelElectronics(modelId: number, userId: string): Promise<boolean> {
    const model = await db.select().from(models).where(and(eq(models.id, modelId), eq(models.userId, userId))).limit(1);
    if (!model.length) return false;
    
    const result = await db.delete(modelElectronics).where(eq(modelElectronics.modelId, modelId));
    return (result.rowCount ?? 0) > 0;
  }
}

export const storage = new DatabaseStorage();
