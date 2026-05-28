// Landing — Contes & Légendes (public homepage)
// Implements the design from `Landing - Contes et Légendes.html`.
// Uses the global theme tokens (--paper, --ink, --talk, ...) defined in
// globals.css; switching `[data-theme]` on <html> re-skins everything.

import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

const DATES_LABEL = "17 & 18 octobre 2026"
const DATES_ROMAN = "XVII — XVIII OCTOBRE MMXXVI"
const EDITION = "II"

const NAV_ITEMS = [
  { id: "concept", label: "Le concept" },
  { id: "theme", label: "Le thème" },
  { id: "deroule", label: "Déroulé" },
  { id: "pratique", label: "Pratique" },
]

const SPARKS = [
  { title: "Mythes & cosmogonies", note: "Les histoires d'origine — d'un peuple, d'un fleuve, d'une étoile." },
  { title: "Créatures du folklore", note: "Mélusine, garous, korrigans, et tous les habitants des marges." },
  { title: "Légendes urbaines", note: "Les rumeurs tenaces qu'on raconte à voix basse aux veillées modernes." },
  { title: "Contes & morale", note: "Pourquoi raconte-t-on encore Perrault, Andersen, les frères Grimm ?" },
  { title: "Récits familiaux", note: "Cette histoire que ta grand-mère répète à chaque Noël." },
  { title: "Mensonges & véridique", note: "Ce qu'on choisit de croire, et pourquoi ça tient si bien." },
]

const STEPS = [
  { n: "I", title: "Tu t'inscris", body: "Quelques infos sur le formulaire (régime alimentaire, +1 éventuel, nuit sur place). Ton +1 doit aussi s'inscrire." },
  { n: "II", title: "Tu proposes — ou pas", body: "Une conférence si tu as un sujet ; sinon, tu viens écouter. Les deux sont parfaitement bienvenus." },
  { n: "III", title: "On compose le livret", body: "On rassemble les propositions, on cale les horaires, et on t'envoie le programme une semaine avant." },
  { n: "IV", title: "On se retrouve", body: "Tu arrives le samedi midi. Repas, conférences, soirée, dimanche brunch, encore des récits, et au revoir le dimanche soir." },
]

const FACTS = [
  { k: "Lieu", v: "Chez nous, à Veneux-les-Sablons (Moret-Loing-et-Orvanne, Seine-et-Marne). À 1h de Paris en Transilien depuis Gare de Lyon." },
  { k: "Durée", v: "Du samedi midi au dimanche soir. Tu peux venir pour un seul jour, c'est aussi très bien." },
  { k: "Tablée", v: "Entre 10 et 15 personnes selon les jours. On reste à taille de salon." },
  { k: "Nuit sur place", v: "Possible — quelques matelas et canapés, premiers arrivés premiers servis. Sinon, hôtels et gîtes à 10 minutes." },
  { k: "+1", v: "Tu peux venir accompagné·e. Ton +1 doit s'inscrire de son côté pour qu'on l'ait sur le livret." },
  { k: "Participation", v: "On s'occupe des courses, des repas, des boissons et de l'intendance. On demande une petite participation aux frais (~5 €) à régler en ligne." },
]

function Fleuron({ size = 10, color = "currentColor", style }: { size?: number; color?: string; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color} style={style} aria-hidden>
      <path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" />
    </svg>
  )
}

function Ornament({ children, gap = 14, lineWidth = 80 }: { children: React.ReactNode; gap?: number; lineWidth?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap, color: "var(--line-2)" }}>
      <span style={{ height: 1, width: lineWidth, background: "currentColor" }} />
      {children}
      <span style={{ height: 1, width: lineWidth, background: "currentColor" }} />
    </div>
  )
}

function ChevIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m9 6 6 6-6 6" />
    </svg>
  )
}

function WhatsAppIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2a9.94 9.94 0 0 0-8.55 14.96L2 22l5.2-1.37A9.94 9.94 0 1 0 12.04 2Zm5.79 14.18c-.24.67-1.4 1.28-1.94 1.34-.5.06-1.13.08-1.83-.12-.42-.13-.96-.31-1.66-.61-2.93-1.27-4.84-4.21-4.98-4.4-.15-.2-1.2-1.6-1.2-3.04 0-1.45.75-2.15 1.02-2.45.27-.3.6-.37.8-.37l.58.01c.18.01.43-.07.68.52.24.6.83 2.05.9 2.2.07.15.12.32.02.52-.1.2-.15.32-.3.49-.15.18-.32.4-.45.53-.15.15-.31.32-.13.62.18.3.78 1.29 1.67 2.09 1.14 1.02 2.1 1.34 2.4 1.49.3.15.48.13.66-.08.18-.2.76-.89.96-1.2.2-.3.4-.25.67-.15.27.1 1.71.8 2 .95.3.15.5.22.57.34.07.13.07.74-.16 1.42Z" />
    </svg>
  )
}

function IlluminatedCapital({ letter }: { letter: string }) {
  const accent = "var(--ink)"
  const corner = (pos: React.CSSProperties): React.CSSProperties => ({
    position: "absolute", width: 8, height: 8, ...pos,
  })
  return (
    <div style={{
      width: 74, height: 74, flexShrink: 0,
      border: `1.5px solid ${accent}`,
      position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent",
    }}>
      <span style={corner({ top: -1, left: -1, borderTop: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}` })} />
      <span style={corner({ top: -1, right: -1, borderTop: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}` })} />
      <span style={corner({ bottom: -1, left: -1, borderBottom: `1.5px solid ${accent}`, borderLeft: `1.5px solid ${accent}` })} />
      <span style={corner({ bottom: -1, right: -1, borderBottom: `1.5px solid ${accent}`, borderRight: `1.5px solid ${accent}` })} />
      <span style={{
        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
        fontSize: 54, fontWeight: 600, fontStyle: "italic", lineHeight: 1,
        color: accent, transform: "translateY(2px)",
      }}>{letter}</span>
    </div>
  )
}

function SectionTitle({ kicker, title, subtitle, italic }: { kicker: string; title: React.ReactNode; subtitle?: string; italic?: boolean }) {
  return (
    <div style={{ textAlign: "center", marginBottom: 48 }}>
      <div style={{
        fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.28em",
        color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 14,
      }}>{kicker}</div>
      <h2 style={{
        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 64, fontWeight: 500,
        margin: 0, letterSpacing: "-0.03em", lineHeight: 1.02, color: "var(--ink)",
        textWrap: "balance",
      }}>
        {italic ? <span style={{ fontStyle: "italic" }}>{title}</span> : title}
      </h2>
      {subtitle && (
        <div style={{
          fontFamily: "var(--font-newsreader), serif", fontStyle: "italic", fontSize: 19,
          color: "var(--ink-2)", marginTop: 14, fontWeight: 400, textWrap: "balance",
          maxWidth: 640, marginLeft: "auto", marginRight: "auto",
        }}>{subtitle}</div>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <div style={{
      background: "var(--paper)",
      color: "var(--ink)",
      fontFamily: "var(--font-manrope), system-ui, sans-serif",
      minHeight: "100vh",
    }}>
      {/* ── Header ── */}
      <header style={{
        borderBottom: "1px solid var(--line)",
        background: "var(--paper)",
        position: "sticky", top: 0, zIndex: 10,
        backdropFilter: "saturate(1.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "14px 28px", maxWidth: 1280, margin: "0 auto" }}>
          <a href="#" style={{ textDecoration: "none", color: "inherit", display: "block", lineHeight: 1.05 }}>
            <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 4 }}>
              Congrès Champêtre · Édition&nbsp;{EDITION}
            </div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 22, fontWeight: 600, letterSpacing: "-0.015em", color: "var(--ink)", fontStyle: "italic" }}>
              Contes &amp; Légendes
            </div>
          </a>
          <div style={{ flex: 1 }} />
          <nav style={{ display: "flex", gap: 4 }}>
            {NAV_ITEMS.map((it) => (
              <a key={it.id} href={`#${it.id}`} style={{
                padding: "8px 12px", fontFamily: "var(--font-manrope), sans-serif", fontSize: 13.5,
                color: "var(--ink-2)", textDecoration: "none", borderRadius: 8,
              }}>{it.label}</a>
            ))}
          </nav>
          <ThemeToggle />
          <Link href="/auth/signin" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "var(--ink)", color: "var(--paper)",
            padding: "10px 16px", borderRadius: 10,
            fontFamily: "var(--font-manrope), sans-serif", fontWeight: 600, fontSize: 13,
            textDecoration: "none", whiteSpace: "nowrap",
          }}>
            S&apos;inscrire
            <ChevIcon size={14} />
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ position: "relative", padding: "96px 32px 88px", borderBottom: "1px solid var(--line)", overflow: "hidden" }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.025) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse at 12% 0%, rgba(201,168,107,0.10), transparent 55%),
                       radial-gradient(ellipse at 95% 100%, rgba(106,76,184,0.08), transparent 55%)`,
        }} />
        <div style={{ position: "relative", maxWidth: 1080, margin: "0 auto", textAlign: "center" }}>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.36em",
            color: "var(--ink-3)", textTransform: "uppercase", marginBottom: 24,
          }}>
            Congrès&nbsp;Champêtre — Édition&nbsp;{EDITION}
          </div>

          <Ornament lineWidth={56} gap={20}>
            <Fleuron size={10} />
            <span style={{ fontFamily: "var(--font-newsreader), serif", fontStyle: "italic", fontSize: 18, color: "var(--ink-2)", fontWeight: 500 }}>
              où l&apos;on raconte
            </span>
            <Fleuron size={10} />
          </Ornament>

          <h1 style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(76px, 13vw, 188px)", fontWeight: 500,
            margin: "22px 0 0", letterSpacing: "-0.045em", lineHeight: 0.92,
            color: "var(--ink)", textWrap: "balance",
          }}>
            Contes<br />
            <span style={{ fontStyle: "italic", fontWeight: 400, color: "var(--talk)" }}>&amp;&nbsp;Légendes</span>
          </h1>

          <div style={{
            fontFamily: "var(--font-newsreader), serif", fontStyle: "italic", fontSize: 22,
            color: "var(--ink-2)", marginTop: 28, fontWeight: 400, textWrap: "balance",
            maxWidth: 640, marginLeft: "auto", marginRight: "auto",
          }}>
            Un weekend de récits, de feux et de bonne compagnie — chacun y porte une histoire à partager.
          </div>

          <div style={{ marginTop: 36, display: "flex", justifyContent: "center" }}>
            <div style={{
              display: "inline-flex", alignItems: "stretch",
              border: "1px solid var(--line-2)", borderRadius: 14,
              background: "color-mix(in srgb, var(--paper) 60%, transparent)",
              backdropFilter: "blur(2px)",
            }}>
              {[
                { k: "Quand", v: DATES_LABEL },
                { k: "Où", v: "Veneux-les-Sablons (77)" },
                { k: "Tablée", v: "10 à 15 convives" },
              ].map((item, i, arr) => (
                <div key={item.k} style={{
                  padding: "14px 22px",
                  borderRight: i < arr.length - 1 ? "1px solid var(--line-2)" : "none",
                  textAlign: "left",
                }}>
                  <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, letterSpacing: "0.2em", color: "var(--ink-3)", textTransform: "uppercase" }}>
                    {item.k}
                  </div>
                  <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 17, color: "var(--ink)", marginTop: 4, fontWeight: 500 }}>
                    {item.v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signin" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "var(--ink)", color: "var(--paper)",
              padding: "14px 24px", borderRadius: 12,
              fontFamily: "var(--font-manrope), sans-serif", fontWeight: 600, fontSize: 14,
              textDecoration: "none",
            }}>
              S&apos;inscrire au congrès
              <ChevIcon size={15} />
            </Link>
            <a href="#concept" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              border: "1px solid var(--line-2)", color: "var(--ink)",
              padding: "14px 22px", borderRadius: 12,
              fontFamily: "var(--font-manrope), sans-serif", fontWeight: 500, fontSize: 14,
              textDecoration: "none", background: "transparent",
            }}>
              Découvrir le concept
            </a>
          </div>

          <div style={{ marginTop: 54 }}>
            <Ornament lineWidth={80}>
              <Fleuron size={9} />
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: "var(--ink-3)", letterSpacing: "0.16em" }}>{DATES_ROMAN}</span>
              <Fleuron size={9} />
            </Ornament>
          </div>
        </div>
      </section>

      {/* ── Concept ── */}
      <section id="concept" style={{ padding: "96px 32px 88px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <SectionTitle kicker="Prologue" title="Le concept" />
          <div style={{
            fontFamily: "var(--font-newsreader), serif", fontSize: 21, lineHeight: 1.65,
            color: "var(--ink)", textAlign: "left", maxWidth: 720, margin: "0 auto",
            textWrap: "pretty",
          }}>
            <div style={{ margin: 0, display: "flex", gap: 22, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, marginTop: 4 }}>
                <IlluminatedCapital letter="C" />
              </div>
              <div>
                <span style={{ fontFamily: "var(--font-cormorant), serif", fontWeight: 500 }}>haque</span> été — et cette fois-ci à l&apos;automne — nous réunissons une dizaine d&apos;amis
                chez nous, à Veneux-les-Sablons. Le principe est simple&nbsp;:
                <em> n&apos;importe qui peut donner une petite conférence</em> de trente à
                quarante-cinq minutes sur une passion, un sujet d&apos;étude, une obsession
                de longue date.
              </div>
            </div>
            <div style={{ margin: "22px 0 0" }}>
              L&apos;idée n&apos;est pas de tenir un colloque savant. C&apos;est avant tout
              de <strong style={{ fontWeight: 600 }}>créer du lien</strong> entre les gens
              dans une ambiance détendue&nbsp;: un weekend de conversations, de repas
              partagés, et de récits qu&apos;on n&apos;aurait pas entendus ailleurs.
            </div>
          </div>
          <div style={{ marginTop: 56 }}>
            <Ornament lineWidth={80}>
              <Fleuron size={9} />
              <Fleuron size={9} color="var(--talk)" />
              <Fleuron size={9} />
            </Ornament>
          </div>
        </div>
      </section>

      {/* ── Thème ── */}
      <section id="theme" style={{
        padding: "96px 32px 88px", borderBottom: "1px solid var(--line)",
        background: "var(--paper) radial-gradient(ellipse at 90% 10%, color-mix(in srgb, var(--talk) 8%, transparent), transparent 50%)",
        position: "relative",
      }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionTitle
            kicker="Édition de l'automne MMXXVI"
            title={<>Contes &amp; <em>Légendes</em></>}
            subtitle="Le fil rouge de cette seconde édition. Une boussole, pas une cage : à interpréter avec largesse."
          />
          <div style={{
            maxWidth: 720, margin: "0 auto 56px",
            fontFamily: "var(--font-newsreader), serif", fontSize: 20, lineHeight: 1.6,
            color: "var(--ink-2)", textAlign: "center", fontStyle: "italic", textWrap: "pretty",
          }}>
            «&nbsp;Tout ce qu&apos;on raconte autour d&apos;un feu — pour effrayer les enfants,
            consoler les adultes, ou expliquer ce qu&apos;on ne comprend pas tout à fait.&nbsp;»
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 1, background: "var(--line)",
            border: "1px solid var(--line)", borderRadius: 14, overflow: "hidden",
            maxWidth: 1080, margin: "0 auto",
          }}>
            {SPARKS.map((s, i) => (
              <div key={s.title} style={{ background: "var(--paper)", padding: "28px 26px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 10, color: "var(--ink-3)", letterSpacing: "0.18em" }}>
                  Piste·{String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, fontWeight: 600, lineHeight: 1.1, letterSpacing: "-0.015em", color: "var(--ink)" }}>
                  {s.title}
                </div>
                <div
                  style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 15, color: "var(--ink-2)", lineHeight: 1.5, fontStyle: "italic" }}
                  dangerouslySetInnerHTML={{ __html: s.note }}
                />
              </div>
            ))}
          </div>
          <div style={{
            maxWidth: 720, margin: "40px auto 0",
            padding: "18px 22px", border: "1px dashed var(--line-2)", borderRadius: 12,
            fontFamily: "var(--font-newsreader), serif", fontSize: 15, color: "var(--ink-2)",
            textAlign: "center", fontStyle: "italic",
          }}>
            Tu as un sujet qui ne rentre <em>visiblement pas</em> dans le thème&nbsp;?
            Propose-le tout de même — on aime bien les digressions.
          </div>
        </div>
      </section>

      {/* ── Déroulé ── */}
      <section id="deroule" style={{ padding: "96px 32px 88px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ maxWidth: 1080, margin: "0 auto" }}>
          <SectionTitle kicker="En quatre actes" title="Comment ça se passe" italic />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 32, maxWidth: 1080, margin: "0 auto",
          }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 18, paddingTop: 8 }}>
                <IlluminatedCapital letter={s.n} />
                <div>
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 26, fontWeight: 600, lineHeight: 1.15, color: "var(--ink)", letterSpacing: "-0.015em" }}>
                    {s.title}
                  </div>
                  <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 15.5, color: "var(--ink-2)", lineHeight: 1.55, marginTop: 10, textWrap: "pretty" }}>
                    {s.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pratique ── */}
      <section id="pratique" style={{
        padding: "96px 32px 88px", borderBottom: "1px solid var(--line)",
        background: "var(--paper) radial-gradient(ellipse at 10% 100%, color-mix(in srgb, var(--meal) 7%, transparent), transparent 50%)",
      }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <SectionTitle kicker="L'intendance" title="Côté pratique" subtitle="Ce qu'il faut savoir avant de répondre à l'invitation." />
          <div style={{
            maxWidth: 780, margin: "0 auto",
            border: "1px solid var(--line)", borderRadius: 14,
            background: "var(--paper)", overflow: "hidden",
          }}>
            {FACTS.map((f, i) => (
              <div key={f.k} style={{
                display: "grid", gridTemplateColumns: "160px 1fr", gap: 20,
                padding: "20px 26px",
                borderTop: i === 0 ? "none" : "1px dashed var(--line-2)",
                alignItems: "baseline",
              }}>
                <div style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--ink-3)" }}>
                  {f.k}
                </div>
                <div style={{ fontFamily: "var(--font-newsreader), serif", fontSize: 16.5, lineHeight: 1.55, color: "var(--ink)", textWrap: "pretty" }}>
                  {f.v}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Inscription CTA ── */}
      <section id="inscription" style={{
        padding: "96px 32px 96px",
        background: "var(--paper-dark)",
        color: "color-mix(in srgb, var(--paper) 92%, white)",
        position: "relative", overflow: "hidden",
      }}>
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.08,
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.5) 1px, transparent 0)",
          backgroundSize: "3px 3px",
        }} />
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--talk) 22%, transparent), transparent 60%)",
        }} />
        <div style={{ position: "relative", maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ color: "color-mix(in srgb, var(--paper) 30%, transparent)" }}>
            <Ornament lineWidth={60}>
              <Fleuron size={10} />
              <Fleuron size={10} color="color-mix(in srgb, var(--talk) 90%, white)" />
              <Fleuron size={10} />
            </Ornament>
          </div>
          <div style={{
            fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.32em",
            color: "color-mix(in srgb, var(--paper) 55%, transparent)",
            textTransform: "uppercase", marginTop: 24,
          }}>
            Lève-toi &amp; viens
          </div>
          <h2 style={{
            fontFamily: "var(--font-cormorant), serif",
            fontSize: "clamp(56px, 8vw, 92px)", fontWeight: 500,
            margin: "18px 0 0", letterSpacing: "-0.035em", lineHeight: 1, textWrap: "balance",
          }}>
            <em>Inscris-toi</em> au congrès
          </h2>
          <div style={{
            fontFamily: "var(--font-newsreader), serif", fontStyle: "italic", fontSize: 20,
            color: "color-mix(in srgb, var(--paper) 72%, transparent)",
            marginTop: 18, fontWeight: 400, textWrap: "balance",
            maxWidth: 540, marginLeft: "auto", marginRight: "auto", lineHeight: 1.5,
          }}>
            Quelques minutes pour réserver ta place — et, si l&apos;envie te prend, proposer un récit.
          </div>
          <div style={{ marginTop: 36, display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signin" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: "var(--paper)", color: "var(--paper-dark)",
              padding: "16px 28px", borderRadius: 12,
              fontFamily: "var(--font-manrope), sans-serif", fontWeight: 600, fontSize: 15,
              textDecoration: "none",
            }}>
              Réserver ma place
              <ChevIcon size={16} />
            </Link>
            <a href="https://wa.me/" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              border: "1px solid color-mix(in srgb, var(--paper) 25%, transparent)",
              color: "color-mix(in srgb, var(--paper) 92%, white)",
              padding: "16px 24px", borderRadius: 12,
              fontFamily: "var(--font-manrope), sans-serif", fontWeight: 500, fontSize: 15,
              textDecoration: "none",
            }}>
              <WhatsAppIcon size={16} />
              Demander sur WhatsApp
            </a>
          </div>
          <div style={{ marginTop: 42, color: "color-mix(in srgb, var(--paper) 22%, transparent)" }}>
            <Ornament lineWidth={70}>
              <Fleuron size={9} />
              <span style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, letterSpacing: "0.18em", color: "color-mix(in srgb, var(--paper) 55%, transparent)" }}>
                {DATES_ROMAN}
              </span>
              <Fleuron size={9} />
            </Ornament>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ padding: "28px 32px", background: "var(--paper)", borderTop: "1px solid var(--line)" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap",
          fontFamily: "var(--font-jetbrains), monospace", fontSize: 10.5,
          color: "var(--ink-3)", letterSpacing: "0.14em", textTransform: "uppercase",
        }}>
          <span>Congrès Champêtre · MMXXVI</span>
          <span>Veneux-les-Sablons</span>
          <span>Édition {EDITION} — Contes &amp; Légendes</span>
        </div>
      </footer>
    </div>
  )
}
