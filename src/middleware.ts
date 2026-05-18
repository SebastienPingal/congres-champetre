import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const pathname = nextUrl.pathname

  // 🏠 Handle home page redirection based on auth status
  if (pathname === '/') {
    if (req.auth) {
      // User is authenticated, redirect to dashboard
      return NextResponse.redirect(new URL('/programme', req.url))
    } else {
      // User is not authenticated, redirect to login
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  // 🔒 Protect routes that require authentication
  const protectedRoutes = ['/programme', '/presence', '/repas', '/conferences', '/paiement', '/dashboard', '/admin']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute && !req.auth) {
    // User is not authenticated, redirect to signin
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }

  // ✅ Allow public routes (signin, signup, etc.)
  return NextResponse.next()
})

// Optionally, don't invoke Middleware on some paths
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}