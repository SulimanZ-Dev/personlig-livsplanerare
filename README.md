# Livssystem

En mobile-first, local-first personlig livsplanerare med samma mörka terminalkänsla över webb, telefon och Windows.

## Livssystem 2.0

- Ett enda universellt **Logga +** för mat, vikt, gym, rutiner, studier och ekonomi, med favoriter och senaste val. Modulernas egna detaljknappar finns kvar.
- Generiska mål med öka/minska, checklista och streak; delmål, beroenden, anteckningar, länkar, mallar, paus, duplicering, prognos, status och 30 dagars papperskorg.
- Hybrid-dashboard byggd av verkliga mål- och modulwidgets. Användaren väljer ordning, storlek, sparade vyer och snabbgenvägar.
- Gemensam dag/vecka/månadskalender, inbox, regelbaserad coach, automationer, veckoplanerare, wellbeing, underhållslägen, projekt-Kanban, livsadmin och scenarier.
- Ekonomi med konto- och transaktions-CRUD, konto­typer, överföringar, budget, återkommande poster, avstämning, prenumerationer, prognos samt bank-CSV.
- Gym med passmallar, upprepning/redigering/radering, RPE/RIR, warmup-set, e1RM/PR, volym, progressionssignal, vilotimer, plattkalkylator, deload och ersättningsövningar.
- Nutrition med publik TDEE-kalkylator, coachvarningar, full kostdagbok, makron/tillskott, egna livsmedel per 100 g, fler-ingrediensrecept, portionsskalning, matplan, inköpslista, skafferi, vätska och veckosnitt.
- Rutiner med valfria veckodagar, full/floor/miss, never-zero, two-miss, paus, grupper, heatmap och enkla korrelationer.
- Studier med fri timer/Pomodoro, paus/fortsätt, planerad mot faktisk tid, projekt/ämne, certifieringsberoenden, resurser, provdatum och repetitionskö.
- Datadrivna vecko-, månads- och kvartalsreviews, samlad statistik, global sökning/kommandopalett, lokala PWA-notiser och ett konfigurerbart Idag-flöde.
- Upp till 20 session-undo-steg, fem automatiska lokala backuper, JSON import/export, modul-CSV, ljust/mörkt tema, densitet, textstorlek, kontrast, gester och lokalt PIN-lås.
- Säker lokal eller lokal+moln-reset med exakt `RADERA`-bekräftelse och ny onboarding.
- Offline-PWA och automatisk uppdatering när en ny version publiceras
- Gratis kontosynk via Firebase Authentication och Firestore
- Windows-klient som använder samma liveversion som webbappen

## Arkitektur

```text
src/
  app/                 modulregister
  core/
    dates/             datumhjälpare
    goals/             mål-, status-, prognos- och idagmotor
    system/            kalender, coachregler, sökning, automation och papperskorg
    security/          lokalt PIN-lås
    attention/         two-miss och diskreta review-indikatorer
    phases/            generisk fas- och dagberäkning
    seeds/             separata personliga seedprofiler
    storage/           schema, migrering och local-first-lagring
    sync/              autentisering och Firestore
  modules/
    account/
    dashboard/
    economy/
    gym/
    habits/
    reviews/
    nutrition/
    system/
    reference/
    settings/
    sleep/
    statistics/
    studies/
  components/          UI, mål, global capture, sökning och säkerhet
```

Allt tillstånd följer `schemaVersion: 6` och lagras lokalt under `life-planner:v2`. Modulerna skriver mot samma serialiserbara app-state, vilket gör ett senare backendbyte möjligt utan att domänlogiken behöver byggas om. Inloggade användare får dessutom en privat molnkopia under sin Firebase-användare. Säkerhetsreglerna i `firestore.rules` tillåter endast ägaren.

## Lokal utveckling

```bash
npm ci
copy .env.example .env.local
npm run dev
```

Fyll Firebase-webbkonfigurationen i `.env.local`. Appen fungerar även helt lokalt utan dessa värden.

Kvalitetskontroll:

```bash
npm run lint
npm test
npm run build
npm run seed:suli
```

Windows:

```bash
npm run desktop:build
```

## Suli Operating System

Den publika appen är tom från start. Den personliga profilen ligger separat i `src/core/seeds/suliProfile.js` och kan aldrig laddas som publik standarddata. Generera den portabla backupen med:

```bash
npm run seed:suli
```

Importera sedan `seeds/suli-operating-system.json` via **Inställningar → Importera backup**. Filen innehåller faser, 90-dagarssprint, ekonomi, passmallar, nutrition, sömn, studie-roadmap, reviews, contingency-regler och KPI-metadata.

## Publicering

Webbappen finns på [personlig-livsplanerare.vercel.app](https://personlig-livsplanerare.vercel.app). Vercel bygger automatiskt senaste `main`. PWA:n söker efter uppdateringar varje timme och Windows-klienten öppnar alltid produktionsversionen, så funktionerna hålls gemensamma mellan telefon, webbläsare och EXE.

Projektet använder Firebase Spark-planen och kräver ingen betaltjänst, AI-tjänst, reklam eller extern API-nyckel från användaren.
