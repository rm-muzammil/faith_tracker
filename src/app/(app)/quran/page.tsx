import { QuranClient } from "./QuranClient";
import { db } from "@/db";
import { settings, memorizationLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function QuranPage() {
  const allSettings = await db.select().from(settings);
  const settingMap = Object.fromEntries(allSettings.map((s) => [s.key, s.value]));
  const currentIndex = parseInt(settingMap["current_verse_index"] ?? "0", 10);

  const recentLogs = await db
    .select()
    .from(memorizationLog)
    .orderBy(memorizationLog.verseIndex);

  return (
    <QuranClient
      currentIndex={currentIndex}
      logs={recentLogs}
    />
  );
}
