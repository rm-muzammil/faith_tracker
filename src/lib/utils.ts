import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatDisplayDate(iso: string): string {
  return format(parseISO(iso), "EEEE, d MMMM yyyy");
}

export function isFriday(date?: string): boolean {
  const d = date ? parseISO(date) : new Date();
  return d.getDay() === 5;
}

export function scoreColor(score: number): string {
  if (score >= 90) return "text-brand-400";
  if (score >= 70) return "text-yellow-400";
  if (score >= 50) return "text-orange-400";
  return "text-red-400";
}

export function scoreBg(score: number): string {
  if (score >= 90) return "bg-brand-500/20 border-brand-500/40";
  if (score >= 70) return "bg-yellow-500/20 border-yellow-500/40";
  if (score >= 50) return "bg-orange-500/20 border-orange-500/40";
  return "bg-red-500/20 border-red-500/40";
}
