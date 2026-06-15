import { NextResponse } from "next/server";
import { db } from "@/db";
import { settings, dailyLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { fetchVerse, TOTAL_JUZ30_VERSES } from "@/lib/quran";
import { computeScore } from "@/lib/scoring";

async function getCurrentIndex(): Promise<number> {
  const [row] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "current_verse_index"))
    .limit(1);
  return row ? parseInt(row.value, 10) : 0;
}

async function setIndex(idx: number) {
  const safeIdx = Math.max(0, Math.min(idx, TOTAL_JUZ30_VERSES - 1));
  await db
    .insert(settings)
    .values({ key: "current_verse_index", value: String(safeIdx) })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: String(safeIdx), updatedAt: new Date() },
    });
  return safeIdx;
}

// GET — return current verse
export async function GET() {
  const idx = await getCurrentIndex();
  const verse = await fetchVerse(idx);
  if (!verse) return NextResponse.json({ error: "Verse unavailable" }, { status: 503 });
  return NextResponse.json(verse);
}

// POST — mark verse done for today + advance index (called from /quran page)
export async function POST() {
  const today = new Date().toISOString().slice(0, 10);
  const currentIndex = await getCurrentIndex();

  // Check if already advanced today to avoid double-advancing
  const [lastAdvancedRow] = await db
    .select()
    .from(settings)
    .where(eq(settings.key, "verse_last_advanced"))
    .limit(1);
  const lastAdvanced = lastAdvancedRow?.value ?? "";

  let nextIndex = currentIndex;
  if (lastAdvanced !== today) {
    nextIndex = await setIndex(currentIndex + 1);
    await db
      .insert(settings)
      .values({ key: "verse_last_advanced", value: today })
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: today, updatedAt: new Date() },
      });
  }

  // Also mark verseDone in today's daily_log
  const [existing] = await db
    .select()
    .from(dailyLog)
    .where(eq(dailyLog.date, today))
    .limit(1);

  const base = existing ?? {
    date: today,
    fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false,
    onTime: 0,
    morningAdhkar: false, eveningAdhkar: false,
    dhikrMinutes: 0, duaMinutes: 0,
    laIlaha: false, subhanallahi: false,
    quranPages: 0, tadabburMinutes: 0,
    tafseerDone: false, tajweedConfidence: 0,
    verseDone: false, islamicStudyMinutes: 0,
    surahMulk: false, surahKahf: false,
    gazeLowered: 0, haramFree: false,
    finalScore: 0, rawScore: 0,
  };

  const merged = { ...base, verseDone: true, updatedAt: new Date() };
  const { finalScore, rawScore } = computeScore({ ...merged, date: today });

  await db
    .insert(dailyLog)
    .values({ ...merged, finalScore, rawScore })
    .onConflictDoUpdate({
      target: dailyLog.date,
      set: { verseDone: true, finalScore, rawScore, updatedAt: new Date() },
    });

  return NextResponse.json({ index: nextIndex, verseDone: true });
}

// PUT — manual index override from settings page
export async function PUT(req: Request) {
  const { index } = await req.json();
  const newIdx = await setIndex(index);
  return NextResponse.json({ index: newIdx });
}