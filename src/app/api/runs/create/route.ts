import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runSimulation } from "@/lib/simulation/runSimulation";
import { generateReport } from "@/lib/simulation/generateReport";
import type { Persona, StimulusType } from "@/types/simulation";

export const maxDuration = 300; // 5 Minuten für Vercel Pro

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
  }

  // Kontingent pruefen
  const { data: profile } = await supabase
    .from("profiles")
    .select("runs_used, runs_limit")
    .eq("id", user.id)
    .single();

  if (!profile || profile.runs_used >= profile.runs_limit) {
    return NextResponse.json(
      { error: "Run-Kontingent aufgebraucht" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const {
    personaProfileId,
    stimulusType,
    variants,
    contextLayer,
  } = body as {
    personaProfileId: string;
    stimulusType: StimulusType;
    variants: string[];
    contextLayer?: string;
  };

  if (!personaProfileId || !stimulusType || !variants?.length) {
    return NextResponse.json(
      { error: "personaProfileId, stimulusType und variants sind Pflicht" },
      { status: 400 }
    );
  }

  if (variants.length > 5) {
    return NextResponse.json(
      { error: "Maximal 5 Varianten erlaubt" },
      { status: 400 }
    );
  }

  // Persona-Profil laden
  const { data: personaProfile } = await supabase
    .from("persona_profiles")
    .select("*")
    .eq("id", personaProfileId)
    .eq("user_id", user.id)
    .single();

  if (!personaProfile) {
    return NextResponse.json(
      { error: "Persona-Profil nicht gefunden" },
      { status: 404 }
    );
  }

  const personas: Persona[] = personaProfile.personas ?? [];
  if (personas.length === 0) {
    return NextResponse.json(
      { error: "Persona-Profil hat keine Personas" },
      { status: 400 }
    );
  }

  // Run anlegen
  const { data: run, error: runError } = await supabase
    .from("runs")
    .insert({
      user_id: user.id,
      persona_profile_id: personaProfileId,
      stimulus_type: stimulusType,
      stimulus_variants: variants,
      agent_count: personas.length,
      context_layer: contextLayer ? { text: contextLayer } : null,
      status: "running",
    })
    .select()
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "Run konnte nicht erstellt werden" }, { status: 500 });
  }

  try {
    // Simulation ausfuehren
    const result = await runSimulation(
      personas,
      variants,
      stimulusType,
      contextLayer
    );

    // Report generieren
    const report = await generateReport(variants, result);

    // Report speichern
    await supabase.from("reports").insert({
      run_id: run.id,
      user_id: user.id,
      winner_index: report.winnerIndex,
      summary: report.summary,
      segment_breakdown: report.segmentBreakdown,
      improvement_suggestions: report.improvementSuggestions,
      raw_reactions: result.reactions,
    });

    // Run als fertig markieren + Kontingent hochzaehlen
    await supabase
      .from("runs")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", run.id);

    await supabase
      .from("profiles")
      .update({ runs_used: profile.runs_used + 1 })
      .eq("id", user.id);

    return NextResponse.json({ runId: run.id, report });
  } catch (err) {
    await supabase
      .from("runs")
      .update({ status: "failed" })
      .eq("id", run.id);

    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
