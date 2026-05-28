interface SkyLoaderProps {
  label?: string
  className?: string
}

export function SkyLoader({ label = "Chargement…", className = "" }: SkyLoaderProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <div className="sky-loader" aria-hidden="true" />
      {label ? (
        <p className="text-sm text-muted-foreground" style={{ fontStyle: "italic" }}>
          {label}
        </p>
      ) : null}
    </div>
  )
}
