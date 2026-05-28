"use client"

import { useSession } from "next-auth/react"
import { EggLoader } from "./egg-loader"
import { SkyLoader } from "./sky-loader"

const EGG_EMAIL = "monsieur.borot@gmail.com"

interface AppLoaderProps {
  label?: string
  className?: string
}

export function AppLoader({ label, className }: AppLoaderProps) {
  const { data: session } = useSession()
  const isEggUser = session?.user?.email === EGG_EMAIL

  return isEggUser ? (
    <EggLoader label={label} className={className} />
  ) : (
    <SkyLoader label={label} className={className} />
  )
}
