"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { StimulusType } from "@/types/simulation";

const stimulusTypes: { value: StimulusType; label: string; desc: string }[] = [
  { value: "copy", label: "Copy Testing", desc: "Vergleiche Textvarianten" },
  { value: "product", label: "Produkt-Validierung", desc: "Kauf- oder Ablehnungssimulation" },
  { value: "strategy", label: "Strategie-Check", desc: "Marktpotenzial testen" },
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
      <div>
        <h1 className="text-2xl font-bold">Neue Simulation</h1>
        <p className="text-text-muted mt-1">
          Wähle Typ, Zielgruppe und gib deine Varianten ein.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Stimulus-Typ */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-muted">Simulations-Typ</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {stimulusTypes.map((st) => (
              <button
                key={st.value}
                type="button"
                onClick={() => setType(st.value)}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  type === st.value
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-border-hover"
                }`}
              >
                <p className="font-medium text-sm">{st.label}</p>
                <p className="text-xs text-text-dim mt-1">{st.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Persona-Profil */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-muted">Zielgruppe</label>
          {profiles.length === 0 ? (
            <div className="rounded-xl border border-border bg-bg-card p-4">
              <p className="text-sm text-text-dim">
                Noch kein Persona-Profil vorhanden.{" "}
                <a href="/personas" className="text-accent hover:underline">
                  Erstelle zuerst eine Zielgruppe.
                </a>
              </p>
            </div>
          ) : (
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text focus:border-accent focus:outline-none"
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
        <div className="space-y-3">
          <label className="text-sm font-medium text-text-muted">
            Varianten ({variants.length}/5)
          </label>
          {variants.map((v, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex-1">
                <textarea
                  value={v}
                  onChange={(e) => updateVariant(i, e.target.value)}
                  placeholder={`Variante ${i + 1}...`}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none resize-none"
                />
              </div>
              {variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(i)}
                  className="self-start px-3 py-3 text-text-dim hover:text-red transition-colors"
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
              className="text-sm text-accent hover:text-accent-dim transition-colors"
            >
              + Variante hinzufuegen
            </button>
          )}
        </div>

        {/* Kontext (optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-muted">
            Kontext <span className="text-text-dim">(optional)</span>
          </label>
          <textarea
            value={contextLayer}
            onChange={(e) => setContextLayer(e.target.value)}
            placeholder="z.B. 'Die Zielgruppe hat gerade eine Preiserhoehung erlebt...'"
            rows={2}
            className="w-full rounded-lg border border-border bg-bg-card px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-red">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || profiles.length === 0}
          className="w-full rounded-lg bg-accent px-6 py-3 font-medium text-bg hover:bg-accent-dim disabled:opacity-50 transition-colors"
        >
          {loading ? "Simulation läuft..." : "Simulation starten"}
        </button>
      </form>
    </div>
  );
}
