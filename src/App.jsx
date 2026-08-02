import { useEffect, useState } from "react";
import { OnboardingFlow } from "./components/onboarding/OnboardingFlow";
import { GoalForm } from "./components/goals/GoalForm";
import { GoalsView } from "./components/goals/GoalsView";
import { QuickGoalUpdate } from "./components/goals/QuickGoalUpdate";
import { AppShell } from "./components/layout/AppShell";
import { QuickCaptureModal } from "./components/quickCapture/QuickCaptureModal";
import { CommandPalette } from "./components/search/CommandPalette";
import { LockScreen } from "./components/security/LockScreen";
import { localISO } from "./core/dates/dateUtils";
import { buildQuietIndicators } from "./core/attention/attentionEngine";
import { removeGoalFromPlannerState } from "./core/goals/goalEngine";
import { useAppStorage } from "./core/storage/useAppStorage";
import { useAuth } from "./core/sync/AuthContext";
import { hasLocalPin } from "./core/security/localLock";
import { applyAutomations, moveToTrash } from "./core/system/systemEngine";
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
import { removeNutritionEntry, upsertNutritionEntry } from "./modules/nutrition/nutritionModel";
import { ReviewsView } from "./modules/reviews/ReviewsView";
import { SettingsView } from "./modules/settings/SettingsView";
import { StudiesView } from "./modules/studies/StudiesView";
import { StatisticsView } from "./modules/statistics/StatisticsView";
import { RulesView } from "./modules/reference/RulesView";
import { SleepView } from "./modules/sleep/SleepView";
import { SystemView } from "./modules/system/SystemView";

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
  const [quickCapture, setQuickCapture] = useState(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [locked, setLocked] = useState(hasLocalPin);

  useEffect(() => {
    document.documentElement.dataset.theme = state?.profile.theme || "dark";
    document.documentElement.dataset.density = state?.profile.density || "comfortable";
    document.documentElement.dataset.textScale = state?.profile.textScale || "normal";
    document.documentElement.dataset.contrast = state?.profile.highContrast ? "high" : "normal";
  }, [state?.profile.theme, state?.profile.density, state?.profile.textScale, state?.profile.highContrast]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    if (!state?.profile.notificationsEnabled || !("Notification" in window) || Notification.permission !== "granted" || !("serviceWorker" in navigator)) return;
    const indicators = buildQuietIndicators(state).filter((item) => item.route === "habits" || item.route === "reviews");
    const pending = indicators.find((item) => !window.localStorage.getItem(`life-planner:notification:${localISO()}:${item.id}`));
    if (!pending) return;
    navigator.serviceWorker.ready.then((registration) => registration.showNotification("Livssystem", { body: pending.label, icon: "/icon.svg", tag: `livssystem-${pending.id}` })).then(() => window.localStorage.setItem(`life-planner:notification:${localISO()}:${pending.id}`, "sent")).catch(() => {});
  }, [state]);
  if (!state || !authReady) return <div className="loading"><i /></div>;
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />;

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
    const configured = current.dashboard.widgetOrder.includes(id);
    return {
      ...current,
      dashboard: {
        ...current.dashboard,
        widgetOrder: configured ? current.dashboard.widgetOrder : [...current.dashboard.widgetOrder, id],
        hiddenWidgetIds: !configured || hidden
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

  const toggleQuickNav = (id) => update((current) => {
    const shortcuts = current.dashboard.quickNavIds || [];
    return {
      ...current,
      dashboard: {
        ...current.dashboard,
        quickNavIds: shortcuts.includes(id) ? shortcuts.filter((shortcutId) => shortcutId !== id) : [...shortcuts, id],
      },
    };
  });

  const toggleHabit = (habitId, date = localISO(), level = "full") => update((current) => {
    const habits = current.modules.habits;
    const existing = habits.checkIns.find((item) => item.habitId === habitId && item.date === date);
    const done = level !== "missed";
    const checkIns = existing
      ? habits.checkIns.map((item) => item.id === existing.id ? { ...item, done: existing.level === level ? false : done, level: existing.level === level ? "none" : level } : item)
      : [...habits.checkIns, { id: `check-${crypto.randomUUID()}`, habitId, date, done, level }];
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

  const navigate = (nextRoute) => {
    if (nextRoute === "log") setQuickCapture("nutrition");
    else setRoute(nextRoute);
  };

  const mutateSystem = (recipe, title, detail = "") => update(recipe, activity("system", title, detail));

  const rememberCapture = (current, type, label, payload) => {
    const key = `${type}:${label.toLocaleLowerCase("sv-SE")}`;
    const recent = { key, type, label, payload, usedAt: new Date().toISOString() };
    return { ...current, recentCaptures: [recent, ...(current.recentCaptures || []).filter((item) => item.key !== key)].slice(0, 20) };
  };

  const capture = (type, payload) => update((current) => {
    const occurredAt = new Date().toISOString();
    if (type === "nutrition") {
      const entry = { id: `intake-${crypto.randomUUID()}`, ...payload, calories: Number(payload.calories) || 0, protein: Number(payload.protein) || 0, carbs: Number(payload.carbs) || 0, fat: Number(payload.fat) || 0, fiber: 0, occurredAt };
      let next = { ...current, modules: { ...current.modules, nutrition: { ...current.modules.nutrition, intakeLogs: [...current.modules.nutrition.intakeLogs, entry] } } };
      next = applyAutomations(next, { kind: "nutrition", date: payload.date });
      return rememberCapture(next, type, entry.name, { ...payload, name: entry.name });
    }
    if (type === "weight") {
      const measurement = { id: `measurement-${crypto.randomUUID()}`, type: "weight", value: Number(payload.value), unit: "kg", date: payload.date, note: payload.note, createdAt: occurredAt };
      const goalEntries = { ...current.goalEntries };
      Object.values(current.goals).filter((goal) => goal.status !== "archived" && goal.direction === "decrease" && goal.unit === "kg").forEach((goal) => {
        const entry = { id: `entry-${crypto.randomUUID()}`, goalId: goal.id, operation: "set", value: measurement.value, note: payload.note || "Vikt loggad via snabbknappen", occurredAt };
        goalEntries[entry.id] = entry;
      });
      const next = { ...current, goalEntries, modules: { ...current.modules, personal: { ...current.modules.personal, measurements: [...current.modules.personal.measurements, measurement] } } };
      return rememberCapture(next, type, `${measurement.value} kg`, { note: payload.note });
    }
    if (type === "gym") {
      const workout = { id: `workout-${crypto.randomUUID()}`, date: `${payload.date}T12:00:00`, type: payload.type, exercises: [{ id: `exercise-${crypto.randomUUID()}`, name: payload.exercise, weight: Number(payload.weight) || 0, reps: Number(payload.reps) || 1, sets: Number(payload.sets) || 1, rir: "", rpe: "", warmup: false }] };
      let next = { ...current, modules: { ...current.modules, gym: { ...current.modules.gym, exerciseCatalog: [...new Set([...current.modules.gym.exerciseCatalog, payload.exercise])], workouts: [...current.modules.gym.workouts, workout] } } };
      next = applyAutomations(next, { kind: "gym", date: payload.date });
      return rememberCapture(next, type, `${payload.type}: ${payload.exercise}`, payload);
    }
    if (type === "habit") {
      const existing = current.modules.habits.checkIns.find((item) => item.habitId === payload.habitId && item.date === payload.date);
      const checkIn = { id: existing?.id || `check-${crypto.randomUUID()}`, habitId: payload.habitId, date: payload.date, done: payload.level !== "missed", level: payload.level };
      const checkIns = existing ? current.modules.habits.checkIns.map((item) => item.id === existing.id ? checkIn : item) : [...current.modules.habits.checkIns, checkIn];
      const habit = current.modules.habits.habits.find((item) => item.id === payload.habitId);
      return rememberCapture({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, checkIns } } }, type, habit?.name || "Rutin", payload);
    }
    if (type === "study") {
      const session = { id: `session-${crypto.randomUUID()}`, subject: payload.subject, project: payload.project, startedAt: `${payload.date}T12:00:00`, endedAt: `${payload.date}T12:00:00`, durationMinutes: Number(payload.durationMinutes) || 1 };
      return rememberCapture({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, sessions: [...current.modules.studies.sessions, session] } } }, type, payload.subject, payload);
    }
    const transaction = { id: `transaction-${crypto.randomUUID()}`, type: payload.type, amount: Math.abs(Number(payload.amount) || 0), accountId: payload.accountId, fromAccountId: payload.type === "transfer" ? payload.accountId : undefined, toAccountId: payload.type === "transfer" ? payload.toAccountId : undefined, date: payload.date, note: payload.note, occurredAt, affectsBalance: true };
    return rememberCapture({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: [...current.modules.economy.transactions, transaction] } } }, type, payload.note || `${transaction.amount} kr`, payload);
  }, activity(type, "Snabbloggning sparad", type === "nutrition" ? payload.name : type === "weight" ? `${payload.value} kg` : type));

  const toggleFavorite = (choice) => update((current) => {
    const favorites = current.favorites || [];
    return { ...current, favorites: favorites.some((item) => item.key === choice.key) ? favorites.filter((item) => item.key !== choice.key) : [{ ...choice, favorite: undefined }, ...favorites].slice(0, 12) };
  });

  const resizeWidget = (id) => update((current) => {
    const sizes = ["small", "wide", "detailed"];
    const currentSize = current.dashboard.widgetSizes?.[id] || "small";
    return { ...current, dashboard: { ...current.dashboard, widgetSizes: { ...(current.dashboard.widgetSizes || {}), [id]: sizes[(sizes.indexOf(currentSize) + 1) % sizes.length] } } };
  });

  const restoreTrash = (item) => update((current) => {
    let next = { ...current, trash: current.trash.filter((entry) => entry.id !== item.id) };
    if (item.kind === "goal") next = { ...next, goals: { ...next.goals, [item.entity.id]: item.entity }, goalEntries: { ...next.goalEntries, ...(item.context.goalEntries || {}) } };
    if (item.kind === "transaction") next = { ...next, modules: { ...next.modules, economy: { ...next.modules.economy, transactions: [...next.modules.economy.transactions, item.entity] } } };
    if (item.kind === "nutrition") next = { ...next, modules: { ...next.modules, nutrition: { ...next.modules.nutrition, intakeLogs: [...next.modules.nutrition.intakeLogs, item.entity] } } };
    if (item.kind === "workout") next = { ...next, modules: { ...next.modules, gym: { ...next.modules.gym, workouts: [...next.modules.gym.workouts, item.entity] } } };
    if (item.kind === "habit") next = { ...next, modules: { ...next.modules, habits: { ...next.modules.habits, habits: [...next.modules.habits.habits, item.entity], checkIns: [...next.modules.habits.checkIns, ...(item.context.checkIns || [])] } } };
    return next;
  }, activity("system", "Återställd från papperskorgen", item.entity?.name || item.entity?.type || item.kind));

  const views = {
    dashboard: <DashboardView state={state} onNavigate={navigate} onOpenGoal={setGoalEditor} onQuickUpdate={setQuickGoal} onSetContingency={setContingency} onDismissAttention={(id) => update((current) => ({ ...current, today: { ...current.today, dismissed: { ...current.today.dismissed, [id]: true } } }))} />,
    dashboardSettings: <DashboardSettingsView state={state} onToggle={toggleWidget} onMove={moveWidget} onReorder={(id, targetId) => update((current) => { const order = [...current.dashboard.widgetOrder]; const from = order.indexOf(id), to = order.indexOf(targetId); if (from < 0 || to < 0) return current; order.splice(to, 0, order.splice(from, 1)[0]); return { ...current, dashboard: { ...current.dashboard, widgetOrder: order } }; })} onResize={resizeWidget} onToggleQuickNav={toggleQuickNav} onSaveView={(name) => update((current) => {
      const view = { id: `view-${crypto.randomUUID()}`, name, widgetOrder: [...current.dashboard.widgetOrder], hiddenWidgetIds: [...current.dashboard.hiddenWidgetIds], widgetSizes: { ...current.dashboard.widgetSizes }, quickNavIds: [...current.dashboard.quickNavIds] };
      return { ...current, dashboard: { ...current.dashboard, savedViews: [...current.dashboard.savedViews, view], activeSavedViewId: view.id } };
    }, activity("system", `Sparad vy: ${name}`, "Dashboardlayouten sparades"))} onApplyView={(id) => update((current) => {
      const view = current.dashboard.savedViews.find((item) => item.id === id);
      return view ? { ...current, dashboard: { ...current.dashboard, widgetOrder: [...view.widgetOrder], hiddenWidgetIds: [...view.hiddenWidgetIds], widgetSizes: { ...view.widgetSizes }, quickNavIds: [...view.quickNavIds], activeSavedViewId: id } } : current;
    })} onDeleteView={(id) => update((current) => ({ ...current, dashboard: { ...current.dashboard, savedViews: current.dashboard.savedViews.filter((item) => item.id !== id), activeSavedViewId: current.dashboard.activeSavedViewId === id ? "" : current.dashboard.activeSavedViewId } }))} />,
    today: <TodayView state={state} onToggle={toggleToday} onDismiss={(id) => update((current) => ({ ...current, today: { ...current.today, dismissed: { ...current.today.dismissed, [id]: true } } }))} onOpenGoal={setGoalEditor} />,
    goals: <GoalsView state={state} onCreate={() => setGoalEditor("new")} onEdit={setGoalEditor} onQuickUpdate={setQuickGoal} onChecklist={toggleChecklist} onArchive={archiveGoal} onPause={(goal) => update((current) => ({ ...current, goals: { ...current.goals, [goal.id]: { ...current.goals[goal.id], status: goal.status === "paused" ? "active" : "paused", pausedAt: goal.status === "paused" ? null : new Date().toISOString() } } }), activity("goal", `${goal.status === "paused" ? "Återupptaget" : "Pausat"}: ${goal.name}`, "Historiken och progressen behålls"))} onDuplicate={(goal) => update((current) => {
      const id = `goal-${crypto.randomUUID()}`;
      const copy = { ...goal, id, name: `${goal.name} kopia`, status: "active", achievedAt: null, archivedAt: null, pausedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), checklistItems: (goal.checklistItems || []).map((item) => ({ ...item, id: `item-${crypto.randomUUID()}`, done: false })), milestones: (goal.milestones || []).map((item) => ({ ...item, id: `milestone-${crypto.randomUUID()}` })) };
      return { ...current, goals: { ...current.goals, [id]: copy } };
    }, activity("goal", `Duplicerat: ${goal.name}`, "En fristående kopia skapades"))} onSaveTemplate={(goal) => update((current) => {
      const { id: ignoredId, createdAt: ignoredCreatedAt, updatedAt: ignoredUpdatedAt, achievedAt: ignoredAchievedAt, archivedAt: ignoredArchivedAt, ...snapshot } = goal;
      void ignoredId; void ignoredCreatedAt; void ignoredUpdatedAt; void ignoredAchievedAt; void ignoredArchivedAt;
      const template = { id: `goal-template-${crypto.randomUUID()}`, label: goal.name, icon: "target", snapshot: { ...snapshot, checklistText: (goal.checklistItems || []).map((item) => item.label).join("\n"), milestonesText: (goal.milestones || []).map((item) => `${item.value}|${item.label}`).join("\n"), linksText: (goal.links || []).join("\n") } };
      return { ...current, goalTemplates: [...current.goalTemplates, template] };
    }, activity("goal", `Målmall sparad: ${goal.name}`, "Tillgänglig när du skapar nästa mål"))} onDelete={(goal) => update((current) => {
      const goalEntries = Object.fromEntries(Object.entries(current.goalEntries).filter(([, entry]) => entry.goalId === goal.id));
      return moveToTrash(removeGoalFromPlannerState(current, goal.id), "goal", goal, { goalEntries });
    }, activity("goal", `Mål flyttat till papperskorgen: ${goal.name}`, "Kan återställas i 30 dagar"))} onPin={togglePin} onMovePin={movePin} />,
    log: <LogView onNavigate={(id) => setQuickCapture(id === "goals" ? "weight" : id)} />,
    economy: <EconomyView state={state} onMutate={mutateSystem} onCreateGoal={() => setGoalEditor("new")} onOpenGoal={setGoalEditor} onUpsertTransaction={(transaction, editing) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: upsertTransaction(current.modules.economy.transactions, transaction) } } }),
      activity("economy", `${editing ? "Ändrad" : transaction.type === "deposit" ? "Insättning" : transaction.type === "withdrawal" ? "Uttag" : "Överföring"} · ${transaction.amount.toLocaleString("sv-SE")} kr`, transaction.note || "Saldo uppdaterat"),
    )} onDeleteTransaction={(transaction) => update(
      (current) => moveToTrash({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, transactions: removeTransaction(current.modules.economy.transactions, transaction.id) } } }, "transaction", transaction),
      activity("economy", `Transaktion till papperskorgen · ${transaction.amount.toLocaleString("sv-SE")} kr`, "Saldot räknades om · återställbar i 30 dagar"),
    )} onSaveAccount={(account, editing) => update(
      (current) => ({ ...current, modules: { ...current.modules, economy: { ...current.modules.economy, accounts: { ...current.modules.economy.accounts, [account.id]: account } } } }),
      activity("economy", `${editing ? "Konto ändrat" : "Nytt konto"}: ${account.name}`, `Öppningssaldo ${account.openingBalance.toLocaleString("sv-SE")} kr`),
    )} onDeleteAccount={(account) => update(
      (current) => removeAccountFromPlannerState(current, account.id),
      activity("economy", `Konto borttaget: ${account.name}`, `${state.modules.economy.transactions.filter((transaction) => transactionTouchesAccount(transaction, account.id)).length} kopplade transaktioner togs bort · kan ångras`),
    )} />,
    gym: <GymView data={state.modules.gym} onMutate={mutateSystem} onSave={(workout, editing) => update((current) => {
      const names = workout.exercises.map((exercise) => exercise.name);
      const workouts = editing ? current.modules.gym.workouts.map((item) => item.id === workout.id ? workout : item) : [...current.modules.gym.workouts, workout];
      return applyAutomations({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, exerciseCatalog: [...new Set([...current.modules.gym.exerciseCatalog, ...names])], workouts } } }, { kind: "gym", date: localISO(new Date(workout.date)) });
    }, activity("gym", `${editing ? "Ändrat" : "Loggat"} ${workout.type}-pass`, workout.exercises.map((exercise) => exercise.name).join(", ")))} onDelete={(workout) => update((current) => moveToTrash({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, workouts: current.modules.gym.workouts.filter((item) => item.id !== workout.id) } } }, "workout", workout), activity("gym", `${workout.type} till papperskorgen`, "Återställbar i 30 dagar"))} onSaveTemplate={(template) => update((current) => ({ ...current, modules: { ...current.modules, gym: { ...current.modules.gym, workoutTemplates: current.modules.gym.workoutTemplates.some((item) => item.id === template.id) ? current.modules.gym.workoutTemplates.map((item) => item.id === template.id ? template : item) : [...current.modules.gym.workoutTemplates, template] } } }), activity("gym", `Passmall sparad: ${template.type}`, `${template.exercises.length} övningar`))} />,
    habits: <HabitsView data={state.modules.habits} onToggle={toggleHabit} onSave={(habit, editing) => update((current) => ({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, habits: editing ? current.modules.habits.habits.map((item) => item.id === habit.id ? habit : item) : [...current.modules.habits.habits, habit] } } }), activity("habit", `${editing ? "Rutin ändrad" : "Ny rutin"}: ${habit.name}`, habit.minimumVersion || "Never zero börjar idag"))} onDelete={(habit) => update((current) => {
      const checkIns = current.modules.habits.checkIns.filter((item) => item.habitId === habit.id);
      return moveToTrash({ ...current, modules: { ...current.modules, habits: { ...current.modules.habits, habits: current.modules.habits.habits.filter((item) => item.id !== habit.id), checkIns: current.modules.habits.checkIns.filter((item) => item.habitId !== habit.id) } } }, "habit", habit, { checkIns });
    }, activity("habit", `${habit.name} till papperskorgen`, "Kan återställas i 30 dagar"))} />,
    studies: <StudiesView data={state.modules.studies} onMutate={mutateSystem} onToggleRoadmap={(itemId) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: current.modules.studies.roadmap.map((item) => item.id === itemId ? { ...item, done: !item.done, completedAt: item.done ? null : new Date().toISOString() } : item) } } }), activity("study", "Roadmap uppdaterad", state.modules.studies.roadmap.find((item) => item.id === itemId)?.name || "Studieplan"))} onAddRoadmap={(roadmapItem) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: [...current.modules.studies.roadmap, { id: `roadmap-${crypto.randomUUID()}`, ...roadmapItem, name: roadmapItem.name.trim(), done: false, createdAt: new Date().toISOString() }] } } }), activity("study", `Roadmap: ${roadmapItem.name}`, "Nytt steg tillagt"))} onRemoveRoadmap={(itemId) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, roadmap: current.modules.studies.roadmap.filter((item) => item.id !== itemId) } } }), activity("study", "Roadmap-steg borttaget", state.modules.studies.roadmap.find((item) => item.id === itemId)?.name || "Studieplan"))} onStart={(session) => update((current) => ({ ...current, modules: { ...current.modules, studies: { ...current.modules.studies, timerMode: session.mode, pomodoroMinutes: session.pomodoroMinutes, activeSession: { id: `session-${crypto.randomUUID()}`, subject: session.subject, project: session.project, mode: session.mode, pomodoroMinutes: session.pomodoroMinutes, totalPausedMs: 0, pausedAt: null, startedAt: new Date().toISOString() } } } }))} onPause={() => update((current) => {
      const active = current.modules.studies.activeSession;
      if (!active) return current;
      const activeSession = active.pausedAt ? { ...active, totalPausedMs: Number(active.totalPausedMs || 0) + Date.now() - new Date(active.pausedAt).getTime(), pausedAt: null } : { ...active, pausedAt: new Date().toISOString() };
      return { ...current, modules: { ...current.modules, studies: { ...current.modules.studies, activeSession } } };
    })} onStop={(seconds) => update((current) => {
      const studies = current.modules.studies;
      const session = { ...studies.activeSession, endedAt: new Date().toISOString(), durationMinutes: Math.max(1, Math.round(seconds / 60)) };
      return { ...current, modules: { ...current.modules, studies: { sessions: [...studies.sessions, session], activeSession: null } } };
    }, activity("study", state.modules.studies.activeSession?.subject || "Deep work", `${Math.max(1, Math.round(seconds / 60))} minuter`))} />,
    nutrition: <NutritionView state={state} onMutate={mutateSystem} onSaveIntake={(entry, editing) => update((current) => applyAutomations({
      ...current,
      modules: { ...current.modules, nutrition: { ...current.modules.nutrition, intakeLogs: upsertNutritionEntry(current.modules.nutrition.intakeLogs, entry) } },
    }, { kind: "nutrition", date: entry.date }), activity("nutrition", `${editing ? "Intag ändrat" : entry.kind === "supplement" ? "Tillskott" : "Mat"}: ${entry.name}`, entry.kind === "supplement" ? entry.dose || "Loggat" : `${entry.calories.toLocaleString("sv-SE")} kcal · ${entry.protein} g protein`))} onDeleteIntake={(entry) => update((current) => moveToTrash({
      ...current,
      modules: { ...current.modules, nutrition: { ...current.modules.nutrition, intakeLogs: removeNutritionEntry(current.modules.nutrition.intakeLogs, entry.id) } },
    }, "nutrition", entry), activity("nutrition", `Intag till papperskorgen: ${entry.name}`, "Dagens makron räknades om · återställbar i 30 dagar"))} onSaveCalculation={(calculation) => update((current) => ({
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
    rules: <RulesView state={state} onNavigate={navigate} />,
    system: <SystemView state={state} onMutate={mutateSystem} onNavigate={navigate} onRestoreTrash={restoreTrash} onDeleteTrash={(id) => update((current) => ({ ...current, trash: current.trash.filter((item) => item.id !== id) }), activity("system", "Papperskorgspost raderad permanent", "Kan inte återställas"))} />,
    account: <AccountView state={state} onUpdateProfile={(displayName) => update((current) => ({ ...current, profile: { ...current.profile, displayName } }))} />,
    settings: <SettingsView state={state} onUpdateProfile={(values) => update((current) => ({ ...current, profile: { ...current.profile, ...values } }))} onImport={replaceState} onLockNow={() => setLocked(true)} onReset={async (options) => { await resetState(options); setRoute("dashboard"); }} onReplayIntro={() => update((current) => ({ ...current, profile: { ...current.profile, onboardingComplete: false } }))} />,
    more: <MoreView state={state} onNavigate={navigate} />,
  };

  return (
    <AppShell route={route} onNavigate={navigate} onOpenSearch={() => setCommandOpen(true)} syncStatus={syncStatus} quickNavIds={state.dashboard.quickNavIds}>
      {views[route] || views.dashboard}
      {error && <div className="toast">{error}</div>}
      {goalEditor && <GoalForm state={state} goal={goalEditor === "new" ? null : goalEditor} onSave={saveGoal} onClose={() => setGoalEditor(null)} />}
      {quickGoal && <QuickGoalUpdate state={state} goal={quickGoal} onSave={logGoalValue} onClose={() => setQuickGoal(null)} />}
      {quickCapture && <QuickCaptureModal state={state} initialType={quickCapture} onClose={() => setQuickCapture(null)} onCapture={capture} onToggleFavorite={toggleFavorite} />}
      {commandOpen && <CommandPalette state={state} onClose={() => setCommandOpen(false)} onNavigate={navigate} onQuickCapture={setQuickCapture} />}
      {!state.profile.onboardingComplete && <OnboardingFlow onFinish={(nextRoute) => { update((current) => ({ ...current, profile: { ...current.profile, onboardingComplete: true } })); setRoute(nextRoute); }} />}
      {undoInfo && <div className="undo-toast"><span><strong>Sparat · {undoInfo.count || 1} steg kan ångras</strong>{undoInfo.label}</span><button onClick={undo}>Ångra</button></div>}
    </AppShell>
  );
}
