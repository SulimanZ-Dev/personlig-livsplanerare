import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { daysBetween, localISO } from "../../core/dates/dateUtils";

function streakFor(habitId, checkIns) {
  const completed = checkIns.filter((item) => item.habitId === habitId && item.done).map((item) => item.date).sort().reverse();
  if (!completed.length) return { streak: 0, protected: false };
  let streak = 1;
  let cursor = completed[0];
  let protectedMiss = daysBetween(cursor, localISO()) === 1;
  for (let index = 1; index < completed.length; index += 1) {
    const gap = daysBetween(completed[index], cursor);
    if (gap === 1) streak += 1;
    else if (gap === 2) { streak += 1; protectedMiss = true; }
    else break;
    cursor = completed[index];
  }
  return { streak, protected: protectedMiss };
}

export function HabitsView({ data, onToggle, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const today = localISO();
  return (
    <div className="page">
      <header className="page-header row-between"><div><div className="eyebrow">NEVER ZERO</div><h1>Rutiner</h1><p>En miss är mänsklig. Två i rad bryter kedjan.</p></div><button className="icon-button accent" onClick={() => setOpen(true)}><Icon name="plus" /></button></header>
      <div className="habit-list">{data.habits.map((habit) => {
        const done = data.checkIns.some((item) => item.habitId === habit.id && item.date === today && item.done);
        const streak = streakFor(habit.id, data.checkIns);
        return <article className={`card habit-row ${done ? "completed" : ""}`} key={habit.id}><button className="habit-check" style={{ "--habit-color": habit.color }} onClick={() => onToggle(habit.id, today)}><Icon name="check" /></button><div><strong>{habit.name}</strong><small>{streak.protected ? "Skyddad miss · gör den idag" : "Daglig rutin"}</small></div><div className="streak"><Icon name="flame" size={17} /><b>{streak.streak}</b><small>dagar</small></div></article>;
      })}</div>
      <aside className="rule-card card"><Icon name="flame" /><div><strong>Two-miss-regeln</strong><p>Streaken överlever en missad dag. Missar du nästa också börjar en ny kedja.</p></div></aside>
      {open && <Modal title="Ny rutin" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={(event) => { event.preventDefault(); if (name.trim()) onAdd(name.trim()); setName(""); setOpen(false); }}><label>Namn<input value={name} onChange={(event) => setName(event.target.value)} placeholder="T.ex. promenad" autoFocus /></label><button className="primary-button">Lägg till rutin</button></form></Modal>}
    </div>
  );
}

