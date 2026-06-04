"use client";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { NumberInput } from "@/components/ui/NumberInput";

interface Props {
  fields: {
    morningAdhkar: boolean; eveningAdhkar: boolean;
    dhikrMinutes: number; duaMinutes: number;
    laIlaha: boolean; subhanallahi: boolean;
  };
  set: (key: any, value: any) => void;
}

export function DhikrSection({ fields, set }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <p className="section-title mb-0">Dhikr</p>
        <span className="text-xs font-mono text-zinc-500">25pts</span>
      </div>
      <div className="space-y-2">
        <ToggleRow label="Morning Adhkar" sublabel="أذكار الصباح" checked={fields.morningAdhkar} onChange={(v) => set("morningAdhkar", v)} pts={5} />
        <ToggleRow label="Evening Adhkar" sublabel="أذكار المساء" checked={fields.eveningAdhkar} onChange={(v) => set("eveningAdhkar", v)} pts={5} />
        <NumberInput label="General Dhikr" sublabel="≥5 min = full points" value={fields.dhikrMinutes} onChange={(v) => set("dhikrMinutes", v)} unit="min" pts={4} />
        <NumberInput label="Dua" sublabel="Any duration = full points" value={fields.duaMinutes} onChange={(v) => set("duaMinutes", v)} unit="min" pts={3} />
        <ToggleRow label="لا إله إلا الله × 100" sublabel="La ilaha illallah" checked={fields.laIlaha} onChange={(v) => set("laIlaha", v)} pts={4} />
        <ToggleRow label="سبحان الله وبحمده × 100" sublabel="Subhanallahi wa bihamdihi" checked={fields.subhanallahi} onChange={(v) => set("subhanallahi", v)} pts={4} />
      </div>
    </div>
  );
}