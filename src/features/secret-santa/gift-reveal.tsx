"use client"

import { useEffect, useMemo, useState, type CSSProperties } from "react"
import { cn } from "@/lib/utils"

export type GiftPhase = "closed" | "shaking" | "open"

const CONFETTI_COLORS = ["#d34a3b", "#f2b632", "#16a34a", "#3b82f6", "#ec4899", "#fff6d6"]
const CONFETTI_COUNT = 48

type Confetto = { style: CSSProperties; round: boolean }

function makeConfetti(): Confetto[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => {
    // Gerbe vers le haut, légèrement en éventail.
    const angle = (-90 + (Math.random() - 0.5) * 150) * (Math.PI / 180)
    const distance = 120 + Math.random() * 170
    return {
      round: i % 3 === 0,
      style: {
        "--ss-x": `${Math.cos(angle) * distance}px`,
        "--ss-y": `${Math.sin(angle) * distance}px`,
        "--ss-fall": `${80 + Math.random() * 120}px`,
        "--ss-r": `${(Math.random() - 0.5) * 900}deg`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        animationDelay: `${Math.random() * 120}ms`,
        animationDuration: `${1100 + Math.random() * 700}ms`,
      } as CSSProperties,
    }
  })
}

interface GiftRevealProps {
  phase: GiftPhase
  receiverName: string | null
  onOpen: () => void
  /** Affiche directement l'état ouvert, sans animation (cadeau déjà ouvert). */
  instant?: boolean
}

export function GiftReveal({ phase, receiverName, onOpen, instant = false }: GiftRevealProps) {
  const isOpen = phase === "open"
  const [confetti, setConfetti] = useState<Confetto[]>([])

  useEffect(() => {
    if (!isOpen || instant) return
    setConfetti(makeConfetti())
    const t = setTimeout(() => setConfetti([]), 2200)
    return () => clearTimeout(t)
  }, [isOpen, instant])

  const sparkles = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        left: `${10 + i * 16}%`,
        top: `${(i * 37) % 70}%`,
        animationDelay: `${i * 0.35}s`,
      })),
    []
  )

  return (
    <div className="relative flex items-center justify-center" style={{ height: 340 }}>
      {/* Halo de lumière derrière le cadeau ouvert */}
      <div
        aria-hidden
        className={cn("ss-rays absolute rounded-full pointer-events-none", isOpen ? "opacity-100" : "opacity-0")}
        style={{ width: 360, height: 360 }}
      />

      {!isOpen &&
        sparkles.map((s, i) => (
          <span key={i} aria-hidden className="ss-sparkle absolute pointer-events-none" style={s}>
            ✦
          </span>
        ))}

      <button
        type="button"
        onClick={onOpen}
        disabled={phase !== "closed"}
        aria-label="Ouvrir le cadeau"
        className={cn(
          "relative cursor-pointer bg-transparent border-0 p-0 outline-none focus-visible:ring-4 focus-visible:ring-ring/40 rounded-xl",
          phase === "closed" && "ss-gift-idle",
          phase === "shaking" && "ss-gift-shake",
          isOpen && "pointer-events-none",
        )}
        style={{ width: 200, height: 200 }}
      >
        {/* Couvercle + nœud */}
        <div className={cn("absolute left-1/2 z-20", isOpen && (instant ? "ss-lid-gone" : "ss-lid-pop"))} style={{ top: 38, width: 212, marginLeft: -106 }}>
          <div className="absolute left-1/2 flex" style={{ bottom: 30, marginLeft: -44 }}>
            <span className="ss-bow ss-bow-left" />
            <span className="ss-bow ss-bow-right" />
            <span className="ss-bow-knot" />
          </div>
          <div className="relative rounded-md shadow-md" style={{ height: 34, background: "linear-gradient(#e2574a, #c13d2f)" }}>
            <div className="absolute inset-y-0 left-1/2" style={{ width: 26, marginLeft: -13, background: "linear-gradient(90deg, #e7a91c, #f6cc55, #e7a91c)" }} />
          </div>
        </div>

        {/* Boîte */}
        <div
          className={cn("absolute left-1/2 bottom-0 z-10 rounded-b-lg shadow-lg overflow-hidden", isOpen && (instant ? "ss-box-gone" : "ss-box-drop"))}
          style={{ width: 188, height: 132, marginLeft: -94, background: "linear-gradient(#d34a3b, #a8321f)" }}
        >
          <div className="absolute inset-y-0 left-1/2" style={{ width: 26, marginLeft: -13, background: "linear-gradient(90deg, #e7a91c, #f6cc55, #e7a91c)" }} />
          <div className="absolute inset-x-0 top-0" style={{ height: 10, background: "rgba(0,0,0,0.18)" }} />
        </div>
      </button>

      {/* Confettis */}
      <div aria-hidden className="absolute left-1/2 top-1/2 pointer-events-none z-30">
        {confetti.map((c, i) => (
          <span
            key={i}
            className={cn("ss-confetti absolute", c.round ? "rounded-full" : "rounded-[1px]")}
            style={{ width: c.round ? 8 : 7, height: c.round ? 8 : 12, ...c.style }}
          />
        ))}
      </div>

      {/* Carte révélée */}
      {isOpen && (
        <div
          role="status"
          className={cn(
            "ss-reveal-card absolute z-20 flex flex-col items-center gap-2 rounded-2xl px-8 py-7 text-center",
            instant ? "" : "ss-card-rise",
          )}
          style={{ maxWidth: "min(90vw, 360px)" }}
        >
          <span className="font-mono uppercase text-[10px]" style={{ letterSpacing: "0.22em", color: "var(--ink-3)" }}>
            Tu offres un cadeau à
          </span>
          <span
            className="ss-reveal-name font-display break-words"
            style={{ fontSize: "clamp(2rem, 7vw, 2.8rem)", fontWeight: 700, lineHeight: 1.05 }}
          >
            {receiverName}
          </span>
          <span className="text-sm" style={{ color: "var(--ink-2)" }}>
            Chut… garde le secret 🤫
          </span>
        </div>
      )}
    </div>
  )
}
