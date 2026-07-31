import { getGoalForecast, getGoalProgress, getGoalStatus, getGoalTrend, getNextAction } from "../../core/goals/goalEngine";
import { Icon } from "../ui/Icon";

const fmt = (value) => Number(value).toLocaleString("sv-SE", { maximumFractionDigits: 1 });

export function GoalWidget({ state, goal, compact = false, onOpen, onQuickUpdate }) {
  const progress = getGoalProgress(state, goal);
  const status = getGoalStatus(state, goal);
  const trend = getGoalTrend(state, goal);
  const forecast = getGoalForecast(state, goal);

  return (
    <article className={`card dynamic-goal ${compact ? "compact" : ""}`} style={{ "--goal-color": goal.color }}>
      <button className="goal-widget-main" onClick={() => onOpen?.(goal)}>
        <div className="row-between">
          <div className="goal-widget-title">
            <span className={`status-badge ${status.tone}`}><i />{status.label}</span>
            <h3>{goal.name}</h3>
          </div>
          <span className="goal-percent">{Math.round(progress.percent)}<small>%</small></span>
        </div>
        <div className="goal-values">
          <strong>{fmt(progress.value)} <small>{goal.unit}</small></strong>
          <span>av {fmt(progress.target)} {goal.unit}</span>
        </div>
        <div className="progress goal-progress"><i style={{ width: `${progress.percent}%`, background: goal.color }} /></div>
        {!compact && (
          <>
            <div className="goal-insights">
              <span><Icon name={trend.direction === "down" ? "arrowDown" : trend.direction === "up" ? "arrowUp" : "pulse"} size={14} />{trend.delta ? `${trend.delta > 0 ? "+" : ""}${fmt(trend.delta)} senaste logg` : "Inväntar mer data"}</span>
              <span><Icon name="calendar" size={14} />{forecast.label}</span>
            </div>
            <p className="next-step">{getNextAction(state, goal)}</p>
          </>
        )}
      </button>
      {goal.source === "manual" && goal.type !== "checklist" && onQuickUpdate && (
        <button className="quick-log-button" onClick={() => onQuickUpdate(goal)}><Icon name="plus" size={15} /> Logga värde</button>
      )}
    </article>
  );
}
