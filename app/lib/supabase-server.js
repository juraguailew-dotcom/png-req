import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';



/**
 * Admin Supabase client with service role for privileged operations.
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * The service role key is a long JWT starting with "eyJ" — get it from
 * Supabase Dashboard → Project Settings → API → service_role key.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Get the current authenticated user from cookies
 */
export async function getCallerUser() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { 
        cookies: { 
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        } 
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Log audit trail for important actions
 */
export async function logAudit(actor, action, entity, entity_id, details = {}) {
  try {
    const { error } = await supabaseAdmin.from('audit_logs').insert({
      actor_id: actor?.id || null,
      actor_email: actor?.email || null,
      action,
      entity,
      entity_id: String(entity_id),
      details: JSON.stringify(details),
      created_at: new Date().toISOString(),
    });

    if (error) {
      return;
    }
  } catch (error) {
    return;
  }
}
