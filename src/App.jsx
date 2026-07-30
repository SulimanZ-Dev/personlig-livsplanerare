import { useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { GoalForm } from "./components/goals/GoalForm";
import { GoalsView } from "./components/goals/GoalsView";
import { useAppStorage } from "./core/storage/useAppStorage";
import { DashboardView } from "./modules/dashboard/DashboardView";
import { MoreView } from "./modules/dashboard/MoreView";
import { EconomyView } from "./modules/economy/EconomyView";
import { GymView } from "./modules/gym/GymView";
import { HabitsView } from "./modules/habits/HabitsView";
import { StudiesView } from "./modules/studies/StudiesView";
import { ReviewsView } from "./modules/reviews/ReviewsView";

export default function App() {
  const { state, update, error } = useAppStorage();
  const [route, setRoute] = useState("dashboard");
  const [goalEditor, setGoalEditor] = useState(null);

  if (!state) return <div className="loading"><i /></div>;

  const saveGoal = (goal) => update((current) => ({ ...current, goals: { ...current.goals, [goal.id]: goal } }));
  const updateGoal = (goal, value) => update((current) => {
    if (goal.type === "checklist") {
      const nextGoal = { ...goal, checklistItems: goal.checklistItems.map((item) => item.id === value ? { ...item, done: !item.done } : item) };
      return { ...current, goals: { ...current.goals, [goal.id]: nextGoal } };
    }
    if (goal.type === "streak") {
      return { ...current, goals: { ...current.goals, [goal.id]: { ...goal, currentStreak: value } } };
    }
    const entry = { id: `entry-${crypto.randomUUID()}`, goalId: goal.id, operation: "set", value, occurredAt: new Date().toISOString() };
    return { ...current, goalEntries: { ...current.goalEntries, [entry.id]: entry } };
  });
  const archiveGoal = (id) => update((current) => ({ ...current, goals: { ...current.goals, [id]: { ...current.goals[id], status: "archived", archivedAt: new Date().toISOString() } } }));

  const views = {
    dashboard: <DashboardView state={state} onNavigate={setRoute} />,
    goals: <GoalsView state={state} onCreate={() => setGoalEditor("new")} onEdit={setGoalEditor} onUpdate={updateGoal} onArchive={archiveGoal} />,
    economy: <EconomyView data={state.modules.economy} onTransaction={(transaction) => update((current) => {
      const economy = current.modules.economy;
      const account = economy.accounts[transaction.accountId];
      return { ...current, modules: { ...current.modules, economy: { ...economy, accounts: { ...economy.accounts, [account.id]: { ...account, balance: Math.max(0, account.balance + transaction.amount) } }, transactions: [...economy.transactions, transaction] } } };
    })} />,
    gym: <GymView data={state.modules.gym} onSave={(workout) => update((current) => ({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, workouts: [...current.modules.gym.workouts, workout] } } }))} />,
    habits: <HabitsView data={state.modules.habits} onToggle={(habitId, date) => update((current) => {
      const habits = current.modules.habits;
      const existing = habits.checkIns.find((item) => item.habitId === habitId && item.date === date);
      const checkIns = existing ? habits.checkIns.map((item) => item.id === existing.id ? { ...item, done: !item.done } : item) : [...habits.checkIns, { id: `check-${crypto.randomUUID()}`, habitId, date, done: true }];
      return { ...current, modules: { ...current.modules, habits: { ...habits, checkIns } } };
    })} onAdd={(name) => update((current) => ({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, habits: [...current.modules.habits.habits, { id: `habit-${crypto.randomUUID()}`, name, color: "#3ddc84", frequency: "daily", createdAt: new Date().toISOString() }] } } }))} />,
    studies: <StudiesView data={state.modules.studies} onStart={(subject) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, activeSession: { id: `session-${crypto.randomUUID()}`, subject, startedAt: new Date().toISOString() } } } }))} onStop={(seconds) => update((current) => {
      const studies = current.modules.studies;
      const session = { ...studies.activeSession, endedAt: new Date().toISOString(), durationMinutes: Math.max(1, Math.round(seconds / 60)) };
      return { ...current, modules: { ...current.modules, studies: { sessions: [...studies.sessions, session], activeSession: null } } };
    })} />,
    reviews: <ReviewsView data={state.modules.reviews} onSave={(review) => update((current) => ({ ...current, modules: { ...current.modules, reviews: { entries: [...current.modules.reviews.entries, review] } } }))} />,
    more: <MoreView state={state} onNavigate={setRoute} />,
  };

  return (
    <AppShell route={route} onNavigate={setRoute}>
      {views[route] || views.dashboard}
      {error && <div className="toast">{error}</div>}
      {goalEditor && <GoalForm goal={goalEditor === "new" ? null : goalEditor} onSave={saveGoal} onClose={() => setGoalEditor(null)} />}
    </AppShell>
  );
}
