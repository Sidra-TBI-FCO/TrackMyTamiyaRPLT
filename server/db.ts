import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL && !process.env.PGHOST) {
  throw new Error(
    "Either DATABASE_URL or Google Cloud SQL credentials must be set",
  );
}

function parsePostgresUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    database: parsed.pathname.slice(1), // Remove leading /
    user: parsed.username,
    password: parsed.password,
  };
}

let poolConfig: pg.PoolConfig;

if (process.env.DATABASE_URL) {
  // Parse DATABASE_URL manually to avoid env var conflicts
  const dbConfig = parsePostgresUrl(process.env.DATABASE_URL);
  
  // Build explicit config that overrides any env SSL settings
  poolConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: {
      rejectUnauthorized: false,  // Force disable certificate verification
      minVersion: 'TLSv1.2'
    }
  };
  console.log('🔒 Database: Connected with explicit SSL config (rejectUnauthorized: false)');
} else {
  // Fallback to PG* variables with explicit SSL config
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  };
  console.log('🔒 Database: Connected via PG* variables with explicit SSL config');
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });