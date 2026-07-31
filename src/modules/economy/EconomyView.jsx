import { useState } from "react";
import { GoalWidget } from "../../components/goals/GoalWidget";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { localISO } from "../../core/dates/dateUtils";
import { accountBalance, economyTotal } from "./economyModel";

const money = (value) => new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + " kr";
const transactionLabels = { deposit: "Insättning", withdrawal: "Uttag", transfer: "Överföring" };
const transactionTouchesAccount = (transaction, accountId) => (
  transaction.type === "transfer"
    ? transaction.fromAccountId === accountId || transaction.toAccountId === accountId
    : transaction.accountId === accountId
);

export function EconomyView({ state, onTransaction, onAddAccount, onCreateGoal, onOpenGoal }) {
  const data = state.modules.economy;
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountStart, setAccountStart] = useState("");
  const accounts = Object.values(data.accounts).filter((account) => !account.archived);
  const [form, setForm] = useState({ type: "deposit", accountId: accounts[0]?.id || "", fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "", amount: "", note: "" });
  const total = economyTotal(data);
  const economyGoals = Object.values(state.goals).filter((goal) => goal.moduleId === "economy" && goal.status !== "archived");

  const submit = (event) => {
    event.preventDefault();
    const amount = Math.abs(Number(String(form.amount).replace(",", ".")));
    if (!amount) return;
    if (form.type === "transfer" && form.fromAccountId === form.toAccountId) return;
    const transaction = {
      id: `tx-${crypto.randomUUID()}`,
      type: form.type,
      amount,
      note: form.note.trim(),
      date: localISO(),
      occurredAt: new Date().toISOString(),
      affectsBalance: true,
      ...(form.type === "transfer"
        ? { fromAccountId: form.fromAccountId, toAccountId: form.toAccountId }
        : { accountId: form.accountId }),
    };
    onTransaction(transaction);
    setForm((current) => ({ ...current, amount: "", note: "" }));
    setOpen(false);
  };

  const accountNameFor = (transaction) => {
    if (transaction.type === "transfer") return `${data.accounts[transaction.fromAccountId]?.name || "?"} → ${data.accounts[transaction.toAccountId]?.name || "?"}`;
    return data.accounts[transaction.accountId]?.name || "Historik";
  };

  return (
    <div className="page">
      <header className="page-header economy-hero">
        <div className="row-between"><div><div className="eyebrow">EKONOMI · TOTALT</div><h1 className="money-hero">{money(total)}</h1></div><button aria-label="Ny transaktion" className="icon-button accent" onClick={() => setOpen(true)}><Icon name="plus" /></button></div>
        <p>Summan räknas från varje faktisk transaktion — både upp och ner.</p>
      </header>

      <div className="account-scroll">
        {accounts.map((account) => {
          const balance = accountBalance(data, account.id);
          return <article className="card account-live-card" key={account.id} style={{ "--account-color": account.color }}><div><span className="status-dot" /><small>{account.name}</small></div><strong className={balance < 0 ? "negative" : ""}>{money(balance)}</strong><span>{data.transactions.filter((transaction) => transactionTouchesAccount(transaction, account.id)).length} händelser</span></article>;
        })}
        <button className="card add-account-card" onClick={() => setAccountOpen(true)}><Icon name="plus" /><span>Nytt konto</span></button>
      </div>

      <div className="economy-actions">
        <button className="primary-button" onClick={() => setOpen(true)}><Icon name="swap" size={18} /> Ny transaktion</button>
        <button className="secondary-button" onClick={onCreateGoal}><Icon name="target" size={18} /> Nytt sparmål</button>
      </div>

      <section className="section">
        <div className="section-title"><span>EKONOMISKA MÅL</span><small>{economyGoals.length} aktiva</small></div>
        <div className="dashboard-goals">{economyGoals.map((goal) => <GoalWidget compact state={state} goal={goal} key={goal.id} onOpen={onOpenGoal} />)}{!economyGoals.length && <button className="empty-goal-card card" onClick={onCreateGoal}><Icon name="target" /><strong>Skapa ett dynamiskt sparmål</strong><span>Koppla det till totalsumman eller ett särskilt konto.</span></button>}</div>
      </section>

      <section className="section">
        <div className="section-title"><span>TRANSAKTIONER</span><small>{data.transactions.length} totalt</small></div>
        <div className="history-list">
          {data.transactions.slice().reverse().slice(0, 30).map((transaction) => {
            const signed = transaction.type === "withdrawal" ? -Math.abs(transaction.amount) : transaction.type === "deposit" ? Math.abs(transaction.amount) : transaction.amount;
            return <div className="history-row transaction-row" key={transaction.id}><span className={`transaction-icon ${transaction.type}`}><Icon name={transaction.type === "deposit" ? "arrowDown" : transaction.type === "withdrawal" ? "arrowUp" : "swap"} size={15} /></span><div><strong>{transaction.note || transactionLabels[transaction.type] || "Äldre historik"}</strong><small>{accountNameFor(transaction)} · {transaction.date}</small></div><b className={transaction.type === "withdrawal" ? "negative" : transaction.type === "deposit" ? "positive" : ""}>{transaction.type === "transfer" ? money(transaction.amount) : `${signed > 0 ? "+" : ""}${money(signed)}`}</b></div>;
          })}
          {!data.transactions.length && <div className="empty-state">Ingen historik ännu. Första transaktionen blir startpunkten.</div>}
        </div>
      </section>

      {open && (
        <Modal title="Ny transaktion" onClose={() => setOpen(false)}>
          <form className="form-stack" onSubmit={submit}>
            <div className="transaction-types">
              {[["deposit", "arrowDown", "Insättning"], ["withdrawal", "arrowUp", "Uttag"], ["transfer", "swap", "Flytta"]].map(([type, icon, label]) => <button type="button" className={form.type === type ? "active" : ""} key={type} onClick={() => setForm({ ...form, type })}><Icon name={icon} size={17} /><span>{label}</span></button>)}
            </div>
            {form.type === "transfer" ? (
              <div className="field-grid"><label>Från<select value={form.fromAccountId} onChange={(event) => setForm({ ...form, fromAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><label>Till<select value={form.toAccountId} onChange={(event) => setForm({ ...form, toAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label></div>
            ) : <label>Konto<select value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>}
            <label>Belopp<input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0" autoFocus /></label>
            <label>Anteckning<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Vad var detta?" /></label>
            <button className={`primary-button ${form.type === "withdrawal" ? "withdraw-button" : ""}`}>{transactionLabels[form.type]}</button>
          </form>
        </Modal>
      )}

      {accountOpen && <Modal title="Nytt konto" onClose={() => setAccountOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); if (!accountName.trim()) return; onAddAccount(accountName.trim(), Number(accountStart) || 0); setAccountName(""); setAccountStart(""); setAccountOpen(false); }}><label>Kontonamn<input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="T.ex. Resekonto" autoFocus /></label><label>Öppningssaldo<input type="number" inputMode="decimal" value={accountStart} onChange={(event) => setAccountStart(event.target.value)} placeholder="0" /></label><button className="primary-button">Skapa konto</button></form></Modal>}
    </div>
  );
}
