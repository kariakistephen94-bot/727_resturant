import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/server/fake-auth';

// Login is not wired up yet — flip to true once real auth is ready to gate /admin.
const REQUIRE_ADMIN_LOGIN = false;

export function middleware(request: NextRequest) {
  if (!REQUIRE_ADMIN_LOGIN) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isAdminPage = pathname.startsWith('/admin');
  const hasSession = Boolean(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (!hasSession && isAdminPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
