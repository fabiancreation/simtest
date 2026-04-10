# Plan: Englisch als zweite Sprache (i18n)

## Context

SimTest hat aktuell ~1100-1350 hardcoded deutsche Strings verteilt ueber Frontend, API-Routes, Edge Functions und Persona-Presets. Fuer internationale Nutzer muss Englisch als zweite Sprache eingefuehrt werden. Die groesste Herausforderung sind nicht die UI-Labels, sondern die sprachspezifischen LLM-Prompts und kulturell gebundenen Persona-Daten (deutsche Namen, Staedte, Berufe).

## Zeitpunkt der Einfuehrung

**Nach Abschluss aller Kernfunktionen und positivem E2E-Test aller SimTypes.**

Begruendung: Jedes neue Feature erzeugt neue Strings. Wenn wir i18n jetzt einfuehren, muss jede kuenftige Aenderung in zwei Sprachen gepflegt werden. Das verdoppelt den Aufwand fuer Features die sich noch aendern koennten. Sinnvoller Zeitpunkt: wenn das Feature-Set stabil ist (nach Phase 2 TODOs).

**Vorbereitung jetzt**: Die i18n-Architektur dokumentieren und bei neuen Features bereits String-Keys statt Hardcoded-Strings verwenden (optional, nur wenn Aufwand minimal).

---

## Architektur: next-intl (empfohlen)

`next-intl` ist der Standard fuer Next.js App Router i18n. Alternativen (i18next, react-intl) haben schlechtere App-Router-Integration.

### URL-Strategie

`/de/dashboard`, `/en/dashboard` via Next.js Middleware + `[locale]` Layout-Segment. Default-Locale: `de`. Fallback: `de`.

### Dateistruktur

```
src/
  messages/
    de.json          — Deutsche UI-Strings (~500 Keys)
    en.json          — Englische UI-Strings
  app/
    [locale]/         — Locale-Segment wrapping (app) + (auth)
      (app)/
        layout.tsx    — NextIntlClientProvider
        dashboard/
        ...
      (auth)/
        login/
```

### Edge Function (Supabase)

Die Edge Function laeuft ausserhalb von Next.js — kein next-intl moeglich. Loesung:

```
supabase/functions/run-simulation/
  prompts/
    de.ts            — Deutsche Prompts, Framing, JSON-Format
    en.ts            — Englische Prompts
  presets/
    de.ts            — Deutsche Namen, Staedte, Berufe, Preset-Texte
    en.ts            — Englische/internationale Namen, Staedte, Berufe
```

Die Simulation bekommt ein `locale`-Feld (aus User-Settings oder Browser-Locale), das in `input_data` gespeichert und an die Edge Function durchgereicht wird.

---

## Aufwandsschaetzung

### Schicht 1: Frontend UI-Strings (~500 Keys)
| Bereich | Strings | Aufwand |
|---------|---------|--------|
| Landing Page (page.jsx) | ~130 | 2-3h |
| Simulation New (new/page.tsx) | ~85 | 2h |
| Simulation Detail ([id]/page.tsx) | ~45 | 1h |
| Personas (new, generate, list, edit) | ~120 | 2h |
| Projekte (list, new, detail) | ~60 | 1h |
| Dashboard | ~25 | 30min |
| Reports | ~20 | 30min |
| Login | ~25 | 30min |
| Sidebar + Komponenten | ~15 | 15min |
| **Summe UI** | **~525** | **~10h** |

### Schicht 2: API-Routes (~45 Strings)
| Bereich | Strings | Aufwand |
|---------|---------|--------|
| Fehlermeldungen (alle Routes) | ~45 | 1h |

### Schicht 3: Types/Config (simulation.ts)
| Bereich | Strings | Aufwand |
|---------|---------|--------|
| SIM_TYPES Labels, Descs, Hints | ~50 | 1h |
| PERSONA_PRESETS Labels | ~15 | 15min |
| AGENT_COUNT_HINTS | ~7 | 15min |
| **Summe Config** | **~72** | **~1.5h** |

### Schicht 4: Edge Function Prompts (~250 Strings)
| Bereich | Strings | Aufwand |
|---------|---------|--------|
| System-Prompts (Agenten) | ~80 | 3h |
| SimType-Framing (8 Typen) | ~50 | 2h |
| Synthese-Prompts | ~30 | 1h |
| JSON-Response-Format | ~10 | 30min |
| Report-Labels (report.ts) | ~30 | 1h |
| **Summe Prompts** | **~200** | **~7.5h** |

### Schicht 5: Persona-Presets (~300+ Strings) — GROESSTER BLOCK
| Bereich | Strings | Aufwand |
|---------|---------|--------|
| Namen (m/w) — englische/internationale Sets | ~50 | 1h |
| Staedte — US/UK/internationale Sets | ~50 | 1h |
| Berufe — englische Aequivalente | ~75 | 1.5h |
| Preset-Beschreibungen + Subtypes | ~80 | 2h |
| Personality-Texte (Big Five Varianten) | ~30 | 1h |
| **Summe Presets** | **~285** | **~6.5h** |

### Schicht 6: Infrastruktur
| Aufgabe | Aufwand |
|---------|--------|
| next-intl Setup + Middleware + Layout | 1.5h |
| Locale-Switcher UI (Header/Footer) | 30min |
| User-Locale in DB (profiles) + Settings-Page | 1h |
| locale-Feld in Simulations-Flow durchreichen | 30min |
| Edge Function Locale-Routing | 1h |
| Migration (locale-Spalte auf profiles) | 15min |
| **Summe Infra** | **~4.75h** |

### Schicht 7: QA + Review
| Aufgabe | Aufwand |
|---------|--------|
| Alle Seiten auf EN durchklicken | 2h |
| Prompt-Qualitaet pruefen (EN-Simulationen laufen lassen) | 2h |
| Edge Cases (Plural, dynamische Texte, Fehler) | 1h |
| **Summe QA** | **~5h** |

---

## Gesamtaufwand

| Phase | Aufwand |
|-------|--------|
| Infrastruktur (next-intl, Routing, DB) | ~5h |
| UI-Strings extrahieren + uebersetzen | ~10h |
| API + Config Strings | ~2.5h |
| Edge Function Prompts | ~7.5h |
| Persona-Presets (EN-Versionen) | ~6.5h |
| QA + Review | ~5h |
| **GESAMT** | **~36.5h** |

Realistisch mit Puffer (unvorhergesehene Edge Cases, Prompt-Tuning): **~40-45h**

Ueber mehrere Sessions verteilt: **4-6 Sessions a 8h** oder **8-10 Sessions a 4h**.

---

## Umsetzungsreihenfolge (wenn es soweit ist)

1. **Infrastruktur** — next-intl, Middleware, Layout, Locale-Switcher, DB-Feld
2. **Config/Types** — simulation.ts Strings in Locale-Files
3. **Einfache Seiten** — Dashboard, Reports, Projekte, Sidebar
4. **Komplexe Seiten** — Simulation New, Personas, Login
5. **Landing Page** — Marketing-Copy (ggf. manuell optimiert, nicht 1:1 uebersetzt)
6. **API-Routes** — Fehlermeldungen
7. **Edge Function Prompts** — Agenten, Framing, Synthese
8. **Persona-Presets** — Englische/internationale Sets
9. **QA** — Alle Flows auf EN testen, Simulationen laufen lassen

---

## Besondere Herausforderungen

1. **LLM-Prompts sind nicht 1:1 uebersetzbar** — Die deutschen Prompts sind kulturell optimiert. Englische Prompts muessen separat getunt werden, nicht nur uebersetzt.

2. **Persona-Daten sind kulturgebunden** — Deutsche Namen/Staedte/Berufe funktionieren nicht fuer EN. Braucht eigene Sets (US? UK? International?). Entscheidung: ein "International English" Set oder regionale Varianten?

3. **Landing Page ist Marketing-Copy** — Sollte nicht woertlich uebersetzt, sondern fuer den EN-Markt neu getextet werden.

4. **Agenten muessen auf EN antworten** — Aktuell steht im Prompt "Du antwortest IMMER auf Deutsch". Das muss locale-abhaengig sein.

5. **Bestehende Simulationen** — Reports die auf DE erstellt wurden, bleiben DE. Nur neue Simulationen nutzen die gewaehlte Sprache.

---

## Empfehlung

**Jetzt**: Diesen Plan als Referenz behalten. Keine i18n-Infrastruktur einbauen.

**Spaeter** (nach Feature-Freeze): In der Reihenfolge oben umsetzen. Aufwand ~40-45h ueber 4-6 Sessions.

**Vorbereitung die nichts kostet**: Bei neuen Features darauf achten, keine langen deutschen Strings inline zu hardcoden, sondern in Constants auszulagern (wie bereits bei TYPE_LABELS, STATUS_CONFIG etc. gemacht). Das erleichtert die spaetere Extraktion.
