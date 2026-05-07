import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .order('key');

    if (error) throw error;

    const settings = {};
    data?.forEach(s => {
      settings[s.key] = s.value;
    });

    return NextResponse.json({ settings });
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

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key,
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'setting', key, { value });

    return NextResponse.json({ setting: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
