import { useState } from "react";
import { GoalWidget } from "../../components/goals/GoalWidget";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { localISO } from "../../core/dates/dateUtils";
import { accountBalance, economyTotal, transactionTouchesAccount } from "./economyModel";

const money = (value) => new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + " kr";
const transactionLabels = { deposit: "Insättning", withdrawal: "Uttag", transfer: "Överföring" };
const emptyForm = (accounts) => ({ type: "deposit", accountId: accounts[0]?.id || "", fromAccountId: accounts[0]?.id || "", toAccountId: accounts[1]?.id || accounts[0]?.id || "", amount: "", note: "", date: localISO() });
const emptyAccountForm = { name: "", openingBalance: "", color: "#3ddc84" };

export function EconomyView({ state, onUpsertTransaction, onDeleteTransaction, onSaveAccount, onDeleteAccount, onCreateGoal, onOpenGoal }) {
  const data = state.modules.economy;
  const accounts = Object.values(data.accounts).filter((account) => !account.archived);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(() => emptyForm(accounts));
  const [deleting, setDeleting] = useState(null);
  const [accountEditor, setAccountEditor] = useState(null);
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [accountDeleting, setAccountDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const total = economyTotal(data);
  const economyGoals = Object.values(state.goals).filter((goal) => goal.moduleId === "economy" && goal.status !== "archived");

  const openAccountEditor = (account = null) => {
    setAccountEditor(account || "new");
    setAccountForm(account ? { name: account.name, openingBalance: String(account.openingBalance || 0), color: account.color || "#3ddc84" } : emptyAccountForm);
  };

  const submitAccount = (event) => {
    event.preventDefault();
    if (!accountForm.name.trim()) return;
    const existing = accountEditor !== "new" ? accountEditor : null;
    onSaveAccount({
      ...(existing || {}),
      id: existing?.id || `account-${crypto.randomUUID()}`,
      name: accountForm.name.trim(),
      openingBalance: Number(accountForm.openingBalance) || 0,
      color: accountForm.color,
      archived: false,
    }, Boolean(existing));
    setAccountEditor(null);
    setAccountForm(emptyAccountForm);
  };

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
        <div className="row-between"><div><div className="eyebrow">EKONOMI · TOTALT</div><h1 className="money-hero">{money(total)}</h1></div><button aria-label={accounts.length ? "Ny transaktion" : "Nytt konto"} className="icon-button accent" onClick={() => accounts.length ? openEditor() : openAccountEditor()}><Icon name="plus" /></button></div>
        <p>Summan räknas om från hela transaktionslistan — redigeringar och borttagningar slår igenom direkt.</p>
      </header>

      {data.monthlyPlan && <section className="monthly-plan card"><div><span>CSN / MÅNAD</span><strong>{money(data.monthlyPlan.income)}</strong></div><div><span>FASTA</span><strong>{money(data.monthlyPlan.fixedExpenses)}</strong></div><div className="accent"><span>AUTOSPAR</span><strong>{money(data.monthlyPlan.guaranteedSavings)}</strong></div><div><span>FLEX</span><strong>{money(data.monthlyPlan.flex)}</strong></div><p>Transfer dag {data.monthlyPlan.autoTransferDay} → {data.accounts[data.monthlyPlan.autoTransferAccountId]?.name}</p></section>}

      <div className="account-scroll">
        {accounts.map((account) => {
          const balance = accountBalance(data, account.id);
          return <article className="card account-live-card" key={account.id} style={{ "--account-color": account.color }}><div className="account-card-top"><span><i className="status-dot" /><small>{account.name}</small></span><span className="account-card-actions"><button aria-label={`Redigera konto ${account.name}`} onClick={() => openAccountEditor(account)}><Icon name="edit" size={13} /></button><button aria-label={`Ta bort konto ${account.name}`} onClick={() => setAccountDeleting(account)}><Icon name="trash" size={13} /></button></span></div><strong className={balance < 0 ? "negative" : ""}>{money(balance)}</strong><span>{data.transactions.filter((transaction) => transactionTouchesAccount(transaction, account.id)).length} händelser</span></article>;
        })}
        <button className="card add-account-card" onClick={() => openAccountEditor()}><Icon name="plus" /><span>Nytt konto</span></button>
      </div>

      <div className="economy-actions">
        <button className="primary-button" disabled={!accounts.length} onClick={() => openEditor()}><Icon name="swap" size={18} /> {accounts.length ? "Ny transaktion" : "Skapa konto först"}</button>
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
        <div className="transaction-types">{[["deposit", "arrowDown", "Insättning"], ["withdrawal", "arrowUp", "Uttag"], ["transfer", "swap", "Flytta"]].map(([type, icon, label]) => <button type="button" disabled={type === "transfer" && accounts.length < 2} className={form.type === type ? "active" : ""} key={type} onClick={() => setForm({ ...form, type })}><Icon name={icon} size={17} /><span>{label}</span></button>)}</div>
        {form.type === "transfer" ? <div className="field-grid"><label>Från<select value={form.fromAccountId} onChange={(event) => setForm({ ...form, fromAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label><label>Till<select value={form.toAccountId} onChange={(event) => setForm({ ...form, toAccountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label></div> : <label>Konto<select value={form.accountId} onChange={(event) => setForm({ ...form, accountId: event.target.value })}>{accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}</select></label>}
        <div className="field-grid"><label>Belopp<input type="number" min="0.01" step="0.01" inputMode="decimal" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="0" autoFocus /></label><label>Datum<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label></div>
        <label>Anteckning<input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="Vad var detta?" /></label>
        <button className={`primary-button ${form.type === "withdrawal" ? "withdraw-button" : ""}`}>{editor === "new" ? transactionLabels[form.type] : "Spara ändringar"}</button>
      </form></Modal>}

      {deleting && <Modal title="Ta bort transaktion?" onClose={() => setDeleting(null)}><div className="confirm-stack"><p><strong>{deleting.note || transactionLabels[deleting.type]}</strong> på {money(deleting.amount)} tas bort. Saldot räknas om direkt.</p><button className="danger-button" onClick={() => { onDeleteTransaction(deleting); setDeleting(null); }}><Icon name="trash" size={17} /> Ja, ta bort</button><button className="secondary-button" onClick={() => setDeleting(null)}>Avbryt</button></div></Modal>}

      {accountEditor && <Modal title={accountEditor === "new" ? "Nytt konto" : "Redigera konto"} onClose={() => setAccountEditor(null)}><form className="form-stack" onSubmit={submitAccount}><label>Kontonamn<input value={accountForm.name} onChange={(event) => setAccountForm({ ...accountForm, name: event.target.value })} placeholder="T.ex. Resekonto" autoFocus /></label><label>Öppningssaldo<input type="number" step="0.01" inputMode="decimal" value={accountForm.openingBalance} onChange={(event) => setAccountForm({ ...accountForm, openingBalance: event.target.value })} placeholder="0" /></label>{accountEditor !== "new" && <p className="account-balance-note">Öppningssaldot är basen före alla transaktioner. En ändring räknar om totalsumman direkt.</p>}<label>Färg<input type="color" value={accountForm.color} onChange={(event) => setAccountForm({ ...accountForm, color: event.target.value })} /></label><button className="primary-button">{accountEditor === "new" ? "Skapa konto" : "Spara konto"}</button></form></Modal>}

      {accountDeleting && (() => {
        const linkedTransactions = data.transactions.filter((transaction) => transactionTouchesAccount(transaction, accountDeleting.id));
        const linkedGoals = Object.values(state.goals).filter((goal) => goal.source === "economy_account" && goal.sourceId === accountDeleting.id);
        return <Modal title="Ta bort konto?" onClose={() => setAccountDeleting(null)}><div className="confirm-stack account-delete-confirm"><p><strong>{accountDeleting.name}</strong> tas bort permanent från kontolistan.</p><ul><li>{linkedTransactions.length} transaktioner som berör kontot tas bort</li><li>{linkedGoals.length} kopplade mål behålls och växlar till manuell uppdatering</li><li>Totalsaldot räknas om direkt</li></ul><p className="undo-note">Du kan ångra hela operationen direkt efteråt.</p><button className="danger-button" onClick={() => { onDeleteAccount(accountDeleting); setAccountDeleting(null); }}><Icon name="trash" size={17} /> Ta bort konto</button><button className="secondary-button" onClick={() => setAccountDeleting(null)}>Avbryt</button></div></Modal>;
      })()}
    </div>
  );
}
