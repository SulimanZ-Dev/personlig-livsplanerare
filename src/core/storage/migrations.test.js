import { describe, expect, it } from "vitest";
import { normalizeState } from "./migrations";

describe("schema v6 migration", () => {
  it("adds new module collections, account kinds and the system shortcut", () => {
    const migrated = normalizeState({
      schemaVersion: 5,
      profile: {},
      dashboard: { quickNavIds: ["economy"] },
      modules: { economy: { accounts: { savings: { id: "savings", name: "Spar", openingBalance: 10 } }, transactions: [] } },
    });
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.dashboard.quickNavIds).toEqual(["system", "economy"]);
    expect(migrated.modules.economy.accounts.savings.kind).toBe("savings");
    expect(migrated.modules.nutrition.recipes).toEqual([]);
    expect(migrated.planner.inbox).toEqual([]);
    expect(migrated.trash).toEqual([]);
  });
});
