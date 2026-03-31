# VoltTrack

**Stack:** React 18, TypeScript, Vite, Gemini API  
**Live:** https://projects.slash301.com/VoltTrack/  
**Local:** `npm run dev` → http://localhost:5173  
**Env:** `GEMINI_API_KEY` in `.env.local`

## What it is
Prepaid electricity purchase logger and usage analyser. Log top-up amounts, track usage patterns, analyse costs over time. Gemini likely assists with usage forecasting or anomaly detection. Particularly relevant in South Africa's load-shedding context.

## Structure
- `App.tsx` — main shell
- `components/` — 9 tsx files: AddRecordForm, AiAnalysis, AnomalyAlert, CloudSync, ConfirmModal, HistoryTable, MonthlyAnalysis, SummaryCards, UsageChart
- `services/` — 2 ts files (Gemini + likely data service)
- `constants.ts` / `types.ts`
- `backup-local-20260220-140649/` — snapshot from Feb 2026

## State
Feature-rich for its scope. Has AI analysis, anomaly detection, cloud sync component, and usage charting. CloudSync component suggests data persistence beyond localStorage. Backup from Feb 2026 means recent active development.

## What needs work / next directions
- Verify CloudSync is wired up vs stub
- Load-shedding schedule integration (Eskom API or EskomSePush)
- Budget alerts (notify when on track to exceed monthly spend)
- Export to CSV/PDF for the month
