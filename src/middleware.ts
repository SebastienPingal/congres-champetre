import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // Get session from the request (already available in auth middleware)
  const isLoggedIn = !!req.auth
  const user = req.auth?.user as { role: string } | undefined

  console.log("🍀 session", req.auth)

  // 🛡️ Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/admin', '/']
  // 🏠 Public routes that should redirect authenticated users
  const publicRoutes = ['/auth/signin', '/auth/signup']

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(pathname)

  // 🔒 Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', req.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  // 👤 Redirect authenticated users from public routes to their dashboard
  if (isPublicRoute && isLoggedIn && user) {
    // 👑 Admin users go to admin page
    if (user.role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // 👨‍💼 Regular users go to dashboard
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 🚫 Prevent non-admin users from accessing admin routes
  if (pathname.startsWith('/admin') && isLoggedIn && user) {
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
})

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