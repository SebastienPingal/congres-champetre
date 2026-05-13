"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDateTimeRange } from "@/lib/helper"
import { ConferenceEditForm } from "@/features/conferences/conference-edit-form"
import { ConferenceDeleteButton } from "@/features/conferences/conference-delete-button"
import { ConferenceCreateDialog } from "@/components/admin/conference-create-dialog"
import type { Conference } from "@/types"

interface ConferenceManagerProps {
  conferences: Conference[]
  onConferenceUpdated: () => void
}

export function ConferenceManager({ conferences, onConferenceUpdated }: ConferenceManagerProps) {
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)
  

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end">
        <ConferenceCreateDialog conferences={conferences} onConferenceCreated={onConferenceUpdated} />
      </div>
      {conferences.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <div className="text-4xl">•</div>
          <p>Aucune conférence proposée pour le moment</p>
          <p className="text-sm">Les participants peuvent proposer des conférences depuis leur dashboard</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {conferences.map((conference) => (
            <div key={conference.id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1 flex flex-col gap-2">
                  <h4 className="font-medium">{conference.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {conference.speaker.name} ({conference.speaker.email})
                  </p>
                  {conference.description && (
                    <p className="text-sm text-muted-foreground">
                      {conference.description}
                    </p>
                  )}
                  {conference.timeSlot ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {conference.timeSlot.title}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDateTimeRange(conference.timeSlot.startTime, conference.timeSlot.endTime)}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="secondary">
                      Pas de créneau assigné
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={editingConferenceId === conference.id} onOpenChange={(open) => setEditingConferenceId(open ? conference.id : null)}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Éditer</Button>
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
                          timeSlot: conference.timeSlot ? { id: conference.timeSlot.id } : null
                        }}
                        onUpdated={() => {
                          onConferenceUpdated()
                        }}
                        onClose={() => setEditingConferenceId(null)}
                      />
                    </DialogContent>
                  </Dialog>
                  <ConferenceDeleteButton 
                    conferenceId={conference.id}
                    onDeleted={() => {
                      if (editingConferenceId === conference.id) setEditingConferenceId(null)
                      onConferenceUpdated()
                    }}
                    label="Supprimer"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}