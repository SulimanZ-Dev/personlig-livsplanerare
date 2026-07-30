import { useState } from "react";
import { Modal } from "../../components/ui/Modal";
import { Icon } from "../../components/ui/Icon";
import { formatShortDate, localISO } from "../../core/dates/dateUtils";

const money = (value) => new Intl.NumberFormat("sv-SE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value) + " kr";

export function EconomyView({ data, onTransaction }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ accountId: "savings", amount: "", note: "" });
  const accounts = Object.values(data.accounts);
  const total = accounts.reduce((sum, account) => sum + account.balance, 0);
  const next = data.milestones.find((item) => item.target > total);

  const submit = (event) => {
    event.preventDefault();
    const amount = Number(String(form.amount).replace(",", "."));
    if (!amount) return;
    onTransaction({ id: `tx-${crypto.randomUUID()}`, ...form, amount, date: localISO() });
    setForm({ accountId: "savings", amount: "", note: "" });
    setOpen(false);
  };

  return (
    <div className="page">
      <header className="page-header"><div className="eyebrow">EKONOMI · NETTOVÄRDE</div><h1 className="money-hero">{money(total)}</h1><p>{next ? `${money(next.target - total)} kvar till ${next.label}` : "Slutmålet är nått"}</p><div className="progress"><i style={{ width: `${Math.min(100, total / data.milestones.at(-1).target * 100)}%` }} /></div></header>
      <div className="account-grid">{accounts.map((account) => <article className="card account-card" key={account.id}><span className="status-dot" style={{ background: account.color }} /> <small>{account.name}</small><strong>{money(account.balance)}</strong></article>)}</div>
      <button className="primary-button" onClick={() => setOpen(true)}><Icon name="plus" size={18} /> Uppdatera saldo</button>
      <section className="section"><div className="section-title"><span>TIDSLINJE</span><small>mot april 2027</small></div><div className="timeline">{data.milestones.map((item) => <div className={total >= item.target ? "reached" : ""} key={item.id}><i /><span>{item.label}</span><strong>{money(item.target)}</strong>{item.note && <small>{item.note}</small>}</div>)}</div></section>
      <section className="section"><div className="section-title"><span>HISTORIK</span></div><div className="history-list">{data.transactions.slice().reverse().slice(0, 12).map((tx) => <div className="history-row" key={tx.id}><span className="mono">{formatShortDate(tx.date)}</span><div><strong>{tx.note || data.accounts[tx.accountId]?.name}</strong><small>{data.accounts[tx.accountId]?.name}</small></div><b className={tx.amount >= 0 ? "positive" : "negative"}>{tx.amount > 0 ? "+" : ""}{money(tx.amount)}</b></div>)}</div></section>
      {open && <Modal title="Uppdatera saldo" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}><label>Konto<select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>Belopp<input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="+2000 eller -500" /></label><label>Anteckning<input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Vad hände?" /></label><button className="primary-button">Spara transaktion</button></form></Modal>}
    </div>
  );
}

