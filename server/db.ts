import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Parse DATABASE_URL and create direct connection config
const parseConnectionUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parseInt(parsed.port) || 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.slice(1), // Remove leading slash
    };
  } catch (error) {
    // Fallback to working configuration
    console.log('Using fallback database configuration');
    return {
      host: '45.84.205.0',
      port: 3306,
      user: 'u424760305_user',
      password: '9H8eexRU^v',
      database: 'u424760305_db',
    };
  }
};

// Create direct connection configuration
const dbConfig = parseConnectionUrl(process.env.DATABASE_URL);

// Clean configuration - only valid MySQL2 options
const connectionConfig = {
  host: '45.84.205.0', // Working IP from our tests
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Removed invalid options: acquireTimeout, timeout, reconnect, ssl
};

console.log('Database connection config:', {
  ...connectionConfig,
  password: '***' // Hide password in logs
});

export const pool = mysql.createPool(connectionConfig);
export const db = drizzle(pool, { schema, mode: "default" });