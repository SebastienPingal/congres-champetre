"use client"

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react"
import { useSession } from "next-auth/react"
import type { User } from "next-auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type RecipientFilter = "all" | "participants" | "non_participants" | "not_paid" | "paid" | "speakers"

const FILTER_LABELS: Record<RecipientFilter, string> = {
  all: "Tous les utilisateurs",
  participants: "Participants à l'édition en cours",
  non_participants: "Non-participants (pas inscrits)",
  not_paid: "Participants n'ayant pas payé",
  paid: "Participants ayant payé",
  speakers: "Conférenciers de l'édition en cours",
}

type SendResponse = {
  mode?: "admin_test" | "broadcast"
  total: number
  sent: number
  failed: number
  errors?: Array<{ email: string; error: string }>
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"]

export default function AdminEmailsPage() {
  const { data: session, status } = useSession()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [filter, setFilter] = useState<RecipientFilter>("all")
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<SendResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isAdmin = (session?.user as User | undefined)?.role === "ADMIN"

  useEffect(() => {
    if (!image) {
      setImagePreview(null)
      return
    }
    const url = URL.createObjectURL(image)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setImage(null)
      return
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError("⚠️ Format d'image non supporté (png, jpeg, gif, webp).")
      event.target.value = ""
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("⚠️ Image trop volumineuse (5 Mo maximum).")
      event.target.value = ""
      return
    }
    setImage(file)
  }

  const clearImage = () => {
    setImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const submitEmail = async (sendToAdminOnly: boolean) => {
    setError(null)
    setResult(null)

    if (subject.trim().length < 3) {
      setError("⚠️ Le sujet doit contenir au moins 3 caractères.")
      return
    }

    if (message.trim().length < 5) {
      setError("⚠️ Le message doit contenir au moins 5 caractères.")
      return
    }

    const filterLabel = FILTER_LABELS[filter].toLowerCase()
    const confirmationMessage = sendToAdminOnly
      ? "Confirmer l'envoi d'un email test vers votre adresse admin ?"
      : `Confirmer l'envoi de cet email à : ${filterLabel} ?`
    const confirmed = window.confirm(confirmationMessage)
    if (!confirmed) return

    try {
      setIsSending(true)
      const formData = new FormData()
      formData.append("subject", subject.trim())
      formData.append("message", message.trim())
      formData.append("sendToAdminOnly", String(sendToAdminOnly))
      formData.append("filter", filter)
      if (image) formData.append("image", image)

      const response = await fetch("/api/admin/emails", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        setError(typeof data?.error === "string" ? data.error : "❌ Échec de l'envoi.")
        return
      }

      setResult(data)
      if (!sendToAdminOnly) {
        setSubject("")
        setMessage("")
        clearImage()
      }
    } catch (submitError) {
      console.error("📧🚨 Erreur lors de l'envoi depuis la page admin:", submitError)
      setError("❌ Une erreur est survenue pendant l'envoi.")
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    await submitEmail(false)
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>⏳ Chargement...</p>
      </div>
    )
  }

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Accès refusé</CardTitle>
              <CardDescription>Cette page est réservée aux administrateurs.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Email global</CardTitle>
            <CardDescription>
              Rédigez un email et choisissez les destinataires.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email-filter">Destinataires</Label>
                <select
                  id="email-filter"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value as RecipientFilter)}
                  className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                >
                  {(Object.entries(FILTER_LABELS) as [RecipientFilter, string][]).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email-subject">Sujet</Label>
                <Input
                  id="email-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="Informations importantes pour les participants"
                  maxLength={200}
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email-message">Message</Label>
                <p className="text-xs text-gray-600">
                  Format Markdown supporté: titres (`#`), listes (`- item`), `**gras**`, `*italique*`, liens (`[texte](https://...)`).
                </p>
                <textarea
                  id="email-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={"# Infos weekend\n\nBonjour a tous,\n\n- Arrivee: 9h\n- Debut conferences: 10h\n\nMerci !"}
                  rows={10}
                  maxLength={10000}
                  required
                  className="w-full min-h-40 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="email-image">Image (optionnelle)</Label>
                <p className="text-xs text-gray-600">
                  L&apos;image sera jointe en pièce jointe à l&apos;email. Formats: png, jpeg, gif, webp. Taille max: 5 Mo.
                </p>
                <input
                  ref={fileInputRef}
                  id="email-image"
                  type="file"
                  accept={ACCEPTED_IMAGE_TYPES.join(",")}
                  onChange={handleImageChange}
                  className="text-sm"
                />
                {image && imagePreview && (
                  <div className="flex items-start gap-3 mt-1">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Aperçu"
                      className="max-h-40 rounded-md border border-input object-contain"
                    />
                    <div className="flex flex-col gap-1 text-xs text-gray-600">
                      <span className="font-medium">{image.name}</span>
                      <span>{(image.size / 1024).toFixed(1)} Ko</span>
                      <Button type="button" variant="outline" size="sm" onClick={clearImage} disabled={isSending}>
                        Retirer
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Envoi en cours..." : `Envoyer à : ${FILTER_LABELS[filter].toLowerCase()}`}
                </Button>
                <Button type="button" variant="outline" disabled={isSending} onClick={() => submitEmail(true)}>
                  {isSending ? "Envoi en cours..." : "Envoyer un test à mon email admin"}
                </Button>
                <p className="text-sm text-gray-600">
                  Test admin puis envoi global: un email est envoyé individuellement à chaque destinataire.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && (
          <Card>
            <CardContent>
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card>
            <CardHeader>
              <CardTitle>Résultat de l&apos;envoi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <p>
                🧪 Mode: {result.mode === "admin_test" ? "Test admin" : "Envoi global"}
              </p>
              <p>📨 Total ciblé: {result.total}</p>
              <p>✅ Envoyés: {result.sent}</p>
              <p>❌ En échec: {result.failed}</p>
              {Array.isArray(result.errors) && result.errors.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="font-medium">Erreurs (max 20):</p>
                  {result.errors.map((entry) => (
                    <p key={entry.email} className="text-red-600">
                      - {entry.email}: {entry.error}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
