import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];

/**
 * Get user role from either app_metadata (admin-created users)
 * or user_metadata (signUp-created users).
 * app_metadata takes priority as it's more secure (can't be changed by user).
 */
function getUserRole(user) {
  return user?.app_metadata?.role || user?.user_metadata?.role || 'contractor';
}

export async function middleware(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Unauthenticated → redirect to login
  if (!user && !isPublicPath) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated on login page → redirect to their dashboard
  if (user && isPublicPath && !request.nextUrl.searchParams.has('redirect')) {
    const role = getUserRole(user);
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'hardware_shop') return NextResponse.redirect(new URL('/shop', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Role-based access control
  if (user) {
    const role = getUserRole(user);

    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/shop') && role !== 'hardware_shop') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (role === 'hardware_shop' && pathname === '/') {
      return NextResponse.redirect(new URL('/shop', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|public).*)'],
};
