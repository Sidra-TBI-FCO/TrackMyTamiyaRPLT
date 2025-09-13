import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// For Google Cloud SQL, we need to handle SSL properly
const isProduction = process.env.REPLIT_DOMAINS || process.env.NODE_ENV === 'production';

// Clean the connection string by removing conflicting sslmode parameters
let connectionString = process.env.DATABASE_URL;
if (isProduction && connectionString) {
  const url = new URL(connectionString);
  url.searchParams.delete('sslmode');
  connectionString = url.toString();
}

// Configure SSL for production environments
let sslConfig: boolean | object = false;

if (isProduction) {
  // Check for SSL CA certificate
  const sslCa = process.env.DATABASE_SSL_CA || 
    (process.env.DATABASE_SSL_CA_B64 ? 
      Buffer.from(process.env.DATABASE_SSL_CA_B64, 'base64').toString('utf8') : 
      undefined);
  
  // Check if verification should be disabled (temporary debugging)
  const disableVerify = process.env.DB_SSL_DISABLE_VERIFY === 'true';
  
  if (sslCa) {
    sslConfig = { ca: sslCa, rejectUnauthorized: true };
    console.log('🔒 Production SSL: Using CA certificate verification');
  } else if (disableVerify) {
    sslConfig = { rejectUnauthorized: false };
    console.log('🔒 Production SSL: Verification disabled (temporary)');
  } else {
    sslConfig = true;
    console.log('🔒 Production SSL: Standard verification enabled');
  }
}

export const pool = new pg.Pool({ 
  connectionString,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });