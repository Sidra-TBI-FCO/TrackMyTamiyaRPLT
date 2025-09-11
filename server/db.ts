import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For Google Cloud SQL, we need to handle SSL properly
const connectionString = process.env.DATABASE_URL?.replace('?sslmode=require', '?sslmode=disable') || process.env.DATABASE_URL;

export const pool = new pg.Pool({ 
  connectionString,
  ssl: false  // Disable SSL for now to avoid certificate issues
});
export const db = drizzle(pool, { schema });