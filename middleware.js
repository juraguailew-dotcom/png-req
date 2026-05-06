import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

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

  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (user && pathname === '/login') {
    const role = user.app_metadata?.role;
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'hardware_shop') return NextResponse.redirect(new URL('/shop', request.url));
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (user) {
    const role = user.app_metadata?.role;
    if (pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/shop') && role !== 'hardware_shop') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Contractors shouldn't access /admin or /shop
    if (role === 'hardware_shop' && pathname === '/') {
      return NextResponse.redirect(new URL('/shop', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
