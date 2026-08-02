import { getGoalProgress, getGoalStatus, getNextAction } from "./goalEngine";
import { localISO } from "../dates/dateUtils";
import { getTwoMissWarnings, isContingencyDay } from "../attention/attentionEngine";

const priority = { overdue: 0, lost: 1, at_risk: 2, blocked: 3, on_track: 4, active: 5, paused: 6, achieved: 7 };

export function buildTodayPlan(state, date = localISO()) {
  const floorMode = isContingencyDay(state, date);
  const twoMissIds = new Set(getTwoMissWarnings(state).map((item) => item.habitId));
  const floorRules = state.today?.contingency?.date === date ? state.today.contingency.floorRules || {} : {};
  const actions = Object.values(state.goals)
    .filter((goal) => !["archived", "paused"].includes(goal.status))
    .map((goal) => {
      const status = getGoalStatus(state, goal, date);
      const progress = getGoalProgress(state, goal);
      return {
        id: `goal:${goal.id}:${date}`,
        goalId: goal.id,
        title: goal.name,
        detail: floorMode ? `Floor-läge: ${floorRules.goals?.[goal.id] || goal.floorAction || floorRules.default || goal.actionLabel || "gör minsta möjliga nästa steg i två minuter"}` : getNextAction(state, goal),
        color: goal.color,
        status,
        progress,
        completed: Boolean(state.today?.completions?.[`goal:${goal.id}:${date}`]),
        dismissed: Boolean(state.today?.dismissed?.[`goal:${goal.id}:${date}`]),
      };
    })
    .filter((action) => !action.dismissed && action.status.id !== "achieved")
    .sort((a, b) => priority[a.status.id] - priority[b.status.id] || a.progress.percent - b.progress.percent);

  const habitActions = state.modules.habits.habits.filter((habit) => !habit.paused && (habit.weekdays || [0, 1, 2, 3, 4, 5, 6]).includes(new Date(`${date}T12:00:00`).getDay())).map((habit) => {
    const completed = state.modules.habits.checkIns.some((entry) => entry.habitId === habit.id && entry.date === date && entry.done);
    return {
      id: `habit:${habit.id}:${date}`,
      habitId: habit.id,
      title: habit.name,
      detail: completed ? "Klart för idag." : twoMissIds.has(habit.id)
        ? `Two-miss: gör floor nu — ${habit.minimumVersion || "två minuter"}.`
        : floorMode
        ? `Floor-läge: ${floorRules.habits?.[habit.id] || habit.minimumVersion || floorRules.default || "gör två minuter"}.`
        : `Never zero: ${habit.minimumVersion || "gör minsta möjliga version"}.`,
      color: habit.color,
      status: { id: completed ? "achieved" : "active", label: completed ? "Klar" : "Idag", tone: completed ? "positive" : "neutral" },
      completed,
      dismissed: false,
    };
  });

  return [...actions, ...habitActions];
}
export function coachMessage(state, actions) {
  if (isContingencyDay(state)) return "Contingency-läget är aktivt. Floor-versionerna är planen idag — allt extra är bonus.";
  const overdue = actions.filter((action) => action.status.id === "overdue").length;
  const atRisk = actions.filter((action) => ["at_risk", "lost"].includes(action.status.id)).length;
  const completed = actions.filter((action) => action.completed).length;

  if (overdue) return `${overdue} mål är försenade. Välj ett och skapa rörelse idag — inte perfektion.`;
  if (atRisk) return `${atRisk} mål behöver din uppmärksamhet. En konkret handling räcker för att ändra riktningen.`;
  if (actions.length && completed === actions.length) return "Dagens plan är klar. Bra. Stäng appen och lev resten av dagen.";
  if (completed) return `${completed} klart. Fortsätt med nästa viktigaste sak medan du har momentum.`;
  return actions.length ? "Planen är tydlig. Börja med den översta handlingen och gör den mindre om den känns tung." : "Lugnt läge. Skapa ett mål som faktiskt betyder något för dig.";
}
