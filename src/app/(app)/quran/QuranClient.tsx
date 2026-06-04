"use client";
import { useState, useEffect } from "react";
import { JUZ30_SEQUENCE, TOTAL_JUZ30_VERSES, type VerseData } from "@/lib/quran";
import { ChevronRight, CheckCircle2, Circle, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { MemorizationLog } from "@/db/schema";

interface Props {
  currentIndex: number;
  logs: MemorizationLog[];
}

export function QuranClient({ currentIndex: initialIndex, logs }: Props) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [verse, setVerse] = useState<VerseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(false);

  const doneSet = new Set(logs.filter((l) => l.done).map((l) => l.verseIndex));
  const progress = Math.round((doneSet.size / TOTAL_JUZ30_VERSES) * 100);

  useEffect(() => {
    setLoading(true);
    fetch("/api/verse")
      .then((r) => r.json())
      .then((d) => setVerse(d))
      .finally(() => setLoading(false));
  }, [currentIndex]);

  async function markDone() {
    const today = new Date().toISOString().slice(0, 10);
    await fetch("/api/daily-log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: today,
        verseDone: true,
      }),
    });
    toast.success("Verse marked done!");
  }

  async function advanceVerse() {
    setAdvancing(true);
    try {
      const res = await fetch("/api/verse", { method: "POST" });
      const data = await res.json();
      setCurrentIndex(data.index);
      toast.success("Advanced to next verse");
    } finally {
      setAdvancing(false);
    }
  }

  const ref = JUZ30_SEQUENCE[currentIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-5 animate-fade-in">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">
          Memorization
        </p>
        <h1 className="text-xl font-bold text-zinc-100">Juz 30</h1>
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-300 font-medium">Overall Progress</span>
          <span className="text-xs font-mono text-brand-400">{doneSet.size}/{TOTAL_JUZ30_VERSES}</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">{progress}% complete</p>
      </div>

      {/* Current verse */}
      <div className="card border-brand-500/25 bg-brand-500/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-brand-400" strokeWidth={1.75} />
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-400">
              Current Verse
            </span>
          </div>
          {ref && (
            <span className="text-xs text-zinc-500 font-mono">
              {ref.surahName} {ref.surah}:{ref.ayah}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-8 bg-zinc-800 rounded w-full" />
            <div className="h-4 bg-zinc-800 rounded w-3/4" />
          </div>
        ) : verse ? (
          <>
            <p
              className="arabic-text text-2xl leading-[2.4] text-zinc-100"
              dir="rtl"
            >
              {verse.arabic}
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed italic border-t border-zinc-800 pt-3">
              "{verse.translation}"
            </p>
          </>
        ) : (
          <p className="text-sm text-zinc-500">Verse unavailable offline.</p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            onClick={markDone}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark Done Today
          </button>
          <button
            onClick={advanceVerse}
            disabled={advancing}
            className="btn-ghost flex items-center gap-1.5"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Surah list */}
      <div className="card">
        <p className="section-title">Juz 30 Surahs</p>
        <div className="space-y-1">
          {JUZ30_SEQUENCE.filter((v) => v.ayah === 1).map((v) => {
            const surahVerses = JUZ30_SEQUENCE.filter((sv) => sv.surah === v.surah);
            const doneCt = surahVerses.filter((sv) => doneSet.has(sv.globalIndex)).length;
            const allDone = doneCt === surahVerses.length;
            const isCurrent = surahVerses.some((sv) => sv.globalIndex === currentIndex);

            return (
              <div
                key={v.surah}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg transition-all",
                  isCurrent ? "bg-brand-500/15 border border-brand-500/30" : "hover:bg-zinc-800/50"
                )}
              >
                <div className="flex items-center gap-2.5">
                  {allDone ? (
                    <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-zinc-600 shrink-0" />
                  )}
                  <div>
                    <p className={cn("text-sm", isCurrent ? "text-brand-300 font-semibold" : "text-zinc-300")}>
                      {v.surahName}
                    </p>
                    <p className="text-[10px] text-zinc-600">{surahVerses.length} verses</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-zinc-500">
                  {doneCt}/{surahVerses.length}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
