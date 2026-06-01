"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OAuthButtons } from "@/components/oauth-buttons"

const PREVIEW_ADMIN_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_ENABLE_PREVIEW_ADMIN === "1"

export default function SignIn() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Congrès Champêtre</CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour accéder à votre espace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Connexion OAuth uniquement */}
          <div className="space-y-4">
            <OAuthButtons
              callbackUrl="/programme"
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>

          {PREVIEW_ADMIN_ENABLED && (
            <div className="space-y-2 border-t pt-4">
              <p className="text-xs text-center text-muted-foreground">
                🧪 Environnement de preview
              </p>
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                disabled={isLoading}
                onClick={() => {
                  setIsLoading(true)
                  signIn("preview-admin", { callbackUrl: "/admin" })
                }}
              >
                Connexion admin automatique
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}