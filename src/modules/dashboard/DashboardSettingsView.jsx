import { availableModules } from "../../app/moduleRegistry";
import { Icon } from "../../components/ui/Icon";

const orderedModules = (state) => {
  const modules = availableModules(state);
  const knownIds = new Set(modules.map((module) => module.id));
  const preferred = (state.dashboard.widgetOrder || []).filter((id) => knownIds.has(id));
  const remaining = modules.map((module) => module.id).filter((id) => !preferred.includes(id));
  return [...preferred, ...remaining].map((id) => modules.find((module) => module.id === id));
};

export function DashboardSettingsView({ state, onToggle, onMove }) {
  const modules = orderedModules(state);
  return (
    <div className="page">
      <header className="page-header">
        <div className="eyebrow">DIN HEMSKÄRM</div>
        <h1>Widgets & ordning</h1>
        <p>Visa bara de områden du vill se och lägg det viktigaste högst.</p>
      </header>

      <div className="widget-settings-list">
        {modules.map((module, index) => {
          const visible = !state.dashboard.hiddenWidgetIds.includes(module.id);
          return (
            <article className={`card widget-setting-row ${visible ? "" : "muted"}`} key={module.id}>
              <span className="more-icon" style={{ color: module.color }}><Icon name={module.icon} /></span>
              <div><strong>{module.label}</strong><small>{visible ? module.detail(state) : "Dold från hemskärmen"}</small></div>
              <div className="widget-controls">
                <button aria-label={`${visible ? "Dölj" : "Visa"} ${module.label}`} className={visible ? "active" : ""} onClick={() => onToggle(module.id)}><Icon name={visible ? "check" : "plus"} size={15} /></button>
                <button aria-label={`Flytta ${module.label} upp`} disabled={index === 0} onClick={() => onMove(module.id, -1)}><Icon name="arrowUp" size={15} /></button>
                <button aria-label={`Flytta ${module.label} ned`} disabled={index === modules.length - 1} onClick={() => onMove(module.id, 1)}><Icon name="arrowDown" size={15} /></button>
              </div>
            </article>
          );
        })}
      </div>

      <aside className="storage-note card">
        <Icon name="pin" />
        <div><strong>Mål styrs separat</strong><p>Fäst mål från målvyn och ordna dem där. Om inget är fäst väljer systemet automatiskt de mål som behöver mest uppmärksamhet.</p></div>
      </aside>
    </div>
  );
}
