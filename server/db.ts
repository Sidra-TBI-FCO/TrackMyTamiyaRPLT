import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Google Cloud SQL configuration
const isGoogleCloudSQL = process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE;

if (!isGoogleCloudSQL && !process.env.DATABASE_URL) {
  throw new Error(
    "Either Google Cloud SQL credentials (PGHOST, PGUSER, PGPASSWORD, PGDATABASE) or DATABASE_URL must be set",
  );
}

let poolConfig: pg.PoolConfig;

if (isGoogleCloudSQL) {
  // Use Google Cloud SQL with proper SSL configuration
  poolConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: {
      rejectUnauthorized: false  // Google Cloud SQL uses self-signed certificates
    }
  };
  console.log('🔒 Google Cloud SQL: Connected with SSL');
} else {
  // Fallback to DATABASE_URL (for development)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: false
  };
  console.log('🔒 Development database: Connected without SSL');
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });