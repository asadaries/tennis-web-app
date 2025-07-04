import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";

// Direct database configuration - no environment variables needed
const connectionConfig = {
  host: '45.84.205.0',        // Working IP address
  port: 3306,
  user: 'u424760305_user',
  password: '9H8eexRU^v',
  database: 'u424760305_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log('Database connection config:', {
  ...connectionConfig,
  password: '***' // Hide password in logs
});

export const pool = mysql.createPool(connectionConfig);
export const db = drizzle(pool, { schema, mode: "default" });