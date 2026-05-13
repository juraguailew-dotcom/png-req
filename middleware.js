import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

// Paths that don't require authentication
const PUBLIC_PATHS = ['/login', '/register'];

// Role-based path restrictions
const ROLE_PATHS = {
  admin: ['/admin'],
  hardware_shop: ['/shop'],
};

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Check if path is public
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

  // Redirect unauthenticated users to login
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login
  if (user && isPublicPath) {
    const role = user.app_metadata?.role;
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'hardware_shop') return NextResponse.redirect(new URL('/shop', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Enforce role-based access control
  if (user) {
    const role = user.app_metadata?.role;
    
    // Check admin access
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Check shop access
    if (pathname.startsWith('/shop') && role !== 'hardware_shop') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // Redirect shop owners from contractor dashboard
    if (role === 'hardware_shop' && pathname === '/') {
      return NextResponse.redirect(new URL('/shop', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
