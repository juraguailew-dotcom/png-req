import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const checks = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL:      url.startsWith('https://'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: anon.startsWith('eyJ'),
      SUPABASE_SERVICE_ROLE_KEY:     !!service,
      // New sb_secret_ format works for DB but NOT for auth.admin API
      SUPABASE_SERVICE_ROLE_KEY_jwt: service.startsWith('eyJ'),
    },
    db_anon:   false,
    db_admin:  false,
    auth_mode: service.startsWith('eyJ') ? 'admin-client (full)' : 'anon-signUp (limited)',
    note: service.startsWith('eyJ')
      ? 'Admin client available — role set via app_metadata'
      : 'Using signUp() fallback — role stored in user_metadata instead',
    error: null,
  };

  try {
    const anonClient = createClient(url, anon);
    const { error } = await anonClient.from('categories').select('id').limit(1);
    checks.db_anon = !error;
    if (error) checks.error = error.message;
  } catch (e) {
    checks.error = e.message;
  }

  if (service) {
    try {
      const adminClient = createClient(url, service, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await adminClient.from('settings').select('key').limit(1);
      checks.db_admin = !error;
      if (error && !checks.error) checks.error = error.message;
    } catch (e) {
      if (!checks.error) checks.error = e.message;
    }
  }

  const ok = checks.env.NEXT_PUBLIC_SUPABASE_URL &&
             checks.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
             checks.db_anon;

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 500 });
}
