import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { ACTIVITY_LEVELS, calculateNutritionPlan, hasHeavyRecentWorkout } from "./nutritionModel";
import { NutritionDiary } from "./NutritionDiary";
import { NutritionStudio } from "./NutritionStudio";

const initialForm = {
  weight: "80",
  targetWeight: "75",
  height: "180",
  age: "30",
  gender: "male",
  activity: "moderate",
  lossType: "fat",
  weeklyRate: "0.5",
};

const calories = (value) => `${Number(value).toLocaleString("sv-SE")} kcal`;

export function NutritionView({ state, onSaveCalculation, onCreateGoal, onSaveIntake, onDeleteIntake, onMutate }) {
  const latestId = state.modules.nutrition.latestCalculationId;
  const latest = state.modules.nutrition.calculations.find((item) => item.id === latestId) || state.modules.nutrition.calculations.at(-1);
  const profileDefaults = state.modules.nutrition.profile || {};
  const [form, setForm] = useState(() => {
    const values = latest?.inputs || profileDefaults;
    return { ...initialForm, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === null || value === undefined || key === "targetWeight" && Number(value) === 0 ? "" : String(value)])) };
  });
  const [result, setResult] = useState(latest || null);
  const [mode, setMode] = useState("diary");
  const heavyTraining = useMemo(() => hasHeavyRecentWorkout(state.modules.gym.workouts), [state.modules.gym.workouts]);
  const field = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    const next = calculateNutritionPlan(form, { heavyTraining });
    setResult(next);
    onSaveCalculation(next);
  };

  return (
    <div className="page nutrition-page">
      <header className="page-header nutrition-hero"><div className="eyebrow">KOST · ENERGI · ÅTERHÄMTNING</div><h1>Nutrition</h1><p>Logga det du äter, följ dagens makron och använd kalkylatorn när planen behöver justeras.</p></header>
      <div className="nutrition-mode-tabs" role="tablist" aria-label="Nutrition-vy"><button role="tab" aria-selected={mode === "diary"} className={mode === "diary" ? "active" : ""} onClick={() => setMode("diary")}><Icon name="nutrition" size={16} /> Dagbok</button><button role="tab" aria-selected={mode === "studio"} className={mode === "studio" ? "active" : ""} onClick={() => setMode("studio")}><Icon name="calendar" size={16} /> Matplan</button><button role="tab" aria-selected={mode === "calculator"} className={mode === "calculator" ? "active" : ""} onClick={() => setMode("calculator")}><Icon name="chart" size={16} /> Kalkylator</button></div>

      {mode === "diary" ? <NutritionDiary nutrition={state.modules.nutrition} onSave={onSaveIntake} onDelete={onDeleteIntake} onCompleteDay={(date) => onMutate((current) => {
        const completed = !current.modules.nutrition.completedDays?.[date];
        const habit = current.modules.habits.habits.find((item) => `${item.name} ${item.category || ""}`.toLocaleLowerCase("sv-SE").includes("nutrition") || `${item.name}`.toLocaleLowerCase("sv-SE").includes("kost"));
        const nutrition = { ...current.modules.nutrition, completedDays: { ...(current.modules.nutrition.completedDays || {}), [date]: completed } };
        if (!habit) return { ...current, modules: { ...current.modules, nutrition } };
        const existing = current.modules.habits.checkIns.find((item) => item.habitId === habit.id && item.date === date);
        const checkIn = { id: existing?.id || `check-${crypto.randomUUID()}`, habitId: habit.id, date, done: completed, level: completed ? "full" : "floor", automated: true };
        const checkIns = existing ? current.modules.habits.checkIns.map((item) => item.id === existing.id ? checkIn : item) : [...current.modules.habits.checkIns, checkIn];
        return { ...current, modules: { ...current.modules, nutrition, habits: { ...current.modules.habits, checkIns } } };
      }, "Kostdag uppdaterad", date)} /> : mode === "studio" ? <NutritionStudio state={state} onMutate={onMutate} onLogRecipe={(recipe, totals, scale) => onSaveIntake({ id: `intake-${crypto.randomUUID()}`, kind: "food", mealType: "other", name: recipe.name, serving: `${scale}× portion`, calories: Math.round(totals.calories * scale), protein: Math.round(totals.protein * scale * 10) / 10, carbs: Math.round(totals.carbs * scale * 10) / 10, fat: Math.round(totals.fat * scale * 10) / 10, fiber: Math.round(totals.fiber * scale * 10) / 10, dose: "", notes: "Från recept", date: new Date().toLocaleDateString("sv-SE"), time: new Date().toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }), occurredAt: new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, false)} /> : <>
      <aside className="calculator-intro card"><Icon name="shield" /><div><strong>Publik kalkylator · inget konto krävs</strong><p>Räkna på TDEE, takt och protein med coachvarningar när underskottet blir för aggressivt.</p></div></aside>

      {profileDefaults.proteinMin && <section className="card nutrition-strategy"><div><span className="eyebrow">DIN NUTRITION-RAM</span><strong>{profileDefaults.proteinMin}–{profileDefaults.proteinMax} g protein</strong><small>{profileDefaults.waterLiters} L vatten · måttligt underskott</small></div><div><b>{profileDefaults.mealTimes?.breakfast}</b><span>frukost</span><b>{profileDefaults.mealTimes?.lunch}</b><span>lunch</span><b>{profileDefaults.mealTimes?.dinner}</b><span>middag</span></div></section>}

      <form className="card nutrition-form form-stack" onSubmit={submit}>
        <div className="field-grid"><label>Vikt, kg<input type="number" min="35" max="350" step="0.1" inputMode="decimal" value={form.weight} onChange={field("weight")} required /></label><label>Målvikt, kg · valfritt<input type="number" min="30" max="350" step="0.1" inputMode="decimal" value={form.targetWeight} onChange={field("targetWeight")} placeholder="Sätt senare" /></label></div>
        <div className="field-grid three"><label>Längd, cm<input type="number" min="120" max="230" value={form.height} onChange={field("height")} required /></label><label>Ålder<input type="number" min="16" max="100" value={form.age} onChange={field("age")} required /></label><label>Kön<select value={form.gender} onChange={field("gender")}><option value="male">Man</option><option value="female">Kvinna</option></select></label></div>
        <label>Aktivitetsnivå<select value={form.activity} onChange={field("activity")}>{ACTIVITY_LEVELS.map((level) => <option value={level.id} key={level.id}>{level.label} · ×{level.factor}</option>)}</select></label>
        <div className="field-grid"><label>Vad vill du tappa?<select value={form.lossType} onChange={field("lossType")}><option value="fat">Främst fett</option><option value="general">Generell vikt</option></select></label><label>Takt<strong className="range-value">{Number(form.weeklyRate).toFixed(1)} kg/vecka</strong><input type="range" min="0.2" max="1.5" step="0.1" value={form.weeklyRate} onChange={field("weeklyRate")} onInput={field("weeklyRate")} /></label></div>
        <button className="primary-button"><Icon name="nutrition" size={18} /> Beräkna min plan</button>
      </form>

      {result && <section className="nutrition-result" aria-live="polite">
        <div className="nutrition-metrics">
          <article className="card"><span>UNDERHÅLL / TDEE</span><strong>{calories(result.tdee)}</strong><small>BMR {result.bmr.toLocaleString("sv-SE")} kcal</small></article>
          <article className="card accent-metric"><span>MÅLINTAG</span><strong>{calories(result.calorieTarget)}</strong><small>−{result.dailyDeficit.toLocaleString("sv-SE")} kcal per dag</small></article>
          <article className="card"><span>PROTEIN</span><strong>{result.protein[0]}–{result.protein[1]} g</strong><small>per dag vid {result.inputs.lossType === "fat" ? "fettförlust" : "viktnedgång"}</small></article>
        </div>
        <article className={`card coach-verdict ${result.pace.tone}`}><span className="coach-icon"><Icon name={result.pace.tone === "danger" ? "pulse" : "check"} /></span><div><div className="eyebrow">COACHENS BEDÖMNING · {result.pace.label}</div><strong>{result.pace.message}</strong><p>Säkerhetsgolv för dina uppgifter: cirka {calories(result.safeFloor)}.</p></div></article>
        {result.trainingConflict && <article className="card training-warning"><Icon name="dumbbell" /><div><strong>Tung träning upptäckt</strong><p>Det här underskottet är aggressivt nära ett styrkepass. Höj intaget eller sänk takten för bättre återhämtning.</p></div></article>}
        {result.inputs.targetWeight > 0 && result.inputs.targetWeight < result.inputs.weight ? <button className="secondary-button nutrition-goal-button" onClick={() => onCreateGoal(result)}><Icon name="target" size={18} /> Spara som viktmål</button> : <p className="nutrition-goal-hint">Lägg till en målvikt när du vill spara beräkningen som ett dynamiskt minskningsmål.</p>}
        <p className="nutrition-disclaimer">Beräkningen är en uppskattning, inte medicinsk rådgivning. Justera från verklig vikttrend och sök professionell hjälp vid sjukdom, graviditet eller ätproblematik.</p>
      </section>}
      {state.modules.nutrition.mealLibrary?.length > 0 && <section className="section"><div className="section-title"><span>REPEAT MEALS</span><small>rotera var {profileDefaults.rotationWeeks} vecka</small></div><div className="meal-library">{state.modules.nutrition.mealLibrary.map((meal) => <article className="card" key={meal.meal}><div className="row-between"><strong>{meal.meal}</strong><span className="mono">{meal.time}</span></div>{meal.options.map((option) => <p key={option}>→ {option}</p>)}</article>)}</div>{profileDefaults.supplements?.length > 0 && <aside className="card nutrition-rules"><strong>Ramar</strong><p>{profileDefaults.supplements.join(" · ")} · ingen {profileDefaults.exclusions.join(" / ").toLowerCase()} · burgare/pizza {profileDefaults.burgerPizzaPerMonth}×/månad planerat.</p></aside>}</section>}
      </>}
    </div>
  );
}
