import { RakuClient } from "./RakuClient";
import { db } from "@/db";
import { rakuProgress, vocabBank } from "@/db/schema";
import { count, eq } from "drizzle-orm";

export default async function RakuPage() {
  const rows = await db.select().from(rakuProgress).orderBy(rakuProgress.rakuNumber);

  // Current raku = first incomplete or last completed + 1
  const completedNums = new Set(
    rows.filter((r) => r.completedAt).map((r) => r.rakuNumber)
  );
  let currentRaku = 1;
  for (let i = 1; i <= 558; i++) {
    if (!completedNums.has(i)) { currentRaku = i; break; }
  }

  const [{ count: totalVocab }] = await db.select({ count: count() }).from(vocabBank);

  return (
    <RakuClient
      progress={rows}
      currentRaku={currentRaku}
      totalVocab={totalVocab as number}
    />
  );
}
