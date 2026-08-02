import { localISO, startOfWeek } from "../dates/dateUtils";
import { getGoalStatus, getGoalValue } from "../goals/goalEngine";
import { getTwoMissWarnings } from "../attention/attentionEngine";
import { economyTotal } from "../../modules/economy/economyModel";
import { nutritionTargets, nutritionTotals } from "../../modules/nutrition/nutritionModel";

const DAY = 86400000;
const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;
const enabled = (state, ruleId, area = "coach") => state[area]?.rules?.find((rule) => rule.id === ruleId)?.enabled !== false;
const threshold = (state, ruleId, fallback) => Number(state.coach?.rules?.find((rule) => rule.id === ruleId)?.threshold) || fallback;

export function addDays(date, amount) {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + amount);
  return localISO(next);
}

export function plannerEvent(input) {
  return {
    id: input.id || id("event"),
    title: input.title?.trim() || "Planerad aktivitet",
    moduleId: input.moduleId || "personal",
    kind: input.kind || "task",
    date: input.date || localISO(),
    time: input.time || "",
    durationMinutes: Number(input.durationMinutes) || 0,
    status: input.status || "planned",
    sourceId: input.sourceId || "",
    note: input.note?.trim() || "",
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function buildUnifiedTimeline(state, fromDate, toDate) {
  const rows = [...(state.planner?.events || [])];
  const add = (entry) => rows.push(plannerEvent(entry));

  state.modules.gym.workouts.forEach((workout) => add({ id: `gym-${workout.id}`, title: workout.type, moduleId: "gym", kind: "workout", date: localISO(new Date(workout.date)), status: "completed", sourceId: workout.id }));
  state.modules.studies.sessions.forEach((session) => add({ id: `study-${session.id}`, title: session.subject, moduleId: "studies", kind: "deep_work", date: localISO(new Date(session.startedAt)), durationMinutes: session.durationMinutes, status: "completed", sourceId: session.id }));
  state.modules.habits.checkIns.forEach((checkIn) => {
    const habit = state.modules.habits.habits.find((item) => item.id === checkIn.habitId);
    if (habit) add({ id: `habit-${checkIn.id}`, title: habit.name, moduleId: "habits", kind: "habit", date: checkIn.date, status: checkIn.done ? "completed" : "skipped", sourceId: checkIn.id, note: checkIn.level || "" });
  });
  state.modules.reviews.entries.forEach((review) => add({ id: `review-${review.id}`, title: `${review.type}-review`, moduleId: "reviews", kind: "review", date: localISO(new Date(review.createdAt || review.date)), status: "completed", sourceId: review.id }));
  Object.values(state.goals).filter((goal) => goal.status !== "archived" && goal.deadline).forEach((goal) => add({ id: `deadline-${goal.id}`, title: `Deadline: ${goal.name}`, moduleId: goal.moduleId, kind: "deadline", date: goal.deadline, status: getGoalStatus(state, goal).id === "achieved" ? "completed" : "planned", sourceId: goal.id }));

  return rows.filter((row) => (!fromDate || row.date >= fromDate) && (!toDate || row.date <= toDate)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
}

export function movePlannerEvent(events, eventId, date) {
  return events.map((event) => event.id === eventId ? { ...event, date } : event);
}

export function coachInsights(state) {
  const insights = [];
  const today = localISO();
  const nutrition = nutritionTotals(state.modules.nutrition.intakeLogs, today);
  const targets = nutritionTargets(state.modules.nutrition);
  if (enabled(state, "protein_remaining") && targets.proteinMin && targets.proteinMin - nutrition.protein > 0) {
    insights.push({ id: "protein_remaining", tone: "info", route: "nutrition", title: `${Math.round(targets.proteinMin - nutrition.protein)} g protein kvar idag`, detail: "Välj en proteinrik måltid som passar dagens kalorier." });
  }

  const misses = getTwoMissWarnings(state);
  if (enabled(state, "two_miss") && misses.length) insights.push({ id: "two_miss", tone: "warning", route: "habits", title: `${misses.length} rutiner riskerar en andra miss`, detail: `Gör floor-versionen av ${misses[0].habitName} idag.` });

  const weeklyGoal = Object.values(state.goals).find((goal) => goal.status !== "archived" && goal.source === "study_weekly");
  if (enabled(state, "study_gap") && weeklyGoal) {
    const gap = Math.max(0, Number(weeklyGoal.targetValue) - getGoalValue(state, weeklyGoal));
    if (gap > 0) insights.push({ id: "study_gap", tone: gap > 10 ? "warning" : "info", route: "studies", title: `Du ligger ${gap.toFixed(1)} timmar efter studiemålet`, detail: "Planera nästa fokusblock i kalendern." });
  }

  const economyGoal = Object.values(state.goals).find((goal) => goal.status !== "archived" && goal.moduleId === "economy" && goal.deadline);
  if (enabled(state, "savings_deadline") && economyGoal) {
    const months = Math.max(1, Math.ceil((new Date(economyGoal.deadline) - new Date()) / (DAY * 30.44)));
    const needed = Math.max(0, Number(economyGoal.targetValue) - economyTotal(state.modules.economy));
    if (needed > 0) insights.push({ id: "savings_deadline", tone: getGoalStatus(state, economyGoal).tone, route: "economy", title: `Sparmålet kräver ${Math.ceil(needed / months).toLocaleString("sv-SE")} kr/månad`, detail: `Cirka ${months} månader återstår till deadline.` });
  }

  const workouts = state.modules.gym.workouts.slice(-12);
  if (enabled(state, "gym_plateau") && workouts.length >= 6) {
    const recent = workouts.slice(-3).flatMap((item) => item.exercises || []).reduce((sum, item) => sum + Number(item.weight || 0) * Number(item.reps || 0) * Number(item.sets || 0), 0);
    const previous = workouts.slice(-6, -3).flatMap((item) => item.exercises || []).reduce((sum, item) => sum + Number(item.weight || 0) * Number(item.reps || 0) * Number(item.sets || 0), 0);
    if (recent <= previous) insights.push({ id: "gym_plateau", tone: "warning", route: "gym", title: "Tre träningsveckor utan tydlig progression", detail: "Kontrollera sömn, mat, RIR och om en deload behövs." });
  }

  const latestSleep = state.modules.sleep.logs.at(-1);
  const latestWorkout = state.modules.gym.workouts.at(-1);
  if (enabled(state, "recovery") && latestSleep && latestWorkout && Number(latestSleep.durationHours) < threshold(state, "recovery", 6) && Date.now() - new Date(latestWorkout.date).getTime() < 36 * 3600000) {
    insights.push({ id: "recovery", tone: "warning", route: "sleep", title: "Kort sömn nära tung träning", detail: "Behåll rörelse men sänk volym eller intensitet om uppvärmningen känns ovanligt tung." });
  }

  return insights;
}

export function applyAutomations(state, event) {
  let next = state;
  const today = event.date || localISO();
  const rules = state.automations?.rules || [];
  const ruleOn = (ruleId) => rules.find((rule) => rule.id === ruleId)?.enabled !== false;
  const markHabit = (matcher, level) => {
    const habit = next.modules.habits.habits.find((item) => matcher(`${item.name} ${item.category || ""}`.toLocaleLowerCase("sv-SE")));
    if (!habit) return;
    const existing = next.modules.habits.checkIns.find((item) => item.habitId === habit.id && item.date === today);
    const checkIn = { id: existing?.id || id("check"), habitId: habit.id, date: today, done: true, level, automated: true };
    const checkIns = existing ? next.modules.habits.checkIns.map((item) => item.id === existing.id ? checkIn : item) : [...next.modules.habits.checkIns, checkIn];
    next = { ...next, modules: { ...next.modules, habits: { ...next.modules.habits, checkIns } } };
  };
  if (event.kind === "gym" && ruleOn("gym_habit")) markHabit((name) => name.includes("träning") || name.includes("gym"), "full");
  if (event.kind === "nutrition" && ruleOn("nutrition_floor")) markHabit((name) => name.includes("nutrition") || name.includes("kost"), event.fullDay && ruleOn("nutrition_full") ? "full" : "floor");
  return next;
}

export function moveToTrash(state, kind, entity, context = {}) {
  const deletedAt = new Date().toISOString();
  return {
    ...state,
    trash: [...(state.trash || []), { id: id("trash"), kind, entity, context, deletedAt, purgeAt: new Date(Date.now() + 30 * DAY).toISOString() }],
  };
}

export function globalSearch(state, query) {
  const needle = query.trim().toLocaleLowerCase("sv-SE");
  if (!needle) return [];
  const rows = [];
  const push = (kind, route, idValue, title, detail = "") => {
    if (`${title} ${detail}`.toLocaleLowerCase("sv-SE").includes(needle)) rows.push({ kind, route, id: idValue, title, detail });
  };
  Object.values(state.goals).forEach((goal) => push("Mål", "goals", goal.id, goal.name, `${goal.category || ""} ${goal.actionLabel || ""}`));
  state.modules.nutrition.intakeLogs.forEach((entry) => push("Mat", "nutrition", entry.id, entry.name, entry.note));
  state.modules.economy.transactions.forEach((entry) => push("Transaktion", "economy", entry.id, entry.note || entry.type, `${entry.amount} kr`));
  state.modules.gym.workouts.forEach((entry) => push("Gympass", "gym", entry.id, entry.type, entry.exercises?.map((item) => item.name).join(" ")));
  state.modules.studies.sessions.forEach((entry) => push("Studier", "studies", entry.id, entry.subject, entry.project));
  (state.projects || []).forEach((entry) => push("Projekt", "system", entry.id, entry.name, entry.note));
  (state.planner?.inbox || []).forEach((entry) => push("Inbox", "system", entry.id, entry.text));
  return rows.slice(0, 30);
}

export function dataQualityIssues(state) {
  const issues = [];
  Object.values(state.goals).filter((goal) => goal.status !== "archived" && !goal.actionLabel).forEach((goal) => issues.push({ id: `goal-${goal.id}`, route: "goals", label: `${goal.name} saknar nästa handling` }));
  state.modules.economy.transactions.filter((item) => !item.date || !Number.isFinite(Number(item.amount))).forEach((item) => issues.push({ id: `transaction-${item.id}`, route: "economy", label: "En transaktion har saknat datum eller belopp" }));
  state.modules.nutrition.intakeLogs.filter((item) => Number(item.calories) > 10000 || Number(item.protein) > 1000).forEach((item) => issues.push({ id: `nutrition-${item.id}`, route: "nutrition", label: `${item.name} har orimliga kostvärden` }));
  const ids = new Set();
  [...state.modules.nutrition.intakeLogs, ...state.modules.economy.transactions].forEach((item) => {
    if (ids.has(item.id)) issues.push({ id: `duplicate-${item.id}`, route: "settings", label: `Dubblett-id upptäckt: ${item.id}` });
    ids.add(item.id);
  });
  return issues;
}

export function weekRange(anchor = new Date()) {
  const start = startOfWeek(anchor);
  return { from: localISO(start), to: addDays(localISO(start), 6) };
}

export function generateWeeklyPlan(state, anchor = new Date()) {
  const { from, to } = weekRange(anchor);
  const candidates = [];
  const addGenerated = (input, sourceKey) => candidates.push(plannerEvent({ ...input, sourceId: `generated:${sourceKey}`, generated: true }));
  Object.values(state.goals).filter((goal) => !["archived", "paused"].includes(goal.status) && goal.actionLabel).slice(0, 5).forEach((goal, index) => addGenerated({ title: goal.actionLabel, moduleId: goal.moduleId, kind: "goal_action", date: addDays(from, Math.min(index, 4)), durationMinutes: 20 }, `goal:${goal.id}:${from}`));
  (state.modules.gym.workoutTemplates || []).slice(0, 5).forEach((template, index) => addGenerated({ title: `${template.type}-pass`, moduleId: "gym", kind: "workout", date: addDays(from, Math.min(index, 5)), durationMinutes: template.durationMinutes || 90 }, `gym:${template.id}:${from}`));
  (state.modules.studies.blocks || []).forEach((block, blockIndex) => [0, 1, 2, 3, 4].forEach((day) => addGenerated({ title: block.label || "Deep work", moduleId: "studies", kind: "deep_work", date: addDays(from, day), time: block.start, durationMinutes: Math.max(30, Math.round((Number(block.end?.slice(0, 2)) - Number(block.start?.slice(0, 2))) * 60)) }, `study:${blockIndex}:${day}:${from}`)));
  state.modules.habits.habits.filter((habit) => !habit.paused).forEach((habit) => (habit.weekdays || [0, 1, 2, 3, 4, 5, 6]).forEach((weekday) => { const mondayIndex = weekday === 0 ? 6 : weekday - 1; addGenerated({ title: habit.name, moduleId: "habits", kind: "habit", date: addDays(from, mondayIndex), durationMinutes: 5 }, `habit:${habit.id}:${mondayIndex}:${from}`); }));
  addGenerated({ title: "Veckoreview", moduleId: "reviews", kind: "review", date: to, durationMinutes: 20 }, `review:${from}`);
  (state.modules.economy.recurringTransactions || []).filter((item) => item.enabled !== false).forEach((item) => {
    for (let offset = 0; offset < 7; offset += 1) { const date = addDays(from, offset); if (Number(date.slice(-2)) === Number(item.day)) addGenerated({ title: item.name, moduleId: "economy", kind: "recurring", date, durationMinutes: 5 }, `economy:${item.id}:${date}`); }
  });
  const known = new Set((state.planner.events || []).map((item) => item.sourceId));
  return candidates.filter((item) => !known.has(item.sourceId));
}
