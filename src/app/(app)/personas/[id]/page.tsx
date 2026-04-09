"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

// --- Constants ---

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
                className="hover:opacity-70 cursor-pointer" style={{ color: "var(--color-accent)" }}>x</button>
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
function FieldBlock({ label, hint, children }: {
  label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <div className="text-xs font-bold uppercase tracking-wider text-text-dim mb-1" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>{label}</div>
      {hint && <p className="text-xs text-text-dim mb-2.5">{hint}</p>}
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
];

// =============================================
// MAIN COMPONENT
// =============================================

export default function EditPersonaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
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

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load existing persona data
  useEffect(() => {
    async function loadPersona() {
      try {
        const res = await fetch(`/api/personas/${id}`);
        if (!res.ok) {
          setError("Persona nicht gefunden");
          setLoadingData(false);
          return;
        }
        const data = await res.json();
        setName(data.name || "");
        setDescription(data.description || "");
        setAgeRange([data.age_min ?? 25, data.age_max ?? 45]);
        setGenderSplit({
          male: data.gender_male ?? 48,
          female: data.gender_female ?? 48,
          diverse: data.gender_diverse ?? 4,
        });
        setRegions(data.regions || []);
        setUrbanRural(data.urban_rural || "mixed");
        setEducation(data.education || []);
        setIncomeRange([data.income_min ?? 2000, data.income_max ?? 5000]);
        setPlatforms(data.platforms || []);
        setBuyingStyle(data.buying_style || "considered");
        setTechAffinity(data.tech_affinity ?? 60);
        setPriceSensitivity(data.price_sensitivity ?? 50);
        setCoreValues(data.core_values || []);
        setPainPoints(data.pain_points || []);
        setGoals(data.goals || []);
        setMediaConsumption(data.media_consumption || []);
      } catch {
        setError("Laden fehlgeschlagen");
      } finally {
        setLoadingData(false);
      }
    }
    loadPersona();
  }, [id]);

  async function handleSave() {
    if (description.trim().length < 20) { setError("Mindestens 20 Zeichen Beschreibung."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/personas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Neue Persona",
          description,
          ageMin: ageRange[0], ageMax: ageRange[1],
          genderMale: genderSplit.male, genderFemale: genderSplit.female, genderDiverse: genderSplit.diverse,
          regions, urbanRural, education, incomeMin: incomeRange[0], incomeMax: incomeRange[1],
          buyingStyle, coreValues, painPoints, goals,
          platforms, mediaConsumption, techAffinity, priceSensitivity,
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

  async function handleDelete() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/personas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push("/personas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loadingData) {
    return (
      <div className="max-w-[680px] text-center py-20 animate-slide-up">
        <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "var(--color-accent-glow)" }}>
          <svg className="w-8 h-8 text-accent animate-spin" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
        </div>
        <p className="text-sm text-text-muted">Persona wird geladen...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[680px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 animate-slide-up">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Persona bearbeiten
          </h1>
          <p className="text-text-muted text-sm mt-1">Passe dein Zielgruppen-Profil an.</p>
        </div>
        <button onClick={() => router.push("/personas")} className="btn-secondary text-xs py-2 px-3">
          Abbrechen
        </button>
      </div>

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
          <FieldBlock label="Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. 'Fitness-Coaches DACH'" className="input" />
          </FieldBlock>
          <FieldBlock label="Beschreibung" hint="Wer sind diese Menschen?">
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
          <FieldBlock label="Einkommen (Netto/Monat)"><RangeSlider min={0} max={15000} value={incomeRange} onChange={setIncomeRange} unit="EUR" step={250} /></FieldBlock>
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

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg mb-4 mt-4" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
          <p className="text-sm text-red">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between mt-8 pt-5 border-t border-border">
        <div className="flex gap-3">
          {wizardStep > 0 && (
            <button type="button" onClick={() => setWizardStep(wizardStep - 1)}
              className="btn-secondary text-sm py-2.5 px-5">
              Zurück
            </button>
          )}
        </div>
        <div className="flex gap-3">
          {wizardStep < 3 ? (
            <button type="button" onClick={() => setWizardStep(wizardStep + 1)} className="btn-primary text-sm py-2.5 px-5">
              Weiter
            </button>
          ) : (
            <button onClick={handleSave} disabled={loading || description.trim().length < 20}
              className="btn-primary text-sm py-2.5 px-6 flex items-center gap-2">
              {loading ? "Wird gespeichert..." : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Speichern</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Delete Section */}
      <div className="mt-10 pt-6 border-t border-border">
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="text-sm cursor-pointer transition-colors"
            style={{ color: "var(--color-red)", opacity: 0.7 }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "0.7")}>
            Persona löschen
          </button>
        ) : (
          <div className="p-4 rounded-xl" style={{ background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="text-sm text-red font-semibold mb-1">Persona wirklich löschen?</p>
            <p className="text-xs text-text-dim mb-3">Diese Aktion kann nicht rückgängig gemacht werden. Alle zugehörigen Simulationsdaten bleiben erhalten.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="btn-secondary text-xs py-2 px-4">
                Abbrechen
              </button>
              <button onClick={handleDelete} disabled={loading}
                className="text-xs py-2 px-4 rounded-lg font-semibold cursor-pointer transition-colors"
                style={{ background: "rgba(248,113,113,0.15)", color: "var(--color-red)", border: "1px solid rgba(248,113,113,0.3)" }}>
                {loading ? "Wird gelöscht..." : "Endgültig löschen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
