import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCallerRole() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user?.app_metadata?.role;
}

export async function GET() {
  if (await getCallerRole() !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || '',
    role: u.app_metadata?.role || 'contractor',
    created_at: u.created_at,
  }));
  return NextResponse.json({ users });
}

export async function PATCH(request) {
  if (await getCallerRole() !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const { user_id, role } = await request.json();
  const allowed = ['contractor', 'hardware_shop', 'admin'];
  if (!user_id || !allowed.includes(role)) {
    return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
  }
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
    app_metadata: { role },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: 'Role updated.' });
}
