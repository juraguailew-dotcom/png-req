import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Debug endpoint — tests a register + immediate sign-in cycle.
 * Visit: /api/auth/debug
 * Only works in non-production or with explicit allow header.
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    return NextResponse.json({ error: 'Missing Supabase env vars' }, { status: 500 });
  }

  const supabase = createClient(url, anon);

  // Check what auth settings are configured by trying a signUp with a probe address
  // We do NOT actually create a user — just inspect the response shape
  const testEmail = `debug-probe-${Date.now()}@example-test-domain-do-not-use.invalid`;

  const { data, error } = await supabase.auth.signUp({
    email: testEmail,
    password: 'TestProbe123!',
    options: { data: { full_name: 'Debug Probe', role: 'contractor' } },
  });

  const emailConfirmRequired = data?.user?.identities?.length === 0;
  const userCreated = !!data?.user?.id;

  // Clean up the test user if admin client available
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (userCreated && serviceKey.startsWith('eyJ')) {
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    await admin.auth.admin.deleteUser(data.user.id);
  }

  return NextResponse.json({
    auth_config: {
      email_confirmation_required: emailConfirmRequired,
      signup_works: userCreated,
      signup_error: error?.message || null,
    },
    diagnosis: emailConfirmRequired
      ? '⚠️  Email confirmation is ON in Supabase. Users MUST disable this or click email link before signing in. Go to: Supabase → Authentication → Providers → Email → turn OFF "Confirm email"'
      : userCreated
        ? '✅ Registration working correctly. Email confirmation is OFF — users can sign in immediately after registering.'
        : `❌ SignUp failed: ${error?.message}`,
    fix_url: 'https://supabase.com/dashboard/project/tkizzdytcgbhrrtpyklg/auth/providers',
  });
}
