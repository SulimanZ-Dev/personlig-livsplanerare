import { useMemo, useState } from "react";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { localISO } from "../../core/dates/dateUtils";

const TYPES = [
  ["nutrition", "nutrition", "Mat"], ["weight", "scale", "Vikt"], ["gym", "dumbbell", "Gym"],
  ["habit", "check", "Vana"], ["study", "book", "Studier"], ["economy", "wallet", "Transaktion"],
];
const initialForms = () => ({
  nutrition: { name: "", calories: "", protein: "", carbs: "", fat: "", kind: "meal", date: localISO() },
  weight: { value: "", date: localISO(), note: "" },
  gym: { type: "Push", exercise: "", weight: "", reps: 8, sets: 3, date: localISO() },
  habit: { habitId: "", level: "full", date: localISO() },
  study: { subject: "", durationMinutes: 30, project: "", date: localISO() },
  economy: { type: "withdrawal", amount: "", accountId: "", toAccountId: "", date: localISO(), note: "" },
});

export function QuickCaptureModal({ state, initialType = "nutrition", onClose, onCapture, onToggleFavorite }) {
  const [type, setType] = useState(initialType);
  const [forms, setForms] = useState(initialForms);
  const form = forms[type];
  const patch = (values) => setForms((current) => ({ ...current, [type]: { ...current[type], ...values } }));
  const accounts = Object.values(state.modules.economy.accounts).filter((account) => !account.archived);
  const choices = useMemo(() => [...(state.favorites || []).map((item) => ({ ...item, favorite: true })), ...(state.recentCaptures || []).filter((item) => !(state.favorites || []).some((favorite) => favorite.key === item.key))].slice(0, 10), [state.favorites, state.recentCaptures]);
  const choose = (item) => {
    setType(item.type);
    setForms((current) => ({ ...current, [item.type]: { ...current[item.type], ...item.payload, date: localISO() } }));
  };
  const submit = (event) => {
    event.preventDefault();
    onCapture(type, form);
    onClose();
  };
  return <Modal title="Snabblogga" onClose={onClose} wide><div className="quick-capture">
    {choices.length > 0 && <section className="capture-recents"><span className="eyebrow">FAVORITER & SENASTE</span><div>{choices.map((item) => <span className="capture-choice" key={`${item.favorite ? "fav" : "recent"}-${item.key}`}><button onClick={() => choose(item)}><Icon name={TYPES.find(([id]) => id === item.type)?.[1] || "plus"} size={14} />{item.label}</button><button className={item.favorite ? "favorite active" : "favorite"} aria-label={`${item.favorite ? "Ta bort favorit" : "Favoritmarkera"} ${item.label}`} onClick={() => onToggleFavorite(item)}>{item.favorite ? "★" : "☆"}</button></span>)}</div></section>}
    <nav className="capture-types" aria-label="Vad vill du logga?">{TYPES.map(([id, icon, label]) => <button className={type === id ? "active" : ""} key={id} onClick={() => setType(id)}><Icon name={icon} size={18} /><span>{label}</span></button>)}</nav>
    <form className="form-stack capture-form" onSubmit={submit}>
      {type === "nutrition" && <><label>Mat, dryck eller tillskott<input autoFocus required value={form.name} onChange={(event) => patch({ name: event.target.value })} placeholder="T.ex. kyckling och ris" /></label><div className="segmented">{[["meal", "Mat"], ["drink", "Dryck"], ["supplement", "Tillskott"]].map(([id, label]) => <button type="button" className={form.kind === id ? "active" : ""} key={id} onClick={() => patch({ kind: id })}>{label}</button>)}</div><div className="field-grid four"><label>kcal<input required type="number" min="0" value={form.calories} onChange={(event) => patch({ calories: event.target.value })} /></label><label>Protein<input type="number" min="0" step="0.1" value={form.protein} onChange={(event) => patch({ protein: event.target.value })} /></label><label>Kolh.<input type="number" min="0" step="0.1" value={form.carbs} onChange={(event) => patch({ carbs: event.target.value })} /></label><label>Fett<input type="number" min="0" step="0.1" value={form.fat} onChange={(event) => patch({ fat: event.target.value })} /></label></div></>}
      {type === "weight" && <><label>Vikt i kg<input autoFocus required type="number" min="20" max="400" step="0.1" inputMode="decimal" value={form.value} onChange={(event) => patch({ value: event.target.value })} /></label><label>Anteckning<input value={form.note} onChange={(event) => patch({ note: event.target.value })} placeholder="Valfritt" /></label></>}
      {type === "gym" && <><div className="field-grid"><label>Pass<select value={form.type} onChange={(event) => patch({ type: event.target.value })}>{["Push", "Pull", "Legs", "Upper", "Full Body", "Cardio", "Eget"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Övning<input autoFocus required list="quick-exercises" value={form.exercise} onChange={(event) => patch({ exercise: event.target.value })} /></label></div><datalist id="quick-exercises">{state.modules.gym.exerciseCatalog.map((item) => <option value={item} key={item} />)}</datalist><div className="field-grid three"><label>Kg<input type="number" min="0" step="0.5" value={form.weight} onChange={(event) => patch({ weight: event.target.value })} /></label><label>Reps<input type="number" min="1" value={form.reps} onChange={(event) => patch({ reps: event.target.value })} /></label><label>Set<input type="number" min="1" value={form.sets} onChange={(event) => patch({ sets: event.target.value })} /></label></div></>}
      {type === "habit" && <><label>Rutin<select autoFocus required value={form.habitId} onChange={(event) => patch({ habitId: event.target.value })}><option value="">Välj rutin</option>{state.modules.habits.habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.name}</option>)}</select></label><div className="segmented">{[["full", "Full"], ["floor", "Floor"], ["missed", "Missad"]].map(([id, label]) => <button type="button" className={form.level === id ? "active" : ""} key={id} onClick={() => patch({ level: id })}>{label}</button>)}</div></>}
      {type === "study" && <><label>Ämne<input autoFocus required value={form.subject} onChange={(event) => patch({ subject: event.target.value })} placeholder="T.ex. AZ-900" /></label><div className="field-grid"><label>Minuter<input type="number" min="1" value={form.durationMinutes} onChange={(event) => patch({ durationMinutes: event.target.value })} /></label><label>Projekt<input value={form.project} onChange={(event) => patch({ project: event.target.value })} placeholder="Valfritt" /></label></div></>}
      {type === "economy" && <><div className="segmented">{[["deposit", "Insättning"], ["withdrawal", "Uttag"], ["transfer", "Flytt"]].map(([id, label]) => <button type="button" className={form.type === id ? "active" : ""} key={id} onClick={() => patch({ type: id })}>{label}</button>)}</div><div className="field-grid"><label>Belopp<input autoFocus required type="number" min="0.01" step="0.01" value={form.amount} onChange={(event) => patch({ amount: event.target.value })} /></label><label>{form.type === "transfer" ? "Från konto" : "Konto"}<select required value={form.accountId} onChange={(event) => patch({ accountId: event.target.value })}><option value="">Välj</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div>{form.type === "transfer" && <label>Till konto<select required value={form.toAccountId} onChange={(event) => patch({ toAccountId: event.target.value })}><option value="">Välj</option>{accounts.filter((account) => account.id !== form.accountId).map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>}<label>Anteckning<input value={form.note} onChange={(event) => patch({ note: event.target.value })} /></label></>}
      <label>Datum<input type="date" value={form.date} onChange={(event) => patch({ date: event.target.value })} /></label><button className="primary-button">Logga direkt</button>
    </form>
  </div></Modal>;
}
