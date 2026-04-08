# SimTest

## Typ
SaaS-Produkt -- KI-gestützte Marktforschungs-Simulation mit Persona-Agenten

## Status
Phase 1 -- Next.js initialisiert, Grundstruktur wird aufgebaut

## Stack
- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Auth + PostgreSQL + Realtime)
- Stripe (Subscriptions + Metered Billing)
- OpenAI GPT-4o-mini (Persona-Generierung)
- Google Gemini 1.5 Flash (Agenten-Reaktionen)
- Upstash Redis + BullMQ (Job Queue)
- Vercel (Deployment)

## Konzept
Nutzer beschreiben eine Zielgruppe, SimTest generiert KI-Personas und lässt diese
als Agenten auf Stimuli (Werbetexte, Produkte, Strategien) reagieren.
Ergebnis: Report mit Gewinner, Segment-Analyse, Verbesserungsvorschlaege.

### Vier Ebenen
1. Copy Testing (Varianten-Vergleich)
2. Produkt-Validierung (Kauf-/Ablehnungssimulation)
3. Business-Strategie (Marktpotenzial, Widerstaende)
4. Kontext-Layer (News, Wirtschaftsindikatoren)

## Pricing
- Free: 3 Runs/Monat
- Starter: 12 EUR/Mo (15 Runs)
- Pro: 34 EUR/Mo (50 Runs)
- Business: 89 EUR/Mo (200 Runs)

## Output-Pfad
`/Users/fabianarndt/Projekte/Claude/SaaS/simtest/Output/`

## Referenz-Dokumente
- `docs/simtest-umsetzungsplan.md` -- Technischer Umsetzungsplan (3 Phasen)
- `docs/simtest-konzept.docx` -- Produktkonzept
- `docs/simtest-expanded.jsx` -- Landing-Page-Prototyp (React)

## Aktive Skills
- ui-ux-pro-max (fuer UI/UX-Arbeit)
- frontend-design (fuer Landing Page und Dashboard)
