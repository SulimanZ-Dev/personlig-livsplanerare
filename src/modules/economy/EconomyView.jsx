import { useState } from "react";
import { GoalWidget } from "../../components/goals/GoalWidget";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { localISO } from "../../core/dates/dateUtils";
import { accountBalance, economyTotal } from "./economyModel";

const money = (value) => new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + " kr";
const transactionLabels = { deposit: "Insättning", withdrawal: "Uttag", transfer: "Överföring" };
const emptyForm = (accounts) => ({ type: "deposit", accountId: accounts[0]?.id || "", fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "", amount: "", note: "", date: localISO() });
const transactionTouchesAccount = (transaction, accountId) => transaction.type === "transfer"
  ? transaction.fromAccountId === accountId || transaction.toAccountId === accountId
  : transaction.accountId === accountId;

export function EconomyView({ state, onUpsertTransaction, onDeleteTransaction, onAddAccount, onCreateGoal, onOpenGoal }) {
  const data = state.modules.economy;
  const accounts = Object.values(data.accounts).filter((account) => !account.archived);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(() => emptyForm(accounts));
  const [deleting, setDeleting] = useState(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountStart, setAccountStart] = useState("");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const total = economyTotal(data);
  const economyGoals = Object.values(state.goals).filter((goal) => goal.moduleId === "economy" && goal.status !== "archived");

  const openEditor = (transaction = null) => {
    setEditor(transaction || "new");
    setForm(transaction ? {
      type: transaction.type,
      accountId: transaction.accountId || accounts[0]?.id || "",
      fromAccountId: transaction.fromAccountId || accounts[0]?.id || "",
      toAccountId: transaction.toAccountId || accounts[1]?.id || accounts[0]?.id || "",
      amount: String(Math.abs(Number(transaction.amount) || 0)),
      note: transaction.note || "",
      date: transaction.date || localISO(),
    } : emptyForm(accounts));
  };

  const submit = (event) => {
    event.preventDefault();
    const amount = Math.abs(Number(String(form.amount).replace(",", ".")));
    if (!amount || (form.type === "transfer" && form.fromAccountId === form.toAccountId)) return;
    const existing = editor !== "new" ? editor : null;
    const transaction = {
      id: existing?.id || `tx-${crypto.randomUUID()}`,
      type: form.type,
      amount,
      note: form.note.trim(),
      date: form.date,
      occurredAt: new Date(`${form.date}T12:00:00`).toISOString(),
      createdAt: existing?.createdAt || existing?.occurredAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      affectsBalance: existing?.affectsBalance !== false,
      ...(form.type === "transfer" ? { fromAccountId: form.fromAccountId, toAccountId: form.toAccountId } : { accountId: form.accountId }),
    };
    onUpsertTransaction(transaction, Boolean(existing));
    setEditor(null);
  };

  const accountNameFor = (transaction) => transaction.type === "transfer"
    ? `${data.accounts[transaction.fromAccountId]?.name || "?"} → ${data.accounts[transaction.toAccountId]?.name || "?"}`
    : data.accounts[transaction.accountId]?.name || "Historik";

  const filtered = (() => {
    const normalized = query.trim().toLocaleLowerCase("sv-SE");
    return data.transactions.filter((transaction) => {
      if (typeFilter !== "all" && transaction.type !== typeFilter) return false;
      if (!normalized) return true;
      return `${transaction.note || ""} ${transactionLabels[transaction.type] || ""} ${accountNameFor(transaction)} ${transaction.date || ""}`.toLocaleLowerCase("sv-SE").includes(normalized);
    }).slice().sort((a, b) => new Date(b.occurredAt || b.date) - new Date(a.occurredAt || a.date));
  })();

  return (
    <div className="page">
      <header className="page-header economy-hero">
        <div className="row-between"><div><div className="eyebrow">EKONOMI · TOTALT</div><h1 className="money-hero">{money(total)}</h1></div><button aria-label="Ny transaktion" className="icon-button accent" onClick={() => openEditor()}><Icon name="plus" /></button></div>
        <p>Summan räknas om från hela transaktionslistan — redigeringar och borttagningar slår igenom direkt.</p>
      </header>

      <div className="account-scroll">
        {accounts.map((account) => {
          const balance = accountBalance(data, account.id);
          return <article className="card account-live-card" key={account.id} style={{ "--account-color": account.color }}><div><span className="status-dot" /><small>{account.name}</small></div><strong className={balance < 0 ? "negative" : ""}>{money(balance)}</strong><span>{data.transactions.filter((transaction) => transactionTouchesAccount(transaction, account.id)).length} händelser</span></article>;
        })}
        <button className="card add-account-card" onClick={() => setAccountOpen(true)}><Icon name="plus" /><span>Nytt konto</span></button>
      </div>

      <div className="economy-actions">
        <button className="primary-button" onClick={() => openEditor()}><Icon name="swap" size={18} /> Ny transaktion</button>
        <button className="secondary-button" onClick={onCreateGoal}><Icon name="target" size={18} /> Nytt sparmål</button>
      </div>

      <section className="section">
        <div className="section-title"><span>EKONOMISKA MÅL</span><small>{economyGoals.length} aktiva</small></div>
        <div className="dashboard-goals">{economyGoals.map((goal) => <GoalWidget compact state={state} goal={goal} key={goal.id} onOpen={onOpenGoal} />)}{!economyGoals.length && <button className="empty-goal-card card" onClick={onCreateGoal}><Icon name="target" /><strong>Skapa ett dynamiskt sparmål</strong><span>Koppla det till totalsumman eller ett särskilt konto.</span></button>}</div>
      </section>

      <section className="section">
        <div className="section-title"><span>TRANSAKTIONER</span><small>{filtered.length}/{data.transactions.length}</small></div>
        <div className="history-tools"><label className="search-field"><Icon name="search" size={15} /><input aria-label="Sök transaktioner" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök anteckning, konto, datum…" /></label><select aria-label="Filtrera transaktionstyp" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option value="all">Alla typer</option><option value="deposit">Insättningar</option><option value="withdrawal">Uttag</option><option value="transfer">Överföringar</option></select></div>
        <div className="history-list">
          {filtered.map((transaction) => {
            const signed = transaction.type === "withdrawal" ? -Math.abs(transaction.amount) : transaction.type === "deposit" ? Math.abs(transaction.amount) : transaction.amount;
            return <div className="history-row transaction-row" key={transaction.id}><span className={`transaction-icon ${transaction.type}`}><Icon name={transaction.type === "deposit" ? "arrowDown" : transaction.type === "withdrawal" ? "arrowUp" : "swap"} size={15} /></span><div><strong>{transaction.note || transactionLabels[transaction.type] || "Äldre historik"}</strong><small>{accountNameFor(transaction)} · {transaction.date}</small></div><b className={transaction.type === "withdrawal" ? "negative" : transaction.type === "deposit" ? "positive" : ""}>{transaction.type === "transfer" ? money(transaction.amount) : `${signed > 0 ? "+" : ""}${money(signed)}`}</b><span className="transaction-actions"><button aria-label={`Redigera ${transaction.note || transactionLabels[transaction.type]}`} onClick={() => openEditor(transaction)}><Icon name="edit" size={14} /></button><button aria-label={`Ta bort ${transaction.note || transactionLabels[transaction.type]}`} onClick={() => setDeleting(transaction)}><Icon name="trash" size={14} /></button></span></div>;
          })}
          {!filtered.length && <div className="empty-state">{data.transactions.length ? "Inga transaktioner matchar filtret." : "Ingen historik ännu. Första transaktionen blir startpunkten."}</div>}
        </div>
      </section>

      {editor && <Modal title={editor === "new" ? "Ny transaktion" : "Redigera transaktion"} onClose={() => setEditor(null)}><form className="form-stack" onSubmit={submit}>
        <div className="transaction-types">{[["deposit", "arrowDown", "Insättning"], ["withdrawal", "arrowUp", "Uttag"], ["transfer", "swap", "Flytta"]].map(([type, icon, label]) => <button type="button" className={form.type === type ? "active" : ""} key={type} onClick={() => setForm({ ...form, type })}><Icon name={icon} size={17} /><span>{label}</span></button>)}</div>
        {form.type === "transfer" ? <div className="field-grid"><label>Från<select value={form.fromAccountId} onChange={(event) => setForm({ ...form, fromAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><label>Till<select value={form.toAccountId} onChange={(event) => setForm({ ...form, toAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label></div> : <label>Konto<select value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>}
        <div className="field-grid"><label>Belopp<input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0" autoFocus /></label><label>Datum<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label></div>
        <label>Anteckning<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Vad var detta?" /></label>
        <button className={`primary-button ${form.type === "withdrawal" ? "withdraw-button" : ""}`}>{editor === "new" ? transactionLabels[form.type] : "Spara ändringar"}</button>
      </form></Modal>}

      {deleting && <Modal title="Ta bort transaktion?" onClose={() => setDeleting(null)}><div className="confirm-stack"><p><strong>{deleting.note || transactionLabels[deleting.type]}</strong> på {money(deleting.amount)} tas bort. Saldot räknas om direkt.</p><button className="danger-button" onClick={() => { onDeleteTransaction(deleting); setDeleting(null); }}><Icon name="trash" size={17} /> Ja, ta bort</button><button className="secondary-button" onClick={() => setDeleting(null)}>Avbryt</button></div></Modal>}

      {accountOpen && <Modal title="Nytt konto" onClose={() => setAccountOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); if (!accountName.trim()) return; onAddAccount(accountName.trim(), Number(accountStart) || 0); setAccountName(""); setAccountStart(""); setAccountOpen(false); }}><label>Kontonamn<input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="T.ex. Resekonto" autoFocus /></label><label>Öppningssaldo<input type="number" inputMode="decimal" value={accountStart} onChange={(event) => setAccountStart(event.target.value)} placeholder="0" /></label><button className="primary-button">Skapa konto</button></form></Modal>}
    </div>
  );
}
