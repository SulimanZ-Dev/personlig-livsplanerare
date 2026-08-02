import { useRef } from "react";
import { Icon } from "../ui/Icon";

const NAV = [
  ["dashboard", "home", "Hem"],
  ["today", "calendar", "Idag"],
  ["goals", "target", "Mål"],
  ["log", "plus", "Logga"],
  ["more", "more", "Mer"],
];

export const QUICK_NAV = [
  ["system", "calendar", "Planera"],
  ["nutrition", "nutrition", "Kostlogg"],
  ["economy", "wallet", "Ekonomi"],
  ["gym", "dumbbell", "Gym"],
  ["habits", "check", "Rutiner"],
  ["studies", "book", "Studier"],
  ["sleep", "moon", "Sömn"],
  ["reviews", "review", "Review"],
  ["statistics", "chart", "Trender"],
];

export function AppShell({ route, onNavigate, onOpenSearch, children, syncStatus, quickNavIds = [] }) {
  const longPressTimer = useRef(null);
  const startLongPress = (id) => {
    if (id === "log") longPressTimer.current = window.setTimeout(onOpenSearch, 550);
  };
  const cancelLongPress = () => window.clearTimeout(longPressTimer.current);
  return (
    <div className="app-shell">
      <div className={`sync-indicator ${syncStatus?.state || "local"}`} title={syncStatus?.label}><i />{syncStatus?.label}</div>
      <button className="command-trigger" aria-label="Öppna global sökning" onClick={onOpenSearch}><Icon name="search" size={16} /><span>Sök</span><kbd>Ctrl K</kbd></button>
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
            onPointerDown={() => startLongPress(id)}
            onPointerUp={cancelLongPress}
            onPointerCancel={cancelLongPress}
            onPointerLeave={cancelLongPress}
            onContextMenu={(event) => { if (id === "log") { event.preventDefault(); onOpenSearch(); } }}
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
