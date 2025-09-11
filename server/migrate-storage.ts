import { db } from "./db";
import { photos } from "@shared/schema";
import { fileStorage } from "./storage-service";

async function getAllPhotoFilenames(): Promise<string[]> {
  try {
    console.log("📋 Fetching all photo filenames from database...");
    
    const allPhotos = await db.select({ filename: photos.filename }).from(photos);
    const filenames = allPhotos.map(photo => photo.filename).filter(Boolean);
    
    console.log(`📸 Found ${filenames.length} photos to migrate`);
    return filenames;
  } catch (error) {
    console.error("Failed to fetch photo filenames:", error);
    return [];
  }
}

async function migrateAllFiles(): Promise<void> {
  console.log("🚀 Starting migration from Replit Object Storage to Google Cloud Storage...");
  
  const filenames = await getAllPhotoFilenames();
  
  if (filenames.length === 0) {
    console.log("ℹ️  No files to migrate");
    return;
  }

  let successCount = 0;
  let failureCount = 0;
  
  console.log(`📦 Migrating ${filenames.length} files...`);
  
  // Cast fileStorage to access migration methods
  const hybridStorage = fileStorage as any;
  
  for (let i = 0; i < filenames.length; i++) {
    const filename = filenames[i];
    const progress = `[${i + 1}/${filenames.length}]`;
    
    console.log(`${progress} Processing: ${filename}`);
    
    try {
      const success = await hybridStorage.migrateFileToGoogleCloud(filename);
      if (success) {
        successCount++;
        console.log(`${progress} ✅ ${filename}`);
      } else {
        failureCount++;
        console.log(`${progress} ❌ ${filename} (migration failed)`);
      }
    } catch (error) {
      failureCount++;
      console.log(`${progress} ❌ ${filename} (error: ${(error as Error).message})`);
    }
    
    // Add a small delay to avoid overwhelming the storage services
    if (i < filenames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log("\n📊 Migration Summary:");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📊 Total: ${filenames.length}`);
  
  if (successCount === filenames.length) {
    console.log("🎉 All files migrated successfully!");
    console.log("💡 You can now disable Replit fallback by setting ENABLE_REPLIT_FALLBACK=false");
  } else if (successCount > 0) {
    console.log("⚠️  Some files migrated successfully, but there were failures.");
    console.log("🔄 You may want to retry the migration for failed files.");
  } else {
    console.log("💥 Migration failed completely. Please check your Google Cloud Storage configuration.");
  }
}

// Export for use in routes or manual execution
export { migrateAllFiles, getAllPhotoFilenames };

// Allow direct execution (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAllFiles()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}