import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/utils/email';

// Admin client — only works when SUPABASE_SERVICE_ROLE_KEY is a valid JWT
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const hasValidServiceKey = serviceKey.startsWith('eyJ');

const supabaseAdmin = hasValidServiceKey
  ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Anon client — always available, used as fallback for signUp
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { email, password, full_name, role, business_name, phone, address, city } =
      await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields: email, password and full name are required.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const allowedRoles = ['contractor', 'hardware_shop'];
    const assignedRole = allowedRoles.includes(role) ? role : 'contractor';

    let userId = null;

    // ── Strategy 1: Admin client (preferred — auto-confirms, sets app_metadata) ──
    if (supabaseAdmin) {
      // Check if registration is enabled
      const { data: settings } = await supabaseAdmin
        .from('settings')
        .select('value')
        .eq('key', 'enable_registration')
        .maybeSingle();

      if (settings?.value === 'false' || settings?.value === false) {
        return NextResponse.json({ error: 'Registration is currently disabled.' }, { status: 403 });
      }

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        user_metadata: { full_name },
        app_metadata: { role: assignedRole },
        email_confirm: true, // skip email verification — sign in immediately
      });

      if (authError) {
        const msg = authError.message || '';
        if (
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('duplicate') ||
          msg.toLowerCase().includes('already registered')
        ) {
          return NextResponse.json({
            message: 'An account with this email already exists. Please sign in.',
            existingUser: true,
          }, { status: 409 });
        }
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      userId = authData.user.id;

      // Insert profile
      const { error: profileError } = await supabaseAdmin.from('users').insert({
        id: userId,
        email,
        full_name,
        role: assignedRole,
        business_name: assignedRole === 'hardware_shop' ? (business_name || null) : null,
        phone: phone || null,
        address: address || null,
        city: city || null,
        verified: false,
      });

      if (profileError) {
        // Profile insert failed — rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }

    } else {
      // ── Strategy 2: Anon client fallback (works without service role key) ──
      // Uses Supabase's standard signUp — sends confirmation email if enabled in Supabase
      const { data: authData, error: signUpError } = await supabaseAnon.auth.signUp({
        email,
        password,
        options: {
          data: { full_name, role: assignedRole },
        },
      });

      if (signUpError) {
        const msg = signUpError.message || '';
        if (
          msg.toLowerCase().includes('already registered') ||
          msg.toLowerCase().includes('already exists') ||
          msg.toLowerCase().includes('user already registered')
        ) {
          return NextResponse.json({
            message: 'An account with this email already exists. Please sign in.',
            existingUser: true,
          }, { status: 409 });
        }
        return NextResponse.json({ error: msg }, { status: 400 });
      }

      if (!authData?.user) {
        return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 });
      }

      userId = authData.user.id;

      // Try to insert profile — non-fatal if it fails (user still registered)
      try {
        await supabaseAnon.from('users').insert({
          id: userId,
          email,
          full_name,
          role: assignedRole,
          business_name: assignedRole === 'hardware_shop' ? (business_name || null) : null,
          phone: phone || null,
          address: address || null,
          city: city || null,
          verified: false,
        });
      } catch (_) {
        // Profile creation failed — user can still sign in, profile will be created on first login
      }

      // If Supabase email confirmation is enabled, user needs to confirm before signing in
      const needsConfirmation = !authData.user.email_confirmed_at &&
        authData.user.identities?.length === 0;

      if (needsConfirmation || authData.user.identities?.length === 0) {
        return NextResponse.json({
          message: 'Account created! Please check your email and click the confirmation link before signing in.',
          needsConfirmation: true,
          user: { id: userId, email, role: assignedRole },
        });
      }
    }

    // Send welcome email (non-fatal)
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to Material Requisition System',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; background: #f8fafc; border-radius: 8px;">
            <div style="background: #1e40af; padding: 24px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 20px;">Material Requisition System</h1>
            </div>
            <div style="background: #ffffff; padding: 32px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0; border-top: none;">
              <h2 style="color: #0f172a; font-size: 18px; margin-top: 0;">Welcome, ${full_name}!</h2>
              <p style="color: #475569; line-height: 1.6;">Your account has been created as a <strong>${assignedRole === 'hardware_shop' ? 'Hardware Shop' : 'Contractor'}</strong>.</p>
              <p style="color: #475569; line-height: 1.6;">You can now sign in and start using the platform.</p>
              <div style="text-align: center; margin: 24px 0;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://png-req2.vercel.app'}/login"
                   style="background: #1e40af; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
                  Sign In Now
                </a>
              </div>
              ${assignedRole === 'hardware_shop' ? '<p style="color: #64748b; font-size: 13px; background: #f1f5f9; padding: 12px; border-radius: 6px;"><strong>Note:</strong> Your Hardware Shop account requires admin verification before you can receive material requests.</p>' : ''}
            </div>
          </div>
        `,
      });
    } catch (_) {
      // Non-fatal — registration already succeeded
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
