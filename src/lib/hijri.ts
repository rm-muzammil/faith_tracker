// Hijri date via Aladhan API — reflects actual moon-sighting announcements
// Falls back to algorithmic calculation if API is unavailable

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
  dayName: string;
  formatted: string;
  formattedAr: string;
  source: "api" | "calculated";
}

const HIJRI_MONTHS = [
  { en: "Muharram",        ar: "مُحَرَّم" },
  { en: "Safar",           ar: "صَفَر" },
  { en: "Rabi al-Awwal",   ar: "رَبِيع الأَوَّل" },
  { en: "Rabi al-Thani",   ar: "رَبِيع الثَّانِي" },
  { en: "Jumada al-Awwal", ar: "جُمَادَى الأُولَى" },
  { en: "Jumada al-Thani", ar: "جُمَادَى الثَّانِيَة" },
  { en: "Rajab",           ar: "رَجَب" },
  { en: "Sha'ban",         ar: "شَعْبَان" },
  { en: "Ramadan",         ar: "رَمَضَان" },
  { en: "Shawwal",         ar: "شَوَّال" },
  { en: "Dhul Qadah",      ar: "ذُو القَعْدَة" },
  { en: "Dhul Hijjah",     ar: "ذُو الحِجَّة" },
];

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ─── Aladhan API (primary — moon-sighting aware) ─────────────────────────────
// Method 1 = University of Islamic Sciences, Karachi (standard for Pakistan)
async function fetchFromAladhan(gregorianDate: Date): Promise<HijriDate | null> {
  try {
    const dd = String(gregorianDate.getDate()).padStart(2, "0");
    const mm = String(gregorianDate.getMonth() + 1).padStart(2, "0");
    const yyyy = gregorianDate.getFullYear();
    // DD-MM-YYYY format required by Aladhan
    const url = `https://api.aladhan.com/v1/gToH?date=${dd}-${mm}-${yyyy}`;

    const res = await fetch(url, {
      next: { revalidate: 3600 * 12 }, // cache 12hrs — Hijri date won't change mid-day
    });
    if (!res.ok) return null;

    const json = await res.json();
    const h = json?.data?.hijri;
    if (!h) return null;

    const monthIndex = parseInt(h.month.number, 10) - 1;
    const monthData = HIJRI_MONTHS[monthIndex] ?? HIJRI_MONTHS[0];
    const dayName = DAY_NAMES[gregorianDate.getDay()];
    const day = parseInt(h.day, 10);
    const year = parseInt(h.year, 10);

    return {
      day,
      month: monthIndex + 1,
      year,
      monthName: monthData.en,
      monthNameAr: monthData.ar,
      dayName,
      formatted: `${day} ${monthData.en} ${year}`,
      formattedAr: `${day} ${monthData.ar} ${year}`,
      source: "api",
    };
  } catch {
    return null;
  }
}

// ─── Algorithmic fallback (less accurate for moon-sighting countries) ─────────
function calculateHijri(date: Date): HijriDate {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // Julian Day Number
  let jd = Math.floor((14 - m) / 12);
  const yr = y + 4800 - jd;
  const mn = m + 12 * jd - 3;
  jd = d + Math.floor((153 * mn + 2) / 5) + 365 * yr
    + Math.floor(yr / 4) - Math.floor(yr / 100)
    + Math.floor(yr / 400) - 32045;

  // Hijri conversion
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const ll = l - 10631 * n + 354;
  const j = Math.floor((10985 - ll) / 5316) * Math.floor((50 * ll) / 17719)
    + Math.floor(ll / 5670) * Math.floor((43 * ll) / 15238);
  const lll = ll - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50)
    - Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * lll) / 709);
  const day = lll - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;

  const monthIndex = Math.min(month - 1, 11);
  const monthData = HIJRI_MONTHS[monthIndex];
  const dayName = DAY_NAMES[date.getDay()];

  return {
    day,
    month,
    year,
    monthName: monthData.en,
    monthNameAr: monthData.ar,
    dayName,
    formatted: `${day} ${monthData.en} ${year} (est.)`,
    formattedAr: `${day} ${monthData.ar} ${year}`,
    source: "calculated",
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Server-side: fetches from Aladhan API (accurate, moon-sighting aware).
 * Call this in Server Components / API routes only.
 */
export async function getHijriDate(date: Date = new Date()): Promise<HijriDate> {
  const fromApi = await fetchFromAladhan(date);
  if (fromApi) return fromApi;
  // Fallback — show "(est.)" suffix so user knows it's approximate
  return calculateHijri(date);
}

/**
 * Client-side synchronous fallback only — use getHijriDate() on server when possible.
 */
export function getHijriDateSync(date: Date = new Date()): HijriDate {
  return calculateHijri(date);
}

// ─── Islamic context for guidance prompt ─────────────────────────────────────
export function getIslamicContext(hijri: HijriDate): string[] {
  const contexts: string[] = [];
  const { day, month, dayName } = hijri;

  if (dayName === "Friday")
    contexts.push("Jumu'ah — recite Surah Al-Kahf, send abundant salawat on the Prophet ﷺ");
  if (dayName === "Monday" || dayName === "Thursday")
    contexts.push("Sunnah fasting day — the Prophet ﷺ fasted on Mondays and Thursdays");
  if (day >= 13 && day <= 15)
    contexts.push("Ayyam al-Bid (White Days, 13–15) — Sunnah to fast these three days every month");
  if (month === 1 && day <= 10)
    contexts.push("First ten days of Muharram — recommended to increase worship");
  if (month === 1 && day === 10)
    contexts.push("Ashura (10 Muharram) — fasting today expiates the sins of the past year");
  if (month === 7)
    contexts.push("Month of Rajab — a sacred month, increase istighfar and voluntary worship");
  if (month === 8)
    contexts.push("Sha'ban — the Prophet ﷺ fasted much this month; prepare for Ramadan");
  if (month === 9)
    contexts.push("Ramadan — fasting is obligatory; maximise Quran, tarawih, and tahajjud");
  if (month === 9 && day >= 21 && day % 2 === 1)
    contexts.push("Possible Laylat al-Qadr — stay up in worship, it is better than 1000 months");
  if (month === 12 && day >= 1 && day <= 10)
    contexts.push("First ten days of Dhul Hijjah — the best days of the year for good deeds");
  if (month === 12 && day === 9)
    contexts.push("Day of Arafah — fasting expiates two years of sins (for non-pilgrims)");
  if (month === 12 && day === 10)
    contexts.push("Eid al-Adha — do not fast today; perform dhikr and takbir abundantly");
  if (month === 10 && day === 1)
    contexts.push("Eid al-Fitr — do not fast today; celebrate with family and give sadaqah");

  return contexts;
}