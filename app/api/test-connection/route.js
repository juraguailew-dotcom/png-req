import { supabaseAdmin } from '@/app/lib/supabase-server';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count');
    if (error) throw error;
    return Response.json({ success: true, message: 'Supabase connected!' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
