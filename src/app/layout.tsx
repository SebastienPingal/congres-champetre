import type { Metadata } from "next";
import { Manrope, Cormorant_Garamond, Newsreader, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/auth-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { prisma } from "@/lib/prisma";
import { isThemeId, type ThemeId } from "@/lib/themes";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Congrès Champêtre",
  description: "Le site officiel du Congrès Champêtre",
};

async function getActiveTheme(): Promise<ThemeId> {
  try {
    const active = await prisma.edition.findFirst({
      where: { isActive: true },
      select: { theme: true },
    });
    if (active && isThemeId(active.theme)) return active.theme;
  } catch {
    // DB unreachable at build / first render — fall back to default
  }
  return "champetre";
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getActiveTheme();
  // Pre-hydration: la palette par défaut est claire. Seul le toggle
  // utilisateur (persisté en localStorage) peut basculer en sombre.
  const themeBoot = `(()=>{try{var m=localStorage.getItem('theme-mode');if(m==='dark')document.documentElement.setAttribute('data-theme','crepuscule');else if(m==='light')document.documentElement.setAttribute('data-theme','champetre');}catch(e){}})();`;
  return (
    <html lang="fr" data-theme={theme}>
      <body
        className={`${manrope.variable} ${jetbrains.variable} ${cormorant.variable} ${newsreader.variable} antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <AuthProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
