import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage/schema";
import { buildUnifiedTimeline, dataQualityIssues, generateWeeklyPlan, globalSearch, movePlannerEvent, moveToTrash, plannerEvent } from "./systemEngine";

describe("systemEngine", () => {
  it("combines planned and completed items on one timeline", () => {
    const state = createInitialState();
    state.planner.events.push(plannerEvent({ id: "planned", title: "Planerat", date: "2026-08-03" }));
    state.modules.studies.sessions.push({ id: "study", subject: "Azure", startedAt: "2026-08-03T08:00:00", durationMinutes: 90 });
    const timeline = buildUnifiedTimeline(state, "2026-08-03", "2026-08-03");
    expect(timeline.map((item) => item.id)).toEqual(["planned", "study-study"]);
    expect(timeline[1].status).toBe("completed");
  });

  it("moves planned activities without mutating the input", () => {
    const events = [plannerEvent({ id: "one", date: "2026-08-03" })];
    const moved = movePlannerEvent(events, "one", "2026-08-05");
    expect(events[0].date).toBe("2026-08-03");
    expect(moved[0].date).toBe("2026-08-05");
  });

  it("keeps deleted entities recoverable for thirty days", () => {
    const state = createInitialState();
    const next = moveToTrash(state, "goal", { id: "goal-1", name: "Test" });
    expect(next.trash).toHaveLength(1);
    expect(new Date(next.trash[0].purgeAt) > new Date(next.trash[0].deletedAt)).toBe(true);
  });

  it("searches across modules and reports data quality issues", () => {
    const state = createInitialState();
    state.goals.goal = { id: "goal", name: "Lär Azure", status: "active", actionLabel: "" };
    state.modules.nutrition.intakeLogs.push({ id: "food", name: "Havregryn", calories: 50000, protein: 10 });
    expect(globalSearch(state, "havre")[0].route).toBe("nutrition");
    expect(dataQualityIssues(state)).toHaveLength(2);
  });

  it("builds a review and scheduled habits without duplicating existing events", () => {
    const state = createInitialState();
    state.modules.habits.habits.push({ id: "habit-1", name: "Studera", weekdays: [1], paused: false });
    const first = generateWeeklyPlan(state, "2026-08-03");
    const second = generateWeeklyPlan({ ...state, planner: { ...state.planner, events: first } }, "2026-08-03");
    expect(first.some((item) => item.sourceId.includes("habit:habit-1"))).toBe(true);
    expect(first.some((item) => item.moduleId === "reviews")).toBe(true);
    expect(second).toHaveLength(0);
  });
});
