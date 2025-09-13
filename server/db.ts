import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For Google Cloud SQL, we need to handle SSL properly
let connectionString = process.env.DATABASE_URL;

// Check if we're in a production environment (deployed on Replit)
const isProduction = process.env.REPLIT_DOMAINS || process.env.NODE_ENV === 'production';

if (isProduction) {
  // For production, ensure SSL mode is set but don't force it in the URL since we'll handle it in the pool config
  console.log('🔒 Production environment detected - enforcing SSL for database connection');
}

export const pool = new pg.Pool({ 
  connectionString,
  ssl: isProduction ? { 
    rejectUnauthorized: false,  // Accept self-signed certificates for managed databases
    require: false              // Don't require SSL in connection string, handle it here
  } : false
});
export const db = drizzle(pool, { schema });