import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { email, password, full_name, role } = await request.json();

  if (!email || !password || !full_name) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const allowedRoles = ['contractor', 'hardware_shop'];
  const assignedRole = allowedRoles.includes(role) ? role : 'contractor';

  const { error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    user_metadata: { full_name },
    app_metadata: { role: assignedRole },
    email_confirm: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ message: 'Account created! You can now log in.' });
}
