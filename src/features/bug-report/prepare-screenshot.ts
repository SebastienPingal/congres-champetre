import { BUG_REPORT_LIMITS } from "@/lib/bug-report"

const SENDABLE_TYPES = new Set(["image/png", "image/jpeg", "image/gif", "image/webp"])

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
}

/**
 * Prépare l'imprécran pour l'envoi : une image légère dans un format accepté
 * est envoyée telle quelle (PNG net pour le texte) ; sinon on la redimensionne
 * et on la ré-encode en JPEG pour passer sous la limite de Vercel (~4,5 Mo).
 */
export async function prepareScreenshot(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Ce fichier n'est pas une image.")
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    // Format que le navigateur ne sait pas décoder (ex. HEIC sur Chrome).
    if (SENDABLE_TYPES.has(file.type) && file.size <= BUG_REPORT_LIMITS.screenshotMaxBytes) return file
    throw new Error("Impossible de lire cette image. Essayez une capture en PNG ou JPEG.")
  }

  const longest = Math.max(bitmap.width, bitmap.height)
  if (
    SENDABLE_TYPES.has(file.type) &&
    file.size <= BUG_REPORT_LIMITS.screenshotTargetBytes &&
    longest <= BUG_REPORT_LIMITS.screenshotMaxDimension
  ) {
    bitmap.close()
    return file
  }

  let scale = Math.min(1, BUG_REPORT_LIMITS.screenshotMaxDimension / longest)
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    bitmap.close()
    throw new Error("Impossible de compresser cette image.")
  }

  try {
    for (const quality of [0.85, 0.75, 0.65]) {
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      // Fond blanc : les zones transparentes d'un PNG deviendraient noires en JPEG.
      ctx.fillStyle = "#fff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      const blob = await canvasToBlob(canvas, quality)
      if (blob && blob.size <= BUG_REPORT_LIMITS.screenshotTargetBytes * 2) {
        const name = (file.name || "imprecran").replace(/\.[^.]+$/, "") + ".jpg"
        return new File([blob], name, { type: "image/jpeg" })
      }
      scale *= 0.75
    }
  } finally {
    bitmap.close()
  }
  throw new Error("Image trop lourde, même après compression.")
}
