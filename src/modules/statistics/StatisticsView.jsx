import { Icon } from "../../components/ui/Icon";
import { buildWeeklyTrends } from "./statisticsModel";
import { isThisWeek } from "../../core/dates/dateUtils";
import { economyTotal } from "../economy/economyModel";

const definitions = [
  { key: "studyHours", label: "Deep work", unit: "h", color: "#a78bfa", icon: "book" },
  { key: "workouts", label: "Gympass", unit: "pass", color: "#5eb1ff", icon: "dumbbell" },
  { key: "habitChecks", label: "Rutiner", unit: "check", color: "#f0b429", icon: "check" },
  { key: "goalLogs", label: "Målloggar", unit: "loggar", color: "#3ddc84", icon: "target" },
];

const kpiCurrent = (state, kpi) => {
  if (kpi.source === "study_weekly") return state.modules.studies.sessions.filter((item) => isThisWeek(item.startedAt)).reduce((sum, item) => sum + item.durationMinutes, 0) / 60;
  if (kpi.source === "gym_weekly") return state.modules.gym.workouts.filter((item) => isThisWeek(item.date)).length;
  if (kpi.source === "economy_total") return economyTotal(state.modules.economy);
  if (kpi.source?.startsWith("measurement:")) {
    const type = kpi.source.split(":")[1];
    return state.modules.personal.measurements.filter((entry) => entry.type === type).slice().sort((a, b) => String(a.date).localeCompare(String(b.date))).at(-1)?.value;
  }
  return kpi.current ?? null;
};

const displayKpiValue = (value, unit) => value === null || value === undefined ? "Logga först" : `${Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 1 })}${unit ? ` ${unit}` : ""}`;

export function StatisticsView({ state }) {
  const weeks = buildWeeklyTrends(state);
  const latest = weeks.at(-1);
  const previous = weeks.at(-2);
  return <div className="page"><header className="page-header"><div className="eyebrow">SEX VECKOR · ETT SYSTEM</div><h1>Trender</h1><p>Se rörelsen bakom dashboardens ögonblicksbild.</p></header>
    <div className="trend-summary-grid">{definitions.map((item) => { const delta = latest[item.key] - previous[item.key]; return <article className="card trend-summary" key={item.key} style={{ "--trend-color": item.color }}><span><Icon name={item.icon} size={17} />{item.label}</span><strong>{latest[item.key]} <small>{item.unit}</small></strong><b className={delta > 0 ? "positive" : delta < 0 ? "negative" : "muted"}>{delta > 0 ? "+" : ""}{delta} mot förra veckan</b></article>; })}</div>
    <section className="section"><div className="section-title"><span>VECKOTRENDER</span><small>senaste 6</small></div><div className="trend-panels">{definitions.map((definition) => { const max = Math.max(1, ...weeks.map((week) => week[definition.key])); return <article className="card trend-panel" key={definition.key}><div className="row-between"><strong>{definition.label}</strong><span style={{ color: definition.color }}><Icon name={definition.icon} size={18} /></span></div><div className="trend-bars">{weeks.map((week) => <div key={week.start}><span>{week[definition.key]}</span><i style={{ height: `${Math.max(5, week[definition.key] / max * 100)}%`, background: definition.color }} /><small>{week.label}</small></div>)}</div></article>; })}</div></section>
    <section className="card economy-trend"><div><span className="eyebrow">EKONOMISKT NETTO · VECKAN</span><strong className={latest.economyNet >= 0 ? "positive" : "negative"}>{latest.economyNet.toLocaleString("sv-SE")} kr</strong></div><p>Insättningar minus uttag. Överföringar mellan egna konton räknas inte som ny rörelse.</p></section>
    {state.profile.kpis?.length > 0 && <section className="section"><div className="section-title"><span>SYSTEM-KPI:ER</span><small>{state.profile.kpis.length} signaler</small></div><div className="kpi-table">{state.profile.kpis.map((kpi) => { const current = kpiCurrent(state, kpi); return <article className="card kpi-row" key={kpi.id}><div><strong>{kpi.label}</strong><small>{kpi.cadence || "löpande"} · {kpi.note || "systemsignal"}</small></div><span><b>{displayKpiValue(current, kpi.unit)}</b><small>mål {kpi.targetLabel || displayKpiValue(kpi.target, kpi.unit)}</small></span></article>; })}</div></section>}
  </div>;
}
