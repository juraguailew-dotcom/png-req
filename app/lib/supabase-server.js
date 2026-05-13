import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Validate required environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
];

requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    console.warn(`Missing environment variable: ${envVar}`);
  }
});

/**
 * Admin Supabase client with service role for privileged operations
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
      console.error('Failed to get user:', error.message);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error getting caller user:', error);
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
      console.error('Failed to log audit:', error);
    }
  } catch (error) {
    console.error('Error logging audit:', error);
  }
}

/**
 * Check user permissions for an action
 */
export async function checkPermission(user, action, resource) {
  const role = user?.app_metadata?.role;
  
  const permissions = {
    admin: ['read', 'create', 'update', 'delete'],
    hardware_shop: ['read', 'create', 'update'],
    contractor: ['read', 'create'],
  };

  return permissions[role]?.includes(action) || false;
}

/**
 * Get user profile with caching capability
 */
export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

