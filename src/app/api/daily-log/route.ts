import { NextRequest, NextResponse } from "next/server";
 
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

import { db } from "@/db";
import { dailyLog, settings, vocabBank, rakuProgress } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { computeScore } from "@/lib/scoring";
import { pushProvinceReport } from "@/lib/province";



export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const [row] = await db
    .select()
    .from(dailyLog)
    .where(eq(dailyLog.date, date))
    .limit(1);

  return NextResponse.json(row ?? null);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, ...fields } = body;

  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });

  const { finalScore, rawScore } = computeScore({ ...fields, date });

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
    tafseerDone: fields.tafseerDone ?? false,
    tajweedConfidence: fields.tajweedConfidence ?? 0,
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

  // Compute streak
  const allLogs = await db
    .select({ date: dailyLog.date })
    .from(dailyLog)
    .orderBy(dailyLog.date);
  const sortedDates = allLogs.map((r) => r.date).sort().reverse();
  let streak = 0;
  for (let i = 0; i < sortedDates.length; i++) {
    const expected = new Date(date);
    expected.setDate(expected.getDate() - i);
    const exp = expected.toISOString().slice(0, 10);
    if (sortedDates[i] === exp) streak++;
    else break;
  }

  // Get raku & vocab counts for province report
  const [{ count: rakuCount }] = await db
    .select({ count: count() })
    .from(rakuProgress)
    .where(eq(rakuProgress.tafseerDone, true));

  const [{ count: vocabCount }] = await db
    .select({ count: count() })
    .from(vocabBank);

  // Push to Self-Khilafah (fire-and-forget)
  const allSettings = await db.select().from(settings);
  const settingMap = Object.fromEntries(allSettings.map((s) => [s.key, s.value]));
  const skUrl = settingMap["sk_url"] ?? "https://self-khilafah.vercel.app";
  const apiKey = settingMap["api_key"] ?? "";

  if (apiKey) {
    pushProvinceReport(saved, streak, rakuCount as number, vocabCount as number, skUrl, apiKey);
  }

return NextResponse.json({ ok: true, score: finalScore, streak, row: saved });
}
