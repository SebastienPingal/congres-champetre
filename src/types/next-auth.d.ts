declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      role: string
    }
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