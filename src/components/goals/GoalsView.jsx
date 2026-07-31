import { useMemo, useState } from "react";
import { getGoalStatus } from "../../core/goals/goalEngine";
import { Icon } from "../ui/Icon";
import { GoalWidget } from "./GoalWidget";

const filters = [
  ["all", "Alla"],
  ["attention", "Behöver fokus"],
  ["achieved", "Uppnådda"],
  ["archived", "Arkiv"],
];

export function GoalsView({ state, onCreate, onEdit, onQuickUpdate, onChecklist, onArchive, onPin, onMovePin }) {
  const [filter, setFilter] = useState("all");
  const goals = useMemo(() => Object.values(state.goals).filter((goal) => {
    if (filter === "archived") return goal.status === "archived";
    if (goal.status === "archived") return false;
    const status = getGoalStatus(state, goal).id;
    if (filter === "attention") return ["at_risk", "overdue", "lost"].includes(status);
    if (filter === "achieved") return status === "achieved";
    return true;
  }), [filter, state]);

  return (
    <div className="page">
      <header className="page-header row-between">
        <div><div className="eyebrow">DYNAMISKA MÅL</div><h1>Din riktning</h1><p>Det som mäts får rörelse. Det som ändras räknas om.</p></div>
        <button aria-label="Skapa mål" className="icon-button accent" onClick={onCreate}><Icon name="plus" /></button>
      </header>

      <div className="filter-chips">{filters.map(([id, label]) => <button key={id} className={filter === id ? "active" : ""} onClick={() => setFilter(id)}>{label}</button>)}</div>

      <div className="goal-list">
        {goals.map((goal) => {
          const pinnedIndex = state.dashboard.pinnedGoalIds.indexOf(goal.id);
          return (
            <div className="goal-manage-wrap" key={goal.id}>
              <GoalWidget state={state} goal={goal} onOpen={onEdit} onQuickUpdate={onQuickUpdate} />
              {goal.type === "checklist" && (
                <div className="inline-checklist">{goal.checklistItems.map((item) => <label key={item.id}><input type="checkbox" checked={item.done} onChange={() => onChecklist(goal, item.id)} /><span>{item.label}</span></label>)}</div>
              )}
              <div className="goal-toolbar">
                <button onClick={() => onPin(goal.id)} className={pinnedIndex >= 0 ? "active" : ""}><Icon name="pin" size={14} />{pinnedIndex >= 0 ? "Fäst på Hem" : "Fäst"}</button>
                {pinnedIndex >= 0 && <><button disabled={pinnedIndex === 0} onClick={() => onMovePin(goal.id, -1)}><Icon name="arrowUp" size={14} />Upp</button><button disabled={pinnedIndex === state.dashboard.pinnedGoalIds.length - 1} onClick={() => onMovePin(goal.id, 1)}><Icon name="arrowDown" size={14} />Ned</button></>}
                <button onClick={() => onEdit(goal)}><Icon name="edit" size={14} />Redigera</button>
                {goal.status !== "archived" && <button onClick={() => onArchive(goal.id)}><Icon name="archive" size={14} />Arkivera</button>}
              </div>
            </div>
          );
        })}
        {!goals.length && <div className="empty-state alive"><Icon name="target" size={30} /><strong>Här finns utrymme för något viktigt.</strong><span>Skapa ett mätbart mål så bygger appen dashboard, prognos och nästa handling åt dig.</span><button className="primary-button" onClick={onCreate}>Skapa mål</button></div>}
      </div>
    </div>
  );
}
