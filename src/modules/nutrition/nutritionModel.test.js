import { describe, expect, it } from "vitest";
import { calculateBmr, calculateNutritionPlan, hasHeavyRecentWorkout } from "./nutritionModel";

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
