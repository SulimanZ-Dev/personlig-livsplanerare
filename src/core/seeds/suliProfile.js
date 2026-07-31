import { createInitialState } from "../storage/schema.js";

/**
 * Suli Operating System
 * ---------------------
 * Den här filen är avsiktligt separerad från createInitialState(). Den publika
 * produkten börjar alltid tom och visar onboarding. Suli-profilen kan i stället
 * exporteras till JSON och importeras manuellt via Inställningar > Importera.
 *
 * Alla id:n är stabila. Därmed blir seeden lätt att versionshantera, migrera och
 * så småningom lägga i en backend utan att UI-komponenterna känner till "Suli".
 */

export const SULI_PROFILE_SEED_VERSION = "2026.07.31";

const SEEDED_AT = "2026-07-31T12:00:00.000Z";

const goal = (values) => ({
  type: "number",
  direction: "increase",
  source: "manual",
  sourceId: "",
  startValue: 0,
  targetValue: 1,
  deadline: "",
  category: "Personligt",
  color: "#3ddc84",
  unit: "",
  checklistItems: [],
  actionLabel: "",
  floorAction: "Gör två minuter av nästa steg",
  status: "active",
  startDate: "2026-07-31",
  createdAt: SEEDED_AT,
  updatedAt: SEEDED_AT,
  achievedAt: null,
  ...values,
});

const checklistItem = (id, label, group) => ({ id, label, group, done: false });
const exercise = (id, name, sets, reps = 8, options = {}) => ({ id, name, sets, reps, ...options });

export function createSuliProfile() {
  const state = createInitialState();

  // A + C + J + K: identitet, exakt dagsrytm, fasintervall och ankare.
  state.profile = {
    ...state.profile,
    displayName: "Suli",
    onboardingComplete: true,
    seedProfileId: "suli-operating-system",
    seedVersion: SULI_PROFILE_SEED_VERSION,
    quietIndicatorsEnabled: true,
    phases: [
      { id: "foundation-sprint", name: "Fas 1 – Foundation Sprint", startDate: "2026-07-13", endDate: "2026-09-06", description: "Stabilisera sömn, träning, nutrition, studier och administration före programstart." },
      { id: "integration", name: "Fas 2 – Integration", startDate: "2026-09-07", endDate: "2027-06-30", description: "Integrera utbildning, certifieringar, hälsa och ett hållbart veckosystem." },
      { id: "launch", name: "Fas 3 – Launch", startDate: "2027-07-01", endDate: "2028-07-31", description: "Omsätt systemet i LIA, karriär, portfölj och långsiktig självständighet." },
    ],
    schedule: [
      { time: "09:00", endTime: "09:00", label: "Uppvakning", detail: "Fast ankare, även helger" },
      { time: "09:00", endTime: "09:30", label: "Morgonrutin", detail: "Vatten, lätt stretch, inget mobilscroll" },
      { time: "09:30", endTime: "10:00", label: "Frukost + dagsgenomgång", detail: "TickTick: dagens tre studieuppgifter" },
      { time: "10:00", endTime: "13:30", label: "Studieblock 1", detail: "Djupt fokus, svåraste materialet" },
      { time: "13:30", endTime: "14:00", label: "Paus", detail: "Promenad" },
      { time: "14:00", endTime: "15:00", label: "Lunch", detail: "Repeat meal" },
      { time: "15:00", endTime: "18:30", label: "Studieblock 2", detail: "Labs och hands-on" },
      { time: "18:30", endTime: "19:30", label: "Buffert / admin", detail: "KGYH, mail, praktiskt" },
      { time: "19:30", endTime: "20:00", label: "Resa till gym", detail: "Mentalt skifte" },
      { time: "20:00", endTime: "21:30", label: "Gym", detail: "Planerat pass eller floor" },
      { time: "21:30", endTime: "21:50", label: "Bastu", detail: "Dagligt återhämtningsankare" },
      { time: "21:50", endTime: "22:15", label: "Resa hem + dusch", detail: "Nedväxling" },
      { time: "22:15", endTime: "23:00", label: "Middag", detail: "Post-gym, dagens högsta protein" },
      { time: "23:00", endTime: "00:30", label: "Fri tid", detail: "Skyddad" },
      { time: "00:30", endTime: "01:00", label: "Nedvarvning", detail: "Mobil bort, dimmat ljus" },
      { time: "01:00", endTime: "09:00", label: "Sömn", detail: "Åtta timmar" },
    ],
    anchors: {
      morning: ["09:00 · vatten", "5–10 min mobility", "TickTick-koll: dagens tre"],
      evening: ["Mobil på laddare", "Kort dagsnotis", "Morgondagens tre uppgifter"],
    },
    productivity: {
      taskSystem: "TickTick",
      taskRule: "Enda tasklistan: tre studieuppgifter, gympass och övrigt.",
      calendarSystem: "Google Calendar",
      calendarRule: "Endast fasta ankare.",
      studyFloor: "Mobil borta under studieblocken.",
    },

    // M: KPI:erna är metadata. Statistikvyn räknar automatiskt de källor appen äger.
    kpis: [
      { id: "weight-trend", label: "Vikttrend", source: "measurement:weight", externalSource: "Garmin/manuell", cadence: "veckovis", unit: "kg", targetLabel: "trend, ej fast mål", note: "Veckomedel" },
      { id: "resting-hr", label: "Vilopuls", source: "measurement:resting_hr", externalSource: "Garmin", cadence: "veckovis", unit: "bpm", targetLabel: "trend nedåt", note: "Baseline 85–90" },
      { id: "gym-plan", label: "Pass genomförda vs plan", source: "gym_weekly", externalSource: "TickTick", cadence: "veckovis", unit: "pass", target: 5, note: "4–5 pass" },
      { id: "key-lifts", label: "Nyckellyft-progression", source: "manual", externalSource: "Manuell", cadence: "månadsvis", targetLabel: "positiv trend", note: "Prioritetslyft" },
      { id: "nutrition-days", label: "Dagar loggade kost", source: "nutrition_days", externalSource: "Egen app", cadence: "veckovis", unit: "dagar", target: 7, note: "Floor: största måltiden" },
      { id: "protein-average", label: "Proteinsnitt", source: "nutrition_protein", externalSource: "Egen app", cadence: "veckovis", unit: "g", targetLabel: "180–200 g", note: "Dagligt snitt" },
      { id: "bedtime-consistency", label: "Läggdags-konsistens", source: "manual", externalSource: "Garmin", cadence: "veckovis", targetLabel: "01:00 ±20 min", note: "Upp 09:00 flexar aldrig" },
      { id: "study-hours", label: "Studietimmar vs 40 h", source: "study_weekly", externalSource: "TickTick/manuell", cadence: "veckovis", unit: "h", target: 40, note: "Två deep-work-block" },
      { id: "cert-roadmap", label: "Certs/labs vs roadmap", source: "manual", externalSource: "Manuell", cadence: "månadsvis", target: 9, unit: "steg", note: "Fri ordning" },
      { id: "monthly-transfer", label: "2 000 kr-transfer skedde", source: "manual", externalSource: "Budget-app", cadence: "månadsvis", targetLabel: "ja", note: "Autotransfer" },
      { id: "net-worth", label: "Nettoförmögenhetstrend", source: "economy_total", externalSource: "Egen app", cadence: "månadsvis", unit: "kr", targetLabel: "trend uppåt", note: "Alla aktiva konton" },
      { id: "two-miss", label: "Two-miss-triggers", source: "manual", externalSource: "Manuell", cadence: "veckovis", unit: "triggers", target: 0, note: "Coachsignal, inte skuld" },
    ],
  };

  // Ekonomi: 60 000 kr är ett separat emergency fund och aldrig ett hårdkodat totalvärde.
  // Saldot beräknas alltid från openingBalance + redigerbara transaktioner.
  state.modules.economy = {
    accounts: {
      emergency: { id: "emergency", name: "Emergency fund", openingBalance: 60000, color: "#5eb1ff", archived: false, protected: true },
      activeSavings: { id: "activeSavings", name: "Aktivt sparande", openingBalance: 0, color: "#3ddc84", archived: false },
      spending: { id: "spending", name: "Flexkonto", openingBalance: 0, color: "#f0b429", archived: false },
    },
    transactions: [],
    milestones: [75000, 100000, 120000],
    monthlyPlan: {
      income: 4120,
      fixedExpenses: 599,
      guaranteedSavings: 2000,
      flex: 1521,
      autoTransferDay: 25,
      autoTransferAccountId: "activeSavings",
    },
  };

  // Mål: dynamiska datakällor används där appen äger datan. Checklistor är fria.
  state.goals = {
    "goal-savings": goal({ id: "goal-savings", name: "Bygg 120 000 kr kapital", moduleId: "economy", source: "economy_total", startValue: 60000, targetValue: 120000, deadline: "2028-07-31", category: "Ekonomi", unit: "kr", actionLabel: "För över 2 000 kr på autotransfer-dagen", floorAction: "Kontrollera att månadens transfer är planerad" }),
    "goal-study-week": goal({ id: "goal-study-week", name: "40 timmar deep work per vecka", moduleId: "studies", source: "study_weekly", targetValue: 40, category: "Studier", color: "#a78bfa", unit: "h", actionLabel: "Skydda blocken 10:00–13:30 och 15:00–18:30", floorAction: "30 minuter på svåraste ämnet" }),
    "goal-deload": goal({ id: "goal-deload", name: "Deload var 6–8:e vecka", moduleId: "gym", targetValue: 7, category: "Gym", color: "#5eb1ff", unit: "veckor", actionLabel: "Räkna träningsveckor och planera nästa deload", floorAction: "Skriv in nästa deload-vecka" }),
    "goal-preprogram": goal({
      id: "goal-preprogram",
      name: "90 dagar · pre-program sprint",
      moduleId: "personal",
      type: "checklist",
      direction: "increase",
      targetValue: 0,
      deadline: "2026-09-06",
      category: "Foundation Sprint",
      color: "#f0b429",
      actionLabel: "Välj valfri öppen punkt som minskar friktionen inför start",
      floorAction: "Gör en tvåminuters admin-action",
      checklistItems: [
        checklistItem("pre-bloodwork", "Boka bloodwork", "Vecka 1–4"),
        checklistItem("pre-garmin", "Beställ Garmin Fenix 8 Solar Sapphire", "Vecka 1–4"),
        checklistItem("pre-gym", "Starta 4-dagars gym-split 20:00–21:30", "Vecka 1–4"),
        checklistItem("pre-sauna", "Etablera daglig bastu", "Vecka 1–4"),
        checklistItem("pre-lifesum", "Börja Lifesum-loggning", "Vecka 1–4"),
        checklistItem("pre-sleep", "Flytta sovschema mot 01:00–09:00", "Vecka 1–4"),
        checklistItem("pre-kgyh", "Slutför KGYH-admin", "Vecka 1–4"),
        checklistItem("pre-az900", "AZ-900 lätt · 5–8 h/vecka", "Vecka 5–8"),
        checklistItem("pre-intensity", "Öka gym-intensitet kontrollerat", "Vecka 5–8"),
        checklistItem("pre-review-bloodwork", "Granska bloodwork", "Vecka 5–8"),
        checklistItem("pre-sim-one", "Full programdag-simulering 1", "Vecka 5–8"),
        checklistItem("pre-sim-two", "Full programdag-simulering 2", "Vecka 5–8"),
        checklistItem("pre-linux", "TryHackMe Linux fundamentals lätt", "Vecka 5–8"),
        checklistItem("pre-kickoff", "Bekräfta Göteborg-kickoff 27 aug", "Vecka 9 · 31 aug–6 sep"),
        checklistItem("pre-zoom", "Bekräfta Zoom-orientering 3 sep", "Vecka 9 · 31 aug–6 sep"),
        checklistItem("pre-routine", "Lås veckorutin", "Vecka 9 · 31 aug–6 sep"),
        checklistItem("pre-deload", "Genomför vilovecka", "Vecka 9 · 31 aug–6 sep"),
      ],
    }),
  };

  // E: veckokartan är referensdata. Den blockerar aldrig spontana justeringar.
  state.profile.weeklyRoutine = [
    { day: "Måndag", study: "Deep work · svåraste ämnet", training: "Push · 20:00–21:30" },
    { day: "Tisdag", study: "Labs / TryHackMe / HTB", training: "Pull · 20:00–21:30" },
    { day: "Onsdag", study: "Cert-repetition", training: "Legs · mid-week checkpoint" },
    { day: "Torsdag", study: "Deep work · andra svåra ämnet", training: "Vila · mobility/core 20–30 min" },
    { day: "Fredag", study: "Labs / portfolio", training: "Upper Focus" },
    { day: "Lördag", study: "Lätt repetition / catch-up", training: "Full Body + rodd/cykel · buffertdag" },
    { day: "Söndag", study: "Veckoreview 30 min + lätt planering", training: "Vila/bastu · flickvän-tid prioriteras" },
  ];

  // F: fem passmallar. Övningar är vanliga dataobjekt och kan ändras efter import.
  state.modules.gym = {
    workouts: [],
    exerciseCatalog: [],
    stepGoal: { start: 3000, targetMin: 6000, targetMax: 7000, progression: "gradvis" },
    restingHeartRateBaseline: { min: 85, max: 90, direction: "decrease" },
    mobility: { warmupMinutes: "5–10", everyWorkout: true, thursdayMinutes: "20–30", coreFinisher: true },
    cardioPreferences: ["Rodd", "Cykel"],
    excludedCardio: ["Löpning"],
    workoutTemplates: [
      { id: "template-push", dayLabel: "Måndag", type: "Push", durationMinutes: 90, exercises: [exercise("push-chest", "Machine chest press", 4, 8), exercise("push-fly", "Cable fly", 3, 12), exercise("push-shoulder", "Machine shoulder press", 4, 8, { priority: true }), exercise("push-lateral", "Cable lateral raise", 3, 12, { priority: true }), exercise("push-triceps", "Triceps pushdown", 3, 10), exercise("push-core", "Core-finisher", 3, 12)] },
      { id: "template-pull", dayLabel: "Tisdag", type: "Pull", durationMinutes: 90, exercises: [exercise("pull-lat", "Lat pulldown", 4, 8), exercise("pull-row", "Chest-supported row", 4, 8, { priority: true }), exercise("pull-cable", "Single-arm cable row", 3, 10), exercise("pull-rear", "Reverse pec deck", 3, 12, { priority: true }), exercise("pull-curl", "Dumbbell curl", 3, 10), exercise("pull-hammer", "Cable hammer curl", 3, 10), exercise("pull-core", "Core-finisher", 3, 12)] },
      { id: "template-legs", dayLabel: "Onsdag", type: "Legs", durationMinutes: 90, exercises: [exercise("legs-press", "Leg press", 4, 10, { priority: true }), exercise("legs-curl", "Seated leg curl", 4, 10), exercise("legs-extension", "Leg extension", 3, 12), exercise("legs-rdl", "Romanian deadlift", 3, 8, { priority: true }), exercise("legs-calf", "Calf raise", 4, 12), exercise("legs-core", "Core-finisher", 3, 12)] },
      { id: "template-upper", dayLabel: "Fredag", type: "Upper Focus", durationMinutes: 90, exercises: [exercise("upper-shoulder", "Machine shoulder press", 4, 8, { priority: true }), exercise("upper-chest", "Machine chest press", 3, 8), exercise("upper-lat", "Lat pulldown", 3, 8), exercise("upper-lateral", "Cable lateral raise", 4, 12, { priority: true }), exercise("upper-row", "Chest-supported row", 3, 8), exercise("upper-fly", "Cable fly", 2, 12), exercise("upper-arms", "Arm superset", 3, 10), exercise("upper-core", "Core-finisher", 3, 12)] },
      { id: "template-full", dayLabel: "Lördag", type: "Full Body + Cardio", durationMinutes: 90, exercises: [exercise("full-squat", "Goblet squat", 3, 10), exercise("full-chest", "Machine chest press", 3, 10), exercise("full-row", "Cable row", 3, 10), exercise("full-rdl", "Romanian deadlift", 3, 8), exercise("full-lateral", "Cable lateral raise", 3, 12), exercise("full-rower", "Rodd", 1, 10), exercise("full-bike", "Cykel", 1, 15), exercise("full-core", "Core-finisher", 3, 12)] },
    ],
  };

  // Rutiner: full-version + floor-version är den centrala never-zero-kontraktet.
  state.modules.habits = {
    habits: [
      { id: "habit-training", name: "Träning", frequency: "weekly_target", targetPerWeek: 5, fullVersion: "90 min planerat pass", minimumVersion: "10 min bodyweight", color: "#5eb1ff", createdAt: SEEDED_AT },
      { id: "habit-nutrition", name: "Nutrition tracking", frequency: "daily", fullVersion: "Hela dagen loggad", minimumVersion: "Logga största måltiden", color: "#f472b6", createdAt: SEEDED_AT },
      { id: "habit-study", name: "Studier", frequency: "daily", fullVersion: "7 h över två block", minimumVersion: "30 min på svåraste ämnet", color: "#a78bfa", createdAt: SEEDED_AT },
      { id: "habit-sleep", name: "Sömnrytm", frequency: "daily", fullVersion: "01:00–09:00", minimumVersion: "Upp 09:00 oavsett läggdags", color: "#7dd3fc", createdAt: SEEDED_AT },
      { id: "habit-sauna", name: "Bastu", frequency: "daily", fullVersion: "20 min", minimumVersion: "", color: "#f0b429", createdAt: SEEDED_AT },
    ],
    checkIns: [],
  };

  // G + B: kaloriräknaren startar med biometri men utan fast målvikt.
  state.modules.nutrition = {
    calculations: [],
    latestCalculationId: null,
    intakeLogs: [],
    supplementLibrary: [],
    profile: { height: 195, weight: 125, targetWeight: "", gender: "male", activity: "moderate", lossType: "fat", weeklyRate: 0.5, goal: "body_composition", proteinMin: 180, proteinMax: 200, waterLiters: "3–4", mealTimes: { breakfast: "09:30", lunch: "14:00", dinner: "22:15" }, rotationWeeks: "4–6", burgerPizzaPerMonth: 2, supplements: ["Proteinpulver", "Kreatin 3–5 g/dag", "Vitamin D"], exclusions: ["Fisk", "Skaldjur", "Alkohol"] },
    mealLibrary: [
      { meal: "Frukost", time: "09:30", options: ["Havregryn + kvarg + bär", "Ägg + fullkornsbröd + frukt", "Proteinshake + banan + havre", "Kvargskål + müsli", "Omelett + potatis", "Keso + frukt + nötter"] },
      { meal: "Lunch", time: "14:00", options: ["Kyckling + ris + grönsaker", "Kalkonfärs + pasta", "Nötfärs + potatis", "Kycklingwrap + yoghurt-dressing", "Chili på nötfärs + bönor", "Halloumi + bulgur + sallad"] },
      { meal: "Middag", time: "22:15", options: ["Kyckling + ris · extra protein", "Nötfärsbowl + potatis", "Kalkonpasta + kvarg-sås", "Ägg- och kycklingwrap", "Burgare inom 2×/månad-regeln", "Hemgjord pizza inom 2×/månad-regeln"] },
    ],
  };

  // H: sömnmodulen äger rytm och loggar, rutinen äger never-zero-kontraktet.
  state.modules.sleep = {
    logs: [],
    targetBedtime: "01:00",
    targetWakeTime: "09:00",
    shiftMethod: "Flytta 15–20 minuter var 3–4:e dag; 09:00 är ankaret.",
    rules: ["Morgonljus direkt efter uppvakning", "Mobil på laddare 30 min före läggdags", "Dim smart-lampa sista timmen"],
  };

  // I: fria roadmap-poster; UI:t tillåter valfri ordning och visar total progress.
  state.modules.studies = {
    sessions: [],
    activeSession: null,
    weeklyTargetHours: 40,
    blocks: [{ start: "10:00", end: "13:30", label: "Svåraste materialet · matte/logik" }, { start: "15:00", end: "18:30", label: "Labs · hands-on" }],
    noteStyle: "Kort och handlingsorienterad; repetition efter 24–48 h.",
    roadmap: ["AZ-900", "SC-900", "Linux fundamentals · TryHackMe", "CCSK study", "AZ-500", "CCSK exam", "SC-200", "AWS Cloud Practitioner", "AWS Security Specialty"].map((name, index) => ({ id: `cert-${index + 1}`, name, done: false, createdAt: SEEDED_AT })),
  };

  // N: seedens frågor ersätter enbart frågetext; review-motorn är fortfarande generell.
  state.modules.reviews = {
    entries: [],
    templates: {
      weekly: { label: "Vecka", depth: "Lätt", questions: ["KPI-koll: vad rörde sig?", "Nådde jag floor-versionerna?", "Triggades two-miss?", "Vilka tre studieprioriteringar gäller nästa vecka?", "Hur skyddar jag flickvän-tid nästa vecka?"] },
      monthly: { label: "Månad", depth: "Medel", questions: ["Vad visar vikt- och kroppskompositionstrenden?", "Hur rörde sig nyckellyften?", "Vad är nästa cert/lab i roadmapen?", "Skedde ekonomi-check och 2 000 kr-transfer?", "Triggades two-miss 2–3+ gånger — och vad ska förenklas?"] },
      quarterly: { label: "Kvartal", depth: "Djup", questions: ["Ligger systemet rätt mot Foundation Sprint → Integration → Launch?", "Ska gym-split eller nutrition omprövas?", "Är LIA- och karriärtimingen fortfarande rätt?", "Vilken större systemjustering ger mest effekt nästa kvartal?"] },
    },
  };

  // O: varje contingency-läge har specifika floor-regler, utöver generell fallback.
  state.contingency = {
    history: [],
    definitions: [
      { id: "sick", label: "Sjukdom", detail: "Återhämtning är dagens arbete. Ingen normal miss registreras.", floorRules: { default: "Vila, drick vatten och behåll uppvakningsankaret", habits: { "habit-training": "Vila eller 5 min lätt mobility", "habit-nutrition": "Logga största måltiden", "habit-study": "Ingen studieplikt; skriv nästa steg", "habit-sleep": "Upp 09:00 om kroppen tillåter" } } },
      { id: "travel", label: "Resa", detail: "Behåll ankaren och gör portabla floor-versioner.", floorRules: { default: "Gör en portabel 10-minutersversion", habits: { "habit-training": "10 min bodyweight eller promenad", "habit-nutrition": "Logga största måltiden", "habit-study": "30 min offline-repetition", "habit-sleep": "Behåll lokal 09:00-uppvakning" } } },
      { id: "low_motivation", label: "Låg motivation", detail: "Ingen omförhandling: floor räcker och bygger momentum.", floorRules: { default: "Gör minsta definierade version", habits: { "habit-training": "10 min bodyweight", "habit-nutrition": "Logga största måltiden", "habit-study": "30 min på svåraste ämnet", "habit-sleep": "Upp 09:00" } } },
      { id: "busy_week", label: "Genuint upptagen vecka", detail: "Skydda minimum och ta bort resten tillfälligt.", floorRules: { default: "Skydda bara dagens viktigaste ankare", habits: { "habit-training": "10 min bodyweight", "habit-nutrition": "Logga största måltiden", "habit-study": "30 min på svåraste ämnet", "habit-sleep": "Upp 09:00", "habit-sauna": "Bastu endast om den får plats naturligt" } } },
    ],
  };

  // P: read-only systemregler med navigerbara modulpekare.
  state.referenceRules = [
    { id: "rule-never-zero", title: "Never zero", detail: "Gör full version när du kan och floor-versionen när du måste.", moduleIds: ["habits"] },
    { id: "rule-two-miss", title: "Two-miss-trigger", detail: "En miss är data. Två i rad betyder: gör floor idag.", moduleIds: ["habits"] },
    { id: "rule-weight-trend", title: "Vikt är en trend", detail: "Beslut tas på veckotrend och kroppskomposition, inte en enskild vägning.", moduleIds: ["nutrition", "gym"] },
    { id: "rule-quarter", title: "Stora ändringar bara kvartalsvis", detail: "Undvik att skriva om systemet mitt i en dålig vecka.", moduleIds: ["reviews"] },
    { id: "rule-relationship", title: "Relation före träning", detail: "Flickvän-tid är en prioritet; använd contingency/floor när livet kräver det.", moduleIds: ["habits", "dashboard"] },
    { id: "rule-burger", title: "Burgare/pizza 2× per månad", detail: "Planerat, inbyggt och skuldfritt — inte ett systemfel.", moduleIds: ["nutrition"] },
    { id: "rule-wake", title: "Sömnens uppvakning flexar aldrig", detail: "09:00 är ankaret även när läggtiden blev sen.", moduleIds: ["sleep"] },
    { id: "rule-cert-labs", title: "Cert + labs ihop", detail: "Teori ska få en praktisk motsvarighet inom 24–48 timmar.", moduleIds: ["studies"] },
    { id: "rule-sauna", title: "Bastu dagligen", detail: "Bastu är ett återhämtningsankare kopplat till träning och rutin.", moduleIds: ["gym", "habits"] },
    { id: "rule-simplify", title: "Förenkla vid tvivel", detail: "Minska ytan innan du ökar pressen. Behåll bara det som styr beteende.", moduleIds: ["reviews"] },
  ];

  // L: ordningen gäller bara Suli-profilen. Publika användares default påverkas inte.
  state.dashboard = {
    pinnedGoalIds: ["goal-savings", "goal-preprogram", "goal-study-week"],
    hiddenWidgetIds: [],
    widgetOrder: ["phase", "economyMilestone", "gymStreak", "studyTarget", "twoMiss", "certRoadmap", "weightTrend", "restingHeartRate", "nutrition", "sleep", "habits", "reviews", "economy", "gym", "studies"],
    quickNavIds: ["nutrition", "economy", "gym", "habits", "studies", "sleep", "reviews", "statistics"],
  };

  // Startvärden för trendwidgets. De är historikposter, inte hårdkodade UI-siffror.
  state.modules.personal.measurements = [
    { id: "measurement-weight-start", type: "weight", value: 125, unit: "kg", date: "2026-07-31", createdAt: SEEDED_AT },
    { id: "measurement-rhr-start", type: "resting_hr", value: 88, unit: "bpm", date: "2026-07-31", createdAt: SEEDED_AT },
  ];

  state.activity = [{ id: "activity-suli-seed", kind: "system", title: "Suli Operating System laddat", detail: `Seed ${SULI_PROFILE_SEED_VERSION} · public appdata ersattes med den personliga profilen`, occurredAt: SEEDED_AT }];
  state.meta = { ...state.meta, createdAt: SEEDED_AT, updatedAt: SEEDED_AT, revision: 1, seedVersion: SULI_PROFILE_SEED_VERSION };

  return state;
}
