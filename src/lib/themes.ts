// Thème choisi par l'admin pour l'édition active (`Edition.theme` → `data-theme`
// sur <html>). Chaque thème a une variante claire et une sombre ; la variante
// est choisie par le mode du visiteur (`data-mode`, cf. use-theme-mode.ts).
// Les valeurs réelles vivent dans globals.css — ici, uniquement les aperçus
// du sélecteur admin.
export type ThemeId = "champetre" | "vermeil" | "noel"
export type ThemeVariant = "light" | "dark"

export interface ThemeSwatch {
  name: string
  bg: string
  paper: string
  ink: string
  line: string
  green: string
  talk: string
  meal: string
}

export interface ThemePalette {
  id: ThemeId
  label: string
  light: ThemeSwatch
  dark: ThemeSwatch
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  champetre: {
    id: "champetre",
    label: "Champêtre",
    light: { name: "Clair", bg: "#faf6ea", paper: "#fffefb", ink: "#1c1b18", line: "#e0d8c2", green: "#16a34a", talk: "#6a4cb8", meal: "#c98a1a" },
    dark: { name: "Crépuscule", bg: "#191720", paper: "#2b2734", ink: "#f4ecd8", line: "#332e3e", green: "#7fae8a", talk: "#c9a86b", meal: "#c98a1a" },
  },
  vermeil: {
    id: "vermeil",
    label: "Vermeil",
    light: { name: "Clair", bg: "#dbc9a8", paper: "#fbf3df", ink: "#2a1810", line: "#dcc9a3", green: "#5e6a2e", talk: "#9a3927", meal: "#a87b21" },
    dark: { name: "Braise", bg: "#170f0a", paper: "#2a1d14", ink: "#f3e6cd", line: "#3a2a1e", green: "#a9b56a", talk: "#e08a6e", meal: "#d9a948" },
  },
  noel: {
    id: "noel",
    label: "Noël",
    light: { name: "Givre", bg: "#fbfcf8", paper: "#ffffff", ink: "#0f2418", line: "#e1e9e2", green: "#0b8a47", talk: "#dc1f36", meal: "#f2ae00" },
    dark: { name: "Nuit étoilée", bg: "#071f16", paper: "#0f3726", ink: "#f8f4e9", line: "#17473a", green: "#2fd17a", talk: "#ff4c5c", meal: "#ffc83a" },
  },
}

export const THEME_IDS = Object.keys(THEMES) as ThemeId[]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES
}

// Les valeurs inconnues (dont l'ancien « crepuscule », devenu la variante
// sombre de Champêtre) retombent sur Champêtre.
export function getTheme(id: string | null | undefined): ThemePalette {
  if (id && isThemeId(id)) return THEMES[id]
  return THEMES.champetre
}
