---
phase: 01-v2-features
tier: standard
result: FAIL
passed: 20
failed: 2
total: 22
date: 2026-06-01
verified_at_commit: 57b8c24ea92b3313bf6690a8ea28a1259d47331c
writer: write-verification.sh
plans_verified:
  - 01-01
  - 01-02
  - 01-03
  - 01-04
---

## Other Checks

| # | ID | Check | Status | Evidence |
|---|-----|-------|--------|----------|
| 1 | schema-v3-buildbackup | schemaVersion:3 in buildBackup (App.jsx:1119) | PASS | - |
| 2 | planmode-replaces-useplanA | planMode state replaces usePlanA; in buildBackup | PASS | - |
| 3 | custom-plans-state | customPlans persisted to iw_custom_plans; in buildBackup | PASS | - |
| 4 | migrate-schema-idempotent | migrateSchema() at module scope (App.jsx:283), idempotent | PASS | - |
| 5 | restore-backup-v2-v3 | restoreBackup handles v2 (usePlanA fallback) and v3 | PASS | - |
| 6 | c-prefix-enforced | makeCustomPlanId() returns 'c_'+Date.now() | PASS | - |
| 7 | plans-progress-tabs-wired | TABS extended; render switch dispatches to PlansTab+ProgressTab | PASS | - |
| 8 | v1-features-intact | Today/Week/Review/Check-in tabs unchanged; build succeeds | PASS | - |
| 9 | plan-builder-create-edit-delete | User can create/edit/delete custom plans with validation | PASS | - |
| 10 | plan-builder-reorder | Up/down arrow reorder; no DnD; ti-arrow-up/down present | PASS | - |
| 11 | plan-builder-id-prefixes | c_ for plans, ex_ for exercises enforced at creation | PASS | - |
| 12 | planmode-selector-in-plans-tab | Plan A/B/Custom mode selector in PlansTab | PASS | - |
| 13 | recharts-lazy-loaded | Recharts dynamic-imported; separate 537KB chunk; zero main-bundle references | PASS | - |
| 14 | progress-charts-three-sections | Weight Progression, Weekly Completion, Bodyweight Trend rendered | PASS | - |
| 15 | progress-charts-empty-state | Empty-data states; exercise dropdown filters 3+ weeks; useMemo for data | PASS | - |
| 16 | supabase-not-in-main-bundle | @supabase/supabase-js in separate 211KB chunk; no top-level import | PASS | - |
| 17 | anon-auth-sync-config | iw_sync_config stores UUID; absent from buildBackup output | PASS | - |
| 18 | offline-badge | navigator.onLine===false hides sync buttons, shows Offline badge | PASS | - |
| 19 | supabase-503-handling | CLOUD_PAUSED + 503 classifier; toast 'Cloud sync unavailable' | PASS | - |
| 20 | env-example-present | .env.example documents VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY | PASS | - |
| 21 | pull-confirmation-inline | Must-have: 'shows confirmation dialog with cloud backup exportedAt timestamp'. Implementation: inline conditional strip; timestamp visibility not confirmed. | FAIL | - |
| 22 | cloud-sync-placement | Must-have: 'Cloud sync section below Backup/restore'. Implementation renders ABOVE (App.jsx ~1285 vs ~1291). | FAIL | - |

## Summary

**Tier:** standard
**Result:** FAIL
**Passed:** 20/22
**Failed:** pull-confirmation-inline, cloud-sync-placement
