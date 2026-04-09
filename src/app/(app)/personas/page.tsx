"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  agent_count_default: number;
  priority: string | null;
  ai_estimated_fields: string[] | null;
  ai_confidence: number | null;
  platforms: string[] | null;
  age_min: number | null;
  age_max: number | null;
  regions: string[] | null;
  created_at: string;
}

export default function PersonasPage() {
  const [profiles, setProfiles] = useState<PersonaProfile[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("persona_profiles")
        .select("id, name, description, agent_count_default, priority, ai_estimated_fields, ai_confidence, platforms, age_min, age_max, regions, created_at")
        .order("created_at", { ascending: false });
      if (data) setProfiles(data);
    }
    load();
  }, []);

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
        <div className="flex gap-2">
          <Link href="/personas/generate" className="px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5"
            style={{ border: "1.5px solid var(--color-accent)", color: "var(--color-accent)" }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Aus Produkt generieren
          </Link>
          <Link href="/personas/new" className="btn-primary text-sm">
            + Neue Zielgruppe
          </Link>
        </div>
      </div>

      {/* Empty State */}
      {profiles.length === 0 && (
        <div className="card p-10 text-center animate-slide-up">
          <div className="icon-glow mx-auto mb-4" style={{ "--glow-color": "rgba(167,139,250,0.1)" } as React.CSSProperties}>
            <svg className="w-6 h-6 text-purple" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-text-muted text-sm">Noch keine Zielgruppen angelegt.</p>
          <p className="text-text-dim text-xs mt-1 mb-4">Erstelle dein erstes Persona-Profil, um Simulationen zu starten.</p>
          <Link href="/personas/new" className="btn-primary text-sm inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Erste Persona erstellen
          </Link>
        </div>
      )}

      {/* Profile List */}
      {profiles.length > 0 && (
        <div className="space-y-3 stagger">
          {profiles.map((p) => {
            const aiCount = p.ai_estimated_fields?.length ?? 0;
            return (
              <div key={p.id} className="card-interactive card p-5 cursor-pointer animate-slide-up">
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
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold" style={{ fontFamily: "var(--font-display)" }}>{p.name}</h3>
                        {p.priority && (
                          <span className="badge" style={{
                            fontSize: 9,
                            background: p.priority === "primary" ? "var(--color-accent-glow)" : p.priority === "secondary" ? "rgba(96,165,250,0.1)" : "rgba(167,139,250,0.1)",
                            color: p.priority === "primary" ? "var(--color-accent)" : p.priority === "secondary" ? "var(--color-blue)" : "var(--color-purple)",
                          }}>
                            {p.priority === "primary" ? "Primär" : p.priority === "secondary" ? "Sekundär" : "Nische"}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mt-1 line-clamp-2">{p.description}</p>
                      {/* Meta row */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {p.regions?.length ? (
                          <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                            {p.regions.slice(0, 3).map(r => r === "deutschland" ? "DE" : r === "oesterreich" ? "AT" : r === "schweiz" ? "CH" : "EU").join(" ")}
                          </span>
                        ) : null}
                        {p.age_min && p.age_max ? (
                          <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>{p.age_min}-{p.age_max} J.</span>
                        ) : null}
                        {p.platforms?.length ? (
                          <span className="text-[10px] text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>{p.platforms.slice(0, 3).join(", ")}</span>
                        ) : null}
                        {aiCount > 0 && (
                          <span className="badge" style={{ background: "rgba(124,58,237,0.1)", color: "var(--color-purple)", fontSize: 9 }}>
                            AI {aiCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="badge shrink-0 ml-4" style={{ background: "rgba(96,165,250,0.1)", color: "var(--color-blue)" }}>
                    {p.agent_count_default} Agenten
                  </span>
                </div>
                <div className="flex items-center justify-between mt-3" style={{ paddingLeft: 52 }}>
                  <p className="text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(p.created_at).toLocaleDateString("de-DE")}
                  </p>
                  <Link href={`/personas/${p.id}`} className="text-xs font-medium transition-opacity hover:opacity-80" style={{ color: "var(--color-accent)" }}>
                    Bearbeiten
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
