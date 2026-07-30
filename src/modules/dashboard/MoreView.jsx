import { Icon } from "../../components/ui/Icon";

export function MoreView({ onNavigate, state }) {
  const links = [["habits", "check", "Rutiner", "Never zero och two-miss"], ["studies", "book", "Studier", "Deep work och veckotid"], ["reviews", "review", "Review", "Vecka, månad och kvartal"]];
  return <div className="page"><header className="page-header"><div className="eyebrow">DITT SYSTEM</div><h1>Mer</h1><p>Fler verktyg och en överblick över lagringen.</p></header><div className="more-list">{links.map(([id, icon, title, text]) => <button className="card next-action" key={id} onClick={() => onNavigate(id)}><Icon name={icon} /><div><strong>{title}</strong><small>{text}</small></div><span>→</span></button>)}</div><aside className="storage-note card"><span className="status-dot" /><div><strong>Offline och lokalt</strong><p>All data sparas bara i den här webbläsaren. Schema v{state.schemaVersion} · senast sparad {new Date(state.meta.updatedAt).toLocaleString("sv-SE")}.</p></div></aside></div>;
}

