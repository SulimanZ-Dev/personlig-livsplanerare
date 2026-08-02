export function accountBalance(economy, accountId) {
  const account = economy.accounts[accountId];
  if (!account) return 0;

  return (economy.transactions || []).reduce((balance, transaction) => {
    if (transaction.affectsBalance === false) return balance;
    const amount = Math.abs(Number(transaction.amount) || 0);
    if (transaction.type === "deposit" && transaction.accountId === accountId) return balance + amount;
    if (transaction.type === "withdrawal" && transaction.accountId === accountId) return balance - amount;
    if (transaction.type === "transfer" && transaction.fromAccountId === accountId) return balance - amount;
    if (transaction.type === "transfer" && transaction.toAccountId === accountId) return balance + amount;
    if ((transaction.type === "adjustment" || transaction.type === "legacy") && transaction.accountId === accountId) {
      return balance + (Number(transaction.amount) || 0);
    }
    return balance;
  }, Number(account.openingBalance) || 0);
}
export function economyTotal(economy) {
  return Object.values(economy.accounts)
    .filter((account) => !account.archived)
    .reduce((total, account) => total + accountBalance(economy, account.id), 0);
}

export function upsertTransaction(transactions = [], transaction) {
  const exists = transactions.some((item) => item.id === transaction.id);
  return exists ? transactions.map((item) => item.id === transaction.id ? transaction : item) : [...transactions, transaction];
}

export function removeTransaction(transactions = [], transactionId) {
  return transactions.filter((item) => item.id !== transactionId);
}

export function transactionTouchesAccount(transaction, accountId) {
  if (transaction.type === "transfer") {
    return transaction.fromAccountId === accountId || transaction.toAccountId === accountId;
  }
  return transaction.accountId === accountId;
}

export function removeAccountLedger(economy, accountId) {
  const accounts = { ...economy.accounts };
  delete accounts[accountId];
  return {
    ...economy,
    accounts,
    transactions: (economy.transactions || []).filter((transaction) => !transactionTouchesAccount(transaction, accountId)),
    monthlyPlan: economy.monthlyPlan?.autoTransferAccountId === accountId
      ? { ...economy.monthlyPlan, autoTransferAccountId: "" }
      : economy.monthlyPlan,
  };
}

export function removeAccountFromPlannerState(state, accountId, options = {}) {
  const account = state.modules.economy.accounts[accountId];
  if (!account) return state;

  const finalBalance = accountBalance(state.modules.economy, accountId);
  const occurredAt = options.occurredAt || new Date().toISOString();
  const createEntryId = options.createEntryId || (() => `entry-${crypto.randomUUID()}`);
  const goals = { ...state.goals };
  const goalEntries = { ...state.goalEntries };

  Object.values(goals)
    .filter((goal) => goal.source === "economy_account" && goal.sourceId === accountId)
    .forEach((goal) => {
      goals[goal.id] = {
        ...goal,
        source: "manual",
        sourceId: "",
        startValue: finalBalance,
        updatedAt: occurredAt,
      };
      const entry = {
        id: createEntryId(goal.id),
        goalId: goal.id,
        operation: "set",
        value: finalBalance,
        note: `Kontot ${account.name} togs bort · sista saldo sparat`,
        occurredAt,
      };
      goalEntries[entry.id] = entry;
    });

  return {
    ...state,
    goals,
    goalEntries,
    modules: {
      ...state.modules,
      economy: removeAccountLedger(state.modules.economy, accountId),
    },
  };
}

export function transactionImpact(transaction, accountId) {
  const amount = Math.abs(Number(transaction.amount) || 0);
  if (transaction.type === "deposit" && transaction.accountId === accountId) return amount;
  if (transaction.type === "withdrawal" && transaction.accountId === accountId) return -amount;
  if (transaction.type === "transfer" && transaction.fromAccountId === accountId) return -amount;
  if (transaction.type === "transfer" && transaction.toAccountId === accountId) return amount;
  if (transaction.accountId === accountId) return Number(transaction.amount) || 0;
  return 0;
}

export function monthlySummary(economy, month = new Date().toISOString().slice(0, 7)) {
  const summary = (economy.transactions || []).reduce((result, transaction) => {
    if (!String(transaction.date || transaction.occurredAt).startsWith(month) || transaction.type === "transfer" || transaction.affectsBalance === false) return result;
    const amount = Math.abs(Number(transaction.amount) || 0);
    if (transaction.type === "deposit") result.income += amount;
    if (transaction.type === "withdrawal") result.expenses += amount;
    return result;
  }, { income: 0, expenses: 0, savingsRate: 0 });
  summary.savingsRate = summary.income ? (summary.income - summary.expenses) / summary.income * 100 : 0;
  return summary;
}

export function economyForecast(economy, days = 90, from = new Date()) {
  const rows = [];
  const end = new Date(from);
  end.setDate(end.getDate() + days);
  (economy.recurringTransactions || []).filter((item) => item.enabled !== false).forEach((item) => {
    const cursor = new Date(from.getFullYear(), from.getMonth(), Math.min(28, Number(item.day) || 1), 12);
    if (cursor < from) cursor.setMonth(cursor.getMonth() + 1);
    while (cursor <= end) {
      rows.push({ ...item, projectedDate: cursor.toISOString().slice(0, 10), signedAmount: item.type === "withdrawal" ? -Math.abs(Number(item.amount) || 0) : item.type === "transfer" ? 0 : Math.abs(Number(item.amount) || 0) });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  });
  const opening = economyTotal(economy);
  return { opening, rows: rows.sort((a, b) => a.projectedDate.localeCompare(b.projectedDate)), closing: opening + rows.reduce((sum, item) => sum + item.signedAmount, 0) };
}
