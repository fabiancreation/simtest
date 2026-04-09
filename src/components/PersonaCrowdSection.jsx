"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const VORNAMEN = ["Thomas","Stefan","Michael","Andreas","Markus","Lisa","Anna","Julia","Laura","Lena","Sarah","Maria","Sophie","Hannah","Lea","Daniel","Tobias","Alexander","Florian","Felix","Sandra","Nicole","Katharina","Claudia","Petra","Jonas","Leon","Emre","Nico","Tim","Mia","Emma","Jana","Miriam","Birgit","Kevin","Patrick","Lukas","Sven","Jan"];
const NACHNAMEN = ["Müller","Schmidt","Fischer","Weber","Wagner","Becker","Schulz","Koch","Richter","Wolf","Schneider","Hoffmann","Braun","Krüger","Lange"];
const BERUFE = ["Coach","Designerin","Entwickler","Lehrerin","Berater","Ärztin","Ingenieur","Gründerin","Freelancer","Managerin","Student","Pflegerin","Handwerker","Journalistin","Architektin","Texter","Trainerin","Analyst"];
const STAEDTE = ["Berlin","Hamburg","München","Köln","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dresden","Hannover","Nürnberg","Bremen","Freiburg","Heidelberg","Kiel"];

function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function PersonaCrowdSection({ C, mobile }) {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const nodesRef = useRef([]);
  const connectionsRef = useRef([]);
  const animRef = useRef(null);
  const isVisibleRef = useRef(false);

  const TOTAL = mobile ? 100 : 200;
  const COLORS = [C.accent, C.purple, C.blue, C.accentDim, "#f59e0b", "#ec4899", "#14b8a6", "#8b5cf6"];

  // Generate stable persona data once
  const personasRef = useRef(null);
  if (!personasRef.current) {
    const rng = seededRandom(42);
    personasRef.current = Array.from({ length: TOTAL }, (_, i) => {
      const vorname = VORNAMEN[Math.floor(rng() * VORNAMEN.length)];
      const nachname = NACHNAMEN[Math.floor(rng() * NACHNAMEN.length)];
      const beruf = BERUFE[Math.floor(rng() * BERUFE.length)];
      const stadt = STAEDTE[Math.floor(rng() * STAEDTE.length)];
      const age = 22 + Math.floor(rng() * 38);
      const color = COLORS[i % COLORS.length];
      return { name: `${vorname} ${nachname}`, beruf, age, stadt, color, initials: vorname[0] + nachname[0] };
    });
  }

  // Mouse tracking
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    setMousePos({ x: mx, y: my });

    let closest = null;
    let minDist = 40 * (window.devicePixelRatio || 1);
    const nodes = nodesRef.current;
    for (let i = 0; i < nodes.length; i++) {
      const d = Math.hypot(nodes[i].x - mx, nodes[i].y - my);
      if (d < minDist) { closest = i; minDist = d; }
    }
    setHoveredNode(closest);
  }, []);

  // Canvas setup + physics simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const h = mobile ? 360 : 480;
      canvas.width = rect.width * dpr;
      canvas.height = h * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = h + "px";
    }
    resize();
    window.addEventListener("resize", resize);

    const W = () => canvas.width;
    const H = () => canvas.height;

    // Initialize node positions
    const rng = seededRandom(77);
    const nodes = [];
    for (let i = 0; i < TOTAL; i++) {
      const angle = rng() * Math.PI * 2;
      const radius = 80 * dpr + rng() * Math.min(W(), H()) * 0.35;
      nodes.push({
        x: W() / 2 + Math.cos(angle) * radius * (0.5 + rng() * 0.5),
        y: H() / 2 + Math.sin(angle) * radius * (0.5 + rng() * 0.5),
        vx: (rng() - 0.5) * 0.3,
        vy: (rng() - 0.5) * 0.3,
        color: personasRef.current[i].color,
        initials: personasRef.current[i].initials,
        radius: (mobile ? 10 : 14) * dpr,
      });
    }
    nodesRef.current = nodes;

    // Generate connections (each node connects to 2-3 nearest)
    const connections = [];
    for (let i = 0; i < TOTAL; i++) {
      const dists = [];
      for (let j = 0; j < TOTAL; j++) {
        if (i === j) continue;
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        dists.push({ j, d });
      }
      dists.sort((a, b) => a.d - b.d);
      const count = 2 + Math.floor(rng() * 2);
      for (let k = 0; k < count && k < dists.length; k++) {
        const pair = [Math.min(i, dists[k].j), Math.max(i, dists[k].j)];
        if (!connections.some(c => c[0] === pair[0] && c[1] === pair[1])) {
          connections.push(pair);
        }
      }
    }
    connectionsRef.current = connections;

    // Intersection Observer -- nur animieren wenn sichtbar
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);

    // Physics + Draw loop
    function tick() {
      animRef.current = requestAnimationFrame(tick);
      if (!isVisibleRef.current) return; // Nicht zeichnen wenn nicht sichtbar

      const w = W();
      const h = H();
      const padding = 20 * dpr;

      // Sanfte Physik: Nodes driften langsam, stoßen sich leicht ab
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];

        // Leichte Zentrumsgravitation
        const dx = w / 2 - n.x;
        const dy = h / 2 - n.y;
        const distCenter = Math.hypot(dx, dy);
        if (distCenter > w * 0.4) {
          n.vx += dx * 0.00003;
          n.vy += dy * 0.00003;
        }

        // Abstoßung von nahen Nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const ddx = n.x - other.x;
          const ddy = n.y - other.y;
          const dist = Math.hypot(ddx, ddy);
          const minDist = 30 * dpr;
          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) * 0.002;
            const fx = (ddx / dist) * force;
            const fy = (ddy / dist) * force;
            n.vx += fx;
            n.vy += fy;
            other.vx -= fx;
            other.vy -= fy;
          }
        }

        // Leichte Anziehung entlang Verbindungen
        for (const [a, b] of connections) {
          if (a !== i && b !== i) continue;
          const other = nodes[a === i ? b : a];
          const ddx = other.x - n.x;
          const ddy = other.y - n.y;
          const dist = Math.hypot(ddx, ddy);
          const targetDist = 100 * dpr;
          if (dist > targetDist) {
            n.vx += ddx * 0.00005;
            n.vy += ddy * 0.00005;
          }
        }

        // Dämpfung
        n.vx *= 0.98;
        n.vy *= 0.98;

        // Position aktualisieren
        n.x += n.vx;
        n.y += n.vy;

        // Bounds
        if (n.x < padding) { n.x = padding; n.vx *= -0.5; }
        if (n.x > w - padding) { n.x = w - padding; n.vx *= -0.5; }
        if (n.y < padding) { n.y = padding; n.vy *= -0.5; }
        if (n.y > h - padding) { n.y = h - padding; n.vy *= -0.5; }
      }

      // Draw
      ctx.clearRect(0, 0, w, h);

      // Connections
      for (const [a, b] of connections) {
        const na = nodes[a];
        const nb = nodes[b];
        const dist = Math.hypot(na.x - nb.x, na.y - nb.y);
        const maxDist = 180 * dpr;
        if (dist > maxDist) continue;
        const alpha = 0.08 * (1 - dist / maxDist);
        ctx.strokeStyle = hexToRgba(na.color, alpha);
        ctx.lineWidth = 0.5 * dpr;
        ctx.beginPath();
        ctx.moveTo(na.x, na.y);
        ctx.lineTo(nb.x, nb.y);
        ctx.stroke();
      }

      // Nodes
      const hIdx = hoveredNode;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const isHovered = i === hIdx;
        const r = isHovered ? n.radius * 1.6 : n.radius;

        // Glow
        if (isHovered) {
          ctx.shadowColor = n.color;
          ctx.shadowBlur = 16 * dpr;
        }

        // Background
        ctx.fillStyle = hexToRgba(n.color, isHovered ? 0.25 : 0.1);
        ctx.beginPath();
        ctx.roundRect(n.x - r, n.y - r, r * 2, r * 2, r * 0.3);
        ctx.fill();

        // Border
        ctx.strokeStyle = hexToRgba(n.color, isHovered ? 0.5 : 0.2);
        ctx.lineWidth = (isHovered ? 1.5 : 0.5) * dpr;
        ctx.stroke();

        // Reset shadow
        ctx.shadowColor = "transparent";
        ctx.shadowBlur = 0;

        // Initials
        ctx.fillStyle = hexToRgba(n.color, isHovered ? 1 : 0.65);
        ctx.font = `${isHovered ? "bold" : "600"} ${(isHovered ? 11 : mobile ? 7 : 9) * dpr}px 'JetBrains Mono', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(n.initials, n.x, n.y);

        // Highlight connections for hovered node
        if (isHovered) {
          for (const [a, b] of connections) {
            if (a !== i && b !== i) continue;
            const other = nodes[a === i ? b : a];
            ctx.strokeStyle = hexToRgba(n.color, 0.3);
            ctx.lineWidth = 1.5 * dpr;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      }
    }

    tick();
    return () => {
      window.removeEventListener("resize", resize);
      observer.disconnect();
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [mobile, TOTAL, COLORS, hoveredNode]);

  const hovered = hoveredNode !== null ? personasRef.current[hoveredNode] : null;
  const tooltipNode = hoveredNode !== null ? nodesRef.current[hoveredNode] : null;

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
            200 individuelle Charaktere mit eigenem Namen, Beruf, Persönlichkeit und Kaufverhalten — verbunden in einem sozialen Netzwerk, das echte Kommunikation simuliert.
          </p>
        </div>

        {/* Canvas */}
        <div style={{ position: "relative", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden" }}>
          {/* Ambient glow */}
          <div style={{ position: "absolute", top: -60, left: "10%", width: 200, height: 200, background: C.accent + "06", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -40, right: "15%", width: 160, height: 160, background: C.purple + "06", borderRadius: "50%", filter: "blur(50px)", pointerEvents: "none" }} />

          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredNode(null)}
            style={{ display: "block", cursor: hoveredNode !== null ? "pointer" : "default" }}
          />

          {/* Tooltip */}
          {hovered && tooltipNode && !mobile && (
            <div style={{
              position: "absolute",
              left: Math.min(Math.max(tooltipNode.x / (window.devicePixelRatio || 1), 80), 820),
              top: tooltipNode.y / (window.devicePixelRatio || 1) - 72,
              transform: "translateX(-50%)",
              background: C.bgCard,
              border: `1px solid ${hovered.color}35`,
              borderRadius: 12,
              padding: "10px 16px",
              pointerEvents: "none",
              zIndex: 10,
              boxShadow: `0 8px 32px ${hovered.color}20, 0 2px 8px rgba(0,0,0,0.1)`,
              whiteSpace: "nowrap",
              backdropFilter: "blur(8px)",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: hovered.color }}>{hovered.name}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{hovered.age} J. · {hovered.beruf} · {hovered.stadt}</div>
            </div>
          )}

          {/* Counter */}
          <div style={{
            position: "absolute", bottom: 12, right: 16,
            fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.textDim,
            background: C.bgCard + "cc", padding: "3px 10px", borderRadius: 6, border: `1px solid ${C.border}`,
          }}>
            {TOTAL} Personas · Live-Netzwerk
          </div>
        </div>

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
