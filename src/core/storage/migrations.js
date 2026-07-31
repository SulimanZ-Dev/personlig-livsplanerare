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
  if (input.schemaVersion === 2) {
    const base = createInitialState();
    return {
      ...base,
      ...input,
      profile: { ...base.profile, ...input.profile },
      dashboard: { ...base.dashboard, ...input.dashboard },
      today: { ...base.today, ...input.today },
      modules: {
        ...base.modules,
        ...input.modules,
        personal: { ...base.modules.personal, ...input.modules?.personal },
      },
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

