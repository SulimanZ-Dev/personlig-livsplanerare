import { createInitialState } from "./schema";

export function loadOrMigrate() {
  const current = window.localStorage.getItem("life-planner:v1");
  if (current) return JSON.parse(current);

  const state = createInitialState();
  const legacyRaw = window.localStorage.getItem("ekonomi-state-v1");
  if (!legacyRaw) return state;

  try {
    const legacy = JSON.parse(legacyRaw);
    state.modules.economy.accounts.cash.balance = Number(legacy.kontanter) || 0;
    state.modules.economy.accounts.buffer.balance = Number(legacy.buffert) || 0;
    state.modules.economy.accounts.savings.balance = Number(legacy.hogranta) || 0;
    state.goals["goal-buffer"].startValue = Number(legacy.buffert) || 0;
    state.goals["goal-buffer"].targetValue = Number(legacy.buffertMal) || 10000;
    state.modules.economy.transactions = (legacy.log || []).map((entry) => ({
      id: entry.id, accountId: entry.account || "buffer", amount: Number(entry.delta) || 0,
      note: entry.text, date: entry.date,
    }));
    state.meta.migratedFrom = "ekonomi-state-v1";
  } catch {
    state.meta.migrationError = true;
  }
  return state;
}

