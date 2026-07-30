export const GOAL_TYPES = {
  number: { label: "Siffra att nå", icon: "trend" },
  checklist: { label: "Checklista", icon: "check" },
  streak: { label: "Streak", icon: "flame" },
};

export function goalProgress(goal, entries = []) {
  if (goal.type === "checklist") {
    const items = goal.checklistItems || [];
    const done = items.filter((item) => item.done).length;
    return { value: done, target: items.length, percent: items.length ? (done / items.length) * 100 : 0 };
  }
  if (goal.type === "streak") {
    const value = goal.currentStreak || 0;
    return { value, target: goal.targetValue || 1, percent: Math.min(100, (value / (goal.targetValue || 1)) * 100) };
  }
  const current = entries
    .filter((entry) => entry.goalId === goal.id)
    .reduce((value, entry) => entry.operation === "set" ? entry.value : value + entry.value, goal.startValue || 0);
  const span = (goal.targetValue || 0) - (goal.startValue || 0);
  return { value: current, target: goal.targetValue, percent: Math.max(0, Math.min(100, span ? ((current - goal.startValue) / span) * 100 : 0)) };
}

