import {
  pgTable,
  text,
  integer,
  boolean,
  timestamp,
  date,
  serial,
  real,
} from "drizzle-orm/pg-core";

// ─── daily_log ──────────────────────────────────────────────────────────────
export const dailyLog = pgTable("daily_log", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(), // YYYY-MM-DD

  // Salah
  fajr: boolean("fajr").notNull().default(false),
  dhuhr: boolean("dhuhr").notNull().default(false),
  asr: boolean("asr").notNull().default(false),
  maghrib: boolean("maghrib").notNull().default(false),
  isha: boolean("isha").notNull().default(false),
  onTime: integer("on_time").notNull().default(0), // 0–5

  // Dhikr
  morningAdhkar: boolean("morning_adhkar").notNull().default(false),
  eveningAdhkar: boolean("evening_adhkar").notNull().default(false),
  dhikrMinutes: integer("dhikr_minutes").notNull().default(0),
  duaMinutes: integer("dua_minutes").notNull().default(0),
  laIlaha: boolean("la_ilaha").notNull().default(false),
  subhanallahi: boolean("subhanallahi").notNull().default(false),

  // Quran
  quranPages: integer("quran_pages").notNull().default(0),
  tadabburMinutes: integer("tadabbur_minutes").notNull().default(0),
  tafseerDone: boolean("tafseer_done").notNull().default(false),
  tajweedConfidence: integer("tajweed_confidence").notNull().default(0), // 1–5
  verseDone: boolean("verse_done").notNull().default(false),
  islamicStudyMinutes: integer("islamic_study_minutes").notNull().default(0),

  // Sunnah
  surahMulk: boolean("surah_mulk").notNull().default(false),
  surahKahf: boolean("surah_kahf").notNull().default(false),

  // Self-discipline
  gazeLowered: integer("gaze_lowered").notNull().default(0), // 1–5
  haramFree: boolean("haram_free").notNull().default(false),

  // Computed
  finalScore: integer("final_score").notNull().default(0),
  rawScore: real("raw_score").notNull().default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── raku_progress ───────────────────────────────────────────────────────────
export const rakuProgress = pgTable("raku_progress", {
  id: serial("id").primaryKey(),
  rakuNumber: integer("raku_number").notNull().unique(), // 1–558
  tafseerDone: boolean("tafseer_done").notNull().default(false),
  tajweedConfidence: integer("tajweed_confidence").notNull().default(0), // 1–5
  vocabExtracted: boolean("vocab_extracted").notNull().default(false),
  completedAt: timestamp("completed_at"), // set when all 3 done
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── vocab_bank ───────────────────────────────────────────────────────────────
export const vocabBank = pgTable("vocab_bank", {
  id: serial("id").primaryKey(),
  rakuNumber: integer("raku_number").notNull(),
  word: text("word").notNull(),
  root: text("root"),
  meaning: text("meaning").notNull(),
  status: text("status").notNull().default("new"), // new | reviewing | mastered
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── memorization_log ─────────────────────────────────────────────────────────
export const memorizationLog = pgTable("memorization_log", {
  id: serial("id").primaryKey(),
  verseIndex: integer("verse_index").notNull(), // index into JUZ30_SEQUENCE
  date: date("date").notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── settings ─────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports
export type DailyLog = typeof dailyLog.$inferSelect;
export type NewDailyLog = typeof dailyLog.$inferInsert;
export type RakuProgress = typeof rakuProgress.$inferSelect;
export type VocabBank = typeof vocabBank.$inferSelect;
export type MemorizationLog = typeof memorizationLog.$inferSelect;
export type Settings = typeof settings.$inferSelect;
