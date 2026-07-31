import { useMemo } from "react";
import { MODULE_REGISTRY } from "../../app/moduleRegistry";
import { GoalWidget } from "../../components/goals/GoalWidget";
import { Icon } from "../../components/ui/Icon";
import { getGoalStatus } from "../../core/goals/goalEngine";
import { buildTodayPlan, coachMessage } from "../../core/goals/todayPlanner";
import { localISO } from "../../core/dates/dateUtils";

const statusRank = { overdue: 0, lost: 1, at_risk: 2, on_track: 3, active: 4, achieved: 5 };

export function DashboardView({ state, onNavigate, onOpenGoal, onQuickUpdate }) {
  const actions = useMemo(() => buildTodayPlan(state), [state]);
  const activeGoals = Object.values(state.goals).filter((goal) => goal.status !== "archived");
  const goalsByPriority = [...activeGoals].sort((a, b) => statusRank[getGoalStatus(state, a).id] - statusRank[getGoalStatus(state, b).id]);
  const pinned = state.dashboard.pinnedGoalIds.map((id) => state.goals[id]).filter((goal) => goal && goal.status !== "archived");
  const visibleGoals = [...pinned, ...goalsByPriority.filter((goal) => !state.dashboard.pinnedGoalIds.includes(goal.id))].slice(0, 4);
  const completed = actions.filter((action) => action.completed).length;
  const moduleOrder = state.dashboard.widgetOrder || [];
  const orderedModules = [...MODULE_REGISTRY].sort((a, b) => {
    const aIndex = moduleOrder.indexOf(a.id);
    const bIndex = moduleOrder.indexOf(b.id);
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  });

  return (
    <div className="page dashboard">
      <header className="hero living-hero">
        <div className="hero-glow" />
        <div className="row-between">
          <div>
            <div className="eyebrow">LIVSSYSTEM · {localISO()}</div>
            <h1>{state.profile.displayName ? `Fokus, ${state.profile.displayName}` : "Din kontrollpanel"}</h1>
          </div>
          <button aria-label="Öppna konto och synk" className="avatar-button" onClick={() => onNavigate("account")}><Icon name="user" size={18} /></button>
        </div>
        <p>{coachMessage(state, actions)}</p>
      </header>

      <button className="card today-summary" onClick={() => onNavigate("today")}>
        <div className="today-score" style={{ "--score": `${actions.length ? completed / actions.length * 360 : 0}deg` }}><span>{completed}<small>/{actions.length}</small></span></div>
        <div><span className="eyebrow">DIN PLAN IDAG</span><strong>{actions.find((action) => !action.completed)?.title || "Allt klart"}</strong><small>{actions.find((action) => !action.completed)?.detail || "Du har hållit löftet till dig själv."}</small></div>
        <span className="arrow">→</span>
      </button>

      <section className="section">
        <div className="section-title"><span>VIKTIGAST JUST NU</span><button onClick={() => onNavigate("goals")}>Hantera</button></div>
        <div className="dashboard-goals">
          {visibleGoals.map((goal) => <GoalWidget compact key={goal.id} state={state} goal={goal} onOpen={onOpenGoal} onQuickUpdate={onQuickUpdate} />)}
          {!visibleGoals.length && <button className="empty-goal-card card" onClick={() => onNavigate("goals")}><Icon name="plus" /><strong>Skapa ditt första mål</strong><span>Dashboarden formar sig automatiskt efter det du vill uppnå.</span></button>}
        </div>
      </section>

      <section className="section">
        <div className="section-title"><span>DINA OMRÅDEN</span><button onClick={() => onNavigate("dashboardSettings")}>Anpassa</button></div>
        <div className="module-grid">
          {orderedModules.filter((module) => !state.dashboard.hiddenWidgetIds.includes(module.id)).map((module) => (
            <button className="card living-module-card" key={module.id} onClick={() => onNavigate(module.id)} style={{ "--module-color": module.color }}>
              <span className="module-symbol"><Icon name={module.icon} /></span>
              <span className="eyebrow">{module.label}</span>
              <strong>{module.summary(state)}</strong>
              <small>{module.detail(state)}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-title"><span>SENASTE RÖRELSE</span><button onClick={() => onNavigate("activity")}>All historik</button></div>
        <div className="activity-preview">
          {(state.activity || []).slice().reverse().slice(0, 4).map((entry) => (
            <div className="activity-item" key={entry.id}><i className={`activity-dot ${entry.kind}`} /><div><strong>{entry.title}</strong><small>{entry.detail}</small></div><time>{new Date(entry.occurredAt).toLocaleDateString("sv-SE", { day: "numeric", month: "short" })}</time></div>
          ))}
        </div>
      </section>
    </div>
  );
}
