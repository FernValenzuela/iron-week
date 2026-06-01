---
phase: "01-v2-features"
plan: "01"
title: "Schema v3 migration, planMode, custom plans data layer, tab scaffolding"
status: complete
commit_hashes:
  - "7ccc473 — feat(plans): add customPlans helpers and PlansTab/ProgressTab stubs (T05)"
  - "2ef23a6 — feat(schema): add module-scope migrateSchema() for v2 -> v3 (T01)"
  - "476290b — feat(state): replace usePlanA with planMode + customPlans state (T02)"
  - "a28b6f9 — feat(backup): bump schemaVersion to 3 with planMode + customPlans (T03)"
  - "2df5a24 — feat(tabs): wire Plans + Progress tabs into TABS array and render switch (T04)"
tasks_completed:
  - T01
  - T02
  - T03
  - T04
  - T05
files_modified:
  - "src/App.jsx"
  - "src/PlansTab.jsx (new)"
  - "src/ProgressTab.jsx (new)"
  - "src/customPlans.js (new)"
deviations:
  - "T05 was committed first, before T01-T04 on App.jsx. Rationale: the stubs and customPlans.js are pure new files with no dependencies, so landing them first kept each subsequent App.jsx commit buildable in isolation."
  - "Added a small EmptyPlanNotice component in App.jsx (rendered when planMode='custom' and customPlans=[]). The plan allowed an empty state ('UI may show empty state — that is acceptable'); the notice avoids a runtime crash from plan[idx % 0] and gives the user a path to the Plans tab."
  - "ReviewTab's apply() leaves planMode untouched when the user is on a custom plan, so weekly review recs do not silently kick the user out of custom mode. Plan A/B suggestions still apply when planMode is 'planA' or 'planB'."
---

# Plan 01 Summary: Schema v3 Migration + Tab Scaffolding

## Tasks Completed

### T01 — Module-scope migrateSchema()
`migrateSchema()` lives above `App` in `src/App.jsx` and runs once on module
load. It reads `iw_schema_version` (default 1) and, if less than 3:
- derives `planMode` from `usePlanA` (default true → 'planA') only if `planMode`
  is missing — so it does not clobber a user who already migrated;
- seeds `iw_custom_plans` to `[]` only if missing;
- bumps `iw_schema_version` to 3.

The original `usePlanA` key is left untouched so a v2 backup file can still be
restored.

### T02 — planMode + customPlans state slices
`App` now owns two new state slices:
- `planMode` (`'planA' | 'planB' | 'custom'`), initialised from
  `ls.get('planMode','planA')`, persisted via a dedicated `useEffect`.
- `customPlans`, initialised from `ls.get('iw_custom_plans',[])`, persisted
  the same way.

`basePlan` derivation now branches on `planMode`:
- `'custom'` → map `customPlans` into `{id,label,tag,exercises}` shape so
  `selectWorkoutVariant` works unchanged;
- `'planB'` → `PLAN_3`;
- default → `PLAN_4`.

`currentWorkout` and `logKey` are guarded for the empty-custom-plan case to
avoid `plan[idx % 0]`.

### T03 — Backup / restore / AI export at schemaVersion 3
- `buildBackup({...,planMode,customPlans,...})` returns `schemaVersion: 3`
  with both new fields inside `data`.
- `buildAiExport` accepts `planMode` and produces `activePlan` via a
  `PLAN_MODE_LABEL` map (`planA → "Plan A - 4 day"`, `planB → "Plan B - 3 day"`,
  `custom → "Custom"`).
- `restoreBackup` prefers `data.planMode` when present; on a v2 payload it
  falls back to `data.usePlanA ? 'planA' : 'planB'`. It also accepts
  `data.customPlans` when it is an array.
- Header pill in `App` renders `'Custom' | 'Plan B · 3-day' | 'Plan A · 4-day'`
  based on `planMode`.
- `CheckinTab`'s signature swaps `usePlanA` for `planMode` + `customPlans`, and
  the tab call site is updated to match.

### T04 — Plans + Progress tabs
- `TABS` now has six entries. New entries:
  - `{id:'plans',    icon:'ti-clipboard',       label:'Plans',    ac:'#A99CFF', bg:'#1B1733'}`
  - `{id:'progress', icon:'ti-chart-line',      label:'Progress', ac:'#57D39A', bg:'#0F2A22'}`
- Check-in icon moved from `ti-chart-line` to `ti-heart-handshake` to free the
  chart icon for Progress.
- Render switch dispatches to `PlansTab` with `{planMode,setPlanMode,customPlans,setCustomPlans,showToast}` and to
  `ProgressTab` with `{logs,checkin,macroFactor,weekKey}`.
- `ReviewTab` prop contract migrated to `planMode`/`setPlanMode`. Apply logic
  preserves `'custom'` mode.
- `EmptyPlanNotice` renders on the Today tab when there is no current workout,
  with a button that jumps to Plans.

### T05 — New files
- `src/customPlans.js` exports `makeCustomPlanId()` (`'c_' + Date.now()`),
  `makeCustomExerciseId()` (`'ex_' + Date.now() + '_' + randInt`), and
  `CUSTOM_PLAN_TAGS = ['PUSH','PULL','LEGS','UPPER','ARMS']`.
- `src/PlansTab.jsx` is a minimal stub that renders the planMode and the
  number of saved custom plans. Wave 2 Plan 02 will replace the body.
- `src/ProgressTab.jsx` is a minimal stub that renders the current week and
  the number of logged sessions. Wave 2 Plan 03 will replace the body.
- `App.jsx` re-exports the three helpers from `customPlans.js` so wave 2
  plans can import them from either file.

## Files Modified

- `src/App.jsx` — migrateSchema at module scope, planMode + customPlans state,
  v3 buildBackup / restoreBackup / buildAiExport, header pill update, TABS
  extension, tab render switch, ReviewTab prop migration, EmptyPlanNotice,
  customPlans helper re-exports.
- `src/PlansTab.jsx` — new stub.
- `src/ProgressTab.jsx` — new stub.
- `src/customPlans.js` — new helpers module.

## Verification

- `npm run build` succeeds with zero errors and emits `dist/assets/index-*.js`.
- All four grep checks from the plan pass:
  - `schemaVersion:3` at `src/App.jsx:1114`
  - `planMode` referenced 21 times in `src/App.jsx`
  - `iw_custom_plans` / `iw_schema_version` keys present in migration,
    state init, and persistence effects
  - `PlansTab` / `ProgressTab` imported and dispatched in the tab switch
- v2→v3 migration is idempotent (guards on each `ls.set` call ensure repeat
  boots are no-ops).
- v2 backup compat path tested by code inspection: `restoreBackup` falls back
  to `usePlanA ? 'planA' : 'planB'` when `data.planMode` is absent.

## Deviations

See frontmatter. The two material deviations are the commit ordering (T05
landed first, by design, to keep each App.jsx commit buildable) and the
EmptyPlanNotice (small UI affordance for the empty custom-plan state, which
the plan explicitly allowed).
