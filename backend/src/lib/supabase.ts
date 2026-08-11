import { createClient } from '@supabase/supabase-js';
import { env } from '../env.js';

// null until SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are set — checked at the
// point of use (uploads.controller.ts), not at startup, so the rest of the
// app runs fine before Supabase is configured.
export const supabaseAdmin =
  env.supabaseUrl && env.supabaseServiceRoleKey
    ? createClient(env.supabaseUrl, env.supabaseServiceRoleKey, { auth: { persistSession: false } })
    : null;
