import { daysBetween, localISO } from "../dates/dateUtils";

const byStart = (a, b) => String(a.startDate).localeCompare(String(b.startDate));

export function getPhaseStatus(phases = [], date = localISO()) {
  const ordered = phases
    .filter((phase) => phase.startDate && phase.endDate)
    .slice()
    .sort(byStart);

  if (!ordered.length) return null;

  const current = ordered.find((phase) => date >= phase.startDate && date <= phase.endDate);
  if (current) {
    const day = daysBetween(current.startDate, date) + 1;
    const totalDays = daysBetween(current.startDate, current.endDate) + 1;
    return {
      ...current,
      state: "current",
      day,
      totalDays,
      percent: Math.min(100, Math.max(0, Math.round(day / totalDays * 100))),
      label: `${current.name}, dag ${day}`,
    };
  }

  const next = ordered.find((phase) => date < phase.startDate);
  if (next) {
    const daysUntil = daysBetween(date, next.startDate);
    return { ...next, state: "upcoming", daysUntil, percent: 0, label: `${next.name} startar om ${daysUntil} dagar` };
  }

  const last = ordered.at(-1);
  return { ...last, state: "completed", percent: 100, label: `${last.name} slutförd` };
}

