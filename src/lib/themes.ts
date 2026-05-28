export type ThemeId = "champetre" | "vermeil" | "crepuscule"

export interface ThemePalette {
  id: ThemeId
  label: string
  bg: string
  paper: string
  paperDark: string
  ink: string
  ink2: string
  ink3: string
  line: string
  line2: string
  talk: string
  talkSoft: string
  meal: string
  mealSoft: string
  green: string
  greenSoft: string
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  champetre: {
    id: "champetre",
    label: "Champêtre",
    bg: "#ece6d6",
    paper: "#faf6ea",
    paperDark: "#1c1b18",
    ink: "#1c1b18",
    ink2: "#4a4842",
    ink3: "#8a8579",
    line: "#e0d8c2",
    line2: "#cabf9f",
    talk: "#6a4cb8",
    talkSoft: "#ece5fb",
    meal: "#c98a1a",
    mealSoft: "#fbeccb",
    green: "#2b8a5b",
    greenSoft: "#dbeede",
  },
  vermeil: {
    id: "vermeil",
    label: "Vermeil",
    bg: "#dbc9a8",
    paper: "#f3e6cd",
    paperDark: "#2a1810",
    ink: "#2a1810",
    ink2: "#503929",
    ink3: "#8e7657",
    line: "#dcc9a3",
    line2: "#bfa676",
    talk: "#9a3927",
    talkSoft: "#f1d8ce",
    meal: "#a87b21",
    mealSoft: "#f1e0bf",
    green: "#5e6a2e",
    greenSoft: "#e2e0bf",
  },
  crepuscule: {
    id: "crepuscule",
    label: "Crépuscule",
    bg: "#191720",
    paper: "#221f29",
    paperDark: "#faf6ea",
    ink: "#f4ecd8",
    ink2: "#d6cdb8",
    ink3: "#a59f8a",
    line: "#332e3e",
    line2: "#4a4255",
    talk: "#c9a86b",
    talkSoft: "#3a3043",
    meal: "#c98a1a",
    mealSoft: "#3a2f1f",
    green: "#7fae8a",
    greenSoft: "#2a3530",
  },
}

export const THEME_IDS = Object.keys(THEMES) as ThemeId[]

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && value in THEMES
}

export function getTheme(id: string | null | undefined): ThemePalette {
  if (id && isThemeId(id)) return THEMES[id]
  return THEMES.champetre
}
