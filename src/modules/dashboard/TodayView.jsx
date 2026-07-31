import { useMemo } from "react";
import { buildTodayPlan, coachMessage } from "../../core/goals/todayPlanner";
import { Icon } from "../../components/ui/Icon";

export function TodayView({ state, onToggle, onDismiss, onOpenGoal }) {
  const actions = useMemo(() => buildTodayPlan(state), [state]);
  const completed = actions.filter((action) => action.completed).length;
  return (
    <div className="page">
      <header className="page-header today-header">
        <div className="eyebrow">GÖR DET VIKTIGA LÄTTARE</div>
        <h1>Idag</h1>
        <p>{coachMessage(state, actions)}</p>
        <div className="day-progress"><i style={{ width: `${actions.length ? completed / actions.length * 100 : 100}%` }} /><span>{completed} av {actions.length} klart</span></div>
      </header>
      <div className="today-action-list">
        {actions.map((action, index) => (
          <article className={`card today-action ${action.completed ? "completed" : ""}`} key={action.id} style={{ "--action-color": action.color }}>
            <button aria-label={`${action.completed ? "Återöppna" : "Markera klar"}: ${action.title}`} className="today-toggle" onClick={() => onToggle(action)}><Icon name="check" /></button>
            <button className="today-action-body" onClick={() => action.goalId && onOpenGoal(state.goals[action.goalId])}>
              <span className="action-index">{String(index + 1).padStart(2, "0")}</span>
              <div><span className={`status-badge ${action.status.tone}`}><i />{action.status.label}</span><strong>{action.title}</strong><small>{action.detail}</small></div>
            </button>
            {action.goalId && !action.completed && <button className="dismiss-action" onClick={() => onDismiss(action.id)} aria-label="Hoppa över idag">×</button>}
          </article>
        ))}
        {!actions.length && <div className="empty-state alive"><Icon name="check" size={32} /><strong>Inget drar i dig idag.</strong><span>Skapa ett mål eller en rutin när du vill ge dagen en riktning.</span></div>}
      </div>
      <aside className="coach-rule card"><Icon name="pulse" /><div><strong>Coachens regel</strong><p>Om en uppgift känns för stor: gör en version som tar två minuter. Momentum slår noll.</p></div></aside>
    </div>
  );
}
