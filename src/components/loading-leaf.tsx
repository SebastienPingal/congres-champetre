interface LoadingLeafProps {
  label?: string
  className?: string
}

export function LoadingLeaf({ label = "Chargement…", className = "" }: LoadingLeafProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <svg
        width="56"
        height="64"
        viewBox="0 0 56 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-leaf-sway"
        aria-hidden="true"
      >
        <path
          d="M28 62 V28"
          stroke="var(--green)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M28 36 C 14 32, 8 22, 10 12 C 22 14, 30 22, 28 36 Z"
          fill="var(--green)"
          fillOpacity="0.85"
        />
        <path
          d="M28 26 C 42 22, 48 12, 46 2 C 34 4, 26 12, 28 26 Z"
          fill="var(--green)"
          fillOpacity="0.6"
        />
        <path
          d="M10 12 C 18 18, 24 24, 28 36"
          stroke="var(--paper)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M46 2 C 38 8, 32 14, 28 26"
          stroke="var(--paper)"
          strokeOpacity="0.4"
          strokeWidth="1"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {label ? (
        <p className="text-sm text-muted-foreground" style={{ fontStyle: "italic" }}>
          {label}
        </p>
      ) : null}
    </div>
  )
}
