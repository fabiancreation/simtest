import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SimType, SimDepth } from "@/types/simulation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Kontingent prüfen
  const { data: profile } = await supabase
    .from("profiles")
    .select("runs_used, runs_limit")
    .eq("id", user.id)
    .single();

  if (!profile || profile.runs_used >= profile.runs_limit) {
    return NextResponse.json({ error: "Run-Kontingent aufgebraucht" }, { status: 403 });
  }

  const body = await request.json();
  const {
    simType,
    personaPreset,
    personaId,
    agentCount,
    inputData,
    simDepth,
  } = body as {
    simType: SimType;
    personaPreset: string | null;
    personaId: string | null;
    agentCount: number;
    inputData: Record<string, unknown>;
    simDepth: SimDepth;
  };

  if (!simType || !inputData) {
    return NextResponse.json({ error: "simType und inputData sind Pflicht" }, { status: 400 });
  }

  // Simulation anlegen
  const { data: simulation, error: simError } = await supabase
    .from("simulations")
    .insert({
      user_id: user.id,
      sim_type: simType,
      persona_preset: personaPreset,
      persona_id: personaId,
      agent_count: agentCount,
      input_data: inputData,
      sim_depth: simDepth ?? "balanced",
      status: "queued",
      estimated_cost: agentCount * (simDepth === "fast" ? 1 : simDepth === "deep" ? 5 : 3) * 0.00001,
    })
    .select()
    .single();

  if (simError || !simulation) {
    console.error("Simulation create error:", simError);
    return NextResponse.json({ error: "Simulation konnte nicht erstellt werden" }, { status: 500 });
  }

  // Kontingent hochzählen
  await supabase
    .from("profiles")
    .update({ runs_used: profile.runs_used + 1 })
    .eq("id", user.id);

  return NextResponse.json({ id: simulation.id });
}
