# SimTest — Umsetzungsplan

> Technisches Briefing für Claude Code  
> Version 1.0 · April 2026  
> Stack: Next.js 14 · Supabase · Vercel · Stripe · OpenAI · Gemini

---

## Übersicht: Drei Phasen

| Phase | Zeitraum | Ziel | Output |
|-------|----------|------|--------|
| **Phase 1 — MVP** | Woche 1–6 | Lauffähige Simulation Ebene 1+2 | Beta-Launch für FA-Nutzer |
| **Phase 2 — Launch** | Woche 7–12 | Ebene 3, Pricing live, Public Launch | Zahlende Nutzer |
| **Phase 3 — Scale** | Woche 13–24 | Ebene 4, API, Team-Features | Business-Tier-Ausbau |

---

## Phase 1 — MVP (Woche 1–6)

### Woche 1–2: Fundament

**Ziel:** Projekt-Setup, Auth, Datenbank-Schema

```
AUFGABEN:
- Next.js 14 (App Router) + TypeScript initialisieren
- Supabase-Projekt aufsetzen (Auth + PostgreSQL)
- Datenbankschema anlegen (siehe unten)
- Magic Link + Google OAuth konfigurieren
- Vercel-Deployment einrichten (Preview + Production)
- Umgebungsvariablen strukturieren (.env.local Template)
```

**Datenbank-Schema:**

```sql
-- Users (von Supabase Auth übernommen)
profiles (id, email, plan, runs_used, runs_limit, created_at)

-- Zielgruppen-Profile (wiederverwendbar)
persona_profiles (
  id, user_id, name, description,
  demographics, psychographics, context,
  agent_count_default, created_at
)

-- Simulations-Runs
runs (
  id, user_id, persona_profile_id,
  stimulus_type,       -- 'copy' | 'product' | 'strategy'
  stimulus_variants,   -- JSON array, max 5
  agent_count,
  context_layer,       -- optional JSON
  status,              -- 'queued' | 'running' | 'done' | 'failed'
  created_at, completed_at
)

-- Reports
reports (
  id, run_id, user_id,
  winner_index,
  summary,             -- Freitext-Zusammenfassung
  segment_breakdown,   -- JSON
  improvement_suggestions, -- JSON array
  raw_reactions,       -- JSON (gecacht für Nachfragen)
  created_at
)

-- Usage Tracking (für Pay-per-Use)
usage_events (id, user_id, run_id, extra_runs, billed_amount, created_at)
```

---

### Woche 3–4: Simulation Core

**Ziel:** Persona-Generierung + Simulations-Engine

```
AUFGABEN:
- Zielgruppen-Builder UI (Freitext-Input + strukturierter Fragebogen)
- Persona-Generierung: OpenAI GPT-4o-mini API
- Simulations-Job-Queue: Upstash Redis + BullMQ
- Agenten-Reaktionen: Gemini 1.5 Flash (Bulk)
- Hierarchisches Report-Summarizing (Cluster → Final)
- Job-Status-Polling im Frontend (SSE oder Supabase Realtime)
```

**Persona-Generierungs-Prompt (Vorlage):**

```
System: Du generierst KI-Personas für Marktforschungs-Simulationen.
Antworte NUR als JSON-Array. Keine Erklärungen.

User: Generiere {count} realistische deutsche Personas für folgende Zielgruppe:
{user_description}

Jede Persona als JSON:
{
  "name": "Vorname Nachname",
  "age": Zahl,
  "occupation": "Beruf",
  "location": "Stadt, Bundesland",
  "personality": "2-3 Sätze",
  "values": ["Wert1", "Wert2", "Wert3"],
  "pain_points": ["Problem1", "Problem2"],
  "buy_triggers": ["Auslöser1", "Auslöser2"],
  "objections": ["Einwand1", "Einwand2"],
  "media_consumption": "1 Satz"
}
```

**Agenten-Reaktions-Prompt (Vorlage):**

```
System: Du bist {name}, {age} Jahre alt, {occupation} aus {location}.
Persönlichkeit: {personality}
Deine Werte: {values}
Deine größten Probleme: {pain_points}
Du kaufst wenn: {buy_triggers}
Deine typischen Einwände: {objections}

Antworte immer in der ersten Person, authentisch für deine Persona.

User: [KONTEXT: {context_layer}]

Du siehst folgendes: {stimulus}

Reagiere ehrlich. Was denkst du? Was fühlst du? 
Würdest du mehr erfahren wollen? Warum / warum nicht?
Max. 3 Sätze.
```

---

### Woche 5–6: UI + Report + Stripe

**Ziel:** Vollständiger User-Flow, Payments, Beta-bereit

```
AUFGABEN:
- Dashboard (Runs-Übersicht, Persona-Profile, Kontingent-Anzeige)
- Stimulus-Input UI (Copy-Varianten, Typ-Auswahl, Agenten-Slider)
- Live-Simulation-View (animierte Agenten-Aktivität während Run)
- Report-UI (Gewinner, Segmente, Verbesserungsvorschläge)
- Stripe Integration: Free / Starter €12 / Pro €34 / Business €89
- Pay-per-Use Extra-Runs via Stripe Metered Billing
- Waitlist → Beta-Einladungs-Flow
- Onboarding (3-Schritt-Tour für neue Nutzer)
```

**Stripe Produkt-Setup:**

```
Produkte:
- simtest_starter: €12/Mo recurring
- simtest_pro: €34/Mo recurring  
- simtest_business: €89/Mo recurring
- simtest_extra_run: Metered (€0,90 / €0,65 / €0,45 je nach Plan)

Jahres-Varianten (je -17%):
- simtest_starter_annual: €119/Jahr
- simtest_pro_annual: €340/Jahr
- simtest_business_annual: €890/Jahr
```

---

## Phase 2 — Launch (Woche 7–12)

### Woche 7–8: Ebene 3 (Business-Strategie)

```
AUFGABEN:
- Strategie-Stimulus-Typ implementieren
  → Längere Inputs erlauben (bis 2.000 Wörter)
  → Agenten mit "strategischer Brille" befragen
  → Report: Marktpotenzial, Widerstände, Empfehlungen
- Landing Page Testing als Sub-Feature
  → Abschnittsweise Befragung ("Wo hörst du auf zu lesen?")
  → Section-by-Section-Report
- Persona-Profil-Verfeinerung (Nutzer kann Personas editieren)
```

### Woche 9–10: Quality & Analytics

```
AUFGABEN:
- Report-Qualität verbessern (Prompt-Tuning auf realen Beta-Daten)
- Segment-Vergleiche visuell aufbereiten (Charts im Report)
- Simulations-History + Report-Archiv
- Export: PDF-Report + CSV-Rohdaten
- E-Mail-Notifications (Run fertig, Kontingent niedrig)
```

### Woche 11–12: Public Launch

```
AUFGABEN:
- Public Beta → Public Launch
- SEO-Grundstruktur (Next.js Metadata API)
- Blog / Use-Case-Seiten (Copy Testing, Produkt-Validierung, etc.)
- Referral-System (Bonus-Runs für Einladungen)
- NPS-Survey nach erstem Run
- Analytics: PostHog oder Mixpanel
```

---

## Phase 3 — Scale (Woche 13–24)

### Woche 13–16: Ebene 4 (Kontext-Layer)

```
AUFGABEN:
- Manueller Kontext-Input (Freitext-Szenario)
- Automatischer News-Feed: Tavily / Perplexity API
- Strukturierte Indikatoren:
  → Ifo Geschäftsklima (kostenlose Monatsdaten)
  → GfK Konsumklima
  → Google Trends API
  → VIX/VSTOXX (Yahoo Finance API)
- LLM-Übersetzung: Indikatoren → natürlichsprachlicher Agenten-Kontext
- UX: Kontext-Panel (zuschaltbar, nicht Standard)
```

### Woche 17–20: API + Team-Features

```
AUFGABEN:
- Public API (REST): Runs starten, Status abfragen, Reports abrufen
- API-Schlüssel-Management im Dashboard
- Team-Workspace: Mehrere Nutzer, geteilte Persona-Profile
- Rollen: Owner / Editor / Viewer
- Shared Report-Links (öffentlich oder passwortgeschützt)
```

### Woche 21–24: Eigene Simulation Engine (optional)

```
ENTSCHEIDUNG AUSSTEHEND: OASIS direkt hosten vs. weiterhin API-Wrapper
Trigger für Eigenentwicklung: >500 tägliche Runs ODER API-Kosten >€2.000/Mo

AUFGABEN (falls Ja):
- OASIS-Fork für DACH-Fokus
- Deutsche Basis-Personas aus öffentlichen Datensätzen
- Eigenes Hosting (Hetzner GPU-Server)
- Signifikante Kostenreduktion (~60%) bei hohem Volumen
```

---

## Datei-Struktur (Next.js)

```
simtest/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── callback/route.ts
│   ├── (app)/
│   │   ├── dashboard/page.tsx
│   │   ├── run/
│   │   │   ├── new/page.tsx          # Stimulus-Input
│   │   │   ├── [id]/page.tsx         # Live-View
│   │   │   └── [id]/report/page.tsx  # Report
│   │   ├── personas/page.tsx
│   │   └── settings/page.tsx
│   ├── api/
│   │   ├── runs/
│   │   │   ├── create/route.ts
│   │   │   └── [id]/status/route.ts
│   │   ├── personas/generate/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   └── simulate/worker.ts        # BullMQ Worker
│   └── page.tsx                      # Landing Page
├── components/
│   ├── simulation/
│   │   ├── AgentCanvas.tsx
│   │   ├── PersonaBuilder.tsx
│   │   ├── StimulusInput.tsx
│   │   └── ReportView.tsx
│   └── ui/
├── lib/
│   ├── supabase/
│   ├── openai/
│   ├── gemini/
│   ├── stripe/
│   └── simulation/
│       ├── generatePersonas.ts
│       ├── runSimulation.ts
│       └── generateReport.ts
└── types/
    └── simulation.ts
```

---

## Umgebungsvariablen (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Google Gemini
GOOGLE_GENERATIVE_AI_API_KEY=

# Upstash Redis (Queue)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=
STRIPE_PRICE_PRO_MONTHLY=
STRIPE_PRICE_BUSINESS_MONTHLY=
STRIPE_PRICE_STARTER_ANNUAL=
STRIPE_PRICE_PRO_ANNUAL=
STRIPE_PRICE_BUSINESS_ANNUAL=

# App
NEXT_PUBLIC_APP_URL=https://simtest.io
```

---

## Offene Entscheidungen für Claude Code

1. **OASIS direkt integrieren oder API-Wrapper?**  
   → Empfehlung für MVP: reiner LLM-Wrapper (kein OASIS), OASIS ab V2

2. **Supabase Realtime für Job-Status oder SSE selbst bauen?**  
   → Empfehlung: Supabase Realtime (einfacher, kein eigener WebSocket)

3. **BullMQ Worker: Vercel Serverless oder eigener Server?**  
   → Empfehlung: Vercel mit max. 5min Timeout für kleine Jobs, eigener Worker für 500+ Agenten

4. **Persona-Generierung: Immer neu oder aggressiv cachen?**  
   → Empfehlung: Cachen per (user_id + description_hash), TTL 30 Tage

---

*Letzte Aktualisierung: April 2026 — Fabian*
