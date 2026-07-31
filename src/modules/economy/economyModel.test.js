import { describe, expect, it } from "vitest";
import { accountBalance, economyTotal, removeAccountFromPlannerState, removeAccountLedger, removeTransaction, transactionTouchesAccount, upsertTransaction } from "./economyModel";

const economy = {
  accounts: {
    a: { id: "a", openingBalance: 1000, archived: false },
    b: { id: "b", openingBalance: 500, archived: false },
  },
  transactions: [
    { id: "1", type: "deposit", accountId: "a", amount: 200 },
    { id: "2", type: "withdrawal", accountId: "a", amount: 350 },
    { id: "3", type: "transfer", fromAccountId: "a", toAccountId: "b", amount: 100 },
  ],
};

describe("economy ledger", () => {
  it("derives balances from every transaction direction", () => {
    expect(accountBalance(economy, "a")).toBe(750);
    expect(accountBalance(economy, "b")).toBe(600);
    expect(economyTotal(economy)).toBe(1350);
  });

  it("allows withdrawals to lower an account below zero", () => {
    const state = { ...economy, transactions: [{ type: "withdrawal", accountId: "a", amount: 1500 }] };
    expect(accountBalance(state, "a")).toBe(-500);
  });

  it("does not double count migrated historical transactions", () => {
    const state = { ...economy, transactions: [{ type: "legacy", accountId: "a", amount: 400, affectsBalance: false }] };
    expect(accountBalance(state, "a")).toBe(1000);
  });

  it("recalculates from the replacement when a transaction is edited", () => {
    const transactions = upsertTransaction(economy.transactions, { ...economy.transactions[0], amount: 500 });
    expect(accountBalance({ ...economy, transactions }, "a")).toBe(1050);
  });

  it("reverses the effect when a transaction is removed", () => {
    const transactions = removeTransaction(economy.transactions, "2");
    expect(accountBalance({ ...economy, transactions }, "a")).toBe(1100);
  });

  it("detects deposits, withdrawals and both sides of a transfer", () => {
    expect(transactionTouchesAccount(economy.transactions[0], "a")).toBe(true);
    expect(transactionTouchesAccount(economy.transactions[2], "a")).toBe(true);
    expect(transactionTouchesAccount(economy.transactions[2], "b")).toBe(true);
    expect(transactionTouchesAccount(economy.transactions[0], "b")).toBe(false);
  });

  it("removes an account and every transaction that references it", () => {
    const result = removeAccountLedger({ ...economy, monthlyPlan: { autoTransferAccountId: "a" } }, "a");
    expect(result.accounts.a).toBeUndefined();
    expect(result.accounts.b).toBeDefined();
    expect(result.transactions).toEqual([]);
    expect(result.monthlyPlan.autoTransferAccountId).toBe("");
  });

  it("preserves linked goals as manual goals when their account is removed", () => {
    const plannerState = {
      goals: {
        savings: { id: "savings", name: "Buffert", source: "economy_account", sourceId: "a", startValue: 0 },
        other: { id: "other", name: "Läsning", source: "manual", sourceId: "", startValue: 2 },
      },
      goalEntries: {},
      modules: {
        economy: { ...economy, monthlyPlan: { autoTransferAccountId: "a" } },
        habits: { habits: [] },
      },
    };

    const result = removeAccountFromPlannerState(plannerState, "a", {
      occurredAt: "2026-07-31T12:00:00.000Z",
      createEntryId: () => "entry-final",
    });

    expect(result.modules.economy.accounts.a).toBeUndefined();
    expect(result.modules.economy.transactions).toEqual([]);
    expect(result.modules.economy.monthlyPlan.autoTransferAccountId).toBe("");
    expect(result.modules.habits).toBe(plannerState.modules.habits);
    expect(result.goals.savings).toMatchObject({ source: "manual", sourceId: "", startValue: 750 });
    expect(result.goalEntries["entry-final"]).toMatchObject({ goalId: "savings", operation: "set", value: 750 });
    expect(result.goals.other).toEqual(plannerState.goals.other);
  });

  it("does nothing when the account no longer exists", () => {
    const plannerState = { goals: {}, goalEntries: {}, modules: { economy } };
    expect(removeAccountFromPlannerState(plannerState, "missing")).toBe(plannerState);
  });
});
