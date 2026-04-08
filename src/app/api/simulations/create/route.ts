import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePersonas } from "@/lib/simulation/generatePersonas";
import { runSimulation } from "@/lib/simulation/runSimulation";
import { generateReport } from "@/lib/simulation/generateReport";
import type { SimType, SimDepth, Persona, StimulusType } from "@/types/simulation";

export const maxDuration = 60; // Vercel Pro: bis 60s

// Mapping von SimType auf den alten StimulusType für die bestehende Engine
function mapSimTypeToStimulus(simType: SimType): StimulusType {
  switch (simType) {
    case "copy": return "copy";
    case "product": case "pricing": return "product";
    case "ad": case "landing": case "campaign": case "crisis": return "strategy";
    default: return "copy";
  }
}

// Stimulus-Varianten aus input_data extrahieren je nach Typ
function extractVariants(simType: SimType, inputData: Record<string, unknown>): string[] {
  switch (simType) {
    case "copy":
      return (inputData.variants as string[]) ?? [];

    case "product":
      return [buildProductStimulus(inputData)];

    case "pricing": {
      const offer = inputData.offer as string ?? "";
      const pvs = (inputData.price_variants as Array<{ price: string; label: string }>) ?? [];
      return pvs.map(pv =>
        `${offer}\n\nPreis: ${pv.price}${pv.label ? ` (${pv.label})` : ""}`
      );
    }

    case "ad": {
      const advs = (inputData.ad_variants as Array<{ text: string; headline: string; cta: string }>) ?? [];
      return advs.map(av =>
        [av.headline, av.text, av.cta ? `CTA: ${av.cta}` : ""].filter(Boolean).join("\n")
      );
    }

    case "landing": {
      const landingUrls = (inputData.urls as string[]) ?? [];
      const goal = inputData.landing_goal as string ?? "";
      return landingUrls.map(url => `Landing Page: ${url}\nZiel: ${goal}`);
    }

    case "campaign":
      return [inputData.campaign_brief as string ?? ""];

    case "crisis": {
      const msg = inputData.crisis_message as string ?? "";
      const counter = inputData.counter_message as string;
      if (counter) return [msg, `Nachricht: ${msg}\n\nReaktion des Unternehmens: ${counter}`];
      return [msg];
    }

    default:
      return [];
  }
}

function buildProductStimulus(inputData: Record<string, unknown>): string {
  const parts: string[] = [];
  if (inputData.offer) parts.push(inputData.offer as string);
  if (inputData.price) parts.push(`Preis: ${inputData.price}`);
  if (inputData.payment_model) parts.push(`Zahlungsmodell: ${inputData.payment_model}`);
  return parts.join("\n\n");
}

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
      status: "running",
      started_at: new Date().toISOString(),
      estimated_cost: agentCount * (simDepth === "fast" ? 1 : simDepth === "deep" ? 5 : 3) * 0.00001,
    })
    .select()
    .single();

  if (simError || !simulation) {
    console.error("Simulation create error:", simError);
    return NextResponse.json({ error: "Simulation konnte nicht erstellt werden" }, { status: 500 });
  }

  try {
    // 1. Personas laden oder generieren
    let personas: Persona[] = [];

    if (personaId) {
      // Eigene Persona: Personas aus dem Profil laden
      const { data: personaProfile } = await supabase
        .from("persona_profiles")
        .select("personas, description, name")
        .eq("id", personaId)
        .eq("user_id", user.id)
        .single();

      if (personaProfile?.personas?.length) {
        personas = personaProfile.personas;
      } else if (personaProfile?.description) {
        // Noch keine generierten Personas -- on-the-fly generieren
        personas = await generatePersonas(personaProfile.description, agentCount);
        // Cache: Personas im Profil speichern
        await supabase
          .from("persona_profiles")
          .update({ personas, agent_count_default: agentCount })
          .eq("id", personaId);
      }
    } else if (personaPreset) {
      // Preset: Personas generieren basierend auf Preset-Beschreibung
      const presetDescriptions: Record<string, string> = {
        dach_allgemein: "Breiter Querschnitt der deutschsprachigen Bevölkerung, 25-55 Jahre, verschiedene Berufe und Lebenssituationen, urban und ländlich gemischt.",
        solo_unternehmer: "Selbstständige im Bereich Coaching, Beratung und Training. Hauptsächlich online aktiv, bauen Personal Brand auf, verkaufen Wissen als Dienstleistung.",
        ecom_kaeufer: "Menschen die regelmäßig online einkaufen. Vergleichen Preise, lesen Bewertungen, reagieren auf Angebote und Social Proof.",
        b2b_entscheider: "Geschäftsführer, Abteilungsleiter und Teamleads in KMUs. Treffen Kaufentscheidungen für ihr Unternehmen. ROI-orientiert, wenig Zeit.",
        gen_z: "18-27 Jahre, aufgewachsen mit Smartphone und Social Media. Werteorientiert, skeptisch gegenüber klassischer Werbung.",
        custom: "Allgemeine Zielgruppe im deutschsprachigen Raum.",
      };
      const desc = presetDescriptions[personaPreset] ?? presetDescriptions.custom;
      personas = await generatePersonas(desc, agentCount);
    }

    if (personas.length === 0) {
      throw new Error("Keine Personas verfügbar. Bitte erstelle zuerst eine Zielgruppe.");
    }

    // Auf gewünschte Anzahl begrenzen
    if (personas.length > agentCount) {
      personas = personas.slice(0, agentCount);
    }

    // 2. Varianten extrahieren
    const variants = extractVariants(simType, inputData);
    if (variants.length === 0) {
      throw new Error("Keine Varianten zum Testen vorhanden.");
    }

    const stimulusType = mapSimTypeToStimulus(simType);
    const contextLayer = inputData.context as string | undefined;

    // 3. Simulation ausführen
    const result = await runSimulation(personas, variants, stimulusType, contextLayer);

    // 4. Report generieren
    const report = await generateReport(variants, result);

    // 5. Ergebnisse speichern
    await supabase
      .from("simulations")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        result_data: {
          reactions: result.reactions,
          variantStats: result.variantStats,
          report: {
            winnerIndex: report.winnerIndex,
            summary: report.summary,
            segmentBreakdown: report.segmentBreakdown,
            improvementSuggestions: report.improvementSuggestions,
          },
        },
      })
      .eq("id", simulation.id);

    // 6. Kontingent hochzählen
    await supabase
      .from("profiles")
      .update({ runs_used: profile.runs_used + 1 })
      .eq("id", user.id);

    return NextResponse.json({ id: simulation.id });

  } catch (err) {
    // Fehler: Simulation als failed markieren
    await supabase
      .from("simulations")
      .update({ status: "failed" })
      .eq("id", simulation.id);

    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Simulation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
