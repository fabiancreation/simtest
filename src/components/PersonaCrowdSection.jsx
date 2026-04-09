"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const VORNAMEN = ["Thomas","Stefan","Michael","Andreas","Markus","Lisa","Anna","Julia","Laura","Lena","Sarah","Maria","Sophie","Hannah","Lea","Daniel","Tobias","Alexander","Florian","Felix","Sandra","Nicole","Katharina","Claudia","Petra","Jonas","Leon","Emre","Nico","Tim","Mia","Emma","Jana","Miriam","Birgit","Kevin","Patrick","Lukas","Sven","Jan"];
const BERUFE = ["Coach","Designerin","Entwickler","Lehrerin","Berater","Ärztin","Ingenieur","Gründerin","Freelancer","Managerin","Student","Pflegerin","Handwerker","Journalistin","Architektin","Texter","Beraterin","Trainer"];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

export default function PersonaCrowdSection({ C, mobile }) {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);
  const nodesRef = useRef([]);
  const animFrameRef = useRef(null);

  const TOTAL = mobile ? 80 : 200;
  const COLORS = [C.accent, C.purple, C.blue, C.accentDim, "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6"];

  // Generate stable persona data
  const personas = useRef(null);
  if (!personas.current) {
    const rng = seededRandom(42);
    personas.current = Array.from({ length: TOTAL }, (_, i) => {
      const name = VORNAMEN[Math.floor(rng() * VORNAMEN.length)];
      const nachname = ["Müller","Schmidt","Fischer","Weber","Wagner","Becker","Schulz","Koch","Richter","Wolf"][Math.floor(rng() * 10)];
      const beruf = BERUFE[Math.floor(rng() * BERUFE.length)];
      const age = 22 + Math.floor(rng() * 38);
      const color = COLORS[i % COLORS.length];
      return { name: `${name} ${nachname}`, beruf, age, color, initials: name[0] + nachname[0] };
    });
  }

  // Scroll tracking
  useEffect(() => {
    function onScroll() {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress: 0 when section enters viewport bottom, 1 when section top reaches viewport center
      const raw = 1 - (rect.top - vh * 0.3) / (vh * 0.7);
      setScrollProgress(Math.max(0, Math.min(1, raw)));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mouse tracking for hover
  const handleMouseMove = useCallback((e) => {
    if (!canvasRef.current || !nodesRef.current.length) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const my = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    let closest = null;
    let minDist = 30;
    for (let i = 0; i < nodesRef.current.length; i++) {
      const n = nodesRef.current[i];
      const d = Math.hypot(n.x - mx, n.y - my);
      if (d < minDist) { closest = i; minDist = d; }
    }
    setHoveredNode(closest);
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = (mobile ? 320 : 420) * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = (mobile ? 320 : 420) + "px";
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width / dpr;
    const H = () => canvas.height / dpr;

    // Generate grid positions
    const cols = mobile ? 8 : 16;
    const rows = Math.ceil(TOTAL / cols);

    function getGridPos(i) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cellW = (W() - 40) / cols;
      const cellH = (H() - 40) / rows;
      return {
        x: 20 + col * cellW + cellW / 2,
        y: 20 + row * cellH + cellH / 2,
      };
    }

    // Generate network positions (force-directed-ish)
    const rng = seededRandom(99);
    function getNetworkPos(i) {
      const angle = (i / TOTAL) * Math.PI * 2 + rng() * 0.8;
      const radius = 60 + rng() * (Math.min(W(), H()) * 0.38);
      return {
        x: W() / 2 + Math.cos(angle) * radius * (0.7 + rng() * 0.6),
        y: H() / 2 + Math.sin(angle) * radius * (0.7 + rng() * 0.6),
      };
    }

    // Generate connections for network (each node connects to 2-4 neighbors)
    const connections = [];
    for (let i = 0; i < TOTAL; i++) {
      const numConn = 2 + Math.floor(rng() * 3);
      for (let c = 0; c < numConn; c++) {
        const j = Math.floor(rng() * TOTAL);
        if (j !== i) connections.push([i, j]);
      }
    }

    function draw() {
      const w = W();
      const h = H();
      ctx.clearRect(0, 0, w, h);

      const t = scrollProgress;
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOutQuad

      // Calculate current positions
      const nodes = [];
      for (let i = 0; i < TOTAL; i++) {
        const grid = getGridPos(i);
        const net = getNetworkPos(i);
        nodes.push({
          x: grid.x + (net.x - grid.x) * eased,
          y: grid.y + (net.y - grid.y) * eased,
          color: personas.current[i].color,
          initials: personas.current[i].initials,
        });
      }
      nodesRef.current = nodes;

      // Draw connections (fade in with scroll)
      if (eased > 0.1) {
        const connAlpha = Math.min(1, (eased - 0.1) * 1.5);
        ctx.lineWidth = 0.5;
        for (const [a, b] of connections) {
          if (a >= TOTAL || b >= TOTAL) continue;
          const na = nodes[a];
          const nb = nodes[b];
          const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
          if (dist > 160) continue; // Only draw short connections
          const rgb = hexToRgb(na.color);
          ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${connAlpha * 0.15 * (1 - dist / 160)})`;
          ctx.beginPath();
          ctx.moveTo(na.x, na.y);
          ctx.lineTo(nb.x, nb.y);
          ctx.stroke();
        }
      }

      // Draw nodes
      const nodeSize = mobile ? 12 : 16;
      const now = Date.now();
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = hoveredNode === i;
        const pulse = Math.sin(now / 1500 + i * 0.3) * 0.15 + 0.85; // Subtle pulse
        const size = (isHovered ? nodeSize * 1.8 : nodeSize) * (isHovered ? 1 : pulse);
        const rgb = hexToRgb(n.color);

        // Glow for hovered
        if (isHovered) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 20;
        }

        // Node background
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isHovered ? 0.3 : 0.12})`;
        ctx.beginPath();
        ctx.roundRect(n.x - size / 2, n.y - size / 2, size, size, size * 0.25);
        ctx.fill();

        // Node border
        ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isHovered ? 0.6 : 0.25})`;
        ctx.lineWidth = isHovered ? 1.5 : 0.5;
        ctx.stroke();

        // Initials
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${isHovered ? 1 : 0.7})`;
        ctx.font = `${isHovered ? "bold" : "600"} ${isHovered ? 10 : mobile ? 6 : 8}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.initials, n.x, n.y);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      window.removeEventListener("resize", resize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scrollProgress, hoveredNode, mobile, TOTAL, COLORS]);

  const hovered = hoveredNode !== null ? personas.current[hoveredNode] : null;

  return (
    <section ref={sectionRef} style={{ padding: mobile ? "0 0 52px" : "0 0 84px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>200 Individuen</div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
            Jede Persona ist einzigartig
          </h3>
          <p style={{ fontSize: mobile ? 14 : 15, color: C.textMuted, lineHeight: 1.65, maxWidth: 540, margin: "0 auto" }}>
            Nicht 200 Kopien. 200 individuelle Charaktere mit eigenem Namen, Beruf, Persönlichkeit, Werten und Kaufverhalten — statistisch verteilt wie eine echte Zielgruppe.
          </p>
        </div>

        {/* Canvas + Tooltip */}
        <div style={{ position: "relative", marginBottom: 24, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          {/* Glow effects */}
          <div style={{ position: "absolute", top: -40, left: "15%", width: 160, height: 160, background: C.accent + "08", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -30, right: "20%", width: 120, height: 120, background: C.purple + "08", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />

          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ display: "block", cursor: hoveredNode !== null ? "pointer" : "default" }}
          />

          {/* Tooltip */}
          {hovered && !mobile && nodesRef.current[hoveredNode] && (
            <div style={{
              position: "absolute",
              left: Math.min(nodesRef.current[hoveredNode].x / (window.devicePixelRatio || 1), 800),
              top: nodesRef.current[hoveredNode].y / (window.devicePixelRatio || 1) - 70,
              transform: "translateX(-50%)",
              background: C.bgCard,
              border: `1px solid ${hovered.color}40`,
              borderRadius: 10,
              padding: "8px 14px",
              pointerEvents: "none",
              zIndex: 10,
              boxShadow: `0 8px 24px ${hovered.color}15`,
              whiteSpace: "nowrap",
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: hovered.color }}>{hovered.name}</div>
              <div style={{ fontSize: 10, color: C.textDim }}>{hovered.age} J. · {hovered.beruf}</div>
            </div>
          )}

          {/* Phase label */}
          <div style={{
            position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)",
            fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.textDim,
            background: C.bgCard + "cc", padding: "4px 12px", borderRadius: 6, border: `1px solid ${C.border}`,
          }}>
            {scrollProgress < 0.3 ? "GRID — Übersicht aller Personas" : scrollProgress < 0.7 ? "TRANSITION — Verbindungen entstehen" : "NETZWERK — So kommunizieren sie"}
          </div>
        </div>

        {/* Scroll hint */}
        {scrollProgress < 0.15 && (
          <div style={{ textAlign: "center", opacity: 1 - scrollProgress * 6, transition: "opacity 0.3s" }}>
            <div style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono',monospace", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
              Scrolle um die Netzwerk-Transformation zu sehen
            </div>
          </div>
        )}

        {/* Charakter-Karten */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginTop: 20 }}>
          {[
            { name: "Sabine Meier", age: 47, beruf: "Business Coach", city: "Stuttgart", trait: "Gewissenhaft, ROI-orientiert", color: C.accent, values: "Zeitfreiheit, Impact", objection: "Zu teuer ohne Proof" },
            { name: "Emre Yilmaz", age: 24, beruf: "UX Designer", city: "Frankfurt", trait: "Offen, trend-affin", color: C.purple, values: "Authentizität, Wachstum", objection: "Wirkt wie Boomer-Marketing" },
            { name: "Dr. Katharina Weiß", age: 41, beruf: "Marketing-Leiterin", city: "Köln", trait: "Analytisch, datengetrieben", color: C.blue, values: "Effizienz, Messbarkeit", objection: "Kein messbarer Business Case" },
          ].map((p, i) => (
            <div key={i} className="card-hover" style={{
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14,
              padding: mobile ? 16 : 20, position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${p.color}40, ${p.color})` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, background: p.color + "18",
                  border: `1.5px solid ${p.color}30`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: p.color, fontFamily: "'JetBrains Mono',monospace",
                }}>{p.name.split(" ").map(n => n[0]).join("")}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: C.textDim }}>{p.age} J. · {p.beruf} · {p.city}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 8 }}>{p.trait}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {p.values.split(", ").map((v, j) => (
                  <span key={j} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 5, background: p.color + "12", color: p.color, fontWeight: 500 }}>{v}</span>
                ))}
              </div>
              <div style={{ fontSize: 11, color: C.textDim, fontStyle: "italic" }}>
                <span style={{ color: C.red, marginRight: 4 }}>!</span>{p.objection}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
