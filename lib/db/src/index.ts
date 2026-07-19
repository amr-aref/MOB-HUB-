import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Cap the pool to prevent exhausting PG's max_connections (112 on Replit).
  // Each API server process holds at most 10 connections.
  max: 10,
  // Release idle connections after 30 s to avoid holding open sockets under low traffic.
  idleTimeoutMillis: 30_000,
  // Fail fast if all connections are busy — surfaces back-pressure rather than queuing forever.
  connectionTimeoutMillis: 5_000,
});

export const db = drizzle(pool, { schema });

export * from "./schema";
