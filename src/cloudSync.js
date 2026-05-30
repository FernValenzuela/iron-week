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

const SYNC_KEY = "iw_sync_config";
const AUTH_STORAGE_KEY = "iw_supabase_auth";

const lsSync = {
  get(){
    try {
      const v = localStorage.getItem(SYNC_KEY);
      return v != null ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(value){
    try {
      localStorage.setItem(SYNC_KEY, JSON.stringify(value));
    } catch {}
  },
};

export function isConfigured(){
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY
  );
}

export function getSyncConfig(){
  return lsSync.get();
}

export function setSyncConfig(cfg){
  lsSync.set(cfg);
}

let _client = null;

async function getClient(){
  if(_client) return _client;
  if(!isConfigured()) throw new Error("Cloud sync not configured");
  const { createClient } = await import("@supabase/supabase-js");
  _client = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        storageKey: AUTH_STORAGE_KEY,
      },
    }
  );
  return _client;
}

function classifyError(err){
  const msg = String(err?.message || "");
  const status = err?.status || err?.code;
  if(status === 503 || status === "503" || /paused|unavailable|service\s*unavailable/i.test(msg)){
    return new Error("CLOUD_PAUSED");
  }
  return err instanceof Error ? err : new Error(msg || "Cloud sync error");
}

export async function enableSync(){
  const c = await getClient();
  let userId;
  try {
    const { data: sessionData } = await c.auth.getSession();
    userId = sessionData?.session?.user?.id;
    if(!userId){
      const { data, error } = await c.auth.signInAnonymously();
      if(error) throw error;
      userId = data?.user?.id;
    }
  } catch (err){
    throw classifyError(err);
  }
  if(!userId) throw new Error("Sign-in returned no user id");
  const existing = lsSync.get() || {};
  const cfg = {
    ...existing,
    userId,
    enabled: true,
    lastSyncedAt: existing.lastSyncedAt || null,
    lastPushedAt: existing.lastPushedAt || null,
  };
  lsSync.set(cfg);
  return userId;
}

export async function pushState(payload){
  const cfg = lsSync.get();
  if(!cfg?.userId) throw new Error("Cloud sync not enabled");
  const c = await getClient();
  const now = new Date().toISOString();
  const { error } = await c
    .from("iron_week_state")
    .upsert({ user_id: cfg.userId, state: payload, synced_at: now });
  if(error) throw classifyError(error);
  lsSync.set({ ...cfg, lastPushedAt: now, lastSyncedAt: now });
}

export async function pullState(){
  const cfg = lsSync.get();
  if(!cfg?.userId) throw new Error("Cloud sync not enabled");
  const c = await getClient();
  const { data, error } = await c
    .from("iron_week_state")
    .select("state, synced_at")
    .eq("user_id", cfg.userId)
    .maybeSingle();
  if(error) throw classifyError(error);
  if(!data) return null;
  lsSync.set({ ...cfg, lastSyncedAt: new Date().toISOString() });
  return { state: data.state, syncedAt: data.synced_at };
}

export function disableSync(){
  const cfg = lsSync.get();
  if(cfg){
    lsSync.set({ ...cfg, enabled: false });
  }
  _client = null;
}
