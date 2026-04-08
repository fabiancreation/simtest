# SimTest — Projekt-Status

> Stand: 8. April 2026
> Deployed: Vercel (via GitHub `fabiancreation/simtest`, auto-deploy auf main)
> Supabase: Shared mit Funnel Architect (Ref: `ajrshllvafqpbdhxhgsh`)
> Edge Function: `run-simulation` deployed (150s Timeout)

---

## Was gebaut wurde (diese Session)

### Backend — Kern-Infrastruktur
- **Waitlist-Backend** — Tabelle `waitlist`, API-Route `/api/waitlist`, Frontend angebunden
- **Password-Login** — Login-Page erweitert (Passwort + Magic Link + Google OAuth toggle)
- **Plan-Trennung** — `simtest_plan` Spalte (getrennt von Funnel Architect `plan`)
- **User-Setup** — `fabian@simtest.com` angelegt, `business` Plan, 9999 Runs

### Simulation — End-to-End Flow
- **7 Simulationstypen** — Copy, Produkt, Pricing, Ad Creative, Landing Page, Kampagne, Krisentest
- **Dynamische Eingabeseite** `/simulation/new` — Felder passen sich an den Typ an
- **Persona-Builder v2** `/personas/new` — Quick-Mode + Experten-Wizard (5 Schritte)
- **AI-Enrichment** `/api/personas/enrich` — Claude Haiku füllt leere Persona-Felder auf
- **Persona-Presets v2** — 5 Rich Presets (DACH, Solo, E-Com, B2B, Gen Z) mit Big Five, Subtypes, statistischen Verteilungen, Network Topology, Platform Behavior. Lokale Generierung ohne API-Call.
- **Simulations-Engine v2** — Multi-Runden-Loop mit sozialer Beeinflussung. Agenten sehen Nachbar-Reaktionen in Runde 2+. Neues Reaktionsmodell: like/comment/share/ignore + interest_level + credibility_rating.
- **Network Builder** — 4 Topologien: Small World (Solo), Scale Free (E-Com), Hierarchical Cluster (B2B), Scale Free Dense (Gen Z), Random (DACH).
- **Report-Generator v2** — Engagement-Raten, Persona-Insights nach Big-Five-Segmenten, Runden-Progression, Key Insights, Konfidenz-Level, Top-Kommentare.
- **Supabase Edge Function** `run-simulation` — 5 Module (index.ts, presets.ts, network.ts, report.ts, types.ts). Simulation async (150s Timeout).
- **Ergebnis-Seite v2** `/simulation/[id]` — Realtime Updates, Runden-Fortschritt, neues Report-Layout mit Kommentaren, Persona-Analyse, Konfidenz-Badge. Abwärtskompatibel mit alten Simulationen.
- **Dashboard** — Zeigt neue Simulationen + alte Runs zusammen, verlinkt zu Reports

### UI/UX — Komplettes Redesign
- **Styleguide** — Abgeleitet aus Landing Page (Outfit/Inter/JetBrains Mono, Emerald-Akzent)
- **Light Mode Default** + Dark Mode Toggle (localStorage, kein Flash)
- **Sidebar** — Logo mit Glow, Mobile Hamburger-Menü, Theme-Toggle
- **Alle App-Seiten** überarbeitet (Dashboard, Personas, Run, Report, Settings, Login)
- **Wiederverwendbare CSS-Klassen** — `.card`, `.stat-card`, `.btn-primary`, `.badge`, `.input`

### Datenbank
- `waitlist` Tabelle (002)
- `simtest_plan` Spalte auf profiles (003)
- `simulations` + `simulation_files` Tabellen (004)
- 20+ neue Spalten auf `persona_profiles` für v2 (005)

---

## Was funktioniert (getestet)

- ✅ Login mit Passwort (fabian@simtest.com)
- ✅ Persona erstellen (Preset + AI-Enrichment)
- ✅ Copy Testing Simulation (5 Agenten, 2 Varianten)
- ✅ Report-Anzeige mit Gewinner, Sentiment, Vorschlägen
- ✅ Dashboard zeigt Simulationen mit Status + Links zu Reports
- ✅ Waitlist speichert E-Mails
- ✅ Light/Dark Mode

---

## Was NICHT funktioniert / fehlt

### Priorität 1 — Für echten Nutzer-Test

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| P1 | **Persona-Presets Backend** | ✅ Überarbeitet | Rich Presets mit Big Five, Subtypes, statistischen Verteilungen. Lokale Generierung ohne API-Call. 5 Presets (DACH, Solo, E-Com, B2B, Gen Z). |
| P2 | **Mehr Simulationstypen testen** | ❌ Offen | Nur Copy Testing getestet. Neue Engine muss mit allen 7 Typen getestet werden. |
| P3 | **Error Handling verbessern** | ✅ Fertig | `error_message` Spalte, Edge Function speichert Fehler, Frontend zeigt sie an, Polling stoppt bei failed. |
| P4 | **Simulation-Redirect** | ❌ Offen | Nach Submit auf /simulation/new → Redirect zu /simulation/[id] prüfen |

### Priorität 2 — Qualität & Features

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| Q1 | **Landing Page Crawling** | ❌ Offen | Landing Page Test schickt nur URL als Text, kein echtes Crawling |
| Q2 | **Supabase Realtime** | ✅ Fertig | Polling durch Supabase Realtime Subscription ersetzt. Publication auf simulations aktiviert. |
| Q3 | **Persona-Caching** | ✅ Fertig | `persona_cache` Tabelle mit (user_id, description_hash, agent_count). Edge Function prüft Cache vor Generierung. |
| Q4 | **Error Handling + Retry** | ✅ Fertig | `withRetry()` mit Exponential Backoff (3 Versuche, 1s/2s/4s) für alle Anthropic-Calls. |
| Q5 | **Rate Limiting** | ❌ Offen | Kein Schutz gegen API-Missbrauch |
| Q6 | **Runs-Reset monatlich** | ❌ Offen | runs_used wird nie zurückgesetzt |
| Q7 | **File-Uploads** | ❌ Offen | Ad Creative + Kampagne: Bild-Upload UI existiert im Konzept, nicht implementiert |

### Priorität 3 — Phase 2

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| S1 | **Stripe Integration** | ❌ Offen | Subscriptions, Webhooks, Plan-Upgrade |
| S2 | **PDF-Export** | ❌ Offen | Report als PDF downloaden |
| S3 | **E-Mail-Notifications** | ❌ Offen | "Simulation fertig" per E-Mail |

---

## Architektur

| Komponente | Technologie | Status |
|---|---|---|
| Frontend | Next.js 16 + TypeScript + Tailwind | ✅ Deployed |
| Auth | Supabase Auth (Password + Magic Link) | ✅ Funktioniert |
| DB | Supabase PostgreSQL (shared) | ✅ Funktioniert |
| LLM | Claude Haiku 4.5 (Personas + Reaktionen + Report) | ✅ Funktioniert |
| Simulation | Supabase Edge Function (150s Timeout) | ✅ Deployed |
| Hosting | Vercel Free Plan | ✅ Deployed |
| Payments | Stripe (geplant) | ❌ Phase 2 |

---

## Wichtige Dateien

| Datei | Zweck |
|---|---|
| `src/app/(app)/simulation/new/page.tsx` | Neue Simulation (7 Typen, dynamische Felder) |
| `src/app/(app)/simulation/[id]/page.tsx` | Ergebnis-Seite (Polling + Report) |
| `src/app/(app)/personas/new/page.tsx` | Persona-Builder v2 (Quick + Expert) |
| `src/app/api/simulations/create/route.ts` | API: Erstellt Sim + ruft Edge Function |
| `src/app/api/personas/enrich/route.ts` | API: AI-Enrichment für Personas |
| `supabase/functions/run-simulation/index.ts` | Edge Function: Führt Simulation aus |
| `src/types/simulation.ts` | Alle Types + SimType Config + Presets |
| `docs/STYLEGUIDE.md` | Design-Tokens + Komponenten-Regeln |

---

*Letzte Aktualisierung: 8. April 2026*
