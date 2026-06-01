---
phase: "01-v2-features"
round: "01"
title: "QA Remediation R01 — fix 2 must-have failures in cloud sync (Plan 01-04)"
source_verification: "VERIFICATION.md"
fails_addressed:
  - "cloud-sync-placement"
  - "pull-confirmation-inline"
files_modified:
  - "src/App.jsx"
fail_classifications:
  - check_id: cloud-sync-placement
    type: code-fix
  - check_id: pull-confirmation-inline
    type: process-exception
---

# Remediation Round 01

Fix 2 FAIL checks from VERIFICATION.md. Both are in `src/App.jsx` (CheckinTab render).

## FAIL 1: cloud-sync-placement

**Must-have:** "Sync controls live in Check-in tab in a new 'Cloud sync' section **below** the existing Backup/restore section."

**Current state:** `CloudSyncSection` renders at App.jsx ~line 1285, which is ABOVE the Backup/restore block (which begins at ~line 1291).

**Fix:** In the CheckinTab render, move the `<CloudSyncSection .../>` call to render AFTER the entire Backup/restore block (the block that contains the backup download button and restore file input).

## FAIL 2: pull-confirmation-inline

**Must-have:** "Pull: selects the row, shows confirmation dialog with cloud backup's **exportedAt** timestamp, then calls restoreBackup on confirm."

**Current state:** The pull confirmation strip shows (`pendingPull && ...`) but QA flagged it as not clearly showing the `exportedAt` timestamp.

**Fix:** Verify the `pendingPull` conditional strip displays the `exportedAt` (or `syncedAt`) timestamp from the pulled cloud data. If it does not already show the timestamp, add it. The inline strip format is acceptable (the codebase has no modal infrastructure); the must-have requirement is that the timestamp is visible before the user confirms.

## Task

### Task R01-T01
Fix both issues in `src/App.jsx`:
1. Move `<CloudSyncSection .../>` to render BELOW the Backup/restore section in CheckinTab
2. Ensure the pull confirmation strip displays the `exportedAt` timestamp from the pending cloud backup

**Acceptance:**
- Cloud sync section renders after (below) the Backup/restore section in the UI
- Pull confirmation displays a timestamp (exportedAt or syncedAt) from the pending cloud data before the user taps Confirm
- `npm run build` succeeds with zero errors
- No other CheckinTab behavior changed
