import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the anon client for signUp — works with both old and new Supabase key formats.
// The admin client (auth.admin.createUser) only works with the old eyJ JWT service_role key.
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client — only available if service key is the old JWT format
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = serviceKey.startsWith('eyJ')
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export async function POST(request) {
  try {
    const { email, password, full_name, role } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { error: 'Email, password and full name are required.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    const assignedRole = ['contractor', 'hardware_shop'].includes(role) ? role : 'contractor';

    // ── Register via standard signUp ──────────────────────────────────────
    // Store role in user_metadata so it's accessible client-side immediately.
    const { data: authData, error: signUpError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: assignedRole,   // stored in user_metadata
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message || '';
      if (
        msg.toLowerCase().includes('already registered') ||
        msg.toLowerCase().includes('already exists') ||
        msg.toLowerCase().includes('user already registered')
      ) {
        return NextResponse.json(
          {
            message: 'An account with this email already exists. Please sign in.',
            existingUser: true,
          },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    if (!authData?.user) {
      return NextResponse.json(
        { error: 'Registration failed — no user returned. Please try again.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // ── Create profile in public.users table ──────────────────────────────
    // Try admin client first (bypasses RLS). Fall back to anon client.
    const dbClient = supabaseAdmin || supabaseAnon;
    const { error: profileError } = await dbClient.from('users').insert({
      id: userId,
      email,
      full_name,
      role: assignedRole,
      verified: false,
    });

    if (profileError) {
      // Profile already exists (duplicate) — not fatal
      if (!profileError.message?.toLowerCase().includes('duplicate') &&
          !profileError.message?.toLowerCase().includes('already exists') &&
          !profileError.code?.includes('23505')) {
        // Only fail for non-duplicate errors
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(userId);
        }
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    // ── If admin client available, also set app_metadata.role ─────────────
    // This makes the middleware role-check work without a DB lookup.
    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: assignedRole },
      });
    }

    // ── Check if email confirmation is required ────────────────────────────
    // Supabase returns identities=[] when confirm email is ON and user must confirm
    const emailConfirmationRequired =
      authData.user.identities && authData.user.identities.length === 0;

    if (emailConfirmationRequired) {
      return NextResponse.json({
        message:
          'Account created! Please check your email and click the confirmation link before signing in.',
        needsConfirmation: true,
        user: { id: userId, email, role: assignedRole },
      });
    }

    return NextResponse.json({
      message: 'Account created successfully! You can now sign in.',
      user: { id: userId, email, role: assignedRole },
    });

  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
