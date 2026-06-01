---
phase: "01-v2-features"
plan: "02"
title: "Custom Plan Builder UI (PlansTab) — create, edit, reorder exercises"
status: complete
commit_hashes:
  - "a832fc6994d94c4d833c2eb24e97c36f2e3affb2"  # T01
  - "4a53e9610d590079153256ebdd684ee229be34a7"  # T02
  - "3f77a06a253e85d9c7d5a04c6cf04050094f286b"  # T03
  - "39e20cf8a49e0b8cdadf94e68d6b63800339afa3"  # T04
  - "3073d4ce3e6472efc4fab6d91b630a3dcbb128f6"  # T05
tasks_completed:
  - "T01: List view + mode selector with empty state"
  - "T02: Edit view with name input, tag picker, exercise list, Save/Cancel"
  - "T03: ExerciseRow with up/down/delete actions (no drag-and-drop)"
  - "T04: Advanced toggle exposing note, caution, sub, bench fields"
  - "T05: Inline delete confirmation + Save validation"
files_modified:
  - "src/PlansTab.jsx"
ac_results:
  truths:
    - truth: "User can create a new custom plan with name, tag, and 1+ exercises"
      status: pass
      evidence: "Edit view (T02) accepts name + tag; ExerciseRow (T03) lets user add rows; Save upserts into customPlans only when name and exercises are non-empty (T05 validation)."
    - truth: "User can edit an existing custom plan (rename, change tag, add/remove/reorder/edit exercises)"
      status: pass
      evidence: "Edit IconBtn clones the plan into editingPlan; up/down reorder + delete + Add exercise all mutate editingPlan; Save replaces by id."
    - truth: "User can delete a custom plan with confirmation"
      status: pass
      evidence: "Trash IconBtn sets deletingId; inline danger strip exposes Cancel/Delete; confirm filters customPlans and toasts 'Plan deleted'."
    - truth: "User can switch planMode to 'custom' via PlansTab UI (mode selector at top of tab)"
      status: pass
      evidence: "Active plan SegControl at top of list view drives setPlanMode for planA/planB/custom."
    - truth: "Exercise reordering uses up/down arrow buttons (NOT drag-and-drop — per research §2)"
      status: pass
      evidence: "ExerciseRow renders ti-arrow-up + ti-arrow-down IconBtns; grep confirms no @dnd-kit, react-dnd, or drag-and-drop references in PlansTab.jsx."
    - truth: "All custom plan IDs use 'c_' prefix; all custom exercise IDs use 'ex_' prefix — generated via customPlans.js helpers"
      status: pass
      evidence: "makeBlankPlan() calls makeCustomPlanId(); makeBlankExercise() calls makeCustomExerciseId(); both are imported from ./customPlans.js."
    - truth: "When planMode='custom' and customPlans has entries, Today tab renders the first custom plan as the active workout (basePlan derivation from Plan 01 handles this — no changes here)"
      status: pass
      evidence: "Out of scope for Plan 02 (basePlan derivation lives in App.jsx, established by Plan 01). PlansTab does not touch App.jsx, so Plan 01 wiring is preserved."
    - truth: "PlansTab also shows non-custom mode selector (Plan A 4-day, Plan B 3-day, Custom) so the entire plan-mode UX lives in one tab"
      status: pass
      evidence: "MODE_OPTIONS SegControl is rendered at the top of the tab in both list and (hidden in) edit views; hint shown when not in custom."
    - truth: "Header pill on root App still reflects planMode label correctly"
      status: pass
      evidence: "App.jsx header pill was already wired in Plan 01; Plan 02 does not edit App.jsx, so behavior is preserved."
    - truth: "Existing logs and workoutVariants remain untouched by any plan mutation"
      status: pass
      evidence: "PlansTab only calls setCustomPlans and setPlanMode; logs and workoutVariants setters are not even imported."
  artifacts:
    - artifact: "src/PlansTab.jsx — full implementation: list view, edit view, mode selector, all CRUD interactions, inline styles only, max width inherited"
      status: pass
      evidence: "File expanded from 18-line stub to full builder (≈360 lines); only inline style objects; max width inherited from App.jsx container."
deviations: []
---

# Plan 02 Summary

PlansTab now ships the full v2 custom plan builder UI, fulfilling REQ-11. The component is self-contained: it consumes `planMode`, `setPlanMode`, `customPlans`, `setCustomPlans`, and `showToast` from `App.jsx` (props wired in Plan 01) and renders the entire plan-mode UX inside a single tab.

## What Was Built

`src/PlansTab.jsx` went from an 18-line placeholder stub to the complete custom plan builder for v2. The tab now hosts the entire plan-mode UX in two view states driven by a single local `editingPlan` slice:

- **List view (default)**: An `Active plan` SegControl at the top with three buttons — Plan A 4-day, Plan B 3-day, Custom — calls `setPlanMode` directly. When the active mode is not Custom, a one-line hint nudges the user toward Custom. When Custom is active, a `Custom plans` header with a primary `+ New plan` button is shown above the list. Each saved plan renders as a card with name, a color-coded tag pill (driven by local `TAG_BG`/`TAG_FG` maps keyed by `CUSTOM_PLAN_TAGS`), an exercise count, an Edit IconBtn, and a Delete IconBtn. The empty state shows "No custom plans yet. Tap New plan to start."
- **Edit view**: Opened by tapping `+ New plan` (fresh `makeBlankPlan()` with a `c_`-prefixed id and one blank exercise) or the Edit IconBtn on a row (deep clone of the plan). Renders a back-arrow IconBtn, a heading ("New plan" vs "Edit plan"), a name input, a tag picker (`CUSTOM_PLAN_TAGS` mapped to color-aware toggle buttons), the exercises list, an `Add exercise` button, and a Cancel/Save action row. Save upserts into `customPlans` by id and toasts `Plan saved`; Cancel discards.
- **ExerciseRow sub-component**: Per-exercise row with `name` (flex:1), `sets` (50px), and `reps` (70px) inputs plus an actions row containing up/down arrow IconBtns (`ti-arrow-up`/`ti-arrow-down`, disabled at array bounds) for reorder via array `splice`, a delete IconBtn (`ti-x`, color `cross`), and an `Advanced` ghost toggle. No drag-and-drop library was added — touch-friendly per research §2.
- **Advanced panel**: Each row exposes an inline panel (gated by a single `openAdvanced` slice on PlansTab so only one row's panel is open at a time) with a note `textarea`, a caution SegControl (None/Yellow/Red), a sub SegControl (None/Bench/Rear Delt/Overhead Tri), and a bench rehab checkbox. Values flow through `setEditingPlan` and persist on Save.
- **Delete confirmation**: Tapping the trash IconBtn sets `deletingId` and reveals an inline danger-palette strip beneath the row (`Delete plan {name}? [Cancel] [Delete]`). Confirm filters `customPlans` and toasts `Plan deleted`.
- **Save validation**: Save is disabled when `editingPlan.name.trim() === ''` or `editingPlan.exercises.length === 0`. On a failed Save attempt, an inline warning (`Name required` / `Add at least one exercise`) is rendered next to the corresponding control. The name warning clears as the user types.
- **Local primitives**: `Btn`, `IconBtn`, `Section`, `SegControl`, and `useHover` are duplicated locally inside `PlansTab.jsx` because the originals are not exported from `App.jsx`. Shapes mirror the originals (palettes, hover scale/filter behaviour, sizes) to keep visual consistency with the other tabs while keeping the file self-contained and disjoint from the Plan-03 ProgressTab work.

All styling is inline; no CSS classes, no CSS-in-JS, no new dependencies, and no edits to `src/App.jsx`, `src/ProgressTab.jsx`, or `package.json`.

## Tasks Completed

- **T01 — Mode selector + list view (`a832fc6`)**: Replaced the PlansTab stub with the `Active plan` segmented control (Plan A 4-day / Plan B 3-day / Custom) at the top. When `planMode==='custom'`, the tab shows a `Custom plans` header with a `+ New plan` button and a list of saved plans (name + tag pill driven by local `TAG_BG`/`TAG_FG` maps + exercise count). Empty state ("No custom plans yet. Tap New plan to start.") shown when `customPlans=[]`. Otherwise a one-line hint instructs the user to switch to Custom. Section, SegControl, Btn, IconBtn, and the useHover hook are duplicated locally (the originals are not exported from `App.jsx`) so the file stays self-contained.

- **T02 — Edit view (`4a53e96`)**: Introduced local `editingPlan` state. New plan and Edit-row buttons populate it with a fresh `makeBlankPlan()` (containing a `c_`-prefixed id) or a deep clone of the selected plan. Render: back-arrow IconBtn + heading; name text input; tag picker that maps `CUSTOM_PLAN_TAGS` to color-aware buttons using `TAG_BG`/`TAG_FG`; exercises list (initially just `name/sets/reps` inputs per row); `+ Add exercise` button; bottom action row with Cancel and primary Save. Save upserts into `customPlans` by id (existing → replace, new → append), toasts `Plan saved`, and returns to the list view. Cancel discards `editingPlan`.

- **T03 — ExerciseRow with reorder (`3f77a06`)**: Extracted the per-exercise row into an `ExerciseRow` component. Layout: `name` (flex:1), `sets` (50px), `reps` (70px), then an actions row with `ti-arrow-up` (disabled at idx 0), `ti-arrow-down` (disabled at last idx), and `ti-x` (color `cross`). Reorder uses `splice` on the exercises array; delete uses `splice`; all mutations flow through `setEditingPlan`. No drag-and-drop library added — matches research §2's touch-first recommendation.

- **T04 — Advanced fields (`39e20cf`)**: Added an `Advanced` ghost button under each exercise row that toggles an inline panel with note textarea, caution SegControl (None/Yellow/Red), sub SegControl (None/Bench/Rear Delt/Overhead Tri), and a bench rehab checkbox. A single `openAdvanced` slice on PlansTab tracks the open row by exercise id, so only one panel is open at a time. Deleting the exercise whose advanced panel is open clears `openAdvanced`.

- **T05 — Delete confirmation + validation (`3073d4c`)**: Tapping the trash icon on a list row sets `deletingId` and renders an inline strip in the danger palette (`Delete plan {name}? [Cancel] [Delete]`). Confirm calls `setCustomPlans(prev => prev.filter(...))` and toasts `Plan deleted`. Save now validates: disabled when `name.trim() === ''` or `exercises.length === 0`, and an inline warning (`Name required` / `Add at least one exercise`) is shown after a Save attempt. The `Name required` warning clears as the user types.

## Files Modified

- `src/PlansTab.jsx` — full implementation (stub → builder UI). No other files touched per scope.

## Verification

- `npm run build` — succeeds with zero errors after every task commit.
- Grep checks (all pass):
  - `makeCustomPlanId` / `makeCustomExerciseId` used at plan/exercise creation sites
  - `CUSTOM_PLAN_TAGS` drives the tag picker
  - `ti-arrow-up` / `ti-arrow-down` present in ExerciseRow actions
  - No `@dnd-kit`, `react-dnd`, or `drag-and-drop` references

## Deviations

None. All five tasks landed as one atomic commit each, in plan order.
