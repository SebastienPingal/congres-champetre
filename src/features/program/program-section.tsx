"use client"

import { useMemo } from "react"
import { AlertTriangle, Clock, Lock, MapPin, Users } from "lucide-react"
import { useTimeSlots } from "@/hooks/use-time-slots"
import type { MealSlot, TimeSlot, UserProfile } from "@/types"

type NavTarget = "presence" | "meals" | "payment" | "conferences"

interface ProgramSectionProps {
  user: UserProfile
  meals: MealSlot[]
  onNavigate?: (target: NavTarget) => void
}

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

function formatHM(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit", hour12: false,
  })
}

function dayKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function groupByDay(slots: TimeSlot[]) {
  const map = new Map<string, TimeSlot[]>()
  for (const s of slots) {
    const k = dayKey(s.startTime)
    if (!map.has(k)) map.set(k, [])
    map.get(k)!.push(s)
  }
  return [...map.entries()]
    .map(([k, arr]) => ({
      key: k,
      sessions: arr.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()),
    }))
    .sort((a, b) =>
      new Date(a.sessions[0].startTime).getTime() - new Date(b.sessions[0].startTime).getTime(),
    )
}

// ── Atoms ────────────────────────────────────────────────────────────

function Fleuron({ size = 10, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color ?? "currentColor"} aria-hidden="true">
      <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" />
    </svg>
  )
}

function Ornament({
  children, lineWidth = 80, color,
}: { children: React.ReactNode; lineWidth?: number; color?: string }) {
  return (
    <div className="flex items-center justify-center gap-3.5" style={{ color: color ?? "var(--line-2)" }}>
      <span style={{ height: 1, width: lineWidth, background: "currentColor" }} />
      {children}
      <span style={{ height: 1, width: lineWidth, background: "currentColor" }} />
    </div>
  )
}

function IlluminatedNumeral({ n }: { n: string }) {
  const accent = "var(--ink)"
  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: 54, height: 54, border: `1.5px solid ${accent}` }}
    >
      {([
        ["top", "left"], ["top", "right"],
        ["bottom", "left"], ["bottom", "right"],
      ] as const).map(([v, h], i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            [v]: -1, [h]: -1,
            width: 8, height: 8,
            [`border${v[0].toUpperCase() + v.slice(1)}`]: `1.5px solid ${accent}`,
            [`border${h[0].toUpperCase() + h.slice(1)}`]: `1.5px solid ${accent}`,
          } as React.CSSProperties}
        />
      ))}
      <span
        style={{
          fontFamily: "var(--font-display), 'Newsreader', serif",
          fontSize: 40, fontWeight: 400, fontStyle: "italic", lineHeight: 1,
          color: accent, transform: "translateY(2px)",
        }}
      >
        {n}
      </span>
    </div>
  )
}

// ── Title block + meta ───────────────────────────────────────────────

function TitleBlock({
  editionName, dateOrnament, subtitle,
}: { editionName: string; dateOrnament: string; subtitle: string }) {
  return (
    <div className="text-center mb-5">
      <div
        className="uppercase mb-2"
        style={{
          fontFamily: "var(--font-mono), monospace",
          fontSize: 11, letterSpacing: "0.34em", color: "var(--ink-3)",
        }}
      >
        {editionName}
      </div>
      <h1
        style={{
          fontFamily: "var(--font-display), 'Newsreader', serif",
          fontSize: "clamp(32px, 4.5vw, 52px)",
          fontWeight: 400,
          letterSpacing: "-0.03em",
          lineHeight: 1,
          margin: 0,
        }}
      >
        Programme
      </h1>
      <div
        className="mt-2"
        style={{
          fontFamily: "var(--font-serif), serif",
          fontStyle: "italic", fontSize: 16,
          color: "var(--ink-2)", fontWeight: 400,
        }}
      >
        {subtitle}
      </div>
      <div className="mt-3">
        <Ornament lineWidth={70}>
          <Fleuron size={9} />
          <span
            className="uppercase"
            style={{
              fontFamily: "var(--font-mono), monospace",
              fontSize: 11, letterSpacing: "0.16em",
              color: "var(--ink-3)",
            }}
          >
            {dateOrnament}
          </span>
          <Fleuron size={9} />
        </Ornament>
      </div>
    </div>
  )
}

function MetaLine({ location, participants }: { location: string; participants: string }) {
  return (
    <div
      className="flex justify-center flex-wrap gap-x-7 gap-y-2 mb-4"
      style={{ fontSize: 13.5, color: "var(--ink-2)" }}
    >
      <span className="inline-flex items-center gap-2">
        <MapPin size={14} style={{ color: "var(--ink-3)" }} aria-hidden="true" />
        {location}
      </span>
      <span style={{ color: "var(--line-2)" }}>·</span>
      <span className="inline-flex items-center gap-2">
        <Users size={14} style={{ color: "var(--ink-3)" }} aria-hidden="true" />
        {participants}
      </span>
    </div>
  )
}

// ── Parchment alert ──────────────────────────────────────────────────

function AlertParchemin({
  user, meals, onNavigate,
}: {
  user: UserProfile
  meals: MealSlot[]
  onNavigate?: (target: NavTarget) => void
}) {
  const locked = user.edition.isRegistrationClosed
  const totalToPay = meals
    .filter((m) => m.status === "PRESENT" && m.price != null)
    .reduce((s, m) => s + (m.price ?? 0), 0)

  const needsPresence = !locked && !user.isAttending
  const needsMeals =
    !locked && user.isAttending && meals.length > 0 && meals.some((m) => m.status === null)
  const needsPayment = user.isAttending && totalToPay > 0 && !user.hasPaid
  const needsConference =
    !locked && user.isAttending && user.wantsToSpeak && user.conferences.length === 0

  if (locked) {
    if (user.isAttending && totalToPay > 0 && !user.hasPaid) {
      return (
        <div
          className="mx-auto mb-11 flex items-center gap-4 rounded-2xl px-5 py-4"
          style={{
            maxWidth: 780,
            background: "#fde2dd",
            border: "1px solid #d34a3b",
            color: "#7a1f15",
          }}
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 38, height: 38, background: "#f3b9b1", color: "#7a1f15" }}
          >
            <Lock size={18} aria-hidden="true" />
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.45 }}>
            <span
              style={{
                fontFamily: "var(--font-serif), serif",
                fontStyle: "italic", fontSize: 17, fontWeight: 500,
              }}
            >
              Les inscriptions sont closes —
            </span>{" "}
            votre écot n&apos;a pas été réglé.
          </div>
        </div>
      )
    }
    return null
  }

  if (!needsPresence && !needsMeals && !needsPayment && !needsConference) return null

  type Action = { key: string; target: NavTarget; label: React.ReactNode }
  const actions: Action[] = []
  if (needsPresence) {
    actions.push({ key: "presence", target: "presence", label: "confirmez votre présence" })
  }
  if (needsMeals) {
    actions.push({ key: "meals", target: "meals", label: "indiquez vos repas" })
  }
  if (needsPayment) {
    actions.push({
      key: "payment", target: "payment",
      label: <>réglez votre écot ({totalToPay}&nbsp;€)</>,
    })
  }
  if (needsConference) {
    actions.push({ key: "conference", target: "conferences", label: "proposez votre conférence" })
  }

  return (
    <div
      className="mx-auto mb-11 flex items-center gap-4 rounded-2xl px-5 py-4"
      style={{
        maxWidth: 780,
        background: "var(--warn-bg)",
        border: "1px solid var(--warn-border)",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0"
        style={{ width: 38, height: 38, background: "var(--warn-icon-bg)", color: "var(--warn)" }}
      >
        <AlertTriangle size={20} aria-hidden="true" />
      </div>
      <div style={{ fontSize: 14.5, color: "var(--warn)", lineHeight: 1.5 }}>
        <span
          style={{
            fontFamily: "var(--font-serif), serif",
            fontStyle: "italic", fontSize: 17, fontWeight: 500,
          }}
        >
          Pour valider votre inscription,
        </span>{" "}
        {actions.map((a, i) => (
          <span key={a.key}>
            {i > 0 && (i === actions.length - 1 ? " et " : ", ")}
            <button
              type="button"
              onClick={() => onNavigate?.(a.target)}
              style={{
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
                color: "var(--warn)",
                background: "transparent",
                border: 0,
                padding: 0,
                cursor: "pointer",
                font: "inherit",
              }}
            >
              {a.label}
            </button>
          </span>
        ))}
        .
      </div>
    </div>
  )
}

// ── Scene entry ──────────────────────────────────────────────────────

function SceneEntry({
  session, isLast,
}: { session: TimeSlot; isLast: boolean }) {
  const isMeal = session.kind === "MEAL"
  const isTalk = session.kind === "CONFERENCE"
  const isPendingTalk = isTalk && !session.conference
  const accent =
    isMeal ? "var(--meal)" : isTalk ? "var(--talk)" : "var(--ink-3)"
  const title = isTalk && session.conference ? session.conference.title : session.title
  const speaker = isTalk && session.conference ? session.conference.speaker.name : null

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "84px 1fr",
        gap: 20,
        paddingBottom: isLast ? 0 : 12,
        marginBottom: isLast ? 0 : 12,
        borderBottom: isLast ? "none" : "1px dashed var(--line-2)",
      }}
    >
      <div className="text-right">
        <div
          style={{
            fontFamily: "var(--font-display), 'Newsreader', serif",
            fontSize: 26, fontWeight: 500, lineHeight: 1,
            color: "var(--ink)",
            fontFeatureSettings: "'lnum'",
          }}
        >
          {formatHM(session.startTime)}
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10, color: "var(--ink-3)",
            marginTop: 6, letterSpacing: "0.06em",
          }}
        >
          → {formatHM(session.endTime)}
        </div>
      </div>
      <div
        className="relative"
        style={{
          paddingTop: 2,
          borderLeft: "1px solid var(--line)",
          paddingLeft: 24,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            position: "absolute", left: -5, top: 6,
            width: 9, height: 9, borderRadius: "50%",
            background: isPendingTalk ? "var(--paper)" : accent,
            border: isPendingTalk
              ? `1.5px dashed var(--talk)`
              : "2px solid var(--paper)",
          }}
        />
        {isPendingTalk ? (
          <>
            <div
              className="inline-flex items-center gap-1.5 uppercase"
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: 10, letterSpacing: "0.16em",
                color: "var(--talk)",
                border: "1px dashed var(--talk)",
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              <Clock size={11} aria-hidden="true" />
              À venir
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 16, fontStyle: "italic",
                fontWeight: 400, color: "var(--ink-3)",
                lineHeight: 1.3, marginTop: 8,
              }}
            >
              Conférence à annoncer
            </div>
          </>
        ) : isTalk ? (
          <>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontSize: 17, fontWeight: 600,
                color: "var(--ink)", lineHeight: 1.22,
                letterSpacing: "-0.015em",
              }}
            >
              «&nbsp;{title}&nbsp;»
            </div>
            {speaker && (
              <div
                style={{
                  fontFamily: "var(--font-serif), serif",
                  fontSize: 14, fontStyle: "italic",
                  color: "var(--ink-2)", marginTop: 10,
                }}
              >
                par{" "}
                <span style={{ fontStyle: "normal", fontWeight: 600, color: "var(--ink)" }}>
                  {speaker}
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              fontFamily: "var(--font-serif), serif",
              fontSize: 17, fontStyle: "italic",
              fontWeight: 500, color: "var(--ink)",
              lineHeight: 1.2, letterSpacing: "-0.01em",
            }}
          >
            {title}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Act (chapter) ────────────────────────────────────────────────────

function Act({
  dayNumber, day, year,
}: { dayNumber: number; day: { sessions: TimeSlot[] }; year: number }) {
  const first = day.sessions[0]
  const date = new Date(first.startTime)
  const weekday = date.toLocaleDateString("fr-FR", { weekday: "long" })
  const weekdayCap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const dayNum = String(date.getDate()).padStart(2, "0")
  const month = MONTHS_FR[date.getMonth()]

  return (
    <section className="flex-1 min-w-0 px-2">
      <div className="text-center mb-4">
        <div
          className="flex items-center justify-center uppercase"
          style={{
            gap: 16,
            fontFamily: "var(--font-serif), serif",
            fontStyle: "italic", fontSize: 14,
            color: "var(--ink-3)", letterSpacing: "0.18em",
          }}
        >
          <span style={{ flex: 1, maxWidth: 80, height: 1, background: "var(--line-2)" }} />
          Jour&nbsp;{dayNumber}
          <span style={{ flex: 1, maxWidth: 80, height: 1, background: "var(--line-2)" }} />
        </div>

        <div className="flex items-center justify-center mt-3" style={{ gap: 18 }}>
          <IlluminatedNumeral n={["", "I", "II", "III", "IV", "V"][dayNumber] ?? String(dayNumber)} />
          <div className="text-left">
            <div
              style={{
                fontFamily: "var(--font-display), 'Newsreader', serif",
                fontSize: 36, fontWeight: 600,
                lineHeight: 1, letterSpacing: "-0.025em",
              }}
            >
              {weekdayCap}
            </div>
            <div
              style={{
                fontFamily: "var(--font-serif), serif",
                fontStyle: "italic", fontSize: 15,
                color: "var(--ink-2)", fontWeight: 400, marginTop: 3,
              }}
            >
              {dayNum} {month} {year}
            </div>
          </div>
        </div>

        <div
          className="flex items-center justify-center mt-3"
          style={{ gap: 10, color: "var(--line-2)" }}
        >
          <Fleuron />
          <Fleuron color="var(--talk)" />
          <Fleuron />
        </div>
      </div>

      <div>
        {day.sessions.map((s, i) => (
          <SceneEntry
            key={s.id}
            session={s}
            isLast={i === day.sessions.length - 1}
          />
        ))}
      </div>
    </section>
  )
}

// ── Speakers section ─────────────────────────────────────────────────

function SpeakersList({ slots }: { slots: TimeSlot[] }) {
  const speakers = slots
    .filter((s) => s.kind === "CONFERENCE" && s.conference)
    .map((s) => ({
      id: s.id,
      name: s.conference!.speaker.name,
      title: s.conference!.title,
    }))

  if (speakers.length === 0) return null

  return (
    <section
      className="mt-6 pt-4"
      style={{ borderTop: "1px solid var(--line)" }}
    >
      <div className="text-center mb-3">
        <h2
          style={{
            fontFamily: "var(--font-display), 'Newsreader', serif",
            fontSize: 22, fontWeight: 600,
            margin: 0, letterSpacing: "-0.02em",
          }}
        >
          Intervenants
        </h2>
      </div>
      <div
        className="grid mx-auto"
        style={{
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "6px 56px",
          maxWidth: 880,
        }}
      >
        {speakers.map((s) => (
          <div
            key={s.id}
            className="flex items-baseline gap-3.5 pb-2.5"
            style={{ borderBottom: "1px dotted var(--line-2)" }}
          >
            <span
              style={{
                fontFamily: "var(--font-display), 'Newsreader', serif",
                fontSize: 15, fontWeight: 600,
                color: "var(--ink)", letterSpacing: "-0.01em",
              }}
            >
              {s.name}
            </span>
            <span className="flex-1" />
            <span
              className="text-right"
              style={{
                fontFamily: "var(--font-serif), serif",
                fontStyle: "italic", fontSize: 13.5,
                color: "var(--ink-2)", maxWidth: "60%",
              }}
            >
              {s.title}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── Main ─────────────────────────────────────────────────────────────

export function ProgramSection({ user, meals, onNavigate }: ProgramSectionProps) {
  const { data: timeSlots = [], isLoading, error } = useTimeSlots()

  const days = useMemo(() => groupByDay(timeSlots).slice(0, 2), [timeSlots])
  const year = useMemo(() => {
    if (days[0]) return new Date(days[0].sessions[0].startTime).getFullYear()
    if (user.edition.startDate) return new Date(user.edition.startDate).getFullYear()
    return new Date().getFullYear()
  }, [days, user.edition.startDate])

  const dateOrnament = useMemo(() => {
    if (days.length === 0) return ""
    const first = new Date(days[0].sessions[0].startTime)
    const last = days[days.length - 1]
      ? new Date(days[days.length - 1].sessions[0].startTime)
      : first
    const month = MONTHS_FR[first.getMonth()].toUpperCase()
    const d1 = first.getDate()
    const d2 = last.getDate()
    const yr = first.getFullYear()
    return days.length > 1 ? `${d1} — ${d2} ${month} ${yr}` : `${d1} ${month} ${yr}`
  }, [days])

  const subtitle = "à Moret-Loing-et-Orvanne"

  const location = "4 allée des tertres, 77250 Moret-Loing-et-Orvanne"
  const count = user.edition.participantCount
  const participants = `${count} ${count > 1 ? "participants inscrits" : "participant inscrit"}`

  return (
    <div className="text-foreground px-2 sm:px-4 lg:px-6 py-6 lg:py-8 relative">

      <div className="relative mx-auto" style={{ maxWidth: 1180 }}>
        <AlertParchemin user={user} meals={meals} onNavigate={onNavigate} />
        <TitleBlock editionName={user.edition.name} dateOrnament={dateOrnament} subtitle={subtitle} />
        <MetaLine location={location} participants={participants} />

        {isLoading ? (
          <p className="text-center" style={{ color: "var(--ink-3)" }}>
            Chargement du programme…
          </p>
        ) : error ? (
          <p className="text-center" style={{ color: "#d34a3b" }}>
            Impossible de charger le programme.
          </p>
        ) : days.length === 0 ? (
          <p className="text-center" style={{ color: "var(--ink-3)" }}>
            Aucun créneau publié pour le moment.
          </p>
        ) : days.length === 1 ? (
          <div className="mx-auto" style={{ maxWidth: 760 }}>
            <Act dayNumber={1} day={days[0]} year={year} />
          </div>
        ) : (
          <>
            {/* ≥ 1180 : grille deux colonnes ; < 1180 : pile verticale */}
            <div className="hidden xl:grid items-start"
                 style={{
                   gridTemplateColumns: "1fr 1px 1fr",
                   gap: 48,
                 }}>
              <Act dayNumber={1} day={days[0]} year={year} />
              <div
                className="self-stretch"
                style={{
                  background: "var(--line-2)",
                  backgroundImage:
                    "linear-gradient(to bottom, transparent 0, var(--line-2) 30px, var(--line-2) calc(100% - 30px), transparent 100%)",
                }}
              />
              <Act dayNumber={2} day={days[1]} year={year} />
            </div>
            <div className="flex xl:hidden flex-col mx-auto" style={{ maxWidth: 760, gap: 64 }}>
              <Act dayNumber={1} day={days[0]} year={year} />
              <Ornament lineWidth={120}>
                <Fleuron size={11} />
                <Fleuron size={11} color="var(--talk)" />
                <Fleuron size={11} />
              </Ornament>
              <Act dayNumber={2} day={days[1]} year={year} />
            </div>
          </>
        )}

        {days.length > 0 && <SpeakersList slots={timeSlots} />}

        <div className="mt-6" style={{ color: "var(--line-2)" }}>
          <Ornament lineWidth={100}>
            <Fleuron />
            <Fleuron color="var(--talk)" />
            <Fleuron color="var(--meal)" />
            <Fleuron color="var(--talk)" />
            <Fleuron />
          </Ornament>
        </div>
        <div
          className="text-center mt-3"
          style={{
            fontFamily: "var(--font-serif), serif",
            fontStyle: "italic", fontSize: 15,
            color: "var(--ink-3)",
          }}
        >
          Fin du programme.
        </div>
        <div
          className="flex justify-between mt-5 uppercase"
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10.5, color: "var(--ink-3)",
            letterSpacing: "0.14em",
          }}
        >
          <span>Congrès Champêtre · {year}</span>
          <span>Contes &amp; Légendes</span>
        </div>
      </div>
    </div>
  )
}
