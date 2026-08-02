import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { Modal } from "../../components/ui/Modal";
import { GymTools } from "./GymTools";

const emptyExercise = (name = "") => ({ id: `exercise-${crypto.randomUUID()}`, name, weight: "", reps: "8", sets: "3", rir: "2", rpe: "8", warmup: false, muscleGroup: "", notes: "" });

function ProgressChart({ values }) {
  if (values.length < 2) return <div className="chart-empty">Två loggade pass låser upp progressionsgrafen.</div>;
  const width = 320, height = 105, pad = 10;
  const min = Math.min(...values), max = Math.max(...values);
  const points = values.map((value, index) => `${pad + index * (width - pad * 2) / (values.length - 1)},${height - pad - (value - min) / (max - min || 1) * (height - pad * 2)}`).join(" ");
  return <svg className="line-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"><defs><linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5eb1ff" stopOpacity=".35" /><stop offset="1" stopColor="#5eb1ff" stopOpacity="0" /></linearGradient></defs><polygon points={`${pad},${height} ${points} ${width - pad},${height}`} fill="url(#chart-fill)" /><polyline points={points} fill="none" stroke="#5eb1ff" strokeWidth="3" vectorEffect="non-scaling-stroke" /></svg>;
}

export function GymView({ data, onSave, onDelete, onSaveTemplate, onMutate }) {
  const catalog = useMemo(() => [...new Set([...data.exerciseCatalog, ...(data.workoutTemplates || []).flatMap((template) => template.exercises.map((exercise) => exercise.name)), ...data.workouts.flatMap((workout) => workout.exercises.map((exercise) => exercise.name))])].filter(Boolean), [data]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [templateEditing, setTemplateEditing] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(catalog[0] || "");
  const [type, setType] = useState("Push");
  const [customType, setCustomType] = useState("");
  const [exercises, setExercises] = useState([emptyExercise(catalog[0] || "")]);
  const values = useMemo(() => data.workouts.flatMap((workout) => workout.exercises.filter((exercise) => exercise.name === selectedExercise).map((exercise) => Number(exercise.weight))), [data.workouts, selectedExercise]);
  const latest = data.workouts.at(-1);

  const close = () => { setOpen(false); setEditing(null); setTemplateEditing(null); };
  const openNew = () => { setEditing(null); setTemplateEditing(null); setExercises([emptyExercise(catalog[0] || "")]); setOpen(true); };
  const loadTemplate = (template, edit = false) => {
    setEditing(null);
    setTemplateEditing(edit ? template : null);
    const standardType = ["Push", "Pull", "Legs", "Upper", "Lower", "Helkropp"].includes(template.type) ? template.type : "Eget";
    setType(standardType);
    setCustomType(standardType === "Eget" ? template.type : "");
    setExercises(template.exercises.map((exercise) => {
      const previous = data.workouts.slice().reverse().flatMap((workout) => workout.exercises).find((item) => item.name === exercise.name);
      return { ...emptyExercise(exercise.name), ...exercise, id: `exercise-${crypto.randomUUID()}`, weight: String(previous?.weight ?? exercise.weight ?? 0), reps: String(exercise.reps || 8), sets: String(exercise.sets || 3) };
    }));
    setOpen(true);
  };
  const loadWorkout = (workout) => {
    setEditing(workout);
    setTemplateEditing(null);
    setType(["Push", "Pull", "Legs", "Upper", "Lower", "Helkropp"].includes(workout.type) ? workout.type : "Eget");
    setCustomType(workout.type);
    setExercises(workout.exercises.map((exercise) => ({ ...emptyExercise(exercise.name), ...exercise, weight: String(exercise.weight ?? ""), reps: String(exercise.reps ?? 8), sets: String(exercise.sets ?? 3) })));
    setOpen(true);
  };
  const patchExercise = (id, patch) => setExercises((current) => current.map((exercise) => exercise.id === id ? { ...exercise, ...patch } : exercise));
  const normalizedExercises = () => exercises.filter((exercise) => exercise.name.trim() && Number(exercise.weight) >= 0).map((exercise) => ({
    ...exercise,
    name: exercise.name.trim(), weight: Number(exercise.weight), reps: Number(exercise.reps), sets: Number(exercise.sets), rir: Number(exercise.rir) || 0, rpe: Number(exercise.rpe) || 0,
    setDetails: Array.from({ length: Number(exercise.sets) || 1 }, (_, index) => ({ id: `${exercise.id}-set-${index}`, weight: Number(exercise.weight), reps: Number(exercise.reps), rir: Number(exercise.rir) || 0, rpe: Number(exercise.rpe) || 0, warmup: Boolean(exercise.warmup) })),
  }));
  const workoutType = () => type === "Eget" ? customType.trim() || "Eget pass" : type;
  const submit = (event) => {
    event.preventDefault();
    const valid = normalizedExercises();
    if (!valid.length) return;
    if (templateEditing) onSaveTemplate({ ...templateEditing, id: templateEditing.id || `template-${crypto.randomUUID()}`, type: workoutType(), exercises: valid.map(({ name, reps, sets, priority, muscleGroup, notes }) => ({ name, reps, sets, priority, muscleGroup, notes })) });
    else onSave({ ...(editing || {}), id: editing?.id || `workout-${crypto.randomUUID()}`, date: editing?.date || new Date().toISOString(), type: workoutType(), exercises: valid }, Boolean(editing));
    setSelectedExercise(valid[0].name);
    close();
  };
  const saveAsTemplate = () => {
    const valid = normalizedExercises();
    if (!valid.length) return;
    onSaveTemplate({ id: `template-${crypto.randomUUID()}`, type: workoutType(), exercises: valid.map(({ name, reps, sets, priority, muscleGroup, notes }) => ({ name, reps, sets, priority, muscleGroup, notes })) });
  };

  return <div className="page">
    <header className="page-header row-between"><div><div className="eyebrow">BYGG STYRKA ÖVER TID</div><h1>Gym</h1><p>Alla pass, arbetsset, RIR och rekord formar sin egen historik.</p></div><button aria-label="Logga gympass" className="icon-button accent-blue" onClick={openNew}><Icon name="plus" /></button></header>
    <section className="card chart-card"><div className="row-between"><div><span className="eyebrow">PROGRESSION</span>{catalog.length ? <select className="inline-select" value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>{catalog.map((name) => <option key={name}>{name}</option>)}</select> : <strong>Ingen övning ännu</strong>}</div><strong className="chart-value">{values.at(-1) || 0}<small> kg</small></strong></div><ProgressChart values={values} /></section>
    <section className="gym-stats"><article className="card"><span className="eyebrow">PASS TOTALT</span><strong>{data.workouts.length}</strong></article><article className="card"><span className="eyebrow">ÖVNINGAR</span><strong>{catalog.length}</strong></article><article className="card"><span className="eyebrow">SENAST</span><strong>{latest ? new Date(latest.date).toLocaleDateString("sv-SE", { day: "numeric", month: "short" }) : "—"}</strong></article></section>
    <GymTools data={data} selectedExercise={selectedExercise} onMutate={onMutate} />
    <section className="section"><div className="section-title"><span>PASSMALLAR</span><small>upprepa eller redigera</small></div><div className="template-grid">{data.workoutTemplates.map((template) => <article className="card template-card" key={template.id}><button className="template-main" onClick={() => loadTemplate(template)}><span className="pill blue">{template.dayLabel || template.type}</span><strong>{template.type}</strong><small>{template.exercises.length} övningar · {template.durationMinutes || 90} min</small></button><button className="template-edit" aria-label={`Redigera ${template.type}`} onClick={() => loadTemplate(template, true)}><Icon name="edit" size={14} /></button></article>)}{!data.workoutTemplates.length && <button className="card template-card empty-template" onClick={openNew}><Icon name="plus" /><strong>Skapa pass och spara som mall</strong></button>}</div></section>
    <section className="section"><div className="section-title"><span>SENASTE PASS</span><small>{data.workouts.length} totalt</small></div>{latest ? <article className="card workout-card"><div className="row-between"><div><span className="pill blue">{latest.type}</span><h3>{new Date(latest.date).toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}</h3></div><div className="row-actions"><button onClick={() => loadTemplate(latest)}><Icon name="plus" size={14} /> Upprepa</button><button aria-label="Redigera senaste pass" onClick={() => loadWorkout(latest)}><Icon name="edit" size={14} /></button><button aria-label="Ta bort senaste pass" onClick={() => onDelete(latest)}><Icon name="trash" size={14} /></button></div></div>{latest.exercises.map((exercise) => <div className="set-row" key={exercise.id}><strong>{exercise.name}{exercise.warmup ? " · uppvärmning" : ""}</strong><span className="mono">{exercise.sets} × {exercise.reps} @ {exercise.weight} kg · RIR {exercise.rir ?? "–"}</span></div>)}</article> : <div className="empty-state alive"><Icon name="dumbbell" size={30} /><strong>Ditt första pass väntar.</strong><span>Välj vilken typ och vilka övningar du vill — systemet anpassar sig.</span></div>}</section>
    <div className="history-list">{data.workouts.slice().reverse().slice(1, 12).map((workout) => <div className="history-row" key={workout.id}><span className="pill blue">{workout.type}</span><div><strong>{workout.exercises.map((item) => item.name).join(", ")}</strong><small>{new Date(workout.date).toLocaleDateString("sv-SE")}</small></div><b>{workout.exercises.length} övn.</b><span className="row-actions"><button aria-label={`Redigera ${workout.type}`} onClick={() => loadWorkout(workout)}><Icon name="edit" size={14} /></button><button aria-label={`Ta bort ${workout.type}`} onClick={() => onDelete(workout)}><Icon name="trash" size={14} /></button></span></div>)}</div>

    {open && <Modal title={templateEditing ? "Redigera passmall" : editing ? "Redigera gympass" : "Logga gympass"} onClose={close}><form className="form-stack" onSubmit={submit}>
      <div className="workout-type-grid">{["Push", "Pull", "Legs", "Upper", "Lower", "Helkropp", "Eget"].map((item) => <button type="button" className={type === item ? "active" : ""} key={item} onClick={() => setType(item)}>{item}</button>)}</div>
      {type === "Eget" && <label>Passnamn<input value={customType} onChange={(event) => setCustomType(event.target.value)} placeholder="T.ex. rodd + core" /></label>}
      <div className="exercise-editor">{exercises.map((exercise, index) => <article className="exercise-edit-row" key={exercise.id}><div className="row-between"><strong>Övning {index + 1}{exercise.priority ? " · PRIORITET" : ""}</strong>{exercises.length > 1 && <button type="button" onClick={() => setExercises((current) => current.filter((item) => item.id !== exercise.id))}>Ta bort</button>}</div><input list="exercise-catalog" value={exercise.name} onChange={(event) => patchExercise(exercise.id, { name: event.target.value })} placeholder="Skriv eller välj övning" required /><div className="field-grid three"><label>Set<input type="number" min="1" value={exercise.sets} onChange={(event) => patchExercise(exercise.id, { sets: event.target.value })} /></label><label>Reps<input type="number" min="1" value={exercise.reps} onChange={(event) => patchExercise(exercise.id, { reps: event.target.value })} /></label><label>Kg<input type="number" min="0" step="0.5" inputMode="decimal" value={exercise.weight} onChange={(event) => patchExercise(exercise.id, { weight: event.target.value })} required /></label></div><div className="field-grid three"><label>RIR<input type="number" min="0" max="10" value={exercise.rir} onChange={(event) => patchExercise(exercise.id, { rir: event.target.value })} /></label><label>RPE<input type="number" min="1" max="10" step=".5" value={exercise.rpe} onChange={(event) => patchExercise(exercise.id, { rpe: event.target.value })} /></label><label>Muskelgrupp<input value={exercise.muscleGroup} onChange={(event) => patchExercise(exercise.id, { muscleGroup: event.target.value })} placeholder="Bröst" /></label></div><label className="checkbox-row"><input type="checkbox" checked={exercise.warmup} onChange={(event) => patchExercise(exercise.id, { warmup: event.target.checked })} /> Uppvärmningsset · räknas inte i volym</label><input value={exercise.notes} onChange={(event) => patchExercise(exercise.id, { notes: event.target.value })} placeholder="Teknik, tempo, anteckning…" /></article>)}</div>
      <datalist id="exercise-catalog">{catalog.map((name) => <option key={name} value={name} />)}</datalist><button className="secondary-button" type="button" onClick={() => setExercises((current) => [...current, emptyExercise("")])}><Icon name="plus" size={16} /> Lägg till övning</button>{!editing && !templateEditing && <button className="secondary-button" type="button" onClick={saveAsTemplate}><Icon name="pin" size={16} /> Spara även som mall</button>}<button className="primary-button blue-button">{templateEditing ? "Spara passmall" : editing ? "Spara ändringar" : "Spara pass"}</button>
    </form></Modal>}
  </div>;
}
