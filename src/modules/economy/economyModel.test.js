import { describe, expect, it } from "vitest";
import { accountBalance, economyTotal } from "./economyModel";

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
});
