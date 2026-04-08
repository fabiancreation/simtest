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
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <h3 className="font-semibold mb-4">Varianten-Vergleich</h3>
        <div className="space-y-4">
          {byVariant.map((v) => {
            const total = v.totalAgents || 1;
            return (
              <div key={v.variantIndex} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Variante {v.variantIndex + 1}</span>
                  <span className="text-text-dim">
                    Engagement: {(v.engagementRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex h-6 rounded-full overflow-hidden bg-border">
                  <div
                    className="bg-accent transition-all"
                    style={{ width: `${(v.positiv / total) * 100}%` }}
                    title={`Positiv: ${v.positiv}`}
                  />
                  <div
                    className="bg-warning transition-all"
                    style={{ width: `${(v.neutral / total) * 100}%` }}
                    title={`Neutral: ${v.neutral}`}
                  />
                  <div
                    className="bg-red transition-all"
                    style={{ width: `${(v.negativ / total) * 100}%` }}
                    title={`Negativ: ${v.negativ}`}
                  />
                </div>
                <div className="flex gap-4 text-xs text-text-dim">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent" /> Positiv: {v.positiv}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-warning" /> Neutral: {v.neutral}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-red" /> Negativ: {v.negativ}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Engagement nach Alter */}
      {engagementByAge.length > 0 && (
        <div className="rounded-xl border border-border bg-bg-card p-6">
          <h3 className="font-semibold mb-4">Engagement nach Alter</h3>
          <div className="space-y-3">
            {engagementByAge.map((seg) => (
              <div key={seg.ageRange} className="flex items-center gap-4">
                <span className="text-sm text-text-muted w-12">{seg.ageRange}</span>
                <div className="flex-1 h-4 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      seg.dominantSentiment === "positiv"
                        ? "bg-accent"
                        : seg.dominantSentiment === "negativ"
                        ? "bg-red"
                        : "bg-warning"
                    }`}
                    style={{ width: `${seg.engagementRate * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-dim w-10 text-right">
                  {(seg.engagementRate * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
