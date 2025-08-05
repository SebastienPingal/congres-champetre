"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { ConferenceForm } from "@/components/conference-form"

interface User {
  id: string
  name: string
  email: string
  role: string
  wantsToSpeak: boolean
  conferences: Array<{
    id: string
    title: string
    description?: string
    timeSlot?: {
      id: string
      title: string
      startTime: string
      endTime: string
    }
  }>
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchUserProfile()
  }, [session, status, router])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/user/profile")
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (error) {
      console.error("🚨 Erreur lors du chargement du profil:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWantsToSpeakChange = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wantsToSpeak: checked }),
      })

      if (response.ok) {
        const result = await response.json()
        setUser(result.user)
      }
    } catch (error) {
      console.error("🚨 Erreur lors de la mise à jour:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleConferenceCreated = () => {
    fetchUserProfile()
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenue, {user.name} !
          </h1>
          <p className="text-gray-600">
            Gérez votre participation au weekend champêtre
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Participation aux conférences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Participation aux conférences
              </CardTitle>
              <CardDescription>
                Indiquez si vous souhaitez présenter une conférence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="wantsToSpeak"
                  checked={user.wantsToSpeak}
                  onCheckedChange={handleWantsToSpeakChange}
                  disabled={isUpdating}
                />
                <label htmlFor="wantsToSpeak" className="text-sm font-medium">
                  Je souhaite faire une présentation
                </label>
              </div>
              
              {user.wantsToSpeak && (
                <div className="pt-4 border-t">
                  <Badge variant="secondary" className="mb-4">
                    Conférencier inscrit
                  </Badge>
                  
                  {user.conferences.length === 0 ? (
                    <ConferenceForm onConferenceCreated={handleConferenceCreated} />
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Votre conférence :</h4>
                      {user.conferences.map((conference) => (
                        <div key={conference.id} className="p-3 bg-gray-50 rounded-lg">
                          <h5 className="font-medium">{conference.title}</h5>
                          {conference.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {conference.description}
                            </p>
                          )}
                          {conference.timeSlot ? (
                            <div className="mt-2 text-sm">
                              <Badge variant="outline">
                                {conference.timeSlot.title}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(conference.timeSlot.startTime).toLocaleString("fr-FR")} - {" "}
                                {new Date(conference.timeSlot.endTime).toLocaleString("fr-FR")}
                              </p>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="mt-2">
                              En attente d&apos;attribution de créneau
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Informations du weekend
              </CardTitle>
              <CardDescription>
                Détails pratiques et planning
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">•</span>
                  <div>
                    <p className="font-medium">Lieu</p>
                    <p className="text-sm text-gray-600">À définir</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">•</span>
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-gray-600">Weekend à venir</p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl">•</span>
                  <div>
                    <p className="font-medium">Participants</p>
                    <p className="text-sm text-gray-600">Liste en cours de constitution</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}