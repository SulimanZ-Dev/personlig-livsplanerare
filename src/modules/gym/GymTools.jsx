import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { exerciseSetRows, personalRecords, plateLoading, progressionSignal, workoutVolume } from "./gymModel";

const formatTimer = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

export function GymTools({ data, selectedExercise, onMutate }) {
  const [timer, setTimer] = useState(0);
  const [running, setRunning] = useState(false);
  const [plates, setPlates] = useState({ total: 100, bar: 20 });
  const [alternative, setAlternative] = useState("");
  useEffect(() => {
    if (!running || timer <= 0) return undefined;
    const interval = window.setInterval(() => setTimer((value) => {
      if (value <= 1) {
        setRunning(false);
        if (navigator.vibrate) navigator.vibrate([120, 80, 120]);
        return 0;
      }
      return value - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [running, timer]);
  const records = useMemo(() => personalRecords(data.workouts, selectedExercise), [data.workouts, selectedExercise]);
  const signal = useMemo(() => progressionSignal(data.workouts, selectedExercise), [data.workouts, selectedExercise]);
  const loading = plateLoading(plates.total, plates.bar);
  const weeklyVolume = data.workouts.slice(-7).reduce((sum, workout) => sum + workoutVolume(workout), 0);
  const muscleVolume = data.workouts.slice(-7).flatMap((workout) => workout.exercises || []).reduce((totals, exercise) => {
    const group = exercise.muscleGroup || "Övrigt";
    totals[group] = (totals[group] || 0) + exerciseSetRows(exercise).filter((set) => !set.warmup).reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0);
    return totals;
  }, {});
  const weeksSinceDeload = (() => {
    const last = data.workouts.slice().reverse().find((workout) => workout.deload);
    const latestDate = data.workouts.at(-1)?.date;
    return last && latestDate ? Math.floor((new Date(latestDate) - new Date(last.date)) / 604800000) : Math.floor(data.workouts.length / 4);
  })();
  return <section className="gym-tools section"><div className="section-title"><span>LYFTVERKTYG</span><small>progression · vila · belastning</small></div><div className="gym-tool-grid">
    <article className="card pr-card"><span className="eyebrow">PERSONLIGA REKORD · {selectedExercise || "ÖVNING"}</span>{records ? <div className="pr-grid"><span><strong>{records.weight.weight} kg</strong><small>tyngsta vikt</small></span><span><strong>{records.reps.reps}</strong><small>flest reps</small></span><span><strong>{Math.round(records.oneRepMax.weight * (1 + records.oneRepMax.reps / 30))} kg</strong><small>uppskattad 1RM</small></span></div> : <p>Logga minst ett arbetsset för att skapa rekord.</p>}<div className={`progression-signal ${signal.tone}`}><i />{signal.label}</div><small>Veckovolym: {weeklyVolume.toLocaleString("sv-SE")} kg</small><div className="muscle-volume">{Object.entries(muscleVolume).map(([group, volume]) => <span key={group}>{group}<b>{volume.toLocaleString("sv-SE")} kg</b></span>)}</div></article>
    <article className={`card rest-timer ${running ? "running" : ""}`}><span className="eyebrow">VILOTIMER</span><strong>{formatTimer(timer)}</strong><div className="timer-presets">{[60, 90, 120, 180].map((seconds) => <button key={seconds} onClick={() => { setTimer(seconds); setRunning(true); }}>{seconds / 60 >= 1 ? `${seconds / 60}m` : `${seconds}s`}</button>)}</div><button className="secondary-button" onClick={() => setRunning((value) => !value)} disabled={!timer}>{running ? "Pausa" : "Fortsätt"}</button></article>
    <article className="card plate-card"><span className="eyebrow">PLATTKALKYLATOR · PER SIDA</span><div className="field-grid"><label>Total kg<input type="number" step=".5" value={plates.total} onChange={(event) => setPlates({ ...plates, total: event.target.value })} /></label><label>Stång kg<input type="number" step=".5" value={plates.bar} onChange={(event) => setPlates({ ...plates, bar: event.target.value })} /></label></div><div className="plate-stack">{loading.plates.map((item) => <span key={item.plate}>{item.count}× {item.plate} kg</span>)}</div><small>{loading.loadable ? "Exakt lastbar med standardvikter" : `${loading.remainder} kg per sida saknas`}</small></article>
    <article className={`card deload-card ${weeksSinceDeload >= (data.deloadEveryWeeks || 7) ? "due" : ""}`}><Icon name="shield" /><div><span className="eyebrow">DELOAD</span><strong>{weeksSinceDeload} veckor sedan</strong><p>{weeksSinceDeload >= (data.deloadEveryWeeks || 7) ? "Överväg en lättare vecka: halvera set och lämna 3–4 RIR." : `Påminnelse vid vecka ${data.deloadEveryWeeks || 7}.`}</p></div><select aria-label="Deload-intervall" value={data.deloadEveryWeeks || 7} onChange={(event) => onMutate((current) => ({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, deloadEveryWeeks: Number(event.target.value) } } }), "Deload-intervall uppdaterat", `${event.target.value} veckor`)}><option value="6">6 veckor</option><option value="7">7 veckor</option><option value="8">8 veckor</option></select></article>
  </div><article className="card alternatives-card"><div><span className="eyebrow">ERSÄTTNINGSÖVNINGAR</span><strong>{selectedExercise || "Välj en övning"}</strong><small>{(data.exerciseAlternatives?.[selectedExercise] || []).join(" · ") || "Inga alternativ sparade"}</small></div><form onSubmit={(event) => { event.preventDefault(); if (!selectedExercise || !alternative.trim()) return; onMutate((current) => ({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, exerciseAlternatives: { ...(current.modules.gym.exerciseAlternatives || {}), [selectedExercise]: [...new Set([...(current.modules.gym.exerciseAlternatives?.[selectedExercise] || []), alternative.trim()])] } } } }), `Alternativ till ${selectedExercise}`, alternative.trim()); setAlternative(""); }}><input value={alternative} onChange={(event) => setAlternative(event.target.value)} placeholder="T.ex. hantelpress" /><button className="secondary-button"><Icon name="plus" size={15} /> Lägg till</button></form></article></section>;
}
