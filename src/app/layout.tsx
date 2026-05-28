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
  // Pre-hydration theme resolution (runs before paint to avoid flash):
  // 1. explicit user toggle in localStorage wins
  // 2. otherwise follow OS prefers-color-scheme
  // 3. otherwise keep the server-rendered theme (admin choice, defaults to
  //    champetre / light)
  // We also subscribe to OS changes so the page tracks the system theme
  // live until the user makes an explicit choice.
  const themeBoot = `(()=>{try{
    var d=document.documentElement;
    var apply=function(mode){d.setAttribute('data-theme', mode==='dark'?'crepuscule':'champetre');};
    var m=localStorage.getItem('theme-mode');
    if(m==='dark'||m==='light'){apply(m);return;}
    var mq=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)');
    if(mq){
      if(mq.matches)apply('dark');
      var listener=function(e){if(!localStorage.getItem('theme-mode'))apply(e.matches?'dark':'light');};
      mq.addEventListener?mq.addEventListener('change',listener):mq.addListener(listener);
    }
  }catch(e){}})();`;
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
