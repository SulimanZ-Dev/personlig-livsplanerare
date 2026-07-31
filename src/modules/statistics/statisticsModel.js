import { startOfWeek } from "../../core/dates/dateUtils";

const inRange = (value, start, end) => {
  const date = new Date(value);
  return date >= start && date < end;
};

export function buildWeeklyTrends(state, count = 6, now = new Date()) {
  const currentStart = startOfWeek(now);
  return Array.from({ length: count }, (_, index) => {
    const start = new Date(currentStart);
    start.setDate(start.getDate() - (count - 1 - index) * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const transactions = state.modules.economy.transactions.filter((item) => inRange(item.occurredAt || `${item.date}T12:00:00`, start, end));
    const economyNet = transactions.reduce((sum, item) => item.type === "deposit" ? sum + Math.abs(Number(item.amount) || 0) : item.type === "withdrawal" ? sum - Math.abs(Number(item.amount) || 0) : sum, 0);
    const studyMinutes = state.modules.studies.sessions.filter((item) => inRange(item.startedAt, start, end)).reduce((sum, item) => sum + Number(item.durationMinutes || 0), 0);
    const workouts = state.modules.gym.workouts.filter((item) => inRange(item.date, start, end)).length;
    const habitChecks = state.modules.habits.checkIns.filter((item) => item.done && inRange(`${item.date}T12:00:00`, start, end)).length;
    const goalLogs = Object.values(state.goalEntries).filter((item) => inRange(item.occurredAt, start, end)).length;
    const nutritionEntries = (state.modules.nutrition.intakeLogs || []).filter((item) => inRange(`${item.date}T12:00:00`, start, end));
    const nutritionDates = [...new Set(nutritionEntries.map((item) => item.date))];
    const proteinTotal = nutritionEntries.reduce((sum, item) => sum + (Number(item.protein) || 0), 0);
    const proteinAverage = nutritionDates.length ? Math.round(proteinTotal / nutritionDates.length) : 0;
    return { start: start.toISOString(), label: start.toLocaleDateString("sv-SE", { day: "numeric", month: "short" }), economyNet, studyHours: Number((studyMinutes / 60).toFixed(1)), workouts, habitChecks, goalLogs, nutritionDays: nutritionDates.length, proteinAverage };
  });
}
