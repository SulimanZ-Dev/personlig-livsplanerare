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

export function transactionImpact(transaction, accountId) {
  const amount = Math.abs(Number(transaction.amount) || 0);
  if (transaction.type === "deposit" && transaction.accountId === accountId) return amount;
  if (transaction.type === "withdrawal" && transaction.accountId === accountId) return -amount;
  if (transaction.type === "transfer" && transaction.fromAccountId === accountId) return -amount;
  if (transaction.type === "transfer" && transaction.toAccountId === accountId) return amount;
  if (transaction.accountId === accountId) return Number(transaction.amount) || 0;
  return 0;
}
