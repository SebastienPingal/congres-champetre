"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { User } from "next-auth"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (session) {
      // Rediriger selon le rôle
      if ((session.user as User).role === "ADMIN") {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Congrès Champêtre
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Organisez votre weekend de conférences dans un cadre champêtre
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pour les participants
              </CardTitle>
              <CardDescription>
                Proposez vos conférences et gérez votre participation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span>•</span> Indiquez si vous souhaitez faire une conférence
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Proposez le sujet de votre présentation
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Choisissez votre créneau préféré
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Suivez l&apos;organisation du weekend
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Pour les organisateurs
              </CardTitle>
              <CardDescription>
                Gérez les créneaux et organisez le planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2">
                  <span>•</span> Créez et gérez les créneaux horaires
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Assignez les conférences aux créneaux
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Visualisez toutes les propositions
                </li>
                <li className="flex items-center gap-2">
                  <span>•</span> Organisez le planning complet
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signin">
              <Button size="lg" className="text-lg px-8">
                Se connecter
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="lg" variant="outline" className="text-lg px-8">
                S&apos;inscrire
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Un weekend inoubliable vous attend dans la campagne
          </p>
        </div>
      </div>
    </div>
  )
}