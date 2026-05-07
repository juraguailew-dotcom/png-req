import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../../lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { verified, business_name, phone, address, city } = body;

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...(verified !== undefined && { verified }),
        ...(business_name && { business_name }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(city && { city }),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'user', id, { fields: Object.keys(body) });

    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from users table (cascade will handle auth)
    const { error: deleteError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Delete from auth
    await supabaseAdmin.auth.admin.deleteUser(id);

    await logAudit(user, 'DELETE', 'user', id, {});

    return NextResponse.json({ message: 'User deleted' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
