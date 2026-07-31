import { Icon } from "../../components/ui/Icon";
import { getPhaseStatus } from "../../core/phases/phaseEngine";

export function RulesView({ state, onNavigate }) {
  const phase = getPhaseStatus(state.profile.phases);
  return <div className="page"><header className="page-header"><div className="eyebrow">RIKTNING FÖRE FART</div><h1>Systemkarta</h1><p>Faser och underhållsregler är referenser — de loggar inget och styr inte dina val åt dig.</p></header>
    {phase && <section className="card phase-panel"><div className="row-between"><div><span className="eyebrow">AKTUELL FAS</span><h2>{phase.name}</h2></div><strong>{phase.state === "current" ? `DAG ${phase.day}` : phase.percent === 100 ? "KLAR" : `OM ${phase.daysUntil} D`}</strong></div><p>{phase.description || phase.label}</p><div className="phase-track"><i style={{ width: `${phase.percent}%` }} /></div><div className="row-between"><small>{phase.startDate}</small><small>{phase.endDate}</small></div></section>}
    <section className="section"><div className="section-title"><span>10 UNDERHÅLLSREGLER</span><small>{state.referenceRules.length} sparade</small></div><div className="rules-list">{state.referenceRules.map((rule, index) => <article className="card rule-row" key={rule.id}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>{rule.title}</strong><p>{rule.detail}</p>{rule.moduleIds?.length > 0 && <div>{rule.moduleIds.map((moduleId) => <button key={moduleId} onClick={() => onNavigate(moduleId)}>{moduleId} <b>→</b></button>)}</div>}</div></article>)}</div>{!state.referenceRules.length && <div className="empty-state alive"><Icon name="shield" size={28} /><strong>Inga regler definierade.</strong><span>Den publika appen börjar tom. Regler kan läggas in via en seed eller JSON-backup utan att hårdkodas i gränssnittet.</span></div>}</section>
  </div>;
}

