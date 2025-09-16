import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || "your-secret-key-here-change-this-in-production" 
  })
  
  console.log('Middleware - token exists:', !!token);
  console.log('Middleware - path:', request.nextUrl.pathname);
  console.log('Middleware - token details:', token);

  // Allow access to auth pages without token
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // For protected routes, require token
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/buyers/:path*",
  ],
};
