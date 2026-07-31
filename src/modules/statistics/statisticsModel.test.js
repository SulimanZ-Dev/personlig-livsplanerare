import { describe, expect, it } from "vitest";
import { createInitialState } from "../../core/storage/schema";
import { buildWeeklyTrends } from "./statisticsModel";

describe("weekly trends", () => {
  it("aggregates all public modules without counting transfers as income", () => {
    const state = createInitialState();
    state.modules.economy.transactions = [
      { type: "deposit", amount: 1000, occurredAt: "2026-07-29T12:00:00Z" },
      { type: "withdrawal", amount: 200, occurredAt: "2026-07-30T12:00:00Z" },
      { type: "transfer", amount: 500, occurredAt: "2026-07-30T12:00:00Z" },
    ];
    state.modules.studies.sessions = [{ startedAt: "2026-07-29T12:00:00Z", durationMinutes: 90 }];
    state.modules.gym.workouts = [{ date: "2026-07-30T12:00:00Z" }];
    state.modules.habits.checkIns = [{ date: "2026-07-30", done: true }];
    state.modules.nutrition.intakeLogs = [
      { date: "2026-07-29", protein: 100 },
      { date: "2026-07-29", protein: 50 },
      { date: "2026-07-30", protein: 200 },
    ];
    const latest = buildWeeklyTrends(state, 1, new Date("2026-07-31T12:00:00Z"))[0];
    expect(latest).toMatchObject({ economyNet: 800, studyHours: 1.5, workouts: 1, habitChecks: 1, nutritionDays: 2, proteinAverage: 175 });
  });
});
