import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_for_development_only_12345"
);

export async function middleware(request: NextRequest) {
  // Only apply to /api routes (except /api/auth/login)
  if (request.nextUrl.pathname.startsWith('/api/') && !request.nextUrl.pathname.startsWith('/api/auth/login')) {
    
    // Check Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid Bearer token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      
      // We can pass the verified payload data downstream if we need to
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-user-role', payload.role as string);
      
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or expired token' },
        { status: 401 }
      );
    }
  }

  // Continue normally for non-API routes (web pages, statics, etc)
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
