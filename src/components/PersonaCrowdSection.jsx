"use client";
import { useRef, useEffect, useState, useCallback } from "react";

const VORNAMEN = ["Thomas","Stefan","Michael","Andreas","Markus","Lisa","Anna","Julia","Laura","Lena","Sarah","Maria","Sophie","Hannah","Lea","Daniel","Tobias","Alexander","Florian","Felix","Sandra","Nicole","Katharina","Claudia","Petra","Jonas","Leon","Emre","Nico","Tim","Mia","Emma","Jana","Miriam","Birgit","Kevin","Patrick","Lukas","Sven","Jan"];
const NACHNAMEN = ["Müller","Schmidt","Fischer","Weber","Wagner","Becker","Schulz","Koch","Richter","Wolf","Schneider","Hoffmann","Braun","Krüger","Lange"];
const BERUFE = ["Coach","Designerin","Entwickler","Lehrerin","Berater","Ärztin","Ingenieur","Gründerin","Freelancer","Managerin","Student","Pflegerin","Handwerker","Journalistin","Architektin","Texter","Trainerin","Analyst"];
const STAEDTE = ["Berlin","Hamburg","München","Köln","Frankfurt","Stuttgart","Düsseldorf","Leipzig","Dresden","Hannover","Nürnberg","Bremen","Freiburg","Heidelberg","Kiel"];

export default function PersonaCrowdSection({ C, mobile }) {
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);
  const agentsRef = useRef([]);
  const frameRef = useRef(null);
  const isVisibleRef = useRef(false);
  const [hoveredAgent, setHoveredAgent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const TOTAL = mobile ? 100 : 200;
  const colors = [C.accent, C.purple, C.blue, "#f472b6", C.warning, "#14b8a6", "#8b5cf6", C.accentDim];

  // Generate persona data once
  const personasRef = useRef(null);
  if (!personasRef.current) {
    personasRef.current = Array.from({ length: TOTAL }, (_, i) => {
      const vorname = VORNAMEN[i % VORNAMEN.length];
      const nachname = NACHNAMEN[i % NACHNAMEN.length];
      return {
        name: `${vorname} ${nachname}`,
        beruf: BERUFE[i % BERUFE.length],
        age: 22 + (i * 7 + 13) % 38,
        stadt: STAEDTE[i % STAEDTE.length],
      };
    });
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const cW = mobile ? Math.min(window.innerWidth - 40, 500) : 860;
    const cH = mobile ? 320 : 460;

    canvas.width = cW * dpr;
    canvas.height = cH * dpr;
    canvas.style.width = cW + "px";
    canvas.style.height = cH + "px";
    ctx.scale(dpr, dpr);

    const pad = 15;
    // Init agents — same style as hero AgentCanvas but more agents
    agentsRef.current = Array.from({ length: TOTAL }, (_, i) => ({
      x: pad + Math.random() * (cW - pad * 2),
      y: pad + Math.random() * (cH - pad * 2),
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 2 + Math.random() * 2.5,
      color: colors[i % colors.length],
      pulse: Math.random() * Math.PI * 2,
      influenceRadius: 50 + Math.random() * 30,
      personaIndex: i,
    }));

    // Intersection Observer
    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    if (sectionRef.current) observer.observe(sectionRef.current);

    function draw() {
      frameRef.current = requestAnimationFrame(draw);
      if (!isVisibleRef.current) return;

      ctx.clearRect(0, 0, cW, cH);
      const agents = agentsRef.current;

      // Verbindungslinien
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[j].x - agents[i].x;
          const dy = agents[j].y - agents[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < agents[i].influenceRadius) {
            const alpha = (1 - dist / agents[i].influenceRadius) * 0.08;
            ctx.beginPath();
            ctx.moveTo(agents[i].x, agents[i].y);
            ctx.lineTo(agents[j].x, agents[j].y);
            ctx.strokeStyle = `rgba(110, 231, 183, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Agents zeichnen + Physik
      for (let i = 0; i < agents.length; i++) {
        const a = agents[i];
        a.pulse += 0.015;
        const ps = 1 + Math.sin(a.pulse) * 0.2;

        // Leichte Abstoßung bei Nähe
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[j].x - a.x;
          const dy = agents[j].y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 12 && dist > 0.1) {
            const force = (12 - dist) / 12 * 0.03;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx -= fx; a.vy -= fy;
            agents[j].vx += fx; agents[j].vy += fy;
          }
        }

        // Bewegung
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < pad || a.x > cW - pad) a.vx *= -1;
        if (a.y < pad || a.y > cH - pad) a.vy *= -1;
        a.x = Math.max(pad, Math.min(cW - pad, a.x));
        a.y = Math.max(pad, Math.min(cH - pad, a.y));
        a.vx *= 0.998;
        a.vy *= 0.998;
        a.vx += (Math.random() - 0.5) * 0.02;
        a.vy += (Math.random() - 0.5) * 0.02;

        // Glow
        const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.radius * 4.5 * ps);
        g.addColorStop(0, a.color + "35");
        g.addColorStop(1, a.color + "00");
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * 4.5 * ps, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius * ps, 0, Math.PI * 2);
        ctx.fillStyle = a.color;
        ctx.fill();
      }
    }
    draw();

    return () => {
      cancelAnimationFrame(frameRef.current);
      observer.disconnect();
    };
  }, [mobile, TOTAL]);

  // Hover detection
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = parseFloat(canvas.style.width) / rect.width;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleX;

    let closest = null;
    let minDist = 25;
    const agents = agentsRef.current;
    for (let i = 0; i < agents.length; i++) {
      const d = Math.hypot(agents[i].x - mx, agents[i].y - my);
      if (d < minDist) { closest = i; minDist = d; }
    }

    if (closest !== null) {
      setHoveredAgent(closest);
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    } else {
      setHoveredAgent(null);
    }
  }, []);

  const persona = hoveredAgent !== null ? personasRef.current[hoveredAgent] : null;
  const agentColor = hoveredAgent !== null ? agentsRef.current[hoveredAgent]?.color : null;

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

        {/* Canvas Container */}
        <div style={{ position: "relative", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", padding: 12 }}>
          <canvas
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredAgent(null)}
            style={{ display: "block", borderRadius: 12, cursor: hoveredAgent !== null ? "pointer" : "default", width: "100%" }}
          />

          {/* Tooltip */}
          {persona && !mobile && (
            <div style={{
              position: "absolute",
              left: Math.min(Math.max(tooltipPos.x, 80), (canvasRef.current?.parentElement?.offsetWidth || 900) - 80),
              top: tooltipPos.y - 60,
              transform: "translateX(-50%)",
              background: C.bgCard,
              border: `1px solid ${agentColor}35`,
              borderRadius: 12,
              padding: "10px 16px",
              pointerEvents: "none",
              zIndex: 10,
              boxShadow: `0 8px 32px ${agentColor}20, 0 2px 8px rgba(0,0,0,0.08)`,
              whiteSpace: "nowrap",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: agentColor }}>{persona.name}</div>
              <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{persona.age} J. · {persona.beruf} · {persona.stadt}</div>
            </div>
          )}

          {/* Counter */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 6px 0", fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.textDim }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, display: "inline-block", boxShadow: `0 0 6px ${C.accent}` }} />
              {TOTAL} Personas aktiv
            </span>
            <span>Live-Netzwerk</span>
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
