import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { vocabBank } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const rakuNum = req.nextUrl.searchParams.get("raku");
  const rows = await db
    .select()
    .from(vocabBank)
    .where(rakuNum ? eq(vocabBank.rakuNumber, parseInt(rakuNum)) : undefined)
    .orderBy(desc(vocabBank.createdAt));
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rakuNumber, word, root, meaning, status } = body;

  if (!word || !meaning || !rakuNumber) {
    return NextResponse.json({ error: "word, meaning, rakuNumber required" }, { status: 400 });
  }

  const [saved] = await db
    .insert(vocabBank)
    .values({ rakuNumber, word, root: root ?? null, meaning, status: status ?? "new" })
    .returning();

  return NextResponse.json(saved);
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  await db.delete(vocabBank).where(eq(vocabBank.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
