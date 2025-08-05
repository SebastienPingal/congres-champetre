import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default async function middleware(request: NextRequest) {
  const session = await auth()
  const { pathname } = request.nextUrl
  console.log("🍀 session", session)
  
  // 🛡️ Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin']
  // 🏠 Public routes that should redirect authenticated users
  const publicRoutes = ['/', '/auth/signin', '/auth/signup']
  
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)
  
  // 🔒 Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !session) {
    const signInUrl = new URL('/auth/signin', request.url)
    // Add callback URL so user is redirected back after login
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }
  
  // 👤 Redirect authenticated users from public routes to their dashboard
  if (isPublicRoute && session) {
    console.log("🍀 session", session)
    const user = session.user as { role: string }
    
    // 👑 Admin users go to admin page
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    
    // 👨‍💼 Regular users go to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 🚫 Prevent non-admin users from accessing admin routes
  if (pathname.startsWith('/admin') && session) {
    const user = session.user as { role: string }
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.webp$).*)',
  ],
}