import { describe, expect, it } from "vitest";
import { buildQuietIndicators, getTwoMissWarnings, isContingencyDay } from "./attentionEngine";

const state = (overrides = {}) => ({
  profile: { quietIndicatorsEnabled: true },
  today: { contingency: null },
  contingency: { history: [] },
  modules: {
    habits: { habits: [{ id: "sleep", name: "Sömn", frequency: "daily", minimumVersion: "gå upp 07", createdAt: "2026-01-01T00:00:00Z" }], checkIns: [] },
    reviews: { entries: [] },
  },
  ...overrides,
});

describe("attention engine", () => {
  it("raises a two-miss warning after two eligible misses", () => {
    expect(getTwoMissWarnings(state(), "2026-02-05")[0]).toMatchObject({ habitId: "sleep", dates: ["2026-02-03", "2026-02-04"] });
  });

  it("does not count a contingency day as a normal miss", () => {
    const input = state({ contingency: { history: [{ date: "2026-02-04", mode: "sick" }] } });
    input.modules.habits.checkIns.push({ habitId: "sleep", date: "2026-02-02", done: true });
    expect(getTwoMissWarnings(input, "2026-02-05")).toHaveLength(0);
    expect(isContingencyDay(input, "2026-02-04")).toBe(true);
  });

  it("builds low-intensity UI indicators without browser notifications", () => {
    expect(buildQuietIndicators(state(), "2026-02-05")[0]).toMatchObject({ kind: "habit", route: "habits" });
  });
});

