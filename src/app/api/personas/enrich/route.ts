import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAnthropic } from "@/lib/anthropic/client";

const SYSTEM_PROMPT = `Du bist ein Marktforschungs-Experte. Der Nutzer hat eine Zielgruppe beschrieben.
Deine Aufgabe: Ergänze alle fehlenden Dimensionen mit realistischen Schätzungen für den deutschsprachigen Raum (DACH).

Regeln:
- Felder die der Nutzer bereits ausgefüllt hat, übernimmst du 1:1
- Felder die leer/null sind, schätzt du basierend auf der Beschreibung
- Sei realistisch, nicht stereotyp
- Gib Ranges an, keine Punktwerte (Alter, Einkommen)
- Bei Unsicherheit: Wähle breitere Ranges
- Pain Points und Ziele: 3-5 konkrete, spezifische Punkte (auf Deutsch)
- Werte: 3-5 aus dieser Liste: freiheit, sicherheit, wachstum, authentizitaet, nachhaltigkeit, effizienz, qualitaet, preis_leistung, community, innovation, bequemlichkeit, zuverlaessigkeit, roi, selbstverwirklichung
- Plattformen: 2-4 aus: instagram, tiktok, linkedin, facebook, youtube, google, email, podcast
- Medienkonsum: 2-4 aus: social_media, podcasts, youtube, newsletter, fachmedien, blogs, tiktok, youtube_shorts, instagram_reels
- buyingStyle: einer von: impulsive, impulsive_mixed, considered, rational
- urbanRural: einer von: urban, urban_leaning, mixed, rural_leaning, rural
- education: aus: hauptschule, realschule, abitur, ausbildung, meister, studium, promotion
- regions: aus: deutschland, oesterreich, schweiz, andere_eu

Antworte ausschließlich als JSON mit exakt diesen Feldern:
{
  "name": "string",
  "ageRange": [min, max],
  "genderSplit": { "male": number, "female": number, "diverse": number },
  "regions": ["string"],
  "urbanRural": "string",
  "education": ["string"],
  "incomeRange": [min, max],
  "values": ["string"],
  "painPoints": ["string"],
  "goals": ["string"],
  "buyingStyle": "string",
  "platforms": ["string"],
  "mediaConsumption": ["string"],
  "techAffinity": number_0_100,
  "priceSensitivity": number_0_100,
  "aiEstimated": ["field_names_that_ai_estimated"],
  "confidence": number_0_100,
  "reasoning": "Kurze Begründung auf Deutsch"
}`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await request.json();
  const { description, name, ageRange, regions, platforms, values, painPoints, goals } = body;

  if (!description || description.trim().length < 20) {
    return NextResponse.json({ error: "Beschreibung muss mindestens 20 Zeichen haben" }, { status: 400 });
  }

  // Build user prompt
  const userFields: string[] = [];
  if (name) userFields.push(`Name: ${name}`);
  userFields.push(`Beschreibung: ${description}`);
  if (ageRange) userFields.push(`Alter: ${ageRange[0]}-${ageRange[1]}`);
  if (regions?.length) userFields.push(`Region: ${regions.join(", ")}`);
  if (platforms?.length) userFields.push(`Plattformen: ${platforms.join(", ")}`);
  if (values?.length) userFields.push(`Werte: ${values.join(", ")}`);
  if (painPoints?.length) userFields.push(`Pain Points: ${painPoints.join(", ")}`);
  if (goals?.length) userFields.push(`Ziele: ${goals.join(", ")}`);

  const userPrompt = `Vom Nutzer ausgefüllte Felder:\n${userFields.join("\n")}\n\nBitte ergänze alle fehlenden Felder.`;

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") throw new Error("Keine Text-Antwort");

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kein JSON in Antwort");

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Enrich error:", err);
    return NextResponse.json({ error: "AI-Enrichment fehlgeschlagen" }, { status: 500 });
  }
}
