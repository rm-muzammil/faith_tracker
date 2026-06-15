import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { dailyLog, settings, vocabBank, rakuProgress } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { computeScore } from "@/lib/scoring";
import { pushProvinceReport } from "@/lib/province";
import { TOTAL_JUZ30_VERSES } from "@/lib/quran";

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise((r) => setTimeout(r, 1500 * i));
    }
  }
  throw new Error("unreachable");
}

export async function GET(req: NextRequest) {
  console.log("[db] connecting to:", process.env.DATABASE_URL?.split("@")[1]?.split("/")[0]);
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  const [row] = await db.select().from(dailyLog).where(eq(dailyLog.date, date)).limit(1);
  return NextResponse.json(row ?? null);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, ...fields } = body;
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  // ── Check if tafseer was done today via raku tracker ──────────────────────
  // The raku page saves tafseerDone to raku_progress. If any raku has
  // tafseerDone=true and was updated today, honour it — don't let the
  // dashboard checkbox override it downward.
  const todayRaku = await db
    .select()
    .from(rakuProgress)
    .where(eq(rakuProgress.tafseerDone, true))
    .orderBy(desc(rakuProgress.updatedAt))
    .limit(1);

  const rakuTafseerToday = todayRaku.length > 0 &&
    todayRaku[0].updatedAt.toISOString().slice(0, 10) === date;

  // If raku tracker says tafseer done today, force it true regardless of checkbox
  const tafseerDone = rakuTafseerToday ? true : (fields.tafseerDone ?? false);

  // Tajweed confidence — take max of dashboard input and latest raku entry
  const tajweedFromRaku = rakuTafseerToday ? (todayRaku[0].tajweedConfidence ?? 0) : 0;
  const tajweedConfidence = Math.max(fields.tajweedConfidence ?? 0, tajweedFromRaku);

  const { finalScore, rawScore } = computeScore({
    ...fields,
    tafseerDone,
    tajweedConfidence,
    date,
  });

  const payload = {
    date,
    fajr: fields.fajr ?? false,
    dhuhr: fields.dhuhr ?? false,
    asr: fields.asr ?? false,
    maghrib: fields.maghrib ?? false,
    isha: fields.isha ?? false,
    onTime: fields.onTime ?? 0,
    morningAdhkar: fields.morningAdhkar ?? false,
    eveningAdhkar: fields.eveningAdhkar ?? false,
    dhikrMinutes: fields.dhikrMinutes ?? 0,
    duaMinutes: fields.duaMinutes ?? 0,
    laIlaha: fields.laIlaha ?? false,
    subhanallahi: fields.subhanallahi ?? false,
    quranPages: fields.quranPages ?? 0,
    tadabburMinutes: fields.tadabburMinutes ?? 0,
    tafseerDone,
    tajweedConfidence,
    verseDone: fields.verseDone ?? false,
    islamicStudyMinutes: fields.islamicStudyMinutes ?? 0,
    surahMulk: fields.surahMulk ?? false,
    surahKahf: fields.surahKahf ?? false,
    gazeLowered: fields.gazeLowered ?? 0,
    haramFree: fields.haramFree ?? false,
    finalScore,
    rawScore,
    updatedAt: new Date(),
  };

  const saved = await withRetry(() =>
    db.insert(dailyLog)
      .values(payload)
      .onConflictDoUpdate({ target: dailyLog.date, set: payload })
      .returning()
      .then((r) => r[0])
  );

  // ── Auto-advance verse index when verseDone is newly true ─────────────────
  // Load previous log to detect if verseDone flipped true this save
  if (fields.verseDone) {
    const allSettings = await db.select().from(settings);
    const settingMap = Object.fromEntries(allSettings.map((s) => [s.key, s.value]));
    const currentIndex = parseInt(settingMap["current_verse_index"] ?? "0", 10);

    // Check if verse was NOT done before this save (avoid double-advancing on re-save)
    const lastAdvanced = settingMap["verse_last_advanced"] ?? "";
    if (lastAdvanced !== date) {
      const nextIndex = (currentIndex + 1) % TOTAL_JUZ30_VERSES;
      await db
        .insert(settings)
        .values({ key: "current_verse_index", value: String(nextIndex) })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: String(nextIndex), updatedAt: new Date() },
        });
      // Record the date we last advanced so we don't advance again on re-save
      await db
        .insert(settings)
        .values({ key: "verse_last_advanced", value: date })
        .onConflictDoUpdate({
          target: settings.key,
          set: { value: date, updatedAt: new Date() },
        });
    }
  }

  // ── Streak ────────────────────────────────────────────────────────────────
  const allLogs = await db
    .select({ date: dailyLog.date })
    .from(dailyLog)
    .orderBy(dailyLog.date);
  const sortedDates = allLogs.map((r) => r.date).sort().reverse();
  let streak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date(date);
    expected.setDate(expected.getDate() - i);
    if (sortedDates[i] === expected.toISOString().slice(0, 10)) streak++;
    else break;
  }

  // ── Province push ─────────────────────────────────────────────────────────
  const [{ count: rakuCount }] = await db
    .select({ count: count() })
    .from(rakuProgress)
    .where(eq(rakuProgress.tafseerDone, true));

  const [{ count: vocabCount }] = await db
    .select({ count: count() })
    .from(vocabBank);

  const allSettings2 = await db.select().from(settings);
  const settingMap2 = Object.fromEntries(allSettings2.map((s) => [s.key, s.value]));
  const skUrl = settingMap2["sk_url"] ?? "https://self-khilafah.vercel.app";
  const apiKey = settingMap2["api_key"] ?? "";

  if (apiKey) {
    pushProvinceReport(saved, streak, rakuCount as number, vocabCount as number, skUrl, apiKey);
  }

  return NextResponse.json({ ok: true, score: finalScore, streak, row: saved });
}