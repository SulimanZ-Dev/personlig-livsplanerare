import { isThisWeek, localISO } from "../dates/dateUtils";

const shiftDate = (iso, days) => {
  const date = new Date(`${iso}T12:00:00`);
  date.setDate(date.getDate() + days);
  return localISO(date);
};

const contingencyDates = (state) => new Set([
  ...(state.contingency?.history || []).map((entry) => entry.date),
  state.today?.contingency?.date,
].filter(Boolean));

const previousEligibleDates = (state, date, count) => {
  const excluded = contingencyDates(state);
  const result = [];
  let cursor = shiftDate(date, -1);
  while (result.length < count) {
    if (!excluded.has(cursor)) result.push(cursor);
    cursor = shiftDate(cursor, -1);
  }
  return result;
};

const habitExisted = (habit, date, checkIns) => {
  if (checkIns.some((entry) => entry.habitId === habit.id && entry.date <= date)) return true;
  return !habit.createdAt || localISO(new Date(habit.createdAt)) <= date;
};

const doneOn = (habitId, date, checkIns) => checkIns.some((entry) => entry.habitId === habitId && entry.date === date && entry.done);

export function getTwoMissWarnings(state, date = localISO()) {
  if (isContingencyDay(state, date)) return [];
  const checkIns = state.modules?.habits?.checkIns || [];
  const [previous, beforePrevious] = previousEligibleDates(state, date, 2);
  return (state.modules?.habits?.habits || [])
    .filter((habit) => habit.frequency !== "weekly_target")
    .filter((habit) => habitExisted(habit, beforePrevious, checkIns))
    .filter((habit) => !doneOn(habit.id, previous, checkIns) && !doneOn(habit.id, beforePrevious, checkIns))
    .map((habit) => ({
      id: `two-miss:${habit.id}:${date}`,
      habitId: habit.id,
      habitName: habit.name,
      floor: habit.minimumVersion || "gör två minuter",
      dates: [beforePrevious, previous],
    }));
}

function reviewIndicators(state, date) {
  const now = new Date(`${date}T12:00:00`);
  const entries = state.modules?.reviews?.entries || [];
  const indicators = [];
  const weeklyDone = entries.some((entry) => entry.type === "weekly" && isThisWeek(entry.completedAt || entry.period));
  if (now.getDay() === 0 && !weeklyDone) indicators.push({ id: `review:weekly:${date}`, kind: "review", route: "reviews", label: "Veckoreview idag" });

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isMonthEnd = tomorrow.getMonth() !== now.getMonth();
  const monthKey = date.slice(0, 7);
  const monthlyDone = entries.some((entry) => entry.type === "monthly" && String(entry.completedAt || entry.period).slice(0, 7) === monthKey);
  if (isMonthEnd && !monthlyDone) indicators.push({ id: `review:monthly:${monthKey}`, kind: "review", route: "reviews", label: "Månadsreview väntar" });

  const isQuarterEnd = isMonthEnd && [2, 5, 8, 11].includes(now.getMonth());
  const quarter = `${now.getFullYear()}-Q${Math.floor(now.getMonth() / 3) + 1}`;
  const quarterlyDone = entries.some((entry) => {
    if (entry.type !== "quarterly") return false;
    const completed = new Date(entry.completedAt || entry.period);
    return completed.getFullYear() === now.getFullYear() && Math.floor(completed.getMonth() / 3) === Math.floor(now.getMonth() / 3);
  });
  if (isQuarterEnd && !quarterlyDone) indicators.push({ id: `review:quarterly:${quarter}`, kind: "review", route: "reviews", label: "Kvartalsreview väntar" });
  return indicators;
}

export function buildQuietIndicators(state, date = localISO()) {
  if (state.profile?.quietIndicatorsEnabled === false) return [];
  const checkIns = state.modules?.habits?.checkIns || [];
  const [yesterday] = previousEligibleDates(state, date, 1);
  const habitIndicators = (state.modules?.habits?.habits || [])
    .filter((habit) => habit.frequency !== "weekly_target" && habitExisted(habit, yesterday, checkIns))
    .filter((habit) => !doneOn(habit.id, yesterday, checkIns) && !doneOn(habit.id, date, checkIns))
    .map((habit) => ({ id: `habit-risk:${habit.id}:${date}`, kind: "habit", route: "habits", label: `${habit.name}: floor idag` }));
  return [...habitIndicators, ...reviewIndicators(state, date)];
}

export function isContingencyDay(state, date = localISO()) {
  return state.today?.contingency?.date === date || (state.contingency?.history || []).some((entry) => entry.date === date);
}
