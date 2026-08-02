import { describe, expect, it } from "vitest";
import { estimatedOneRepMax, personalRecords, plateLoading, progressionSignal, workoutVolume } from "./gymModel";

describe("gymModel", () => {
  const workouts = [
    { date: "2026-01-01", exercises: [{ id: "a", name: "Bänk", sets: 3, reps: 5, weight: 80 }] },
    { date: "2026-01-08", exercises: [{ id: "b", name: "Bänk", setDetails: [{ weight: 82.5, reps: 5, warmup: false }, { weight: 40, reps: 10, warmup: true }] }] },
  ];
  it("calculates volume without warm-up sets", () => {
    expect(workoutVolume(workouts[1])).toBe(412.5);
  });
  it("finds records and progression", () => {
    expect(personalRecords(workouts, "Bänk").weight.weight).toBe(82.5);
    expect(progressionSignal(workouts, "Bänk").id).toBe("up");
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.7);
  });
  it("calculates plates per side", () => {
    expect(plateLoading(100, 20).plates).toEqual([{ plate: 25, count: 1 }, { plate: 15, count: 1 }]);
    expect(plateLoading(101, 20).loadable).toBe(false);
  });
});
