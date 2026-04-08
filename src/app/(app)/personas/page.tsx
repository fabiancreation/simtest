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
      {/* Header */}
      <div className="flex items-center justify-between animate-slide-up">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
            Persona-Profile
          </h1>
          <p className="text-text-muted mt-1 text-sm">Deine gespeicherten Zielgruppen</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={showForm ? "btn-secondary text-sm" : "btn-primary text-sm"}
        >
          {showForm ? "Abbrechen" : "+ Neue Zielgruppe"}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="card p-6 space-y-5 animate-slide-up"
        >
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. 'Online-Fitness-Kunden 25-40'"
              required
              className="input"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
              Beschreibung der Zielgruppe
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beschreibe deine Zielgruppe möglichst genau..."
              rows={3}
              required
              className="input resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                Demografie <span className="text-text-dim normal-case">(optional)</span>
              </label>
              <input
                value={demographics}
                onChange={(e) => setDemographics(e.target.value)}
                placeholder="Alter, Geschlecht, Einkommen..."
                className="input"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                Psychografie <span className="text-text-dim normal-case">(optional)</span>
              </label>
              <input
                value={psychographics}
                onChange={(e) => setPsychographics(e.target.value)}
                placeholder="Interessen, Werte, Lebensstil..."
                className="input"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs uppercase tracking-wider text-text-dim" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
                Anzahl Agenten
              </label>
              <span className="badge" style={{ background: "rgba(110,231,183,0.1)", color: "var(--color-accent)" }}>
                {agentCount}
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={agentCount}
              onChange={(e) => setAgentCount(Number(e.target.value))}
              className="w-full accent-accent cursor-pointer"
            />
            <div className="flex justify-between text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
              <span>10</span>
              <span>200</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg" style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)" }}>
              <svg className="w-4 h-4 text-red shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <p className="text-sm text-red">{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full text-sm">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Personas werden generiert...
              </span>
            ) : (
              "Zielgruppe generieren"
            )}
          </button>
        </form>
      )}

      {/* Profile List */}
      {profiles.length === 0 && !showForm ? (
        <div className="card p-10 text-center animate-slide-up">
          <div className="icon-glow mx-auto mb-4" style={{ "--glow-color": "rgba(167,139,250,0.1)" } as React.CSSProperties}>
            <svg className="w-6 h-6 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">Noch keine Zielgruppen angelegt.</p>
          <p className="text-text-dim text-xs mt-1">Erstelle dein erstes Persona-Profil, um Simulationen zu starten.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger">
          {profiles.map((p) => (
            <div
              key={p.id}
              className="card-interactive card p-5 cursor-pointer animate-slide-up"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5" style={{
                    background: "linear-gradient(135deg, rgba(167,139,250,0.15), rgba(96,165,250,0.1))",
                  }}>
                    <svg className="w-5 h-5 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>{p.name}</h3>
                    <p className="text-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>
                  </div>
                </div>
                <span className="badge shrink-0 ml-4" style={{ background: "rgba(96,165,250,0.1)", color: "var(--color-blue)" }}>
                  {p.agent_count_default} Agenten
                </span>
              </div>
              <p className="text-xs text-text-dim mt-3 pl-13" style={{ fontFamily: "var(--font-mono)", paddingLeft: 52 }}>
                {new Date(p.created_at).toLocaleDateString("de-DE")}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
