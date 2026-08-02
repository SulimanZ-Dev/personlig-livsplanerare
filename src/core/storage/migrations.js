import { createInitialState } from "./schema";

const clone = (value) => JSON.parse(JSON.stringify(value));

function migrateV1(v1) {
  const next = createInitialState();
  const oldEconomy = v1.modules?.economy || {};
  const oldAccounts = oldEconomy.accounts || {};

  next.profile = { ...next.profile, ...v1.profile, onboardingComplete: true };
  next.goals = clone(v1.goals || {});
  next.goalEntries = clone(v1.goalEntries || {});

  for (const [id, account] of Object.entries(oldAccounts)) {
    next.modules.economy.accounts[id] = {
      id,
      name: account.name || id,
      kind: account.kind || (id === "buffer" ? "buffer" : id === "savings" ? "savings" : "spending"),
      openingBalance: Number(account.balance ?? account.openingBalance) || 0,
      color: account.color || "#3ddc84",
      archived: false,
    };
  }

  next.modules.economy.transactions = (oldEconomy.transactions || []).map((transaction) => ({
    ...transaction,
    type: transaction.type || "legacy",
    affectsBalance: false,
  }));
  next.modules.economy.milestones = clone(oldEconomy.milestones || []);
  next.modules.gym = { ...next.modules.gym, ...(v1.modules?.gym || {}) };
  next.modules.habits = { ...next.modules.habits, ...(v1.modules?.habits || {}) };
  next.modules.studies = { ...next.modules.studies, ...(v1.modules?.studies || {}) };
  next.modules.reviews = { ...next.modules.reviews, ...(v1.modules?.reviews || {}) };
  next.meta = {
    ...next.meta,
    ...v1.meta,
    updatedAt: new Date().toISOString(),
    revision: (v1.meta?.revision || 0) + 1,
    migratedFrom: "life-planner:v1",
  };

  return next;
}

function migrateLegacyEconomy(legacy) {
  const next = createInitialState();
  next.profile.onboardingComplete = true;
  next.modules.economy.accounts.cash.openingBalance = Number(legacy.kontanter) || 0;
  next.modules.economy.accounts.buffer.openingBalance = Number(legacy.buffert) || 0;
  next.modules.economy.accounts.savings.openingBalance = Number(legacy.hogranta) || 0;
  next.modules.economy.transactions = (legacy.log || []).map((entry) => ({
    id: entry.id || `legacy-${crypto.randomUUID()}`,
    type: "legacy",
    accountId: entry.account || "buffer",
    amount: Number(entry.delta) || 0,
    note: entry.text || "Äldre historik",
    date: entry.date,
    occurredAt: `${entry.date || "2026-01-01"}T12:00:00.000Z`,
    affectsBalance: false,
  }));
  next.meta.migratedFrom = "ekonomi-state-v1";
  return next;
}

export function normalizeState(input) {
  if (!input) return createInitialState();
  if (input.schemaVersion >= 2) {
    const base = createInitialState();
    return {
      ...base,
      ...input,
      schemaVersion: 6,
      goalTemplates: input.goalTemplates || [],
      profile: {
        ...base.profile,
        ...input.profile,
        quietIndicatorsEnabled: input.profile?.quietIndicatorsEnabled ?? input.profile?.notificationsEnabled ?? true,
      },
      dashboard: {
        ...base.dashboard,
        ...input.dashboard,
        quickNavIds: [...new Set(["system", ...(input.dashboard?.quickNavIds || base.dashboard.quickNavIds)])],
      },
      today: { ...base.today, ...input.today },
      modules: {
        ...base.modules,
        ...input.modules,
        economy: {
          ...base.modules.economy,
          ...input.modules?.economy,
          accounts: Object.fromEntries(Object.entries(input.modules?.economy?.accounts || base.modules.economy.accounts).map(([id, account]) => [id, {
            ...account,
            kind: account.kind || (id === "buffer" ? "buffer" : id === "savings" ? "savings" : "spending"),
          }])),
        },
        gym: { ...base.modules.gym, ...input.modules?.gym },
        habits: { ...base.modules.habits, ...input.modules?.habits },
        studies: { ...base.modules.studies, ...input.modules?.studies },
        reviews: { ...base.modules.reviews, ...input.modules?.reviews },
        nutrition: { ...base.modules.nutrition, ...input.modules?.nutrition },
        sleep: { ...base.modules.sleep, ...input.modules?.sleep },
        personal: { ...base.modules.personal, ...input.modules?.personal },
      },
      contingency: {
        ...base.contingency,
        ...input.contingency,
        definitions: input.contingency?.definitions || base.contingency.definitions,
        history: input.contingency?.history || [],
      },
      planner: { ...base.planner, ...input.planner },
      projects: input.projects || [],
      lifeAdmin: { ...base.lifeAdmin, ...input.lifeAdmin },
      scenarios: input.scenarios || [],
      coach: { ...base.coach, ...input.coach, rules: input.coach?.rules || base.coach.rules },
      automations: { ...base.automations, ...input.automations, rules: input.automations?.rules || base.automations.rules },
      favorites: input.favorites || [],
      recentCaptures: input.recentCaptures || [],
      trash: (input.trash || []).filter((item) => !item.purgeAt || new Date(item.purgeAt) > new Date()),
      referenceRules: input.referenceRules || [],
      activity: input.activity || [],
      meta: { ...base.meta, ...input.meta },
    };
  }
  return migrateV1(input);
}

export function loadOrMigrate() {
  const current = window.localStorage.getItem("life-planner:v2");
  if (current) return normalizeState(JSON.parse(current));

  const v1 = window.localStorage.getItem("life-planner:v1");
  if (v1) return migrateV1(JSON.parse(v1));

  const legacy = window.localStorage.getItem("ekonomi-state-v1");
  if (legacy) return migrateLegacyEconomy(JSON.parse(legacy));

  return createInitialState();
}

