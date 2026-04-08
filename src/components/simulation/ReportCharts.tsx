"use client";

interface VariantBar {
  variantIndex: number;
  totalAgents: number;
  positiv: number;
  neutral: number;
  negativ: number;
  engagementRate: number;
}

interface AgeSegment {
  ageRange: string;
  engagementRate: number;
  dominantSentiment: string;
}

export function ReportCharts({
  byVariant,
  engagementByAge,
}: {
  byVariant: VariantBar[];
  engagementByAge: AgeSegment[];
}) {
  return (
    <div className="space-y-6">
      {/* Varianten-Vergleich */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(96,165,250,0.15)" }}>
            <svg className="w-3.5 h-3.5 text-blue" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
            </svg>
          </div>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>Varianten-Vergleich</h3>
        </div>
        <div className="space-y-5">
          {byVariant.map((v) => {
            const total = v.totalAgents || 1;
            return (
              <div key={v.variantIndex} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ fontFamily: "var(--font-display)" }}>
                    Variante {v.variantIndex + 1}
                  </span>
                  <span className="badge" style={{
                    background: v.engagementRate > 0.6 ? "rgba(110,231,183,0.1)" : v.engagementRate > 0.3 ? "rgba(245,158,11,0.1)" : "rgba(248,113,113,0.1)",
                    color: v.engagementRate > 0.6 ? "var(--color-accent)" : v.engagementRate > 0.3 ? "var(--color-warning)" : "var(--color-red)",
                  }}>
                    {(v.engagementRate * 100).toFixed(0)}% Engagement
                  </span>
                </div>
                <div className="flex h-7 rounded-lg overflow-hidden" style={{ background: "var(--color-border)" }}>
                  <div
                    className="transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${(v.positiv / total) * 100}%`, background: "var(--color-accent)" }}
                    title={`Positiv: ${v.positiv}`}
                  >
                    {v.positiv > 0 && (v.positiv / total) > 0.15 && (
                      <span className="text-[10px] font-bold text-bg">{v.positiv}</span>
                    )}
                  </div>
                  <div
                    className="transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${(v.neutral / total) * 100}%`, background: "var(--color-warning)" }}
                    title={`Neutral: ${v.neutral}`}
                  >
                    {v.neutral > 0 && (v.neutral / total) > 0.15 && (
                      <span className="text-[10px] font-bold text-bg">{v.neutral}</span>
                    )}
                  </div>
                  <div
                    className="transition-all duration-500 flex items-center justify-center"
                    style={{ width: `${(v.negativ / total) * 100}%`, background: "var(--color-red)" }}
                    title={`Negativ: ${v.negativ}`}
                  >
                    {v.negativ > 0 && (v.negativ / total) > 0.15 && (
                      <span className="text-[10px] font-bold text-bg">{v.negativ}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-5 text-xs text-text-dim">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-accent)" }} /> Positiv: {v.positiv}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-warning)" }} /> Neutral: {v.neutral}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: "var(--color-red)" }} /> Negativ: {v.negativ}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement nach Alter */}
      {engagementByAge.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: "rgba(167,139,250,0.15)" }}>
              <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7" />
              </svg>
            </div>
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 700 }}>Engagement nach Alter</h3>
          </div>
          <div className="space-y-4">
            {engagementByAge.map((seg) => {
              const barColor = seg.dominantSentiment === "positiv" ? "var(--color-accent)"
                : seg.dominantSentiment === "negativ" ? "var(--color-red)"
                : "var(--color-warning)";
              return (
                <div key={seg.ageRange} className="flex items-center gap-4">
                  <span className="text-xs text-text-muted w-10 text-right shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                    {seg.ageRange}
                  </span>
                  <div className="flex-1 h-5 rounded-lg overflow-hidden" style={{ background: "var(--color-border)" }}>
                    <div
                      className="h-full rounded-lg transition-all duration-500"
                      style={{
                        width: `${seg.engagementRate * 100}%`,
                        background: barColor,
                        boxShadow: `0 0 8px ${barColor}30`,
                      }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right shrink-0" style={{
                    fontFamily: "var(--font-mono)",
                    fontWeight: 600,
                    color: barColor,
                  }}>
                    {(seg.engagementRate * 100).toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
