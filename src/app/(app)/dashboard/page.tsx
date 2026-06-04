import { db } from "@/db";
import { dailyLog } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isActivityGreen } from "@/lib/scoring";
import { todayISO } from "@/lib/utils";
import { DashboardClient } from "./DashboardClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function fetchDashboardData(today: string, attempt = 1): Promise<{
  existing: typeof dailyLog.$inferSelect | null;
  activityData: { date: string; green: boolean; score: number }[];
  streak: number;
}> {
  try {
    const [existing] = await db
      .select()
      .from(dailyLog)
      .where(eq(dailyLog.date, today))
      .limit(1);

    const recentLogs = await db
      .select({
        date: dailyLog.date,
        fajr: dailyLog.fajr,
        dhuhr: dailyLog.dhuhr,
        asr: dailyLog.asr,
        maghrib: dailyLog.maghrib,
        isha: dailyLog.isha,
        tafseerDone: dailyLog.tafseerDone,
        verseDone: dailyLog.verseDone,
        laIlaha: dailyLog.laIlaha,
        subhanallahi: dailyLog.subhanallahi,
        finalScore: dailyLog.finalScore,
      })
      .from(dailyLog)
      .orderBy(dailyLog.date);

    const activityData = recentLogs.map((r) => ({
      date: r.date,
      green: isActivityGreen(r),
      score: r.finalScore,
    }));

    // Streak — compare dates in PKT, not UTC
    const sortedDates = recentLogs.map((r) => r.date).sort().reverse();
    let streak = 0;
    for (let i = 0; i < sortedDates.length; i++) {
      // Build expected date by subtracting i days from today (PKT)
      const expected = new Date(today + "T00:00:00+05:00");
      expected.setDate(expected.getDate() - i);
      const expectedStr = expected.toLocaleDateString("en-CA", {
        timeZone: "Asia/Karachi",
      });
      if (sortedDates[i] === expectedStr) streak++;
      else break;
    }

    return { existing: existing ?? null, activityData, streak };
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1500 * attempt));
      return fetchDashboardData(today, attempt + 1);
    }
    throw err;
  }
}

export default async function DashboardPage() {
  // PKT-aware date — fixes UTC offset issue on Vercel and local
  const today = todayISO();
  const { existing, activityData, streak } = await fetchDashboardData(today);

  return (
    <DashboardClient
      existing={existing}
      activityData={activityData}
      streak={streak}
      today={today}
    />
  );
}