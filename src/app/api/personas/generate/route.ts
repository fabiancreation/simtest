import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePersonas } from "@/lib/simulation/generatePersonas";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description, demographics, psychographics, context, agentCount } =
    body as {
      name: string;
      description: string;
      demographics?: string;
      psychographics?: string;
      context?: string;
      agentCount?: number;
    };

  if (!name || !description) {
    return NextResponse.json(
      { error: "Name und Beschreibung sind Pflichtfelder" },
      { status: 400 }
    );
  }

  const count = Math.min(agentCount ?? 50, 200);

  const fullDescription = [
    description,
    demographics && `Demografie: ${demographics}`,
    psychographics && `Psychografie: ${psychographics}`,
    context && `Kontext: ${context}`,
  ]
    .filter(Boolean)
    .join("\n");

  const personas = await generatePersonas(fullDescription, count);

  const { data: profile, error } = await supabase
    .from("persona_profiles")
    .insert({
      user_id: user.id,
      name,
      description,
      demographics: demographics ?? null,
      psychographics: psychographics ?? null,
      context: context ?? null,
      agent_count_default: count,
      personas,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profile, personas });
}
