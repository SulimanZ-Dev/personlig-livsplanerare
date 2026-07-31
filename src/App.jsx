import { useState } from "react";
import { GoalForm } from "./components/goals/GoalForm";
import { GoalsView } from "./components/goals/GoalsView";
import { QuickGoalUpdate } from "./components/goals/QuickGoalUpdate";
import { AppShell } from "./components/layout/AppShell";
import { localISO } from "./core/dates/dateUtils";
import { useAppStorage } from "./core/storage/useAppStorage";
import { useAuth } from "./core/sync/AuthContext";
import { AccountView } from "./modules/account/AccountView";
import { ActivityView } from "./modules/dashboard/ActivityView";
import { DashboardView } from "./modules/dashboard/DashboardView";
import { DashboardSettingsView } from "./modules/dashboard/DashboardSettingsView";
import { LogView } from "./modules/dashboard/LogView";
import { MoreView } from "./modules/dashboard/MoreView";
import { TodayView } from "./modules/dashboard/TodayView";
import { EconomyView } from "./modules/economy/EconomyView";
import { GymView } from "./modules/gym/GymView";
import { HabitsView } from "./modules/habits/HabitsView";
import { ReviewsView } from "./modules/reviews/ReviewsView";
import { StudiesView } from "./modules/studies/StudiesView";

const activity = (kind, title, detail) => ({
  id: `activity-${crypto.randomUUID()}`,
  kind,
  title,
  detail,
  occurredAt: new Date().toISOString(),
});

export default function App() {
  const { user, authReady } = useAuth();
  const { state, update, error, syncStatus } = useAppStorage(user);
  const [route, setRoute] = useState("dashboard");
  const [goalEditor, setGoalEditor] = useState(null);
  const [quickGoal, setQuickGoal] = useState(null);

  if (!state || !authReady) return <div className="loading"><i /></div>;

  const saveGoal = (goal) => update(
    (current) => ({ ...current, goals: { ...current.goals, [goal.id]: goal } }),
    activity("goal", goalEditor === "new" ? `Nytt mål: ${goal.name}` : `Mål ändrat: ${goal.name}`, `${goal.targetValue || goal.checklistItems?.length || 0} ${goal.unit || ""}`),
  );

  const logGoalValue = (goal, value, note) => {
    const entry = { id: `entry-${crypto.randomUUID()}`, goalId: goal.id, operation: "set", value, note, occurredAt: new Date().toISOString() };
    update(
      (current) => ({ ...current, goalEntries: { ...current.goalEntries, [entry.id]: entry } }),
      activity("goal", `${goal.name}: ${value} ${goal.unit || ""}`, note || "Progress uppdaterad"),
    );
  };

  const toggleChecklist = (goal, itemId) => update((current) => {
    const currentGoal = current.goals[goal.id];
    const checklistItems = currentGoal.checklistItems.map((item) => item.id === itemId ? { ...item, done: !item.done } : item);
    const entry = {
      id: `entry-${crypto.randomUUID()}`,
      goalId: goal.id,
      operation: "set",
      value: checklistItems.filter((item) => item.done).length,
      note: "Checklista uppdaterad",
      occurredAt: new Date().toISOString(),
    };
    return {
      ...current,
      goals: {
        ...current.goals,
        [goal.id]: { ...currentGoal, checklistItems, updatedAt: new Date().toISOString() },
      },
      goalEntries: { ...current.goalEntries, [entry.id]: entry },
    };
  }, activity("goal", goal.name, "Ett delmål ändrades"));

  const archiveGoal = (id) => update((current) => ({
    ...current,
    goals: { ...current.goals, [id]: { ...current.goals[id], status: "archived", archivedAt: new Date().toISOString() } },
    dashboard: { ...current.dashboard, pinnedGoalIds: current.dashboard.pinnedGoalIds.filter((goalId) => goalId !== id) },
  }), activity("goal", `Arkiverat: ${state.goals[id].name}`, "Målet finns kvar i arkivet"));

  const togglePin = (id) => update((current) => {
    const pinned = current.dashboard.pinnedGoalIds.includes(id);
    return { ...current, dashboard: { ...current.dashboard, pinnedGoalIds: pinned ? current.dashboard.pinnedGoalIds.filter((goalId) => goalId !== id) : [...current.dashboard.pinnedGoalIds, id] } };
  });

  const movePin = (id, direction) => update((current) => {
    const list = [...current.dashboard.pinnedGoalIds];
    const index = list.indexOf(id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return current;
    [list[index], list[nextIndex]] = [list[nextIndex], list[index]];
    return { ...current, dashboard: { ...current.dashboard, pinnedGoalIds: list } };
  });

  const toggleWidget = (id) => update((current) => {
    const hidden = current.dashboard.hiddenWidgetIds.includes(id);
    return {
      ...current,
      dashboard: {
        ...current.dashboard,
        hiddenWidgetIds: hidden
          ? current.dashboard.hiddenWidgetIds.filter((widgetId) => widgetId !== id)
          : [...current.dashboard.hiddenWidgetIds, id],
      },
    };
  });

  const moveWidget = (id, direction) => update((current) => {
    const known = ["economy", "habits", "gym", "studies", "reviews"];
    const order = [
      ...current.dashboard.widgetOrder.filter((widgetId) => known.includes(widgetId)),
      ...known.filter((widgetId) => !current.dashboard.widgetOrder.includes(widgetId)),
    ];
    const index = order.indexOf(id);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return current;
    [order[index], order[nextIndex]] = [order[nextIndex], order[index]];
    return { ...current, dashboard: { ...current.dashboard, widgetOrder: order } };
  });

  const toggleHabit = (habitId, date = localISO()) => update((current) => {
    const habits = current.modules.habits;
    const existing = habits.checkIns.find((item) => item.habitId === habitId && item.date === date);
    const checkIns = existing
      ? habits.checkIns.map((item) => item.id === existing.id ? { ...item, done: !item.done } : item)
      : [...habits.checkIns, { id: `check-${crypto.randomUUID()}`, habitId, date, done: true }];
    return { ...current, modules: { ...current.modules, habits: { ...habits, checkIns } } };
  }, activity("habit", state.modules.habits.habits.find((habit) => habit.id === habitId)?.name || "Rutin", "Dagens status ändrades"));

  const toggleToday = (actionItem) => {
    if (actionItem.habitId) return toggleHabit(actionItem.habitId);
    update((current) => {
      const completions = { ...current.today.completions };
      if (completions[actionItem.id]) delete completions[actionItem.id];
      else completions[actionItem.id] = new Date().toISOString();
      return { ...current, today: { ...current.today, completions } };
    }, activity("goal", actionItem.title, actionItem.completed ? "Återöppnad i dagens plan" : "Markerad klar för idag"));
  };

  const views = {
    dashboard: <DashboardView state={state} onNavigate={setRoute} onOpenGoal={setGoalEditor} onQuickUpdate={setQuickGoal} />,
    dashboardSettings: <DashboardSettingsView state={state} onToggle={toggleWidget} onMove={moveWidget} />,
    today: <TodayView state={state} onToggle={toggleToday} onDismiss={(id) => update((current) => ({ ...current, today: { ...current.today, dismissed: { ...current.today.dismissed, [id]: true } } }))} onOpenGoal={setGoalEditor} />,
    goals: <GoalsView state={state} onCreate={() => setGoalEditor("new")} onEdit={setGoalEditor} onQuickUpdate={setQuickGoal} onChecklist={toggleChecklist} onArchive={archiveGoal} onPin={togglePin} onMovePin={movePin} />,
    log: <LogView onNavigate={setRoute} />,
    economy: <EconomyView state={state} onCreateGoal={() => setGoalEditor("new")} onOpenGoal={setGoalEditor} onTransaction={(transaction) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: [...current.modules.economy.transactions, transaction] } } }),
      activity("economy", `${transaction.type === "deposit" ? "Insättning" : transaction.type === "withdrawal" ? "Uttag" : "Överföring"} · ${transaction.amount.toLocaleString("sv-SE")} kr`, transaction.note || "Saldo uppdaterat"),
    )} onAddAccount={(name, openingBalance) => {
      const id = `account-${crypto.randomUUID()}`;
      update((current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, accounts: { ...current.modules.economy.accounts, [id]: { id, name, openingBalance, color: "#3ddc84", archived: false } } } } }), activity("economy", `Nytt konto: ${name}`, `Öppningssaldo ${openingBalance.toLocaleString("sv-SE")} kr`));
    }} />,
    gym: <GymView data={state.modules.gym} onSave={(workout) => update((current) => {
      const names = workout.exercises.map((exercise) => exercise.name);
      return { ...current, modules: { ...current.modules, gym: { ...current.modules.gym, exerciseCatalog: [...new Set([...current.modules.gym.exerciseCatalog, ...names])], workouts: [...current.modules.gym.workouts, workout] } } };
    }, activity("gym", `${workout.type}-pass`, workout.exercises.map((exercise) => exercise.name).join(", ")))} />,
    habits: <HabitsView data={state.modules.habits} onToggle={toggleHabit} onAdd={(habit) => update((current) => ({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, habits: [...current.modules.habits.habits, { id: `habit-${crypto.randomUUID()}`, ...habit, color: "#3ddc84", createdAt: new Date().toISOString() }] } } }), activity("habit", `Ny rutin: ${habit.name}`, habit.frequency === "weekly_target" ? `${habit.targetPerWeek} gånger per vecka` : "Never zero börjar idag"))} />,
    studies: <StudiesView data={state.modules.studies} onStart={(subject) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, activeSession: { id: `session-${crypto.randomUUID()}`, subject, startedAt: new Date().toISOString() } } } }))} onStop={(seconds) => update((current) => {
      const studies = current.modules.studies;
      const session = { ...studies.activeSession, endedAt: new Date().toISOString(), durationMinutes: Math.max(1, Math.round(seconds / 60)) };
      return { ...current, modules: { ...current.modules, studies: { sessions: [...studies.sessions, session], activeSession: null } } };
    }, activity("study", state.modules.studies.activeSession?.subject || "Deep work", `${Math.max(1, Math.round(seconds / 60))} minuter`))} />,
    reviews: <ReviewsView state={state} data={state.modules.reviews} onSave={(review) => update((current) => ({ ...current, modules: { ...current.modules, reviews: { entries: [...current.modules.reviews.entries, review] } } }), activity("review", `${review.type}-review`, "Reflektionen sparades"))} />,
    activity: <ActivityView state={state} />,
    account: <AccountView state={state} onUpdateProfile={(displayName) => update((current) => ({ ...current, profile: { ...current.profile, displayName } }))} />,
    more: <MoreView state={state} onNavigate={setRoute} />,
  };

  return (
    <AppShell route={route} onNavigate={setRoute} syncStatus={syncStatus}>
      {views[route] || views.dashboard}
      {error && <div className="toast">{error}</div>}
      {goalEditor && <GoalForm state={state} goal={goalEditor === "new" ? null : goalEditor} onSave={saveGoal} onClose={() => setGoalEditor(null)} />}
      {quickGoal && <QuickGoalUpdate state={state} goal={quickGoal} onSave={logGoalValue} onClose={() => setQuickGoal(null)} />}
    </AppShell>
  );
}
