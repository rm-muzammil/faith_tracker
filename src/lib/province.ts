// src/lib/province.ts
import type { DailyLog } from "@/db/schema";

interface ProvincePayload {
  score: number;
  label: string;
  streak: number;
  todayDone: boolean;
  updatedAt: string;
  details: Record<string, unknown>;
}

export async function pushProvinceReport(
  log: DailyLog,
  streak: number,
  rakuNum: number,
  vocabCount: number,
  skUrl: string,
  apiKey: string
): Promise<{ ok: boolean; error?: string }> {
  if (!skUrl || !apiKey) return { ok: false, error: "SK URL or API key not set" }

  const payload: ProvincePayload = {
    score: log.finalScore,
    label: "Faith",
    streak,
    todayDone: true,
    updatedAt: new Date().toISOString(),
    details: {
      salah: [log.fajr, log.dhuhr, log.asr, log.maghrib, log.isha].filter(Boolean).length,
      onTime: log.onTime,
      quranPages: log.quranPages,
      adhkar: log.morningAdhkar && log.eveningAdhkar,
      dhikrDone: log.dhikrMinutes >= 5,
      laIlaha: log.laIlaha,
      subhanallahi: log.subhanallahi,
      tafseerDone: log.tafseerDone,
      verseDone: log.verseDone,
      surahMulk: log.surahMulk,
      surahKahf: log.surahKahf,
      islamicStudy: log.islamicStudyMinutes,
      gazeLowered: log.gazeLowered,
      haramFree: log.haramFree,
      rakuNum,
      vocabCount,
    },
  };

  try {
    const res = await fetch(`${skUrl}/api/provinces/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const text = await res.text()
      return { ok: false, error: `SK returned ${res.status}: ${text}` }
    }

    return { ok: true }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" }
  }
}