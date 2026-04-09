# Strategy SimType — Redesign-Konzept

> Stand: 9. April 2026
> Status: Konzept, nicht implementiert

---

## Das Problem

Der Strategy-SimType funktioniert aktuell wie alle anderen SimTypes: Nutzer gibt Input, Agenten sehen den Content, reagieren, Synthese fasst zusammen. Aber "Business-Strategie validieren" ist fundamental anders als "Text bewerten":

1. **Agenten sehen den Businessplan** — inklusive Funnel-Mechanik, Pricing-Strategie, Follower-Zahlen. Ein echter Konsument sieht das nie. Ergebnis: BWL-Studenten bewerten den Funnel als "aggressiv" statt auf das Freebie zu reagieren.

2. **Einstufige Simulation reicht nicht** — Ein Funnel hat mehrere Touchpoints (Ad → Freebie → Email → Kauf → Upsell). Jede Stufe hat eine andere Conversion-Rate. Eine einzelne "wie findest du das?"-Frage kann das nicht abbilden.

3. **Prompt-Fixes reichen nicht** — Egal wie oft man "du bist kein Marketing-Experte" sagt, wenn der Content "Email-Sequenz verkauft das Hauptbuch" enthält, reagieren LLM-Agenten darauf.

---

## Lösungsansatz: Multi-Step Funnel-Simulation

### Architektur

```
NUTZER-INPUT
├── Business-Kontext (nur für Synthese)
│   ├── Zielmarkt, Wettbewerber, Pricing
│   ├── Bestehende Ressourcen (Follower, Budget, Backlist)
│   └── Fokus-Frage
│
├── Funnel-Steps (Nutzer definiert oder System leitet ab)
│   ├── Step 1: Ad/Organic Post → "Würdest du klicken?"
│   ├── Step 2: Landing Page / Freebie → "Würdest du downloaden?"
│   ├── Step 3: Freebie-Bewertung → "Wie fandest du den Inhalt?"
│   ├── Step 4: Email-Sequenz → "Würdest du kaufen?"
│   └── Step 5: Upsell → "Würdest du das Bundle nehmen?"
│
└── Materialien pro Step (optional)
    ├── Ad-Text oder Screenshot
    ├── Landing Page URL
    ├── Freebie-PDF oder Zusammenfassung
    └── Email-Text
```

### Simulations-Loop

```
Step 1: Alle N Agenten sehen die Ad
  → Ergebnis: 60% würden klicken (z.B. 30 von 50)

Step 2: NUR die 30 "Klicker" sehen die Landing Page
  → Ergebnis: 50% würden Freebie downloaden (15 von 30)

Step 3: NUR die 15 "Downloader" bewerten das Freebie
  → Ergebnis: 70% fanden es gut (10 von 15)

Step 4: NUR die 10 "Zufriedenen" bekommen die Kauf-Email
  → Ergebnis: 30% würden kaufen (3 von 10)

Step 5: NUR die 3 "Käufer" sehen das Bundle-Angebot
  → Ergebnis: 33% upgraden (1 von 3)

FUNNEL-REPORT:
  50 Impressions → 30 Klicks → 15 Downloads → 3 Käufe → 1 Bundle
  Conversion: 6% (Ad → Kauf), 2% (Ad → Bundle)
  Engpass: Step 4 (Freebie→Kauf), nur 30% Conversion
```

### Bias-Problem und Lösung

**Das Problem:** Wenn wir bei Step 3 sagen "Du hast das Freebie gelesen und fandest es gut", setzen wir ein positives Ergebnis voraus. Jeder Funnel würde positiv bewertet.

**Lösung 1 — Ergebnis-basierte Weiterleitung:**
- Step 2 fragt: "Würdest du das Freebie downloaden?" + "Warum/warum nicht?"
- Nur Agenten mit `would_download: true` gehen weiter zu Step 3
- Step 3 bekommt KEIN vorgegebenes Urteil, sondern echten Freebie-Content
- Problem: Freebie-Content muss vorhanden sein (PDF, Zusammenfassung)

**Lösung 2 — Probabilistisches Modell:**
- Jeder Step hat eine Frage + Antwort (ja/nein + Begründung)
- Weiterleitung basiert auf der Antwort, nicht auf Voraussetzung
- Kein Content nötig für spätere Steps — Agent bekommt stattdessen: "Stell dir vor, du hast ein kostenloses PDF über Thailand-Kultur-Fehler erhalten. Der Inhalt war [gut/mittelmäßig/schlecht — basierend auf Agent-Profil und Thema]. Jetzt bekommst du eine Email..."
- Problem: "basierend auf Agent-Profil" ist ein Urteil des Systems, nicht des Agenten

**Lösung 3 — Hybridmodell (empfohlen):**
- Steps mit verfügbarem Content: Agenten sehen echten Content und bewerten
- Steps ohne Content: System beschreibt die Situation neutral ("Du hast ein kostenloses PDF heruntergeladen. Du hast es durchgelesen.") und fragt nach Kaufbereitschaft
- Weiterleitung ist IMMER ergebnis-basiert (nur positive Agenten gehen weiter)
- Der Funnel-Report zeigt ehrlich: "Step 3 basiert auf simuliertem Freebie-Erlebnis, nicht auf echtem Content"

---

## Offene Fragen

### 1. Braucht jeder Step eigenen Content?
- Ideal: Ja (Ad-Text, Landing Page URL, Freebie-PDF, Email-Text)
- Minimal: Nur Step 1 (Ad/Angebot), Rest wird simuliert
- Nutzer könnte Steps aktivieren/deaktivieren und Material hochladen wo vorhanden

### 2. Wie viele Steps sind sinnvoll?
- Minimum: 2 (Awareness → Conversion)
- Standard: 3-4 (Ad → Freebie → Email → Kauf)
- Maximum: 5-6 (Ad → Click → Download → Consume → Email → Buy → Upsell)
- Mehr Steps = mehr Agenten-Calls = höhere Kosten

### 3. Was passiert bei sehr wenigen Agenten pro Step?
- Bei 5 Agenten und 50% Conversion pro Step bleiben nach Step 3 nur 1-2 übrig
- Lösung: Minimum 50 Agenten für Strategy empfehlen, oder Pool-Recycling

### 4. Wie wird der Report dargestellt?
- Funnel-Visualisierung (Trichter) mit Conversion pro Step
- Pro Step: Engagement, Einwände, Kommentare
- Gesamt: Engpass-Analyse ("Der größte Drop ist zwischen Freebie und Kauf")
- Vergleich mit Branchen-Benchmarks? (z.B. typische Freebie→Kauf-Rate)

### 5. Kosten pro Simulation
- 5 Steps × 50 Agenten = 250 LLM-Calls (mit Gemini Flash: ~$0.01)
- 5 Steps × 200 Agenten = 1000 LLM-Calls (~$0.05)
- Vertretbar, aber Edge Function Timeout (150s) könnte eng werden
- Lösung: Steps sequentiell, Agenten parallel pro Step

### 6. Abgrenzung zu anderen SimTypes
- **Produkt-Check:** "Würdest du das kaufen?" — ein Touchpoint
- **Landing Page:** "Wie findest du die Seite?" — ein Touchpoint
- **Campaign:** "Wie reagierst du auf die Kampagne?" — Multi-Kanal, aber ein Moment
- **Strategy:** Multi-Step-Funnel mit bedingter Weiterleitung — mehrere Momente in zeitlicher Abfolge

---

## Implementierungs-Phasen

### Phase 1: Minimal Viable Strategy (kurzfristig)
- Strategy funktioniert weiterhin einstufig
- Agenten sehen NUR die kundengerichtete Beschreibung (aktuell implementiert)
- Synthese bekommt vollen Business-Kontext (aktuell implementiert)
- Frontend-Hinweis: "Für mehrstufige Funnel-Tests nutze mehrere separate Simulationen"

### Phase 2: Multi-Step Framework (mittelfristig)
- Neues Datenmodell: `simulation_steps` Tabelle
- Nutzer definiert Steps mit optionalem Content pro Step
- Simulations-Loop verarbeitet Steps sequentiell
- Ergebnis-basierte Weiterleitung (nur positive Agenten gehen weiter)
- Funnel-Report mit Conversion pro Step

### Phase 3: Intelligente Step-Generierung (langfristig)
- System analysiert die strategy_idea und schlägt Steps vor
- "Ich sehe einen Freebie-Funnel mit Email-Sequenz. Soll ich diese 4 Steps simulieren?"
- Branchen-Benchmarks für Conversion-Vergleiche
- Content-Upload pro Step (PDF, URL, Email-Text)

---

## Aktueller Workaround

Bis Phase 2 implementiert ist, kann der Nutzer mehrstufige Funnels testen durch:

1. **Copy Test:** Ad-Text testen (Variante A vs B)
2. **Landing Page Test:** Freebie-Landing-Page URL testen
3. **Produkt-Check:** Buchkauf-Angebot testen (nach Freebie-Download-Kontext)
4. **Pricing Test:** Einzelbuch vs Bundle Preispunkte vergleichen

Jede Simulation einzeln, aber mit Context-Feldern die den Funnel-Schritt beschreiben ("Der Nutzer hat bereits das Freebie heruntergeladen und gelesen").

---

*Dieses Dokument basiert auf Erkenntnissen aus 4 Strategy-Testrunden am 9. April 2026.*
