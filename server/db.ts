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

function parsePostgresUrl(url: string) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '5432'),
    database: parsed.pathname.slice(1),
    user: parsed.username,
    password: parsed.password,
  };
}

let poolConfig: pg.PoolConfig;

if (connectionString) {
  const dbConfig = parsePostgresUrl(connectionString);
  poolConfig = {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    ssl: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  };
  const provider = process.env.NEON_DATABASE_URL ? 'Neon' : 'Replit Postgres';
  console.log(`🔒 Database: Connected to ${provider} with SSL`);
} else {
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
