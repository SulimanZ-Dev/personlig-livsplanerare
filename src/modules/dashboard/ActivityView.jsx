import { Icon } from "../../components/ui/Icon";

export function ActivityView({ state }) {
  const entries = [...(state.activity || [])].sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  return <div className="page"><header className="page-header"><div className="eyebrow">ALL RÖRELSE RÄKNAS</div><h1>Historik</h1><p>Uppgångar, sänkningar, missar och segrar — hela bilden finns kvar.</p></header><div className="activity-timeline">{entries.map((entry) => <article key={entry.id}><span className={`activity-icon ${entry.kind}`}><Icon name={entry.kind === "economy" ? "wallet" : entry.kind === "goal" ? "target" : entry.kind === "habit" ? "check" : "pulse"} size={16} /></span><div><time>{new Date(entry.occurredAt).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time><strong>{entry.title}</strong><p>{entry.detail}</p></div></article>)}</div></div>;
}
