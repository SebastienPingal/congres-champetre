"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, RotateCcw, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { isParticipationValidated } from "@/lib/participation-status"
import type { AdminUserRow } from "@/hooks/use-admin-users"
import type { AttendanceDays } from "@/types"

export type TriState = "ALL" | "YES" | "NO"
export type DaysFilter = "ALL" | AttendanceDays

export interface UsersFiltersState {
  searchQuery: string
  participation: TriState
  days: DaysFilter
  sleep: TriState
  paid: TriState
  cash: TriState
  loggedIn: TriState
}

export const DEFAULT_FILTERS: UsersFiltersState = {
  searchQuery: "",
  participation: "ALL",
  days: "ALL",
  sleep: "ALL",
  paid: "ALL",
  cash: "ALL",
  loggedIn: "ALL",
}

const TRI_OPTIONS: { value: TriState, label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "YES", label: "Oui" },
  { value: "NO", label: "Non" },
]

const DAYS_OPTIONS: { value: DaysFilter, label: string }[] = [
  { value: "ALL", label: "Tous" },
  { value: "NONE", label: "—" },
  { value: "DAY1", label: "Jour 1" },
  { value: "DAY2", label: "Jour 2" },
  { value: "BOTH", label: "Les deux" },
  { value: "UNKNOWN", label: "Non renseigné" },
]

/** Une entrée = un filtre déroulant. Ajouter un filtre = ajouter une ligne ici. */
type SelectFilterKey = Exclude<keyof UsersFiltersState, "searchQuery">

interface SelectFilterDef {
  key: SelectFilterKey
  label: string
  options: { value: string, label: string }[]
  /** Prédicat appliqué quand la valeur n'est pas "ALL" */
  matches: (user: AdminUserRow, value: string) => boolean
}

const SELECT_FILTERS: SelectFilterDef[] = [
  {
    key: "participation",
    label: "Participe",
    options: TRI_OPTIONS,
    matches: (u, v) => (v === "YES" ? u.isAttending === true : u.isAttending !== true),
  },
  {
    key: "days",
    label: "Jours",
    options: DAYS_OPTIONS,
    matches: (u, v) => u.attendanceDays === v,
  },
  {
    key: "sleep",
    label: "Dort sur place",
    options: TRI_OPTIONS,
    matches: (u, v) => (v === "YES" ? u.sleepsOnSite === true : u.sleepsOnSite !== true),
  },
  {
    key: "paid",
    // Validé = a payé OU ne doit rien (aucun repas payant coché).
    label: "Validé",
    options: TRI_OPTIONS,
    matches: (u, v) => {
      const validated = isParticipationValidated({
        isAttending: u.isAttending,
        hasPaid: u.hasPaid,
        amountDue: u.mealTotal,
      })
      return v === "YES" ? validated : !validated
    },
  },
  {
    key: "cash",
    label: "Paiera en cash",
    options: TRI_OPTIONS,
    matches: (u, v) => (v === "YES" ? u.willPayInCash : !u.willPayInCash),
  },
  {
    key: "loggedIn",
    label: "Connecté",
    options: TRI_OPTIONS,
    matches: (u, v) => (v === "YES" ? u.hasLoggedInSinceEdition : !u.hasLoggedInSinceEdition),
  },
]

/** Raccourcis : applique une combinaison de filtres en un clic. */
const PRESETS: { label: string, patch: Partial<UsersFiltersState> }[] = [
  { label: "Participants non validés", patch: { participation: "YES", paid: "NO", cash: "ALL" } },
  { label: "Paiement en cash", patch: { cash: "YES" } },
  { label: "Jamais connectés", patch: { loggedIn: "NO" } },
]

const STORAGE_KEY = "admin-users-filters-v2"

export function matchesFilters(user: AdminUserRow, filters: UsersFiltersState): boolean {
  const query = filters.searchQuery.trim().toLowerCase()
  if (query.length > 0) {
    const haystack = `${user.name ?? ""} ${user.email}`.toLowerCase()
    if (!haystack.includes(query)) return false
  }

  return SELECT_FILTERS.every(({ key, matches }) => {
    const value = filters[key]
    return value === "ALL" || matches(user, value)
  })
}

export function countActiveFilters(filters: UsersFiltersState): number {
  const selects = SELECT_FILTERS.filter(({ key }) => filters[key] !== "ALL").length
  return selects + (filters.searchQuery.trim().length > 0 ? 1 : 0)
}

/** État des filtres + persistance localStorage. */
export function useUsersFilters() {
  const [filters, setFilters] = useState<UsersFiltersState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return { ...DEFAULT_FILTERS, ...JSON.parse(raw) }
    } catch { /* ignore */ }
    return DEFAULT_FILTERS
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters))
    } catch { /* ignore */ }
  }, [filters])

  const setFilter = <K extends keyof UsersFiltersState>(key: K, value: UsersFiltersState[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const applyPreset = (patch: Partial<UsersFiltersState>) => {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  const resetFilters = () => setFilters(DEFAULT_FILTERS)

  return { filters, setFilter, applyPreset, resetFilters }
}

interface UsersFiltersProps {
  filters: UsersFiltersState
  setFilter: <K extends keyof UsersFiltersState>(key: K, value: UsersFiltersState[K]) => void
  applyPreset: (patch: Partial<UsersFiltersState>) => void
  resetFilters: () => void
  /** Slot d'actions à droite de la barre de recherche (ex. sélecteur de colonnes). */
  actions?: React.ReactNode
  /** Résumé affiché sous les filtres (ex. « 12 / 40 utilisateurs »). */
  resultLabel?: string
}

export function UsersFilters({
  filters,
  setFilter,
  applyPreset,
  resetFilters,
  actions,
  resultLabel,
}: UsersFiltersProps) {
  const activeCount = countActiveFilters(filters)

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      {/* Ligne 1 — recherche + actions */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            aria-label="Rechercher un utilisateur"
            placeholder="Rechercher par nom ou email…"
            className="pl-9"
            value={filters.searchQuery}
            onChange={(e) => setFilter("searchQuery", e.target.value)}
          />
        </div>
        {actions}
      </div>

      {/* Ligne 2 — filtres */}
      <div className="flex flex-wrap items-center gap-2">
        {SELECT_FILTERS.map(({ key, label, options }) => {
          const value = filters[key]
          const isActive = value !== "ALL"
          const current = options.find(o => o.value === value)

          return (
            <DropdownMenu key={key}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(isActive && "border-primary bg-green-soft text-primary")}
                >
                  <span>{label}</span>
                  {isActive && <span className="font-semibold">: {current?.label}</span>}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel>{label}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={value}
                  onValueChange={(next) => setFilter(key, next as UsersFiltersState[typeof key])}
                >
                  {options.map(option => (
                    <DropdownMenuRadioItem key={option.value} value={option.value}>
                      {option.label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        })}

        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          disabled={activeCount === 0}
          className="text-muted-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Réinitialiser
        </Button>
      </div>

      {/* Ligne 3 — raccourcis + résumé */}
      <div className="flex flex-wrap items-center gap-2 border-t pt-3">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Raccourcis</span>
        {PRESETS.map(preset => (
          <Button
            key={preset.label}
            variant="secondary"
            size="sm"
            onClick={() => applyPreset(preset.patch)}
          >
            {preset.label}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {activeCount > 0 && (
            <Badge variant="outline">
              {activeCount} filtre{activeCount > 1 ? "s" : ""} actif{activeCount > 1 ? "s" : ""}
            </Badge>
          )}
          {resultLabel && (
            <span className="text-sm text-muted-foreground">{resultLabel}</span>
          )}
        </div>
      </div>
    </div>
  )
}
