import { Icon } from "../ui/Icon";

const NAV = [
  ["dashboard", "home", "Hem"],
  ["today", "calendar", "Idag"],
  ["goals", "target", "Mål"],
  ["log", "plus", "Logga"],
  ["more", "more", "Mer"],
];

export const QUICK_NAV = [
  ["nutrition", "nutrition", "Kostlogg"],
  ["economy", "wallet", "Ekonomi"],
  ["gym", "dumbbell", "Gym"],
  ["habits", "check", "Rutiner"],
  ["studies", "book", "Studier"],
  ["sleep", "moon", "Sömn"],
  ["reviews", "review", "Review"],
  ["statistics", "chart", "Trender"],
];

export function AppShell({ route, onNavigate, children, syncStatus, quickNavIds = [] }) {
  return (
    <div className="app-shell">
      <div className={`sync-indicator ${syncStatus?.state || "local"}`} title={syncStatus?.label}><i />{syncStatus?.label}</div>
      <main className="app-content">{children}</main>
      <nav className="bottom-nav" aria-label="Huvudnavigation">
        <div className="desktop-brand" aria-hidden="true">
          <span>LS / OS</span>
          <strong>Livssystem</strong>
          <small>Din personliga terminal</small>
        </div>
        {NAV.map(([id, icon, label]) => (
          <button
            type="button"
            key={id}
            className={route === id ? "active" : ""}
            aria-current={route === id ? "page" : undefined}
            onClick={() => onNavigate(id)}
          >
            <span className={id === "log" ? "nav-log-icon" : ""}><Icon name={icon} size={20} /></span><span>{label}</span>
          </button>
        ))}
        <div className="desktop-shortcuts">
          <span>SNABBÅTKOMST</span>
          {QUICK_NAV.filter(([id]) => quickNavIds.includes(id)).map(([id, icon, label]) => <button type="button" key={id} className={route === id ? "active" : ""} aria-current={route === id ? "page" : undefined} onClick={() => onNavigate(id)}><Icon name={icon} size={17} /><span>{label}</span></button>)}
        </div>
      </nav>
    </div>
  );
}
