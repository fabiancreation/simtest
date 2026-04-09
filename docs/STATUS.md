# SimTest — Projekt-Status

> Stand: 10. April 2026 (Nacht)
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
- **Rate Limiting** — In-Memory, 10 Simulationen/Minute pro User
- **Monatlicher Runs-Reset** — pg_cron Job, 1. jedes Monats 00:00 UTC

### Simulations-Engine v3
- **8 Simulationstypen** — Copy, Produkt, Pricing, Ad Creative, Landing Page, Kampagne, Krisentest, **Business-Strategie (NEU)**
- **Multi-Runden-Loop** — 1-5 Runden, Agenten sehen Nachbar-Reaktionen in Runde 2+
- **Neues Reaktionsmodell** — like/comment/share/ignore + interest_level + credibility_rating + would_buy + biggest_objection (jetzt in DB gespeichert)
- **Network Builder** — 5 Topologien: Small World (Solo), Scale Free (E-Com), Hierarchical Cluster (B2B), Scale Free Dense (Gen Z), Random (DACH)
- **Rich Presets** — 5 Presets mit Big Five, Subtypes, statistischen Verteilungen, lokale Generierung ohne API-Call
- **Subtype-korrelierte Pain Points** — Impulskäufer, Recherche-Käufer, Creator etc. haben eigene Pain Points/Triggers/Blockers
- **AI-Synthese v2** — Bekommt jetzt Context + Fokus-Frage, empfiehlt nichts was der Nutzer bereits hat. Strategy-Synthese trennt Konsumentenreaktionen von strategischen Schlüssen
- **Landing Page Crawler** — URLs werden gefetcht, HTML zu Text extrahiert
- **Dynamisches Copy-Framing** — Erkennt Newsletter/E-Mail/Google Ads/Shop/Blog/Slogan aus Context
- **Context-Durchreichung** — User-Context fließt in jeden Agenten-Prompt ein
- **Fokus-Frage** — Wird an Agenten und Synthese weitergegeben
- **Persona-Pool** — Presets: 200er-Pool lokal generiert. Eigene Personas: 50er-Pool via API. Random-Sampling pro Simulation (keine identischen Wiederholungen)
- **Name-Deduplication** — Keine doppelten Persona-Namen bei bis zu 400 Agenten
- **Individuelles Media-Sampling** — Jeder Agent bekommt eigene Medien/Trust-Sources statt identischer Listen
- **Platform Behavior** — Preset-Wahrscheinlichkeiten fließen als natürlichsprachliche Tendenz in System-Prompt ein
- **Reichhaltige Personality-Texte** — 30+ Varianten, Big-Five-granular, kontext-abhängig, Subtype-integriert
- **Antwort-Diversität** — 10 gebannte Eröffnungsphrasen, Kommentar-Stil-Anweisung, Temperature 0.9
- **Persona-Caching v2** — Pool-basiert (user_id + description_hash), wächst durch Merging. Eigene Personas nutzen denselben Pool-Mechanismus wie Presets
- **Retry-Logik** — Exponential Backoff (3 Versuche) für alle Anthropic-Calls
- **Error Handling** — `error_message` in DB, Frontend zeigt echte Fehler
- **Robuster JSON-Parser** — Markdown-Codeblock-Stripping, Fallback auf Regex-Extraktion, max_tokens 1000

### Supabase Edge Function — 5 Module
- `index.ts` — Handler, Agenten-Builder, Simulations-Loop, Synthese
- `presets.ts` — 5 Rich Presets mit statistischem Sampling + Subtype-Listen + Name-Dedup
- `network.ts` — 5 Netzwerk-Topologien (Watts-Strogatz, Barabási-Albert, Hierarchical Cluster)
- `report.ts` — Report-Generator mit dynamischen Insights, Einwand-Clustering, Kaufbereitschaft
- `types.ts` — Shared Types (Agent, Reaction, Variant, SimulationReport)

### Frontend
- **Report-Seite v3** — Dynamische Labels pro SimType, PDF-Export (Print), Report-Sharing, Report umbenennen, Report löschen
- **PDF-Export** — window.print() mit Print-Stylesheet (Sidebar/Buttons ausgeblendet, Farben forciert)
- **Report-Sharing** — Share-Token (UUID), 30 Tage Ablauf, öffentliche Read-Only-Seite `/share/[token]`
- **Report umbenennen** — Inline-Edit mit Pencil-Icon im Report-Header
- **Single-Variante-Report** — "Analyse" statt "Gewinner", Kaufbereitschaft, Action-Aufschlüsselung
- **Reports-Übersicht** `/reports` — Alle Simulationen, Filter nach Typ, Suche, Auto-Namen, Löschen (Hover-Trash-Icon)
- **Auto-Namen** — "Produkt-Check: Path to Mastery... (Solo-Unternehmer)"
- **Persona bearbeiten** — Edit-Seite `/personas/[id]`, PATCH API, Delete mit Bestätigung, Cache-Invalidierung
- **Supabase Realtime + Fallback** — Subscription + 5s-Polling als Fallback
- **URL-Validierung** — Auto-Prefix `https://`, ungültige URLs abfangen
- **Simulation-Redirect** — Nach Submit direkt zu `/simulation/[id]`

### UI/UX
- **Styleguide** — Outfit/Inter/JetBrains Mono, Emerald-Akzent
- **Light Mode Default** + Dark Mode Toggle
- **Sidebar** — Dashboard, Neue Simulation, Reports, Personas, Einstellungen
- **Responsive** — Mobile Hamburger-Menü

### Datenbank (15 Migrationen)
- `waitlist` (002), `simtest_plan` (003), `simulations` + `simulation_files` (004)
- `persona_profiles` v2 (005), `error_message` (006), `persona_cache` (007)
- Realtime Publication (008), `agents` + `reactions` (009), `name` (010)
- `would_buy` + `biggest_objection` auf reactions (011)
- `strategy` SimType im CHECK-Constraint (012)
- Persona-Pool: Unique-Constraint ohne agent_count (013)
- Share-Tokens: `share_token`, `share_enabled`, `share_expires_at` (014)
- Monatlicher Runs-Reset via pg_cron (015)
- Persona-Priorität: primary/secondary/niche (016)

### Landing Page
- **Persona-Netzwerk-Animation** — 200 Nodes als Force-Directed Canvas-Animation im AgentCanvas-Stil
- **Charakter-Karten** — 3 Beispiel-Personas mit Big Five, Pain Points, Kaufauslöser, Medien, Einwand
- **Geschlechtergerechte Berufe** — 30 Berufe pro Geschlecht, passend zum Vornamen

---

## Was funktioniert (getestet)

- ✅ Login mit Passwort (fabian@simtest.com)
- ✅ Persona erstellen (Preset + AI-Enrichment + Eigene Persona)
- ✅ Persona bearbeiten + löschen
- ✅ Copy Testing (5 Agenten, 2 Varianten) — diverse Kommentare, Engagement-Vergleich
- ✅ Copy Testing mit Newsletter-Context — dynamisches E-Mail-Framing
- ✅ Produkt-Check (5-50 Agenten) — Kaufbereitschaft, Einwand-Analyse, AI-Synthese
- ✅ Landing Page Test — URL wird gecrawlt, Agenten reagieren auf echten Seiteninhalt
- ✅ Business-Strategie — Agenten als Konsumenten, Synthese als Strategie-Analyst
- ✅ Report mit AI-Synthese (Zusammenfassung, Empfehlungen, Einwand-Cluster)
- ✅ Reports-Übersicht mit Filter + Suche + Auto-Namen
- ✅ Report umbenennen (Inline-Edit)
- ✅ Report löschen (mit Bestätigungsdialog)
- ✅ PDF-Export (Print)
- ✅ Report-Sharing (öffentlicher Link)
- ✅ Persona-Pool: Eigene Personas werden als 20er-Pool gesampelt (nicht immer dieselben)
- ✅ Zielgruppen-Generator (aus URL/Produktbeschreibung, 2-3 Segmente mit Priorität)
- ✅ Persona-Priorität (Primär/Sekundär/Nische) als DB-Feld + UI
- ✅ Kaufbereitschafts-Toggle (Kalt/Warm/Heiß) pro Simulation
- ✅ Simulation kopieren (vorausgefülltes Formular via ?from=)
- ✅ Report löschen (Übersicht + Detail)
- ✅ Neue Persona direkt aus Simulation erstellen (Link unter Dropdown)
- ✅ Realtime Updates + Fallback-Polling
- ✅ would_buy + biggest_objection in DB persistent
- ✅ Error Handling (Fehlermeldung sichtbar)
- ✅ Light/Dark Mode
- ✅ Rate Limiting (10/min)
- ✅ Monatlicher Runs-Reset (pg_cron)
- ✅ Zielgruppen-Generator (aus URL/Produktbeschreibung, 2-3 Segmente)
- ✅ Persona-Priorität (Primär/Sekundär/Nische) als DB-Feld + UI
- ✅ Kaufbereitschafts-Toggle (Kalt/Warm/Heiß) pro Simulation
- ✅ Simulation kopieren (vorausgefülltes Formular)
- ✅ Report löschen (Übersicht + Detail)

---

## Bekannte Limitierungen

- **Strategy-SimType ist einstufig** — Kann keine Multi-Step-Funnels simulieren. Agenten sehen den Businessplan-Content und reagieren teils als Marketing-Kritiker statt als Konsumenten. Konzept für Multi-Step-Lösung in `docs/STRATEGY-REDESIGN.md`.
- **Ad Creative nur Text** — Bild-Upload fehlt, als "Text-only" gelabelt
- **Pricing, Ad, Campaign, Crisis** — Noch nicht E2E getestet
- **Multi-Runden** — Noch nicht getestet (nur 1 Runde bisher)

---

## TODOs — Nächste Session

### Priorität 1 — Nächste Session

| # | Aufgabe | Beschreibung |
|---|---------|-------------|
| P1 | **Projekte** | `projects`-Tabelle, CRUD-API, Projekt-Selector, Filter auf Personas + Reports. ~30-45 Min. |
| LP | **Landing Page Überarbeitung** | Gesamte LP reviewen + verbessern. Persona-Animation Feinschliff (Linien, Verteilung, Performance). |
| N1 | **Gemini Flash als LLM** | Agenten-Calls auf Gemini Flash umstellen (20x günstiger). Google AI API Key nötig. |
| N4 | **Restliche SimTypen testen** | Pricing, Ad Creative, Kampagnen-Check, Krisentest E2E durchspielen. |
| F1 | **Multi-Runden testen** | 2-3 Runden mit Netzwerk-Effekt. Bisher nur 1 Runde getestet. |

### Priorität 2 — Phase 2

| # | Aufgabe | Beschreibung |
|---|---------|-------------|
| S1 | **Stripe Integration** | Subscriptions, Webhooks, Plan-Upgrade |
| S2 | **E-Mail-Notifications** | "Simulation fertig" per E-Mail |
| S3 | **Headless Browser Crawling** | Für SPAs/React-Seiten die ohne JS keinen Content haben |
| S4 | **File-Uploads** | Ad Creative + Kampagne: Bild-Upload |
| D1 | **Strategy Multi-Step** | Multi-Step Funnel-Simulation laut `docs/STRATEGY-REDESIGN.md` |
| D2 | **"Nochmal testen"** | Sofort-Kopie einer Simulation mit identischem Input aber neuen Personas (1-Click Re-Run) |

---

## Architektur

| Komponente | Technologie | Status |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind | ✅ Deployed |
| Auth | Supabase Auth (Password + Magic Link) | ✅ Funktioniert |
| DB | Supabase PostgreSQL (shared) | ✅ Funktioniert |
| LLM (Agenten) | Claude Haiku 4.5 (Temperature 0.9, max_tokens 1000) | ✅ Funktioniert |
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
| `supabase/functions/run-simulation/presets.ts` | 5 Rich Presets + lokale Persona-Generierung + Name-Dedup |
| `supabase/functions/run-simulation/network.ts` | 5 Netzwerk-Topologien |
| `supabase/functions/run-simulation/report.ts` | Report-Generator mit dynamischen Insights |
| `supabase/functions/run-simulation/types.ts` | Shared Types |
| `src/app/(app)/simulation/new/page.tsx` | Neue Simulation (8 Typen, dynamische Felder) |
| `src/app/(app)/simulation/[id]/page.tsx` | Report-Seite v3 (PDF, Share, Rename) |
| `src/app/(app)/reports/page.tsx` | Reports-Übersicht mit Filter + Suche |
| `src/app/(app)/personas/page.tsx` | Persona-Übersicht mit Bearbeiten-Links |
| `src/app/(app)/personas/[id]/page.tsx` | Persona bearbeiten |
| `src/app/share/[token]/page.tsx` | Öffentliche Report-Seite (Read-Only) |
| `src/app/api/simulations/create/route.ts` | API: Erstellt Sim + Auto-Name + Rate Limit |
| `src/app/api/simulations/[id]/status/route.ts` | API: Status + result_data |
| `src/app/api/simulations/[id]/share/route.ts` | API: Share-Token generieren/revoken |
| `src/app/api/simulations/[id]/rename/route.ts` | API: Report umbenennen |
| `src/app/api/simulations/[id]/route.ts` | API: Simulation DELETE |
| `src/app/api/personas/[id]/route.ts` | API: Persona GET/PATCH/DELETE |
| `src/app/api/personas/generate-from-product/route.ts` | API: Zielgruppen-Generator |
| `src/app/(app)/personas/generate/page.tsx` | Zielgruppe aus Produkt generieren |
| `src/types/simulation.ts` | Frontend Types + SimType Config + Presets |
| `docs/STYLEGUIDE.md` | Design-Tokens + Komponenten-Regeln |
| `docs/STRATEGY-REDESIGN.md` | Konzept: Multi-Step Funnel-Simulation |

---

*Letzte Aktualisierung: 10. April 2026 (Nacht)*
