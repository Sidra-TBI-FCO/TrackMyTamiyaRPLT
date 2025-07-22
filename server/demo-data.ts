import { storage } from "./storage";

// Demo data to populate the database when no models exist
export async function seedDemoData() {
  try {
    // Check if demo user exists, if not create one
    let user = await storage.getUserByUsername("demo_user");
    if (!user) {
      user = await storage.createUser({
        username: "demo_user",
        password: "demo_pass"
      });
    }

    // Check if we already have models
    const existingModels = await storage.getModels(user.id);
    if (existingModels.length > 0) {
      return; // Already has data
    }

    // Create demo models
    const models = [
      {
        userId: user.id,
        name: "Top-Force Evo",
        itemNumber: "47438",
        chassis: "TF-7",
        releaseYear: 2023,
        buildStatus: "built" as const,
        totalCost: "450.00",
        notes: "High-performance 4WD racing buggy with excellent handling",
        tags: ["4WD", "Buggy", "Racing", "Competition"]
      },
      {
        userId: user.id,
        name: "TT-02 Subaru Impreza",
        itemNumber: "58695",
        chassis: "TT-02",
        releaseYear: 2022,
        buildStatus: "building" as const,
        totalCost: "280.00",
        notes: "Rally-inspired touring car with AWD drivetrain",
        tags: ["AWD", "Rally", "Touring", "Subaru"]
      },
      {
        userId: user.id,
        name: "Grasshopper II",
        itemNumber: "58346",
        chassis: "Grasshopper",
        releaseYear: 2005,
        buildStatus: "planning" as const,
        totalCost: "150.00",
        notes: "Classic 2WD off-road buggy, perfect for beginners",
        tags: ["2WD", "Buggy", "Classic", "Beginner"]
      }
    ];

    for (const modelData of models) {
      await storage.createModel(modelData);
    }

    console.log('Demo data seeded successfully');
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}