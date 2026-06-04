import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { rakuProgress } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET() {
  const rows = await db
    .select()
    .from(rakuProgress)
    .orderBy(asc(rakuProgress.rakuNumber));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rakuNumber, tafseerDone, tajweedConfidence, vocabExtracted, notes } = body;

  if (!rakuNumber) {
    return NextResponse.json({ error: "rakuNumber required" }, { status: 400 });
  }

  const allDone =
    !!tafseerDone && tajweedConfidence > 0 && !!vocabExtracted;

  const payload = {
    rakuNumber,
    tafseerDone: !!tafseerDone,
    tajweedConfidence: tajweedConfidence ?? 0,
    vocabExtracted: !!vocabExtracted,
    notes: notes ?? null,
    completedAt: allDone ? new Date() : null,
    updatedAt: new Date(),
  };

  const [saved] = await db
    .insert(rakuProgress)
    .values(payload)
    .onConflictDoUpdate({ target: rakuProgress.rakuNumber, set: payload })
    .returning();

  return NextResponse.json(saved);
}
