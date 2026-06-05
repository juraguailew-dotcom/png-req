import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request) {
  try {
    const { email, password, full_name, role } = await request.json();

    // ── Validate input ────────────────────────────────────────────────────
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

    const assignedRole = ['contractor', 'hardware_shop'].includes(role)
      ? role
      : 'contractor';

    // ── Create Supabase clients fresh per request ─────────────────────────
    // (avoids module-level caching issues on Vercel edge)
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAnon = createClient(url, anonKey);
    const supabaseAdmin = serviceKey.startsWith('eyJ')
      ? createClient(url, serviceKey, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null;

    // ── Sign up ───────────────────────────────────────────────────────────
    const { data: authData, error: signUpError } = await supabaseAnon.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name,
          role: assignedRole, // user_metadata — readable client-side
        },
      },
    });

    if (signUpError) {
      const msg = signUpError.message || '';
      // Supabase returns a generic "User already registered" when email exists
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
        { error: 'Registration failed — please try again.' },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // ── Check email confirmation requirement ──────────────────────────────
    // When Supabase email confirmation is ON, identities array is empty
    // and the user cannot sign in until they click the confirmation email.
    const emailConfirmationRequired =
      Array.isArray(authData.user.identities) &&
      authData.user.identities.length === 0;

    // ── Create profile row in public.users ────────────────────────────────
    // Use admin client (bypasses RLS) if available, otherwise anon client
    const dbClient = supabaseAdmin || supabaseAnon;
    const { error: profileError } = await dbClient.from('users').insert({
      id: userId,
      email,
      full_name,
      role: assignedRole,
      verified: false,
    });

    if (profileError) {
      const isAlreadyExists =
        profileError.code === '23505' ||
        profileError.message?.toLowerCase().includes('duplicate') ||
        profileError.message?.toLowerCase().includes('already exists');

      if (!isAlreadyExists) {
        // Profile creation failed for an unexpected reason — roll back auth user
        if (supabaseAdmin) {
          await supabaseAdmin.auth.admin.deleteUser(userId).catch(() => {});
        }
        return NextResponse.json(
          { error: `Account created but profile setup failed: ${profileError.message}` },
          { status: 500 }
        );
      }
      // Profile row already exists — that's fine, continue
    }

    // ── Set app_metadata.role via admin client (if available) ─────────────
    // This lets the middleware and API routes use app_metadata.role directly,
    // which is more secure since users cannot modify app_metadata themselves.
    if (supabaseAdmin && !emailConfirmationRequired) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { role: assignedRole },
      }).catch(() => {
        // Non-fatal — role is still readable from user_metadata
      });
    }

    // ── Return result ─────────────────────────────────────────────────────
    if (emailConfirmationRequired) {
      return NextResponse.json({
        message:
          'Account created! Please check your email inbox and click the confirmation link, then come back to sign in.',
        needsConfirmation: true,
        user: { id: userId, email, role: assignedRole },
      });
    }

    return NextResponse.json({
      message: 'Account created successfully! You can now sign in with your email and password.',
      user: { id: userId, email, role: assignedRole },
    });

  } catch (err) {
    return NextResponse.json(
      { error: err.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
