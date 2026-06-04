import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchVerse, TOTAL_JUZ30_VERSES } from "@/lib/quran";

export async function GET() {
  // Get current verse index from settings
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "current_verse_index"))
    .limit(1);

  const idx = row ? parseInt(row.value, 10) : 0;
  const safeIdx = Math.min(idx, TOTAL_JUZ30_VERSES - 1);

  const verse = await fetchVerse(safeIdx);
  if (!verse) {
    return NextResponse.json({ error: "Verse unavailable" }, { status: 503 });
  }

  return NextResponse.json(verse);
}

export async function POST() {
  // Advance to next verse
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "current_verse_index"))
    .limit(1);

  const current = row ? parseInt(row.value, 10) : 0;
  const next = (current + 1) % TOTAL_JUZ30_VERSES;

  await db
    .insert(settings)
    .values({ key: "current_verse_index", value: String(next) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(next), updatedAt: new Date() },
    });

  return NextResponse.json({ index: next });
}
