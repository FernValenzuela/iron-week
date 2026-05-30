// Iron Week — Cloud Sync (Supabase, anonymous auth, single jsonb row per user)
//
// IMPORTANT: this module performs ALL @supabase/supabase-js imports via dynamic
// import() inside enableSync/pushState/pullState. The package MUST NOT appear
// at the top of this file or in any other source — that would defeat the
// goal of keeping the initial bundle free of Supabase for non-sync users.
//
// Configuration (Vite env vars, read at build time):
//   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
//   VITE_SUPABASE_ANON_KEY=your-anon-public-key
// See .env.example. If either is missing, isConfigured() returns false and
// the UI shows a "not configured" notice instead of any sync controls.
//
// Required Supabase setup (run once in the SQL editor):
// --------------------------------------------------------------------
//   create table iron_week_state (
//     user_id uuid primary key references auth.users on delete cascade,
//     state jsonb not null,
//     synced_at timestamptz not null default now()
//   );
//   alter table iron_week_state enable row level security;
//   create policy "owner_rw" on iron_week_state
//     for all
//     using (auth.uid() = user_id)
//     with check (auth.uid() = user_id);
//   -- Authentication > Providers: enable "Anonymous sign-ins".
// --------------------------------------------------------------------
//
// Local data:
//   iw_sync_config localStorage key holds {userId, enabled, lastSyncedAt,
//   lastPushedAt}. It is a device-local setting and MUST NEVER be included
//   in buildBackup() output.
//
// Helpers (isConfigured / getSyncConfig / enableSync / pushState / pullState
// / disableSync) are implemented in the next commit.
