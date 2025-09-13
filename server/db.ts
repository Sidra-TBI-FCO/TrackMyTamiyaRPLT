import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Always configure SSL for any database connection that requires it
let connectionString = process.env.DATABASE_URL;

// Check if this is a managed database that requires SSL (most hosted databases do)
const requiresSSL = connectionString && (
  (connectionString.includes('postgres://') || connectionString.includes('postgresql://')) && (
    connectionString.includes('.neon.') || 
    connectionString.includes('cloud') || 
    connectionString.includes('amazonaws.com') ||
    connectionString.includes('googleusercontent.com') ||
    connectionString.includes('.gcp.') ||
    process.env.REPLIT_DOMAINS ||
    // Default to requiring SSL for any remote database
    !connectionString.includes('localhost') && !connectionString.includes('127.0.0.1')
  )
);

// Don't modify the connection string - let the ssl object handle SSL configuration

// Configure SSL options
let sslConfig: boolean | object = false;

if (requiresSSL) {
  // Check for SSL CA certificate
  const sslCa = process.env.DATABASE_SSL_CA || 
    (process.env.DATABASE_SSL_CA_B64 ? 
      Buffer.from(process.env.DATABASE_SSL_CA_B64, 'base64').toString('utf8') : 
      undefined);
  
  // Check if verification should be disabled (temporary debugging)
  const disableVerify = process.env.DB_SSL_DISABLE_VERIFY === 'true';
  
  if (sslCa) {
    sslConfig = { ca: sslCa, rejectUnauthorized: true };
    console.log('🔒 SSL: Using CA certificate verification');
  } else if (disableVerify) {
    sslConfig = { rejectUnauthorized: false };
    console.log('🔒 SSL: Verification disabled (temporary)');
  } else {
    sslConfig = { rejectUnauthorized: false };  // Default to allow self-signed for managed DBs
    console.log('🔒 SSL: Self-signed certificates allowed');
  }
} else {
  console.log('🔒 SSL: Disabled for local development');
}

export const pool = new pg.Pool({ 
  connectionString,
  ssl: sslConfig
});
export const db = drizzle(pool, { schema });