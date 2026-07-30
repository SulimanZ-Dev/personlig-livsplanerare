import { Icon } from "../ui/Icon";

const NAV = [
  ["dashboard", "home", "Hem"],
  ["goals", "target", "Mål"],
  ["economy", "wallet", "Ekonomi"],
  ["gym", "dumbbell", "Gym"],
  ["more", "more", "Mer"],
];

export function AppShell({ route, onNavigate, children }) {
  return (
    <div className="app-shell">
      <main className="app-content">{children}</main>
      <nav className="bottom-nav" aria-label="Huvudnavigation">
        {NAV.map(([id, icon, label]) => (
          <button key={id} className={route === id ? "active" : ""} onClick={() => onNavigate(id)}>
            <Icon name={icon} size={20} /><span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

