import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { localISO } from "../../core/dates/dateUtils";
import { macroCalories, nutritionTargets, nutritionTotals, recentNutritionChoices } from "./nutritionModel";

const mealLabels = { breakfast: "Frukost", lunch: "Lunch", dinner: "Middag", snack: "Mellanmål", other: "Övrigt", supplement: "Kosttillskott" };
const EMPTY_ENTRIES = [];
const nowTime = () => new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
const shiftDate = (date, days) => {
  const next = new Date(`${date}T12:00:00`);
  next.setDate(next.getDate() + days);
  return localISO(next);
};
const dayLabel = (date) => date === localISO() ? "Idag" : new Date(`${date}T12:00:00`).toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
const emptyEntry = (date) => ({ kind: "food", mealType: "breakfast", name: "", serving: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", dose: "", notes: "", date, time: nowTime() });

const numberValue = (value) => Math.max(0, Number(String(value).replace(",", ".")) || 0);

export function NutritionDiary({ nutrition, onSave, onDelete, onCompleteDay }) {
  const [selectedDate, setSelectedDate] = useState(localISO());
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(() => emptyEntry(localISO()));
  const [deleting, setDeleting] = useState(null);
  const [query, setQuery] = useState("");
  const entries = nutrition.intakeLogs || EMPTY_ENTRIES;
  const targets = useMemo(() => nutritionTargets(nutrition), [nutrition]);
  const totals = useMemo(() => nutritionTotals(entries, selectedDate), [entries, selectedDate]);
  const recent = useMemo(() => recentNutritionChoices(entries), [entries]);
  const todaySupplements = new Set(entries.filter((entry) => entry.date === selectedDate && entry.kind === "supplement").map((entry) => entry.name.toLocaleLowerCase("sv-SE")));
  const supplementChoices = [...new Set([...(nutrition.profile?.supplements || []), ...(nutrition.supplementLibrary || [])])];
  const visibleEntries = entries
    .filter((entry) => entry.date === selectedDate && (!query.trim() || `${entry.name} ${entry.notes || ""} ${mealLabels[entry.mealType] || ""}`.toLocaleLowerCase("sv-SE").includes(query.trim().toLocaleLowerCase("sv-SE"))))
    .slice().sort((a, b) => String(b.time).localeCompare(String(a.time)));

  const openEditor = (entry = null) => {
    setEditor(entry || "new");
    setForm(entry ? Object.fromEntries(Object.entries({ ...emptyEntry(selectedDate), ...entry }).map(([key, value]) => [key, typeof value === "number" ? String(value) : value ?? ""])) : emptyEntry(selectedDate));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    const existing = editor !== "new" ? editor : null;
    const timestamp = new Date().toISOString();
    const entry = {
      ...(existing || {}),
      id: existing?.id || `intake-${crypto.randomUUID()}`,
      kind: form.kind,
      mealType: form.kind === "supplement" ? "supplement" : form.mealType,
      name: form.name.trim(),
      serving: form.serving.trim(),
      calories: numberValue(form.calories),
      protein: form.kind === "supplement" ? 0 : numberValue(form.protein),
      carbs: form.kind === "supplement" ? 0 : numberValue(form.carbs),
      fat: form.kind === "supplement" ? 0 : numberValue(form.fat),
      fiber: form.kind === "supplement" ? 0 : numberValue(form.fiber),
      dose: form.kind === "supplement" ? form.dose.trim() : "",
      notes: form.notes.trim(),
      date: form.date,
      time: form.time,
      occurredAt: new Date(`${form.date}T${form.time || "12:00"}:00`).toISOString(),
      createdAt: existing?.createdAt || timestamp,
      updatedAt: timestamp,
    };
    onSave(entry, Boolean(existing));
    setEditor(null);
  };

  const repeatEntry = (entry) => {
    const timestamp = new Date().toISOString();
    onSave({ ...entry, id: `intake-${crypto.randomUUID()}`, date: selectedDate, time: nowTime(), occurredAt: timestamp, createdAt: timestamp, updatedAt: timestamp }, false);
  };

  const quickSupplement = (name) => {
    const timestamp = new Date().toISOString();
    onSave({ id: `intake-${crypto.randomUUID()}`, kind: "supplement", mealType: "supplement", name, serving: "", dose: "", calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, notes: "", date: selectedDate, time: nowTime(), occurredAt: timestamp, createdAt: timestamp, updatedAt: timestamp }, false);
  };
  const copyPreviousDay = () => {
    const sourceDate = shiftDate(selectedDate, -1);
    entries.filter((entry) => entry.date === sourceDate).forEach((entry, index) => {
      const timestamp = new Date(Date.now() + index).toISOString();
      onSave({ ...entry, id: `intake-${crypto.randomUUID()}`, date: selectedDate, occurredAt: timestamp, createdAt: timestamp, updatedAt: timestamp }, false);
    });
  };

  const macroCards = [
    ["Kalorier", totals.calories, targets.calories, "kcal", "#f472b6"],
    ["Protein", totals.protein, targets.proteinMin, "g", "#5eb1ff"],
    ["Kolhydrater", totals.carbs, targets.carbs, "g", "#f0b429"],
    ["Fett", totals.fat, targets.fat, "g", "#3ddc84"],
  ];
  const estimated = macroCalories(form);
  const calorieDifference = form.kind === "food" && numberValue(form.calories) && estimated ? Math.abs(numberValue(form.calories) - estimated) : 0;

  return <div className="nutrition-diary">
    <div className="date-switcher card"><button aria-label="Föregående dag" onClick={() => setSelectedDate(shiftDate(selectedDate, -1))}><Icon name="arrowDown" size={16} /></button><label><span>{dayLabel(selectedDate)}</span><input type="date" value={selectedDate} max={localISO()} onChange={(event) => setSelectedDate(event.target.value)} /></label><button aria-label="Nästa dag" disabled={selectedDate >= localISO()} onClick={() => setSelectedDate(shiftDate(selectedDate, 1))}><Icon name="arrowUp" size={16} /></button></div>

    <section className="macro-grid" aria-label="Dagens makron">
      {macroCards.map(([label, value, target, unit, color]) => {
        const percent = target ? Math.min(100, value / target * 100) : 0;
        return <article className="card macro-card" key={label} style={{ "--macro-color": color }}><span>{label}</span><strong>{Math.round(value)} <small>{unit}</small></strong><div className="macro-progress"><i style={{ width: `${percent}%` }} /></div><small>{target ? `${Math.max(0, Math.round(target - value))} ${unit} kvar` : "Sätt mål i kalkylatorn"}</small></article>;
      })}
    </section>

    <div className="nutrition-diary-actions"><button className="primary-button" onClick={() => openEditor()}><Icon name="plus" size={18} /> Logga intag</button><button className="secondary-button compact-button" disabled={!entries.some((entry) => entry.date === shiftDate(selectedDate, -1))} onClick={copyPreviousDay}><Icon name="calendar" size={15} /> Kopiera gårdagen</button><button className={`secondary-button compact-button ${nutrition.completedDays?.[selectedDate] ? "active" : ""}`} disabled={!totals.items} onClick={() => onCompleteDay(selectedDate)}><Icon name="check" size={15} /> {nutrition.completedDays?.[selectedDate] ? "Dagen är komplett" : "Hela dagen loggad"}</button><span className="intake-count">{totals.items} intag · {Math.round(totals.fiber)} g fiber</span></div>

    {recent.length > 0 && <section className="quick-intake-section"><div className="section-title"><span>LOGGA IGEN</span><small>ett tryck</small></div><div className="quick-intake-scroll">{recent.map((entry) => <button className="card quick-intake" key={`${entry.kind}-${entry.name}`} onClick={() => repeatEntry(entry)}><Icon name={entry.kind === "supplement" ? "plus" : "nutrition"} size={15} /><span><strong>{entry.name}</strong><small>{entry.kind === "supplement" ? entry.dose || "tillskott" : `${entry.calories} kcal · ${entry.protein} g P`}</small></span></button>)}</div></section>}

    {supplementChoices.length > 0 && <section className="quick-intake-section"><div className="section-title"><span>KOSTTILLSKOTT</span><small>{totals.supplements} loggade</small></div><div className="supplement-chips">{supplementChoices.map((name) => { const logged = todaySupplements.has(name.toLocaleLowerCase("sv-SE")); return <button key={name} className={logged ? "logged" : ""} disabled={logged} onClick={() => quickSupplement(name)}><Icon name={logged ? "check" : "plus"} size={13} />{name}</button>; })}</div></section>}

    <section className="section"><div className="section-title"><span>DAGENS INTAG</span><small>{visibleEntries.length}/{totals.items}</small></div>{totals.items > 3 && <label className="search-field nutrition-search"><Icon name="search" size={15} /><input aria-label="Sök dagens intag" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök mat eller anteckning…" /></label>}<div className="intake-list">
      {visibleEntries.map((entry) => <article className="card intake-row" key={entry.id}><span className={`intake-kind ${entry.kind}`}><Icon name={entry.kind === "supplement" ? "plus" : "nutrition"} size={16} /></span><div><strong>{entry.name}</strong><small>{mealLabels[entry.mealType]} · {entry.time}{entry.serving ? ` · ${entry.serving}` : ""}{entry.dose ? ` · ${entry.dose}` : ""}</small>{entry.kind === "food" && <span>{entry.calories} kcal · P {entry.protein} · K {entry.carbs} · F {entry.fat}</span>}</div><div className="intake-actions"><button aria-label={`Logga ${entry.name} igen`} onClick={() => repeatEntry(entry)}><Icon name="plus" size={14} /></button><button aria-label={`Redigera ${entry.name}`} onClick={() => openEditor(entry)}><Icon name="edit" size={14} /></button><button aria-label={`Ta bort ${entry.name}`} onClick={() => setDeleting(entry)}><Icon name="trash" size={14} /></button></div></article>)}
      {!visibleEntries.length && <button className="card empty-intake" onClick={() => openEditor()}><Icon name="nutrition" size={25} /><strong>{query ? "Inget matchar sökningen" : "Logga dagens första intag"}</strong><span>Mat, dryck eller kosttillskott — det går att ändra senare.</span></button>}
    </div></section>

    {editor && <Modal title={editor === "new" ? "Logga intag" : "Redigera intag"} onClose={() => setEditor(null)}><form className="form-stack" onSubmit={submit}><div className="intake-kind-toggle"><button type="button" className={form.kind === "food" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, kind: "food", mealType: current.mealType === "supplement" ? "other" : current.mealType }))}>Mat & dryck</button><button type="button" className={form.kind === "supplement" ? "active" : ""} onClick={() => setForm((current) => ({ ...current, kind: "supplement", mealType: "supplement" }))}>Kosttillskott</button></div><label>Namn<input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder={form.kind === "food" ? "T.ex. kyckling med ris" : "T.ex. kreatin"} autoFocus required /></label>{form.kind === "food" ? <><div className="field-grid"><label>Måltid<select value={form.mealType} onChange={(event) => setForm((current) => ({ ...current, mealType: event.target.value }))}>{Object.entries(mealLabels).filter(([id]) => id !== "supplement").map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><label>Portion<input value={form.serving} onChange={(event) => setForm((current) => ({ ...current, serving: event.target.value }))} placeholder="T.ex. 350 g" /></label></div><div className="macro-input-grid"><label>kcal<input type="number" min="0" inputMode="numeric" value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))} /></label><label>Protein g<input type="number" min="0" step="0.1" inputMode="decimal" value={form.protein} onChange={(event) => setForm((current) => ({ ...current, protein: event.target.value }))} /></label><label>Kolhydrater g<input type="number" min="0" step="0.1" inputMode="decimal" value={form.carbs} onChange={(event) => setForm((current) => ({ ...current, carbs: event.target.value }))} /></label><label>Fett g<input type="number" min="0" step="0.1" inputMode="decimal" value={form.fat} onChange={(event) => setForm((current) => ({ ...current, fat: event.target.value }))} /></label><label>Fiber g<input type="number" min="0" step="0.1" inputMode="decimal" value={form.fiber} onChange={(event) => setForm((current) => ({ ...current, fiber: event.target.value }))} /></label></div>{calorieDifference > 100 && <p className="macro-mismatch">Makrona motsvarar cirka {estimated} kcal. Kontrollera om angivna kalorier skiljer sig avsiktligt.</p>}</> : <div className="field-grid"><label>Dos<input value={form.dose} onChange={(event) => setForm((current) => ({ ...current, dose: event.target.value }))} placeholder="T.ex. 5 g / 1 kapsel" /></label><label>Kalorier · valfritt<input type="number" min="0" value={form.calories} onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))} /></label></div>}<div className="field-grid"><label>Datum<input type="date" value={form.date} max={localISO()} onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))} required /></label><label>Tid<input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} required /></label></div><label>Anteckning · valfritt<input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Hunger, energi, recept…" /></label><button className="primary-button">{editor === "new" ? "Spara intag" : "Spara ändringar"}</button></form></Modal>}
    {deleting && <Modal title="Ta bort intag?" onClose={() => setDeleting(null)}><div className="confirm-stack"><p><strong>{deleting.name}</strong> tas bort från {dayLabel(deleting.date).toLocaleLowerCase("sv-SE")}. Dagens makron räknas om direkt.</p><button className="danger-button" onClick={() => { onDelete(deleting); setDeleting(null); }}><Icon name="trash" size={17} /> Ta bort intag</button><button className="secondary-button" onClick={() => setDeleting(null)}>Avbryt</button></div></Modal>}
  </div>;
}
