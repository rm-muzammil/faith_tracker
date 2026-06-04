import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

/** Warm up the Neon connection — call once at startup to avoid cold-start timeout on first request */

export async function warmDb() {
  try {
    await sql`SELECT 1`;
  } catch {
    // Silently ignore — just a warm-up
  }
}