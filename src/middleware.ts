import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware() {
    // Le middleware ne fait rien de spécial ici
    // La logique de redirection est gérée dans les pages
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permettre l'accès aux routes publiques
        if (req.nextUrl.pathname.startsWith("/auth/")) {
          return true
        }
        
        // Requérir une authentification pour les autres routes protégées
        if (req.nextUrl.pathname.startsWith("/dashboard") || 
            req.nextUrl.pathname.startsWith("/admin")) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/:path*"]
}