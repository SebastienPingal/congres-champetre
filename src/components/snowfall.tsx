import type { CSSProperties } from "react"

// Neige qui tombe en fond de la landing : calque fixe, non cliquable, en CSS
// pur (aucun JS côté client). Les flocons sont tirés une fois pour toutes
// avec un PRNG à graine fixe → même rendu à chaque requête.
const FLAKE_COUNT = 60

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(1709)
const FLAKES = Array.from({ length: FLAKE_COUNT }, () => {
  const duration = 10 + rand() * 14
  return {
    "--x": `${(rand() * 100).toFixed(2)}vw`,
    "--size": `${(2 + rand() * 4).toFixed(1)}px`,
    "--drift": `${(rand() * 80 - 40).toFixed(0)}px`,
    "--opacity": (0.45 + rand() * 0.5).toFixed(2),
    // Délai négatif : les flocons sont déjà répartis dans l'écran au chargement.
    animationDuration: `${duration.toFixed(1)}s`,
    animationDelay: `-${(rand() * duration).toFixed(1)}s`,
  } as CSSProperties
})

export function Snowfall() {
  return (
    <div aria-hidden className="snowfall">
      {FLAKES.map((style, i) => (
        <span key={i} className="snowfall-flake" style={style} />
      ))}
    </div>
  )
}
