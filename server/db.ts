import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../shared/schema.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var envPath = path.join(__dirname, ".env");
dotenv.config({ path: envPath });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Encode the connection URL to handle special characters
const encodedUrl = new URL(process.env.DATABASE_URL).toString();
export const pool = mysql.createPool(encodedUrl);
export const db = drizzle(pool, { schema, mode: "default" });
