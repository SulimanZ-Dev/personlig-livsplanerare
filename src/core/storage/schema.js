import { localISO } from "../dates/dateUtils.js";

const now = () => new Date().toISOString();

export const GOAL_TEMPLATES = [
  { id: "savings", label: "Spara pengar", moduleId: "economy", source: "economy_total", type: "number", direction: "increase", unit: "kr", color: "#3ddc84", icon: "wallet" },
  { id: "weight", label: "Kroppsvikt", moduleId: "personal", source: "manual", type: "number", direction: "decrease", unit: "kg", color: "#a78bfa", icon: "trend" },
  { id: "nutrition", label: "Nutrition", moduleId: "nutrition", source: "manual", type: "number", direction: "decrease", unit: "kg", color: "#f472b6", icon: "nutrition" },
  { id: "reading", label: "Läsning", moduleId: "personal", source: "manual", type: "number", direction: "increase", unit: "böcker", color: "#5eb1ff", icon: "book" },
  { id: "study", label: "Studietid", moduleId: "studies", source: "study_weekly", type: "number", direction: "increase", unit: "h/vecka", color: "#5eb1ff", icon: "clock" },
  { id: "habit", label: "Ny vana", moduleId: "habits", source: "manual", type: "streak", direction: "increase", unit: "dagar", color: "#f0b429", icon: "flame" },
  { id: "project", label: "Projekt", moduleId: "personal", source: "manual", type: "checklist", direction: "increase", unit: "", color: "#3ddc84", icon: "target" },
  { id: "custom", label: "Eget mål", moduleId: "personal", source: "manual", type: "number", direction: "increase", unit: "", color: "#3ddc84", icon: "target" },
];

export const createInitialState = () => ({
  schemaVersion: 4,
  profile: {
    displayName: "",
    locale: "sv-SE",
    weekStartsOn: 1,
    coachMode: "direct",
    onboardingComplete: false,
    theme: "dark",
    quietIndicatorsEnabled: true,
    phases: [],
    schedule: [],
    anchors: { morning: [], evening: [] },
    kpis: [],
  },
  goals: {},
  goalEntries: {},
  today: { completions: {}, dismissed: {}, contingency: null },
  dashboard: {
    pinnedGoalIds: [],
    hiddenWidgetIds: [],
    widgetOrder: ["economy", "habits", "gym", "studies", "nutrition", "reviews"],
  },
  modules: {
    economy: {
      accounts: {
        cash: { id: "cash", name: "Kontanter", openingBalance: 0, color: "#3ddc84", archived: false },
        buffer: { id: "buffer", name: "Buffert", openingBalance: 0, color: "#f0b429", archived: false },
        savings: { id: "savings", name: "Högränta", openingBalance: 0, color: "#5eb1ff", archived: false },
      },
      transactions: [],
      milestones: [],
    },
    gym: { workouts: [], workoutTemplates: [], exerciseCatalog: ["Bänkpress", "Knäböj", "Marklyft", "Axelpress", "Latsdrag"] },
    habits: { habits: [], checkIns: [] },
    studies: { sessions: [], activeSession: null, roadmap: [] },
    reviews: { entries: [], templates: {} },
    nutrition: { calculations: [], latestCalculationId: null, profile: {}, mealLibrary: [] },
    sleep: { logs: [], targetBedtime: "", targetWakeTime: "" },
    personal: {
      measurements: [],
    },
  },
  contingency: {
    definitions: [
      { id: "sick", label: "Sjuk", detail: "Skydda återhämtningen och gör bara det som hjälper kroppen." },
      { id: "travel", label: "Resa", detail: "Behåll ankaret, släpp den vanliga strukturen för idag." },
      { id: "low_motivation", label: "Låg motivation", detail: "Gör floor-versionen och bygg momentum utan att förhandla." },
      { id: "busy_week", label: "Intensiv vecka", detail: "Miniminivå är planen. Allt extra är bonus." },
    ],
    history: [],
  },
  referenceRules: [],
  activity: [{
    id: "activity-welcome",
    kind: "system",
    title: "Livssystem startat",
    detail: "Skapa ditt första mål och gör planen till din.",
    occurredAt: now(),
  }],
  meta: {
    createdAt: now(),
    updatedAt: now(),
    revision: 1,
    deviceId: "",
    lastSyncedAt: null,
    lastOpenedDate: localISO(),
  },
});
