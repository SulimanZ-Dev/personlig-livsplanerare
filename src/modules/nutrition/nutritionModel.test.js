import { describe, expect, it } from "vitest";
import { calculateBmr, calculateNutritionPlan, hasHeavyRecentWorkout, macroCalories, nutritionTargets, nutritionTotals, recentNutritionChoices, removeNutritionEntry, upsertNutritionEntry } from "./nutritionModel";

const base = { weight: 90, height: 180, age: 30, gender: "male", activity: "moderate", lossType: "fat", weeklyRate: 0.6, targetWeight: 82 };

describe("nutrition calculator", () => {
  it("uses Mifflin-St Jeor and derives deficit from kg per week", () => {
    expect(calculateBmr(base)).toBe(1880);
    const result = calculateNutritionPlan(base);
    expect(result.tdee).toBe(2914);
    expect(result.dailyDeficit).toBe(660);
    expect(result.calorieTarget).toBe(2254);
    expect(result.pace.id).toBe("balanced");
  });

  it("warns when the requested pace crosses the personalized floor", () => {
    const result = calculateNutritionPlan({ ...base, weight: 55, gender: "female", weeklyRate: 1.5 });
    expect(result.belowFloor).toBe(true);
    expect(result.pace.id).toBe("aggressive");
  });

  it("flags aggressive deficits near heavy training", () => {
    expect(calculateNutritionPlan({ ...base, weeklyRate: 1.2 }, { heavyTraining: true }).trainingConflict).toBe(true);
  });

  it("recognizes a recent high-volume strength session", () => {
    const today = "2026-07-31";
    const workouts = [{ date: today, type: "Push", exercises: [{ sets: Array.from({ length: 10 }, () => ({})) }] }];
    expect(hasHeavyRecentWorkout(workouts, new Date("2026-07-31T12:00:00"))).toBe(true);
  });
});

describe("nutrition diary", () => {
  const entries = [
    { id: "1", kind: "food", name: "Kvarg", date: "2026-07-31", calories: 200, protein: 30, carbs: 12, fat: 2, fiber: 1, occurredAt: "2026-07-31T08:00:00Z" },
    { id: "2", kind: "supplement", name: "Kreatin", date: "2026-07-31", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, occurredAt: "2026-07-31T09:00:00Z" },
    { id: "3", kind: "food", name: "Kvarg", date: "2026-07-30", calories: 180, protein: 28, carbs: 10, fat: 1, occurredAt: "2026-07-30T08:00:00Z" },
  ];

  it("sums macros for one day and counts supplements", () => {
    expect(nutritionTotals(entries, "2026-07-31")).toEqual({ calories: 200, protein: 30, carbs: 12, fat: 2, fiber: 1, items: 2, supplements: 1 });
  });

  it("derives practical macro targets from the latest plan", () => {
    const targets = nutritionTargets({ calculations: [{ id: "latest", calorieTarget: 2200, protein: [160, 200], inputs: { weight: 90 } }], latestCalculationId: "latest", profile: {} });
    expect(targets).toMatchObject({ calories: 2200, proteinMin: 160, proteinMax: 200, fat: 72, fiber: 30 });
    expect(targets.carbs).toBe(228);
  });

  it("estimates calories from macros and supports CRUD", () => {
    expect(macroCalories({ protein: 30, carbs: 50, fat: 10 })).toBe(410);
    expect(upsertNutritionEntry(entries, { ...entries[0], calories: 250 })[0].calories).toBe(250);
    expect(removeNutritionEntry(entries, "2")).toHaveLength(2);
  });

  it("returns unique recent choices", () => {
    expect(recentNutritionChoices(entries).map((entry) => entry.name)).toEqual(["Kreatin", "Kvarg"]);
  });
});
