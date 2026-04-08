import { getAnthropic } from "@/lib/anthropic/client";
import type { Persona } from "@/types/simulation";

const SYSTEM_PROMPT = `Du generierst KI-Personas für Marktforschungs-Simulationen.
Antworte NUR als JSON-Array. Keine Erklärungen, kein Markdown, kein umschließender Text.
Beginne direkt mit [ und ende mit ].`;

function buildUserPrompt(description: string, count: number): string {
  return `Generiere ${count} realistische deutsche Personas für folgende Zielgruppe:
${description}

Jede Persona als JSON-Objekt mit exakt diesen Feldern:
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
}`;
}

export async function generatePersonas(
  description: string,
  count: number
): Promise<Persona[]> {
  const anthropic = getAnthropic();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      { role: "user", content: buildUserPrompt(description, count) },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Keine Text-Antwort erhalten");

  const text = content.text.trim();

  // JSON-Array extrahieren (falls Haiku doch Text drumherum schreibt)
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("Kein JSON-Array in der Antwort gefunden");

  const personas: Persona[] = JSON.parse(arrayMatch[0]);

  if (!Array.isArray(personas) || personas.length === 0) {
    throw new Error("Persona-Generierung fehlgeschlagen: leeres Ergebnis");
  }

  return personas;
}
