import { createClient } from "https://esm.sh/@supabase/supabase-js@2.102.1";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.85.0";
import { PRESETS, generatePersonasFromPreset, type RichPersona } from "./presets.ts";
import { buildNetwork } from "./network.ts";
import { generateReport } from "./report.ts";
import type { Agent, Reaction, Variant } from "./types.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

// ============================================
// RETRY
// ============================================

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable = err instanceof Error && (
        err.message.includes("overloaded") ||
        err.message.includes("rate_limit") ||
        err.message.includes("529") ||
        err.message.includes("500") ||
        err.message.includes("timeout")
      );
      if (!isRetryable || attempt === maxRetries) throw err;
      const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.log(`Retry ${attempt + 1}/${maxRetries} nach ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error("Retry fehlgeschlagen");
}

// ============================================
// PERSONA CACHE
// ============================================

async function hashDescription(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getCachedPersonas(userId: string, description: string, count: number): Promise<RichPersona[] | null> {
  const hash = await hashDescription(description);
  const { data } = await supabase
    .from("persona_cache").select("personas")
    .eq("user_id", userId).eq("description_hash", hash).eq("agent_count", count)
    .maybeSingle();
  return data?.personas ?? null;
}

async function cachePersonas(userId: string, description: string, count: number, personas: RichPersona[]): Promise<void> {
  const hash = await hashDescription(description);
  await supabase.from("persona_cache").upsert({
    user_id: userId, description_hash: hash, agent_count: count, personas,
  }, { onConflict: "user_id,description_hash,agent_count" });
}

// ============================================
// LEGACY PERSONA GENERATION (für Custom-Beschreibungen)
// ============================================

async function generatePersonasViaAPI(description: string, count: number): Promise<RichPersona[]> {
  const response = await withRetry(() => anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 4096,
    system: `Du generierst KI-Personas für Marktforschungs-Simulationen.
Antworte NUR als JSON-Array. Keine Erklärungen, kein Markdown. Beginne direkt mit [ und ende mit ].`,
    messages: [{
      role: "user",
      content: `Generiere ${count} realistische deutsche Personas für folgende Zielgruppe:
${description}

Jede Persona als JSON-Objekt:
{
  "name": "Vorname Nachname", "age": Zahl, "gender": "männlich"/"weiblich"/"divers",
  "occupation": "Beruf", "location": "Stadt", "region_type": "großstadt"/"mittelstadt"/"kleinstadt"/"ländlich",
  "education": "Bildungsgrad", "income_monthly": Zahl,
  "personality": "2-3 Sätze",
  "big_five": {"openness": 1-10, "conscientiousness": 1-10, "extraversion": 1-10, "agreeableness": 1-10, "neuroticism": 1-10},
  "values": ["Wert1", "Wert2", "Wert3"],
  "pain_points": ["Problem1", "Problem2"],
  "buying_triggers": ["Auslöser1", "Auslöser2"],
  "buying_blockers": ["Einwand1", "Einwand2"],
  "media_primary": ["Plattform1", "Plattform2"],
  "trust_sources": ["Quelle1", "Quelle2"]
}`,
    }],
  }));

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (!arrayMatch) throw new Error("Keine Personas generiert");
  return JSON.parse(arrayMatch[0]);
}

// ============================================
// AGENT BUILDER
// ============================================

function buildSystemPrompt(persona: RichPersona, platformBehavior?: { ignore_probability: number; comment_probability: number; share_probability: number; like_probability: number }): string {
  const lines: string[] = [];
  lines.push(`Du bist ${persona.name}, ${persona.age} Jahre alt, ${persona.gender}, ${persona.occupation} aus ${persona.location}.`);

  if (persona.big_five) {
    const bf = persona.big_five;
    lines.push(`Persönlichkeit (Big Five): Offenheit ${bf.openness}/10, Gewissenhaftigkeit ${bf.conscientiousness}/10, Extraversion ${bf.extraversion}/10, Verträglichkeit ${bf.agreeableness}/10, Neurotizismus ${bf.neuroticism}/10.`);
  }
  if (persona.personality) lines.push(`Charakter: ${persona.personality}`);
  if (persona.subtype) lines.push(`Typ: ${persona.subtype}${persona.subtype_traits ? ` - ${persona.subtype_traits}` : ""}`);
  if (persona.income_monthly) lines.push(`Einkommen: ca. ${persona.income_monthly}€ netto/Monat. Bildung: ${persona.education}.`);

  lines.push(`Deine Werte: ${persona.values.join(", ")}`);
  lines.push(`Deine größten Probleme: ${persona.pain_points.join(", ")}`);
  lines.push(`Du kaufst wenn: ${persona.buying_triggers.join(", ")}`);
  lines.push(`Deine typischen Einwände: ${persona.buying_blockers.join(", ")}`);

  if (persona.media_primary) {
    lines.push(`Du nutzt vor allem: ${persona.media_primary.join(", ")}. Du vertraust: ${persona.trust_sources.join(", ")}.`);
  }

  // Platform Behavior als natürlichsprachliche Tendenz
  if (platformBehavior) {
    const behaviorHints: string[] = [];
    if (platformBehavior.ignore_probability >= 0.5) {
      behaviorHints.push("Du ignorierst die meisten Inhalte in deinem Feed");
    } else if (platformBehavior.ignore_probability <= 0.3) {
      behaviorHints.push("Du reagierst auf vieles was du siehst");
    }
    if (platformBehavior.comment_probability >= 0.3) {
      behaviorHints.push("du kommentierst gern");
    } else if (platformBehavior.comment_probability <= 0.15) {
      behaviorHints.push("du kommentierst selten");
    }
    if (platformBehavior.share_probability >= 0.15) {
      behaviorHints.push("du teilst Inhalte die dich begeistern");
    } else if (platformBehavior.share_probability <= 0.05) {
      behaviorHints.push("du teilst fast nie etwas");
    }
    if (behaviorHints.length > 0) {
      lines.push(`Dein Online-Verhalten: ${behaviorHints.join(", ")}.`);
    }
  }

  lines.push("");
  lines.push("WICHTIG: Du antwortest IMMER auf Deutsch und im Charakter dieser Person. Du bist eine echte Person mit eigener Meinung. Reagiere natürlich - manche Dinge findest du gut, andere nicht. Du bist weder automatisch skeptisch noch automatisch begeistert. Deine Reaktion hängt davon ab, ob der Content zu deinen Werten, Problemen und Auslösern passt.");

  return lines.join("\n");
}

function buildAgents(personas: RichPersona[], variants: Variant[], platformBehavior?: { ignore_probability: number; comment_probability: number; share_probability: number; like_probability: number }): Agent[] {
  const agents: Agent[] = [];
  const agentsPerVariant = Math.floor(personas.length / variants.length);

  for (let i = 0; i < personas.length; i++) {
    const variantIndex = Math.min(
      Math.floor(i / agentsPerVariant),
      variants.length - 1,
    );

    agents.push({
      index: i,
      persona: {
        ...personas[i],
        // Sicherstellen dass alle Felder da sind
        buying_triggers: personas[i].buying_triggers ?? personas[i].buy_triggers ?? [],
        buying_blockers: personas[i].buying_blockers ?? personas[i].objections ?? [],
      },
      systemPrompt: buildSystemPrompt(personas[i], platformBehavior),
      assignedVariant: variants[variantIndex].id,
      connections: [],
    });
  }

  return agents;
}

// ============================================
// SIMULATION LOOP
// ============================================

// Kontext-Framing je nach Simulationstyp
function getSimTypeFraming(simType: string, userContext?: string): { scenario: string; scenarioRepeat: string; actionContext: string } {
  switch (simType) {
    case "copy": {
      // Dynamisches Framing basierend auf dem Einsatzort
      const ctx = userContext?.toLowerCase() ?? "";
      if (ctx.includes("newsletter") || ctx.includes("e-mail") || ctx.includes("email") || ctx.includes("betreff")) {
        return {
          scenario: "Du öffnest dein E-Mail-Postfach und siehst diesen Betreff/diese E-Mail",
          scenarioRepeat: "Du siehst die E-Mail nochmal in deinem Postfach",
          actionContext: "auf diese E-Mail",
        };
      }
      if (ctx.includes("google") || ctx.includes("search") || ctx.includes("suchanzeige") || ctx.includes("sea")) {
        return {
          scenario: "Du googelst nach einer Lösung für dein Problem und siehst diese Anzeige in den Suchergebnissen",
          scenarioRepeat: "Du siehst die gleiche Anzeige bei einer erneuten Suche",
          actionContext: "auf diese Suchanzeige",
        };
      }
      if (ctx.includes("produktbeschreibung") || ctx.includes("produkttext") || ctx.includes("shop") || ctx.includes("amazon")) {
        return {
          scenario: "Du stöberst in einem Online-Shop und liest diese Produktbeschreibung",
          scenarioRepeat: "Du schaust dir die Produktbeschreibung nochmal an",
          actionContext: "auf diese Produktbeschreibung",
        };
      }
      if (ctx.includes("headline") || ctx.includes("überschrift") || ctx.includes("blog") || ctx.includes("artikel")) {
        return {
          scenario: "Du scrollst durch dein News-Feed und siehst diese Überschrift/diesen Artikel",
          scenarioRepeat: "Du siehst den Artikel nochmal",
          actionContext: "auf diesen Artikel",
        };
      }
      if (ctx.includes("slogan") || ctx.includes("claim") || ctx.includes("tagline")) {
        return {
          scenario: "Du siehst diesen Slogan/Claim einer Marke",
          scenarioRepeat: "Du begegnest dem Slogan erneut",
          actionContext: "auf diesen Slogan",
        };
      }
      return {
        scenario: "Du scrollst durch deinen Social-Media-Feed und siehst diesen Post",
        scenarioRepeat: "Du siehst denselben Post nochmal in deinem Feed",
        actionContext: "auf diesen Post",
      };
    }
    case "product":
      return {
        scenario: "Stelle dir vor: Du hast ein konkretes Problem und suchst aktiv nach einer Lösung. Du gehörst genau zur Zielgruppe dieses Angebots. Du stößt auf folgendes Angebot",
        scenarioRepeat: "Du schaust dir das Angebot nochmal genauer an",
        actionContext: "auf dieses Angebot",
      };
    case "pricing":
      return {
        scenario: "Du interessierst dich grundsätzlich für dieses Produkt/diesen Service und vergleichst Preise. Du siehst diese Preisoption",
        scenarioRepeat: "Du vergleichst die Preise nochmal",
        actionContext: "auf dieses Preisangebot",
      };
    case "ad":
      return {
        scenario: "Du scrollst durch deinen Feed und siehst diese Werbeanzeige",
        scenarioRepeat: "Die gleiche Anzeige wird dir nochmal ausgespielt",
        actionContext: "auf diese Anzeige",
      };
    case "landing":
      return {
        scenario: "Du klickst auf einen Link der dich interessiert hat und landest auf dieser Seite",
        scenarioRepeat: "Du schaust dir die Seite nochmal genauer an",
        actionContext: "auf diese Landing Page",
      };
    case "campaign":
      return {
        scenario: "Du wirst über verschiedene Kanäle von dieser Kampagne angesprochen. Lies das Briefing und stell dir vor, du begegnest der Kampagne im Alltag",
        scenarioRepeat: "Du siehst die Kampagne erneut auf einem anderen Kanal",
        actionContext: "auf diese Kampagne",
      };
    case "crisis":
      return {
        scenario: "Du liest diese Nachricht/Meldung in deinem Feed. Es betrifft eine Marke/ein Unternehmen das du kennst",
        scenarioRepeat: "Die Nachricht taucht erneut in deinem Feed auf",
        actionContext: "auf diese Nachricht",
      };
    case "strategy":
      return {
        scenario: "Jemand stellt dir folgende Geschäftsidee / Strategie vor und fragt nach deiner ehrlichen Einschätzung als potenzieller Kunde",
        scenarioRepeat: "Du denkst nochmal über die Geschäftsidee nach",
        actionContext: "auf diese Geschäftsidee",
      };
    default:
      return {
        scenario: "Du siehst folgenden Inhalt",
        scenarioRepeat: "Du siehst den Inhalt erneut",
        actionContext: "darauf",
      };
  }
}

const JSON_RESPONSE_FORMAT = `Antworte NUR mit diesem JSON (kein anderer Text):
{
  "action": "like" oder "comment" oder "share" oder "ignore",
  "comment_text": "Dein Kommentar falls action=comment, sonst null. Beginne NICHT mit 'Interessant' oder 'Klingt interessant'. Schreibe so wie DU wirklich reden würdest.",
  "internal_reasoning": "Was denkst du WIRKLICH? Sei konkret und ehrlich. Nenne das größte Problem ODER den stärksten Kaufgrund aus DEINER Perspektive.",
  "interest_level": 1-10,
  "credibility_rating": 1-10,
  "would_buy": true oder false,
  "biggest_objection": "Dein wichtigster Einwand in einem Satz, oder null wenn keiner"
}`;

function buildUserMessage(
  agent: Agent,
  variant: Variant,
  round: number,
  previousReactions: Reaction[],
  allAgents: Agent[],
  simType: string,
  userContext?: string,
): string {
  const framing = getSimTypeFraming(simType, userContext);
  const contextBlock = userContext?.trim()
    ? `\nKontext: ${userContext.trim()}\n`
    : "";

  if (round === 1) {
    return `${framing.scenario}:

"${variant.content}"
${contextBlock}
Wie reagierst du ${framing.actionContext}?
${JSON_RESPONSE_FORMAT}`;
  }

  const neighborReactions = getNeighborReactions(agent, previousReactions, allAgents, round - 1);

  return `${framing.scenarioRepeat}:

"${variant.content}"
${contextBlock}
${neighborReactions.length > 0
    ? `Du siehst diese Reaktionen von Leuten die du kennst:\n${neighborReactions.join("\n")}\n`
    : "Bisher hat kaum jemand darauf reagiert."
  }

Hat sich deine Meinung geändert? Wie reagierst du JETZT ${framing.actionContext}?
${JSON_RESPONSE_FORMAT}`;
}

function getNeighborReactions(
  agent: Agent,
  previousReactions: Reaction[],
  allAgents: Agent[],
  targetRound: number,
): string[] {
  const descriptions: string[] = [];

  for (const neighborIdx of agent.connections) {
    const neighbor = allAgents[neighborIdx];
    if (!neighbor || neighbor.assignedVariant !== agent.assignedVariant) continue;

    const reaction = previousReactions.find(
      r => r.agentIndex === neighborIdx && r.round === targetRound,
    );
    if (!reaction) continue;

    const vorname = neighbor.persona.name.split(" ")[0];
    switch (reaction.action) {
      case "like": descriptions.push(`- ${vorname} hat den Post geliked.`); break;
      case "comment": descriptions.push(`- ${vorname} hat kommentiert: "${reaction.commentText}"`); break;
      case "share": descriptions.push(`- ${vorname} hat den Post geteilt.`); break;
      // ignore: nicht zeigen (wie in echtem Social Media)
    }
  }

  return descriptions.slice(0, 5); // Max 5 um Context klein zu halten
}

function parseAgentResponse(text: string): {
  action: "like" | "comment" | "share" | "ignore";
  comment_text: string | null;
  internal_reasoning: string;
  interest_level: number;
  credibility_rating: number;
  would_buy: boolean;
  biggest_objection: string | null;
} {
  // Markdown-Codeblocks entfernen (```json ... ```)
  const cleaned = text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

  // Versuche JSON zu extrahieren
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    // Kein JSON gefunden — versuche aus abgeschnittenem JSON die Felder zu retten
    const actionMatch = cleaned.match(/"action"\s*:\s*"(\w+)"/);
    const commentMatch = cleaned.match(/"comment_text"\s*:\s*"([^"]+)"/);
    const reasoningMatch = cleaned.match(/"internal_reasoning"\s*:\s*"([^"]+)"/);
    const interestMatch = cleaned.match(/"interest_level"\s*:\s*(\d+)/);
    const credMatch = cleaned.match(/"credibility_rating"\s*:\s*(\d+)/);
    const buyMatch = cleaned.match(/"would_buy"\s*:\s*(true|false)/);
    const objectionMatch = cleaned.match(/"biggest_objection"\s*:\s*"([^"]+)"/);

    const action = actionMatch?.[1] as "like" | "comment" | "share" | "ignore" ?? "ignore";
    return {
      action: ["like", "comment", "share", "ignore"].includes(action) ? action : "ignore",
      comment_text: commentMatch?.[1] ?? null,
      internal_reasoning: reasoningMatch?.[1] ?? commentMatch?.[1] ?? "Antwort konnte nicht vollständig geparst werden.",
      interest_level: Math.max(1, Math.min(10, Number(interestMatch?.[1]) || 5)),
      credibility_rating: Math.max(1, Math.min(10, Number(credMatch?.[1]) || 5)),
      would_buy: buyMatch?.[1] === "true",
      biggest_objection: objectionMatch?.[1] ?? null,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);

    const validActions = ["like", "comment", "share", "ignore"];
    const action = validActions.includes(parsed.action) ? parsed.action : "ignore";

    return {
      action,
      comment_text: action === "comment" ? (parsed.comment_text || parsed.commentText || "...") : null,
      internal_reasoning: parsed.internal_reasoning || parsed.reasoning || "Keine Begründung.",
      interest_level: Math.max(1, Math.min(10, Number(parsed.interest_level || parsed.interest) || 5)),
      credibility_rating: Math.max(1, Math.min(10, Number(parsed.credibility_rating || parsed.credibility) || 5)),
      would_buy: parsed.would_buy === true || parsed.wouldBuy === true,
      biggest_objection: parsed.biggest_objection || parsed.objection || null,
    };
  } catch {
    // JSON kaputt — Freitext als Reasoning nutzen
    return {
      action: "comment",
      comment_text: null,
      internal_reasoning: text.slice(0, 300),
      interest_level: 5,
      credibility_rating: 5,
      would_buy: false,
      biggest_objection: null,
    };
  }
}

async function simulateRound(
  agents: Agent[],
  variants: Variant[],
  round: number,
  previousReactions: Reaction[],
  simType: string,
  userContext?: string,
): Promise<Reaction[]> {
  const BATCH_SIZE = 10;
  const reactions: Reaction[] = [];

  for (let i = 0; i < agents.length; i += BATCH_SIZE) {
    const batch = agents.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map(async (agent) => {
        const variant = variants.find(v => v.id === agent.assignedVariant)!;
        const userMessage = buildUserMessage(agent, variant, round, previousReactions, agents, simType, userContext);

        const response = await withRetry(() => anthropic.messages.create({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 600,
          temperature: 0.8,
          system: agent.systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        })) as { content: Array<{ type: string; text?: string }> };

        const text = response.content[0].type === "text" ? (response.content[0].text ?? "") : "";
        const parsed = parseAgentResponse(text);

        return {
          agentIndex: agent.index,
          round,
          variantId: agent.assignedVariant,
          action: parsed.action,
          commentText: parsed.comment_text,
          internalReasoning: parsed.internal_reasoning,
          interestLevel: parsed.interest_level,
          credibilityRating: parsed.credibility_rating,
          wouldBuy: parsed.would_buy,
          biggestObjection: parsed.biggest_objection,
        } as Reaction;
      }),
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        reactions.push(result.value);
      } else {
        console.error("Agent-Call fehlgeschlagen:", result.reason);
      }
    }
  }

  return reactions;
}

// ============================================
// VARIANT EXTRACTION
// ============================================

function extractVariants(simType: string, inputData: Record<string, unknown>): Variant[] {
  const raw = extractRawVariants(simType, inputData);
  return raw.map((content, i) => ({
    id: String.fromCharCode(65 + i), // A, B, C, D
    label: `Variante ${String.fromCharCode(65 + i)}`,
    content,
  }));
}

function extractRawVariants(simType: string, inputData: Record<string, unknown>): string[] {
  switch (simType) {
    case "copy": return (inputData.variants as string[]) ?? [];
    case "product": {
      const parts = [inputData.offer as string];
      if (inputData.price) parts.push(`Preis: ${inputData.price}`);
      if (inputData.payment_model) parts.push(`Zahlungsmodell: ${inputData.payment_model}`);
      return [parts.filter(Boolean).join("\n\n")];
    }
    case "pricing": {
      const offer = inputData.offer as string ?? "";
      const pvs = (inputData.price_variants as Array<{ price: string; label: string }>) ?? [];
      return pvs.map(pv => `${offer}\n\nPreis: ${pv.price}${pv.label ? ` (${pv.label})` : ""}`);
    }
    case "ad": {
      const advs = (inputData.ad_variants as Array<{ text: string; headline: string; cta: string }>) ?? [];
      return advs.map(av => [av.headline, av.text, av.cta ? `CTA: ${av.cta}` : ""].filter(Boolean).join("\n"));
    }
    case "landing": {
      const urls = (inputData.urls as string[]) ?? [];
      const goal = inputData.landing_goal as string ?? "";
      return urls.map(url => `Landing Page: ${url}\nZiel: ${goal}`);
    }
    case "campaign": {
      const brief = inputData.campaign_brief as string ?? "";
      const channels = (inputData.campaign_channels as string[]) ?? [];
      const channelInfo = channels.length > 0 ? `\n\nKanäle: ${channels.join(", ")}` : "";
      const goal = inputData.campaign_goal as string;
      const goalInfo = goal ? `\nKampagnenziel: ${goal}` : "";
      return [`${brief}${channelInfo}${goalInfo}`];
    }
    case "crisis": {
      const msg = inputData.crisis_message as string ?? "";
      const counter = inputData.counter_message as string;
      if (counter) return [msg, `Nachricht: ${msg}\n\nReaktion: ${counter}`];
      return [msg];
    }
    case "strategy": {
      const idea = inputData.strategy_idea as string ?? "";
      const market = inputData.strategy_market as string ?? "";
      const competitors = inputData.strategy_competitors as string;
      const pricing = inputData.strategy_pricing as string;
      const parts = [idea];
      if (market) parts.push(`Zielmarkt: ${market}`);
      if (competitors) parts.push(`Wettbewerber: ${competitors}`);
      if (pricing) parts.push(`Geplante Preisgestaltung: ${pricing}`);
      return [parts.join("\n\n")];
    }
    default: return [];
  }
}

// ============================================
// LANDING PAGE CRAWLER
// ============================================

async function crawlLandingPage(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SimTestBot/1.0)",
        "Accept": "text/html",
      },
    });
    clearTimeout(timeout);

    if (!response.ok) return `[Seite nicht erreichbar: HTTP ${response.status}]`;

    const html = await response.text();

    // HTML zu Text: Tags entfernen, relevante Inhalte extrahieren
    let text = html
      // Script, Style, Head entfernen
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<head[\s\S]*?<\/head>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      // Meta-Beschreibung extrahieren
      .replace(/.*/, (m) => {
        const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
        return metaMatch ? `META: ${metaMatch[1]}\n\n${m}` : m;
      });

    // Title extrahieren
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";

    // OG-Tags
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i)?.[1] ?? "";
    const ogDesc = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i)?.[1] ?? "";

    // HTML-Tags entfernen
    text = text
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();

    // Zusammenbauen
    const parts: string[] = [];
    if (title) parts.push(`TITEL: ${title}`);
    if (ogTitle && ogTitle !== title) parts.push(`HEADLINE: ${ogTitle}`);
    if (ogDesc) parts.push(`BESCHREIBUNG: ${ogDesc}`);
    parts.push("");
    parts.push(`SEITENINHALT:\n${text.slice(0, 3000)}`);

    return parts.join("\n");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
    return `[Seite konnte nicht geladen werden: ${msg}]`;
  }
}

// ============================================
// AI-SYNTHESE
// ============================================

async function generateSynthesis(
  variants: Variant[],
  allReactions: Reaction[],
  agents: Agent[],
  simType: string,
): Promise<{ summary: string; recommendations: string[]; objection_clusters: string[]; buy_rate: number }> {
  // Daten für den Synthese-Prompt aufbereiten
  const buyCount = allReactions.filter(r => r.wouldBuy).length;
  const totalCount = allReactions.length;
  const buyRate = totalCount > 0 ? buyCount / totalCount : 0;

  // Top-Einwände clustern
  const objections = allReactions
    .map(r => r.biggestObjection)
    .filter((o): o is string => o !== null && o.length > 0);

  // Reaktions-Zusammenfassung pro Variante
  const variantSummaries = variants.map(v => {
    const vReactions = allReactions.filter(r => r.variantId === v.id);
    const vBuy = vReactions.filter(r => r.wouldBuy).length;
    // Reaktionen kürzen — max 10, Reasoning max 150 Zeichen
    const reasonings = vReactions
      .map(r => {
        const name = agents.find(a => a.index === r.agentIndex)?.persona.name ?? "Agent";
        const reasoning = r.internalReasoning.slice(0, 150);
        return `- ${name} (${r.action}, ${r.interestLevel}/10): ${reasoning}`;
      })
      .slice(0, 10);
    const vObjections = vReactions.map(r => r.biggestObjection).filter(Boolean).slice(0, 5);

    return `VARIANTE ${v.id}:
Kaufbereitschaft: ${vBuy}/${vReactions.length} (${Math.round(vBuy / Math.max(1, vReactions.length) * 100)}%)
Reaktionen:\n${reasonings.join("\n")}
Einwände: ${vObjections.join(" | ") || "keine"}`;
  });

  const typeContext = simType === "product" ? "ein Produktangebot"
    : simType === "pricing" ? "verschiedene Preispunkte"
    : simType === "copy" ? "Textvarianten"
    : simType === "ad" ? "Werbeanzeigen"
    : simType === "crisis" ? "eine Krisensituation"
    : "Content";

  const response = await withRetry(() => anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1000,
    system: `Du bist ein Marktforschungs-Analyst. Analysiere Persona-Reaktionen und gib konkrete Empfehlungen. Deutsch. NUR JSON, kein Markdown, keine Codeblocks.`,
    messages: [{
      role: "user",
      content: `${totalCount} Personas aus der Zielgruppe haben auf ${typeContext} reagiert.

${variantSummaries.join("\n\n---\n\n")}

Erstelle eine Analyse als JSON:
{
  "summary": "3-5 Sätze: Was sagt die Zielgruppe? Was ist die Kernaussage? Sei direkt und konkret, nicht generisch.",
  "recommendations": ["3-5 konkrete, umsetzbare Empfehlungen. Jede beginnt mit einem Verb (Ergänze..., Entferne..., Teste..., Füge hinzu...). Beziehe dich auf die tatsächlichen Einwände."],
  "objection_clusters": ["Die 3-4 häufigsten Einwand-Kategorien, jeweils in einem kurzen Satz zusammengefasst"]
}

Nur JSON, keine Erklärungen.`,
    }],
  })) as { content: Array<{ type: string; text?: string }> };

  const rawText = response.content[0].type === "text" ? (response.content[0].text ?? "") : "";
  const cleanedText = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  try {
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Kein JSON");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      summary: parsed.summary ?? "",
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      objection_clusters: Array.isArray(parsed.objection_clusters) ? parsed.objection_clusters : [],
      buy_rate: buyRate,
    };
  } catch (e) {
    console.error("Synthese-Parse-Fehler:", e, "Raw:", rawText.slice(0, 200));
    return { summary: "", recommendations: [], objection_clusters: [], buy_rate: buyRate };
  }
}

// ============================================
// EDGE FUNCTION HANDLER
// ============================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" },
    });
  }

  try {
    const { simulationId } = await req.json();
    if (!simulationId) throw new Error("simulationId fehlt");

    // 1. Simulation laden
    const { data: sim, error: simErr } = await supabase
      .from("simulations").select("*").eq("id", simulationId).single();

    if (simErr || !sim) throw new Error("Simulation nicht gefunden");
    if (sim.status !== "queued") throw new Error(`Status ist '${sim.status}', erwartet 'queued'`);

    const totalRounds = sim.total_rounds ?? 1;

    await supabase.from("simulations").update({
      status: "running",
      started_at: new Date().toISOString(),
      total_rounds: totalRounds,
      current_round: 0,
    }).eq("id", simulationId);

    // 2. Personas laden/generieren
    let personas: RichPersona[] = [];

    if (sim.persona_id) {
      const { data: profile } = await supabase
        .from("persona_profiles").select("personas, description")
        .eq("id", sim.persona_id).single();

      if (profile?.personas?.length) {
        personas = profile.personas;
      } else if (profile?.description) {
        const cached = await getCachedPersonas(sim.user_id, profile.description, sim.agent_count);
        if (cached) {
          personas = cached;
        } else {
          personas = await generatePersonasViaAPI(profile.description, sim.agent_count);
          await cachePersonas(sim.user_id, profile.description, sim.agent_count, personas);
        }
        await supabase.from("persona_profiles").update({ personas, agent_count_default: sim.agent_count }).eq("id", sim.persona_id);
      }
    } else if (sim.persona_preset) {
      const preset = PRESETS[sim.persona_preset];
      if (preset) {
        const cacheKey = `preset:${sim.persona_preset}`;
        const cached = await getCachedPersonas(sim.user_id, cacheKey, sim.agent_count);
        personas = cached ?? generatePersonasFromPreset(preset, sim.agent_count);
        if (!cached) await cachePersonas(sim.user_id, cacheKey, sim.agent_count, personas);
      } else {
        personas = await generatePersonasViaAPI(
          `Breiter Querschnitt der deutschsprachigen Bevölkerung, 25-55 Jahre.`,
          sim.agent_count,
        );
      }
    }

    if (personas.length === 0) throw new Error("Keine Personas verfügbar");
    if (personas.length > sim.agent_count) personas = personas.slice(0, sim.agent_count);

    // 3. Varianten extrahieren (bei Landing Pages: URLs crawlen)
    let variants = extractVariants(sim.sim_type, sim.input_data);
    if (variants.length === 0) throw new Error("Keine Varianten");

    if (sim.sim_type === "landing") {
      const urls = (sim.input_data.urls as string[]) ?? [];
      const goal = sim.input_data.landing_goal as string ?? "";
      const crawledPages = await Promise.all(urls.map(url => crawlLandingPage(url)));
      variants = crawledPages.map((content, i) => ({
        id: String.fromCharCode(65 + i),
        label: `Landing Page ${String.fromCharCode(65 + i)}`,
        content: `URL: ${urls[i]}\nZiel: ${goal}\n\n${content}`,
      }));
    }

    // 4. Agenten bauen + Netzwerk
    const presetData = PRESETS[sim.persona_preset ?? "dach_allgemein"];
    const agents = buildAgents(personas, variants, presetData?.platform_behavior?.twitter_like);
    const topology = presetData?.network_topology;
    if (topology) {
      buildNetwork(agents, topology.type, topology.avg_connections);
    } else {
      buildNetwork(agents, "random", 8);
    }

    // Agenten in DB speichern
    const agentRows = agents.map(a => ({
      simulation_id: simulationId,
      agent_index: a.index,
      persona: a.persona,
      system_prompt: a.systemPrompt,
      assigned_variant: a.assignedVariant,
      network_connections: a.connections,
    }));
    // Batch insert (max 100 pro Request)
    for (let i = 0; i < agentRows.length; i += 100) {
      await supabase.from("agents").insert(agentRows.slice(i, i + 100));
    }

    // 5. Multi-Runden-Simulation
    const allReactions: Reaction[] = [];
    const userContext = sim.input_data.context as string | undefined;

    for (let round = 1; round <= totalRounds; round++) {
      await supabase.from("simulations").update({ current_round: round }).eq("id", simulationId);

      const roundReactions = await simulateRound(agents, variants, round, allReactions, sim.sim_type, userContext);
      allReactions.push(...roundReactions);

      // Reaktionen in DB speichern
      const reactionRows = roundReactions.map(r => ({
        simulation_id: simulationId,
        agent_index: r.agentIndex,
        round: r.round,
        variant_id: r.variantId,
        action: r.action,
        comment_text: r.commentText,
        internal_reasoning: r.internalReasoning,
        interest_level: r.interestLevel,
        credibility_rating: r.credibilityRating,
        would_buy: r.wouldBuy,
        biggest_objection: r.biggestObjection,
      }));
      for (let i = 0; i < reactionRows.length; i += 100) {
        await supabase.from("reactions").insert(reactionRows.slice(i, i + 100));
      }
    }

    // 6. Report generieren (lokal)
    const report = generateReport(agents, allReactions, variants);

    // 7. AI-Synthese (1 Haiku-Call für Zusammenfassung + Empfehlungen)
    const synthesis = await generateSynthesis(variants, allReactions, agents, sim.sim_type);

    // 8. Ergebnis speichern
    await supabase.from("simulations").update({
      status: "completed",
      completed_at: new Date().toISOString(),
      result_data: {
        report,
        synthesis,
        // Legacy-kompatible Felder für bestehendes Frontend
        variantStats: variants.map((v, vi) => {
          const vr = allReactions.filter(r => r.variantId === v.id);
          const lastRound = Math.max(1, ...vr.map(r => r.round));
          const final = vr.filter(r => r.round === lastRound);
          const total = final.length || 1;
          return {
            variantIndex: vi,
            totalAgents: agents.filter(a => a.assignedVariant === v.id).length,
            positiv: final.filter(r => r.interestLevel >= 7).length,
            neutral: final.filter(r => r.interestLevel >= 4 && r.interestLevel < 7).length,
            negativ: final.filter(r => r.interestLevel < 4).length,
            engagementRate: final.filter(r => r.action !== "ignore").length / total,
          };
        }),
      },
    }).eq("id", simulationId);

    return new Response(JSON.stringify({ success: true, simulationId }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unbekannter Fehler";
    console.error("Edge Function error:", message);

    try {
      const { simulationId } = await req.clone().json();
      if (simulationId) {
        await supabase.from("simulations").update({
          status: "failed", error_message: message,
        }).eq("id", simulationId);
      }
    } catch { /* ignore */ }

    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
});
