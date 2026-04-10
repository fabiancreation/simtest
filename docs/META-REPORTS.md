# Meta-Reports — Konzept

> Status: Geplant (Phase 2)
> Entstanden: 10. April 2026, Brainstorming-Session

## Problem

User testet dieselbe Landing Page an 3 verschiedenen Zielgruppen (1x Preset, 2x eigene).
Ergebnis: 3 einzelne Reports mit jeweils eigener Synthese — aber keine Gesamtaussage.

## Lösung: "Erkenntnisse zusammenführen"

User wählt 2–5 bestehende Reports aus → klickt "Zusammenführen" → ein Synthese-Call
bekommt die bestehenden Synthesen + Key-Metriken als Input → Meta-Report.

### Umsetzung

1. **Eingebettet in Projekt-Detailseite**: Liste aller Simulationen mit Checkboxen
2. **Button "Ausgewählte zusammenführen"** → Meta-Synthese-Call
3. **Ergebnis als eigener Report** gespeichert (Typ: `meta` oder `comparison`)

### Warum dieser Ansatz

- **Input sind bestehende Synthesen**, nicht 500 Einzelreaktionen → kompakt, günstig (1 normaler Haiku-Call)
- **Kein neues Datenmodell** nötig — nur ein neuer SimType oder Endpunkt
- **Funktioniert sofort** innerhalb der Projekt-Struktur
- **User kontrolliert die Auswahl** — kein automatisches Zusammenwürfeln unpassender SimTypes

### Bewusst verworfen

- **Automatische Projekt-Synthese** (bei jeder neuen Simulation): Teuer, fehleranfällig, schwer rückgängig
- **Cross-Report über alle SimTypes**: Unterschiedliche Metriken/Fragestellungen → verwirrt mehr als es hilft
- **Produkte als eigene Entität**: Scope Creep, Datenmodell-Komplexität. Stattdessen: Kontext-Snippets auf Projektebene

### Voraussetzung

- Projekte (P1) müssen gebaut sein
- Sinnvoll erst wenn User mehrere Simulationen pro Projekt haben
