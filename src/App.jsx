import { useEffect, useState } from "react";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { GoalForm } from "./components/goals/GoalForm";
import { GoalsView } from "./components/goals/GoalsView";
import { QuickGoalUpdate } from "./components/goals/QuickGoalUpdate";
import { AppShell } from "./components/layout/AppShell";
import { localISO } from "./core/dates/dateUtils";
import { useAppStorage } from "./core/storage/useAppStorage";
import { useAuth } from "./core/sync/AuthContext";
import { availableModules } from "./app/moduleRegistry";
import { AccountView } from "./modules/account/AccountView";
import { ActivityView } from "./modules/dashboard/ActivityView";
import { DashboardView } from "./modules/dashboard/DashboardView";
import { DashboardSettingsView } from "./modules/dashboard/DashboardSettingsView";
import { LogView } from "./modules/dashboard/LogView";
import { MoreView } from "./modules/dashboard/MoreView";
import { TodayView } from "./modules/dashboard/TodayView";
import { EconomyView } from "./modules/economy/EconomyView";
import { removeAccountFromPlannerState, removeTransaction, transactionTouchesAccount, upsertTransaction } from "./modules/economy/economyModel";
import { GymView } from "./modules/gym/GymView";
import { HabitsView } from "./modules/habits/HabitsView";
import { NutritionView } from "./modules/nutrition/NutritionView";
import { ReviewsView } from "./modules/reviews/ReviewsView";
import { SettingsView } from "./modules/settings/SettingsView";
import { StudiesView } from "./modules/studies/StudiesView";
import { StatisticsView } from "./modules/statistics/StatisticsView";
import { RulesView } from "./modules/reference/RulesView";
import { SleepView } from "./modules/sleep/SleepView";

const activity = (kind, title, detail) => ({
  id: `activity-${crypto.randomUUID()}`,
  kind,
  title,
  detail,
  occurredAt: new Date().toISOString(),
});

export default function App() {
  const { user, authReady } = useAuth();
  const { state, update, replaceState, resetState, undo, undoInfo, error, syncStatus } = useAppStorage(user);
  const [route, setRoute] = useState("dashboard");
  const [goalEditor, setGoalEditor] = useState(null);
  const [quickGoal, setQuickGoal] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.theme = state?.profile.theme || "dark";
  }, [state?.profile.theme]);
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
    const known = availableModules(current).map((module) => module.id);
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

  const setContingency = (definition) => {
    if (!definition) {
      update((current) => ({ ...current, today: { ...current.today, contingency: null } }));
      return;
    }
    const entry = { id: `contingency-${crypto.randomUUID()}`, date: localISO(), mode: definition.id, label: definition.label, floorRules: definition.floorRules || {}, occurredAt: new Date().toISOString() };
    update((current) => ({
      ...current,
      today: { ...current.today, contingency: entry },
      contingency: {
        ...current.contingency,
        history: [...current.contingency.history.filter((item) => item.date !== entry.date), entry],
      },
    }), activity("contingency", `Contingency · ${definition.label}`, "Dagens plan växlade till floor-versioner"));
  };

  const views = {
    dashboard: <DashboardView state={state} onNavigate={setRoute} onOpenGoal={setGoalEditor} onQuickUpdate={setQuickGoal} onSetContingency={setContingency} onDismissAttention={(id) => update((current) => ({ ...current, today: { ...current.today, dismissed: { ...current.today.dismissed, [id]: true } } }))} />,
    dashboardSettings: <DashboardSettingsView state={state} onToggle={toggleWidget} onMove={moveWidget} />,
    today: <TodayView state={state} onToggle={toggleToday} onDismiss={(id) => update((current) => ({ ...current, today: { ...current.today, dismissed: { ...current.today.dismissed, [id]: true } } }))} onOpenGoal={setGoalEditor} />,
    goals: <GoalsView state={state} onCreate={() => setGoalEditor("new")} onEdit={setGoalEditor} onQuickUpdate={setQuickGoal} onChecklist={toggleChecklist} onArchive={archiveGoal} onPin={togglePin} onMovePin={movePin} />,
    log: <LogView onNavigate={setRoute} />,
    economy: <EconomyView state={state} onCreateGoal={() => setGoalEditor("new")} onOpenGoal={setGoalEditor} onUpsertTransaction={(transaction, editing) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: upsertTransaction(current.modules.economy.transactions, transaction) } } }),
      activity("economy", `${editing ? "Ändrad" : transaction.type === "deposit" ? "Insättning" : transaction.type === "withdrawal" ? "Uttag" : "Överföring"} · ${transaction.amount.toLocaleString("sv-SE")} kr`, transaction.note || "Saldo uppdaterat"),
    )} onDeleteTransaction={(transaction) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: removeTransaction(current.modules.economy.transactions, transaction.id) } } }),
      activity("economy", `Borttagen transaktion · ${transaction.amount.toLocaleString("sv-SE")} kr`, transaction.note || "Saldot räknades om"),
    )} onSaveAccount={(account, editing) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, accounts: { ...current.modules.economy.accounts, [account.id]: account } } } }),
      activity("economy", `${editing ? "Konto ändrat" : "Nytt konto"}: ${account.name}`, `Öppningssaldo ${account.openingBalance.toLocaleString("sv-SE")} kr`),
    )} onDeleteAccount={(account) => update(
      (current) => removeAccountFromPlannerState(current, account.id),
      activity("economy", `Konto borttaget: ${account.name}`, `${state.modules.economy.transactions.filter((transaction) => transactionTouchesAccount(transaction, account.id)).length} kopplade transaktioner togs bort · kan ångras`),
    )} />,
    gym: <GymView data={state.modules.gym} onSave={(workout) => update((current) => {
      const names = workout.exercises.map((exercise) => exercise.name);
      return { ...current, modules: { ...current.modules, gym: { ...current.modules.gym, exerciseCatalog: [...new Set([...current.modules.gym.exerciseCatalog, ...names])], workouts: [...current.modules.gym.workouts, workout] } } };
    }, activity("gym", `${workout.type}-pass`, workout.exercises.map((exercise) => exercise.name).join(", ")))} />,
    habits: <HabitsView data={state.modules.habits} onToggle={toggleHabit} onAdd={(habit) => update((current) => ({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, habits: [...current.modules.habits.habits, { id: `habit-${crypto.randomUUID()}`, ...habit, color: "#3ddc84", createdAt: new Date().toISOString() }] } } }), activity("habit", `Ny rutin: ${habit.name}`, habit.frequency === "weekly_target" ? `${habit.targetPerWeek} gånger per vecka` : "Never zero börjar idag"))} />,
    studies: <StudiesView data={state.modules.studies} onToggleRoadmap={(itemId) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: current.modules.studies.roadmap.map((item) => item.id === itemId ? { ...item, done: !item.done, completedAt: item.done ? null : new Date().toISOString() } : item) } } }), activity("study", "Roadmap uppdaterad", state.modules.studies.roadmap.find((item) => item.id === itemId)?.name || "Studieplan"))} onAddRoadmap={(name) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: [...current.modules.studies.roadmap, { id: `roadmap-${crypto.randomUUID()}`, name, done: false, createdAt: new Date().toISOString() }] } } }), activity("study", `Roadmap: ${name}`, "Nytt steg tillagt"))} onRemoveRoadmap={(itemId) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: current.modules.studies.roadmap.filter((item) => item.id !== itemId) } } }), activity("study", "Roadmap-steg borttaget", state.modules.studies.roadmap.find((item) => item.id === itemId)?.name || "Studieplan"))} onStart={(subject) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, activeSession: { id: `session-${crypto.randomUUID()}`, subject, startedAt: new Date().toISOString() } } } }))} onStop={(seconds) => update((current) => {
      const studies = current.modules.studies;
      const session = { ...studies.activeSession, endedAt: new Date().toISOString(), durationMinutes: Math.max(1, Math.round(seconds / 60)) };
      return { ...current, modules: { ...current.modules, studies: { sessions: [...studies.sessions, session], activeSession: null } } };
    }, activity("study", state.modules.studies.activeSession?.subject || "Deep work", `${Math.max(1, Math.round(seconds / 60))} minuter`))} />,
    nutrition: <NutritionView state={state} onSaveCalculation={(calculation) => update((current) => ({
      ...current,
      modules: { ...current.modules, nutrition: { ...current.modules.nutrition, calculations: [...current.modules.nutrition.calculations, calculation], latestCalculationId: calculation.id } },
    }), activity("nutrition", `Kaloriplan · ${calculation.calorieTarget.toLocaleString("sv-SE")} kcal`, `${calculation.inputs.weeklyRate} kg/vecka · ${calculation.pace.label}`))} onCreateGoal={(calculation) => {
      const goal = {
        id: `goal-${crypto.randomUUID()}`,
        name: `Nå ${calculation.inputs.targetWeight} kg`,
        moduleId: "nutrition",
        source: "manual",
        sourceId: "",
        type: "number",
        direction: "decrease",
        startValue: calculation.inputs.weight,
        targetValue: calculation.inputs.targetWeight,
        deadline: calculation.targetDate?.slice(0, 10) || "",
        category: "Nutrition",
        color: "#f472b6",
        unit: "kg",
        checklistItems: [],
        actionLabel: "Väg dig och logga veckomedel varje söndag",
        status: "active",
        startDate: localISO(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        achievedAt: null,
      };
      update((current) => ({ ...current, goals: { ...current.goals, [goal.id]: goal }, dashboard: { ...current.dashboard, pinnedGoalIds: [...current.dashboard.pinnedGoalIds, goal.id] } }), activity("goal", `Nytt mål: ${goal.name}`, "Skapat från nutrition-kalkylatorn"));
      setRoute("goals");
    }} />,
    sleep: <SleepView data={state.modules.sleep} onSave={(sleepLog) => update((current) => ({
      ...current,
      modules: {
        ...current.modules,
        sleep: { ...current.modules.sleep, logs: [...current.modules.sleep.logs, sleepLog] },
        personal: sleepLog.restingHeartRate ? { ...current.modules.personal, measurements: [...current.modules.personal.measurements, { id: `measurement-${crypto.randomUUID()}`, type: "resting_hr", value: sleepLog.restingHeartRate, unit: "bpm", date: sleepLog.date, createdAt: sleepLog.createdAt }] } : current.modules.personal,
      },
    }), activity("sleep", `Sömn · ${sleepLog.durationHours.toFixed(1)} h`, `${sleepLog.bedtime}–${sleepLog.wakeTime}${sleepLog.restingHeartRate ? ` · ${sleepLog.restingHeartRate} bpm` : ""}`))} />,
    reviews: <ReviewsView state={state} data={state.modules.reviews} onSave={(review) => update((current) => ({ ...current, modules: { ...current.modules, reviews: { entries: [...current.modules.reviews.entries, review] } } }), activity("review", `${review.type}-review`, "Reflektionen sparades"))} />,
    activity: <ActivityView state={state} />,
    statistics: <StatisticsView state={state} />,
    rules: <RulesView state={state} onNavigate={setRoute} />,
    account: <AccountView state={state} onUpdateProfile={(displayName) => update((current) => ({ ...current, profile: { ...current.profile, displayName } }))} />,
    settings: <SettingsView state={state} onUpdateProfile={(values) => update((current) => ({ ...current, profile: { ...current.profile, ...values } }))} onImport={replaceState} onReset={async (options) => { await resetState(options); setRoute("dashboard"); }} onReplayIntro={() => update((current) => ({ ...current, profile: { ...current.profile, onboardingComplete: false } }))} />,
    more: <MoreView state={state} onNavigate={setRoute} />,
  };

  return (
    <AppShell route={route} onNavigate={setRoute} syncStatus={syncStatus}>
      {views[route] || views.dashboard}
      {error && <div className="toast">{error}</div>}
      {goalEditor && <GoalForm state={state} goal={goalEditor === "new" ? null : goalEditor} onSave={saveGoal} onClose={() => setGoalEditor(null)} />}
      {quickGoal && <QuickGoalUpdate state={state} goal={quickGoal} onSave={logGoalValue} onClose={() => setQuickGoal(null)} />}
      {!state.profile.onboardingComplete && <OnboardingFlow onFinish={(nextRoute) => { update((current) => ({ ...current, profile: { ...current.profile, onboardingComplete: true } })); setRoute(nextRoute); }} />}
      {undoInfo && <div className="undo-toast"><span><strong>Sparat</strong>{undoInfo.label}</span><button onClick={undo}>Ångra</button></div>}
    </AppShell>
  );
}
