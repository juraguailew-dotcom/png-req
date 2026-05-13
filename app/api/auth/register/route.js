import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { sendEmail } from '../../../lib/utils/email';

export async function POST(request) {
  try {
    const { email, password, full_name, role, business_name, phone, address, city } = await request.json();

    if (!email || !password || !full_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if registration is enabled
    const { data: settings } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'enable_registration')
      .single();

    if (settings?.value === 'false') {
      return NextResponse.json({ error: 'Registration is currently disabled' }, { status: 403 });
    }

    const allowedRoles = ['contractor', 'hardware_shop'];
    const assignedRole = allowedRoles.includes(role) ? role : 'contractor';

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
      app_metadata: { role: assignedRole },
      // Auto-confirm the new user so they can sign in immediately.
      email_confirm: true,
    });

    if (authError) {
      const message = authError.message || '';
      if (message.toLowerCase().includes('already exists') || message.toLowerCase().includes('duplicate')) {
        return NextResponse.json({
          message: 'A user with this email already exists. Please sign in using your credentials.',
          existingUser: true,
        }, { status: 409 });
      }
      throw authError;
    }

    // Create user profile
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: assignedRole,
        business_name: assignedRole === 'hardware_shop' ? business_name : null,
        phone,
        address,
        city,
        verified: false,
      });

    if (profileError) {
      // Rollback auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    // Send welcome email
    await sendEmail({
      to: email,
      subject: 'Welcome to PNG Requisition System',
      html: `
        <h2>Welcome ${full_name}!</h2>
        <p>Your account has been created successfully as a ${assignedRole}.</p>
        <p>You can now log in and start using the platform.</p>
        ${assignedRole === 'hardware_shop' ? '<p>Note: Your account will need to be verified by an admin before you can receive requests.</p>' : ''}
      `,
    });

    return NextResponse.json({
      message: 'Account created successfully! You can now log in.',
      user: {
        id: authData.user.id,
        email,
        role: assignedRole,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
