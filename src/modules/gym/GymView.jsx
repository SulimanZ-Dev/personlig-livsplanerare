import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";

const emptyExercise = (name = "") => ({ id: `exercise-${crypto.randomUUID()}`, name, weight: "", reps: "8", sets: "3" });

function ProgressChart({ values }) {
  if (values.length < 2) return <div className="chart-empty">Två loggade pass låser upp progressionsgrafen.</div>;
  const width = 320, height = 105, pad = 10;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((value, index) => `${pad + index * (width - pad * 2) / (values.length - 1)},${height - pad - (value - min) / (max - min || 1) * (height - pad * 2)}`).join(" ");
  return <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5eb1ff" stopOpacity=".35" /><stop offset="1" stopColor="#5eb1ff" stopOpacity="0" /></linearGradient></defs><polygon points={`${pad},${height} ${points} ${width - pad},${height}`} fill="url(#chart-fill)" /><polyline points={points} fill="none" stroke="#5eb1ff" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>;
}

export function GymView({ data, onSave }) {
  const catalog = useMemo(() => [...new Set([...data.exerciseCatalog, ...(data.workoutTemplates || []).flatMap((template) => template.exercises.map((exercise) => exercise.name)), ...data.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name))])].filter(Boolean), [data]);
  const [open, setOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(catalog[0] || "");
  const [type, setType] = useState("Push");
  const [customType, setCustomType] = useState("");
  const [exercises, setExercises] = useState([emptyExercise(catalog[0] || "")]);
  const values = useMemo(() => data.workouts.flatMap((workout) => workout.exercises.filter((exercise) => exercise.name === selectedExercise).map((exercise) => Number(exercise.weight))), [data.workouts, selectedExercise]);
  const latest = data.workouts.at(-1);

  const loadTemplate = (template) => {
    const standardType = ["Push", "Pull", "Legs", "Upper", "Lower", "Helkropp"].includes(template.type) ? template.type : "Eget";
    setType(standardType);
    setCustomType(standardType === "Eget" ? template.type : "");
    setExercises(template.exercises.map((exercise) => {
      const previous = data.workouts.slice().reverse().flatMap((workout) => workout.exercises).find((item) => item.name === exercise.name);
      return { id: `exercise-${crypto.randomUUID()}`, name: exercise.name, weight: previous?.weight ?? 0, reps: exercise.reps || 8, sets: exercise.sets || 3, priority: Boolean(exercise.priority) };
    }));
    setOpen(true);
  };

  const patchExercise = (id, patch) => setExercises((current) => current.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise));
  const submit = (event) => {
    event.preventDefault();
    const valid = exercises.filter((exercise) => exercise.name.trim() && Number(exercise.weight) >= 0).map((exercise) => ({ ...exercise, name: exercise.name.trim(), weight: Number(exercise.weight), reps: Number(exercise.reps), sets: Number(exercise.sets) }));
    if (!valid.length) return;
    onSave({ id: `workout-${crypto.randomUUID()}`, date: new Date().toISOString(), type: type === "Eget" ? customType.trim() || "Eget pass" : type, exercises: valid });
    setSelectedExercise(valid[0].name);
    setExercises([emptyExercise(valid[0].name)]);
    setOpen(false);
  };

  return (
    <div className="page">
      <header className="page-header row-between"><div><div className="eyebrow">BYGG STYRKA ÖVER TID</div><h1>Gym</h1><p>Alla pass och övningar formar sin egen historik.</p></div><button aria-label="Logga gympass" className="icon-button accent-blue" onClick={() => setOpen(true)}><Icon name="plus" /></button></header>
      <section className="card chart-card"><div className="row-between"><div><span className="eyebrow">PROGRESSION</span>{catalog.length ? <select className="inline-select" value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{catalog.map((name) => <option key={name}>{name}</option>)}</select> : <strong>Ingen övning ännu</strong>}</div><strong className="chart-value">{values.at(-1) || 0}<small> kg</small></strong></div><ProgressChart values={values} /></section>
      <section className="gym-stats"><article className="card"><span className="eyebrow">PASS TOTALT</span><strong>{data.workouts.length}</strong></article><article className="card"><span className="eyebrow">ÖVNINGAR</span><strong>{catalog.length}</strong></article><article className="card"><span className="eyebrow">SENAST</span><strong>{latest ? new Date(latest.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : "—"}</strong></article></section>
      {(data.workoutTemplates || []).length > 0 && <section className="section"><div className="section-title"><span>PASSMALLAR</span><small>tryck för att logga</small></div><div className="template-grid">{data.workoutTemplates.map((template) => <button className="card template-card" key={template.id} onClick={() => loadTemplate(template)}><span className="pill blue">{template.dayLabel || template.type}</span><strong>{template.type}</strong><small>{template.exercises.length} övningar · {template.durationMinutes || 90} min</small></button>)}</div></section>}
      <section className="section"><div className="section-title"><span>SENASTE PASS</span><small>{data.workouts.length} totalt</small></div>{latest ? <article className="card workout-card"><div className="row-between"><div><span className="pill blue">{latest.type}</span><h3>{new Date(latest.date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}</h3></div><Icon name="dumbbell" /></div>{latest.exercises.map((exercise) => <div className="set-row" key={exercise.id}><strong>{exercise.name}</strong><span className="mono">{exercise.sets} × {exercise.reps} @ {exercise.weight} kg</span></div>)}</article> : <div className="empty-state alive"><Icon name="dumbbell" size={30} /><strong>Ditt första pass väntar.</strong><span>Välj vilken typ och vilka övningar du vill — systemet anpassar sig.</span></div>}</section>
      <div className="history-list">{data.workouts.slice().reverse().slice(1, 12).map((workout) => <div className="history-row" key={workout.id}><span className="pill blue">{workout.type}</span><div><strong>{workout.exercises.map((item) => item.name).join(", ")}</strong><small>{new Date(workout.date).toLocaleDateString("sv-SE")}</small></div><b>{workout.exercises.length} övn.</b></div>)}</div>

      {open && <Modal title="Logga gympass" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}><div className="workout-type-grid">{["Push", "Pull", "Legs", "Upper", "Lower", "Helkropp", "Eget"].map((item) => <button type="button" className={type === item ? "active" : ""} key={item} onClick={() => setType(item)}>{item}</button>)}</div>{type === "Eget" && <label>Passnamn<input value={customType} onChange={(event) => setCustomType(event.target.value)} placeholder="T.ex. Löpning + core" /></label>}<div className="exercise-editor">{exercises.map((exercise, index) => <article className="exercise-edit-row" key={exercise.id}><div className="row-between"><strong>Övning {index + 1}{exercise.priority ? " · PRIORITET" : ""}</strong>{exercises.length > 1 && <button type="button" onClick={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))}>Ta bort</button>}</div><input list="exercise-catalog" value={exercise.name} onChange={(event) => patchExercise(exercise.id, { name: event.target.value })} placeholder="Skriv eller välj övning" required /><div className="field-grid three"><label>Set<input type="number" min="1" value={exercise.sets} onChange={(event) => patchExercise(exercise.id, { sets: event.target.value })} /></label><label>Reps<input type="number" min="1" value={exercise.reps} onChange={(event) => patchExercise(exercise.id, { reps: event.target.value })} /></label><label>Kg<input type="number" min="0" step="0.5" inputMode="decimal" value={exercise.weight} onChange={(event) => patchExercise(exercise.id, { weight: event.target.value })} required /></label></div></article>)}</div><datalist id="exercise-catalog">{catalog.map((name) => <option key={name} value={name} />)}</datalist><button className="secondary-button" type="button" onClick={() => setExercises((current) => [...current, emptyExercise("")])}><Icon name="plus" size={16} /> Lägg till övning</button><button className="primary-button blue-button">Spara pass</button></form></Modal>}
    </div>
  );
}
