"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OAuthButtons } from "@/components/oauth-buttons"

export default function SignUp() {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Congrès Champêtre</CardTitle>
          <CardDescription className="text-center">
            Créez votre compte pour participer au weekend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inscription OAuth uniquement */}
          <div className="space-y-4">
            <OAuthButtons 
              callbackUrl="/dashboard" 
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}