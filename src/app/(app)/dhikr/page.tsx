import { DhikrClient } from "./DhikrClient";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";

export default async function DhikrPage() {
  const today = new Date().toISOString().slice(0, 10);
  const sql = neon(process.env.DATABASE_URL!);
  const rows = await sql`SELECT * FROM dhikr_counts WHERE date = ${today}`;
  const counts: Record<string, { count: number; completed: boolean }> = {};
  for (const r of rows as any[]) {
    counts[r.dhikr_key] = { count: r.count, completed: r.completed };
  }
  return <DhikrClient today={today} initialCounts={counts} />;
}