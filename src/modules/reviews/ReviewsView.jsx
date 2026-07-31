import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import { getGoalMovement, getGoalProgress, getGoalStatus } from "../../core/goals/goalEngine";

const defaultTemplates = {
  weekly: { label: "Vecka", depth: "Lätt", questions: ["Vad gick bra?", "Vad skapade friktion?", "Vilka tre saker är viktigast nästa vecka?"] },
  monthly: { label: "Månad", depth: "Medel", questions: ["Vilka mål rörde sig framåt?", "Vad gav mest energi?", "Vad ska tas bort, läggas till eller ändras?"] },
  quarterly: { label: "Kvartal", depth: "Djup", questions: ["Lever jag enligt mina prioriteringar?", "Vilket livsområde behöver mest uppmärksamhet?", "Vilka mål ska fortsätta, ändras eller arkiveras?", "Vad är riktningen för nästa kvartal?"] },
};

export function ReviewsView({ state, data, onSave }) {
  const [type, setType] = useState("weekly");
  const [answers, setAnswers] = useState({});
  const templates = {
    ...defaultTemplates,
    ...Object.fromEntries(Object.entries(data.templates || {}).map(([id, value]) => [id, { ...defaultTemplates[id], ...value }])),
  };
  const template = templates[type];
  const goalInsights = Object.values(state.goals)
    .filter((goal) => goal.status !== "archived")
    .map((goal) => ({ goal, status: getGoalStatus(state, goal), progress: getGoalProgress(state, goal), movement: getGoalMovement(state, goal) }));
  const attention = goalInsights.filter((item) => ["overdue", "at_risk", "lost"].includes(item.status.id));
  const forward = goalInsights.filter((item) => item.movement.id === "forward");
  const backward = goalInsights.filter((item) => item.movement.id === "backward");
  const stalled = goalInsights.filter((item) => item.movement.id === "stalled");
  const cadenceTitle = { weekly: "VECKOREVIEW", monthly: "MÅNADSREVIEW", quarterly: "KVARTALSREVIEW" }[type];
  const submit = (event) => {
    event.preventDefault();
    onSave({ id: `review-${crypto.randomUUID()}`, type, period: new Date().toISOString().slice(0, 10), answers, completedAt: new Date().toISOString() });
    setAnswers({});
  };
  return (
    <div className="page">
      <header className="page-header"><div className="eyebrow">STANNA · SE · JUSTERA</div><h1>Review</h1><p>Reflektion gör erfarenhet till riktning.</p></header>
      <section className="review-insights">
        <article className="card"><span className="eyebrow">FRAMÅT</span><strong>{forward.length}</strong><small>mål med positiv rörelse</small></article>
        <article className="card warning"><span className="eyebrow">BAKÅT</span><strong>{backward.length}</strong><small>mål som tappat mark</small></article>
        <article className="card"><span className="eyebrow">STILLA</span><strong>{stalled.length}</strong><small>mål utan ny rörelse</small></article>
      </section>
      {(attention.length > 0 || stalled.length > 0) && <aside className="card smart-review"><Icon name="pulse" /><div><strong>Systemets observation</strong><p>{attention.length > 0 ? `${attention.map((item) => item.goal.name).slice(0, 2).join(" och ")} ${attention.length > 2 ? `samt ${attention.length - 2} till ` : ""}behöver ett beslut.` : `${stalled.map((item) => item.goal.name).slice(0, 2).join(" och ")} står stilla.`} Justera nästa handling, deadline eller ambitionsnivå — men lämna inte målet otydligt.</p></div></aside>}
      <div className="review-tabs">{Object.entries(templates).map(([id, item]) => <button key={id} className={type === id ? "active" : ""} onClick={() => { setType(id); setAnswers({}); }}><strong>{item.label}</strong><small>{item.depth}</small></button>)}</div>
      <form className="card review-form" onSubmit={submit}><div className="review-heading"><Icon name="review" /><div><span className="eyebrow">{cadenceTitle}</span><h2>{new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}</h2></div></div>{template.questions.map((question, index) => <label key={question}><span><b>{String(index + 1).padStart(2, "0")}</b>{question}</span><textarea rows="3" required value={answers[index] || ""} onChange={(event) => setAnswers({ ...answers, [index]: event.target.value })} placeholder="Skriv ärligt och konkret…" /></label>)}<button className="primary-button">Slutför review</button></form>
      <section className="section"><div className="section-title"><span>HISTORIK</span><small>{data.entries.length} genomförda</small></div>{data.entries.slice().reverse().map((entry) => <article className="history-row" key={entry.id}><span className="pill">{templates[entry.type]?.label || entry.type}</span><div><strong>{entry.period}</strong><small>{Object.keys(entry.answers).length} reflektioner</small></div><Icon name="check" /></article>)}</section>
    </div>
  );
}
