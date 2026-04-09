import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic } from "@/lib/anthropic/client";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { url, description } = await request.json();
  if (!url && !description) {
    return NextResponse.json({ error: "URL oder Beschreibung ist Pflicht" }, { status: 400 });
  }

  // Optional: URL crawlen
  let pageContent = "";
  if (url) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; SimTestBot/1.0)", "Accept": "text/html" },
      });
      clearTimeout(timeout);
      if (res.ok) {
        const html = await res.text();
        pageContent = html
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          .replace(/<head[\s\S]*?<\/head>/gi, "")
          .replace(/<nav[\s\S]*?<\/nav>/gi, "")
          .replace(/<footer[\s\S]*?<\/footer>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 3000);

        // Title extrahieren
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        if (titleMatch) pageContent = `TITEL: ${titleMatch[1].trim()}\n\n${pageContent}`;
      }
    } catch { /* URL nicht erreichbar — weiter mit Beschreibung */ }
  }

  const productInfo = [
    description ? `PRODUKTBESCHREIBUNG:\n${description}` : "",
    pageContent ? `WEBSITE-INHALT:\n${pageContent}` : "",
  ].filter(Boolean).join("\n\n---\n\n");

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: `Du bist ein Zielgruppen-Analyst. Analysiere ein Produkt/Angebot und schlage 2-3 konkrete Zielgruppen-Segmente vor. Jedes Segment soll eine echte, kaufbereite Personengruppe beschreiben. Deutsch. NUR JSON, kein Markdown.`,
      messages: [{
        role: "user",
        content: `Analysiere dieses Produkt/Angebot und schlage 2-3 Zielgruppen-Segmente vor:

${productInfo}

Antworte als JSON-Array. Jedes Segment:
{
  "name": "Kurzer, einprägsamer Segmentname (z.B. 'Der frustrierte Expat')",
  "description": "2-3 Sätze: Wer ist diese Person? Was ist ihre Situation? Warum ist sie die richtige Zielgruppe?",
  "age_min": Zahl,
  "age_max": Zahl,
  "gender_male": Prozent (0-100),
  "gender_female": Prozent (0-100),
  "gender_diverse": Prozent (0-100),
  "regions": ["deutschland", "oesterreich", "schweiz"] oder andere relevante Regionen,
  "urban_rural": "urban" oder "urban_leaning" oder "mixed" oder "rural_leaning" oder "rural",
  "education": ["abitur", "bachelor", "master"] etc.,
  "income_min": monatliches Netto in EUR,
  "income_max": monatliches Netto in EUR,
  "core_values": ["Wert1", "Wert2", "Wert3"],
  "pain_points": ["Problem1", "Problem2", "Problem3"],
  "goals": ["Ziel1", "Ziel2"],
  "buying_style": "impulsive" oder "impulsive_mixed" oder "considered" oder "rational",
  "platforms": ["Instagram", "LinkedIn", etc.],
  "media_consumption": ["Podcasts", "YouTube", etc.],
  "tech_affinity": 0-100,
  "price_sensitivity": 0-100,
  "priority": "primary" oder "secondary" oder "niche"
}

Nur JSON-Array, keine Erklärungen.`,
      }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error("Kein Array");
    const segments = JSON.parse(arrayMatch[0]);
    return NextResponse.json({ segments });
  } catch (e) {
    console.error("Segment-Parse-Fehler:", e);
    return NextResponse.json({ error: "Analyse fehlgeschlagen" }, { status: 500 });
  }
}
