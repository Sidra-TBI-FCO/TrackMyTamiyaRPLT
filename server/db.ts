import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// NEON_DATABASE_URL takes priority over Replit's runtime-managed DATABASE_URL
const connectionString = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString && !process.env.PGHOST) {
  throw new Error(
    "Either NEON_DATABASE_URL, DATABASE_URL or PG* credentials must be set",
  );
}

let poolConfig: pg.PoolConfig;

if (connectionString) {
  const provider = process.env.NEON_DATABASE_URL ? 'Neon' : 'Postgres';
  console.log(`🔒 Database: Connecting to ${provider} with SSL`);
  poolConfig = {
    connectionString,
    ssl: { rejectUnauthorized: false },
  };
} else {
  console.log('🔒 Database: Connecting via PG* variables with SSL');
  poolConfig = {
    host: process.env.PGHOST,
    port: parseInt(process.env.PGPORT || '5432'),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl: { rejectUnauthorized: false },
  };
}

export const pool = new pg.Pool(poolConfig);
export const db = drizzle(pool, { schema });
