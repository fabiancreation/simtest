# SimTest — Konzept: Seite "Neue Simulation"

> **Zweck dieses Dokuments:** Implementierungs-Spezifikation für Claude Code.
> **Tech-Stack:** Next.js (App Router) · Supabase · Tailwind CSS · Vercel
> **Seite:** `/app/simulation/new/page.tsx`
> **Sprache im UI:** Deutsch

---

## 1. Überblick

Die Seite "Neue Simulation" ist die zentrale Eingabemaske von SimTest. Der Nutzer konfiguriert hier seinen Test und startet die Simulation. Die Seite muss **dynamisch** sein: Je nach gewähltem Simulationstyp ändern sich die Eingabefelder komplett.

### Kernprinzip
Jeder Simulationstyp braucht fundamental andere Inputs. Copy Testing braucht Textvarianten, ein Pricing Test braucht Preispunkte, ein Ad Creative Test braucht Bild-Uploads. Die Seite darf NICHT statisch alle Felder zeigen, sondern muss sich an den gewählten Typ anpassen.

### User-Flow
1. Nutzer wählt Simulationstyp
2. Felder passen sich dynamisch an
3. Nutzer wählt/erstellt Zielgruppe (Persona)
4. Nutzer füllt typ-spezifische Felder aus
5. Optional: Fokus-Frage, Kontext, erweiterte Einstellungen
6. Nutzer sieht Kosten-Vorschau → klickt "Simulation starten"
