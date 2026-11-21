# features/bug-report

Bulle flottante « Signaler un bug » en bas à droite. Montée dans **`src/app/layout.tsx`** (layout racine) : visible partout, y compris landing et `/auth/*`, connecté ou non.

| Fichier | Rôle |
|---|---|
| `bug-report-bubble.tsx` | Bouton rond (`z-[60]` + `pointer-events-auto` → reste cliquable au-dessus d'une modale Radix, ex. l'onboarding) + Dialog : description, email facultatif (anonymes seulement), imprécran (fichier, glisser-déposer ou Ctrl+V), champ piège `website`. Garde le brouillon si on ferme sans envoyer. |
| `session-buffers.ts` | Tampons circulaires (20 entrées) : erreurs JS (`error`, `unhandledrejection`, `console.error` enveloppé) et pages visitées. `installErrorCapture()` est idempotent, appelé au montage de la bulle. |
| `collect-context.ts` | `collectClientContext()` : URL, referrer, navigateur, langue, fuseau, fenêtre / écran, réseau, thème + mode, et les tampons. |
| `prepare-screenshot.ts` | Image légère en png/jpeg/gif/webp → envoyée telle quelle ; sinon redimensionnée (2560 px max) et ré-encodée en JPEG pour passer sous la limite de corps de Vercel (~4,5 Mo). |

**Envoi :** `useSendBugReport()` (`src/hooks/use-bug-report.ts`) → `POST /api/bug-report` (multipart). La route relit côté serveur le compte et l'état d'inscription (participation, repas, conférences, paiement) — on ne fait pas confiance au client pour ça — puis envoie **un mail** via `sendEmail()` à `BUG_REPORT_EMAIL`, avec l'imprécran inline (`cid:`) et en pièce jointe, et `replyTo` = email du compte ou email saisi. Rien n'est stocké en base.

**Anti-spam (anonymes) :** champ piège rempli ou envoi < 2 s après l'ouverture → réponse 200 sans mail. Limite 5 signalements / 10 min par compte ou IP, **en mémoire** (best-effort : une instance serverless = un compteur).

**Types / limites partagés :** `src/lib/bug-report.ts`. Construction et échappement du mail : `src/lib/bug-report-email.ts`.
