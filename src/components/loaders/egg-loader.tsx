interface EggLoaderProps {
  label?: string
  className?: string
}

export function EggLoader({ label = "Chargement…", className = "" }: EggLoaderProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="egg-loader" aria-hidden="true" />
      {label ? (
        <p className="text-sm text-muted-foreground" style={{ fontStyle: "italic" }}>
          {label}
        </p>
      ) : null}
    </div>
  )
}
