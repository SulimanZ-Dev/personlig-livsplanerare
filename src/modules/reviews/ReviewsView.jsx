import { useState } from "react";
import { Icon } from "../../components/ui/Icon";

const templates = {
  weekly: { label: "Vecka", depth: "Lätt", questions: ["Vad gick bra?", "Vad skapade friktion?", "Vilka tre saker är viktigast nästa vecka?"] },
  monthly: { label: "Månad", depth: "Medel", questions: ["Vilka mål rörde sig framåt?", "Vad gav mest energi?", "Vad ska tas bort, läggas till eller ändras?"] },
  quarterly: { label: "Kvartal", depth: "Djup", questions: ["Lever jag enligt mina prioriteringar?", "Vilket livsområde behöver mest uppmärksamhet?", "Vilka mål ska fortsätta, ändras eller arkiveras?", "Vad är riktningen för nästa kvartal?"] },
};

export function ReviewsView({ data, onSave }) {
  const [type, setType] = useState("weekly");
  const [answers, setAnswers] = useState({});
  const template = templates[type];
  const submit = (event) => {
    event.preventDefault();
    onSave({ id: `review-${crypto.randomUUID()}`, type, period: new Date().toISOString().slice(0, 10), answers, completedAt: new Date().toISOString() });
    setAnswers({});
  };
  return (
    <div className="page">
      <header className="page-header"><div className="eyebrow">STANNA · SE · JUSTERA</div><h1>Review</h1><p>Reflektion gör erfarenhet till riktning.</p></header>
      <div className="review-tabs">{Object.entries(templates).map(([id, item]) => <button key={id} className={type === id ? "active" : ""} onClick={() => { setType(id); setAnswers({}); }}><strong>{item.label}</strong><small>{item.depth}</small></button>)}</div>
      <form className="card review-form" onSubmit={submit}><div className="review-heading"><Icon name="review" /><div><span className="eyebrow">{template.label.toUpperCase()}SREVIEW</span><h2>{new Date().toLocaleDateString("sv-SE", { month: "long", year: "numeric" })}</h2></div></div>{template.questions.map((question, index) => <label key={question}><span><b>{String(index + 1).padStart(2, "0")}</b>{question}</span><textarea rows="3" required value={answers[index] || ""} onChange={(event) => setAnswers({ ...answers, [index]: event.target.value })} placeholder="Skriv ärligt och konkret…" /></label>)}<button className="primary-button">Slutför review</button></form>
      <section className="section"><div className="section-title"><span>HISTORIK</span><small>{data.entries.length} genomförda</small></div>{data.entries.slice().reverse().map((entry) => <article className="history-row" key={entry.id}><span className="pill">{templates[entry.type].label}</span><div><strong>{entry.period}</strong><small>{Object.keys(entry.answers).length} reflektioner</small></div><Icon name="check" /></article>)}</section>
    </div>
  );
}

