"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import {
  SIM_TYPES, PERSONA_PRESETS, AGENT_COUNTS, AGENT_COUNT_HINTS,
  type SimType, type SimDepth, type AudienceWarmth,
} from "@/types/simulation";

// --- Section wrapper ---
function Section({ number, label, hint, children }: {
  number: number; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-9 animate-slide-up" style={{ animationDelay: `${number * 60}ms` }}>
      <div className="flex items-center gap-2.5 mb-1">
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
          style={{ background: "var(--color-accent)", fontFamily: "var(--font-mono)" }}>{number}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-text-dim"
          style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>{label}</span>
      </div>
      {hint && <p className="text-xs text-text-dim mb-3 ml-8.5" style={{ marginLeft: 34 }}>{hint}</p>}
      <div>{children}</div>
    </div>
  );
}

// --- Auto-resize textarea ---
function AutoTextarea({ value, onChange, placeholder, rows = 3, className = "" }: {
  value: string; onChange: (v: string) => void; placeholder: string; rows?: number; className?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);
  return (
    <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      className={`input resize-none ${className}`} />
  );
}

// --- Main page ---
export default function NewSimulationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  // Form state
  const [simType, setSimType] = useState<SimType>("copy");
  const [personaPreset, setPersonaPreset] = useState<string | null>(null);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [agentCount, setAgentCount] = useState(200);
  const [customProfiles, setCustomProfiles] = useState<Array<{ id: string; name: string; agent_count_default: number }>>([]);

  // Type-specific state
  const [variants, setVariants] = useState(["", ""]);
  const [offer, setOffer] = useState("");
  const [priceSingle, setPriceSingle] = useState({ price: "", paymentModel: "" });
  const [priceVariants, setPriceVariants] = useState([{ price: "", label: "" }, { price: "", label: "" }]);
  const [adVariants, setAdVariants] = useState([{ text: "", headline: "", cta: "" }, { text: "", headline: "", cta: "" }]);
  const [adPlatform, setAdPlatform] = useState("");
  const [adFormat, setAdFormat] = useState("");
  const [urls, setUrls] = useState([""]);
  const [landingGoal, setLandingGoal] = useState("");
  const [desiredAction, setDesiredAction] = useState("");
  const [campaignBrief, setCampaignBrief] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [campaignChannels, setCampaignChannels] = useState<string[]>([]);
  const [crisisMessage, setCrisisMessage] = useState("");
  const [crisisType, setCrisisType] = useState("");
  const [crisisChannel, setCrisisChannel] = useState("");
  const [strategyIdea, setStrategyIdea] = useState("");
  const [strategyMarket, setStrategyMarket] = useState("");
  const [strategyCompetitors, setStrategyCompetitors] = useState("");
  const [strategyPricing, setStrategyPricing] = useState("");
  const [counterEnabled, setCounterEnabled] = useState(false);
  const [counterMessage, setCounterMessage] = useState("");

  // Shared
  const [focusQuestion, setFocusQuestion] = useState("");
  const [context, setContext] = useState("");
  const [simDepth, setSimDepth] = useState<SimDepth>("balanced");
  const [audienceWarmth, setAudienceWarmth] = useState<AudienceWarmth>("cold");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const config = SIM_TYPES[simType];

  // Load custom persona profiles
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("persona_profiles")
        .select("id, name, agent_count_default")
        .order("created_at", { ascending: false });
      if (data) setCustomProfiles(data);
    }
    load();
  }, []);

  // Kopie von bestehender Simulation laden
  useEffect(() => {
    if (!fromId) return;
    async function loadSource() {
      const res = await fetch(`/api/simulations/${fromId}/status`);
      if (!res.ok) return;
      const sim = await res.json();
      const d = sim.input_data ?? {};

      setSimType(sim.sim_type as SimType);
      if (sim.persona_preset) setPersonaPreset(sim.persona_preset);
      if (sim.persona_id) setPersonaId(sim.persona_id);
      if (sim.agent_count) setAgentCount(sim.agent_count);
      if (d.context) setContext(d.context);
      if (d.focus_question) setFocusQuestion(d.focus_question);
      if (d.audience_warmth) setAudienceWarmth(d.audience_warmth);

      // SimType-spezifische Felder
      if (d.variants) setVariants(d.variants);
      if (d.offer) setOffer(d.offer);
      if (d.price) setPriceSingle(prev => ({ ...prev, price: d.price }));
      if (d.payment_model) setPriceSingle(prev => ({ ...prev, paymentModel: d.payment_model }));
      if (d.price_variants) setPriceVariants(d.price_variants);
      if (d.ad_variants) setAdVariants(d.ad_variants);
      if (d.ad_platform) setAdPlatform(d.ad_platform);
      if (d.ad_format) setAdFormat(d.ad_format);
      if (d.urls) setUrls(d.urls);
      if (d.landing_goal) setLandingGoal(d.landing_goal);
      if (d.desired_action) setDesiredAction(d.desired_action);
      if (d.campaign_brief) setCampaignBrief(d.campaign_brief);
      if (d.campaign_goal) setCampaignGoal(d.campaign_goal);
      if (d.campaign_channels) setCampaignChannels(d.campaign_channels);
      if (d.crisis_message) setCrisisMessage(d.crisis_message);
      if (d.crisis_type) setCrisisType(d.crisis_type);
      if (d.crisis_channel) setCrisisChannel(d.crisis_channel);
      if (d.counter_message) { setCounterEnabled(true); setCounterMessage(d.counter_message); }
      if (d.strategy_idea) setStrategyIdea(d.strategy_idea);
      if (d.strategy_market) setStrategyMarket(d.strategy_market);
      if (d.strategy_competitors) setStrategyCompetitors(d.strategy_competitors);
      if (d.strategy_pricing) setStrategyPricing(d.strategy_pricing);
    }
    loadSource();
  }, [fromId]);

  // Section counter
  let sectionNum = 0;
  const nextNum = () => ++sectionNum;

  // Cost estimate
  const rounds = simDepth === "fast" ? 1 : simDepth === "balanced" ? 3 : 5;
  const estimatedCost = agentCount * rounds * 0.00001;

  // Submit
  const handleSubmit = useCallback(async () => {
    setError("");
    const inputData: Record<string, unknown> = {};

    // Validate & build input_data per type
    if (config.needs.includes("variants")) {
      const filled = variants.filter(v => v.trim());
      if (filled.length < (config.minVariants ?? 2)) {
        setError(`Mindestens ${config.minVariants ?? 2} Varianten erforderlich.`);
        return;
      }
      inputData.variants = filled;
    }
    if (config.needs.includes("offer")) {
      if (!offer.trim()) { setError("Angebotsbeschreibung ist Pflicht."); return; }
      inputData.offer = offer;
    }
    if (config.needs.includes("pricing_single")) {
      inputData.price = priceSingle.price;
      inputData.payment_model = priceSingle.paymentModel;
    }
    if (config.needs.includes("price_variants")) {
      const filled = priceVariants.filter(pv => pv.price.trim());
      if (filled.length < 2) { setError("Mindestens 2 Preispunkte erforderlich."); return; }
      inputData.price_variants = filled;
    }
    if (config.needs.includes("ad_variants")) {
      const filled = adVariants.filter(av => av.text.trim());
      if (filled.length < 2) { setError("Mindestens 2 Ad-Varianten mit Text erforderlich."); return; }
      inputData.ad_variants = filled;
    }
    if (config.needs.includes("ad_meta")) {
      inputData.ad_platform = adPlatform;
      inputData.ad_format = adFormat;
    }
    if (config.needs.includes("urls")) {
      const filled = urls
        .filter(u => u.trim())
        .map(u => {
          const trimmed = u.trim();
          if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
          return trimmed;
        });
      if (filled.length === 0) { setError("Mindestens eine URL erforderlich."); return; }
      const invalid = filled.find(u => { try { new URL(u); return false; } catch { return true; } });
      if (invalid) { setError(`Ungültige URL: ${invalid}`); return; }
      inputData.urls = filled;
    }
    if (config.needs.includes("landing_goal")) {
      if (!landingGoal) { setError("Bitte Seitenziel wählen."); return; }
      inputData.landing_goal = landingGoal;
      inputData.desired_action = desiredAction;
    }
    if (config.needs.includes("campaign_brief")) {
      if (!campaignBrief.trim()) { setError("Kampagnen-Briefing ist Pflicht."); return; }
      inputData.campaign_brief = campaignBrief;
      inputData.campaign_channels = campaignChannels;
      if (campaignGoal.trim()) inputData.campaign_goal = campaignGoal;
    }
    if (config.needs.includes("crisis_message")) {
      if (!crisisMessage.trim()) { setError("Kritische Nachricht ist Pflicht."); return; }
      inputData.crisis_message = crisisMessage;
    }
    if (config.needs.includes("crisis_meta")) {
      inputData.crisis_type = crisisType;
      inputData.crisis_channel = crisisChannel;
      if (counterEnabled) inputData.counter_message = counterMessage;
    }
    if (config.needs.includes("strategy_idea")) {
      if (!strategyIdea.trim()) { setError("Geschäftsidee ist Pflicht."); return; }
      inputData.strategy_idea = strategyIdea;
    }
    if (config.needs.includes("strategy_market")) {
      if (strategyMarket.trim()) inputData.strategy_market = strategyMarket;
      if (strategyCompetitors.trim()) inputData.strategy_competitors = strategyCompetitors;
      if (strategyPricing.trim()) inputData.strategy_pricing = strategyPricing;
    }

    if (focusQuestion.trim()) inputData.focus_question = focusQuestion;
    if (context.trim()) inputData.context = context;
    inputData.audience_warmth = audienceWarmth;

    if (!personaPreset && !personaId) {
      setError("Bitte Zielgruppe wählen.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/simulations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          simType,
          personaPreset,
          personaId,
          agentCount,
          inputData,
          simDepth,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/simulation/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Starten");
    } finally {
      setLoading(false);
    }
  }, [simType, personaPreset, personaId, agentCount, variants, offer, priceSingle, priceVariants, adVariants, adPlatform, adFormat, urls, landingGoal, desiredAction, campaignBrief, campaignGoal, campaignChannels, crisisMessage, crisisType, crisisChannel, counterEnabled, counterMessage, strategyIdea, strategyMarket, strategyCompetitors, strategyPricing, focusQuestion, context, audienceWarmth, simDepth, config, router]);

  return (
    <div className="max-w-[680px]">
      {/* Header */}
      <div className="mb-10 animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Neue Simulation
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Konfiguriere deinen Test. SimTest passt die Felder an den gewählten Typ an.
        </p>
      </div>

      {/* 1. Simulations-Typ */}
      <Section number={nextNum()} label="Simulations-Typ" hint="Wähle, was du testen willst - die Eingabefelder passen sich automatisch an">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {Object.values(SIM_TYPES).map((t) => {
            const active = simType === t.id;
            return (
              <button key={t.id} onClick={() => setSimType(t.id as SimType)}
                className="flex flex-col items-start p-3.5 rounded-xl text-left transition-all duration-200 cursor-pointer"
                style={{
                  border: `2px solid ${active ? t.color : "var(--color-border)"}`,
                  background: active ? `${t.color}0a` : "transparent",
                }}>
                <div className="flex items-center gap-2 mb-1">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke={active ? t.color : "var(--color-text-dim)"} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={t.icon} />
                  </svg>
                  <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: active ? t.color : "var(--color-text)" }}>
                    {t.label}
                  </span>
                </div>
                <span className="text-xs text-text-dim">{t.desc}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* 2. Zielgruppe */}
      <Section number={nextNum()} label="Zielgruppe" hint="Wähle ein Preset oder eine eigene Persona">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {PERSONA_PRESETS.map((p) => {
            const isCustom = p.id === "custom";
            const active = isCustom ? (personaId !== null) : personaPreset === p.id;
            return (
              <button key={p.id} onClick={() => {
                if (isCustom) {
                  setPersonaPreset(null);
                  // Falls nur eine Persona vorhanden: direkt auswählen
                  if (customProfiles.length === 1) {
                    setPersonaId(customProfiles[0].id);
                    setAgentCount(customProfiles[0].agent_count_default || 200);
                  } else {
                    setPersonaId(personaId ?? ""); // Dropdown öffnen
                  }
                } else {
                  setPersonaPreset(p.id);
                  setPersonaId(null);
                  if (p.agents) setAgentCount(p.agents);
                }
              }}
                className="flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 cursor-pointer"
                style={{
                  border: `2px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: active ? "var(--color-accent-glow)" : "transparent",
                }}>
                <svg className="w-5 h-5 shrink-0" fill="none" stroke={active ? "var(--color-accent)" : "var(--color-text-dim)"} strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                </svg>
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)", color: active ? "var(--color-accent)" : "var(--color-text)" }}>
                    {p.label}
                  </div>
                  <div className="text-xs text-text-dim">{p.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Persona Profiles — sichtbar wenn kein Preset gewählt */}
        {!personaPreset && (
          <div className="mt-3 animate-slide-up">
            {customProfiles.length > 0 ? (
              <div className="space-y-2">
                <select value={personaId ?? ""} onChange={(e) => {
                  const id = e.target.value || null;
                  setPersonaId(id);
                  setPersonaPreset(null);
                  if (id) {
                    const profile = customProfiles.find(p => p.id === id);
                    if (profile?.agent_count_default) setAgentCount(profile.agent_count_default);
                  }
                }}
                  className="input cursor-pointer">
                  <option value="">Eigene Persona wählen...</option>
                  {customProfiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.agent_count_default} Agenten)</option>
                  ))}
                </select>
                <a href="/personas/new" className="text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: "var(--color-accent)" }}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Neue Persona erstellen
                </a>
              </div>
            ) : (
              <div className="card p-4 flex items-center justify-between">
                <p className="text-sm text-text-muted">Du hast noch keine eigenen Personas erstellt.</p>
                <a href="/personas/new" className="btn-primary text-xs px-3 py-1.5">Persona erstellen</a>
              </div>
            )}
          </div>
        )}

        {/* Agent Count */}
        <div className="mt-5">
          <div className="text-xs font-semibold text-text-dim mb-2.5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
            AGENTEN-ANZAHL: <span className="text-accent">{agentCount}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {AGENT_COUNTS.map((n) => (
              <button key={n} onClick={() => setAgentCount(n)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 cursor-pointer"
                style={{
                  fontFamily: "var(--font-mono)",
                  border: `1.5px solid ${agentCount === n ? "var(--color-accent)" : "var(--color-border)"}`,
                  background: agentCount === n ? "var(--color-accent-glow)" : "transparent",
                  color: agentCount === n ? "var(--color-accent)" : "var(--color-text-dim)",
                }}>
                {n >= 1000 ? `${n / 1000}k` : n}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-dim mt-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            {AGENT_COUNT_HINTS[agentCount] ?? AGENT_COUNT_HINTS[200]}
          </p>
        </div>
      </Section>

      {/* --- Dynamic Input Blocks --- */}

      {/* Copy Testing: Text Variants */}
      {config.needs.includes("variants") && (
        <Section number={nextNum()} label="Varianten" hint={`${config.minVariants}-${config.maxVariants} Varianten vergleichen`}>
          <div className="flex flex-col gap-3">
            {variants.map((v, i) => (
              <div key={i} className="relative">
                <div className="text-xs font-bold mb-1"
                  style={{ fontFamily: "var(--font-mono)", color: config.color, letterSpacing: "0.05em" }}>
                  {String.fromCharCode(65 + i)}
                </div>
                <AutoTextarea value={v} onChange={(val) => { const next = [...variants]; next[i] = val; setVariants(next); }}
                  placeholder={config.variantPlaceholder ?? `Variante ${i + 1}...`} rows={2} />
                {variants.length > (config.minVariants ?? 2) && (
                  <button onClick={() => setVariants(variants.filter((_, j) => j !== i))}
                    className="absolute right-3 top-3 text-text-dim hover:text-red transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {variants.length < (config.maxVariants ?? 5) && (
            <button onClick={() => setVariants([...variants, ""])}
              className="mt-3 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-display)", color: config.color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Variante hinzufügen
            </button>
          )}
        </Section>
      )}

      {/* Offer Description (product, pricing) */}
      {config.needs.includes("offer") && (
        <Section number={nextNum()} label="Angebot beschreiben" hint="Was genau wird angeboten? Je konkreter, desto besser die Simulation.">
          <AutoTextarea value={offer} onChange={setOffer}
            placeholder="z.B. 'Online-Kurs: Instagram-Marketing für Coaches. 8 Module, 40 Videos, Community-Zugang. Ergebnis: Erste zahlende Kunden über Instagram in 90 Tagen.'"
            rows={4} />
        </Section>
      )}

      {/* Single Price (product) */}
      {config.needs.includes("pricing_single") && (
        <Section number={nextNum()} label="Preis" hint="Optional: Preis und Zahlungsmodell angeben">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={priceSingle.price} onChange={(e) => setPriceSingle({ ...priceSingle, price: e.target.value })}
              placeholder="z.B. 497€" className="input" style={{ fontFamily: "var(--font-mono)" }} />
            <select value={priceSingle.paymentModel} onChange={(e) => setPriceSingle({ ...priceSingle, paymentModel: e.target.value })}
              className="input cursor-pointer">
              <option value="">Zahlungsmodell wählen...</option>
              <option value="einmalig">Einmalzahlung</option>
              <option value="monatlich">Monatlich</option>
              <option value="jaehrlich">Jährlich</option>
              <option value="raten">Ratenzahlung</option>
              <option value="kostenlos">Kostenlos</option>
            </select>
          </div>
        </Section>
      )}

      {/* Price Variants (pricing) */}
      {config.needs.includes("price_variants") && (
        <Section number={nextNum()} label="Preispunkte" hint="Teste verschiedene Preise für das gleiche Angebot">
          <div className="flex flex-col gap-2.5">
            {priceVariants.map((pv, i) => (
              <div key={i} className="flex gap-2.5 items-center">
                <span className="text-xs font-bold w-4 shrink-0" style={{ fontFamily: "var(--font-mono)", color: config.color }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <input value={pv.price} onChange={(e) => { const next = [...priceVariants]; next[i] = { ...next[i], price: e.target.value }; setPriceVariants(next); }}
                  placeholder="z.B. 497€" className="input w-28 shrink-0" style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }} />
                <input value={pv.label} onChange={(e) => { const next = [...priceVariants]; next[i] = { ...next[i], label: e.target.value }; setPriceVariants(next); }}
                  placeholder="Bezeichnung (optional)" className="input flex-1" />
                {priceVariants.length > 2 && (
                  <button onClick={() => setPriceVariants(priceVariants.filter((_, j) => j !== i))}
                    className="text-text-dim hover:text-red transition-colors cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          {priceVariants.length < 5 && (
            <button onClick={() => setPriceVariants([...priceVariants, { price: "", label: "" }])}
              className="mt-3 text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-display)", color: config.color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Preispunkt hinzufügen
            </button>
          )}
        </Section>
      )}

      {/* Ad Variants */}
      {config.needs.includes("ad_variants") && (
        <Section number={nextNum()} label="Ad Creatives" hint="Teste Anzeigentexte gegeneinander. Bild-Upload kommt bald - aktuell werden nur Texte verglichen.">
          {adVariants.map((av, i) => (
            <div key={i} className="card p-4 mb-3">
              <div className="text-xs font-bold mb-3" style={{ fontFamily: "var(--font-mono)", color: config.color, letterSpacing: "0.05em" }}>
                VARIANTE {String.fromCharCode(65 + i)}
              </div>
              <div className="space-y-2.5">
                <AutoTextarea value={av.text} onChange={(val) => { const next = [...adVariants]; next[i] = { ...next[i], text: val }; setAdVariants(next); }}
                  placeholder="Anzeigentext, z.B. 'Schluss mit Rätselraten. Teste deine Ads bevor du Budget verbrennst.'" rows={2} />
                <input value={av.headline} onChange={(e) => { const next = [...adVariants]; next[i] = { ...next[i], headline: e.target.value }; setAdVariants(next); }}
                  placeholder="Headline (optional)" className="input" />
                <input value={av.cta} onChange={(e) => { const next = [...adVariants]; next[i] = { ...next[i], cta: e.target.value }; setAdVariants(next); }}
                  placeholder="CTA-Text (optional)" className="input" />
              </div>
            </div>
          ))}
          {adVariants.length < 4 && (
            <button onClick={() => setAdVariants([...adVariants, { text: "", headline: "", cta: "" }])}
              className="text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-display)", color: config.color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Variante hinzufügen
            </button>
          )}
        </Section>
      )}

      {/* Ad Meta */}
      {config.needs.includes("ad_meta") && (
        <Section number={nextNum()} label="Anzeigen-Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={adPlatform} onChange={(e) => setAdPlatform(e.target.value)} className="input cursor-pointer">
              <option value="">Plattform wählen...</option>
              <option value="meta">Meta (Facebook/Instagram)</option>
              <option value="google">Google Ads</option>
              <option value="linkedin">LinkedIn</option>
              <option value="tiktok">TikTok</option>
              <option value="x">X (Twitter)</option>
              <option value="andere">Andere</option>
            </select>
            <select value={adFormat} onChange={(e) => setAdFormat(e.target.value)} className="input cursor-pointer">
              <option value="">Format wählen...</option>
              <option value="feed">Feed Post</option>
              <option value="story">Story</option>
              <option value="carousel">Carousel</option>
              <option value="video">Video Thumbnail</option>
              <option value="banner">Banner</option>
            </select>
          </div>
        </Section>
      )}

      {/* URLs (landing page) */}
      {config.needs.includes("urls") && (
        <Section number={nextNum()} label="URLs" hint="SimTest crawlt die Seite und simuliert Nutzerreaktionen">
          {urls.map((u, i) => (
            <div key={i} className="flex gap-2.5 mb-2.5 items-center">
              {urls.length > 1 && (
                <span className="text-xs font-bold w-4 shrink-0" style={{ fontFamily: "var(--font-mono)", color: config.color }}>
                  {String.fromCharCode(65 + i)}
                </span>
              )}
              <input value={u} onChange={(e) => { const next = [...urls]; next[i] = e.target.value; setUrls(next); }}
                placeholder="https://deine-landingpage.de" className="input flex-1" style={{ fontFamily: "var(--font-mono)" }} />
              {urls.length > 1 && (
                <button onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                  className="text-text-dim hover:text-red transition-colors cursor-pointer">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {urls.length < 3 && (
            <button onClick={() => setUrls([...urls, ""])}
              className="text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{ fontFamily: "var(--font-display)", color: config.color }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              URL zum Vergleichen
            </button>
          )}
        </Section>
      )}

      {/* Landing Goal */}
      {config.needs.includes("landing_goal") && (
        <Section number={nextNum()} label="Seitenziel">
          <select value={landingGoal} onChange={(e) => setLandingGoal(e.target.value)} className="input cursor-pointer mb-3">
            <option value="">Seitenziel wählen...</option>
            <option value="lead">Lead-Generierung</option>
            <option value="sale">Verkauf</option>
            <option value="newsletter">Newsletter-Anmeldung</option>
            <option value="booking">Termin buchen</option>
            <option value="download">App-Download</option>
            <option value="info">Informieren</option>
            <option value="other">Anderes</option>
          </select>
          <input value={desiredAction} onChange={(e) => setDesiredAction(e.target.value)}
            placeholder="Gewünschte Aktion, z.B. 'Nutzer soll Erstgespräch buchen'" className="input" />
        </Section>
      )}

      {/* Campaign Brief */}
      {config.needs.includes("campaign_brief") && (
        <Section number={nextNum()} label="Kampagnen-Briefing" hint="Beschreibe die Kampagne: Botschaft, Angebot, Zeitraum">
          <AutoTextarea value={campaignBrief} onChange={setCampaignBrief}
            placeholder="z.B. 'Launch-Kampagne für neuen Online-Kurs. 3 E-Mails + Meta Ads + Organisch auf LinkedIn. Kernbotschaft: In 8 Wochen zum zertifizierten Coach.'"
            rows={5} />
          <div className="mt-4">
            <p className="text-xs font-bold text-text-dim mb-2" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>KAMPAGNENZIEL</p>
            <input value={campaignGoal} onChange={(e) => setCampaignGoal(e.target.value)}
              placeholder="z.B. '200 Anmeldungen in 14 Tagen' oder '500 Leads generieren'"
              className="input mb-4" />
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-text-dim mb-2" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>KANÄLE</p>
            <div className="flex flex-wrap gap-2">
              {["E-Mail", "Meta Ads", "Google Ads", "LinkedIn", "Instagram", "TikTok", "YouTube", "Blog/SEO", "Podcast"].map(ch => (
                <button key={ch} onClick={() => setCampaignChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                  style={{
                    border: `1.5px solid ${campaignChannels.includes(ch) ? config.color : "var(--color-border)"}`,
                    background: campaignChannels.includes(ch) ? `${config.color}0a` : "transparent",
                    color: campaignChannels.includes(ch) ? config.color : "var(--color-text-dim)",
                  }}>
                  {ch}
                </button>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* Crisis Message */}
      {config.needs.includes("crisis_message") && (
        <Section number={nextNum()} label="Kritische Nachricht" hint="Welche Nachricht willst du testen? Was könnte die Community aufwühlen?">
          <AutoTextarea value={crisisMessage} onChange={setCrisisMessage}
            placeholder="z.B. 'Wir erhöhen unsere Preise um 40% ab nächstem Monat'" rows={3} />
        </Section>
      )}

      {/* Crisis Meta */}
      {config.needs.includes("crisis_meta") && (
        <Section number={nextNum()} label="Krisendetails">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <select value={crisisType} onChange={(e) => setCrisisType(e.target.value)} className="input cursor-pointer">
              <option value="">Art der Krise...</option>
              <option value="price_increase">Preiserhöhung</option>
              <option value="product_change">Produktänderung</option>
              <option value="team_change">Team-Veränderung</option>
              <option value="bad_press">Negative Presse</option>
              <option value="data_breach">Datenpanne</option>
              <option value="outage">Service-Ausfall</option>
              <option value="other">Andere</option>
            </select>
            <select value={crisisChannel} onChange={(e) => setCrisisChannel(e.target.value)} className="input cursor-pointer">
              <option value="">Kommunikationskanal...</option>
              <option value="email">E-Mail an Kunden</option>
              <option value="social">Social Media Post</option>
              <option value="blog">Blog-Artikel</option>
              <option value="press">Pressemitteilung</option>
              <option value="personal">Persönliche Nachricht</option>
            </select>
          </div>
          <button onClick={() => setCounterEnabled(!counterEnabled)}
            className="flex items-center gap-2 text-sm cursor-pointer mb-3"
            style={{ color: counterEnabled ? "var(--color-accent)" : "var(--color-text-dim)" }}>
            <div className="w-5 h-5 rounded border-2 flex items-center justify-center transition-all"
              style={{ borderColor: counterEnabled ? "var(--color-accent)" : "var(--color-border)", background: counterEnabled ? "var(--color-accent-glow)" : "transparent" }}>
              {counterEnabled && <svg className="w-3 h-3" fill="none" stroke="var(--color-accent)" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
            </div>
            Gegenmaßnahme mitsimulieren?
          </button>
          {counterEnabled && (
            <AutoTextarea value={counterMessage} onChange={setCounterMessage}
              placeholder="Wie willst du reagieren? z.B. 'Wir bieten Bestandskunden 6 Monate Preisgarantie'" rows={3} />
          )}
        </Section>
      )}

      {/* Strategy */}
      {config.needs.includes("strategy_idea") && (
        <Section number={nextNum()} label="Geschäftsidee" hint="Beschreibe die Idee, das Produkt oder die Strategie, die du validieren willst">
          <AutoTextarea value={strategyIdea} onChange={setStrategyIdea}
            placeholder="z.B. 'SaaS-Tool das KMUs erlaubt, Marketingtexte vor der Veröffentlichung an KI-Personas zu testen. Monatliches Abo ab 12 EUR.'"
            rows={5} />
        </Section>
      )}
      {config.needs.includes("strategy_market") && (
        <Section number={nextNum()} label="Markt & Wettbewerb" hint="Beschreibe den Zielmarkt und bekannte Alternativen">
          <div className="space-y-3">
            <input value={strategyMarket} onChange={(e) => setStrategyMarket(e.target.value)}
              placeholder="Zielmarkt, z.B. 'KMUs im DACH-Raum mit Marketing-Budget unter 5000 EUR/Monat'"
              className="input" />
            <input value={strategyCompetitors} onChange={(e) => setStrategyCompetitors(e.target.value)}
              placeholder="Wettbewerber / Alternativen, z.B. 'Typeform Umfragen, echte Fokusgruppen, gar nichts'"
              className="input" />
            <input value={strategyPricing} onChange={(e) => setStrategyPricing(e.target.value)}
              placeholder="Geplante Preisgestaltung, z.B. '12/34/89 EUR monatlich, 3 Stufen'"
              className="input" />
          </div>
        </Section>
      )}

      {/* Zielgruppen-Wärme */}
      <Section number={nextNum()} label="Kaufbereitschaft" hint="Wie bewusst ist die Zielgruppe ihr Problem? Beeinflusst die Reaktionstiefe.">
        <div className="flex gap-2">
          {([
            { id: "cold" as AudienceWarmth, label: "Kalt", desc: "Stößt zufällig darauf" },
            { id: "warm" as AudienceWarmth, label: "Warm", desc: "Sucht aktiv nach Lösung" },
            { id: "hot" as AudienceWarmth, label: "Heiß", desc: "Vergleicht Anbieter" },
          ]).map(w => (
            <button key={w.id} onClick={() => setAudienceWarmth(w.id)}
              className="flex-1 p-3 rounded-xl text-left transition-all cursor-pointer"
              style={{
                border: `2px solid ${audienceWarmth === w.id ? "var(--color-accent)" : "var(--color-border)"}`,
                background: audienceWarmth === w.id ? "var(--color-accent-glow)" : "transparent",
              }}>
              <span className="text-sm font-semibold block" style={{
                fontFamily: "var(--font-display)",
                color: audienceWarmth === w.id ? "var(--color-accent)" : "var(--color-text)",
              }}>{w.label}</span>
              <span className="text-xs text-text-dim">{w.desc}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Fokus-Frage */}
      <Section number={nextNum()} label="Fokus-Frage" hint="Optional: Lenke die Simulation auf eine bestimmte Frage">
        <AutoTextarea value={focusQuestion} onChange={setFocusQuestion}
          placeholder="z.B. 'Welche Variante weckt mehr Vertrauen?' oder 'Würden die Agenten das Produkt weiterempfehlen?'" rows={2} />
      </Section>

      {/* Kontext */}
      <Section number={nextNum()} label="Kontext" hint={config.contextHint}>
        <AutoTextarea value={context} onChange={setContext}
          placeholder="Hintergrund-Infos die die Simulation realistischer machen..." rows={3} />
      </Section>

      {/* Advanced Settings */}
      <div className="mb-9">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-xs text-text-dim font-medium cursor-pointer py-2"
          style={{ fontFamily: "var(--font-mono)" }}>
          <span className="transition-transform duration-200" style={{ transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>
            ▸
          </span>
          ERWEITERTE EINSTELLUNGEN
        </button>
        {showAdvanced && (
          <div className="mt-3 card p-5 animate-slide-up">
            <p className="text-xs font-bold text-text-dim mb-3" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
              SIMULATIONSTIEFE
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {([
                { id: "fast" as SimDepth, label: "Schnell", desc: "1 Runde, Grundreaktionen", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
                { id: "balanced" as SimDepth, label: "Ausgewogen", desc: "3 Runden, mit Social Spread", icon: "M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75" },
                { id: "deep" as SimDepth, label: "Tiefenanalyse", desc: "5+ Runden, volle Interaktion", icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" },
              ]).map(s => (
                <button key={s.id} onClick={() => setSimDepth(s.id)}
                  className="p-3 rounded-xl text-left transition-all cursor-pointer"
                  style={{
                    border: `1.5px solid ${simDepth === s.id ? "var(--color-accent)" : "var(--color-border)"}`,
                    background: simDepth === s.id ? "var(--color-accent-glow)" : "transparent",
                  }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke={simDepth === s.id ? "var(--color-accent)" : "var(--color-text-dim)"} strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                    <span className="text-xs font-semibold" style={{ color: simDepth === s.id ? "var(--color-accent)" : "var(--color-text)" }}>{s.label}</span>
                  </div>
                  <span className="text-[10px] text-text-dim">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Cost Preview */}
      <div className="flex items-center justify-between p-4 rounded-xl mb-5" style={{
        background: "var(--color-accent-glow)",
        border: "1px solid var(--color-accent)",
        borderColor: `${config.color}30`,
      }}>
        <div>
          <div className="text-xs font-semibold text-accent" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>
            GESCHÄTZTER VERBRAUCH
          </div>
          <div className="text-xs text-text-muted mt-0.5">
            {agentCount} Agenten · {rounds === 1 ? "1 Runde" : `${rounds} Runden`}
          </div>
        </div>
        <div className="text-lg font-bold text-accent" style={{ fontFamily: "var(--font-mono)" }}>
          ~{estimatedCost.toFixed(3)}€
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-red">{error}</p>
        </div>
      )}

      {/* CTA */}
      <button onClick={handleSubmit} disabled={loading}
        className="btn-primary w-full text-base flex items-center justify-center gap-2.5 py-4"
        style={{ borderRadius: 14, boxShadow: `0 4px 14px ${config.color}30` }}>
        {loading ? (
          <>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Simulation wird gestartet...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            Simulation starten
          </>
        )}
      </button>

      <p className="text-center text-xs text-text-dim mt-3 mb-8">
        Ergebnisse in ca. {simDepth === "fast" ? "30 Sek." : simDepth === "balanced" ? "1-2 Min." : "3-5 Min."} · Keine echten Personen involviert
      </p>
    </div>
  );
}
