import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { ACTIVITY_LEVELS, calculateNutritionPlan, hasHeavyRecentWorkout } from "./nutritionModel";

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

export function NutritionView({ state, onSaveCalculation, onCreateGoal }) {
  const latestId = state.modules.nutrition.latestCalculationId;
  const latest = state.modules.nutrition.calculations.find((item) => item.id === latestId) || state.modules.nutrition.calculations.at(-1);
  const profileDefaults = state.modules.nutrition.profile || {};
  const [form, setForm] = useState(() => {
    const values = latest?.inputs || profileDefaults;
    return { ...initialForm, ...Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === null || value === undefined || key === "targetWeight" && Number(value) === 0 ? "" : String(value)])) };
  });
  const [result, setResult] = useState(latest || null);
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
      <header className="page-header nutrition-hero"><div className="eyebrow">PUBLIK KALKYLATOR · INGET KONTO KRÄVS</div><h1>Kalorier med omdöme</h1><p>Räkna på energi, takt och protein — med varningar när matematiken blir sämre än planen.</p></header>

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
    </div>
  );
}
