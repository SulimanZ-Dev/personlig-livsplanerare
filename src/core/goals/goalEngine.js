import { daysBetween, isThisWeek, localISO } from "../dates/dateUtils";
import { accountBalance, economyTotal, transactionImpact } from "../../modules/economy/economyModel";

export const GOAL_STATUS = {
  on_track: { label: "På rätt väg", tone: "positive" },
  at_risk: { label: "Riskerar deadline", tone: "warning" },
  overdue: { label: "Försenat", tone: "danger" },
  achieved: { label: "Uppnått", tone: "positive" },
  lost: { label: "Tappat efter uppnått", tone: "danger" },
  paused: { label: "Pausat", tone: "neutral" },
  blocked: { label: "Väntar på annat mål", tone: "neutral" },
  active: { label: "Aktivt", tone: "neutral" },
};

const goalEntries = (state, goalId) =>
  Object.values(state.goalEntries || {})
    .filter((entry) => entry.goalId === goalId)
    .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));

export function getGoalValue(state, goal) {
  if (goal.type === "checklist") return (goal.checklistItems || []).filter((item) => item.done).length;
  if (goal.source === "economy_total") return economyTotal(state.modules.economy);
  if (goal.source === "economy_account") return accountBalance(state.modules.economy, goal.sourceId);
  if (goal.source === "study_weekly") {
    const minutes = state.modules.studies.sessions
      .filter((session) => isThisWeek(session.startedAt))
      .reduce((sum, session) => sum + session.durationMinutes, 0);
    return Number((minutes / 60).toFixed(2));
  }
  if (goal.source === "habit_streak") return goal.currentStreak || 0;

  return goalEntries(state, goal.id).reduce(
    (value, entry) => entry.operation === "set" ? Number(entry.value) : value + Number(entry.value),
    Number(goal.startValue) || 0,
  );
}

export function getGoalTarget(goal) {
  return goal.type === "checklist" ? (goal.checklistItems || []).length : Number(goal.targetValue) || 0;
}

export function isGoalReached(goal, value = 0) {
  const target = getGoalTarget(goal);
  if (!target && goal.type !== "number") return false;
  return goal.direction === "decrease" ? value <= target : value >= target;
}

export function getGoalProgress(state, goal) {
  const value = getGoalValue(state, goal);
  const target = getGoalTarget(goal);
  const start = Number(goal.startValue) || 0;
  const span = Math.abs(target - start);
  const travelled = goal.direction === "decrease" ? start - value : value - start;
  const percent = goal.type === "checklist"
    ? (target ? value / target * 100 : 0)
    : (span ? travelled / span * 100 : (isGoalReached(goal, value) ? 100 : 0));
  return { value, target, percent: Math.max(0, Math.min(100, percent)), rawPercent: percent };
}

export function getGoalStatus(state, goal, today = localISO()) {
  const progress = getGoalProgress(state, goal);
  if (goal.status === "paused") return { id: "paused", ...GOAL_STATUS.paused };
  if (goal.dependsOn && state.goals[goal.dependsOn] && !isGoalReached(state.goals[goal.dependsOn], getGoalValue(state, state.goals[goal.dependsOn]))) return { id: "blocked", ...GOAL_STATUS.blocked };
  const reached = isGoalReached(goal, progress.value);
  if (reached) return { id: "achieved", ...GOAL_STATUS.achieved };
  if (goal.achievedAt) return { id: "lost", ...GOAL_STATUS.lost };

  if (goal.deadline) {
    const remainingDays = daysBetween(today, goal.deadline);
    if (remainingDays < 0) return { id: "overdue", ...GOAL_STATUS.overdue };

    const totalDays = Math.max(1, daysBetween(goal.startDate || goal.createdAt, goal.deadline));
    const elapsedDays = Math.max(0, daysBetween(goal.startDate || goal.createdAt, today));
    const expectedPercent = Math.min(100, elapsedDays / totalDays * 100);
    if (progress.percent + 15 < expectedPercent || (remainingDays <= 7 && progress.percent < 80)) {
      return { id: "at_risk", ...GOAL_STATUS.at_risk };
    }
    return { id: "on_track", ...GOAL_STATUS.on_track };
  }
  return { id: "active", ...GOAL_STATUS.active };
}

export function getGoalTrend(state, goal) {
  const entries = goalEntries(state, goal.id);
  if (goal.source !== "manual" || entries.length < 2) return { direction: "flat", delta: 0 };
  const latest = Number(entries.at(-1).value);
  const previous = Number(entries.at(-2).value);
  const delta = latest - previous;
  return { direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat", delta };
}

const movementFromDelta = (goal, delta) => {
  if (!delta) return { id: "stalled", label: "Stannat av" };
  const forward = goal.direction === "decrease" ? delta < 0 : delta > 0;
  return forward ? { id: "forward", label: "Framåt" } : { id: "backward", label: "Bakåt" };
};

export function getGoalMovement(state, goal) {
  const status = getGoalStatus(state, goal);
  if (status.id === "achieved") return { id: "forward", label: "Framåt" };
  if (status.id === "lost") return { id: "backward", label: "Bakåt" };

  const entries = goalEntries(state, goal.id);
  if (entries.length) {
    const latest = Number(entries.at(-1).value);
    const previous = entries.length > 1 ? Number(entries.at(-2).value) : Number(goal.startValue) || 0;
    return movementFromDelta(goal, latest - previous);
  }

  if (goal.source === "economy_total" || goal.source === "economy_account") {
    const latestTransaction = state.modules.economy.transactions.at(-1);
    if (!latestTransaction) return { id: "stalled", label: "Stannat av" };
    const delta = goal.source === "economy_total"
      ? latestTransaction.type === "deposit" ? Math.abs(Number(latestTransaction.amount) || 0)
        : latestTransaction.type === "withdrawal" ? -Math.abs(Number(latestTransaction.amount) || 0)
          : 0
      : transactionImpact(latestTransaction, goal.sourceId);
    return movementFromDelta(goal, delta);
  }

  if (goal.source === "study_weekly" && state.modules.studies.sessions.length) {
    return movementFromDelta(goal, Number(state.modules.studies.sessions.at(-1).durationMinutes) || 0);
  }

  return { id: "stalled", label: "Stannat av" };
}

export function getGoalForecast(state, goal) {
  const { value, target } = getGoalProgress(state, goal);
  if (isGoalReached(goal, value)) return { label: "Målet är nått", date: null };

  const startDate = new Date(goal.startDate || goal.createdAt);
  const elapsedDays = Math.max(1, daysBetween(startDate, new Date()));
  const movement = goal.direction === "decrease"
    ? (Number(goal.startValue) || 0) - value
    : value - (Number(goal.startValue) || 0);
  const rate = movement / elapsedDays;
  if (rate <= 0) return { label: "Ingen positiv trend ännu", date: null };

  const remaining = Math.abs(target - value);
  const forecast = new Date();
  forecast.setDate(forecast.getDate() + Math.ceil(remaining / rate));
  return {
    label: `Prognos ${forecast.toLocaleDateString("sv-SE", { day: "numeric", month: "short", year: "numeric" })}`,
    date: forecast.toISOString(),
  };
}

export function getNextAction(state, goal) {
  const { value, target } = getGoalProgress(state, goal);
  if (isGoalReached(goal, value)) return "Behåll nivån och undvik att tappa målet.";
  if (goal.type === "checklist") {
    const next = (goal.checklistItems || []).find((item) => !item.done);
    return next ? `Nästa: ${next.label}` : "Gör en sista kontroll.";
  }

  const remaining = Math.abs(target - value);
  if (goal.deadline) {
    const weeks = Math.max(1, Math.ceil(daysBetween(new Date(), goal.deadline) / 7));
    const pace = remaining / weeks;
    return `${goal.direction === "decrease" ? "Minska" : "Öka"} med ${pace.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} ${goal.unit || ""} per vecka.`;
  }
  return `${remaining.toLocaleString("sv-SE", { maximumFractionDigits: 1 })} ${goal.unit || ""} återstår.`;
}

export function reconcileGoalAchievements(state) {
  let changed = false;
  const goals = { ...state.goals };
  for (const goal of Object.values(goals)) {
    if (goal.status === "archived") continue;
    const reached = isGoalReached(goal, getGoalValue(state, goal));
    if (reached && !goal.achievedAt) {
      goals[goal.id] = { ...goal, achievedAt: new Date().toISOString() };
      changed = true;
    }
  }
  return changed ? { ...state, goals } : state;
}

export function removeGoalFromPlannerState(state, goalId) {
  if (!state.goals[goalId]) return state;
  const goals = { ...state.goals };
  delete goals[goalId];
  const goalEntries = Object.fromEntries(Object.entries(state.goalEntries || {}).filter(([, entry]) => entry.goalId !== goalId));
  const withoutGoalKeys = (values = {}) => Object.fromEntries(Object.entries(values).filter(([key]) => !key.includes(goalId)));
  return {
    ...state,
    goals,
    goalEntries,
    dashboard: {
      ...state.dashboard,
      pinnedGoalIds: state.dashboard.pinnedGoalIds.filter((id) => id !== goalId),
    },
    today: {
      ...state.today,
      completions: withoutGoalKeys(state.today.completions),
      dismissed: withoutGoalKeys(state.today.dismissed),
    },
  };
}
