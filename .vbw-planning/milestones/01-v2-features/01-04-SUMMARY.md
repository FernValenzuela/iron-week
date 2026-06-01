---
phase: "01-v2-features"
plan: "04"
title: "Cloud sync via Supabase anonymous auth — push/pull buttons in Check-in tab"
status: complete
commit_hashes:
  - "4e00455"  # T01: add Supabase dependency and cloud sync scaffold
  - "4c5ca2f"  # T02: implement cloudSync helpers with dynamic Supabase import
  - "91f891a"  # T03: wire CheckinTab props and CloudSyncSection placeholder
  - "87aa63a"  # T04: implement CloudSyncSection UI with enable flow
  - "57b8c24"  # T05: wire push, pull, and disable handlers
tasks_completed:
  - "T01"
  - "T02"
  - "T03"
  - "T04"
  - "T05"
files_modified:
  - "package.json"
  - "package-lock.json"
  - ".gitignore"
  - ".env.example"
  - "src/cloudSync.js"
  - "src/App.jsx"
ac_results:
  truths:
    - truth: "@supabase/supabase-js installed as a runtime dependency"
      status: pass
      evidence: "package.json now lists @supabase/supabase-js@^2.106.2"
    - truth: "Supabase client is dynamic-imported only when user first taps Enable Cloud Sync — initial bundle unchanged for non-sync users"
      status: pass
      evidence: "Vite emits a separate chunk for the SDK; the main entry chunk (index-dw_Nte05.js per dist/index.html) contains only the literal string 'iw_supabase_auth' and no SDK code (verified via `grep -oE 'supabase[a-zA-Z._/-]*' dist/assets/index-dw_Nte05.js`)"
    - truth: "Anonymous Auth (signInAnonymously) creates a UUID on first enable, stored in iw_sync_config localStorage key"
      status: pass
      evidence: "cloudSync.enableSync calls c.auth.signInAnonymously() when no session exists and persists {userId, enabled, ...} under SYNC_KEY = 'iw_sync_config'"
    - truth: "Push: upserts current backup payload (output of buildBackup) to single 'iron_week_state' row keyed by user_id"
      status: pass
      evidence: "cloudSync.pushState calls c.from('iron_week_state').upsert({user_id, state: payload, synced_at}); CloudSyncSection passes buildPayload (which is CheckinTab's existing buildBackup({...}) closure)"
    - truth: "Pull: selects the row, shows confirmation dialog with cloud backup's exportedAt timestamp, then calls restoreBackup on confirm"
      status: pass
      evidence: "cloudSync.pullState selects state + synced_at; CloudSyncSection renders an inline confirmation strip with formatSyncTimestamp(pendingPull.syncedAt) and only calls restoreBackup(pendingPull.state) when the user taps Confirm pull"
    - truth: "Sync controls live in Check-in tab in a new 'Cloud sync' section below the existing Backup/restore section"
      status: pass_with_note
      evidence: "Card lives in CheckinTab. NOTE: placed ABOVE the Backup/restore card (matches the plan's T03 acceptance text — 'insert a new CloudSyncSection above the Backup/restore card') rather than below as the must_haves truth states. T03 task description was followed; the truth text appears to be inconsistent with the task spec."
    - truth: "iw_sync_config NEVER included in buildBackup output"
      status: pass
      evidence: "buildBackup in src/App.jsx serializes only {benchWeight, nextWorkoutIdx, planMode, customPlans, volumeMod, workoutVariants, logs, checkin, review, macroFactor}; no reference to iw_sync_config or syncConfig anywhere in the buildBackup function (grep confirms)"
    - truth: "When navigator.onLine === false: sync buttons hide and 'Offline' badge shows"
      status: pass
      evidence: "CloudSyncSection initializes `online` from navigator.onLine and subscribes to window 'online'/'offline' events. When offline, the card renders a yellow Offline badge and skips the buttons entirely."
    - truth: "Supabase 'project paused' / 503 / ServiceUnavailable errors handled gracefully with toast 'Cloud sync unavailable — using local data'"
      status: pass
      evidence: "classifyError maps status===503 or /paused|unavailable|service\\s*unavailable/i message into Error('CLOUD_PAUSED'). All three handlers (enable, push, pull) catch this sentinel and emit showToast('Cloud sync unavailable — using local data','info')"
    - truth: "Configuration: Supabase URL and anon key sourced from Vite env vars; app works fine without them (sync section shows 'Cloud sync not configured')"
      status: pass
      evidence: "isConfigured() returns Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY). When false the card renders only the env-setup hint and no other UI."
    - truth: "Multi-device test: pushing on device A then pulling on device B reproduces all state"
      status: deferred
      evidence: "Requires real Supabase credentials + two browsers; not executable in this dev session. The code path uses buildBackup (which already serializes the full v3 state including planMode and customPlans per Plan 01) and restoreBackup, both unchanged; once env vars are set the round-trip is mechanically a single jsonb column round-trip."
  artifacts:
    - artifact: "src/cloudSync.js — exports isConfigured, getSyncConfig, setSyncConfig, enableSync, pushState, pullState, disableSync; no top-level supabase import"
      status: pass
      evidence: "File created with all listed exports; only Supabase import is `await import('@supabase/supabase-js')` inside getClient()"
    - artifact: "src/App.jsx — CheckinTab receives all setters, renders CloudSyncSection"
      status: pass
      evidence: "CheckinTab signature and call site extended; CloudSyncSection rendered above Backup/restore card"
    - artifact: "src/App.jsx — CloudSyncSection component with enable/disable, push/pull, last-synced indicator, offline badge, pull confirmation strip, error states"
      status: pass
      evidence: "Defined in src/App.jsx (chosen over a new file for consistency with the existing single-file App architecture)"
    - artifact: ".env.example — documents VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
      status: pass
      evidence: ".env.example created with the two documented placeholders"
    - artifact: "package.json — @supabase/supabase-js added"
      status: pass
      evidence: "Dependency listed at ^2.106.2"
deviations:
  - "cloudSync.js stores Supabase auth session under iw_supabase_auth localStorage key (constant AUTH_STORAGE_KEY) — not in the plan text, but required so the Supabase client's auth state survives across reloads without colliding with the existing iw_sync_config record. Both keys are device-local and never enter buildBackup output."
  - "Added .env and .env.local to .gitignore in the T01 commit (originally untracked) to ensure real Supabase credentials are never committed."
  - "Pull confirmation rendered as an inline strip inside the Cloud sync card (not a modal) to match the codebase's existing inline-only UI patterns (no modal infrastructure exists)."
  - "Cloud sync card placed ABOVE the Backup/restore card. The plan's T03 task description explicitly directed 'Above the existing Backup/restore section', while one must_haves truth says 'below'. Followed the task text since it is the more specific direction."
---

# Plan 01-04 Summary — Cloud Sync (Supabase)

## What Was Built

Iron Week now has end-to-end optional cloud sync, layered on top of the existing local-only backup format with zero impact on users who never enable it.

- **`src/cloudSync.js`** (new) — a self-contained module that holds the Supabase client, the anonymous-sign-in flow, the upsert/select operations against the `iron_week_state` jsonb row, and the `iw_sync_config` localStorage record (`{userId, enabled, lastSyncedAt, lastPushedAt}`). The `@supabase/supabase-js` SDK is loaded via dynamic `import()` inside `getClient()` only on first use, so it lands in its own ~211 KB chunk that non-sync users never download. The file's header carries the required SQL setup block (table + RLS policy + anonymous-provider note) for the user to paste into the Supabase dashboard.
- **`CloudSyncSection`** in `src/App.jsx` — a four-state UI card rendered inside the Check-in tab:
  - *Not configured*: env-setup hint pointing at `.env.example`.
  - *Offline*: yellow "Offline" badge, no buttons.
  - *Not enabled*: single "Enable cloud sync" primary button that calls `cloudSync.enableSync()`.
  - *Enabled*: truncated user id, last-synced timestamp, Push/Pull primary buttons, an inline confirmation strip on Pull ("Replace local data with cloud backup from <time>?"), and a Disable button. All actions share a `busy` guard.
- **`CheckinTab` plumbing** — the tab's call site and signature now receive every root setter (`setBenchWeight`, `setNextWorkoutIdx`, `setPlanMode`, `setVolumeMod`, `setWorkoutVariants`, `setLogs`, `setReview`, `setCustomPlans`) so that `restoreBackup` (already wired through props) can repopulate the full v3 schema on a confirmed pull.
- **Configuration** — `.env.example` documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; `.gitignore` now blocks real `.env` files. If the env vars are missing at build time, `isConfigured()` is false and the card silently degrades to the env-setup hint.
- **Error handling** — `classifyError` collapses 503 / "project paused" / "service unavailable" responses to a `CLOUD_PAUSED` sentinel; all three handlers translate that sentinel into the documented "Cloud sync unavailable — using local data" info toast instead of a generic error.

## Tasks Completed

- **T01** — Installed `@supabase/supabase-js`, created `.env.example`, added `.env`/`.env.local` to `.gitignore`, and created `src/cloudSync.js` with the SQL setup comment block.
- **T02** — Implemented all cloudSync helpers with the dynamic-import pattern; Supabase auth session persisted under `iw_supabase_auth`, sync config under `iw_sync_config`.
- **T03** — Extended `CheckinTab` props (call site + signature) and inserted a `CloudSyncSection` placeholder above the existing Backup/restore card. Added `import * as cloudSync from "./cloudSync.js"` to App.jsx.
- **T04** — Implemented `CloudSyncSection` with all four UI states and the enable flow.
- **T05** — Wired push/pull/disable handlers with the inline pull-confirmation strip, busy-state button disables, and `CLOUD_PAUSED` toast routing.

## Files Modified

| File | Change |
|------|--------|
| `package.json` / `package-lock.json` | Added `@supabase/supabase-js@^2.106.2` |
| `.gitignore` | Added `.env` and `.env.local` |
| `.env.example` (new) | Documents `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| `src/cloudSync.js` (new) | All Supabase logic, fully dynamic-imported |
| `src/App.jsx` | Added cloudSync import, extended CheckinTab props, defined CloudSyncSection and formatSyncTimestamp |

## Verification

- `npm run build` succeeds. Output:
  - `index-dw_Nte05.js` (226 KB) — main app entry. Confirmed clean of the Supabase SDK; the only `supabase`-prefixed string is the `iw_supabase_auth` constant from cloudSync.js.
  - `index-DwWKCq68.js` (211 KB) — Supabase SDK chunk, loaded on demand the first time the user taps Enable cloud sync.
  - `index-Cs9Uo1IY.js` (537 KB) — Recharts chunk from Plan 03 (unchanged by this plan).
- All grep checks from the plan pass:
  - No top-level `import ... from "@supabase/..."` in `src/cloudSync.js`
  - `await import("@supabase/supabase-js")` present at one site
  - `iw_sync_config` referenced only in `src/cloudSync.js`; never in `buildBackup`
  - `CLOUD_PAUSED` and 503 status check both present
  - `navigator.onLine` referenced in `src/App.jsx`

## Manual Multi-Device Test (deferred)

The plan's multi-device round-trip success criterion needs real Supabase credentials and two browsers — not executable in this dev session. To exercise it:

1. Create a free Supabase project, run the SQL block from the comment header in `src/cloudSync.js`, and enable Anonymous sign-ins under Authentication → Providers.
2. Copy `.env.example` to `.env` and fill in `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
3. `npm run dev`, open Check-in, tap Enable cloud sync, then Push.
4. Open the same URL in a second browser profile, tap Enable cloud sync, then Pull, confirm the timestamp strip — local state should be replaced with device A's data.

## Deviations

See `deviations` in frontmatter.
