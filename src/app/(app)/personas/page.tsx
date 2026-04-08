"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  agent_count_default: number;
  created_at: string;
}

export default function PersonasPage() {
  const [profiles, setProfiles] = useState<PersonaProfile[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [demographics, setDemographics] = useState("");
  const [psychographics, setPsychographics] = useState("");
  const [agentCount, setAgentCount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfiles();
  }, []);

  async function loadProfiles() {
    const supabase = createClient();
    const { data } = await supabase
      .from("persona_profiles")
      .select("id, name, description, agent_count_default, created_at")
      .order("created_at", { ascending: false });
    if (data) setProfiles(data);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/personas/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          demographics: demographics || undefined,
          psychographics: psychographics || undefined,
          agentCount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowForm(false);
      setName("");
      setDescription("");
      setDemographics("");
      setPsychographics("");
      setAgentCount(50);
      loadProfiles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Persona-Profile</h1>
          <p className="text-text-muted mt-1">Deine gespeicherten Zielgruppen</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent-dim transition-colors"
        >
          {showForm ? "Abbrechen" : "Neue Zielgruppe"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-border bg-bg-card p-6 space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 'Online-Fitness-Kunden 25-40'"
              required
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">Beschreibung der Zielgruppe</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe deine Zielgruppe moeglichst genau..."
              rows={3}
              required
              className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                Demografie <span className="text-text-dim">(optional)</span>
              </label>
              <input
                value={demographics}
                onChange={(e) => setDemographics(e.target.value)}
                placeholder="Alter, Geschlecht, Einkommen..."
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-muted">
                Psychografie <span className="text-text-dim">(optional)</span>
              </label>
              <input
                value={psychographics}
                onChange={(e) => setPsychographics(e.target.value)}
                placeholder="Interessen, Werte, Lebensstil..."
                className="w-full rounded-lg border border-border bg-bg px-4 py-3 text-text placeholder-text-dim focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-text-muted">
              Anzahl Agenten: {agentCount}
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={agentCount}
              onChange={(e) => setAgentCount(Number(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="flex justify-between text-xs text-text-dim">
              <span>10</span>
              <span>200</span>
            </div>
          </div>

          {error && <p className="text-sm text-red">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-3 font-medium text-bg hover:bg-accent-dim disabled:opacity-50 transition-colors"
          >
            {loading ? "Personas werden generiert..." : "Zielgruppe generieren"}
          </button>
        </form>
      )}

      {profiles.length === 0 && !showForm ? (
        <div className="rounded-xl border border-border bg-bg-card p-8 text-center">
          <p className="text-text-muted">
            Noch keine Zielgruppen angelegt. Erstelle dein erstes Persona-Profil.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="rounded-xl border border-border bg-bg-card p-5 hover:bg-bg-card-hover transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{p.name}</h3>
                  <p className="text-sm text-text-muted mt-1 line-clamp-2">
                    {p.description}
                  </p>
                </div>
                <span className="text-xs text-text-dim whitespace-nowrap ml-4">
                  {p.agent_count_default} Agenten
                </span>
              </div>
              <p className="text-xs text-text-dim mt-2">
                {new Date(p.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
