# Livssystem

En mobile-first personlig livsplanerare byggd med Vite och React. Appen samlar mål, ekonomi, gym, dagliga rutiner, deep work och återkommande reflektioner i ett gemensamt, terminalinspirerat gränssnitt.

## Funktioner

- Generiska mål av typen siffra, checklista eller streak
- Ekonomikonton, transaktionshistorik och dynamisk tidslinje
- Gympass med push/pull/legs och progressionsgraf per övning
- Dagliga rutiner med never-zero- och two-miss-princip
- Deep-work-timer och veckovis studietid
- Vecko-, månads- och kvartalsreview med historik
- Versionshanterad localStorage och migrering från `ekonomi-state-v1`
- Fungerar helt utan backend eller externt API

## Utveckling

```bash
npm install
npm run dev
```

Produktionsbygge:

```bash
npm run build
```

All användardata lagras lokalt i webbläsaren under nyckeln `life-planner:v1`.

## Installation

Webbappen finns på [personlig-livsplanerare.vercel.app](https://personlig-livsplanerare.vercel.app).

- På telefon: öppna länken och välj **Lägg till på hemskärmen**.
- På Windows: bygg den lilla Tauri-klienten med `npm run desktop:build`.

Windows-klienten laddar produktionsversionen från Vercel. När `main` uppdateras på GitHub bygger och publicerar Vercel automatiskt den senaste versionen utan att klienten behöver installeras om.

> Observera: appdata lagras fortfarande per enhet. Synkronisering mellan telefon och dator kräver ett autentiserat backend-lager.
