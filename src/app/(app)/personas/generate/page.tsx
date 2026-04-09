"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Segment {
  name: string;
  description: string;
  priority: "primary" | "secondary" | "niche";
  age_min: number;
  age_max: number;
  gender_male: number;
  gender_female: number;
  gender_diverse: number;
  regions: string[];
  urban_rural: string;
  education: string[];
  income_min: number;
  income_max: number;
  core_values: string[];
  pain_points: string[];
  goals: string[];
  buying_style: string;
  platforms: string[];
  media_consumption: string[];
  tech_affinity: number;
  price_sensitivity: number;
}

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  primary: { label: "Primär", bg: "rgba(34,197,94,0.1)", color: "var(--color-green, #22c55e)", border: "rgba(34,197,94,0.25)" },
  secondary: { label: "Sekundär", bg: "rgba(96,165,250,0.1)", color: "var(--color-blue, #60a5fa)", border: "rgba(96,165,250,0.25)" },
  niche: { label: "Nische", bg: "rgba(167,139,250,0.1)", color: "var(--color-purple, #a78bfa)", border: "rgba(167,139,250,0.25)" },
};

export default function GeneratePersonaPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canAnalyze = url.trim() || description.trim();

  async function handleAnalyze() {
    if (!canAnalyze) return;
    setError("");
    setAnalyzing(true);
    setSegments([]);
    setSelected(new Set());

    try {
      const res = await fetch("/api/personas/generate-from-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() || undefined, description: description.trim() || undefined }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Fehler ${res.status}`);
      }

      const data = await res.json();
      const segs: Segment[] = data.segments || [];
      setSegments(segs);
      // Select all by default
      setSelected(new Set(segs.map((_, i) => i)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Analyse fehlgeschlagen");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSave() {
    if (selected.size === 0) return;
    setSaving(true);
    setError("");

    try {
      for (const idx of selected) {
        const seg = segments[idx];
        const body = {
          name: seg.name,
          description: seg.description,
          ageMin: seg.age_min,
          ageMax: seg.age_max,
          genderMale: seg.gender_male,
          genderFemale: seg.gender_female,
          genderDiverse: seg.gender_diverse,
          regions: seg.regions,
          urbanRural: seg.urban_rural,
          education: seg.education,
          incomeMin: seg.income_min,
          incomeMax: seg.income_max,
          coreValues: seg.core_values,
          painPoints: seg.pain_points,
          goals: seg.goals,
          buyingStyle: seg.buying_style,
          platforms: seg.platforms,
          mediaConsumption: seg.media_consumption,
          techAffinity: seg.tech_affinity,
          priceSensitivity: seg.price_sensitivity,
          aiEstimatedFields: [
            "age_min", "age_max", "gender", "regions", "urban_rural",
            "education", "income", "core_values", "pain_points", "goals",
            "buying_style", "platforms", "media_consumption", "tech_affinity",
            "price_sensitivity",
          ],
          aiConfidence: 75,
          aiReasoning: `Automatisch generiert aus Produktanalyse${url.trim() ? ` (${url.trim()})` : ""}`,
        };

        const res = await fetch("/api/personas/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Speichern fehlgeschlagen (${res.status})`);
        }
      }

      router.push("/personas");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen");
      setSaving(false);
    }
  }

  function toggleSegment(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="animate-slide-up">
        <Link
          href="/personas"
          className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-4"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          Zurück zu Personas
        </Link>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Zielgruppe aus Produkt generieren
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Gib eine URL ein, beschreibe dein Produkt, oder nutze beides. Die KI analysiert deine Zielgruppe.
        </p>
      </div>

      {/* Input Section */}
      <div className="card p-6 space-y-5 animate-slide-up">
        {/* URL */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            Landing Page oder Website URL
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            disabled={analyzing}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm transition-colors"
            style={{
              background: "var(--color-surface-alt, var(--color-surface))",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
          <p className="text-[11px] text-text-dim mt-1">Optional</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
          <span className="text-[11px] text-text-dim uppercase tracking-wider">und / oder</span>
          <div className="flex-1 h-px" style={{ background: "var(--color-border)" }} />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ fontFamily: "var(--font-display)" }}>
            Beschreibe dein Produkt/Angebot
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="z.B. 'Online-Kurs für Hundetraining, 197 EUR, richtet sich an Erstbesitzer die mit Verhaltensproblemen kämpfen'"
            disabled={analyzing}
            rows={4}
            className="w-full rounded-lg px-3.5 py-2.5 text-sm transition-colors resize-none"
            style={{
              background: "var(--color-surface-alt, var(--color-surface))",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
          <p className="text-[11px] text-text-dim mt-1">Optional, aber mindestens ein Feld muss ausgefüllt sein</p>
        </div>

        {/* Analyze Button */}
        <button
          onClick={handleAnalyze}
          disabled={!canAnalyze || analyzing}
          className="btn-primary text-sm w-full flex items-center justify-center gap-2"
          style={{ opacity: !canAnalyze || analyzing ? 0.5 : 1 }}
        >
          {analyzing ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Analysiere dein Produkt...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              Analysieren
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div
          className="card p-4 text-sm animate-slide-up"
          style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.05)", color: "#ef4444" }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {segments.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Erkannte Segmente
            </h2>
            <span className="text-xs text-text-dim">
              {selected.size} von {segments.length} ausgewählt
            </span>
          </div>

          {segments.map((seg, idx) => {
            const priority = PRIORITY_CONFIG[seg.priority] || PRIORITY_CONFIG.niche;
            const isSelected = selected.has(idx);

            return (
              <div
                key={idx}
                className="card p-5 transition-all cursor-pointer"
                style={{
                  borderColor: isSelected ? priority.border : "var(--color-border)",
                  borderWidth: 1,
                  borderStyle: "solid",
                  opacity: isSelected ? 1 : 0.6,
                }}
                onClick={() => toggleSegment(idx)}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        background: isSelected ? priority.color : "transparent",
                        border: isSelected ? "none" : "2px solid var(--color-border)",
                      }}
                    >
                      {isSelected && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                      {seg.name}
                    </h3>
                  </div>
                  <span
                    className="badge shrink-0 text-[10px]"
                    style={{ background: priority.bg, color: priority.color }}
                  >
                    {priority.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-text-muted mt-2 ml-8">{seg.description}</p>

                {/* Detail chips */}
                <div className="mt-3 ml-8 space-y-2">
                  {/* Age + Regions row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {seg.age_min && seg.age_max && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-alt, rgba(255,255,255,0.05))", color: "var(--color-text-muted)" }}>
                        {seg.age_min}-{seg.age_max} Jahre
                      </span>
                    )}
                    {seg.regions?.map((r) => (
                      <span key={r} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-alt, rgba(255,255,255,0.05))", color: "var(--color-text-muted)" }}>
                        {r}
                      </span>
                    ))}
                  </div>

                  {/* Platforms */}
                  {seg.platforms?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider mr-1">Plattformen</span>
                      {seg.platforms.map((p) => (
                        <span key={p} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full" style={{ background: priority.bg, color: priority.color }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Core Values */}
                  {seg.core_values?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider mr-1">Werte</span>
                      {seg.core_values.map((v) => (
                        <span key={v} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full" style={{ background: "var(--color-surface-alt, rgba(255,255,255,0.05))", color: "var(--color-text-muted)" }}>
                          {v}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pain Points */}
                  {seg.pain_points?.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-text-dim font-medium uppercase tracking-wider mr-1">Pain Points</span>
                      {seg.pain_points.map((p) => (
                        <span key={p} className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.08)", color: "rgba(239,68,68,0.8)" }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={selected.size === 0 || saving}
            className="btn-primary text-sm w-full flex items-center justify-center gap-2"
            style={{ opacity: selected.size === 0 || saving ? 0.5 : 1 }}
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Speichere...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Ausgewählte speichern ({selected.size})
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
