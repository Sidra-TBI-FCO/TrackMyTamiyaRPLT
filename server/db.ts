import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Prefer DATABASE_URL if available, as it contains the working connection info
if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error(
    "Either DATABASE_URL or Google Cloud SQL credentials (PGHOST, PGUSER, PGPASSWORD, PGDATABASE) must be set",
  );
}

let poolConfig: pg.PoolConfig;

if (process.env.DATABASE_URL) {
  // Use DATABASE_URL (preferred - contains working IP/hostname)
  const needsSSL = process.env.DATABASE_URL.includes('googleusercontent.com') || 
                   process.env.DATABASE_URL.includes('.gcp.') ||
                   process.env.DATABASE_URL.includes('neon.') ||
                   (!process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1'));
  
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: needsSSL ? { rejectUnauthorized: false } : false
  };
  console.log('🔒 Database: Connected via DATABASE_URL with SSL:', needsSSL);
} else {
  // Fallback to PG* variables
  const pgHost = process.env.PGHOST;
  
  // Guard against Cloud SQL connection names (which aren't hostnames)
  if (pgHost && pgHost.includes(':')) {
    throw new Error(
      `PGHOST appears to be a Cloud SQL connection name (${pgHost}). Please use DATABASE_URL instead or set PGHOST to the actual IP address.`
    );
  }
  
  poolConfig = {
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    host: pgHost,
    port: parseInt(process.env.PGPORT || '5432'),
    ssl: {
      rejectUnauthorized: false
    }
  };
  console.log('🔒 Database: Connected via PG* variables with SSL');
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });