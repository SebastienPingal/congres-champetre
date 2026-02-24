"use client"

import { FormEvent, useState } from "react"
import { useSession } from "next-auth/react"
import type { User } from "next-auth"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type SendResponse = {
  mode?: "admin_test" | "broadcast"
  total: number
  sent: number
  failed: number
  errors?: Array<{ email: string; error: string }>
}

export default function AdminEmailsPage() {
  const { data: session, status } = useSession()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [result, setResult] = useState<SendResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isAdmin = (session?.user as User | undefined)?.role === "ADMIN"

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

    const confirmationMessage = sendToAdminOnly
      ? "Confirmer l'envoi d'un email test vers votre adresse admin ?"
      : "Confirmer l'envoi de cet email à tous les utilisateurs ?"
    const confirmed = window.confirm(confirmationMessage)
    if (!confirmed) return

    try {
      setIsSending(true)
      const response = await fetch("/api/admin/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
          sendToAdminOnly,
        }),
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
              Rédigez un email qui sera envoyé à tous les utilisateurs (rôle USER).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={isSending}>
                  {isSending ? "Envoi en cours..." : "Envoyer à tous les utilisateurs"}
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
