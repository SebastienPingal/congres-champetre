// Flocons décoratifs pour les blocs `.ss-festive` (Secret Santa). Le parent
// doit être positionné (`.ss-festive` l'est).
const FLAKES = [
  { top: "14px", right: "18px", fontSize: 14, animationDelay: "0s" },
  { top: "44px", right: "62px", fontSize: 10, animationDelay: "0.8s" },
  { bottom: "18px", right: "26px", fontSize: 16, animationDelay: "1.6s" },
  { top: "22px", left: "16px", fontSize: 11, animationDelay: "2.2s" },
  { bottom: "26px", left: "40px", fontSize: 9, animationDelay: "1.1s" },
]

export function Snowflakes() {
  return (
    <>
      {FLAKES.map((style, i) => (
        <span key={i} aria-hidden className="ss-snow" style={style}>
          ❄
        </span>
      ))}
    </>
  )
}
