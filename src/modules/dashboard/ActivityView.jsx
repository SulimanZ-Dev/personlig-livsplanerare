import { useMemo, useState } from "react";
import { Icon } from "../../components/ui/Icon";

const iconFor = (kind) => kind === "economy" ? "wallet" : kind === "goal" ? "target" : kind === "habit" ? "check" : kind === "nutrition" ? "nutrition" : kind === "gym" ? "dumbbell" : kind === "study" ? "book" : "pulse";

export function ActivityView({ state }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const kinds = [...new Set((state.activity || []).map((entry) => entry.kind))];
  const entries = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("sv-SE");
    return [...(state.activity || [])].filter((entry) => (kind === "all" || entry.kind === kind) && (!normalized || `${entry.title} ${entry.detail}`.toLocaleLowerCase("sv-SE").includes(normalized))).sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  }, [state.activity, query, kind]);
  return <div className="page"><header className="page-header"><div className="eyebrow">ALL RÖRELSE RÄKNAS</div><h1>Historik</h1><p>Uppgångar, sänkningar, missar och segrar — hela bilden finns kvar.</p></header><div className="history-tools"><label className="search-field"><Icon name="search" size={15} /><input aria-label="Sök all historik" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök i alla loggar…" /></label><select aria-label="Filtrera historik" value={kind} onChange={(event) => setKind(event.target.value)}><option value="all">Alla områden</option>{kinds.map((item) => <option value={item} key={item}>{item}</option>)}</select></div><div className="activity-timeline">{entries.map((entry) => <article key={entry.id}><span className={`activity-icon ${entry.kind}`}><Icon name={iconFor(entry.kind)} size={16} /></span><div><time>{new Date(entry.occurredAt).toLocaleString("sv-SE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time><strong>{entry.title}</strong><p>{entry.detail}</p></div></article>)}</div>{!entries.length && <div className="empty-state">Ingen historik matchar sökningen.</div>}</div>;
}
