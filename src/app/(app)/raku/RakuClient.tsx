"use client";
import { useState } from "react";
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { StarRating } from "@/components/ui/StarRating";
import { ToggleRow } from "@/components/ui/ToggleRow";
import toast from "react-hot-toast";
import type { RakuProgress } from "@/db/schema";

interface Props {
  progress: RakuProgress[];
  currentRaku: number;
  totalVocab: number;
}

export function RakuClient({ progress, currentRaku, totalVocab }: Props) {
  const progressMap = new Map(progress.map((p) => [p.rakuNumber, p]));
  const completedCount = progress.filter((p) => p.completedAt).length;

  const [expanded, setExpanded] = useState<number | null>(currentRaku);
  const [localState, setLocalState] = useState<
    Record<number, { tafseerDone: boolean; tajweedConfidence: number; vocabExtracted: boolean; notes: string }>
  >(() => {
    const init: Record<number, { tafseerDone: boolean; tajweedConfidence: number; vocabExtracted: boolean; notes: string }> = {};
    progress.forEach((p) => {
      init[p.rakuNumber] = {
        tafseerDone: p.tafseerDone,
        tajweedConfidence: p.tajweedConfidence,
        vocabExtracted: p.vocabExtracted,
        notes: p.notes ?? "",
      };
    });
    return init;
  });

  function getState(n: number) {
    return localState[n] ?? { tafseerDone: false, tajweedConfidence: 0, vocabExtracted: false, notes: "" };
  }

  function patch(n: number, patch: Partial<{ tafseerDone: boolean; tajweedConfidence: number; vocabExtracted: boolean; notes: string }>) {
    setLocalState((prev) => ({ ...prev, [n]: { ...getState(n), ...patch } }));
  }

  async function saveRaku(n: number) {
    const s = getState(n);
    const res = await fetch("/api/raku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rakuNumber: n, ...s }),
    });
    if (res.ok) {
      toast.success(`Raku ${n} saved`);
    } else {
      toast.error("Save failed");
    }
  }

  // Show rakus: current ± 5, plus all completed
  const visibleNums = new Set<number>();
  for (let i = Math.max(1, currentRaku - 3); i <= Math.min(558, currentRaku + 10); i++) {
    visibleNums.add(i);
  }
  progress.filter((p) => p.completedAt).forEach((p) => visibleNums.add(p.rakuNumber));
  const sorted = Array.from(visibleNums).sort((a, b) => a - b);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-5 animate-fade-in">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Dr Israr Ahmad</p>
        <h1 className="text-xl font-bold text-zinc-100">Raku Tracker</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          ["Completed", completedCount, "558"],
          ["Current", `#${currentRaku}`, ""],
          ["Vocab", totalVocab, "words"],
        ].map(([label, val, sub]) => (
          <div key={label as string} className="card text-center">
            <p className="text-xl font-bold text-zinc-100">{val}</p>
            {sub && <p className="text-[10px] text-zinc-500">{sub}</p>}
            <p className="text-xs text-zinc-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="card">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-300">Tafseer Progress</span>
          <span className="text-xs font-mono text-brand-400">{completedCount}/558</span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-700"
            style={{ width: `${(completedCount / 558) * 100}%` }}
          />
        </div>
      </div>

      {/* Raku list */}
      <div className="space-y-2">
        {sorted.map((n) => {
          const saved = progressMap.get(n);
          const state = getState(n);
          const isComplete = !!saved?.completedAt;
          const isCurrent = n === currentRaku;
          const isExpanded = expanded === n;

          return (
            <div
              key={n}
              className={cn(
                "card transition-all",
                isCurrent && "border-brand-500/30 bg-brand-500/5",
                isComplete && !isCurrent && "opacity-70"
              )}
            >
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : n)}
                className="flex items-center justify-between w-full"
              >
                <div className="flex items-center gap-3">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-brand-400 shrink-0" />
                  ) : (
                    <Circle className={cn("w-5 h-5 shrink-0", isCurrent ? "text-brand-500" : "text-zinc-600")} />
                  )}
                  <div className="text-left">
                    <p className={cn("text-sm font-semibold", isCurrent ? "text-brand-300" : "text-zinc-200")}>
                      Raku {n}
                      {isCurrent && (
                        <span className="ml-2 text-[10px] bg-brand-500/20 text-brand-400 rounded-full px-2 py-0.5">
                          Current
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-zinc-600">
                      {isComplete
                        ? `Done · ${state.tajweedConfidence}/5 tajweed`
                        : `${[state.tafseerDone, state.tajweedConfidence > 0, state.vocabExtracted].filter(Boolean).length}/3 criteria`}
                    </p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-zinc-500" />
                )}
              </button>

              {isExpanded && (
                <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4 animate-slide-up">
                  <ToggleRow
                    label="Tafseer Watched"
                    sublabel="Dr Israr — this raku"
                    checked={state.tafseerDone}
                    onChange={(v) => patch(n, { tafseerDone: v })}
                  />
                  <StarRating
                    label="Tajweed Confidence"
                    value={state.tajweedConfidence}
                    max={5}
                    onChange={(v) => patch(n, { tajweedConfidence: v })}
                  />
                  <ToggleRow
                    label="Vocab Extracted"
                    sublabel="Words added to vocab bank"
                    checked={state.vocabExtracted}
                    onChange={(v) => patch(n, { vocabExtracted: v })}
                  />
                  <textarea
                    placeholder="Notes (optional)…"
                    value={state.notes}
                    onChange={(e) => patch(n, { notes: e.target.value })}
                    className="pill-input resize-none h-20 text-xs"
                  />
                  <button
                    onClick={() => saveRaku(n)}
                    className="btn-primary w-full"
                  >
                    Save Raku {n}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
