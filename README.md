# Livssystem

En mobile-first, local-first personlig livsplanerare med samma mörka terminalkänsla över webb, telefon och Windows.

## Det här ingår

- Generiska mål: mätvärde, minskningsmål, checklista och streak
- Dynamisk status: aktivt, på rätt väg, risk, försenat, uppnått och tappat efter uppnått
- Prognos, trend, nästa handling, daglig coachning och full progresshistorik
- Hybrid-dashboard med valbara, flyttbara mål och områdeswidgets
- Ekonomi med insättning, uttag, överföring, konton och dynamiska sparmål
- Gympass med valfria passnamn, övningar, set/reps/vikt och progressionsgraf
- Rutiner med never-zero, minsta version och two-miss-regel
- Deep-work-timer med veckosummering
- Vecko-, månads- och kvartalsreview med framåt/bakåt/stilla-insikter
- Publik nutrition-kalkylator med TDEE, underskott, protein och coach-varningar
- Full transaktions-CRUD med omräknade saldon, sökning och en nivås undo
- Förstagångs-onboarding, säker lokal/moln-reset och JSON-backup/import
- Samlade sexveckorstrender, ljust tema och lokala PWA-notiser
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
    settings/
    statistics/
    studies/
  components/          delade UI- och målkomponenter
```

Allt tillstånd har ett versionsfält (`schemaVersion`) och lagras lokalt under `life-planner:v2`. Inloggade användare får dessutom en privat molnkopia under sin Firebase-användare. Säkerhetsreglerna i `firestore.rules` tillåter endast ägaren.

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
```

Windows:

```bash
npm run desktop:build
```

## Publicering

Webbappen finns på [personlig-livsplanerare.vercel.app](https://personlig-livsplanerare.vercel.app). Vercel bygger automatiskt senaste `main`. PWA:n söker efter uppdateringar varje timme och Windows-klienten öppnar alltid produktionsversionen, så funktionerna hålls gemensamma mellan telefon, webbläsare och EXE.

Projektet använder Firebase Spark-planen och kräver ingen betaltjänst, AI-tjänst, reklam eller extern API-nyckel från användaren.
