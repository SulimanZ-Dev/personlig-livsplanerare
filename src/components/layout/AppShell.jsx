import { Icon } from "../ui/Icon";

const NAV = [
  ["dashboard", "home", "Hem"],
  ["today", "calendar", "Idag"],
  ["goals", "target", "Mål"],
  ["log", "plus", "Logga"],
  ["more", "more", "Mer"],
];

export function AppShell({ route, onNavigate, children, syncStatus }) {
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
      </nav>
    </div>
  );
}
