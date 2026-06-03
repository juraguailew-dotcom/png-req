import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Health check — visit /api/health to diagnose Vercel config issues.
 * Returns which env vars are set and whether the DB is reachable.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const checks = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL:       url.startsWith('https://'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY:  anon.startsWith('eyJ'),
      SUPABASE_SERVICE_ROLE_KEY:      service.startsWith('eyJ'),
      RESEND_API_KEY:                 !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL:              !!process.env.RESEND_FROM_EMAIL,
    },
    db_anon:    false,
    db_admin:   false,
    auth_mode:  service.startsWith('eyJ') ? 'admin-client' : 'anon-client-fallback',
    error:      null,
  };

  // Test anon client connectivity
  try {
    const anon_client = createClient(url, anon);
    const { error } = await anon_client.from('categories').select('id').limit(1);
    checks.db_anon = !error;
    if (error) checks.error = error.message;
  } catch (e) {
    checks.error = e.message;
  }

  // Test admin client if service key looks valid
  if (service.startsWith('eyJ')) {
    try {
      const admin_client = createClient(url, service, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { error } = await admin_client.from('settings').select('key').limit(1);
      checks.db_admin = !error;
      if (error && !checks.error) checks.error = error.message;
    } catch (e) {
      if (!checks.error) checks.error = e.message;
    }
  }

  const allOk = Object.values(checks.env).slice(0, 3).every(Boolean) && checks.db_anon;

  return NextResponse.json({ ok: allOk, checks }, { status: allOk ? 200 : 500 });
}
