import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage/schema";
import { getGoalMovement, getGoalProgress, getGoalStatus, isGoalReached, reconcileGoalAchievements } from "./goalEngine";

const baseGoal = {
  id: "goal-test",
  name: "Test",
  type: "number",
  source: "manual",
  direction: "increase",
  startValue: 0,
  targetValue: 100,
  startDate: "2026-01-01",
  createdAt: "2026-01-01T00:00:00.000Z",
  status: "active",
};

const withGoal = (goal = baseGoal, value = 0) => {
  const state = createInitialState();
  state.goals[goal.id] = goal;
  state.goalEntries.entry = { id: "entry", goalId: goal.id, operation: "set", value, occurredAt: "2026-02-01T00:00:00.000Z" };
  return state;
};

describe("goal engine", () => {
  it("supports goals that decrease toward a target", () => {
    const goal = { ...baseGoal, direction: "decrease", startValue: 100, targetValue: 80 };
    const state = withGoal(goal, 90);
    expect(getGoalProgress(state, goal).percent).toBe(50);
    expect(isGoalReached(goal, 79)).toBe(true);
  });

  it("marks reached goals achieved", () => {
    const state = withGoal(baseGoal, 100);
    expect(getGoalStatus(state, baseGoal, "2026-02-01").id).toBe("achieved");
  });

  it("reactivates a previously achieved goal as lost when progress falls", () => {
    const goal = { ...baseGoal, achievedAt: "2026-02-01T00:00:00.000Z" };
    const state = withGoal(goal, 80);
    expect(getGoalStatus(state, goal, "2026-02-02").id).toBe("lost");
  });

  it("marks unfinished past-deadline goals overdue", () => {
    const goal = { ...baseGoal, deadline: "2026-03-01" };
    const state = withGoal(goal, 50);
    expect(getGoalStatus(state, goal, "2026-03-02").id).toBe("overdue");
  });

  it("records the first achievement without erasing it later", () => {
    const state = withGoal(baseGoal, 100);
    const reconciled = reconcileGoalAchievements(state);
    expect(reconciled.goals[baseGoal.id].achievedAt).toBeTruthy();
  });

  it("classifies progress relative to the goal direction", () => {
    const increaseState = withGoal(baseGoal, 10);
    expect(getGoalMovement(increaseState, baseGoal).id).toBe("forward");

    const decreaseGoal = { ...baseGoal, direction: "decrease", startValue: 100, targetValue: 80 };
    const decreaseState = withGoal(decreaseGoal, 90);
    expect(getGoalMovement(decreaseState, decreaseGoal).id).toBe("forward");
  });

  it("treats a withdrawal as backward movement for a savings goal", () => {
    const state = createInitialState();
    const goal = { ...baseGoal, source: "economy_total", moduleId: "economy", unit: "kr" };
    state.goals[goal.id] = goal;
    state.modules.economy.transactions.push({
      id: "withdrawal",
      type: "withdrawal",
      accountId: "cash",
      amount: 50,
      affectsBalance: true,
    });
    expect(getGoalMovement(state, goal).id).toBe("backward");
  });
});
