import { storage } from "./storage";

// Development test data for the dev user account
export async function seedDemoData() {
  try {
    const DEV_USER_ID = "dev-user-123";
    
    // Check if we already have models for the dev user
    const existingModels = await storage.getModels(DEV_USER_ID);
    if (existingModels.length > 0) {
      console.log("Demo data already exists, skipping seeding");
      return; // Already has data
    }

    console.log("Seeding demo data for development user...");

    // Create comprehensive test models with realistic Tamiya data
    const models = [
      {
        userId: DEV_USER_ID,
        name: "Top-Force Evo",
        itemNumber: "47438", 
        chassis: "TF-7",
        releaseYear: 2023,
        buildStatus: "built" as const,
        buildType: "kit" as const,
        totalCost: "485.50",
        scale: "1/10",
        driveType: "4WD",
        chassisMaterial: "Carbon",
        differentialType: "Oil Diff",
        motorSize: "540 Brushless",
        batteryType: "2S LiPo 7.4V",
        notes: "High-performance 4WD racing buggy with excellent handling on various surfaces. Built with carbon fiber upgrades and tuned suspension.",
        tags: ["4WD", "Buggy", "Racing", "Competition", "Carbon"],
        tamiyaUrl: "https://www.tamiya.com/english/products/47438topforce/index.html",
        tamiyaBaseUrl: "https://tamiyabase.com/47438"
      },
      {
        userId: DEV_USER_ID,
        name: "TT-02 Subaru Impreza WRC",
        itemNumber: "58695",
        chassis: "TT-02",
        releaseYear: 2022,
        buildStatus: "building" as const,
        buildType: "kit" as const,
        totalCost: "285.99",
        scale: "1/10",
        driveType: "4WD",
        chassisMaterial: "Plastic",
        differentialType: "Gear Diff",
        motorSize: "540 Brushed",
        batteryType: "NiMH 7.2V",
        bodyName: "Subaru Impreza WRC",
        bodyItemNumber: "58695",
        bodyManufacturer: "Tamiya",
        notes: "Rally-inspired touring car with AWD drivetrain. Currently installing hop-up aluminum parts for improved durability.",
        tags: ["4WD", "Rally", "Touring", "Subaru", "WRC"],
        tamiyaUrl: "https://www.tamiya.com/english/products/58695tt02subaru/index.html"
      },
      {
        userId: DEV_USER_ID,
        name: "Grasshopper II",
        itemNumber: "58346",
        chassis: "Grasshopper",
        releaseYear: 2005,
        buildStatus: "planning" as const,
        buildType: "kit" as const,
        totalCost: "165.00",
        scale: "1/10",
        driveType: "2WD",
        chassisMaterial: "Plastic",
        differentialType: "Gear Diff",
        motorSize: "540 Brushed",
        batteryType: "NiMH 7.2V",
        notes: "Classic 2WD off-road buggy, perfect for beginners. Planning to keep it stock for nostalgic enjoyment.",
        tags: ["2WD", "Buggy", "Classic", "Beginner", "Vintage"],
        tamiyaUrl: "https://www.tamiya.com/english/products/58346grasshopper/index.html"
      },
      {
        userId: DEV_USER_ID,
        name: "Mazda RX-7 FD3S",
        itemNumber: "58648",
        chassis: "TT-02D",
        releaseYear: 2021,
        buildStatus: "built" as const,
        buildType: "kit" as const,
        totalCost: "320.75",
        scale: "1/10",
        driveType: "RWD",
        chassisMaterial: "Plastic",
        differentialType: "Ball Diff",
        motorSize: "540 Brushed",
        batteryType: "NiMH 7.2V",
        bodyName: "Mazda RX-7 FD3S",
        bodyItemNumber: "58648",
        bodyManufacturer: "Tamiya",
        notes: "Drift-spec RWD touring car with realistic body styling. Perfect for controlled sliding and drift practice.",
        tags: ["RWD", "Drift", "Touring", "Mazda", "JDM"],
        tamiyaUrl: "https://www.tamiya.com/english/products/58648rx7/index.html"
      },
      {
        userId: DEV_USER_ID,
        name: "Sand Scorcher",
        itemNumber: "58452",
        chassis: "Sand Scorcher",
        releaseYear: 2010,
        buildStatus: "maintenance" as const,
        buildType: "kit" as const,
        totalCost: "425.00",
        scale: "1/10",
        driveType: "2WD",
        chassisMaterial: "Aluminum",
        differentialType: "Gear Diff",
        motorSize: "540 Brushed",
        batteryType: "NiMH 7.2V",
        notes: "Vintage-style sand buggy replica. Currently undergoing restoration with period-correct parts and paint scheme.",
        tags: ["2WD", "Buggy", "Vintage", "Sand", "Restoration"],
        tamiyaUrl: "https://www.tamiya.com/english/products/58452scorcher/index.html"
      }
    ];

    // Create the models and collect their IDs for additional data
    const createdModels = [];
    for (const modelData of models) {
      const model = await storage.createModel(modelData);
      createdModels.push(model);
    }
    
    console.log(`Created ${createdModels.length} demo models`);

    // Add build log entries for some models
    const buildLogEntries = [
      {
        modelId: createdModels[0].id, // Top-Force Evo
        entryNumber: 1,
        title: "Initial Build Complete",
        content: "Finished the main assembly today. All joints are tight and the chassis is perfectly aligned. The carbon fiber upgrades really make a difference in rigidity.",
        entryDate: new Date("2024-01-15"),
      },
      {
        modelId: createdModels[0].id, // Top-Force Evo
        entryNumber: 2,
        title: "First Test Run",
        content: "Took it out for initial testing at the local track. Handling is exceptional - very responsive to steering input. Top speed is impressive with the brushless setup.",
        entryDate: new Date("2024-01-20"),
      },
      {
        modelId: createdModels[1].id, // TT-02 Subaru
        entryNumber: 1,
        title: "Chassis Assembly Started",
        content: "Began building the TT-02 chassis today. The gear differentials went together smoothly. Planning to install aluminum hop-ups next week.",
        entryDate: new Date("2024-02-01"),
      },
      {
        modelId: createdModels[3].id, // RX-7
        entryNumber: 1,
        title: "Drift Setup Complete",
        content: "Completed the RX-7 build with drift-specific setup. Installed harder rear tires and adjusted the ball differential for controllable slides.",
        entryDate: new Date("2024-01-10"),
      }
    ];

    for (const entryData of buildLogEntries) {
      await storage.createBuildLogEntry(entryData);
    }

    console.log(`Created ${buildLogEntries.length} build log entries`);

    // Add hop-up parts for some models
    const hopUpParts = [
      {
        modelId: createdModels[0].id, // Top-Force Evo
        name: "Aluminum Steering Knuckles",
        itemNumber: "54123",
        category: "Suspension",
        manufacturer: "Tamiya",
        supplier: "Tower Hobbies",
        cost: "45.99",
        quantity: 2,
        installationStatus: "installed" as const,
        installationDate: new Date("2024-01-12"),
        notes: "Precision aluminum steering knuckles for improved durability",
        isTamiyaBrand: true,
        color: "Blue Anodized",
        material: "7075 Aluminum"
      },
      {
        modelId: createdModels[0].id, // Top-Force Evo
        name: "Carbon Fiber Main Chassis",
        itemNumber: "54234",
        category: "Chassis",
        manufacturer: "Tamiya",
        supplier: "AMain Hobbies",
        cost: "89.99",
        quantity: 1,
        installationStatus: "installed" as const,
        installationDate: new Date("2024-01-10"),
        notes: "Lightweight carbon fiber main chassis plate",
        isTamiyaBrand: true,
        material: "Carbon Fiber"
      },
      {
        modelId: createdModels[1].id, // TT-02 Subaru
        name: "Aluminum Propeller Shaft",
        itemNumber: "54345",
        category: "Drivetrain",
        manufacturer: "Tamiya", 
        supplier: "Horizon Hobby",
        cost: "25.50",
        quantity: 1,
        installationStatus: "planned" as const,
        notes: "Upgrade from plastic to aluminum driveshaft",
        isTamiyaBrand: true,
        material: "Aluminum"
      },
      {
        modelId: createdModels[3].id, // RX-7
        name: "Drift Tires (Hard Compound)",
        itemNumber: "61234",
        category: "Tires",
        manufacturer: "Tamiya",
        supplier: "Local Hobby Shop",
        cost: "18.99",
        quantity: 4,
        installationStatus: "installed" as const,
        installationDate: new Date("2024-01-08"),
        notes: "Hard compound tires for controlled drifting",
        isTamiyaBrand: true,
        color: "White"
      }
    ];

    for (const partData of hopUpParts) {
      await storage.createHopUpPart(partData);
    }

    console.log(`Created ${hopUpParts.length} hop-up parts`);
    console.log('Demo data seeded successfully for development environment');
    
  } catch (error) {
    console.error('Error seeding demo data:', error);
  }
}