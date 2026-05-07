import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { userProfileSchema } from '../../../lib/utils/validation';

export async function GET(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await getCallerUser();
    if (!user || user.app_metadata?.role !== 'contractor') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validated = userProfileSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(validated)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'user_profile', user.id, { fields: Object.keys(validated) });

    return NextResponse.json({ profile: data });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
