import { NextResponse } from 'next/server';
import { supabaseAdmin, getCallerUser, logAudit } from '../../../lib/supabase-server';
import { userProfileSchema } from '../../../lib/utils/validation';

export async function GET() {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;
    return NextResponse.json({ user: data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await getCallerUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = userProfileSchema.partial().parse(body);

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(validated)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    await logAudit(user, 'UPDATE', 'user_profile', user.id, validated);

    return NextResponse.json({ user: data });
  } catch (error) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
