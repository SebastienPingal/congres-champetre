"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { OAuthButtons } from "@/components/oauth-buttons"

const PREVIEW_ADMIN_ENABLED =
  process.env.NEXT_PUBLIC_VERCEL_ENV === "preview" ||
  process.env.NEXT_PUBLIC_ENABLE_PREVIEW_ADMIN === "1"

// Codes renvoyés par Auth.js dans `?error=` (pages.signIn et pages.error
// pointent tous deux ici, cf. src/lib/auth.ts).
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  OAuthAccountNotLinked: {
    title: "Ce compte existe déjà",
    description:
      "Un compte utilise déjà cette adresse email, mais il a été créé avec un autre service. Reconnectez-vous avec celui utilisé la première fois (Google, Discord ou GitHub).",
  },
  AccessDenied: {
    title: "Connexion refusée",
    description: "L'autorisation a été annulée ou refusée. Vous pouvez réessayer.",
  },
  MissingCSRF: {
    title: "Session expirée",
    description: "La page de connexion a expiré. Réessayez.",
  },
}

const DEFAULT_ERROR = {
  title: "La connexion a échoué",
  description:
    "Un problème technique a empêché la connexion. Réessayez, ou essayez un autre service ; si le problème persiste, prévenez les organisateurs.",
}

function SignInError() {
  const error = useSearchParams().get("error")
  if (!error) return null

  const { title, description } = ERROR_MESSAGES[error] ?? DEFAULT_ERROR

  return (
    <Alert variant="destructive">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  )
}

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
          <Suspense fallback={null}>
            <SignInError />
          </Suspense>

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