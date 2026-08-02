import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { daysBetween, isThisWeek, localISO } from "../../core/dates/dateUtils";

const WEEKDAYS = [[1, "M"], [2, "T"], [3, "O"], [4, "T"], [5, "F"], [6, "L"], [0, "S"]];
const shiftDate = (amount) => { const date = new Date(); date.setDate(date.getDate() + amount); return localISO(date); };

export function habitMomentum(habit, checkIns) {
  if (habit.paused) return { streak: 0, protected: true, paused: true };
  const completed = [...new Set(checkIns.filter((item) => item.habitId === habit.id && item.done).map((item) => item.date))].sort().reverse();
  if (habit.frequency === "weekly_target") {
    const thisWeek = completed.filter((date) => isThisWeek(`${date}T12:00:00`)).length;
    return { streak: thisWeek, target: habit.targetPerWeek || 1, protected: false, weekly: true };
  }
  if (!completed.length) return { streak: 0, protected: false };
  const gapFromToday = daysBetween(completed[0], localISO());
  if (gapFromToday >= 2) return { streak: 0, protected: false };
  let streak = 1, cursor = completed[0];
  for (let index = 1; index < completed.length; index += 1) {
    const gap = daysBetween(completed[index], cursor);
    if (gap <= 2) streak += 1;
    else break;
    cursor = completed[index];
  }
  return { streak, protected: gapFromToday === 1, weekly: false };
}

function HabitHeatmap({ habit, checkIns }) {
  const values = useMemo(() => Array.from({ length: 56 }, (_, index) => {
    const date = shiftDate(index - 55);
    const check = checkIns.find((item) => item.habitId === habit.id && item.date === date);
    return { date, level: check?.level || (check?.done ? "full" : "none") };
  }), [habit.id, checkIns]);
  return <div className="habit-heatmap" aria-label={`Aktivitet för ${habit.name} senaste åtta veckorna`}>{values.map((item) => <i key={item.date} className={item.level} title={`${item.date}: ${item.level}`} />)}</div>;
}

const blankHabit = { name: "", frequency: "daily", targetPerWeek: 4, minimumVersion: "", fullVersion: "", weekdays: [1, 2, 3, 4, 5, 6, 0], group: "morning", color: "#3ddc84" };

export function HabitsView({ data, onToggle, onSave, onDelete }) {
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(blankHabit);
  const today = localISO();
  const openEditor = (habit = null) => { setEditor(habit || "new"); setForm(habit ? { ...blankHabit, ...habit } : blankHabit); };
  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const existing = editor !== "new" ? editor : null;
    onSave({ ...(existing || {}), ...form, id: existing?.id || `habit-${crypto.randomUUID()}`, name: form.name.trim(), createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }, Boolean(existing));
    setEditor(null);
  };
  const missedTogether = useMemo(() => {
    const counts = new Map();
    for (let offset = -30; offset <= 0; offset += 1) {
      const date = shiftDate(offset);
      const missed = data.habits.filter((habit) => !habit.paused && (habit.weekdays || [0, 1, 2, 3, 4, 5, 6]).includes(new Date(`${date}T12:00:00`).getDay()) && !data.checkIns.some((entry) => entry.habitId === habit.id && entry.date === date && entry.done));
      for (let a = 0; a < missed.length; a += 1) for (let b = a + 1; b < missed.length; b += 1) { const key = [missed[a].name, missed[b].name].sort().join(" + "); counts.set(key, (counts.get(key) || 0) + 1); }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [data.habits, data.checkIns]);

  return <div className="page">
    <header className="page-header row-between"><div><div className="eyebrow">NEVER ZERO</div><h1>Rutiner</h1><p>Full när du kan, floor när du måste. En miss är data — två missar kräver handling.</p></div><button aria-label="Skapa rutin" className="icon-button accent" onClick={() => openEditor()}><Icon name="plus" /></button></header>
    {[["morning", "MORGON"], ["evening", "KVÄLL"], ["other", "ÖVRIGT"]].map(([group, label]) => { const habits = data.habits.filter((item) => (item.group || "other") === group); return habits.length ? <section className="section" key={group}><div className="section-title"><span>{label}</span><small>{habits.length} rutiner</small></div><div className="habit-list">{habits.map((habit) => {
      const check = data.checkIns.find((item) => item.habitId === habit.id && item.date === today);
      const momentum = habitMomentum(habit, data.checkIns);
      const scheduled = (habit.weekdays || [0, 1, 2, 3, 4, 5, 6]).includes(new Date().getDay());
      return <article className={`card habit-row rich ${check?.done ? "completed" : ""} ${habit.paused ? "paused" : ""}`} key={habit.id}><div className="habit-status-actions"><button className={check?.level === "full" ? "active full" : ""} onClick={() => onToggle(habit.id, today, "full")}>FULL</button><button className={check?.level === "floor" ? "active floor" : ""} onClick={() => onToggle(habit.id, today, "floor")}>FLOOR</button><button className={check?.level === "missed" ? "active missed" : ""} onClick={() => onToggle(habit.id, today, "missed")}>MISS</button></div><div className="habit-main"><div className="row-between"><div><strong>{habit.name}</strong><small>{habit.paused ? "Pausad · streak skyddad" : !scheduled ? "Inte schemalagd idag" : check?.level === "full" ? habit.fullVersion || "Full version klar" : check?.level === "floor" ? habit.minimumVersion || "Floor klar" : momentum.protected ? `Skyddad miss · gör ${habit.minimumVersion || "två minuter"}` : habit.minimumVersion ? `Floor: ${habit.minimumVersion}` : "Välj dagens nivå"}</small></div><div className="streak"><Icon name="flame" size={17} /><b>{momentum.streak}{momentum.weekly ? `/${momentum.target}` : ""}</b></div></div><HabitHeatmap habit={habit} checkIns={data.checkIns} /></div><div className="habit-manage"><button aria-label={`Redigera ${habit.name}`} onClick={() => openEditor(habit)}><Icon name="edit" size={14} /></button><button aria-label={`${habit.paused ? "Återuppta" : "Pausa"} ${habit.name}`} onClick={() => onSave({ ...habit, paused: !habit.paused, pausedAt: habit.paused ? null : new Date().toISOString() }, true)}><Icon name="shield" size={14} /></button><button aria-label={`Ta bort ${habit.name}`} onClick={() => onDelete(habit)}><Icon name="trash" size={14} /></button></div></article>;
    })}</div></section> : null; })}
    {!data.habits.length && <div className="empty-state alive"><Icon name="flame" size={30} /><strong>Inga rutiner ännu.</strong><span>Skapa morgon-, kvälls- eller veckovanor med en realistisk floor.</span><button className="primary-button" onClick={() => openEditor()}>Skapa rutin</button></div>}
    <aside className="rule-card card"><Icon name="flame" /><div><strong>Two-miss-regeln</strong><p>En missad dag blir en varning, inte ett nederlag. Två missar i rad skapar en floor-uppgift. Pausade dagar räknas inte.</p></div></aside>
    {missedTogether.length > 0 && <aside className="card habit-correlations"><span className="eyebrow">VANOR SOM OFTA MISSAS TILLSAMMANS</span>{missedTogether.map(([pair, count]) => <div key={pair}><strong>{pair}</strong><small>{count} gemensamma missar senaste 30 dagarna</small></div>)}</aside>}
    {editor && <Modal title={editor === "new" ? "Ny rutin" : "Redigera rutin"} onClose={() => setEditor(null)}><form className="form-stack" onSubmit={submit}><label>Namn<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="T.ex. Sauna" autoFocus /></label><div className="field-grid"><label>Full version<input value={form.fullVersion} onChange={(event) => setForm({ ...form, fullVersion: event.target.value })} placeholder="90 minuter" /></label><label>Floor<input value={form.minimumVersion} onChange={(event) => setForm({ ...form, minimumVersion: event.target.value })} placeholder="10 minuter" /></label></div><div className="field-grid"><label>Frekvens<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="daily">Valda veckodagar</option><option value="weekly_target">Antal per vecka</option></select></label><label>Grupp<select value={form.group} onChange={(event) => setForm({ ...form, group: event.target.value })}><option value="morning">Morgon</option><option value="evening">Kväll</option><option value="other">Övrigt</option></select></label></div>{form.frequency === "weekly_target" ? <label>Gånger per vecka<input type="number" min="1" max="7" value={form.targetPerWeek} onChange={(event) => setForm({ ...form, targetPerWeek: Number(event.target.value) })} /></label> : <div><span className="field-label">Veckodagar</span><div className="weekday-picker">{WEEKDAYS.map(([day, label]) => <button type="button" className={form.weekdays.includes(day) ? "active" : ""} key={day} onClick={() => setForm({ ...form, weekdays: form.weekdays.includes(day) ? form.weekdays.filter((item) => item !== day) : [...form.weekdays, day] })}>{label}</button>)}</div></div>}<label>Färg<input type="color" value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} /></label><button className="primary-button">{editor === "new" ? "Lägg till rutin" : "Spara rutin"}</button></form></Modal>}
  </div>;
}
