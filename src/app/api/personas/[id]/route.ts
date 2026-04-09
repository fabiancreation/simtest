import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { data, error } = await supabase
    .from("persona_profiles").select("*").eq("id", id).eq("user_id", user.id).single();
  if (error || !data) return NextResponse.json({ error: "Persona nicht gefunden" }, { status: 404 });
  return NextResponse.json(data);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const body = await request.json();

  // Build update object from body (same fields as save route)
  const updateData: Record<string, unknown> = {};
  if (body.name !== undefined) updateData.name = body.name;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.ageMin !== undefined) updateData.age_min = body.ageMin;
  if (body.ageMax !== undefined) updateData.age_max = body.ageMax;
  if (body.genderMale !== undefined) updateData.gender_male = body.genderMale;
  if (body.genderFemale !== undefined) updateData.gender_female = body.genderFemale;
  if (body.genderDiverse !== undefined) updateData.gender_diverse = body.genderDiverse;
  if (body.regions !== undefined) updateData.regions = body.regions;
  if (body.urbanRural !== undefined) updateData.urban_rural = body.urbanRural;
  if (body.education !== undefined) updateData.education = body.education;
  if (body.incomeMin !== undefined) updateData.income_min = body.incomeMin;
  if (body.incomeMax !== undefined) updateData.income_max = body.incomeMax;
  if (body.coreValues !== undefined) updateData.core_values = body.coreValues;
  if (body.painPoints !== undefined) updateData.pain_points = body.painPoints;
  if (body.goals !== undefined) updateData.goals = body.goals;
  if (body.buyingStyle !== undefined) updateData.buying_style = body.buyingStyle;
  if (body.platforms !== undefined) updateData.platforms = body.platforms;
  if (body.mediaConsumption !== undefined) updateData.media_consumption = body.mediaConsumption;
  if (body.techAffinity !== undefined) updateData.tech_affinity = body.techAffinity;
  if (body.priceSensitivity !== undefined) updateData.price_sensitivity = body.priceSensitivity;
  if (body.priority !== undefined) updateData.priority = body.priority;

  // Invalidate cached personas when description changes
  if (body.description !== undefined) {
    updateData.personas = null; // Force regeneration on next simulation
  }

  const { error } = await supabase
    .from("persona_profiles").update(updateData).eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Update fehlgeschlagen" }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });

  const { error } = await supabase
    .from("persona_profiles").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 500 });
  return NextResponse.json({ success: true });
}
