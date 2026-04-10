"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PROJECT_COLORS } from "@/types/simulation";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState(PROJECT_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Projektname ist Pflicht."); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/projects/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="animate-slide-up">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>
          Neues Projekt
        </h1>
        <p className="text-text-muted mt-1 text-sm">
          Gruppiere Simulationen und Personas. Die Beschreibung fliesst automatisch als Kontext in deine Simulationen ein.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up" style={{ animationDelay: "60ms" }}>
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Projektname *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Launch Online-Kurs Q2"
            className="input w-full"
            autoFocus
          />
        </div>

        {/* Beschreibung */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Beschreibung</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={"Beschreibe dein Projekt, Produkt oder Vorhaben.\n\nz.B. Branche, Zielmarkt, USP, Tonalitaet, Preisrange...\n\nDiese Beschreibung wird automatisch als Kontext in Simulationen verwendet."}
            className="input w-full"
            rows={6}
          />
          <p className="text-xs text-text-dim mt-1">
            Je detaillierter, desto bessere Simulationsergebnisse.
          </p>
        </div>

        {/* Farbe */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Farbe</label>
          <div className="flex gap-2">
            {PROJECT_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-lg transition-all cursor-pointer"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px var(--color-bg), 0 0 0 4px ${c}` : "none",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red" style={{ color: "var(--color-red)" }}>{error}</p>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button type="submit" disabled={loading} className="btn-primary text-sm">
            {loading ? "Erstelle..." : "Projekt erstellen"}
          </button>
          <button type="button" onClick={() => router.back()} className="px-4 py-2 rounded-lg text-sm text-text-muted hover:text-text transition-colors cursor-pointer">
            Abbrechen
          </button>
        </div>
      </form>
    </div>
  );
}
