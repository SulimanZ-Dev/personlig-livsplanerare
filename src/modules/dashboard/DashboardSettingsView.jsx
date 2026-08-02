import { useState } from "react";
import { availableModules } from "../../app/moduleRegistry";
import { Icon } from "../../components/ui/Icon";
import { QUICK_NAV } from "../../components/layout/AppShell";

const orderedModules = (state) => {
  const modules = availableModules(state);
  const knownIds = new Set(modules.map((module) => module.id));
  const preferred = (state.dashboard.widgetOrder || []).filter((id) => knownIds.has(id));
  const remaining = modules.map((module) => module.id).filter((id) => !preferred.includes(id));
  return [...preferred, ...remaining].map((id) => modules.find((module) => module.id === id));
};

export function DashboardSettingsView({ state, onToggle, onMove, onReorder, onResize, onToggleQuickNav, onSaveView, onApplyView, onDeleteView }) {
  const modules = orderedModules(state);
  const [viewName, setViewName] = useState("");
  const [draggingId, setDraggingId] = useState("");
  return (
    <div className="page">
      <header className="page-header">
        <div className="eyebrow">DIN HEMSKÄRM</div>
        <h1>Widgets & ordning</h1>
        <p>Visa bara de områden du vill se och lägg det viktigaste högst.</p>
      </header>

      <div className="widget-settings-list">
        {modules.map((module, index) => {
          const visible = state.dashboard.widgetOrder.includes(module.id) && !state.dashboard.hiddenWidgetIds.includes(module.id);
          return (
            <article draggable={visible} onDragStart={() => setDraggingId(module.id)} onDragEnd={() => setDraggingId("")} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggingId && draggingId !== module.id) onReorder(draggingId, module.id); setDraggingId(""); }} className={`card widget-setting-row ${visible ? "" : "muted"} ${draggingId === module.id ? "dragging" : ""}`} key={module.id}>
              <span className="more-icon" style={{ color: module.color }}><Icon name={module.icon} /></span>
              <div><strong>{module.label}</strong><small>{visible ? module.detail(state) : "Dold från hemskärmen"}</small></div>
              <div className="widget-controls">
                <button aria-label={`${visible ? "Dölj" : "Visa"} ${module.label}`} className={visible ? "active" : ""} onClick={() => onToggle(module.id)}><Icon name={visible ? "check" : "plus"} size={15} /></button>
                <button aria-label={`Ändra storlek på ${module.label}`} disabled={!visible} onClick={() => onResize(module.id)}>{({ small: "S", wide: "W", detailed: "D" })[state.dashboard.widgetSizes?.[module.id] || "small"]}</button>
                <button aria-label={`Flytta ${module.label} upp`} disabled={!visible || index === 0} onClick={() => onMove(module.id, -1)}><Icon name="arrowUp" size={15} /></button>
                <button aria-label={`Flytta ${module.label} ned`} disabled={!visible || index === modules.length - 1} onClick={() => onMove(module.id, 1)}><Icon name="arrowDown" size={15} /></button>
              </div>
            </article>
          );
        })}
      </div>

      <section className="section"><div className="section-title"><span>SIDOMENY & SNABBÅTKOMST</span><small>dator + Mer</small></div><div className="shortcut-settings-grid">{QUICK_NAV.map(([id, icon, label]) => { const active = state.dashboard.quickNavIds?.includes(id); return <button className={`card shortcut-setting ${active ? "active" : ""}`} key={id} onClick={() => onToggleQuickNav(id)}><Icon name={icon} size={17} /><span>{label}</span><Icon name={active ? "check" : "plus"} size={14} /></button>; })}</div></section>

      <section className="section"><div className="section-title"><span>SPARADE VYER</span><small>mobil + dator</small></div><div className="saved-view-create card"><input value={viewName} onChange={(event) => setViewName(event.target.value)} placeholder="Morgon, Gymkväll, Minimum-dag…" /><button className="secondary-button" onClick={() => { if (!viewName.trim()) return; onSaveView(viewName.trim()); setViewName(""); }}>Spara nuvarande layout</button></div><div className="saved-view-list">{state.dashboard.savedViews.map((view) => <article className={`card ${state.dashboard.activeSavedViewId === view.id ? "active" : ""}`} key={view.id}><button onClick={() => onApplyView(view.id)}><Icon name="home" size={16} /><strong>{view.name}</strong><small>{view.widgetOrder.length - view.hiddenWidgetIds.length} widgets</small></button><button aria-label={`Ta bort vyn ${view.name}`} onClick={() => onDeleteView(view.id)}><Icon name="trash" size={14} /></button></article>)}</div></section>

      <aside className="storage-note card">
        <Icon name="pin" />
        <div><strong>Mål styrs separat</strong><p>Fäst mål från målvyn och ordna dem där. Om inget är fäst väljer systemet automatiskt de mål som behöver mest uppmärksamhet.</p></div>
      </aside>
    </div>
  );
}
