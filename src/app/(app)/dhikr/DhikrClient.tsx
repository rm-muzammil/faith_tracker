"use client";
import { useState } from "react";
import { AdhkarSection } from "@/components/ui/AdhkarSection";
import { DhikrCounter } from "@/components/ui/DhikrCounter";
import { MORNING_ADHKAR, EVENING_ADHKAR, BEFORE_SLEEP_ADHKAR, COUNTER_DHIKR } from "@/lib/adhkar";

interface Props {
  today: string;
  initialCounts: Record<string, { count: number; completed: boolean }>;
}

export function DhikrClient({ today, initialCounts }: Props) {
  const [counts, setCounts] = useState(initialCounts);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-5 animate-fade-in">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Daily</p>
        <h1 className="text-xl font-bold text-zinc-100">Adhkar & Dhikr</h1>
      </div>

      {/* Main counters */}
      <div>
        <p className="section-title">Daily Counters</p>
        <div className="space-y-4">
          {COUNTER_DHIKR.map((d) => (
            <DhikrCounter
              key={d.key}
              dhikrKey={d.key}
              arabic={d.arabic}
              transliteration={d.transliteration}
              translation={d.translation}
              target={d.target}
              benefit={d.benefit}
              date={today}
              initialCount={counts[d.key]?.count ?? 0}
              initialCompleted={counts[d.key]?.completed ?? false}
            />
          ))}
        </div>
      </div>

      {/* Morning Adhkar */}
      <div>
        <p className="section-title">Morning Adhkar</p>
        <AdhkarSection
          title="Morning Adhkar"
          titleAr="أذكار الصباح"
          items={MORNING_ADHKAR}
          date={today}
          counts={counts}
        />
      </div>

      {/* Evening Adhkar */}
      <div>
        <p className="section-title">Evening Adhkar</p>
        <AdhkarSection
          title="Evening Adhkar"
          titleAr="أذكار المساء"
          items={EVENING_ADHKAR}
          date={today}
          counts={counts}
        />
      </div>

      {/* Before Sleep */}
      <div>
        <p className="section-title">Before Sleep</p>
        <AdhkarSection
          title="Before Sleep Adhkar"
          titleAr="أذكار النوم"
          items={BEFORE_SLEEP_ADHKAR}
          date={today}
          counts={counts}
        />
      </div>
    </div>
  );
}