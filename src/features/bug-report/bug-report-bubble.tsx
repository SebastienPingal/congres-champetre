"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bug, CheckCircle2, ImagePlus, Loader2, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useSendBugReport } from "@/hooks/use-bug-report"
import { BUG_REPORT_LIMITS } from "@/lib/bug-report"
import { cn } from "@/lib/utils"
import { collectClientContext } from "./collect-context"
import { installErrorCapture, recordNavigation } from "./session-buffers"
import { prepareScreenshot } from "./prepare-screenshot"

/**
 * Bulle flottante « Signaler un bug », montée dans le layout racine : visible
 * partout, connecté ou non. Reste cliquable au-dessus d'une autre modale
 * (ex. l'onboarding) grâce à `pointer-events-auto` + `z-[60]`.
 */
export function BugReportBubble() {
  const pathname = usePathname()
  const { status } = useSession()
  const isAnonymous = status === "unauthenticated"
  const { mutate: sendReport, isPending, error, reset: resetMutation } = useSendBugReport()

  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [description, setDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const openedAtRef = useRef(0)
  const honeypotRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    installErrorCapture()
  }, [])

  useEffect(() => {
    recordNavigation(`${pathname}${window.location.search}`)
  }, [pathname])

  useEffect(() => {
    if (!screenshot) {
      setPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(screenshot)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [screenshot])

  const resetForm = () => {
    setSent(false)
    setDescription("")
    setContactEmail("")
    setScreenshot(null)
    setScreenshotError(null)
    resetMutation()
  }

  const handleOpenChange = (next: boolean) => {
    if (next) {
      openedAtRef.current = Date.now()
    } else if (sent) {
      // Après un envoi réussi on repart d'un formulaire vierge ; sinon on garde le brouillon.
      resetForm()
    }
    setOpen(next)
  }

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    setScreenshotError(null)
    setIsPreparing(true)
    try {
      setScreenshot(await prepareScreenshot(file))
    } catch (e) {
      setScreenshotError(e instanceof Error ? e.message : "Image illisible.")
    } finally {
      setIsPreparing(false)
    }
  }

  const handlePaste = (event: React.ClipboardEvent) => {
    const item = Array.from(event.clipboardData.items).find((i) => i.type.startsWith("image/"))
    if (!item) return
    event.preventDefault()
    void handleFile(item.getAsFile())
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    void handleFile(event.dataTransfer.files[0])
  }

  const trimmed = description.trim()
  const canSubmit = trimmed.length >= BUG_REPORT_LIMITS.descriptionMin && !isPending && !isPreparing

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return
    sendReport(
      {
        description: trimmed,
        contactEmail: isAnonymous && contactEmail.trim() ? contactEmail.trim() : null,
        screenshot,
        context: collectClientContext(),
        openedAt: openedAtRef.current,
        honeypot: honeypotRef.current?.value ?? "",
      },
      { onSuccess: () => setSent(true) }
    )
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="icon"
            aria-label="Signaler un bug"
            onClick={() => handleOpenChange(true)}
            className="pointer-events-auto fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[60] size-12 rounded-full shadow-lg print:hidden"
          >
            <Bug className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">Signaler un bug</TooltipContent>
      </Tooltip>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md" onPaste={handlePaste}>
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle2 className="size-10 text-green" />
              <DialogTitle>Merci !</DialogTitle>
              <DialogDescription>
                Votre signalement est bien parti. On regarde ça au plus vite.
              </DialogDescription>
              <Button className="mt-2" onClick={() => handleOpenChange(false)}>
                Fermer
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <DialogHeader>
                <DialogTitle>Signaler un bug</DialogTitle>
                <DialogDescription>
                  Dites-nous ce qui ne marche pas. Quelques infos techniques sont jointes
                  automatiquement pour nous aider à comprendre.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="bug-description">Que s&apos;est-il passé ?</Label>
                <Textarea
                  id="bug-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={BUG_REPORT_LIMITS.descriptionMax}
                  placeholder="Ex. : à l'étape Conférence, aucun bouton ne réagit quand je clique."
                  className="min-h-28"
                  autoFocus
                />
              </div>

              {isAnonymous && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bug-contact">
                    Votre email <span className="font-normal text-muted-foreground">(facultatif, pour vous répondre)</span>
                  </Label>
                  <Input
                    id="bug-contact"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    maxLength={BUG_REPORT_LIMITS.emailMax}
                    placeholder="vous@exemple.fr"
                  />
                </div>
              )}

              {/* Champ piège anti-robot : invisible pour un humain, doit rester vide. */}
              <input
                ref={honeypotRef}
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
              />

              <div className="flex flex-col gap-2">
                <Label>
                  Imprécran <span className="font-normal text-muted-foreground">(facultatif)</span>
                </Label>
                {previewUrl ? (
                  <div className="relative overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element -- aperçu local (blob:) */}
                    <img src={previewUrl} alt="Aperçu de l'imprécran" className="max-h-48 w-full object-contain bg-muted" />
                    <Button
                      type="button"
                      size="icon"
                      variant="secondary"
                      aria-label="Retirer l'imprécran"
                      onClick={() => setScreenshot(null)}
                      className="absolute top-2 right-2 size-7 rounded-full"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    disabled={isPreparing}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-md border border-dashed px-4 py-5 text-sm text-muted-foreground transition-colors hover:bg-muted/50",
                      isDragging && "border-primary bg-muted/50"
                    )}
                  >
                    {isPreparing ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <ImagePlus className="size-5" />
                    )}
                    <span className="font-medium text-foreground">Ajouter une image</span>
                    <span className="text-xs">ou collez-la ici avec Ctrl+V</span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    void handleFile(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
                {screenshotError && <p className="text-sm text-destructive">{screenshotError}</p>}
              </div>

              <p className="text-xs text-muted-foreground">
                Infos jointes : page en cours, navigateur, taille d&apos;écran, erreurs récentes
                {isAnonymous ? "" : ", votre compte et votre inscription"}.
              </p>

              {error && <p className="text-sm text-destructive">{error.message}</p>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  Envoyer
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
