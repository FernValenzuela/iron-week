---
phase: "01-v2-features"
title: "v2 Features Research: Cloud Sync, Custom Plans, Progress Charts, Data Architecture"
type: research
confidence: high
date: 2026-05-30
---

## Findings

### 1. Cloud Sync Options for a Static React SPA

**Constraint Summary**

Iron Week is a Vite SPA on GitHub Pages with zero server-side code. The only sync surface is the client browser talking directly to a cloud SDK or API. The backup format already exists (`buildBackup`, schemaVersion 2), which is the mental model to extend: treat a cloud write as a "backup to the cloud" and a cloud read as a "restore from the cloud."

**Option A: Supabase (Recommended Primary)**

Supabase is the strongest fit because:
- Free tier: 2 projects, 500 MB PostgreSQL, unlimited API requests per month, 50,000 monthly active users for Auth. No per-read/write billing — crucial for a personal app where you don't want surprise invoices.
- Anonymous Auth (`supabase.auth.signInAnonymously()`) is available out of the box. The user never sees a login screen; a UUID is silently created on first launch, stored in localStorage, and refreshed automatically. The user can optionally link an email later.
- The `@supabase/supabase-js` bundle is ~75 KB gzipped — meaningful but acceptable. It can be loaded conditionally (only when sync is enabled) using a dynamic import to avoid bloating the initial bundle.
- Row-Level Security (RLS) policy: `using (auth.uid() = user_id)` lets you have a single `iron_week_state` table with one row per user, completely isolated.
- Data model: one `jsonb` column `state` stores the exact same JSON blob that `buildBackup` produces today. A cloud push is just `supabase.from('iron_week_state').upsert({ user_id: uid, state: backupPayload, synced_at: new Date().toISOString() })`.
- Works with GitHub Pages — Supabase client calls go directly from browser to Supabase's CDN-fronted API. No CORS issues since Supabase allows domain-based allow-listing.
- Supabase projects on the free tier pause after 7 days of inactivity. This is a real concern for a personal fitness app used weekly but possibly skipped for vacations. Mitigation: keep a Supabase Pro plan ($25/month) if pausing is unacceptable, or handle the "project paused" error gracefully and fall back to local-only mode silently.

**Option B: Firebase Firestore**

Firebase is well-understood but has meaningful downsides here:
- Free tier (Spark plan): 50,000 reads/day, 20,000 writes/day. More than enough.
- Anonymous auth exists (`signInAnonymously()`), similar to Supabase.
- The Firebase JS SDK is heavier: `firebase/app` + `firebase/firestore` + `firebase/auth` lands around 120–150 KB gzipped with tree-shaking. That's a significant chunk for a 440px personal app.
- Pricing model switches to per-operation billing beyond the free tier, which is harder to reason about.
- Firestore's document structure maps fine (one document per user, `state` field = backup blob), but it brings more overhead than Supabase's simple REST API.
- Verdict: viable, but Supabase is leaner and better priced for this use case.

**Option C: Cloudflare Workers + KV**

KV free tier is 100,000 reads/day + 1,000 writes/day, 1 GB storage. This is technically sufficient but:
- Requires writing and deploying a Worker as a small proxy (auth layer), since you cannot expose a KV namespace directly to the browser (no built-in identity model).
- That Worker is a small server you now own and maintain, which violates the "no backend to host" constraint.
- KV is eventually consistent — updates from one device may not be visible on another for up to 60 seconds. For a workout log this is fine, but conflict resolution needs thought.
- Verdict: skip unless the user already has Cloudflare Workers experience. The Worker deployment step adds complexity with no user-visible benefit over Supabase.

**Option D: Manual Export/Import (Already Exists)**

The app already has download-backup / restore-backup. For a solo user this is 80% of the value of sync at zero complexity cost. The v2 cloud sync should be additive on top of this, not a replacement.

**Option E: QR Code Sync**

Encoding the full backup blob as a QR code is technically feasible for very small states (~2 KB), but Iron Week's `logs` object grows indefinitely (every week adds new keys). After 6 months of logs the payload would exceed QR code limits (~3 KB for binary encoding). Not recommended.

**Minimum Footprint Approach (Recommended Architecture)**

Use Supabase anonymous auth + one `jsonb` row per user. Sync is manual-on-demand ("Push to cloud" / "Pull from cloud" buttons), not automatic on every keystroke. This:
- Keeps the conflict model trivial: last-write-wins by timestamp.
- Does not require a service worker or background sync.
- Matches how users already think about the existing backup/restore buttons.
- Dynamic-imports the Supabase client only when sync is first used, keeping the main bundle clean.

```
// Lazy-load sync module only when user taps "Enable cloud sync"
const { createClient } = await import("@supabase/supabase-js");
```

Per the `client-localstorage-schema` rule from Vercel React best practices: version and minimize localStorage data. The Supabase `user_id` and `sync_enabled` flag should be stored as a separate localStorage key (`iw_sync_config`), not mixed into the main backup blob.

---

### 2. Custom Workout Plan Builder UI Patterns

**Current State**

Plans (`PLAN_4`, `PLAN_3`) and variants (`WORKOUT_VARIANTS`) are hardcoded constants at the top of `App.jsx`. The exercise shape is `{id, name, sets, reps, [sub], [note], [caution], [bench]}`. Users can switch between Plan A/B and select workout variants via `VariantPicker`, but cannot add, remove, or reorder exercises.

**Storage Structure for Custom Plans**

Custom plans should be stored as a dedicated localStorage key `iw_custom_plans` (separate from the existing `logs`, `checkin`, etc.). This isolates plan mutations from session data and simplifies migration. The shape mirrors the existing plan structure:

```js
// iw_custom_plans: Array<CustomPlan>
{
  id: "custom_abc123",          // unique string (Date.now() or uuid)
  name: "My Push Day",
  tag: "PUSH",                  // reuse existing TAG_BG/TAG_FG color map
  createdAt: "2026-01-15T...",
  exercises: [
    { id: "ex_001", name: "Barbell Bench", sets: "3", reps: "5", note: "", sub: null, caution: null, bench: false }
  ]
}
```

The `usePlanA` boolean expands to a `planMode` enum: `"planA"` | `"planB"` | `"custom"`. When `planMode === "custom"`, the active plan array is built from `iw_custom_plans` instead of `PLAN_4`/`PLAN_3`. The existing `workoutVariants` state continues to work unchanged since it keys on `workout.id`.

**Reorder UI — Up/Down Arrows, Not Drag-and-Drop**

For a 440px mobile-first app, drag-and-drop reordering has meaningful friction on touch screens:
- Libraries like `@dnd-kit/sortable` (dnd-kit) are headless at ~35 KB gzipped and work well with inline styles, but add non-trivial implementation complexity.
- `@atlaskit/pragmatic-drag-and-drop` core is only 4.7 KB gzipped and is headless, but is designed for desktop-first use.
- `@formkit/drag-and-drop` is 5 KB gzipped and framework-agnostic.

The recommendation is up/down arrow buttons for v2 initial implementation:
- Zero new dependencies.
- Works unambiguously on touch.
- Implementation: `moveExercise(idx, direction)` mutates the exercises array in place using array splice.
- Can upgrade to drag-and-drop in v3 if users request it, using `@dnd-kit/sortable` which has the best React integration and works with arbitrary inline-style layouts.

**Minimal Plan Builder UI**

The builder fits in a new modal or a dedicated "Plans" tab section. Minimum viable:
1. List of existing custom plans (tap to select as active).
2. "New plan" button opens an edit view.
3. Edit view: plan name input, tag selector (reuse TAG_BG/TAG_FG), exercise list with up/down/delete per row, "Add exercise" button that appends a blank row.
4. Each exercise row has: name text input, sets input (small width), reps input (small width).

Advanced fields (`sub`, `caution`, `bench`) can be toggled via an "Advanced" expand on each row to avoid overwhelming first-time users.

**Migration: Existing Log Data When Switching to Custom Plans**

This is the most important risk. The `workoutLogKey` function encodes the week key + workout base ID + variant ID:
```js
const workoutLogKey = (weekKey, workout) => {
  const id = workout.baseId || workout.id;
  return workout.variantId && workout.variantId !== "base"
    ? `${weekKey}_${id}_${workout.variantId}`
    : `${weekKey}_${id}`;
};
```

A custom plan with `id: "custom_abc123"` will generate log keys like `2026-05-24_custom_abc123`. These do not collide with existing hardcoded plan log keys (`2026-05-24_push`, `2026-05-24_pull`, etc.). Old log history is fully preserved and still visible in the Week tab. No migration is needed for existing log data — the two key namespaces are naturally disjoint.

The only required migration is adding `planMode: "planA"` to the backup schema (schemaVersion → 3) and mapping the old `usePlanA: true/false` to `planMode: "planA"/"planB"` on restore.

**Reference Open-Source Fitness UIs**

- Liftosaur (liftosaur.com) is a React-based web workout tracker that uses a text-based program language for customization — powerful but overkill for Iron Week's persona.
- The `fitness-tracker` repo (github.com/Serkanbyx/fitness-tracker) uses Recharts + Zustand + Tailwind but is structurally similar enough to reference for component boundaries.
- Hevy app's exercise builder uses a search-first modal (search exercise catalog, tap to add) — worth borrowing for v3 if the exercise catalog grows.

---

### 3. Progress Charts for Workout Tracking

**Library Recommendation: Recharts**

Recharts is the correct choice for this codebase.

Bundle size comparison:
- Recharts: ~136 KB gzipped (full), but individual components tree-shake well with Vite. A `LineChart` + `BarChart` + `ResponsiveContainer` import is closer to 50–60 KB gzipped in practice.
- Chart.js (via react-chartjs-2): ~92 KB gzipped core + ~14 KB wrapper. Smaller, but canvas-based — SVG charts look sharper on retina mobile screens and integrate naturally with React's reconciler.
- Victory: SVG-based and React-first, but ~120 KB gzipped and has a more complex API.
- visx (Airbnb): extremely low-level, essentially D3 bindings. No prebuilt chart types. Requires significant custom code.

Recharts wins because:
1. SVG-based: crisp on retina, matches the inline-style-only approach (SVG attributes accept inline style props directly).
2. `ResponsiveContainer` wraps any chart and measures its parent div — works perfectly inside the 440px maxWidth layout. **Critical caveat**: the parent div must have an explicit pixel height (e.g., `style={{height: 200}}`), not a percentage. Otherwise `ResponsiveContainer` collapses to 0.
3. No TypeScript required. All component props accept plain JS values.
4. Composable: `<LineChart>` with `<Tooltip>`, `<XAxis>`, `<YAxis>`, `<Line>` gives full control over colors, which can be the same hex values already defined in `TAG_FG`.
5. Dynamic import to keep initial bundle clean: `const { LineChart, ... } = await import("recharts")` — or use a lazy-loaded `ProgressTab` component.

**What Data from Iron Week Maps to Useful Charts**

The `logs` object structure (from code inspection and the AI export format):
```
logs = {
  "2026-05-24_push": {
    completed: ["db_press", "cable_fly", ...],
    skipped: [],
    sets: {
      "db_press": { weight: "60", pain: 1, reps: ["10","10","9"] },
      "cable_fly": { weight: "40", pain: 0, reps: ["12","11","12"] },
    },
    skippedDay: false
  },
  ...
}
```

Derived metrics and chart types:

**a) Weight Progression per Exercise (Line Chart)**
- X-axis: week date (extracted from log key prefix, e.g. `2026-05-24`)
- Y-axis: `sets[exerciseId].weight` as a float
- Filter: user selects an exercise from a dropdown (exercises that appear in 3+ weeks)
- Utility: highest priority — users most want to see if they're getting stronger
- Data extraction: iterate all log keys, parse date prefix, extract weight for the target exercise ID

**b) Weekly Volume per Workout Type (Bar Chart)**
- X-axis: week dates
- Y-axis: total volume = sum over completed exercises of `(weight × reps_per_set × set_count)`
- Grouped by workout tag (PUSH/PULL/LEGS/ARMS)
- Shows overtraining patterns or deload compliance

**c) Pain Score Trend (Line Chart)**
- X-axis: week dates
- Y-axis: max pain score across all exercises in that week's logs
- Use `TAG_FG.PUSH` red for high pain, green for zero
- Directly useful for Fernando's shoulder rehab tracking

**d) Weekly Completion Rate (Bar or Sparkline)**
- X-axis: week dates
- Y-axis: percentage of planned workouts completed that week (not skipped days)
- Simple boolean: did `skippedDay` fire or not
- A horizontal bar showing the last 8 weeks at a glance

**e) Bodyweight Trend (Line Chart, from check-in data)**
- Source: `checkin.bw` (weekly, not daily)
- Low data density but meaningful over 12+ weeks

**Recommended Initial Chart Set**
Start with (a) weight progression and (d) weekly completion. These have the most immediate reinforcement value. Add (c) pain trend specifically for the shoulder rehab use case. All three fit in the existing Check-in tab or a new "Progress" tab.

**Implementation Notes**
- Pre-process `logs` into chart-ready arrays using `useMemo` to avoid recomputing on every render (per `rerender-memo` guideline).
- Extract the log date by splitting log keys on `_` and taking the first 10 characters (the ISO week date).
- Use `js-cache-storage` guideline: cache the processed chart data, not raw localStorage reads, to avoid repeated JSON.parse calls.
- The MacroFactor `rows` array (already parsed in the app) contains `date`, `scaleWeight`, `weightTrend`, `calories`, `protein` per day — this is ready to chart as-is with Recharts `LineChart`.

---

### 4. Data Architecture for v2

**Current Schema (v2)**

The `buildBackup` function defines the authoritative schema shape:
```js
{
  app: "Iron Week",
  schemaVersion: 2,
  exportedAt: "...",
  data: {
    benchWeight,       // number
    nextWorkoutIdx,    // number
    usePlanA,          // boolean
    volumeMod,         // "normal" | "reduced"
    workoutVariants,   // { [workoutId]: variantId }
    logs,              // { [logKey]: { completed, skipped, sets, skippedDay?, skippedReason? } }
    checkin,           // { bw, cals, protein, sleep, notes }
    review,            // null | { ... }
    macroFactor,       // { importedAt, fileName, rows, summary }
  }
}
```

localStorage keys currently in use:
- `benchWeight`, `nextWorkoutIdx`, `usePlanA`, `volumeMod`, `workoutVariants`, `logs`, `checkin`, `review`, `macroFactor`

**Proposed v3 Schema Changes**

```js
{
  schemaVersion: 3,
  data: {
    ...existing_v2_fields_unchanged,
    planMode: "planA" | "planB" | "custom",  // replaces usePlanA boolean
    customPlans: [],   // Array<CustomPlan>, new key
    syncConfig: null,  // { userId, provider, lastSyncedAt } | null — stored separately as iw_sync_config
  }
}
```

New localStorage keys for v3:
- `iw_custom_plans`: `Array<CustomPlan>` — separate from the main backup blob to allow plan editing without touching the logs object
- `iw_sync_config`: `{ userId, provider, lastSyncedAt, enabled }` — never included in the backup export blob (it's a device-local setting)
- `iw_schema_version`: integer — read on startup to determine if migration is needed

**Progressive Enhancement Strategy (localStorage works offline, sync when online)**

The architecture is straightforward because sync is manual (push/pull buttons), not automatic:

1. App boots: reads all data from localStorage as today.
2. If `iw_sync_config.enabled === true` AND `navigator.onLine === true`: show a "Last synced X ago" indicator. Do NOT auto-pull on every boot — too surprising for a user who may have made local changes since last sync.
3. User explicitly taps "Push to cloud": call Supabase upsert with current backup payload.
4. User explicitly taps "Pull from cloud": call Supabase select, show a confirmation with the cloud backup's `exportedAt` timestamp before overwriting local state.
5. If `navigator.onLine === false`: hide sync buttons, show "Offline" badge. All features work normally via localStorage.

This avoids conflict resolution entirely for v2. The only edge case is "user edited on two devices between syncs." The pull confirmation timestamp ("Replace local data with cloud backup from May 24 at 3:15 PM?") is sufficient to prevent accidental overwrites for a solo user.

**Migration Strategy for Existing v1/v2 Users**

Run a one-time migration on app startup:

```js
function migrateSchema() {
  const version = ls.get("iw_schema_version", 1);
  
  if (version < 2) {
    // v1 -> v2: no known schema changes needed (schemaVersion 2 was internal)
  }
  
  if (version < 3) {
    // v2 -> v3: migrate usePlanA boolean to planMode string
    const usePlanA = ls.get("usePlanA", true);
    const planMode = usePlanA ? "planA" : "planB";
    ls.set("planMode", planMode);
    // usePlanA key left in place for backward compat on restore
    ls.set("iw_custom_plans", []);
    ls.set("iw_schema_version", 3);
  }
}
```

Call `migrateSchema()` before the App component renders (at module scope or in a top-level `useEffect` that runs before any state reads). This is idempotent and safe to call on every boot.

**Should Custom Plans be a Separate Key or Merged into Plan State?**

Separate key (`iw_custom_plans`) is strongly preferred:
- The existing `logs` object can grow to hundreds of KB over time. Mixing plan definitions into it risks JSON.parse slowdowns.
- Custom plans are read-heavy during session start and write-only during explicit editing. Separating them avoids triggering the `useEffect` that syncs `logs` on every set-completion toggle.
- The `workoutVariants` state (which variant is selected per workout) remains unchanged and works with custom plan IDs transparently.
- Backup/restore: include `customPlans` in the `buildBackup` payload (data.customPlans), so existing backup/restore code handles migration automatically.
- Cloud sync: include `customPlans` in the Supabase jsonb blob. No special handling needed.

**Key Risk: Log Key Namespace**

Custom plan workout IDs must not collide with existing hardcoded IDs (`push`, `pull`, `legs`, `upper`, `upperA`, `lower3`, `upperB`). Prefix all custom plan IDs with `"c_"` (e.g., `"c_1716854400000"`) and document this as a convention. The log key `2026-05-24_c_1716854400000` will never match historical hardcoded keys.

---

## Relevant Patterns

- Iron Week already has the mental model of "backup = JSON blob" — the v2 cloud sync is a natural extension of the existing `downloadBackup`/`importBackupFile` pattern. Users won't need to learn a new paradigm.
- The `ls` helper (get/set with try/catch) is the abstraction point to extend for a sync wrapper: a `cloudSync.push()` / `cloudSync.pull()` that wraps `ls.get` calls.
- The codebase's inline-style convention and 440px maxWidth means chart containers need explicit pixel heights — `ResponsiveContainer` requires this.
- Existing color palette (`TAG_FG`, caution colors) can be reused directly as Recharts `stroke` / `fill` props.
- `lucide-react` is already in package.json (currently unused) — can be used for sync status icons without adding a dependency.

## Risks

1. **Supabase free tier project pausing**: Projects inactive for 7 days on the free tier are paused. A user who takes a vacation and returns to find sync broken will have a confusing error. Mitigation: catch Supabase `503`/`ServiceUnavailable` errors explicitly and show "Cloud sync unavailable — using local data" rather than a generic error.

2. **Log payload size grows unbounded**: The `logs` object is stored as a single JSON blob. After one year of daily use, it could grow to 200–500 KB. This is within localStorage limits (5–10 MB per origin) but will slow JSON.parse on startup. Mitigation for v3: only sync the last 90 days of logs to the cloud, keep full history local. Show a "history limit" indicator in the sync UI.

3. **Recharts bundle on initial load**: Even with dynamic import, if the user navigates to the Progress tab immediately, there is a visible loading flash. Use a skeleton/loading state for the chart area (`<div style={{height:200, background:"#0B121A", borderRadius:8}} />`) while the module loads.

4. **Custom plan ID collision with hardcoded plan IDs**: If a user somehow creates a custom plan named `"push"`, log keys collide with historic Push A logs. The `"c_"` prefix convention prevents this. Enforce it in the UI by always generating IDs programmatically.

5. **`restoreBackup` function needs updating for v3**: The existing `restoreBackup` in `App` dispatches to individual `setState` calls. Adding `planMode` and `customPlans` requires two more branches. Low risk but must not be forgotten.

## Recommendations

1. **Cloud sync**: Use Supabase with anonymous auth. Single `iron_week_state` table, one `jsonb` row per user. Manual push/pull buttons. Dynamic-import the SDK. Handle the free-tier pause error gracefully.

2. **Custom plans**: Store in separate `iw_custom_plans` localStorage key. Use `"c_"` prefixed IDs. Add `planMode` to replace `usePlanA`. Reorder with up/down arrow buttons for v2; upgrade to `@dnd-kit/sortable` in v3.

3. **Progress charts**: Add Recharts via dynamic import in a new `ProgressTab` or expanded Check-in section. Start with weight-progression-per-exercise line chart and weekly completion bar chart. Use `useMemo` to preprocess `logs`. The MacroFactor `rows` data is already chart-ready.

4. **Schema migration**: Bump to schemaVersion 3. Run `migrateSchema()` at app startup. Map `usePlanA → planMode`. Include `customPlans: []` in backup schema. Do not mix `iw_sync_config` into the backup blob.

5. **Sequencing**: Implement (4) data architecture changes first — they are a prerequisite for everything else. Then add custom plans UI (2), then charts (3), then cloud sync (1) last, because sync quality depends on stable schema.
