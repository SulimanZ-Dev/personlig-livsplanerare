import { goalProgress, GOAL_TYPES } from "../../core/goals/goalProgress";
import { Icon } from "../ui/Icon";

export function GoalsView({ state, onCreate, onEdit, onUpdate, onArchive }) {
  const goals = Object.values(state.goals).filter((goal) => goal.status === "active");
  const entries = Object.values(state.goalEntries);

  const quickUpdate = (goal) => {
    const progress = goalProgress(goal, entries);
    const raw = window.prompt(`Nytt värde för ${goal.name}`, String(progress.value));
    if (raw !== null && !Number.isNaN(Number(raw))) onUpdate(goal, Number(raw));
  };

  return (
    <div className="page">
      <header className="page-header row-between"><div><div className="eyebrow">ALLA LIVSOMRÅDEN</div><h1>Mål</h1></div><button className="icon-button accent" onClick={onCreate}><Icon name="plus" /></button></header>
      <div className="goal-list">
        {goals.map((goal) => {
          const progress = goalProgress(goal, entries);
          return (
            <article className="card goal-card" key={goal.id}>
              <div className="row-between">
                <div><span className="pill" style={{ color: goal.color }}>{goal.category || goal.moduleId}</span><h3>{goal.name}</h3></div>
                <div className="row-actions"><button className="bare-button" onClick={() => onEdit(goal)}><Icon name="edit" size={17} /></button><button className="bare-button" onClick={() => onArchive(goal.id)}><Icon name="archive" size={17} /></button></div>
              </div>
              {goal.type === "checklist" ? (
                <div className="check-list">{goal.checklistItems.map((item) => <label key={item.id}><input type="checkbox" checked={item.done} onChange={() => onUpdate(goal, item.id)} /><span>{item.label}</span></label>)}</div>
              ) : (
                <button className="progress-block" onClick={() => quickUpdate(goal)}>
                  <div className="row-between metric-line"><span>{GOAL_TYPES[goal.type].label}</span><strong>{progress.value} / {progress.target} {goal.unit}</strong></div>
                  <div className="progress"><i style={{ width: `${progress.percent}%`, background: goal.color }} /></div>
                </button>
              )}
              {goal.deadline && <div className="muted mono">DEADLINE · {goal.deadline}</div>}
            </article>
          );
        })}
        {!goals.length && <div className="empty-state">Inga aktiva mål ännu.</div>}
      </div>
      <button className="primary-button sticky-action" onClick={onCreate}><Icon name="plus" size={18} /> Skapa nytt mål</button>
    </div>
  );
}

