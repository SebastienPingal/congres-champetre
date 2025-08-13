"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { formatDateTimeRange } from "@/lib/helper"
import { ConferenceEditForm } from "@/components/conference-edit-form"
import { ConferenceDeleteButton } from "@/components/conference-delete-button"

interface Conference {
  id: string
  title: string
  description?: string
  speaker: {
    id: string
    name: string
    email: string
  }
  timeSlot?: {
    id: string
    title: string
    startTime: string
    endTime: string
  }
}

// Removed TimeSlot type usage in this component

interface ConferenceManagerProps {
  conferences: Conference[]
  onConferenceUpdated: () => void
}

export function ConferenceManager({ conferences, onConferenceUpdated }: ConferenceManagerProps) {
  const [editingConferenceId, setEditingConferenceId] = useState<string | null>(null)
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Gestion des conférences
        </CardTitle>
        <CardDescription>
          Assignez des créneaux aux conférences proposées
        </CardDescription>
      </CardHeader>

      <CardContent>
        {conferences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">•</div>
            <p>Aucune conférence proposée pour le moment</p>
            <p className="text-sm">Les participants peuvent proposer des conférences depuis leur dashboard</p>
          </div>
        ) : (
          <div className="space-y-4">
            {conferences.map((conference) => (
              <div key={conference.id} className="p-4 border rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium">{conference.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      {conference.speaker.name} ({conference.speaker.email})
                    </p>
                    {conference.description && (
                      <p className="text-sm text-gray-500 mb-2">
                        {conference.description}
                      </p>
                    )}

                    {conference.timeSlot ? (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {conference.timeSlot.title}
                        </Badge>
                        <span className="text-xs text-gray-500">
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
      </CardContent>
    </Card>
  )
}