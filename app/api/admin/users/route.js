import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const verified = searchParams.get('verified');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (role) query = query.eq('role', role);
    if (verified !== null && verified !== undefined) query = query.eq('verified', verified === 'true');
    if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,business_name.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return NextResponse.json({
      users: data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id, role, verified } = await request.json();
    const allowedRoles = ['contractor', 'hardware_shop', 'admin'];

    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    let updates = {};

    // Update role in auth.users
    if (role && allowedRoles.includes(role)) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        app_metadata: { role },
      });
      if (authError) throw authError;
      updates.role = role;
    }

    // Update verified status in public.users
    if (verified !== undefined) {
      updates.verified = verified;
    }

    if (Object.keys(updates).length > 0) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .update(updates)
        .eq('id', user_id);

      if (dbError) throw dbError;
    }

    await logAudit(user, 'UPDATE', 'user', user_id, updates);

    return NextResponse.json({ message: 'User updated successfully', updates });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { user_id } = await request.json();
    if (!user_id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (authError) throw authError;

    await logAudit(user, 'DELETE', 'user', user_id);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
