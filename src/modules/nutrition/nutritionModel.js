export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Stillasittande", factor: 1.2 },
  { id: "light", label: "Lätt aktiv", factor: 1.375 },
  { id: "moderate", label: "Måttligt aktiv", factor: 1.55 },
  { id: "active", label: "Mycket aktiv", factor: 1.725 },
  { id: "very_active", label: "Extremt aktiv", factor: 1.9 },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const roundTo = (value, step = 1) => Math.round(value / step) * step;

export function calculateBmr({ weight, height, age, gender }) {
  const base = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
  return Math.round(base + (gender === "male" ? 5 : -161));
}

export function calculateNutritionPlan(input, { heavyTraining = false } = {}) {
  const weight = Number(input.weight);
  const height = Number(input.height);
  const age = Number(input.age);
  const rate = Number(input.weeklyRate);
  const targetWeight = Number(input.targetWeight);
  const activity = ACTIVITY_LEVELS.find((level) => level.id === input.activity) || ACTIVITY_LEVELS[2];
  const bmr = calculateBmr({ weight, height, age, gender: input.gender });
  const tdee = Math.round(bmr * activity.factor);
  const dailyDeficit = Math.round(rate * 7700 / 7);
  const calorieTarget = Math.round(tdee - dailyDeficit);
  const baseFloor = input.gender === "male" ? 1500 : 1200;
  const safeFloor = roundTo(Math.max(baseFloor, bmr * 0.72), 25);
  const balancedUpper = clamp(weight * 0.01, 0.6, 1.2);
  const belowFloor = calorieTarget < safeFloor;
  const aggressiveRate = rate > balancedUpper;
  const trainingConflict = heavyTraining && (dailyDeficit > 800 || calorieTarget < safeFloor + 250);

  let pace = { id: "gentle", label: "Försiktig takt", tone: "neutral", message: "Lugn takt. Följ energinivå och veckotrend innan du justerar." };
  if (rate < 0.3) {
    pace = { id: "slow", label: "Lugn nedgång", tone: "neutral", message: "Detta är en väldigt lugn nedgång — hållbart men långsamt." };
  } else if (rate >= 0.4 && !aggressiveRate && !belowFloor) {
    pace = { id: "balanced", label: "Balanserad takt", tone: "positive", message: "Bra balanserad takt för din kroppsvikt. Utvärdera efter 2–3 veckor." };
  } else if (aggressiveRate || belowFloor) {
    pace = { id: "aggressive", label: "För aggressivt", tone: "danger", message: "Den här takten ökar risken för muskelförlust och låg följsamhet. Sänk kg/vecka tills intaget ligger över säkerhetsgolvet." };
  }

  const proteinFactor = input.lossType === "fat" ? [1.6, 2.2] : [1.4, 2.0];
  const protein = proteinFactor.map((factor) => Math.round(weight * factor));
  const weeks = targetWeight > 0 && targetWeight < weight ? Math.ceil((weight - targetWeight) / Math.max(rate, 0.01)) : null;
  const targetDate = weeks ? new Date(Date.now() + weeks * 7 * 86400000).toISOString() : null;

  return {
    id: `nutrition-${crypto.randomUUID()}`,
    inputs: { ...input, weight, height, age, weeklyRate: rate, targetWeight },
    bmr,
    tdee,
    dailyDeficit,
    calorieTarget,
    safeFloor,
    balancedUpper: Number(balancedUpper.toFixed(2)),
    protein,
    pace,
    belowFloor,
    aggressiveRate,
    trainingConflict,
    targetDate,
    createdAt: new Date().toISOString(),
  };
}

export function hasHeavyRecentWorkout(workouts = [], now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(0, 0, 0, 0);
  return workouts.some((workout) => {
    const date = new Date(workout.date || workout.occurredAt);
    const sets = (workout.exercises || []).reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
    return date >= cutoff && sets >= 10 && !String(workout.type || "").toLowerCase().includes("cardio");
  });
}

const macroKeys = ["calories", "protein", "carbs", "fat", "fiber"];

export function nutritionTotals(entries = [], date = null) {
  return entries.reduce((totals, entry) => {
    if (date && entry.date !== date) return totals;
    macroKeys.forEach((key) => {
      totals[key] += Number(entry[key]) || 0;
    });
    totals.items += 1;
    if (entry.kind === "supplement") totals.supplements += 1;
    return totals;
  }, { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: 0, supplements: 0 });
}

export function nutritionTargets(nutrition = {}) {
  const latest = nutrition.calculations?.find((item) => item.id === nutrition.latestCalculationId)
    || nutrition.calculations?.at(-1);
  const profile = nutrition.profile || {};
  const calories = Number(latest?.calorieTarget || profile.calorieTarget) || 0;
  const proteinMin = Number(latest?.protein?.[0] || profile.proteinMin) || 0;
  const proteinMax = Number(latest?.protein?.[1] || profile.proteinMax) || proteinMin;
  const weight = Number(latest?.inputs?.weight || profile.weight) || 0;
  const fat = Number(profile.fatTarget) || (calories && weight ? Math.round(weight * 0.8) : 0);
  const carbs = Number(profile.carbsTarget) || (calories ? Math.max(0, Math.round((calories - proteinMin * 4 - fat * 9) / 4)) : 0);
  return { calories, proteinMin, proteinMax, carbs, fat, fiber: Number(profile.fiberTarget) || 30 };
}

export function macroCalories(entry) {
  return Math.round((Number(entry.protein) || 0) * 4 + (Number(entry.carbs) || 0) * 4 + (Number(entry.fat) || 0) * 9);
}

export function upsertNutritionEntry(entries = [], entry) {
  const exists = entries.some((item) => item.id === entry.id);
  return exists ? entries.map((item) => item.id === entry.id ? entry : item) : [...entries, entry];
}

export function removeNutritionEntry(entries = [], entryId) {
  return entries.filter((entry) => entry.id !== entryId);
}

export function recentNutritionChoices(entries = [], limit = 6) {
  const seen = new Set();
  return entries.slice().sort((a, b) => String(b.occurredAt).localeCompare(String(a.occurredAt))).filter((entry) => {
    const key = `${entry.kind}:${entry.name.trim().toLocaleLowerCase("sv-SE")}`;
    if (!entry.name.trim() || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
