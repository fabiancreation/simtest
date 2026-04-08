# SimTest — Projekt-Status

> Stand: 8. April 2026
> Deployed: Vercel (via GitHub `fabiancreation/simtest`, auto-deploy auf main)
> Supabase: Shared mit Funnel Architect (Ref: `ajrshllvafqpbdhxhgsh`)

---

## Was gebaut wurde

### 1. Landing Page (`src/app/page.jsx`)
- **Komplett fertig**, deployed, responsive (Mobile/Tablet/Desktop)
- Light/Dark Mode mit Toggle
- Animierter Agent Canvas (Partikel-Simulation mit Physik)
- Insight Stream (BIFeed: Ebene 1 → 2 → 3, Loop)
- 4-Ebenen-Showcase mit interaktiven Tabs
- How-it-Works (4 Schritte)
- Persona-Builder Highlight Section
- Ehrlichkeits-Section ("SimTest ersetzt keine echte Marktforschung")
- Pricing mit monatlich/jährlich Toggle (Free, Starter €12, Pro €34, Business €89)
- Waitlist mit Social Proof (Avatar-Stack + Counter)
- SVG Icons durchgehend (keine Emojis)
- prefers-reduced-motion Support
- Kontrastwerte WCAG AA+ im Light Mode

### 2. Auth (`src/app/(auth)/`)
- **Login-Page** mit Magic Link + Google OAuth UI
- **Callback-Route** für Auth-Code-Exchange
- **Middleware** schützt `/dashboard/*` Routen
- Supabase SSR Client (Client/Server/Middleware)

### 3. App-Seiten (`src/app/(app)/`)
- **Dashboard** — Kontingent-Anzeige, letzte Runs, CTA für neue Simulation
- **Personas** — Persona-Profile verwalten, Generierungs-Formular
- **Run/New** — Stimulus-Input (Typ-Wahl, Varianten-Editor, Profil-Auswahl, Kontext)
- **Run/[id]** — Live-View mit Polling, Auto-Redirect bei Fertigstellung
- **Run/[id]/Report** — Gewinner, Zusammenfassung, Sentiment-Bars, Alters-Engagement, Einwände, Vorschläge
- **Settings** — Konto-Info, Plan-Anzeige (Upgrade-Button deaktiviert)
- **Sidebar** — Navigation mit aktiven States, Logout

### 4. Simulation Core (`src/lib/simulation/`)
- **generatePersonas.ts** — Claude Haiku generiert Personas aus Zielgruppen-Beschreibung
- **runSimulation.ts** — Jede Persona reagiert auf jede Variante (batched, 5 parallel)
- **generateReport.ts** — Analyse-Report mit Gewinner, Einwände, Vorschläge, Alters-Segmente

### 5. API-Routen (`src/app/api/`)
- `POST /api/personas/generate` — Personas generieren + in DB speichern
- `POST /api/runs/create` — Kontingent prüfen, Run anlegen, Simulation + Report ausführen
- `GET /api/runs/[id]/status` — Run-Status abfragen

### 6. Datenbank (Supabase)
- **Migration ausgeführt** (`supabase/migrations/001_initial_schema.sql`)
- Tabellen: `profiles`, `persona_profiles`, `runs`, `reports`, `usage_events`
- RLS-Policies auf allen Tabellen
- Auto-Profil-Trigger bei neuer Registrierung
- Indizes auf `runs.user_id`, `runs.status`, `reports.run_id`, `persona_profiles.user_id`

### 7. Infrastruktur
- Next.js 14 + TypeScript + Tailwind
- Supabase (Auth + PostgreSQL + RLS)
- Anthropic Claude Haiku als LLM (Persona + Reaktionen + Report)
- GitHub `fabiancreation/simtest` → Vercel Auto-Deploy
- `.env.local` mit Supabase + Anthropic Keys

---

## Was NICHT funktioniert / fehlt

### Backend — Kritisch für ersten echten Test

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| B1 | **Supabase Auth konfigurieren** | ❌ Offen | Google OAuth Provider + Magic Link im Supabase Dashboard aktivieren. Redirect-URLs auf Vercel-Domain setzen. |
| B2 | **Run als Background-Job** | ❌ Offen | Aktuell läuft die Simulation synchron in der API-Route (kann >30s dauern → Vercel Timeout). Braucht async Processing. |
| B3 | **Supabase Realtime für Job-Status** | ❌ Offen | Aktuell Polling per GET. Besser: Supabase Realtime Subscription auf `runs.status`. |
| B4 | **Persona-Caching** | ❌ Offen | Gleiche Zielgruppen-Beschreibung → gleiche Personas. Cache per `(user_id + description_hash)`, TTL 30 Tage. |
| B5 | **Error Handling & Retry** | ❌ Offen | API-Calls an Claude können fehlschlagen. Retry-Logik mit Backoff fehlt. |
| B6 | **Rate Limiting** | ❌ Offen | Kein Schutz gegen API-Missbrauch. Braucht Rate Limiter pro User. |
| B7 | **Runs-Reset monatlich** | ❌ Offen | `runs_used` wird nie zurückgesetzt. Braucht Cron-Job oder Supabase Edge Function. |

### Backend — Phase 2

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| B8 | **Stripe Integration** | ❌ Offen | Subscriptions (Starter/Pro/Business), Webhooks, Plan-Upgrade/Downgrade |
| B9 | **Waitlist-Backend** | ❌ Offen | E-Mail-Adressen speichern (aktuell nur Frontend-State, geht beim Reload verloren) |
| B10 | **PDF-Export** | ❌ Offen | Report als PDF generieren und downloaden |
| B11 | **E-Mail-Notifications** | ❌ Offen | "Run fertig", "Kontingent niedrig" |

### Frontend — Verbesserungen

| # | Aufgabe | Status | Beschreibung |
|---|---------|--------|-------------|
| F1 | **Mobile Nav** | ❌ Offen | Hamburger-Menü für App-Sidebar auf Mobile |
| F2 | **Onboarding** | ❌ Offen | 3-Schritt-Tour für neue Nutzer |
| F3 | **Landing Page Copy** | 🔄 In Arbeit | Hero-Copy und Nav können noch verbessert werden |

---

## Empfohlene Reihenfolge für Backend

### Sofort (für ersten echten Test)

1. **B1: Supabase Auth konfigurieren** — Ohne Auth kein Login, ohne Login kein Test
2. **B9: Waitlist-Backend** — Einfache Tabelle `waitlist(email, created_at)`, Insert per API-Route
3. **B2: Background-Jobs** — Simulation async auslagern, damit Vercel nicht abbricht
   - Option A: Vercel Background Functions (Pro Plan, bis 5min)
   - Option B: Supabase Edge Functions
   - Option C: Upstash QStash (Webhook-basiert, kein eigener Server)

### Danach

4. **B3: Realtime Status** — Supabase Realtime statt Polling
5. **B4: Persona-Caching** — Hash auf Beschreibung, spart API-Kosten
6. **B5: Error Handling** — Retry-Logik für Claude API
7. **B6: Rate Limiting** — Upstash Redis oder Middleware-basiert
8. **B7: Monthly Reset** — Supabase Cron oder Vercel Cron

---

## Architektur-Entscheidungen

| Entscheidung | Gewählt | Grund |
|---|---|---|
| LLM | Claude Haiku 4.5 | API-Key vorhanden, günstig, schnell |
| DB | Supabase (shared) | Free Tier Limit, 2 Projekte belegt |
| Hosting | Vercel | Auto-Deploy, Edge Functions, kein Setup |
| Job Queue | Noch offen | Vercel BG Functions vs. QStash vs. Edge Functions |
| Payments | Stripe (geplant) | Standard für SaaS |

---

## Dateien die ungenutzt sind (Cleanup)

- `src/lib/openai/client.ts` — War für GPT-4o-mini, jetzt Claude
- `src/lib/gemini/client.ts` — War für Gemini Flash, jetzt Claude
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` — Next.js Boilerplate

---

*Letzte Aktualisierung: 8. April 2026*
