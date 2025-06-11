// src/middleware.js
import { NextResponse } from 'next/server';

const PASSWORD = 'apechainontopbaby'; // Ändere das Passwort hier

export function middleware(request) {
  // Skip password check for API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if user has valid session
  const authCookie = request.cookies.get('apecrowd-auth');
  
  if (authCookie?.value === 'authenticated') {
    return NextResponse.next();
  }

  // If accessing login page, show it
  if (request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Check if it's a login POST request
  if (request.method === 'POST' && request.nextUrl.pathname === '/login') {
    return NextResponse.next();
  }

  // Redirect to login for all other requests
  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};