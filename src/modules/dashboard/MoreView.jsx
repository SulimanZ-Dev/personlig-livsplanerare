import { Icon } from "../../components/ui/Icon";

export function MoreView({ onNavigate, state }) {
  const links = [
    ["economy", "wallet", "Ekonomi", "Konton, transaktioner och sparmål"],
    ["habits", "check", "Rutiner", "Never zero och two-miss"],
    ["gym", "dumbbell", "Gym", "Pass och progressiv överbelastning"],
    ["studies", "book", "Studier", "Deep work och veckotid"],
    ["nutrition", "nutrition", "Nutrition", "TDEE, underskott och protein"],
    ["sleep", "moon", "Sömn", "Rytm, kvalitet och vilopuls"],
    ["reviews", "review", "Review", "Vecka, månad och kvartal"],
    ["dashboardSettings", "home", "Hemskärmens layout", "Visa, dölj och ordna widgets"],
    ["activity", "pulse", "All historik", "Se varje förändring över tid"],
    ["statistics", "chart", "Veckotrender", "Statistik från alla moduler samlat"],
    ["rules", "shield", "Systemkarta", "Faser och underhållsregler"],
    ["settings", "sun", "Inställningar", "Tema, backup, onboarding och reset"],
    ["account", "user", "Konto & synk", "Samma data på alla enheter"],
  ];
  return (
    <div className="page">
      <header className="page-header"><div className="eyebrow">HELA SYSTEMET</div><h1>Mer</h1><p>Alla livsområden, historik och inställningar på ett ställe.</p></header>
      <div className="more-list">{links.map(([id, icon, title, text]) => <button className="card next-action" key={id} onClick={() => onNavigate(id)}><span className="more-icon"><Icon name={icon} /></span><div><strong>{title}</strong><small>{text}</small></div><span>→</span></button>)}</div>
      <aside className="storage-note card"><span className="status-dot" /><div><strong>Local-first · schema v{state.schemaVersion}</strong><p>Ändringar sparas direkt på enheten. När du är inloggad synkas de även till ditt privata molnkonto.</p></div></aside>
    </div>
  );
}
