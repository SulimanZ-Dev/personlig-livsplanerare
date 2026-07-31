import { Icon } from "../../components/ui/Icon";

const actions = [
  ["goals", "target", "Logga målprogress", "Uppdatera vikt, böcker, pengar eller annat mätvärde."],
  ["economy", "wallet", "Ekonomisk transaktion", "Insättning, uttag eller flytt mellan konton."],
  ["gym", "dumbbell", "Gympass", "Spara set, reps och belastning."],
  ["studies", "clock", "Deep work", "Starta en fokuserad studiesession."],
  ["habits", "check", "Daglig rutin", "Håll never-zero-kedjan levande."],
  ["nutrition", "nutrition", "Mat & nutrition", "Logga måltid, makron eller kosttillskott."],
  ["reviews", "review", "Reflektion", "Vecko-, månads- eller kvartalsreview."],
];

export function LogView({ onNavigate }) {
  return <div className="page"><header className="page-header"><div className="eyebrow">FÅNGA VERKLIGHETEN</div><h1>Logga</h1><p>Välj vad som hände. Varje logg förbättrar prognoser och coaching.</p></header><div className="log-action-grid">{actions.map(([route, icon, title, detail]) => <button className="card log-action-card" key={route} onClick={() => onNavigate(route)}><span><Icon name={icon} /></span><div><strong>{title}</strong><small>{detail}</small></div><b>→</b></button>)}</div></div>;
}
