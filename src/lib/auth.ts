import NextAuth from "next-auth"
import type { DefaultSession, Session, User } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { JWT } from "next-auth/jwt";
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
import { NextResponse } from "next/server"

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
  providers: [Google, GitHub, Discord],
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
  pages: {
    signIn: "/auth/signin"
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