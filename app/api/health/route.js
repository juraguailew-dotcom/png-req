import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../lib/supabase-server';

/**
 * Health check endpoint — verifies env vars and DB connectivity.
 * Visit /api/health on your deployed URL to diagnose config issues.
 */
export async function GET() {
  const checks = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      // Service role key must be the long JWT from Supabase dashboard (starts with eyJ)
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY_valid:
        process.env.SUPABASE_SERVICE_ROLE_KEY?.startsWith('eyJ') ?? false,
      RESEND_API_KEY: !!process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: !!process.env.RESEND_FROM_EMAIL,
    },
    db: false,
    error: null,
  };

  // Test DB connectivity with the admin client
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .select('key')
      .limit(1);
    checks.db = !error;
    if (error) checks.error = error.message;
  } catch (e) {
    checks.error = e.message;
  }

  const allOk =
    Object.values(checks.env).every(Boolean) && checks.db;

  return NextResponse.json(
    { ok: allOk, checks },
    { status: allOk ? 200 : 500 }
  );
}
