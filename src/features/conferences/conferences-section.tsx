"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CircleDot } from "lucide-react"
import { useUpdateProfile } from "@/hooks/use-user-profile"
import { ConferenceForm } from "@/components/conference-form"
import { ConferenceEditForm } from "./conference-edit-form"
import { ConferenceDeleteButton } from "./conference-delete-button"
import type { UserProfile } from "@/types"

interface ConferencesSectionProps {
  user: UserProfile
}

export function ConferencesSection({ user }: ConferencesSectionProps) {
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const needsAction = user.isAttending && user.wantsToSpeak && user.conferences.length === 0

  return (
    <Card
      id="section-conferences"
      className={needsAction ? "animate-border-rotate animate-border-rotate-violet shadow-md" : "border-l-4 border-l-violet-300"}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Participation aux conférences</CardTitle>
          {needsAction && (
            <Badge className="bg-violet-100 text-violet-800 hover:bg-violet-100 border-violet-300" variant="outline">
              <CircleDot className="h-3 w-3 mr-1" />À compléter
            </Badge>
          )}
        </div>
        <CardDescription>Indiquez si vous souhaitez présenter une conférence</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Souhaitez-vous proposer une conférence ?</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={user.wantsToSpeak === true ? "default" : "outline"}
              size="sm"
              onClick={() => updateProfile({ wantsToSpeak: true })}
              disabled={isPending}
            >
              Oui
            </Button>
            <Button
              type="button"
              variant={user.wantsToSpeak === false ? "default" : "outline"}
              size="sm"
              onClick={() => updateProfile({ wantsToSpeak: false })}
              disabled={isPending}
            >
              Non
            </Button>
            <Button
              type="button"
              variant={user.wantsToSpeak === null ? "secondary" : "ghost"}
              size="sm"
              className="text-gray-500"
              onClick={() => updateProfile({ wantsToSpeak: null })}
              disabled={isPending}
            >
              Je ne sais pas encore
            </Button>
          </div>
        </div>

        {user.wantsToSpeak && (
          <div className="pt-4 border-t">
            <Badge variant="secondary" className="mb-4">Conférencier inscrit</Badge>

            {user.conferences.length === 0 ? (
              <ConferenceForm />
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Votre conférence :</h4>
                {user.conferences.map((conference) => (
                  <div key={conference.id} className="p-3 bg-gray-50 rounded-lg">
                    <h5 className="font-medium">{conference.title}</h5>
                    {conference.description && (
                      <p className="text-sm text-gray-600 mt-1">{conference.description}</p>
                    )}
                    {conference.timeSlot ? (
                      <div className="mt-2 text-sm">
                        <Badge variant="outline">{conference.timeSlot.title}</Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(conference.timeSlot.startTime).toLocaleString("fr-FR")} -{" "}
                          {new Date(conference.timeSlot.endTime).toLocaleString("fr-FR")}
                        </p>
                      </div>
                    ) : (
                      <Badge variant="secondary" className="mt-2">
                        En attente d&apos;attribution de créneau
                      </Badge>
                    )}

                    <div className="flex items-center gap-2 mt-3">
                      <Dialog
                        open={editingConferenceId === conference.id}
                        onOpenChange={(open) => setEditingConferenceId(open ? conference.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">Modifier</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Modifier la conférence</DialogTitle>
                          </DialogHeader>
                          <ConferenceEditForm
                            conference={{
                              id: conference.id,
                              title: conference.title,
                              description: conference.description,
                              timeSlot: conference.timeSlot ? { id: conference.timeSlot.id } : null,
                            }}
                            onClose={() => setEditingConferenceId(null)}
                          />
                        </DialogContent>
                      </Dialog>
                      <ConferenceDeleteButton
                        conferenceId={conference.id}
                        onDeleted={() => setEditingConferenceId(null)}
                        label="Supprimer"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
