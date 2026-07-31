import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage/schema";
import { buildTodayPlan } from "./todayPlanner";

describe("today planner", () => {
  it("prioritizes overdue goals before ordinary active goals", () => {
    const state = createInitialState();
    state.goals.later = { id: "later", name: "Aktivt", type: "number", source: "manual", direction: "increase", startValue: 0, targetValue: 10, status: "active", createdAt: "2026-01-01T00:00:00.000Z" };
    state.goals.late = { id: "late", name: "Försenat", type: "number", source: "manual", direction: "increase", startValue: 0, targetValue: 10, deadline: "2026-02-01", status: "active", createdAt: "2026-01-01T00:00:00.000Z" };
    expect(buildTodayPlan(state, "2026-03-01")[0].goalId).toBe("late");
  });

  it("respects dismissed actions for a specific day", () => {
    const state = createInitialState();
    state.goals.goal = { id: "goal", name: "Mål", type: "number", source: "manual", direction: "increase", startValue: 0, targetValue: 10, status: "active", createdAt: "2026-01-01T00:00:00.000Z" };
    state.today.dismissed["goal:goal:2026-03-01"] = true;
    expect(buildTodayPlan(state, "2026-03-01")).toHaveLength(0);
  });
});
