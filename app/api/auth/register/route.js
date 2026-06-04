import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { sendEmail } from '../../../lib/utils/email';

export async function POST(request) {
  try {
    const { email, password, full_name, role, business_name, phone, address, city } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if registration is enabled — use maybeSingle() so a missing row
    // doesn't throw; default to allowing registration if the row isn't found.
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'enable_registration')
      .maybeSingle();

    if (settings?.value === 'false' || settings?.value === false) {
      return NextResponse.json({ error: 'Registration is currently disabled' }, { status: 403 });
    }

    const allowedRoles = ['contractor', 'hardware_shop'];
    const assignedRole = allowedRoles.includes(role) ? role : 'contractor';

    // Create auth user with admin client (requires SUPABASE_SERVICE_ROLE_KEY)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      app_metadata: { role: assignedRole },
      email_confirm: true, // auto-confirm so user can sign in immediately
    });

    if (authError) {
      const message = authError.message || '';
      if (
        message.toLowerCase().includes('already exists') ||
        message.toLowerCase().includes('duplicate') ||
        message.toLowerCase().includes('already registered')
      ) {
        return NextResponse.json({
          message: 'A user with this email already exists. Please sign in using your credentials.',
          existingUser: true,
        }, { status: 409 });
      }
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Create user profile row in public.users
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
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
      // Rollback: delete the auth user if profile insert failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Send welcome email — non-fatal, don't let email failure block registration
    try {
      await sendEmail({
        to: email,
        subject: 'Welcome to PNG Requisition System',
        html: `
          <h2>Welcome ${full_name}!</h2>
          <p>Your account has been created successfully as a ${assignedRole === 'hardware_shop' ? 'Hardware Shop' : 'Contractor'}.</p>
          <p>You can now <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://png-req2.vercel.app'}/login">log in</a> and start using the platform.</p>
          ${assignedRole === 'hardware_shop' ? '<p><strong>Note:</strong> Your account will need to be verified by an admin before you can receive requests.</p>' : ''}
        `,
      });
    } catch (_) {
      // Email sending failed — log but don't fail the registration
    }

    return NextResponse.json({
      message: 'Account created successfully! You can now log in.',
      user: {
        id: authData.user.id,
        email,
        role: assignedRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
