# Iron Week

Single-user hypertrophy and shoulder-rehab workout planner.

## Stack

- React 18
- Vite
- Inline styles
- Tabler icons webfont
- `localStorage` persistence
- Static Vercel deployment

## Local Development

```bash
npm install
npm run dev
```

## App Source

The canonical `Iron Week Planner v4 - Calendar` artifact lives in `src/App.jsx`.

The temporary bench pause is applied:

- Move the barbell bench rehab exercise into a restorable `PAUSED_EXERCISES` constant or commented block.
- Promote neutral-grip dumbbell press to the primary Push / Upper A chest slot at `3x8-12`.
- Add the note: `Shoulder-friendly primary press while barbell bench is paused`.
- Add DB flyes as a secondary option at `3x10-15`.
- Keep the Review bench progression rules dormant for when barbell bench returns.

## Data

The app is still local-first and single-user. Check-in includes:

- Full JSON backup / restore for the browser's Iron Week data.
- MacroFactor CSV import from MacroFactor's Data Export screen.
- AI analysis export that includes workout logs, review data, check-ins, selected variations, and imported MacroFactor nutrition/weight data.

## Deployment

GitHub Pages deploys from `.github/workflows/deploy.yml`.
