import { useRef, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { localISO } from "../../core/dates/dateUtils";
import { accountBalance, economyForecast, monthlySummary } from "./economyModel";

const id = (prefix) => `${prefix}-${crypto.randomUUID()}`;

export function EconomyPlanner({ state, onMutate }) {
  const economy = state.modules.economy;
  const accounts = Object.values(economy.accounts).filter((item) => !item.archived);
  const [budget, setBudget] = useState({ category: "Mat", limit: 2000 });
  const [recurring, setRecurring] = useState({ name: "", type: "withdrawal", amount: "", day: 25, accountId: accounts[0]?.id || "" });
  const [reconcile, setReconcile] = useState({ accountId: accounts[0]?.id || "", actual: "" });
  const [subscription, setSubscription] = useState({ name: "", amount: "", renewalDate: localISO(), bindingUntil: "" });
  const [horizon, setHorizon] = useState(90);
  const fileRef = useRef(null);
  const summary = monthlySummary(economy);
  const forecast = economyForecast(economy, horizon);
  const budgetSpent = (category) => economy.transactions.filter((item) => item.type === "withdrawal" && item.category === category && String(item.date).startsWith(localISO().slice(0, 7))).reduce((sum, item) => sum + Math.abs(Number(item.amount) || 0), 0);
  const addBudget = () => {
    if (!budget.category.trim() || Number(budget.limit) <= 0) return;
    const item = { id: id("budget"), category: budget.category.trim(), limit: Number(budget.limit), month: localISO().slice(0, 7) };
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, budgets: [...current.modules.economy.budgets.filter((entry) => !(entry.category === item.category && entry.month === item.month)), item] } } }), `Budget: ${item.category}`, `${item.limit} kr`);
  };
  const addRecurring = () => {
    if (!recurring.name.trim() || Number(recurring.amount) <= 0 || !recurring.accountId) return;
    const item = { ...recurring, id: id("recurring"), amount: Number(recurring.amount), day: Number(recurring.day), enabled: true, createdAt: new Date().toISOString() };
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, recurringTransactions: [...current.modules.economy.recurringTransactions, item] } } }), `Återkommande: ${item.name}`, `${item.amount} kr · dag ${item.day}`);
    setRecurring({ ...recurring, name: "", amount: "" });
  };
  const createMonthlyRules = () => {
    const monthly = economy.monthlyPlan;
    if (!monthly || !accounts.length) return;
    const rules = [
      { id: id("recurring"), name: "CSN", type: "deposit", amount: Number(monthly.income), day: 25, accountId: accounts[0].id, enabled: true, createdAt: new Date().toISOString() },
      { id: id("recurring"), name: "Automatiskt sparande", type: "transfer", amount: Number(monthly.guaranteedSavings), day: Number(monthly.autoTransferDay) || 25, accountId: accounts[0].id, toAccountId: monthly.autoTransferAccountId || accounts.at(-1).id, enabled: true, createdAt: new Date().toISOString() },
    ];
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, recurringTransactions: [...current.modules.economy.recurringTransactions.filter((item) => !["CSN", "Automatiskt sparande"].includes(item.name)), ...rules] } } }), "CSN och autospar planerade", `${monthly.income} kr in · ${monthly.guaranteedSavings} kr sparande`);
  };
  const reconcileAccount = () => {
    const expected = accountBalance(economy, reconcile.accountId);
    const actual = Number(reconcile.actual);
    if (!Number.isFinite(actual)) return;
    const difference = actual - expected;
    const entry = { id: id("reconciliation"), accountId: reconcile.accountId, expected, actual, difference, date: localISO(), createdAt: new Date().toISOString() };
    const transaction = { id: id("tx"), type: "adjustment", accountId: reconcile.accountId, amount: difference, note: "Avstämningsjustering", date: localISO(), occurredAt: new Date().toISOString(), affectsBalance: true };
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, reconciliations: [...current.modules.economy.reconciliations, entry], transactions: difference ? [...current.modules.economy.transactions, transaction] : current.modules.economy.transactions } } }), "Konto avstämt", difference ? `Justerat ${difference.toLocaleString("sv-SE")} kr` : "Saldot stämde");
    setReconcile({ ...reconcile, actual: "" });
  };
  const addSubscription = () => {
    if (!subscription.name.trim() || Number(subscription.amount) <= 0) return;
    const item = { ...subscription, id: id("subscription"), amount: Number(subscription.amount), active: true, createdAt: new Date().toISOString() };
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, subscriptions: [...current.modules.economy.subscriptions, item] } } }), `Prenumeration: ${item.name}`, `${item.amount} kr/månad`);
    setSubscription({ ...subscription, name: "", amount: "" });
  };
  const importCsv = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !accounts.length) return;
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
    const parsed = lines.slice(1).flatMap((line) => {
      const cells = line.split(/[;,]/).map((cell) => cell.replace(/^"|"$/g, "").trim());
      const date = cells.find((cell) => /^\d{4}-\d{2}-\d{2}$/.test(cell));
      const amountCell = cells.find((cell) => /^-?\d+[,.]?\d*$/.test(cell.replace(/\s/g, "")));
      const amount = Number(String(amountCell || "").replace(/\s/g, "").replace(",", "."));
      if (!date || !amount) return [];
      return [{ id: id("csv"), type: amount < 0 ? "withdrawal" : "deposit", amount: Math.abs(amount), accountId: accounts[0].id, date, note: cells.find((cell) => cell !== date && cell !== amountCell) || "CSV-import", category: "Import", occurredAt: `${date}T12:00:00`, affectsBalance: true, imported: true }];
    });
    onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: [...current.modules.economy.transactions, ...parsed] } } }), `${parsed.length} bankposter importerade`, file.name);
  };

  return <section className="economy-planner section"><div className="section-title"><span>MÅNADSKONTROLL</span><small>budget · prognos · återkommande</small></div><div className="economy-summary-grid"><article className="card"><span>INKOMSTER</span><strong>{summary.income.toLocaleString("sv-SE")} kr</strong></article><article className="card"><span>UTGIFTER</span><strong>{summary.expenses.toLocaleString("sv-SE")} kr</strong></article><article className="card"><span>SPARKVOT</span><strong className={summary.savingsRate < 0 ? "negative" : "positive"}>{summary.savingsRate.toFixed(0)}%</strong></article><article className="card"><span>ÅRSKOSTNAD PRENUM.</span><strong>{economy.subscriptions.filter((item) => item.active).reduce((sum, item) => sum + Number(item.amount) * 12, 0).toLocaleString("sv-SE")} kr</strong></article></div>
    <div className="economy-tool-grid"><article className="card studio-editor"><div className="section-title"><span>BUDGETKATEGORIER</span></div><div className="field-grid"><input value={budget.category} onChange={(event) => setBudget({ ...budget, category: event.target.value })} placeholder="Kategori" /><input type="number" min="1" value={budget.limit} onChange={(event) => setBudget({ ...budget, limit: event.target.value })} /></div><button className="secondary-button" onClick={addBudget}>Spara budget</button>{economy.budgets.filter((item) => item.month === localISO().slice(0, 7)).map((item) => { const spent = budgetSpent(item.category); return <div className="budget-row" key={item.id}><div><strong>{item.category}</strong><small>{spent.toLocaleString("sv-SE")} / {item.limit.toLocaleString("sv-SE")} kr</small></div><div><i style={{ width: `${Math.min(100, spent / item.limit * 100)}%` }} /></div></div>; })}</article>
      <article className="card studio-editor"><div className="section-title"><span>ÅTERKOMMANDE</span></div>{economy.monthlyPlan && <button className="secondary-button" onClick={createMonthlyRules}>Skapa CSN + autospar från månadsplanen</button>}<input value={recurring.name} onChange={(event) => setRecurring({ ...recurring, name: event.target.value })} placeholder="CSN, hyra, autospar…" /><div className="field-grid three"><select value={recurring.type} onChange={(event) => setRecurring({ ...recurring, type: event.target.value })}><option value="deposit">Inkomst</option><option value="withdrawal">Utgift</option><option value="transfer">Överföring</option></select><input type="number" min="1" value={recurring.amount} onChange={(event) => setRecurring({ ...recurring, amount: event.target.value })} placeholder="kr" /><input type="number" min="1" max="28" value={recurring.day} onChange={(event) => setRecurring({ ...recurring, day: event.target.value })} /></div><select value={recurring.accountId} onChange={(event) => setRecurring({ ...recurring, accountId: event.target.value })}>{accounts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select><button className="secondary-button" onClick={addRecurring}>Lägg till regel</button><div className="mini-list">{economy.recurringTransactions.map((item) => <div key={item.id}><strong>{item.name}</strong><small>{item.amount} kr · dag {item.day}</small><button onClick={() => onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, recurringTransactions: current.modules.economy.recurringTransactions.map((entry) => entry.id === item.id ? { ...entry, enabled: !entry.enabled } : entry) } } }), "Återkommande regel uppdaterad", item.name)}>{item.enabled ? "På" : "Av"}</button></div>)}</div></article>
      <article className="card studio-editor"><div className="section-title"><span>AVSTÄMNING</span></div><select value={reconcile.accountId} onChange={(event) => setReconcile({ ...reconcile, accountId: event.target.value })}>{accounts.map((item) => <option value={item.id} key={item.id}>{item.name} · {accountBalance(economy, item.id).toLocaleString("sv-SE")} kr</option>)}</select><label>Verkligt banksaldo<input type="number" step=".01" value={reconcile.actual} onChange={(event) => setReconcile({ ...reconcile, actual: event.target.value })} /></label><button className="secondary-button" onClick={reconcileAccount}>Stäm av och justera</button><small>Senast: {economy.reconciliations.at(-1)?.date || "aldrig"}</small></article>
      <article className="card studio-editor"><div className="section-title"><span>PRENUMERATIONER</span></div><input value={subscription.name} onChange={(event) => setSubscription({ ...subscription, name: event.target.value })} placeholder="Tjänst" /><div className="field-grid"><input type="number" min="1" value={subscription.amount} onChange={(event) => setSubscription({ ...subscription, amount: event.target.value })} placeholder="kr/mån" /><input type="date" value={subscription.renewalDate} onChange={(event) => setSubscription({ ...subscription, renewalDate: event.target.value })} /></div><button className="secondary-button" onClick={addSubscription}>Lägg till</button><div className="mini-list">{economy.subscriptions.map((item) => <div key={item.id}><strong>{item.name}</strong><small>{item.amount} kr · nästa {item.renewalDate}</small><button onClick={() => onMutate((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, subscriptions: current.modules.economy.subscriptions.map((entry) => entry.id === item.id ? { ...entry, active: false, cancelledAt: new Date().toISOString() } : entry) } } }), `Uppsagd: ${item.name}`, "Prenumerationen finns kvar i historiken")}>{item.active ? "Säg upp" : "Uppsagd"}</button></div>)}</div></article></div>
    <article className="card forecast-card"><div className="row-between"><div><span className="eyebrow">PROGNOS</span><strong>{forecast.closing.toLocaleString("sv-SE")} kr</strong><small>beräknat saldo från {forecast.opening.toLocaleString("sv-SE")} kr</small></div><div className="segmented">{[30, 90, 365].map((days) => <button className={horizon === days ? "active" : ""} key={days} onClick={() => setHorizon(days)}>{days}d</button>)}</div></div><div className="forecast-strip">{forecast.rows.slice(0, 8).map((item) => <span key={`${item.id}-${item.projectedDate}`}><small>{item.projectedDate.slice(5)}</small><strong className={item.signedAmount < 0 ? "negative" : "positive"}>{item.signedAmount > 0 ? "+" : ""}{item.signedAmount} kr</strong><em>{item.name}</em></span>)}</div></article>
    <button className="card csv-import" onClick={() => fileRef.current?.click()}><Icon name="upload" /><span><strong>Importera CSV från banken</strong><small>Datum och belopp identifieras lokalt. Kontrollera posterna efter import.</small></span></button><input className="visually-hidden" ref={fileRef} type="file" accept=".csv,text/csv" onChange={importCsv} />
  </section>;
}
