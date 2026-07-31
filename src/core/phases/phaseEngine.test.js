import { describe, expect, it } from "vitest";
import { getPhaseStatus } from "./phaseEngine";

const phases = [
  { id: "foundation", name: "Fas 1 – Foundation", startDate: "2026-01-01", endDate: "2026-01-31" },
  { id: "integration", name: "Fas 2 – Integration", startDate: "2026-02-01", endDate: "2026-04-01" },
];

describe("getPhaseStatus", () => {
  it("returns a one-based day and phase progress", () => {
    expect(getPhaseStatus(phases, "2026-02-10")).toMatchObject({ id: "integration", state: "current", day: 10, totalDays: 60, percent: 17 });
  });

  it("describes an upcoming phase", () => {
    expect(getPhaseStatus(phases, "2025-12-29")).toMatchObject({ id: "foundation", state: "upcoming", daysUntil: 3 });
  });

  it("describes completion after the final phase", () => {
    expect(getPhaseStatus(phases, "2026-05-01")).toMatchObject({ id: "integration", state: "completed", percent: 100 });
  });
});

