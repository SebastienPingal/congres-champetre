import NextAuth from "next-auth"
import type { DefaultSession, Session, User } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
import Credentials from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers"
import { NextResponse } from "next/server"

export const isPreviewAdminEnabled =
  process.env.VERCEL_ENV === "preview" || process.env.ENABLE_PREVIEW_ADMIN === "1"

const providers: Provider[] = [
  // Google vérifie les adresses email : on peut rattacher sans risque un
  // compte Google à un User existant qui a la même adresse (ex. compte créé
  // via Discord avec l'adresse Gmail), au lieu de renvoyer OAuthAccountNotLinked.
  Google({ allowDangerousEmailAccountLinking: true }),
  // GitHub et Discord renvoient désormais le paramètre `iss` (RFC 9207) dans
  // la redirection OAuth. Sans `issuer` explicite, Auth.js le compare à son
  // placeholder `https://authjs.dev` et rejette la connexion (« Server error »).
  // Leurs endpoints sont déclarés en dur : l'issuer ne sert qu'à cette validation.
  GitHub({ issuer: "https://github.com/login/oauth" }),
  Discord({ issuer: "https://discord.com" }),
]

if (isPreviewAdminEnabled) {
  providers.push(
    Credentials({
      id: "preview-admin",
      name: "Preview Admin",
      credentials: {},
      async authorize() {
        const email = "preview-admin@vercel.local"
        const user = await prisma.user.upsert({
          where: { email },
          update: { role: "ADMIN" },
          create: { email, name: "Preview Admin", role: "ADMIN" },
        })
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    })
  )
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    } & DefaultSession["user"]
  }

  interface User {
    name?: string | null
    role: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
    name?: string | null
    sub?: string
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        const thisUser = await prisma.user.findUnique({
          where: {
            id: token.sub
          }
        })
        token.name = thisUser?.name
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && token.sub) {
        session.user.id = token.sub
        session.user.role = token.role as string
        session.user.name = token.name as string
      }
      return session
    }
  },
  events: {
    // Enregistre la dernière connexion pour savoir qui s'est connecté depuis
    // la création de l'édition en cours (colonne "Connecté" côté admin).
    async signIn({ user }) {
      if (!user?.id) return
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })
      } catch {
        /* ne bloque jamais la connexion */
      }
    },
  },
  pages: {
    signIn: "/auth/signin",
    // Les erreurs « serveur » (Configuration, AccessDenied…) arrivent aussi
    // sur la page de connexion, qui affiche un message lisible via `?error=`.
    error: "/auth/signin",
  }
})

export type SessionUser = {
  id: string
  email: string
  name?: string | null
  role: string
}

type AuthResult = { user: SessionUser; error?: never } | { error: NextResponse; user?: never }

export async function requireUser(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 }) }
  }
  return { user: session.user as SessionUser }
}

export async function requireAdmin(): Promise<AuthResult> {
  const session = await auth()
  if (!session?.user) {
    return { error: NextResponse.json({ error: "🔒 Non authentifié" }, { status: 401 }) }
  }
  if (session.user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "⚠️ Accès refusé - Admin requis" }, { status: 403 }) }
  }
  return { user: session.user as SessionUser }
}