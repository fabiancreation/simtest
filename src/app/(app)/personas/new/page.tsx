"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// --- Constants ---

const PRESETS: Record<string, {
  icon: string; label: string; desc: string; name: string; description: string;
  ageRange: [number, number]; genderSplit: { male: number; female: number; diverse: number };
  regions: string[]; urbanRural: string; education: string[]; incomeRange: [number, number];
  platforms: string[]; buyingStyle: string; techAffinity: number; priceSensitivity: number;
  values: string[]; painPoints: string[]; goals: string[]; mediaConsumption: string[];
}> = {
  solo_coach: {
    icon: "M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0",
    label: "Solo-Unternehmer", desc: "Coaches, Berater, Trainer",
    name: "Solo-Unternehmer & Coaches",
    description: "Selbstständige im Bereich Coaching, Beratung und Training. Hauptsächlich online aktiv, bauen Personal Brand auf, verkaufen Wissen als Dienstleistung oder digitale Produkte.",
    ageRange: [28, 50], genderSplit: { male: 40, female: 55, diverse: 5 },
    regions: ["deutschland", "oesterreich", "schweiz"], urbanRural: "urban_leaning",
    education: ["studium", "meister"], incomeRange: [2500, 8000],
    platforms: ["instagram", "linkedin", "email"], buyingStyle: "considered",
    techAffinity: 70, priceSensitivity: 50,
    values: ["freiheit", "wachstum", "authentizitaet"],
    painPoints: ["Kundengewinnung", "Zeitmangel", "Preisfindung", "Content-Erstellung"],
    goals: ["Mehr Kunden", "Passives Einkommen", "Sichtbarkeit aufbauen"],
    mediaConsumption: ["podcasts", "youtube", "newsletter"],
  },
  ecom_buyer: {
    icon: "M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z",
    label: "E-Com Käufer", desc: "Online-Shopper, preisbewusst",
    name: "E-Commerce Käufer (DACH)",
    description: "Menschen die regelmäßig online einkaufen. Vergleichen Preise, lesen Bewertungen, reagieren auf Angebote und Social Proof.",
    ageRange: [22, 45], genderSplit: { male: 48, female: 50, diverse: 2 },
    regions: ["deutschland"], urbanRural: "mixed",
    education: ["ausbildung", "studium"], incomeRange: [1800, 4500],
    platforms: ["instagram", "tiktok", "google"], buyingStyle: "impulsive_mixed",
    techAffinity: 75, priceSensitivity: 75,
    values: ["preis_leistung", "bequemlichkeit", "qualitaet"],
    painPoints: ["Zu viel Auswahl", "Vertrauen in neue Shops", "Versandkosten"],
    goals: ["Gutes Angebot finden", "Zeit sparen", "Qualität bekommen"],
    mediaConsumption: ["social_media", "youtube", "vergleichsportale"],
  },
  b2b_decision: {
    icon: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
    label: "B2B Entscheider", desc: "KMU-Geschäftsführer, Teamleads",
    name: "B2B Entscheider (KMU)",
    description: "Geschäftsführer, Abteilungsleiter und Teamleads in kleinen und mittleren Unternehmen. Treffen Kaufentscheidungen für ihr Team oder Unternehmen. ROI-orientiert, wenig Zeit.",
    ageRange: [32, 55], genderSplit: { male: 62, female: 35, diverse: 3 },
    regions: ["deutschland", "oesterreich", "schweiz"], urbanRural: "urban_leaning",
    education: ["studium", "promotion"], incomeRange: [4500, 12000],
    platforms: ["linkedin", "email", "google"], buyingStyle: "rational",
    techAffinity: 60, priceSensitivity: 30,
    values: ["effizienz", "zuverlaessigkeit", "roi"],
    painPoints: ["Fachkräftemangel", "Digitalisierung", "Zeitdruck", "Budget-Rechtfertigung"],
    goals: ["Prozesse optimieren", "Team entlasten", "Wettbewerbsvorteil"],
    mediaConsumption: ["fachmedien", "linkedin", "podcasts", "newsletter"],
  },
  gen_z: {
    icon: "M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3",
    label: "Gen Z", desc: "18-27, digital native",
    name: "Gen Z (DACH)",
    description: "18-27 Jahre, aufgewachsen mit Smartphone und Social Media. Werteorientiert, skeptisch gegenüber klassischer Werbung, reagieren auf Authentizität und Creator-Content.",
    ageRange: [18, 27], genderSplit: { male: 45, female: 48, diverse: 7 },
    regions: ["deutschland"], urbanRural: "urban",
    education: ["abitur", "studium", "ausbildung"], incomeRange: [800, 2500],
    platforms: ["tiktok", "instagram", "youtube"], buyingStyle: "impulsive_mixed",
    techAffinity: 95, priceSensitivity: 70,
    values: ["authentizitaet", "nachhaltigkeit", "community", "selbstverwirklichung"],
    painPoints: ["Budget-Limits", "Informationsüberflutung", "FOMO"],
    goals: ["Zugehörigkeit", "Gute Deals", "Erlebnisse"],
    mediaConsumption: ["tiktok", "youtube_shorts", "instagram_reels", "podcasts"],
  },
};

const REGION_OPTIONS = [
  { id: "deutschland", label: "Deutschland" }, { id: "oesterreich", label: "Österreich" },
  { id: "schweiz", label: "Schweiz" }, { id: "andere_eu", label: "Andere EU" },
];

const PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram" }, { id: "tiktok", label: "TikTok" },
  { id: "linkedin", label: "LinkedIn" }, { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" }, { id: "google", label: "Google" },
  { id: "email", label: "E-Mail" }, { id: "podcast", label: "Podcasts" },
];

const VALUE_OPTIONS = [
  { id: "freiheit", label: "Freiheit" }, { id: "sicherheit", label: "Sicherheit" },
  { id: "wachstum", label: "Wachstum" }, { id: "authentizitaet", label: "Authentizität" },
  { id: "nachhaltigkeit", label: "Nachhaltigkeit" }, { id: "effizienz", label: "Effizienz" },
  { id: "qualitaet", label: "Qualität" }, { id: "preis_leistung", label: "Preis-Leistung" },
  { id: "community", label: "Community" }, { id: "innovation", label: "Innovation" },
  { id: "bequemlichkeit", label: "Bequemlichkeit" }, { id: "zuverlaessigkeit", label: "Zuverlässigkeit" },
  { id: "roi", label: "ROI-Orientierung" }, { id: "selbstverwirklichung", label: "Selbstverwirklichung" },
];

const EDUCATION_OPTIONS = [
  { id: "hauptschule", label: "Hauptschule" }, { id: "realschule", label: "Realschule" },
  { id: "abitur", label: "Abitur" }, { id: "ausbildung", label: "Ausbildung" },
  { id: "meister", label: "Meister" }, { id: "studium", label: "Studium" },
  { id: "promotion", label: "Promotion" },
];

const MEDIA_OPTIONS = [
  { id: "social_media", label: "Social Media" }, { id: "podcasts", label: "Podcasts" },
  { id: "youtube", label: "YouTube" }, { id: "newsletter", label: "Newsletter" },
  { id: "fachmedien", label: "Fachmedien" }, { id: "blogs", label: "Blogs" },
  { id: "tiktok", label: "TikTok" }, { id: "youtube_shorts", label: "YT Shorts" },
  { id: "instagram_reels", label: "IG Reels" },
];

const BUYING_STYLES = [
  { id: "impulsive", label: "Impulsiv", desc: "Kauft schnell bei gutem Angebot" },
  { id: "impulsive_mixed", label: "Gemischt", desc: "Mal impulsiv, mal abwägend" },
  { id: "considered", label: "Abwägend", desc: "Recherchiert, vergleicht, entscheidet langsam" },
  { id: "rational", label: "Rational", desc: "Braucht Daten, ROI, Business Case" },
];

const URBAN_OPTIONS = [
  { id: "urban", label: "Städtisch" }, { id: "urban_leaning", label: "Eher städtisch" },
  { id: "mixed", label: "Gemischt" }, { id: "rural_leaning", label: "Eher ländlich" },
  { id: "rural", label: "Ländlich" },
];

// --- Chip Select ---
function ChipGrid({ options, selected, onChange, multi = true, cols = 3 }: {
  options: { id: string; label: string }[]; selected: string[] | string;
  onChange: (v: string[] | string) => void; multi?: boolean; cols?: number;
}) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => {
        const active = multi ? (selected as string[]).includes(o.id) : selected === o.id;
        return (
          <button key={o.id} type="button" onClick={() => {
            if (multi) {
              const sel = selected as string[];
              onChange(sel.includes(o.id) ? sel.filter(s => s !== o.id) : [...sel, o.id]);
            } else { onChange(o.id); }
          }}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer text-center"
            style={{
              border: `1.5px solid ${active ? "var(--color-accent)" : "var(--color-border)"}`,
              background: active ? "var(--color-accent-glow)" : "transparent",
              color: active ? "var(--color-accent)" : "var(--color-text-dim)",
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

// --- Tag Input ---
function TagInput({ tags, onChange, placeholder }: {
  tags: string[]; onChange: (t: string[]) => void; placeholder: string;
}) {
  const [inp, setInp] = useState("");
  return (
    <div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {tags.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: "var(--color-accent-glow)", color: "var(--color-accent)" }}>
              {t}
              <button onClick={() => onChange(tags.filter((_, j) => j !== i))}
                className="hover:opacity-70 cursor-pointer" style={{ color: "var(--color-accent)" }}>×</button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && inp.trim()) { e.preventDefault(); onChange([...tags, inp.trim()]); setInp(""); } }}
          placeholder={placeholder} className="input flex-1" />
        <button type="button" onClick={() => { if (inp.trim()) { onChange([...tags, inp.trim()]); setInp(""); } }}
          className="px-4 rounded-lg text-sm font-semibold cursor-pointer transition-colors"
          style={{ background: "var(--color-accent-glow)", border: "1px solid var(--color-accent)", color: "var(--color-accent)" }}>+</button>
      </div>
    </div>
  );
}

// --- Range Slider ---
function RangeSlider({ min, max, value, onChange, unit = "", step = 1 }: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void; unit?: string; step?: number;
}) {
  const fmt = (v: number) => `${v.toLocaleString("de-DE")}${unit}`;
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm font-semibold text-accent" style={{ fontFamily: "var(--font-mono)" }}>{fmt(value[0])}</span>
        <span className="text-xs text-text-dim">bis</span>
        <span className="text-sm font-semibold text-accent" style={{ fontFamily: "var(--font-mono)" }}>{fmt(value[1])}</span>
      </div>
      <div className="flex gap-2.5 items-center">
        <input type="range" min={min} max={max} step={step} value={value[0]}
          onChange={e => onChange([Math.min(+e.target.value, value[1] - step), value[1]])}
          className="flex-1 accent-accent cursor-pointer" />
        <input type="range" min={min} max={max} step={step} value={value[1]}
          onChange={e => onChange([value[0], Math.max(+e.target.value, value[0] + step)])}
          className="flex-1 accent-accent cursor-pointer" />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-dim">{fmt(min)}</span>
        <span className="text-[10px] text-text-dim">{fmt(max)}</span>
      </div>
    </div>
  );
}

// --- Single Slider ---
function SingleSlider({ min, max, value, onChange, leftLabel, rightLabel }: {
  min: number; max: number; value: number; onChange: (v: number) => void; leftLabel: string; rightLabel: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(+e.target.value)}
          className="flex-1 accent-accent cursor-pointer" />
        <span className="text-sm font-semibold text-accent w-10 text-right" style={{ fontFamily: "var(--font-mono)" }}>{value}%</span>
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-text-dim">{leftLabel}</span>
        <span className="text-[10px] text-text-dim">{rightLabel}</span>
      </div>
    </div>
  );
}

// --- Gender Split ---
function GenderSplit({ value, onChange }: {
  value: { male: number; female: number; diverse: number };
  onChange: (v: { male: number; female: number; diverse: number }) => void;
}) {
  const adjust = (key: "male" | "female" | "diverse", delta: number) => {
    const keys: ("male" | "female" | "diverse")[] = ["male", "female", "diverse"];
    const next = { ...value };
    next[key] = Math.max(0, Math.min(100, next[key] + delta));
    const diff = next[key] - value[key];
    const others = keys.filter(k => k !== key);
    const totalOther = others.reduce((s, k) => s + value[k], 0);
    if (totalOther > 0) others.forEach(k => { next[k] = Math.max(0, Math.round(value[k] - (diff * value[k]) / totalOther)); });
    const sum = keys.reduce((s, k) => s + next[k], 0);
    if (sum !== 100) next[others[0]] += 100 - sum;
    onChange(next);
  };

  const items = [
    { key: "male" as const, label: "Männlich", color: "#3B82F6" },
    { key: "female" as const, label: "Weiblich", color: "#EC4899" },
    { key: "diverse" as const, label: "Divers", color: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {items.map(({ key, label, color }) => (
        <div key={key} className="text-center p-3 rounded-xl" style={{ border: "1px solid var(--color-border)", background: "var(--color-bg)" }}>
          <div className="text-[10px] text-text-dim mb-1.5">{label}</div>
          <div className="flex items-center justify-center gap-1">
            <button type="button" onClick={() => adjust(key, -5)} className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer"
              style={{ border: "1px solid var(--color-border)" }}>-</button>
            <span className="text-sm font-bold min-w-[32px]" style={{ fontFamily: "var(--font-mono)", color }}>{value[key]}%</span>
            <button type="button" onClick={() => adjust(key, 5)} className="w-5 h-5 rounded flex items-center justify-center text-xs cursor-pointer"
              style={{ border: "1px solid var(--color-border)" }}>+</button>
          </div>
          <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${value[key]}%`, background: color }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Field Block ---
function FieldBlock({ label, hint, aiHint = true, children }: {
  label: string; hint?: string; aiHint?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold uppercase tracking-wider text-text-dim mb-1" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{label}</div>
      {hint && <p className="text-xs text-text-dim mb-1">{hint}</p>}
      {aiHint && <p className="text-[10px] text-purple mb-2.5 italic">Wird von AI geschätzt wenn leer gelassen</p>}
      {children}
    </div>
  );
}

// --- Wizard Steps ---
const STEPS = [
  { id: "basics", label: "Grundlagen", icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" },
  { id: "demographics", label: "Demografie", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747" },
  { id: "psychographics", label: "Psychografie", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813" },
  { id: "behavior", label: "Verhalten", icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" },
  { id: "review", label: "Übersicht", icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

// =============================================
// MAIN COMPONENT
// =============================================

export default function NewPersonaPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"quick" | "expert">("quick");
  const [phase, setPhase] = useState<"input" | "loading" | "review">("input");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(0);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [ageRange, setAgeRange] = useState<[number, number]>([25, 45]);
  const [genderSplit, setGenderSplit] = useState({ male: 48, female: 48, diverse: 4 });
  const [regions, setRegions] = useState<string[]>([]);
  const [urbanRural, setUrbanRural] = useState("mixed");
  const [education, setEducation] = useState<string[]>([]);
  const [incomeRange, setIncomeRange] = useState<[number, number]>([2000, 5000]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [buyingStyle, setBuyingStyle] = useState("considered");
  const [techAffinity, setTechAffinity] = useState(60);
  const [priceSensitivity, setPriceSensitivity] = useState(50);
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [painPoints, setPainPoints] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [mediaConsumption, setMediaConsumption] = useState<string[]>([]);
  const [showOptional, setShowOptional] = useState(false);

  // AI result
  const [aiResult, setAiResult] = useState<Record<string, unknown> | null>(null);
  const [aiEstimated, setAiEstimated] = useState<string[]>([]);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [aiReasoning, setAiReasoning] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const descRef = useRef<HTMLTextAreaElement>(null);

  function loadPreset(key: string) {
    const p = PRESETS[key];
    setSelectedPreset(key);
    setName(p.name); setDescription(p.description);
    setAgeRange(p.ageRange); setGenderSplit(p.genderSplit);
    setRegions(p.regions); setUrbanRural(p.urbanRural);
    setEducation(p.education); setIncomeRange(p.incomeRange);
    setPlatforms(p.platforms); setBuyingStyle(p.buyingStyle);
    setTechAffinity(p.techAffinity); setPriceSensitivity(p.priceSensitivity);
    setCoreValues(p.values); setPainPoints(p.painPoints);
    setGoals(p.goals); setMediaConsumption(p.mediaConsumption);
  }

  function clearAll() {
    setSelectedPreset(null); setName(""); setDescription("");
    setAgeRange([25, 45]); setGenderSplit({ male: 48, female: 48, diverse: 4 });
    setRegions([]); setUrbanRural("mixed"); setEducation([]); setIncomeRange([2000, 5000]);
    setPlatforms([]); setBuyingStyle("considered"); setTechAffinity(60); setPriceSensitivity(50);
    setCoreValues([]); setPainPoints([]); setGoals([]); setMediaConsumption([]);
    setAiResult(null); setPhase("input"); setShowOptional(false); setError("");
  }

  async function handleGenerate() {
    if (description.trim().length < 20) { setError("Mindestens 20 Zeichen Beschreibung."); return; }
    setError("");
    setPhase("loading");
    try {
      const res = await fetch("/api/personas/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description, name: name || undefined,
          ageRange: regions.length > 0 ? ageRange : undefined,
          regions: regions.length > 0 ? regions : undefined,
          platforms: platforms.length > 0 ? platforms : undefined,
          values: coreValues.length > 0 ? coreValues : undefined,
          painPoints: painPoints.length > 0 ? painPoints : undefined,
          goals: goals.length > 0 ? goals : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiResult(data);
      setAiEstimated(data.aiEstimated ?? []);
      setAiConfidence(data.confidence ?? 70);
      setAiReasoning(data.reasoning ?? "");
      // Apply AI results to form
      if (data.name && !name) setName(data.name);
      if (data.ageRange) setAgeRange(data.ageRange);
      if (data.genderSplit) setGenderSplit(data.genderSplit);
      if (data.regions?.length && regions.length === 0) setRegions(data.regions);
      if (data.urbanRural) setUrbanRural(data.urbanRural);
      if (data.education?.length) setEducation(data.education);
      if (data.incomeRange) setIncomeRange(data.incomeRange);
      if (data.platforms?.length && platforms.length === 0) setPlatforms(data.platforms);
      if (data.buyingStyle) setBuyingStyle(data.buyingStyle);
      if (data.techAffinity != null) setTechAffinity(data.techAffinity);
      if (data.priceSensitivity != null) setPriceSensitivity(data.priceSensitivity);
      if (data.values?.length && coreValues.length === 0) setCoreValues(data.values);
      if (data.painPoints?.length && painPoints.length === 0) setPainPoints(data.painPoints);
      if (data.goals?.length && goals.length === 0) setGoals(data.goals);
      if (data.mediaConsumption?.length) setMediaConsumption(data.mediaConsumption);
      setPhase("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI-Enrichment fehlgeschlagen");
      setPhase("input");
    }
  }

  async function handleSave() {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/personas/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Neue Persona",
          description, presetId: selectedPreset,
          ageMin: ageRange[0], ageMax: ageRange[1],
          genderMale: genderSplit.male, genderFemale: genderSplit.female, genderDiverse: genderSplit.diverse,
          regions, urbanRural, education, incomeMin: incomeRange[0], incomeMax: incomeRange[1],
          buyingStyle, coreValues, painPoints, goals,
          platforms, mediaConsumption, techAffinity, priceSensitivity,
          aiEstimatedFields: aiEstimated, aiConfidence, aiReasoning,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/personas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  const confColor = aiConfidence >= 80 ? "var(--color-accent)" : aiConfidence >= 50 ? "var(--color-warning)" : "var(--color-red)";

  // ========== RENDER ==========

  return (
    <div className="max-w-[680px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            {phase === "review" ? "Persona prüfen" : "Neue Persona"}
          </h1>
          <p className="text-text-muted text-sm mt-1">
            {phase === "review" ? "AI hat dein Zielgruppen-Profil erstellt. Prüfe und passe an." : "Beschreibe deine Zielgruppe - SimTest ergänzt den Rest."}
          </p>
        </div>
        {phase !== "input" && (
          <button onClick={clearAll} className="btn-secondary text-xs py-2 px-3">Neu starten</button>
        )}
      </div>

      {/* === INPUT PHASE === */}
      {phase === "input" && (
        <>
          {/* Mode Toggle */}
          {mode === "quick" && !selectedPreset && (
            <div className="flex gap-1 mb-6 p-1 rounded-xl animate-slide-up" style={{ background: "var(--color-bg-elevated)" }}>
              {([["quick", "Schnell"], ["expert", "Experten-Modus"]] as const).map(([m, label]) => (
                <button key={m} onClick={() => setMode(m)}
                  className="flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all cursor-pointer"
                  style={{
                    background: mode === m ? "var(--color-bg-card)" : "transparent",
                    color: mode === m ? "var(--color-text)" : "var(--color-text-dim)",
                    boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  }}>
                  {m === "quick" ? "⚡ " : "🧠 "}{label}
                </button>
              ))}
            </div>
          )}

          {/* === QUICK MODE === */}
          {mode === "quick" && (
            <>
              {/* Presets */}
              {!selectedPreset && (
                <div className="mb-7 animate-slide-up" style={{ animationDelay: "60ms" }}>
                  <p className="text-xs font-bold text-text-dim mb-2.5" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>STARTE MIT EINEM PRESET</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(PRESETS).map(([key, p]) => (
                      <button key={key} onClick={() => loadPreset(key)}
                        className="card-interactive card flex items-center gap-3 p-3.5 text-left cursor-pointer">
                        <svg className="w-5 h-5 shrink-0 text-text-dim" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d={p.icon} />
                        </svg>
                        <div>
                          <div className="text-sm font-semibold" style={{ fontFamily: "var(--font-display)" }}>{p.label}</div>
                          <div className="text-xs text-text-dim">{p.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-xs text-text-dim mt-4">— oder eigene Beschreibung —</p>
                </div>
              )}

              {/* Preset badge */}
              {selectedPreset && (
                <div className="flex items-center gap-2.5 mb-5 p-3 rounded-xl animate-slide-up"
                  style={{ background: "var(--color-accent-glow)", border: "1px solid var(--color-accent)" }}>
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={PRESETS[selectedPreset].icon} />
                  </svg>
                  <span className="text-sm font-semibold text-accent">Preset: {PRESETS[selectedPreset].label}</span>
                  <button onClick={clearAll} className="ml-auto text-xs text-text-dim cursor-pointer">× Entfernen</button>
                </div>
              )}

              {/* Name */}
              <div className="mb-5 animate-slide-up" style={{ animationDelay: "120ms" }}>
                <label className="text-xs font-bold uppercase tracking-wider text-text-dim mb-1.5 block" style={{ fontFamily: "var(--font-mono)" }}>
                  NAME <span className="font-normal normal-case text-text-dim">(optional)</span>
                </label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="AI vergibt einen Namen wenn leer" className="input" />
              </div>

              {/* Description */}
              <div className="mb-5 animate-slide-up" style={{ animationDelay: "180ms" }}>
                <label className="text-xs font-bold uppercase tracking-wider text-text-dim mb-1.5 block" style={{ fontFamily: "var(--font-mono)" }}>
                  BESCHREIBUNG <span className="text-red">*</span>
                </label>
                <textarea ref={descRef} value={description} onChange={e => setDescription(e.target.value)} rows={4}
                  placeholder="Beschreibe deine Zielgruppe in eigenen Worten. z.B. 'Frauen zwischen 25 und 40 die sich für Fitness interessieren und online einkaufen'"
                  className="input resize-none" />
                {description.length > 0 && description.length < 20 && (
                  <p className="text-xs text-red mt-1">Noch {20 - description.length} Zeichen...</p>
                )}
                <div className="mt-2 p-3 rounded-lg text-xs text-text-dim" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)" }}>
                  Das ist alles was SimTest braucht. Schreibe einfach wer deine Kunden sind - die AI ergänzt den Rest.
                </div>
              </div>

              {/* Optional Quick Fields */}
              <div className="mb-7 animate-slide-up" style={{ animationDelay: "240ms" }}>
                <button type="button" onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-2 text-xs text-text-dim font-medium cursor-pointer py-2"
                  style={{ fontFamily: "var(--font-mono)" }}>
                  <span className="transition-transform duration-200" style={{ transform: showOptional ? "rotate(90deg)" : "none", display: "inline-block" }}>▸</span>
                  OPTIONALE DETAILS
                </button>
                {showOptional && (
                  <div className="mt-3 card p-5 space-y-6 animate-slide-up">
                    <FieldBlock label="Region">
                      <ChipGrid options={REGION_OPTIONS} selected={regions} onChange={v => setRegions(v as string[])} cols={2} />
                    </FieldBlock>
                    <FieldBlock label="Altersrange">
                      <RangeSlider min={16} max={75} value={ageRange} onChange={setAgeRange} unit=" J." />
                    </FieldBlock>
                    <FieldBlock label="Aktive Plattformen">
                      <ChipGrid options={PLATFORM_OPTIONS} selected={platforms} onChange={v => setPlatforms(v as string[])} cols={3} />
                    </FieldBlock>
                  </div>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
                  <p className="text-sm text-red">{error}</p>
                </div>
              )}

              {/* CTA */}
              <button onClick={handleGenerate} disabled={description.trim().length < 20}
                className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Persona generieren
              </button>
              <p className="text-center text-xs text-text-dim mt-2.5">
                Oder <button onClick={() => setMode("expert")} className="text-accent font-semibold cursor-pointer">im Experten-Modus</button> alle Details selbst konfigurieren
              </p>
            </>
          )}

          {/* === EXPERT MODE === */}
          {mode === "expert" && (
            <>
              {/* Step Nav */}
              <div className="flex gap-1 mb-7 p-1 rounded-xl" style={{ background: "var(--color-bg-elevated)" }}>
                {STEPS.map((s, i) => (
                  <button key={s.id} onClick={() => setWizardStep(i)}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: wizardStep === i ? "var(--color-bg-card)" : "transparent",
                      boxShadow: wizardStep === i ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    }}>
                    <svg className="w-4 h-4" fill="none" stroke={wizardStep === i ? "var(--color-accent)" : "var(--color-text-dim)"} strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                    </svg>
                    <span className="text-[10px] font-medium" style={{ fontFamily: "var(--font-mono)", color: wizardStep === i ? "var(--color-accent)" : "var(--color-text-dim)" }}>{s.label}</span>
                  </button>
                ))}
              </div>

              {/* Step 0: Basics */}
              {wizardStep === 0 && (
                <div className="space-y-6 animate-slide-up">
                  <FieldBlock label="Name" hint="Optional - AI vergibt einen Namen wenn leer" aiHint={false}>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. 'Fitness-Coaches DACH'" className="input" />
                  </FieldBlock>
                  <FieldBlock label="Beschreibung" hint="Einziges Pflichtfeld. Wer sind diese Menschen?" aiHint={false}>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
                      placeholder="z.B. 'Selbstständige Fitness-Coaches, die online Kunden gewinnen wollen...'" className="input resize-none" />
                    {description.length > 0 && description.length < 20 && <p className="text-xs text-red mt-1">Mindestens 20 Zeichen ({description.length}/20)</p>}
                  </FieldBlock>
                </div>
              )}

              {/* Step 1: Demographics */}
              {wizardStep === 1 && (
                <div className="space-y-6 animate-slide-up">
                  <FieldBlock label="Altersrange"><RangeSlider min={16} max={75} value={ageRange} onChange={setAgeRange} unit=" J." /></FieldBlock>
                  <FieldBlock label="Geschlechterverteilung" hint="Summe = 100%"><GenderSplit value={genderSplit} onChange={setGenderSplit} /></FieldBlock>
                  <FieldBlock label="Region"><ChipGrid options={REGION_OPTIONS} selected={regions} onChange={v => setRegions(v as string[])} cols={2} /></FieldBlock>
                  <FieldBlock label="Stadt / Land"><ChipGrid options={URBAN_OPTIONS} selected={urbanRural} onChange={v => setUrbanRural(v as string)} multi={false} cols={3} /></FieldBlock>
                  <FieldBlock label="Bildung"><ChipGrid options={EDUCATION_OPTIONS} selected={education} onChange={v => setEducation(v as string[])} cols={4} /></FieldBlock>
                  <FieldBlock label="Einkommen (Netto/Monat)"><RangeSlider min={0} max={15000} value={incomeRange} onChange={setIncomeRange} unit="€" step={250} /></FieldBlock>
                </div>
              )}

              {/* Step 2: Psychographics */}
              {wizardStep === 2 && (
                <div className="space-y-6 animate-slide-up">
                  <FieldBlock label="Kernwerte" hint="Was ist dieser Zielgruppe am wichtigsten?">
                    <ChipGrid options={VALUE_OPTIONS} selected={coreValues} onChange={v => setCoreValues(v as string[])} cols={3} />
                  </FieldBlock>
                  <FieldBlock label="Pain Points" hint="Enter zum Hinzufügen">
                    <TagInput tags={painPoints} onChange={setPainPoints} placeholder="z.B. 'Zu wenig Zeit für Marketing'" />
                  </FieldBlock>
                  <FieldBlock label="Ziele & Wünsche">
                    <TagInput tags={goals} onChange={setGoals} placeholder="z.B. 'Mehr Kunden ohne Kaltakquise'" />
                  </FieldBlock>
                  <FieldBlock label="Kaufverhalten">
                    <div className="space-y-2">
                      {BUYING_STYLES.map(s => (
                        <button key={s.id} type="button" onClick={() => setBuyingStyle(s.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all cursor-pointer"
                          style={{
                            border: `1.5px solid ${buyingStyle === s.id ? "var(--color-accent)" : "var(--color-border)"}`,
                            background: buyingStyle === s.id ? "var(--color-accent-glow)" : "transparent",
                          }}>
                          <div>
                            <div className="text-sm font-semibold" style={{ color: buyingStyle === s.id ? "var(--color-accent)" : "var(--color-text)" }}>{s.label}</div>
                            <div className="text-xs text-text-dim">{s.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </FieldBlock>
                </div>
              )}

              {/* Step 3: Behavior */}
              {wizardStep === 3 && (
                <div className="space-y-6 animate-slide-up">
                  <FieldBlock label="Aktive Plattformen"><ChipGrid options={PLATFORM_OPTIONS} selected={platforms} onChange={v => setPlatforms(v as string[])} cols={3} /></FieldBlock>
                  <FieldBlock label="Medienkonsum"><ChipGrid options={MEDIA_OPTIONS} selected={mediaConsumption} onChange={v => setMediaConsumption(v as string[])} cols={3} /></FieldBlock>
                  <FieldBlock label="Tech-Affinität"><SingleSlider min={0} max={100} value={techAffinity} onChange={setTechAffinity} leftLabel="Technik-Muffel" rightLabel="Early Adopter" /></FieldBlock>
                  <FieldBlock label="Preissensibilität"><SingleSlider min={0} max={100} value={priceSensitivity} onChange={setPriceSensitivity} leftLabel="Preis egal" rightLabel="Sehr preisbewusst" /></FieldBlock>
                </div>
              )}

              {/* Step 4: Review */}
              {wizardStep === 4 && (
                <div className="animate-slide-up">
                  <div className="card p-4 mb-5 text-xs text-purple" style={{ background: "rgba(124,58,237,0.05)", border: "1px solid rgba(124,58,237,0.15)" }}>
                    Leere Felder werden beim Speichern automatisch von AI geschätzt.
                  </div>
                  <div className="space-y-0">
                    {[
                      ["Name", name || "(AI vergibt)"],
                      ["Beschreibung", description.substring(0, 80) + (description.length > 80 ? "..." : "")],
                      ["Alter", `${ageRange[0]}-${ageRange[1]} J.`],
                      ["Geschlecht", `M ${genderSplit.male}% / W ${genderSplit.female}% / D ${genderSplit.diverse}%`],
                      ["Region", regions.length ? regions.join(", ") : "AI schätzt"],
                      ["Bildung", education.length ? education.join(", ") : "AI schätzt"],
                      ["Werte", coreValues.length ? coreValues.join(", ") : "AI schätzt"],
                      ["Pain Points", painPoints.length ? painPoints.join(", ") : "AI schätzt"],
                      ["Plattformen", platforms.length ? platforms.join(", ") : "AI schätzt"],
                      ["Tech-Affinität", `${techAffinity}%`],
                      ["Preissensibilität", `${priceSensitivity}%`],
                    ].map(([label, val]) => (
                      <div key={label as string} className="flex py-2.5 border-b border-border">
                        <span className="w-32 shrink-0 text-[10px] font-bold uppercase text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
                        <span className="text-sm text-text flex-1" style={{ color: (val as string).includes("AI schätzt") ? "var(--color-purple)" : undefined, fontStyle: (val as string).includes("AI schätzt") ? "italic" : undefined }}>{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nav */}
              <div className="flex justify-between mt-8 pt-5 border-t border-border">
                <button type="button" onClick={() => wizardStep > 0 ? setWizardStep(wizardStep - 1) : setMode("quick")}
                  className="btn-secondary text-sm py-2.5 px-5">
                  ← {wizardStep === 0 ? "Schnell-Modus" : "Zurück"}
                </button>
                {wizardStep < 4 ? (
                  <button type="button" onClick={() => setWizardStep(wizardStep + 1)} className="btn-primary text-sm py-2.5 px-5">
                    Weiter →
                  </button>
                ) : (
                  <button onClick={handleGenerate} disabled={description.trim().length < 20}
                    className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                    Speichern & Agenten generieren
                  </button>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* === LOADING PHASE === */}
      {phase === "loading" && (
        <div className="text-center py-20 animate-slide-up">
          <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 animate-glow"
            style={{ background: "var(--color-accent-glow)" }}>
            <svg className="w-10 h-10 text-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 800 }}>AI analysiert deine Zielgruppe...</h2>
          <p className="text-sm text-text-muted mt-2">Demografie, Psychografie, Plattformen und Kaufverhalten werden geschätzt.</p>
          <div className="w-64 h-1.5 mx-auto mt-8 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
            <div className="h-full rounded-full" style={{
              background: "linear-gradient(90deg, var(--color-accent), var(--color-purple))",
              animation: "shimmer 2s ease-in-out infinite",
              width: "70%",
            }} />
          </div>
        </div>
      )}

      {/* === REVIEW PHASE === */}
      {phase === "review" && (
        <div className="animate-slide-up">
          {/* Confidence */}
          <div className="p-4 rounded-xl mb-6" style={{ background: `${confColor}08`, border: `1.5px solid ${confColor}30` }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold" style={{ color: confColor }}>
                {aiConfidence >= 80 ? "AI ist ziemlich sicher" : aiConfidence >= 50 ? "AI hat geschätzt - prüfe die Details" : "Wenig Infos - verfeinere die Beschreibung"}
              </span>
              <span className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: confColor }}>{aiConfidence}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${confColor}15` }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${aiConfidence}%`, background: confColor }} />
            </div>
            <p className="text-xs text-text-dim mt-2">{aiReasoning}</p>
          </div>

          {/* Profile */}
          <h3 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-display)" }}>{name}</h3>
          <p className="text-sm text-text-muted mb-5">{description}</p>

          <div className="space-y-0 mb-8">
            {[
              ["Alter", `${ageRange[0]}-${ageRange[1]} Jahre`, "ageRange"],
              ["Geschlecht", `M ${genderSplit.male}% / W ${genderSplit.female}% / D ${genderSplit.diverse}%`, "genderSplit"],
              ["Region", regions.join(", ") || "—", "regions"],
              ["Stadt/Land", URBAN_OPTIONS.find(u => u.id === urbanRural)?.label ?? urbanRural, "urbanRural"],
              ["Bildung", education.join(", ") || "—", "education"],
              ["Einkommen", `${incomeRange[0].toLocaleString("de-DE")}-${incomeRange[1].toLocaleString("de-DE")}€/Mo.`, "incomeRange"],
              ["Werte", coreValues.join(", ") || "—", "values"],
              ["Pain Points", painPoints.join(", ") || "—", "painPoints"],
              ["Ziele", goals.join(", ") || "—", "goals"],
              ["Kaufverhalten", BUYING_STYLES.find(b => b.id === buyingStyle)?.label ?? buyingStyle, "buyingStyle"],
              ["Plattformen", platforms.join(", ") || "—", "platforms"],
              ["Medien", mediaConsumption.join(", ") || "—", "mediaConsumption"],
              ["Tech-Affinität", `${techAffinity}%`, "techAffinity"],
              ["Preissensibilität", `${priceSensitivity}%`, "priceSensitivity"],
            ].map(([label, val, key]) => {
              const isAi = aiEstimated.includes(key as string);
              return (
                <div key={key as string} className="flex items-start py-2.5 border-b border-border" style={isAi ? { background: "rgba(124,58,237,0.03)", margin: "0 -16px", padding: "10px 16px", borderRadius: 6 } : undefined}>
                  <span className="w-32 shrink-0 text-[10px] font-bold uppercase text-text-dim pt-0.5" style={{ fontFamily: "var(--font-mono)" }}>{label}</span>
                  <span className="text-sm text-text flex-1">{val}</span>
                  {isAi && <span className="badge shrink-0 ml-2" style={{ background: "rgba(124,58,237,0.1)", color: "var(--color-purple)" }}>AI</span>}
                </div>
              );
            })}
          </div>

          {/* Error */}
          {error && <div className="flex items-center gap-2 p-3 rounded-lg mb-4" style={{ background: "rgba(248,113,113,0.1)" }}><p className="text-sm text-red">{error}</p></div>}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={() => { setMode("expert"); setPhase("input"); setWizardStep(0); }}
              className="btn-secondary flex-1 text-sm">
              Anpassen
            </button>
            <button onClick={handleSave} disabled={loading}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2">
              {loading ? "Wird gespeichert..." : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Speichern</>
              )}
            </button>
          </div>
          <p className="text-center text-xs text-text-dim mt-3 mb-8">
            Lila markierte Felder wurden von AI geschätzt. Du kannst sie jederzeit anpassen.
          </p>
        </div>
      )}
    </div>
  );
}
