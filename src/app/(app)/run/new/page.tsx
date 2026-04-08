"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { StimulusType } from "@/types/simulation";

const stimulusTypes: { value: StimulusType; label: string; desc: string; icon: string; color: string }[] = [
  {
    value: "copy",
    label: "Copy Testing",
    desc: "Vergleiche Textvarianten",
    icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z",
    color: "#6ee7b7",
  },
  {
    value: "product",
    label: "Produkt-Check",
    desc: "Kauf- oder Ablehnungssimulation",
    icon: "M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25",
    color: "#a78bfa",
  },
  {
    value: "strategy",
    label: "Strategie-Check",
    desc: "Marktpotenzial testen",
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
    color: "#60a5fa",
  },
];

interface PersonaProfileOption {
  id: string;
  name: string;
  agent_count_default: number;
}

export default function NewRunPage() {
  const router = useRouter();
  const [type, setType] = useState<StimulusType>("copy");
  const [variants, setVariants] = useState<string[]>(["", ""]);
  const [profiles, setProfiles] = useState<PersonaProfileOption[]>([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [contextLayer, setContextLayer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      const supabase = createClient();
      const { data } = await supabase
        .from("persona_profiles")
        .select("id, name, agent_count_default")
        .order("created_at", { ascending: false });
      if (data) {
        setProfiles(data);
        if (data.length > 0) setSelectedProfile(data[0].id);
      }
    }
    loadProfiles();
  }, []);

  function updateVariant(index: number, value: string) {
    const updated = [...variants];
    updated[index] = value;
    setVariants(updated);
  }

  function addVariant() {
    if (variants.length < 5) setVariants([...variants, ""]);
  }

  function removeVariant(index: number) {
    if (variants.length > 1) setVariants(variants.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const filledVariants = variants.filter((v) => v.trim());
    if (filledVariants.length === 0) {
      setError("Mindestens eine Variante ist erforderlich.");
      return;
    }
    if (!selectedProfile) {
      setError("Bitte wähle ein Persona-Profil aus.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/runs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaProfileId: selectedProfile,
          stimulusType: type,
          variants: filledVariants,
          contextLayer: contextLayer.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/run/${data.runId}/report`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Starten");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div className="animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Neue Simulation
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Wähle Typ, Zielgruppe und gib deine Varianten ein.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stimulus-Typ */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "80ms" }}>
          <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            Simulations-Typ
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stimulusTypes.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setType(st.value)}
                className="rounded-xl p-4 text-left transition-all duration-200 cursor-pointer"
                style={type === st.value ? {
                  background: `linear-gradient(135deg, ${st.color}08, ${st.color}04)`,
                  border: `1px solid ${st.color}30`,
                  boxShadow: `0 0 20px ${st.color}08`,
                } : {
                  background: "transparent",
                  border: "1px solid var(--color-border)",
                }}
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke={type === st.value ? st.color : "var(--color-text-dim)"} strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={st.icon} />
                  </svg>
                  <p className="font-semibold text-sm" style={{
                    fontFamily: "var(--font-display)",
                    color: type === st.value ? st.color : "var(--color-text)",
                  }}>{st.label}</p>
                </div>
                <p className="text-xs text-text-dim">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Persona-Profil */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "160ms" }}>
          <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            Zielgruppe
          </label>
          {profiles.length === 0 ? (
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <div className="icon-glow" style={{ "--glow-color": "rgba(167,139,250,0.1)" } as React.CSSProperties}>
                  <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Noch kein Persona-Profil vorhanden.</p>
                  <a href="/personas" className="text-xs text-accent hover:underline">
                    Erstelle zuerst eine Zielgruppe
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="input cursor-pointer"
            >
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.agent_count_default} Agenten)
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Varianten */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "240ms" }}>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              Varianten
            </label>
            <span className="badge" style={{ background: "rgba(110,231,183,0.1)", color: "var(--color-accent)" }}>
              {variants.length}/5
            </span>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-3.5 text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                  {i + 1}.
                </span>
                <textarea
                  value={v}
                  onChange={(e) => updateVariant(i, e.target.value)}
                  placeholder={`Variante ${i + 1}...`}
                  rows={3}
                  className="input resize-none pl-9"
                />
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="self-start px-3 py-3.5 text-text-dim hover:text-red transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          {variants.length < 5 && (
            <button
              type="button"
              onClick={addVariant}
              className="text-sm text-accent hover:text-accent-dim transition-colors cursor-pointer flex items-center gap-1.5"
              style={{ fontFamily: "var(--font-display)", fontWeight: 600 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Variante hinzufügen
            </button>
          )}
        </div>

        {/* Kontext */}
        <div className="space-y-3 animate-slide-up" style={{ animationDelay: "320ms" }}>
          <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            Kontext <span className="text-text-dim normal-case">(optional)</span>
          </label>
          <textarea
            value={contextLayer}
            onChange={(e) => setContextLayer(e.target.value)}
            placeholder="z.B. 'Die Zielgruppe hat gerade eine Preiserhöhung erlebt...'"
            rows={2}
            className="input resize-none"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-red">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="animate-slide-up" style={{ animationDelay: "400ms" }}>
          <button
            type="submit"
            disabled={loading || profiles.length === 0}
            className="btn-primary w-full text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Simulation läuft...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Simulation starten
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
