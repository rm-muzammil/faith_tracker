import { NextResponse } from "next/server";
import { db } from "@/db";
import { dailyLog, settings } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { getHijriDate } from "@/lib/hijri";
import { generateDailyGuidance } from "@/lib/guidance";

const GUIDANCE_KEY = "daily_guidance";
const GUIDANCE_DATE_KEY = "daily_guidance_date";

export async function GET() {
  const today = new Date().toISOString().slice(0, 10);

  // Check if guidance already generated today — read from DB not memory
  const allSettings = await db.select().from(settings);
  const settingMap = Object.fromEntries(allSettings.map((s) => [s.key, s.value]));

  const cachedDate = settingMap[GUIDANCE_DATE_KEY] ?? "";
  const cachedGuidance = settingMap[GUIDANCE_KEY] ?? "";

  if (cachedDate === today && cachedGuidance) {
    try {
      return NextResponse.json(JSON.parse(cachedGuidance));
    } catch {
      // Corrupted cache — fall through and regenerate
    }
  }

  // No valid cache — generate fresh
  const geminiKey = settingMap["gemini_api_key"] ?? process.env.GEMINI_API_KEY ?? "";
  if (!geminiKey) {
    return NextResponse.json({ error: "no_api_key" }, { status: 503 });
  }

  const recentLogs = await db
    .select()
    .from(dailyLog)
    .orderBy(desc(dailyLog.date))
    .limit(7);

  const hijri = await getHijriDate(new Date());
  const guidance = await generateDailyGuidance(recentLogs, hijri, geminiKey);

  if (!guidance) {
    return NextResponse.json({ error: "generation_failed" }, { status: 503 });
  }

  // Persist to DB so it survives restarts and serverless cold starts
  const guidanceJson = JSON.stringify(guidance);
  await db.insert(settings)
    .values({ key: GUIDANCE_KEY, value: guidanceJson })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: guidanceJson, updatedAt: new Date() },
    });
  await db.insert(settings)
    .values({ key: GUIDANCE_DATE_KEY, value: today })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: today, updatedAt: new Date() },
    });

  return NextResponse.json(guidance);
}

// Force regenerate — clears DB cache
export async function DELETE() {
  await db.insert(settings)
    .values({ key: GUIDANCE_DATE_KEY, value: "" })
    .onConflictDoUpdate({
      target: settings.key,
      set: { value: "", updatedAt: new Date() },
    });
  return NextResponse.json({ ok: true });
}