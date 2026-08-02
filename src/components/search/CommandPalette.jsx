import { useMemo, useState } from "react";
import { Icon } from "../ui/Icon";
import { Modal } from "../ui/Modal";
import { globalSearch } from "../../core/system/systemEngine";

const commands = [
  ["dashboard", "home", "Öppna hemskärmen"], ["system", "calendar", "Öppna kalender och planering"],
  ["goals", "target", "Skapa eller hantera mål"], ["nutrition", "nutrition", "Öppna kostloggen"],
  ["gym", "dumbbell", "Öppna gym"], ["studies", "book", "Starta studietimer"],
  ["economy", "wallet", "Registrera transaktion"], ["settings", "sun", "Öppna inställningar"],
];

export function CommandPalette({ state, onClose, onNavigate, onQuickCapture }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => globalSearch(state, query), [state, query]);
  const visibleCommands = commands.filter(([, , label]) => !query || label.toLocaleLowerCase("sv-SE").includes(query.toLocaleLowerCase("sv-SE")));
  return <Modal title="Kommandopalett · Ctrl K" onClose={onClose}><div className="command-palette"><label className="search-field"><Icon name="search" size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Sök eller kör ett kommando…" /></label><div className="command-results">{visibleCommands.map(([route, icon, label]) => <button key={route} onClick={() => { if (["nutrition", "gym", "studies", "economy"].includes(route)) onQuickCapture(route); else onNavigate(route); onClose(); }}><Icon name={icon} size={17} /><span>{label}</span><kbd>↵</kbd></button>)}{results.map((item) => <button key={`${item.kind}-${item.id}`} onClick={() => { onNavigate(item.route); onClose(); }}><Icon name="search" size={17} /><span><strong>{item.title}</strong><small>{item.kind} · {item.detail}</small></span><b>→</b></button>)}</div>{!visibleCommands.length && !results.length && <div className="empty-state">Inget matchar sökningen.</div>}</div></Modal>;
}
