import { isThisWeek, localISO, startOfWeek } from "../core/dates/dateUtils";
import { getTwoMissWarnings } from "../core/attention/attentionEngine";
import { getPhaseStatus } from "../core/phases/phaseEngine";
import { getGoalValue } from "../core/goals/goalEngine";
import { economyTotal } from "../modules/economy/economyModel";
import { nutritionTargets, nutritionTotals } from "../modules/nutrition/nutritionModel";

const number = (value, options = {}) => new Intl.NumberFormat("sv-SE", options).format(value);
const measurements = (state, type) => (state.modules.personal?.measurements || [])
  .filter((entry) => entry.type === type)
  .slice()
  .sort((a, b) => String(a.date).localeCompare(String(b.date)));

const measurementDetail = (state, type, unit) => {
  const values = measurements(state, type);
  if (values.length < 2) return `första mätningen · ${unit}`;
  const delta = Number(values.at(-1).value) - Number(values.at(-2).value);
  return `${delta > 0 ? "+" : ""}${number(delta, { maximumFractionDigits: 1 })} ${unit} sedan sist`;
};

const activeGoal = (state, predicate) => Object.values(state.goals).find((goal) => goal.status !== "archived" && predicate(goal));

const workoutWeekStreak = (workouts = []) => {
  const weeks = new Set(workouts.map((workout) => localISO(startOfWeek(new Date(workout.date)))));
  let streak = 0;
  const cursor = startOfWeek();
  while (weeks.has(localISO(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
};

export const MODULE_REGISTRY = [
  {
    id: "economy",
    label: "Ekonomi",
    icon: "wallet",
    color: "#3ddc84",
    summary: (state) => `${number(economyTotal(state.modules.economy), { maximumFractionDigits: 0 })} kr`,
    detail: (state) => `${Object.values(state.modules.economy.accounts).filter((account) => !account.archived).length} aktiva konton`,
  },
  {
    id: "habits",
    label: "Rutiner",
    icon: "check",
    color: "#f0b429",
    summary: (state) => {
      const today = localISO();
      const done = state.modules.habits.checkIns.filter((entry) => entry.date === today && entry.done).length;
      return `${done}/${state.modules.habits.habits.length} idag`;
    },
    detail: (state) => state.modules.habits.habits.length ? "Never zero" : "Skapa din första rutin",
  },
  {
    id: "gym",
    label: "Gym",
    icon: "dumbbell",
    color: "#5eb1ff",
    summary: (state) => `${state.modules.gym.workouts.filter((workout) => isThisWeek(workout.date)).length} pass`,
    detail: () => "den här veckan",
  },
  {
    id: "studies",
    label: "Studier",
    icon: "book",
    color: "#a78bfa",
    summary: (state) => {
      const minutes = state.modules.studies.sessions.filter((session) => isThisWeek(session.startedAt)).reduce((sum, session) => sum + session.durationMinutes, 0);
      return minutes < 60 ? `${minutes} min` : `${(minutes / 60).toFixed(1)} h`;
    },
    detail: (state) => state.modules.studies.activeSession ? "Session pågår" : "deep work denna vecka",
  },
  {
    id: "reviews",
    label: "Review",
    icon: "review",
    color: "#f472b6",
    summary: (state) => `${state.modules.reviews.entries.length} gjorda`,
    detail: () => "se mönster och justera",
  },
  {
    id: "nutrition",
    label: "Nutrition",
    icon: "nutrition",
    color: "#f472b6",
    summary: (state) => {
      const today = nutritionTotals(state.modules.nutrition.intakeLogs, localISO());
      if (today.items) return `${number(today.calories)} kcal`;
      const latest = state.modules.nutrition.calculations.find((item) => item.id === state.modules.nutrition.latestCalculationId);
      return latest ? `${latest.calorieTarget.toLocaleString("sv-SE")} kcal` : "Beräkna";
    },
    detail: (state) => {
      const today = nutritionTotals(state.modules.nutrition.intakeLogs, localISO());
      return today.items ? `${number(today.protein)} g protein · ${today.items} intag` : state.modules.nutrition.calculations.length ? "dagligt målintag" : "kostlogg + publik kalkylator";
    },
  },
  {
    id: "nutritionCalories",
    route: "nutrition",
    label: "Dagens kalorier",
    icon: "nutrition",
    color: "#f472b6",
    summary: (state) => {
      const total = nutritionTotals(state.modules.nutrition.intakeLogs, localISO()).calories;
      const target = nutritionTargets(state.modules.nutrition).calories;
      return target ? `${number(total)}/${number(target)}` : `${number(total)} kcal`;
    },
    detail: (state) => {
      const total = nutritionTotals(state.modules.nutrition.intakeLogs, localISO()).calories;
      const target = nutritionTargets(state.modules.nutrition).calories;
      return target ? `${number(Math.max(0, target - total))} kcal kvar` : "sätt mål i kalkylatorn";
    },
  },
  {
    id: "nutritionProtein",
    route: "nutrition",
    label: "Dagens protein",
    icon: "pulse",
    color: "#5eb1ff",
    summary: (state) => {
      const total = nutritionTotals(state.modules.nutrition.intakeLogs, localISO()).protein;
      const target = nutritionTargets(state.modules.nutrition).proteinMin;
      return target ? `${number(total)}/${number(target)} g` : `${number(total)} g`;
    },
    detail: (state) => {
      const total = nutritionTotals(state.modules.nutrition.intakeLogs, localISO()).protein;
      const target = nutritionTargets(state.modules.nutrition).proteinMin;
      return target ? `${number(Math.max(0, target - total))} g kvar` : "kopplas till din kaloriplan";
    },
  },
  {
    id: "nutritionWeek",
    route: "nutrition",
    label: "Kostlogg veckan",
    icon: "calendar",
    color: "#f0b429",
    summary: (state) => `${new Set(state.modules.nutrition.intakeLogs.filter((entry) => isThisWeek(entry.date)).map((entry) => entry.date)).size}/7 dagar`,
    detail: (state) => `${state.modules.nutrition.intakeLogs.filter((entry) => isThisWeek(entry.date)).length} intag loggade`,
  },
  {
    id: "phase",
    route: "rules",
    label: "Aktuell fas",
    icon: "calendar",
    color: "#3ddc84",
    isAvailable: (state) => Boolean(getPhaseStatus(state.profile.phases)),
    summary: (state) => getPhaseStatus(state.profile.phases)?.name || "Ingen fas",
    detail: (state) => {
      const phase = getPhaseStatus(state.profile.phases);
      return phase?.state === "current" ? `dag ${phase.day} av ${phase.totalDays}` : phase?.label || "";
    },
  },
  {
    id: "certRoadmap",
    route: "studies",
    label: "Cert-roadmap",
    icon: "target",
    color: "#a78bfa",
    isAvailable: (state) => Boolean(state.modules.studies.roadmap?.length),
    summary: (state) => {
      const roadmap = state.modules.studies.roadmap || [];
      return `${roadmap.filter((item) => item.done).length}/${roadmap.length} klara`;
    },
    detail: (state) => state.modules.studies.roadmap?.find((item) => !item.done)?.name || "Roadmap slutförd",
  },
  {
    id: "twoMiss",
    route: "habits",
    label: "Two-miss-status",
    icon: "flame",
    color: "#f0b429",
    isAvailable: (state) => Boolean(state.modules.habits.habits.length),
    summary: (state) => {
      const warnings = getTwoMissWarnings(state);
      return warnings.length ? `${warnings.length} behöver floor` : "Kedjor skyddade";
    },
    detail: (state) => getTwoMissWarnings(state)[0]?.habitName || "ingen dubbel miss",
  },
  {
    id: "weightTrend",
    route: "statistics",
    label: "Vikttrend",
    icon: "scale",
    color: "#f472b6",
    isAvailable: (state) => measurements(state, "weight").length > 0,
    summary: (state) => `${number(measurements(state, "weight").at(-1)?.value || 0, { maximumFractionDigits: 1 })} kg`,
    detail: (state) => measurementDetail(state, "weight", "kg"),
  },
  {
    id: "restingHeartRate",
    route: "statistics",
    label: "Vilopuls",
    icon: "pulse",
    color: "#f0704a",
    isAvailable: (state) => measurements(state, "resting_hr").length > 0,
    summary: (state) => `${number(measurements(state, "resting_hr").at(-1)?.value || 0)} bpm`,
    detail: (state) => measurementDetail(state, "resting_hr", "bpm"),
  },
  {
    id: "sleep",
    label: "Sömn",
    icon: "moon",
    color: "#7dd3fc",
    isAvailable: (state) => Boolean(state.modules.sleep.logs.length || state.modules.sleep.targetWakeTime),
    summary: (state) => state.modules.sleep.logs.length ? `${Number(state.modules.sleep.logs.at(-1).durationHours || 0).toFixed(1)} h` : "Sätt rytm",
    detail: (state) => state.modules.sleep.targetWakeTime ? `upp ${state.modules.sleep.targetWakeTime}` : "återhämtning och vilopuls",
  },
  {
    id: "economyMilestone",
    route: "economy",
    label: "Nästa milstolpe",
    icon: "wallet",
    color: "#3ddc84",
    isAvailable: (state) => Boolean(activeGoal(state, (goal) => goal.moduleId === "economy")),
    summary: (state) => {
      const goal = activeGoal(state, (item) => item.moduleId === "economy");
      return `${Math.max(0, Number(goal.targetValue) - getGoalValue(state, goal)).toLocaleString("sv-SE")} kr kvar`;
    },
    detail: (state) => activeGoal(state, (goal) => goal.moduleId === "economy")?.name || "Ekonomiskt mål",
  },
  {
    id: "gymStreak",
    route: "gym",
    label: "Träningsstreak",
    icon: "dumbbell",
    color: "#5eb1ff",
    summary: (state) => `${workoutWeekStreak(state.modules.gym.workouts)} veckor`,
    detail: (state) => `${state.modules.gym.workouts.filter((workout) => isThisWeek(workout.date)).length} pass denna vecka`,
  },
  {
    id: "system",
    label: "Planerare",
    icon: "calendar",
    color: "#3ddc84",
    summary: (state) => `${state.planner.events.filter((item) => item.date === localISO() && item.status === "planned").length} idag`,
    detail: (state) => state.planner.inbox.length ? `${state.planner.inbox.length} osorterade i inbox` : "kalendern och inboxen är i fas",
  },
  {
    id: "wellbeing",
    route: "system",
    label: "Energi & mående",
    icon: "pulse",
    color: "#f0704a",
    isAvailable: (state) => Boolean(state.planner.wellbeing.length),
    summary: (state) => `${state.planner.wellbeing.at(-1)?.energy || "–"}/5 energi`,
    detail: (state) => `stress ${state.planner.wellbeing.at(-1)?.stress || "–"}/5 · senaste check-in`,
  },
  {
    id: "projects",
    route: "system",
    label: "Projekt",
    icon: "target",
    color: "#a78bfa",
    isAvailable: (state) => Boolean(state.projects.length),
    summary: (state) => `${state.projects.filter((item) => item.status === "active").length} pågår`,
    detail: (state) => `${state.projects.filter((item) => item.status === "done").length}/${state.projects.length} klara`,
  },
  {
    id: "studyTarget",
    route: "studies",
    label: "Veckans studier",
    icon: "book",
    color: "#a78bfa",
    isAvailable: (state) => Boolean(activeGoal(state, (goal) => goal.source === "study_weekly")),
    summary: (state) => {
      const goal = activeGoal(state, (item) => item.source === "study_weekly");
      return `${getGoalValue(state, goal).toLocaleString("sv-SE", { maximumFractionDigits: 1 })}/${goal.targetValue} h`;
    },
    detail: () => "deep work denna vecka",
  },
];

export const availableModules = (state) => MODULE_REGISTRY.filter((module) => !module.isAvailable || module.isAvailable(state));
