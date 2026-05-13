import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-server';
import { sendEmail } from '../../../lib/utils/email';

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ query: email });
    if (error) {
      console.error('Error looking up user for confirmation:', error.message);
      return NextResponse.json({ error: 'Unable to look up user.' }, { status: 500 });
    }

    const user = data?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'No user found with that email.' }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ message: 'This email is already confirmed.' });
    }

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });

    if (updateError) {
      console.error('Error confirming user:', updateError.message);
      return NextResponse.json({ error: 'Unable to confirm the account at this time.' }, { status: 500 });
    }

    await sendEmail({
      to: email,
      subject: 'Your PNG Requisition account has been confirmed',
      html: `
        <h2>Your account is now confirmed</h2>
        <p>Your PNG Requisition account has been confirmed and you can now sign in using your email and password.</p>
        <p>If you did not request this, please contact support.</p>
      `,
    });

    return NextResponse.json({
      message: 'Your account has been confirmed. Please sign in again.',
      confirmed: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Confirm pending user error:', error);
    return NextResponse.json({ error: 'Unexpected error confirming the account.' }, { status: 500 });
  }
}
