import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { daysBetween, isThisWeek, localISO } from "../../core/dates/dateUtils";

export function habitMomentum(habit, checkIns) {
  const completed = [...new Set(checkIns.filter((item) => item.habitId === habit.id && item.done).map((item) => item.date))].sort().reverse();
  if (habit.frequency === "weekly_target") {
    const thisWeek = completed.filter((date) => isThisWeek(`${date}T12:00:00`)).length;
    return { streak: thisWeek, target: habit.targetPerWeek || 1, protected: false, weekly: true };
  }
  if (!completed.length) return { streak: 0, protected: false };
  const gapFromToday = daysBetween(completed[0], localISO());
  if (gapFromToday >= 2) return { streak: 0, protected: false };

  let streak = 1;
  let cursor = completed[0];
  let protectedMiss = gapFromToday === 1;
  for (let index = 1; index < completed.length; index += 1) {
    const gap = daysBetween(completed[index], cursor);
    if (gap === 1) streak += 1;
    else if (gap === 2) streak += 1;
    else break;
    cursor = completed[index];
  }
  return { streak, protected: protectedMiss, weekly: false };
}

export function HabitsView({ data, onToggle, onAdd }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", frequency: "daily", targetPerWeek: 4, minimumVersion: "" });
  const today = localISO();
  return (
    <div className="page">
      <header className="page-header row-between"><div><div className="eyebrow">NEVER ZERO</div><h1>Rutiner</h1><p>Gör den riktiga versionen när du kan. Minsta versionen när du måste.</p></div><button aria-label="Skapa rutin" className="icon-button accent" onClick={() => setOpen(true)}><Icon name="plus" /></button></header>
      <div className="habit-list">{data.habits.map((habit) => {
        const done = data.checkIns.some((item) => item.habitId === habit.id && item.date === today && item.done);
        const momentum = habitMomentum(habit, data.checkIns);
        return <article className={`card habit-row ${done ? "completed" : ""}`} key={habit.id}><button aria-label={`${done ? "Avmarkera" : "Markera"} ${habit.name} idag`} className="habit-check" style={{ "--habit-color": habit.color }} onClick={() => onToggle(habit.id, today)}><Icon name="check" /></button><div><strong>{habit.name}</strong><small>{done ? "Klart idag" : momentum.protected ? `Skyddad miss · minsta version: ${habit.minimumVersion || "två minuter"}` : habit.minimumVersion ? `Minsta version: ${habit.minimumVersion}` : habit.frequency === "weekly_target" ? `${habit.targetPerWeek} gånger per vecka` : "Daglig rutin"}</small></div><div className="streak"><Icon name="flame" size={17} /><b>{momentum.streak}{momentum.weekly ? `/${momentum.target}` : ""}</b><small>{momentum.weekly ? "denna vecka" : "dagar"}</small></div></article>;
      })}</div>
      {!data.habits.length && <div className="empty-state alive"><Icon name="flame" size={30} /><strong>Inga rutiner ännu.</strong><span>Skapa en daglig vana eller ett veckomål, som sauna fyra gånger i veckan.</span><button className="primary-button" onClick={() => setOpen(true)}>Skapa rutin</button></div>}
      <aside className="rule-card card"><Icon name="flame" /><div><strong>Two-miss-regeln</strong><p>En missad dag blir en varning, inte ett nederlag. Två missar i rad bryter kedjan. Då börjar du om utan skuld.</p></div></aside>
      {open && <Modal title="Ny rutin" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); if (!form.name.trim()) return; onAdd({ ...form, name: form.name.trim() }); setForm({ name: "", frequency: "daily", targetPerWeek: 4, minimumVersion: "" }); setOpen(false); }}><label>Namn<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="T.ex. Sauna" autoFocus /></label><label>Frekvens<select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })}><option value="daily">Varje dag</option><option value="weekly_target">Ett antal per vecka</option></select></label>{form.frequency === "weekly_target" && <label>Gånger per vecka<input type="number" min="1" max="7" value={form.targetPerWeek} onChange={(event) => setForm({ ...form, targetPerWeek: Number(event.target.value) })} /></label>}<label>Minsta godkända version<input value={form.minimumVersion} onChange={(event) => setForm({ ...form, minimumVersion: event.target.value })} placeholder="T.ex. 5 minuter eller 1 sida" /></label><button className="primary-button">Lägg till rutin</button></form></Modal>}
    </div>
  );
}
