"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AdhkarSection } from "@/components/ui/AdhkarSection";
import { DhikrCounter } from "@/components/ui/DhikrCounter";
import { MORNING_ADHKAR, EVENING_ADHKAR, BEFORE_SLEEP_ADHKAR } from "@/lib/adhkar";

interface Props {
  today: string;
  initialCounts: Record<string, { count: number; completed: boolean }>;
}

export function DhikrClient({ today, initialCounts }: Props) {
  const [counts] = useState(initialCounts);
  const searchParams = useSearchParams();
  const section = searchParams.get("section"); // "morning" | "evening" | "counter" | "sleep"

  const morningRef = useRef<HTMLDivElement>(null);
  const eveningRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const sleepRef = useRef<HTMLDivElement>(null);

  // Auto-scroll and auto-open the section from URL param
  useEffect(() => {
    const refMap: Record<string, React.RefObject<HTMLDivElement>> = {
      morning: morningRef,
      evening: eveningRef,
      counter: counterRef,
      sleep: sleepRef,
    };
    if (section && refMap[section]?.current) {
      setTimeout(() => {
        refMap[section].current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [section]);

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-5 animate-fade-in">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">Daily</p>
        <h1 className="text-xl font-bold text-zinc-100">Adhkar & Dhikr</h1>
      </div>


      {/* Morning */}
      <div ref={morningRef}>
        <p className="section-title">Morning Adhkar</p>
        <AdhkarSection
          title="Morning Adhkar"
          titleAr="أذكار الصباح"
          items={MORNING_ADHKAR}
          date={today}
          counts={counts}
          defaultOpen={section === "morning"}
        />
      </div>

      {/* Evening */}
      <div ref={eveningRef}>
        <p className="section-title">Evening Adhkar</p>
        <AdhkarSection
          title="Evening Adhkar"
          titleAr="أذكار المساء"
          items={EVENING_ADHKAR}
          date={today}
          counts={counts}
          defaultOpen={section === "evening"}
        />
      </div>

      {/* Sleep */}
      <div ref={sleepRef}>
        <p className="section-title">Before Sleep</p>
        <AdhkarSection
          title="Before Sleep Adhkar"
          titleAr="أذكار النوم"
          items={BEFORE_SLEEP_ADHKAR}
          date={today}
          counts={counts}
          defaultOpen={section === "sleep"}
        />
      </div>
    </div>
  );
}