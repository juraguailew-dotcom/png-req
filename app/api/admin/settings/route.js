import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) throw error;

    // Convert to object format
    const settings = {};
    data?.forEach(setting => {
      settings[setting.key] = setting.value;
    });

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Upsert the setting
    const { data, error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key,
        value,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE_SETTING', 'settings', key, { new_value: value });

    return NextResponse.json({ setting: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
