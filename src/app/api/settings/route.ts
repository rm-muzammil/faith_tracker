// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await db.select().from(settings);
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    await db
      .insert(settings)
      .values({ key, value: String(value) })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: String(value), updatedAt: new Date() },
      });
  }
  return NextResponse.json({ ok: true });
}
