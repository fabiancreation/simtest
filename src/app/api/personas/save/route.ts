import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await request.json();

  const { data, error } = await supabase
    .from("persona_profiles")
    .insert({
      user_id: user.id,
      name: body.name || "Neue Persona",
      description: body.description,
      preset_id: body.presetId ?? null,
      age_min: body.ageMin ?? 25,
      age_max: body.ageMax ?? 45,
      gender_male: body.genderMale ?? 48,
      gender_female: body.genderFemale ?? 48,
      gender_diverse: body.genderDiverse ?? 4,
      regions: body.regions?.length ? body.regions : ["deutschland"],
      urban_rural: body.urbanRural ?? "mixed",
      education: body.education ?? [],
      income_min: body.incomeMin ?? 2000,
      income_max: body.incomeMax ?? 5000,
      buying_style: body.buyingStyle ?? "considered",
      core_values: body.coreValues ?? [],
      pain_points: body.painPoints ?? [],
      goals: body.goals ?? [],
      platforms: body.platforms ?? [],
      media_consumption: body.mediaConsumption ?? [],
      tech_affinity: body.techAffinity ?? 60,
      price_sensitivity: body.priceSensitivity ?? 50,
      ai_estimated_fields: body.aiEstimatedFields ?? [],
      ai_confidence: body.aiConfidence ?? null,
      ai_reasoning: body.aiReasoning ?? null,
      enriched_at: body.aiEstimatedFields?.length ? new Date().toISOString() : null,
      agent_count_default: 50,
    })
    .select()
    .single();

  if (error) {
    console.error("Persona save error:", error);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}
