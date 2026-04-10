"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface SimReport {
  id: string;
  name: string | null;
  sim_type: string;
  status: string;
  agent_count: number;
  created_at: string;
  completed_at: string | null;
  persona_preset: string | null;
  project_id: string | null;
}

interface ProjectOption {
  id: string;
  name: string;
  color: string;
}

const TYPE_LABELS: Record<string, string> = {
  copy: "Copy Test", product: "Produkt-Check", pricing: "Pricing Test",
  ad: "Ad Creative", landing: "Landing Page", campaign: "Kampagnen-Check", crisis: "Krisentest",
};

const TYPE_COLORS: Record<string, string> = {
  copy: "#10B981", product: "#6366F1", pricing: "#F59E0B",
  ad: "#EC4899", landing: "#0EA5E9", campaign: "#8B5CF6", crisis: "#EF4444",
};

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Fertig", color: "var(--color-accent)", bg: "var(--color-accent-glow)" },
  running: { label: "Läuft", color: "var(--color-warning)", bg: "rgba(245,158,11,0.1)" },
  queued: { label: "Wartend", color: "var(--color-text-dim)", bg: "var(--color-border)" },
  failed: { label: "Fehler", color: "var(--color-red)", bg: "rgba(248,113,113,0.1)" },
};

const PRESET_LABELS: Record<string, string> = {
  dach_allgemein: "DACH", solo_unternehmer: "Solo", ecom_kaeufer: "E-Com",
  b2b_entscheider: "B2B", gen_z: "Gen Z",
};

export default function ReportsPage() {
  const [reports, setReports] = useState<SimReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  async function handleDelete(id: string) {
    if (!confirm("Report wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.")) return;
    setDeleting(id);
    await fetch(`/api/simulations/${id}`, { method: "DELETE" });
    setReports(prev => prev.filter(r => r.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const [{ data: simData }, { data: projData }] = await Promise.all([
        supabase.from("simulations")
          .select("id, name, sim_type, status, agent_count, created_at, completed_at, persona_preset, project_id")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase.from("projects")
          .select("id, name, color")
          .order("name", { ascending: true }),
      ]);
      if (simData) setReports(simData);
      if (projData) setProjects(projData);
      setLoading(false);
    }
    load();
  }, []);

  // Filtern
  const filtered = reports.filter(r => {
    if (typeFilter !== "all" && r.sim_type !== typeFilter) return false;
    if (projectFilter === "none" && r.project_id !== null) return false;
    if (projectFilter !== "all" && projectFilter !== "none" && r.project_id !== projectFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (r.name ?? "").toLowerCase();
      const type = (TYPE_LABELS[r.sim_type] ?? "").toLowerCase();
      if (!name.includes(q) && !type.includes(q)) return false;
    }
    return true;
  });

  // Verfügbare Typen für Filter
  const usedTypes = [...new Set(reports.map(r => r.sim_type))];

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto mt-20 text-center">
        <div className="w-12 h-12 mx-auto rounded-full animate-pulse" style={{ background: "var(--color-border)" }} />
        <p className="text-text-muted text-sm mt-4">Lade Reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8 animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Reports
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {reports.length} Simulation{reports.length !== 1 ? "en" : ""} insgesamt
        </p>
      </div>

      {/* Filter-Bar */}
      <div className="flex gap-3 mb-6 flex-wrap animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Suche */}
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Report suchen..."
            className="input text-sm w-full"
          />
        </div>

        {/* Projekt-Filter */}
        {projects.length > 0 && (
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="input text-sm cursor-pointer"
            style={{ minWidth: 140 }}
          >
            <option value="all">Alle Projekte</option>
            <option value="none">Ohne Projekt</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {/* Typ-Filter */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setTypeFilter("all")}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
            style={{
              fontFamily: "var(--font-mono)",
              border: `1.5px solid ${typeFilter === "all" ? "var(--color-accent)" : "var(--color-border)"}`,
              background: typeFilter === "all" ? "var(--color-accent-glow)" : "transparent",
              color: typeFilter === "all" ? "var(--color-accent)" : "var(--color-text-dim)",
            }}
          >
            Alle
          </button>
          {usedTypes.map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(typeFilter === t ? "all" : t)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
              style={{
                fontFamily: "var(--font-mono)",
                border: `1.5px solid ${typeFilter === t ? TYPE_COLORS[t] ?? "var(--color-accent)" : "var(--color-border)"}`,
                background: typeFilter === t ? `${TYPE_COLORS[t]}15` : "transparent",
                color: typeFilter === t ? TYPE_COLORS[t] : "var(--color-text-dim)",
              }}
            >
              {TYPE_LABELS[t] ?? t}
            </button>
          ))}
        </div>
      </div>

      {/* Report-Liste */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center animate-slide-up">
          <p className="text-text-muted text-sm">
            {searchQuery ? "Keine Reports gefunden." : "Noch keine Simulationen durchgeführt."}
          </p>
          <Link href="/simulation/new" className="btn-primary text-sm inline-block mt-4">Erste Simulation starten</Link>
        </div>
      ) : (
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: "120ms" }}>
          {filtered.map((r) => {
            const status = STATUS_LABELS[r.status] ?? STATUS_LABELS.queued;
            const typeColor = TYPE_COLORS[r.sim_type] ?? "var(--color-accent)";
            const displayName = r.name ?? `${TYPE_LABELS[r.sim_type] ?? r.sim_type}`;
            const date = new Date(r.created_at);
            const isClickable = r.status === "completed" || r.status === "running";

            return (
              <Link
                key={r.id}
                href={isClickable ? `/simulation/${r.id}` : "#"}
                className="card flex items-center gap-4 p-4 transition-all duration-150 hover:border-accent group"
                style={{ cursor: isClickable ? "pointer" : "default" }}
              >
                {/* Typ-Indikator */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${typeColor}15` }}>
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: typeColor }}>
                    {(TYPE_LABELS[r.sim_type] ?? r.sim_type).slice(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate group-hover:text-accent transition-colors" style={{ fontFamily: "var(--font-display)" }}>
                      {displayName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-text-dim" style={{ fontFamily: "var(--font-mono)" }}>
                    <span>{date.toLocaleDateString("de-DE")} {date.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span>{r.agent_count} Agenten</span>
                    {r.persona_preset && <span>{PRESET_LABELS[r.persona_preset] ?? r.persona_preset}</span>}
                  </div>
                </div>

                {/* Status */}
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md shrink-0" style={{
                  fontFamily: "var(--font-mono)",
                  color: status.color,
                  background: status.bg,
                }}>
                  {status.label}
                </span>

                {/* Delete */}
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(r.id); }}
                  disabled={deleting === r.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 cursor-pointer"
                  style={{ color: "var(--color-red)" }}
                  title="Report löschen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
