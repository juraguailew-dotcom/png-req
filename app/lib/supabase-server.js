import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Get user role from either app_metadata (admin-set) or user_metadata (signUp-set).
 * app_metadata is more secure but requires the admin client to set.
 * user_metadata is set during signUp and readable on all clients.
 */
export function getUserRole(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role || null;
}



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
 * Get the current authenticated user from cookies.
 * Normalises the role into user.app_metadata.role by reading from
 * both app_metadata (admin-set) and user_metadata (signUp-set),
 * so all API route role checks work regardless of how the user was created.
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
        },
      }
    );
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) return null;

    // Normalise role: app_metadata wins (set by admin), falls back to user_metadata (set by signUp)
    const role =
      user.app_metadata?.role ||
      user.user_metadata?.role ||
      null;

    // Patch the user object so all existing role checks work unchanged
    if (role && !user.app_metadata?.role) {
      user.app_metadata = { ...(user.app_metadata || {}), role };
    }

    return user;
  } catch (_) {
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
      actor_role: actor?.app_metadata?.role || actor?.user_metadata?.role || null,
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
