# SimTest — Projekt-Status

> Stand: 9. April 2026
> Deployed: Vercel (via GitHub `fabiancreation/simtest`, auto-deploy auf main)
> Supabase: Shared mit Funnel Architect (Ref: `ajrshllvafqpbdhxhgsh`)
> Edge Function: `run-simulation` deployed (150s Timeout, 5 Module)
> Supabase CLI: via `npx supabase` (npm, kein Homebrew)

---

## Was gebaut wurde

### Backend — Kern-Infrastruktur
- **Waitlist-Backend** — Tabelle `waitlist`, API-Route `/api/waitlist`, Frontend angebunden
- **Password-Login** — Login-Page erweitert (Passwort + Magic Link + Google OAuth toggle)
- **Plan-Trennung** — `simtest_plan` Spalte (getrennt von Funnel Architect `plan`)
- **User-Setup** — `fabian@simtest.com` angelegt, `business` Plan, 9999 Runs

### Simulations-Engine v2
- **7 Simulationstypen** — Copy, Produkt, Pricing, Ad Creative, Landing Page, Kampagne, Krisentest
- **Multi-Runden-Loop** — 1-5 Runden, Agenten sehen Nachbar-Reaktionen in Runde 2+
- **Neues Reaktionsmodell** — like/comment/share/ignore + interest_level + credibility_rating + would_buy + biggest_objection
- **Network Builder** — 5 Topologien: Small World (Solo), Scale Free (E-Com), Hierarchical Cluster (B2B), Scale Free Dense (Gen Z), Random (DACH)
- **Rich Presets** — 5 Presets mit Big Five, Subtypes, statistischen Verteilungen, lokale Generierung ohne API-Call
- **AI-Synthese** — Haiku analysiert alle Reaktionen → Zusammenfassung, Einwand-Cluster, konkrete Empfehlungen, Kaufbereitschaft
- **Landing Page Crawler** — URLs werden gefetcht, HTML zu Text extrahiert (Title, OG-Tags, Meta, Seiteninhalt max 3000 Zeichen)
- **SimType-spezifische Prompts** — Produkt-Check: "Du stößt auf ein Angebot", Copy: "Feed-Post", Landing: "Du klickst auf einen Link" etc.
- **Persona-Caching** — `persona_cache` Tabelle (user_id + description_hash + agent_count), spart API-Kosten
- **Retry-Logik** — Exponential Backoff (3 Versuche) für alle Anthropic-Calls
- **Error Handling** — `error_message` in DB, Frontend zeigt echte Fehler
- **Robuster JSON-Parser** — Markdown-Codeblock-Stripping, Fallback auf Regex-Extraktion bei kaputtem JSON

### Supabase Edge Function — 5 Module
- `index.ts` — Handler, Agenten-Builder, Simulations-Loop, Synthese
- `presets.ts` — 5 Rich Presets mit statistischem Sampling (Box-Muller, gewichtete Auswahl)
- `network.ts` — 5 Netzwerk-Topologien (Watts-Strogatz, Barabási-Albert, Hierarchical Cluster)
- `report.ts` — Report-Generator mit Persona-Insights, Runden-Progression, Engagement
- `types.ts` — Shared Types (Agent, Reaction, Variant, SimulationReport)

### Frontend
- **Report-Seite v2** — Getesteter Content, Engagement-Vergleich (100% vs. 67%), AI-Synthese mit Empfehlungen, Agent-Kommentare (Chat-Bubble-Style), Agent-Feedback ("Was die Zielgruppe denkt"), Persona-Analyse, Konfidenz-Badge
- **Single-Variante-Report** — "Analyse" statt "Gewinner", Kaufbereitschaft, Action-Aufschlüsselung
- **Reports-Übersicht** `/reports` — Alle Simulationen, Filter nach Typ, Suche, Auto-Namen
- **Auto-Namen** — "Produkt-Check: Path to Mastery... (Solo-Unternehmer)"
- **Eigene Persona** — Klick auf "Eigene Persona" öffnet Dropdown mit gespeicherten Personas
- **Supabase Realtime** — Subscription statt Polling für Status-Updates
- **URL-Validierung** — Auto-Prefix `https://`, ungültige URLs abfangen

### UI/UX
- **Styleguide** — Outfit/Inter/JetBrains Mono, Emerald-Akzent
- **Light Mode Default** + Dark Mode Toggle
- **Sidebar** — Dashboard, Neue Simulation, Reports, Personas, Einstellungen
- **Responsive** — Mobile Hamburger-Menü

### Datenbank (10 Migrationen)
- `waitlist` (002), `simtest_plan` (003), `simulations` + `simulation_files` (004)
- `persona_profiles` v2 (005), `error_message` (006), `persona_cache` (007)
- Realtime Publication (008), `agents` + `reactions` (009), `name` (010)

---

## Was funktioniert (getestet)

- ✅ Login mit Passwort (fabian@simtest.com)
- ✅ Persona erstellen (Preset + AI-Enrichment + Eigene Persona)
- ✅ Copy Testing (5 Agenten, 2 Varianten) — diverse Kommentare, Engagement-Vergleich
- ✅ Produkt-Check (5-50 Agenten) — Kaufbereitschaft, Einwand-Analyse, AI-Synthese
- ✅ Landing Page Test — URL wird gecrawlt, Agenten reagieren auf echten Seiteninhalt
- ✅ Report mit AI-Synthese (Zusammenfassung, Empfehlungen, Einwand-Cluster)
- ✅ Reports-Übersicht mit Filter + Suche + Auto-Namen
- ✅ Supabase Realtime Updates
- ✅ Error Handling (Fehlermeldung sichtbar)
- ✅ Light/Dark Mode

---

## TODOs — Nächste Session

### Priorität 1 — Qualität & Nutzbarkeit

| # | Aufgabe | Beschreibung |
|---|---------|-------------|
| N1 | **Gemini Flash als LLM** | Agenten-Calls auf Gemini Flash umstellen (20x günstiger als Haiku). Haiku nur für Synthese. Google AI API Key nötig. |
| N2 | **Report Download (PDF)** | Report als PDF exportieren. Enthält: Getesteter Content, Ergebnis, Synthese, Kommentare, Persona-Analyse. |
| N3 | **Report Sharing** | Öffentlicher Share-Link pro Report (ohne Login). Empfänger sieht Read-Only-Version. Optional: Ablaufdatum. |
| N4 | **Restliche SimTypen testen** | Pricing, Ad Creative, Kampagnen-Check, Krisentest End-to-End durchspielen und Bugs fixen. |
| N5 | **Antwort-Diversität verbessern** | Agenten-Kommentare klingen noch zu ähnlich ("Klingt interessant, aber..."). Prompt-Varianz erhöhen, verschiedene Einstiegssätze erzwingen. |
| N6 | **Realtime funktioniert unzuverlässig** | Status-Updates kommen nicht immer an. Fallback-Polling einbauen wenn Realtime-Subscription nach 10s kein Update liefert. |

### Priorität 2 — Features

| # | Aufgabe | Beschreibung |
|---|---------|-------------|
| F1 | **Multi-Runden testen** | 2-3 Runden mit Netzwerk-Effekt (Agenten sehen Nachbar-Reaktionen). Bisher nur 1 Runde getestet. |
| F2 | **Simulation-Redirect** | Nach Submit auf /simulation/new → Redirect zu /simulation/[id] prüfen |
| F3 | **Rate Limiting** | Kein Schutz gegen API-Missbrauch |
| F4 | **Runs-Reset monatlich** | runs_used wird nie zurückgesetzt |
| F5 | **Report umbenennen** | User soll Report-Namen manuell ändern können |

### Priorität 3 — Phase 2

| # | Aufgabe | Beschreibung |
|---|---------|-------------|
| S1 | **Stripe Integration** | Subscriptions, Webhooks, Plan-Upgrade |
| S2 | **E-Mail-Notifications** | "Simulation fertig" per E-Mail |
| S3 | **Headless Browser Crawling** | Für SPAs/React-Seiten die ohne JS keinen Content haben |
| S4 | **File-Uploads** | Ad Creative + Kampagne: Bild-Upload |

---

## Architektur

| Komponente | Technologie | Status |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind | ✅ Deployed |
| Auth | Supabase Auth (Password + Magic Link) | ✅ Funktioniert |
| DB | Supabase PostgreSQL (shared) | ✅ Funktioniert |
| LLM (Agenten) | Claude Haiku 4.5 (Temperature 0.8) | ✅ Funktioniert — teuer (~$0.002/Agent) |
| LLM (Synthese) | Claude Haiku 4.5 | ✅ Funktioniert |
| Simulation | Supabase Edge Function (150s Timeout) | ✅ Deployed |
| Hosting | Vercel Free Plan | ✅ Deployed |
| Payments | Stripe (geplant) | ❌ Phase 2 |

### Kosten pro Simulation (Haiku)
- 5 Agenten: ~$0.01
- 10 Agenten: ~$0.03
- 50 Agenten: ~$0.10
- + 1 Synthese-Call: ~$0.005

---

## Wichtige Dateien

| Datei | Zweck |
|---|---|
| `supabase/functions/run-simulation/index.ts` | Edge Function: Handler, Agenten, Loop, Synthese |
| `supabase/functions/run-simulation/presets.ts` | 5 Rich Presets + lokale Persona-Generierung |
| `supabase/functions/run-simulation/network.ts` | 5 Netzwerk-Topologien |
| `supabase/functions/run-simulation/report.ts` | Report-Generator |
| `supabase/functions/run-simulation/types.ts` | Shared Types |
| `src/app/(app)/simulation/new/page.tsx` | Neue Simulation (7 Typen, dynamische Felder) |
| `src/app/(app)/simulation/[id]/page.tsx` | Report-Seite v2 |
| `src/app/(app)/reports/page.tsx` | Reports-Übersicht mit Filter + Suche |
| `src/app/api/simulations/create/route.ts` | API: Erstellt Sim + Auto-Name + Edge Function |
| `src/app/api/simulations/[id]/status/route.ts` | API: Status + result_data |
| `src/types/simulation.ts` | Frontend Types + SimType Config + Presets |
| `docs/STYLEGUIDE.md` | Design-Tokens + Komponenten-Regeln |

---

*Letzte Aktualisierung: 9. April 2026*
