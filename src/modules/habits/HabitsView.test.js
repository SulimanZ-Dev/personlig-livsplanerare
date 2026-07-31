import { afterEach, describe, expect, it, vi } from "vitest";
import { habitMomentum } from "./HabitsView";

const habit = { id: "habit", frequency: "daily" };

describe("two-miss habit momentum", () => {
  afterEach(() => vi.useRealTimers());

  it("protects a streak after one missed day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T12:00:00"));
    const result = habitMomentum(habit, [
      { habitId: "habit", date: "2026-07-30", done: true },
      { habitId: "habit", date: "2026-07-29", done: true },
    ]);
    expect(result.protected).toBe(true);
    expect(result.streak).toBe(2);
  });

  it("breaks the current streak after two missed days", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-31T12:00:00"));
    expect(habitMomentum(habit, [{ habitId: "habit", date: "2026-07-29", done: true }]).streak).toBe(0);
  });
});
