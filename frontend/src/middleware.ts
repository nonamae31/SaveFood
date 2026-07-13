import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PRIVATE_ROUTES = ['/complaints', '/profile', '/settings', '/dashboard'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const isPrivate = PRIVATE_ROUTES.some(r => request.nextUrl.pathname.startsWith(r));

  if (isPrivate && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/complaints/:path*', '/profile/:path*', '/dashboard/:path*'],
};
