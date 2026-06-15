"use client";
import { useState } from "react";
import { Save, Link2, Key, BookMarked, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { TOTAL_JUZ30_VERSES } from "@/lib/quran";

interface Props {
  initialSettings: Record<string, string>;
}

export function SettingsClient({ initialSettings }: Props) {
  const [skUrl, setSkUrl] = useState(
    initialSettings["sk_url"] ?? "https://self-khilafah.vercel.app"
  );
  const [apiKey, setApiKey] = useState(initialSettings["api_key"] ?? "");
  const [geminiKey, setGeminiKey] = useState(initialSettings['gemini_api_key'] ?? '');
  const [verseIndex, setVerseIndex] = useState(
    parseInt(initialSettings["current_verse_index"] ?? "0", 10)
  );
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sk_url: skUrl,
          api_key: apiKey,
          gemini_api_key: geminiKey,
          current_verse_index: String(verseIndex),
        }),
      });
      toast.success("Settings saved");
    } finally {
      setSaving(false);
    }
  }

  async function testPush() {
    setTesting(true);
    try {
      const res = await fetch(`${skUrl}/api/provinces/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": apiKey,
        },
        body: JSON.stringify({
          score: 0,
          label: "Faith",
          streak: 0,
          todayDone: false,
          updatedAt: new Date().toISOString(),
          details: {},
        }),
      });
      if (res.ok) toast.success("Self-Khilafah reached ✓");
      else toast.error(`Response: ${res.status}`);
    } catch {
      toast.error("Could not reach Self-Khilafah");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-5 pb-6 space-y-5 animate-fade-in">
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-0.5">App</p>
        <h1 className="text-xl font-bold text-zinc-100">Settings</h1>
      </div>

      {/* Self-Khilafah integration */}
      <div className="card space-y-4">
        <p className="section-title mb-0">Self-Khilafah Integration</p>

        <div>
          <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <Link2 className="w-3 h-3" /> Province URL
          </label>
          <input
            className="pill-input"
            value={skUrl}
            onChange={(e) => setSkUrl(e.target.value)}
            placeholder="https://self-khilafah.vercel.app"
          />
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <Key className="w-3 h-3" /> API Key
          </label>
          <input
            type="password"
            className="pill-input"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="PROVINCE_API_KEY"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={testPush}
            disabled={testing || !apiKey}
            className="btn-ghost flex items-center gap-2 flex-1"
          >
            <RefreshCw className={`w-4 h-4 ${testing ? "animate-spin" : ""}`} />
            Test Push
          </button>
        </div>
      </div>

      {/* Gemini AI */}
      <div className="card space-y-3">
        <p className="section-title mb-0">AI Guidance (Gemini)</p>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <Key className="w-3 h-3" /> Gemini API Key
          </label>
          <input
            type="password"
            className="pill-input"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
          />
          <p className="text-xs text-zinc-600 mt-1">
            Free at <span className="text-zinc-500">aistudio.google.com</span> — used for daily Islamic guidance
          </p>
        </div>
        {geminiKey && (
          <button
            onClick={async () => {
              await fetch("/api/guidance", { method: "DELETE" });
              toast.success("Guidance cache cleared — will regenerate on next load");
            }}
            className="btn-ghost text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate today's guidance
          </button>
        )}
      </div>

      {/* Verse index */}
      <div className="card space-y-3">
        <p className="section-title mb-0">Memorization Cursor</p>
        <div>
          <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
            <BookMarked className="w-3 h-3" /> Current Verse Index (0–{TOTAL_JUZ30_VERSES - 1})
          </label>
          <input
            type="number"
            className="pill-input"
            min={0}
            max={TOTAL_JUZ30_VERSES - 1}
            value={verseIndex}
            onChange={(e) =>
              setVerseIndex(
                Math.min(
                  TOTAL_JUZ30_VERSES - 1,
                  Math.max(0, parseInt(e.target.value) || 0)
                )
              )
            }
          />
          <p className="text-xs text-zinc-600 mt-1">
            0 = An-Nas:1, {TOTAL_JUZ30_VERSES - 1} = An-Naba:40
          </p>
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {saving ? "Saving…" : "Save Settings"}
      </button>

      {/* App info */}
      <div className="card text-center space-y-1">
        <p className="text-sm font-semibold text-zinc-300">Faith Tracker</p>
        <p className="text-xs text-zinc-600">
          Personal daily faith accountability app · PWA
        </p>
        <p className="text-xs text-zinc-700">Built with Next.js 14 · Drizzle · Neon</p>
      </div>
    </div>
  );
}