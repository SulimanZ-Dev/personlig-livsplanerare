import { describe, expect, it } from "vitest";
import { createInitialState } from "../storage/schema";
import { createSuliProfile, SULI_PROFILE_SEED_VERSION } from "./suliProfile";

describe("Suli Operating System seed", () => {
  it("stays separate from the empty public state", () => {
    const publicState = createInitialState();
    expect(publicState.profile.displayName).toBe("");
    expect(publicState.profile.phases).toHaveLength(0);
    expect(publicState.goals).toEqual({});
  });

  it("contains the documented personal system", () => {
    const seed = createSuliProfile();
    expect(seed.profile.seedVersion).toBe(SULI_PROFILE_SEED_VERSION);
    expect(seed.profile.schedule.find((item) => item.label === "Sömn")).toMatchObject({ time: "01:00", endTime: "09:00" });
    expect(seed.profile.phases).toHaveLength(3);
    expect(seed.goals["goal-preprogram"].checklistItems).toHaveLength(17);
    expect(seed.modules.gym.workoutTemplates).toHaveLength(5);
    expect(seed.modules.studies.roadmap).toHaveLength(9);
    expect(seed.profile.kpis).toHaveLength(12);
    expect(seed.referenceRules).toHaveLength(10);
  });
});

