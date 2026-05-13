"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CheckCircle2, CircleDot, Lock } from "lucide-react"
import { useUpdateProfile } from "@/hooks/use-user-profile"
import { ConferenceForm } from "@/features/conferences/conference-form"
import { ConferenceEditForm } from "./conference-edit-form"
import { ConferenceDeleteButton } from "./conference-delete-button"
import type { UserProfile } from "@/types"

interface ConferencesSectionProps {
  user: UserProfile
}

export function ConferencesSection({ user }: ConferencesSectionProps) {
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)
  const { mutate: updateProfile, isPending } = useUpdateProfile()
  const locked = user.edition.isRegistrationClosed
  const needsAction = !locked && user.isAttending && user.wantsToSpeak && user.conferences.length === 0
  const disabled = isPending || locked

  return (
    <section id="section-conferences" className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted-foreground">Indiquez si vous souhaitez proposer une conférence pour le weekend.</p>
        {locked ? (
          <Badge variant="outline" className="text-muted-foreground">
            <Lock className="h-3 w-3 mr-1" />Inscriptions fermées
          </Badge>
        ) : needsAction ? (
          <Badge variant="outline" className="border-warn-border text-warn">
            <CircleDot className="h-3 w-3 mr-1" />À compléter
          </Badge>
        ) : user.wantsToSpeak && user.conferences.length > 0 ? (
          <Badge variant="outline" className="border-primary/40 text-primary">
            <CheckCircle2 className="h-3 w-3 mr-1" />Inscrit
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium">Souhaitez-vous proposer une conférence ?</p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={user.wantsToSpeak === true ? "default" : "outline"}
            size="sm"
            onClick={() => updateProfile({ wantsToSpeak: true })}
            disabled={disabled}
          >
            Oui
          </Button>
          <Button
            type="button"
            variant={user.wantsToSpeak === false ? "default" : "outline"}
            size="sm"
            onClick={() => updateProfile({ wantsToSpeak: false })}
            disabled={disabled}
          >
            Non
          </Button>
          <Button
            type="button"
            variant={user.wantsToSpeak === null ? "secondary" : "ghost"}
            size="sm"
            className="text-muted-foreground"
            onClick={() => updateProfile({ wantsToSpeak: null })}
            disabled={disabled}
          >
            Je ne sais pas encore
          </Button>
        </div>
      </div>

      {user.wantsToSpeak && (
        <div className="flex flex-col gap-4">
          {user.conferences.length === 0 ? (
            locked ? (
              <p className="text-sm text-muted-foreground">
                Les inscriptions sont fermées. Contactez l&apos;organisateur si vous souhaitez proposer une conférence.
              </p>
            ) : (
              <ConferenceForm />
            )
          ) : (
            <ul className="divide-y rounded-lg border bg-white/60">
              {user.conferences.map((conference) => (
                <li key={conference.id} className="flex flex-col gap-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h5 className="font-medium">{conference.title}</h5>
                      {conference.description && (
                        <p className="text-sm text-muted-foreground mt-1">{conference.description}</p>
                      )}
                    </div>
                    {conference.timeSlot ? (
                      <Badge variant="outline" className="shrink-0">{conference.timeSlot.title}</Badge>
                    ) : (
                      <Badge variant="secondary" className="shrink-0">Créneau à attribuer</Badge>
                    )}
                  </div>
                  {conference.timeSlot && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(conference.timeSlot.startTime).toLocaleString("fr-FR")} – {new Date(conference.timeSlot.endTime).toLocaleString("fr-FR")}
                    </p>
                  )}
                  {!locked && (
                    <div className="flex items-center gap-2">
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
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
