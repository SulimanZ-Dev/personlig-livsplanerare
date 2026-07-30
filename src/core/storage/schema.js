const now = () => new Date().toISOString();

export const PLAN_MILESTONES = [
  ["Jul 2026", "2026-07-31", 8804.07, "Glasögon betalda, kontanter fyllda"],
  ["Aug 2026", "2026-08-31", 12487.07, "Kreditkort + däck betalt"],
  ["Sep 2026", "2026-09-30", 56596.07, "Bil såld, buffert fylld"],
  ["Okt 2026", "2026-10-31", 58596.07, ""],
  ["Nov 2026", "2026-11-30", 60596.07, ""],
  ["Dec 2026", "2026-12-31", 62596.07, ""],
  ["Jan 2027", "2027-01-31", 64596.07, ""],
  ["Feb 2027", "2027-02-28", 66596.07, ""],
  ["Mar 2027", "2027-03-31", 68596.07, ""],
  ["Apr 2027", "2027-04-30", 83522.07, "Slutmål + skatteåterbäring"],
].map(([label, date, target, note], index) => ({ id: `milestone-${index}`, label, date, target, note }));

export const createInitialState = () => ({
  schemaVersion: 1,
  profile: { locale: "sv-SE", weekStartsOn: 1 },
  goals: {
    "goal-buffer": {
      id: "goal-buffer", moduleId: "economy", name: "Bygg buffert", type: "number",
      startValue: 3804.07, targetValue: 10000, unit: "kr", deadline: "2026-09-30",
      category: "Sparande", color: "#3ddc84", status: "active", createdAt: now(),
    },
    "goal-study": {
      id: "goal-study", moduleId: "studies", name: "Deep work per vecka", type: "number",
      startValue: 0, targetValue: 10, unit: "h", category: "Studier", color: "#5eb1ff",
      status: "active", createdAt: now(),
    },
  },
  goalEntries: {},
  modules: {
    economy: {
      accounts: {
        cash: { id: "cash", name: "Kontanter", balance: 5000, color: "#3ddc84" },
        buffer: { id: "buffer", name: "Buffert", balance: 3804.07, color: "#f0b429" },
        savings: { id: "savings", name: "Högränta", balance: 0, color: "#5eb1ff" },
      },
      transactions: [{ id: "tx-seed", accountId: "buffer", amount: 0, note: "Startläge efter juli", date: "2026-07-30" }],
      milestones: PLAN_MILESTONES,
    },
    gym: { workouts: [], exerciseCatalog: ["Bänkpress", "Knäböj", "Marklyft", "Axelpress", "Latsdrag"] },
    habits: {
      habits: [
        { id: "habit-sauna", name: "Sauna", color: "#f0b429", frequency: "daily", createdAt: now() },
        { id: "habit-sleep", name: "I säng före 23", color: "#5eb1ff", frequency: "daily", createdAt: now() },
      ],
      checkIns: [],
    },
    studies: { sessions: [], activeSession: null },
    reviews: { entries: [] },
  },
  meta: { createdAt: now(), updatedAt: now() },
});

