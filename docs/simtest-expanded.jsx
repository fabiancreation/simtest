import { useState, useEffect, useRef, useCallback } from "react";

const C = {
  bg: "#0a0a0f",
  bgCard: "#12121a",
  bgCardHover: "#1a1a28",
  accent: "#6ee7b7",
  accentDim: "#34d399",
  accentGlow: "rgba(110, 231, 183, 0.15)",
  text: "#e8e8f0",
  textMuted: "#8888a0",
  textDim: "#5a5a72",
  border: "#1e1e2e",
  borderHover: "#2a2a3e",
  warning: "#f59e0b",
  purple: "#a78bfa",
  blue: "#60a5fa",
  red: "#f87171",
};

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1024);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return w;
}

function AgentCanvas({ width, height }) {
  const canvasRef = useRef(null);
  const agentsRef = useRef([]);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: width / 2, y: height / 2 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const agentCount = width < 350 ? 30 : 55;
    const colors = [C.accent, C.purple, C.blue, "#f472b6", C.warning];
    agentsRef.current = Array.from({ length: agentCount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6,
      radius: 2 + Math.random() * 1.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      opinion: Math.random(), pulse: Math.random() * Math.PI * 2,
      influenceRadius: 50 + Math.random() * 40,
    }));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const agents = agentsRef.current;
      for (let i = 0; i < agents.length; i++) {
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[j].x - agents[i].x, dy = agents[j].y - agents[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < agents[i].influenceRadius) {
            const alpha = (1 - dist / agents[i].influenceRadius) * 0.1;
            ctx.beginPath(); ctx.moveTo(agents[i].x, agents[i].y); ctx.lineTo(agents[j].x, agents[j].y);
            ctx.strokeStyle = `rgba(110, 231, 183, ${alpha})`; ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      for (const agent of agents) {
        agent.pulse += 0.02;
        const ps = 1 + Math.sin(agent.pulse) * 0.3;
        const mdx = mouseRef.current.x - agent.x, mdy = mouseRef.current.y - agent.y;
        const mD = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mD < 120 && mD > 5) { agent.vx += (mdx / mD) * 0.01; agent.vy += (mdy / mD) * 0.01; }
        agent.x += agent.vx; agent.y += agent.vy;
        if (agent.x < 0 || agent.x > width) agent.vx *= -1;
        if (agent.y < 0 || agent.y > height) agent.vy *= -1;
        agent.x = Math.max(0, Math.min(width, agent.x));
        agent.y = Math.max(0, Math.min(height, agent.y));
        agent.vx *= 0.998; agent.vy *= 0.998;
        agent.vx += (Math.random() - 0.5) * 0.04; agent.vy += (Math.random() - 0.5) * 0.04;
        const g = ctx.createRadialGradient(agent.x, agent.y, 0, agent.x, agent.y, agent.radius * 4 * ps);
        g.addColorStop(0, agent.color + "40"); g.addColorStop(1, agent.color + "00");
        ctx.beginPath(); ctx.arc(agent.x, agent.y, agent.radius * 4 * ps, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(agent.x, agent.y, agent.radius * ps, 0, Math.PI * 2);
        ctx.fillStyle = agent.color; ctx.fill();
      }
      frameRef.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(frameRef.current);
  }, [width, height]);

  return (
    <canvas ref={canvasRef} style={{ width: "100%", height, borderRadius: 12, display: "block" }}
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mouseRef.current = { x: (e.clientX - r.left) * (width / r.width), y: e.clientY - r.top }; }}
      onTouchMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const t = e.touches[0]; mouseRef.current = { x: (t.clientX - r.left) * (width / r.width), y: t.clientY - r.top }; }}
    />
  );
}

function AnimatedNumber({ target, duration = 2000, suffix = "", prefix = "" }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const s = performance.now();
        function tick(now) {
          const p = Math.min((now - s) / duration, 1);
          setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{prefix}{value.toLocaleString("de-DE")}{suffix}</span>;
}

// Simulated live "business intelligence" feed
function BIFeed({ mobile }) {
  const messages = [
    { persona: "Strategie-Run · Pivot-Test", color: C.accent, level: "Ebene 3", text: "\"Segment B (35–45, urban) reagiert 3× stärker auf Subscription-Modell als Einmalkauf. Pivot empfohlen.\"" },
    { persona: "Produkt-Validierung · Feature-Set", color: C.purple, level: "Ebene 2", text: "\"Feature 'Team-Sharing' erzeugt Begeisterung bei Agenturen. Bei Solo-Unternehmern kaum relevant.\"" },
    { persona: "Copy-Test · Headline A vs B", color: C.blue, level: "Ebene 1", text: "\"Variante B gewinnt mit 71%: 'Spare 3 Stunden' schlägt 'Steigere deine Effizienz' deutlich.\"" },
    { persona: "Pricing-Test · €29 vs €49", color: C.warning, level: "Ebene 2", text: "\"Bei €49 fällt Conversion um 38%. Sweet Spot liegt bei €34–37 für diese Zielgruppe.\"" },
    { persona: "Markteintrittsstrategie", color: C.accent, level: "Ebene 3", text: "\"DACH-Markt: B2B-Kanal über LinkedIn empfohlen. Direktvertrieb zu langsam bei dieser Buyer Persona.\"" },
    { persona: "E-Mail-Sequenz · Opener", color: "#f472b6", level: "Ebene 1", text: "\"Betreff mit Frage erzeugt 2× mehr Engagement als Statement. Segment 'Handwerk' bevorzugt kurze Texte.\"" },
  ];
  const [vc, setVc] = useState(0);
  useEffect(() => {
    if (vc < messages.length) {
      const t = setTimeout(() => setVc(v => v + 1), 2000);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setVc(0), 4000);
      return () => clearTimeout(t);
    }
  }, [vc]);

  const levelColor = { "Ebene 1": C.blue, "Ebene 2": C.purple, "Ebene 3": C.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: mobile ? 280 : 360, overflow: "hidden", position: "relative" }}>
      {messages.slice(0, vc).map((msg, i) => (
        <div key={`${i}-${vc}`} style={{
          background: C.bgCard, border: `1px solid ${C.border}`,
          borderRadius: 10, padding: mobile ? "10px 12px" : "12px 16px",
          animation: "feedIn 0.5s ease-out",
          borderLeft: `3px solid ${msg.color}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, color: levelColor[msg.level] || C.accent,
              background: (levelColor[msg.level] || C.accent) + "20",
              padding: "2px 6px", borderRadius: 4,
              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.06em",
            }}>{msg.level}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: msg.color, letterSpacing: "0.04em", fontFamily: "'JetBrains Mono', monospace" }}>
              {msg.persona}
            </span>
          </div>
          <div style={{ fontSize: mobile ? 12 : 13, color: C.text, lineHeight: 1.45, fontStyle: "italic" }}>{msg.text}</div>
        </div>
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(transparent, ${C.bg})`, pointerEvents: "none" }} />
    </div>
  );
}

const LEVELS = [
  {
    n: "01",
    label: "Copy & Creative",
    color: C.blue,
    icon: "✍️",
    tag: "Ebene 1",
    headline: "Teste jeden Text — bevor du einen Cent ausgibst",
    desc: "Headlines, Ad-Copy, Landing Pages, E-Mails, CTAs. Bis zu 5 Varianten gleichzeitig an deiner exakten Zielgruppe. Sieh nicht nur was gewinnt — sondern warum.",
    examples: ["A/B-Test von Google Ads Headlines", "Landing Page Optimierung", "E-Mail Betreffzeilen", "Social Media Posts", "Produktbeschreibungen"],
    badge: null,
  },
  {
    n: "02",
    label: "Produkt & Angebot",
    color: C.purple,
    icon: "🧩",
    tag: "Ebene 2",
    headline: "Validiere Ideen, bevor du sie baust",
    desc: "Neue Features, Preispunkte, Bundles, Angebotsstruktur. Teste die Reaktion deiner Zielgruppe auf dein Produkt — ohne Entwicklungskosten, ohne Fehlkäufe.",
    examples: ["Feature-Priorisierung vor Dev-Sprint", "Pricing Testing (€29 vs. €49)", "Bundle-Komposition", "Onboarding-Flow Varianten", "Upgrade-Angebote"],
    badge: null,
  },
  {
    n: "03",
    label: "Business-Strategie",
    color: C.accent,
    icon: "♟️",
    tag: "Ebene 3",
    headline: "Teste ganze Geschäftsideen — in Minuten",
    desc: "Markteintrittsstrategie, Zielgruppen-Pivots, neue Geschäftsmodelle. SimTest simuliert, wie dein Markt auf strategische Entscheidungen reagiert — bevor du Budget investierst.",
    examples: ["Markteintritt DACH vs. nur D", "B2B vs. B2C Pivot", "Neues Preismodell (Abo vs. Einmalkauf)", "Partnerstrategie testen", "Neue Zielgruppe erschließen"],
    badge: "Neu",
  },
  {
    n: "04",
    label: "Krisensimulation",
    color: "#6b7280",
    icon: "🌐",
    tag: "Ebene 4",
    headline: "Was-wäre-wenn — simuliert",
    desc: "Bald: Wie reagiert dein Markt wenn sich das Weltgeschehen ändert? Inflation, Rezession, Branchenkrisen. SimTest mit realem Kontext.",
    examples: ["Kommt bald"],
    badge: "Coming Soon",
    locked: true,
  },
];

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [activeLevel, setActiveLevel] = useState(0);
  const w = useWindowWidth();
  const mobile = w < 680;
  const tablet = w < 960;

  const handleSubmit = useCallback(() => {
    if (email && email.includes("@")) setSubmitted(true);
  }, [email]);

  const canvasWidth = mobile ? Math.min(w - 64, 400) : 380;
  const canvasHeight = mobile ? 180 : 260;
  const level = LEVELS[activeLevel];

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes feedIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes gradientShift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 16px rgba(110,231,183,0.15); } 50% { box-shadow: 0 0 32px rgba(110,231,183,0.3); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes shimmer { 0% { opacity: 0.4; } 50% { opacity: 0.8; } 100% { opacity: 0.4; } }
        .hero-grad { background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(110,231,183,0.05) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(167,139,250,0.04) 0%, transparent 60%); }
        .noise { position:fixed;top:0;left:0;right:0;bottom:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");pointer-events:none;z-index:0; }
        input[type="email"] { background:${C.bgCard};border:1px solid ${C.border};color:${C.text};padding:14px 16px;border-radius:10px;font-size:16px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s;width:100%;-webkit-appearance:none; }
        input[type="email"]:focus { border-color:${C.accentDim}; }
        input[type="email"]::placeholder { color:${C.textDim}; }
        .level-btn:hover { border-color: var(--hover-color) !important; background: var(--hover-bg) !important; }
        .level-pill:hover { opacity: 1 !important; }
        .cta-main:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(110,231,183,0.25) !important; }
        .cta-ghost:hover { border-color: ${C.accentDim} !important; color: ${C.accent} !important; }
      `}</style>
      <div className="noise" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: "rgba(10,10,15,0.9)", backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "10px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${C.accentDim}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.bg, fontFamily: "'Outfit',sans-serif" }}>S</div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: "-0.02em" }}>SimTest</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: C.accent, background: C.accentGlow, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>BETA</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!mobile && (
              <a href="#levels" style={{ fontSize: 13, color: C.textMuted, textDecoration: "none" }} onClick={(e) => { e.preventDefault(); document.getElementById("levels")?.scrollIntoView({ behavior: "smooth" }); }}>Anwendungsfälle</a>
            )}
            <button className="cta-main" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 12, padding: "7px 16px", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease" }}>
              {mobile ? "Warteliste" : "Auf die Warteliste"}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-grad" style={{ padding: mobile ? "44px 0 56px" : "72px 0 88px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <div style={{ animation: "slideUp 0.8s ease-out" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 100, padding: "5px 12px", marginBottom: mobile ? 20 : 28 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, boxShadow: `0 0 8px ${C.accent}`, flexShrink: 0 }} />
              <span style={{ fontSize: mobile ? 10 : 11, color: C.textMuted, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em" }}>Multi-Agent Business Intelligence · Made in 🇩🇪</span>
            </div>

            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 30 : tablet ? 46 : 64, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.03em", marginBottom: mobile ? 16 : 22, padding: mobile ? "0 4px" : 0 }}>
              Dein Markt als{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.purple})`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent", backgroundSize: "200% 200%", animation: "gradientShift 4s ease infinite" }}>
                Simulation
              </span>
            </h1>

            <p style={{ fontSize: mobile ? 15 : 18, color: C.textMuted, maxWidth: 560, margin: "0 auto", lineHeight: 1.6, fontWeight: 300, marginBottom: mobile ? 10 : 14 }}>
              Teste Copy, Produkte und Geschäftsideen an deiner echten Zielgruppe — bevor du einen Cent investierst.
            </p>
            <p style={{ fontSize: mobile ? 13 : 15, color: C.textDim, maxWidth: 480, margin: "0 auto", lineHeight: 1.55, marginBottom: mobile ? 32 : 48 }}>
              Von der Headline bis zur Marktstrategie. <span style={{ color: C.accent }}>~€0,01 pro Run.</span>
            </p>

            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexDirection: mobile ? "column" : "row", alignItems: "center", marginBottom: mobile ? 36 : 56, padding: mobile ? "0 20px" : 0 }}>
              <button className="cta-main" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 16, padding: "14px 28px", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", animation: "pulseGlow 3s ease-in-out infinite", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                Kostenlos zur Beta →
              </button>
              <button className="cta-ghost" onClick={() => document.getElementById("levels")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 15, padding: "14px 24px", border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                Was kann SimTest?
              </button>
            </div>

            {/* Hero visual */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexDirection: mobile ? "column" : "row", alignItems: "stretch", maxWidth: 840, margin: "0 auto", padding: mobile ? "0 0" : 0 }}>
              <div style={{ flex: "0 0 auto", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, width: mobile ? "100%" : canvasWidth + 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["#ef4444", C.warning, C.accent].map((cl, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: cl }} />)}
                  </div>
                  <span style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>agent_simulation.live</span>
                </div>
                <AgentCanvas width={canvasWidth} height={canvasHeight} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: C.textDim, padding: "0 2px" }}>
                  <span>⬤ 50 Agenten aktiv</span>
                  <span>Runde 4/10</span>
                </div>
              </div>
              <div style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, minWidth: 0, height: canvasHeight + 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexShrink: 0 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {["#ef4444", C.warning, C.accent].map((cl, i) => <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: cl }} />)}
                  </div>
                  <span style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>insight_stream.live</span>
                </div>
                <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                  <BIFeed mobile={mobile} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: mobile ? "24px 0" : "32px 0", background: "rgba(18,18,26,0.5)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: mobile ? "16px 8px" : 24, textAlign: "center" }}>
          {[
            { display: "ab €12", label: "pro Monat" },
            { value: 1000, suffix: "+", label: "Agenten (Pro)" },
            { value: 5, suffix: "×", label: "günstiger als A/B-Test" },
            { display: "4 Ebenen", label: "Copy bis Strategie" },
          ].map((s, i) => (
            <div key={i}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 28, fontWeight: 800, color: C.accent, marginBottom: 2 }}>
                {s.display || <AnimatedNumber target={s.value} suffix={s.suffix || ""} />}
              </div>
              <div style={{ fontSize: mobile ? 11 : 13, color: C.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* THE FOUR LEVELS — main section */}
      <section id="levels" style={{ padding: mobile ? "52px 0" : "84px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 32 : 52 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: C.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Vier Ebenen. Ein Tool.</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 26 : 42, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 14 }}>
              Von der Headline bis zur{" "}
              <span style={{ background: `linear-gradient(135deg, ${C.purple}, ${C.accent})`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>Marktstrategie</span>
            </h2>
            <p style={{ fontSize: mobile ? 14 : 16, color: C.textMuted, maxWidth: 500, margin: "0 auto", lineHeight: 1.6 }}>
              SimTest ist mehr als Copy-Testing. Es ist ein Business Intelligence Layer für KMUs — der einzige, den du dir leisten kannst.
            </p>
          </div>

          {/* Level selector pills */}
          <div style={{ display: "flex", gap: 6, justifyContent: mobile ? "flex-start" : "center", overflowX: mobile ? "auto" : "visible", WebkitOverflowScrolling: "touch", marginBottom: 24, padding: mobile ? "0 0 8px" : 0 }}>
            {LEVELS.map((lv, i) => (
              <button key={i} className="level-btn" onClick={() => setActiveLevel(i)}
                style={{
                  "--hover-color": lv.color,
                  "--hover-bg": lv.color + "12",
                  background: activeLevel === i ? lv.color + "18" : "transparent",
                  border: `1px solid ${activeLevel === i ? lv.color : C.border}`,
                  color: activeLevel === i ? lv.color : C.textMuted,
                  fontWeight: activeLevel === i ? 700 : 400,
                  padding: mobile ? "7px 12px" : "9px 18px",
                  borderRadius: 10, cursor: "pointer",
                  fontSize: mobile ? 12 : 13,
                  fontFamily: "'Inter',sans-serif",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap", flexShrink: 0,
                  opacity: lv.locked ? 0.55 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <span>{lv.icon}</span>
                <span>{lv.label}</span>
                {lv.badge && (
                  <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 5px", borderRadius: 4, background: lv.locked ? C.textDim + "30" : lv.color + "30", color: lv.locked ? C.textDim : lv.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.05em" }}>
                    {lv.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Level detail card */}
          <div style={{
            background: C.bgCard,
            border: `1px solid ${level.locked ? C.border : level.color + "40"}`,
            borderRadius: 18, padding: mobile ? 24 : 40,
            display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr",
            gap: mobile ? 28 : 48,
            position: "relative", overflow: "hidden",
            opacity: level.locked ? 0.7 : 1,
            transition: "all 0.3s ease",
          }}>
            {/* Glow bg */}
            {!level.locked && (
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: level.color + "08", borderRadius: "50%", filter: "blur(40px)", pointerEvents: "none" }} />
            )}

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 28 }}>{level.icon}</span>
                <div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: level.color, fontWeight: 600, letterSpacing: "0.1em" }}>{level.tag}</span>
                    {level.badge && (
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: level.locked ? "#6b728020" : level.color + "25", color: level.locked ? "#9ca3af" : level.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>
                        {level.badge}
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.textMuted }}>{level.label}</div>
                </div>
              </div>

              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 20 : 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 14, color: level.locked ? C.textMuted : C.text }}>
                {level.headline}
              </h3>
              <p style={{ fontSize: 14, color: C.textMuted, lineHeight: 1.65, marginBottom: 20 }}>{level.desc}</p>

              {level.locked && (
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(107,114,128,0.1)", border: "1px solid rgba(107,114,128,0.2)", borderRadius: 8, padding: "8px 14px" }}>
                  <span style={{ fontSize: 14 }}>🔒</span>
                  <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>In Entwicklung · Bald verfügbar</span>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 11, fontWeight: 600, color: C.textDim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12 }}>
                {level.locked ? "Was geplant ist" : "Beispiele"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {level.examples.map((ex, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: level.locked ? "rgba(107,114,128,0.05)" : level.color + "08",
                    border: `1px solid ${level.locked ? C.border : level.color + "20"}`,
                    borderRadius: 9, padding: "10px 14px",
                    animation: ex === "Kommt bald" ? "shimmer 2s ease-in-out infinite" : "none",
                  }}>
                    <span style={{ color: level.locked ? C.textDim : level.color, fontSize: 12, flexShrink: 0 }}>
                      {level.locked ? "◌" : "→"}
                    </span>
                    <span style={{ fontSize: 13, color: level.locked ? C.textDim : C.text, fontStyle: level.locked ? "italic" : "normal" }}>{ex}</span>
                  </div>
                ))}
              </div>

              {!level.locked && (
                <button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{
                  marginTop: 20, width: "100%",
                  background: level.color + "15",
                  border: `1px solid ${level.color + "40"}`,
                  color: level.color, fontWeight: 700, fontSize: 13,
                  padding: "11px 20px", borderRadius: 10, cursor: "pointer",
                  fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease",
                }}>
                  Beta-Zugang sichern →
                </button>
              )}
            </div>
          </div>

          {/* Level 4 teaser strip */}
          {activeLevel < 3 && (
            <div onClick={() => setActiveLevel(3)} style={{
              marginTop: 12, cursor: "pointer",
              background: "rgba(107,114,128,0.04)",
              border: "1px dashed rgba(107,114,128,0.2)",
              borderRadius: 12, padding: mobile ? "14px 20px" : "16px 28px",
              display: "flex", alignItems: "center", gap: 12,
              transition: "all 0.2s ease",
            }}>
              <span style={{ fontSize: 18, opacity: 0.5, animation: "shimmer 2.5s ease-in-out infinite" }}>🌐</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 12, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Ebene 4 · Coming Soon · </span>
                <span style={{ fontSize: 12, color: C.textMuted }}>Krisensimulation & Weltgeschehen — teste deine Marktreaktion auf externe Schocks</span>
              </div>
              <span style={{ fontSize: 11, color: C.textDim, flexShrink: 0 }}>→</span>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: mobile ? "44px 0" : "72px 0", background: "rgba(18,18,26,0.4)", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 28 : 44 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>So funktioniert's</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              In 4 Schritten zum Ergebnis
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {[
              { n: "01", icon: "🧬", title: "Zielgruppe definieren", desc: "Beschreibe deine Zielgruppe in 2–3 Sätzen. SimTest generiert passende KI-Personas — keine generischen Templates." },
              { n: "02", icon: "📥", title: "Stimulus eingeben", desc: "Copy, Produkt-Idee, Pricing oder Strategie-Frage. Bis zu 5 Varianten gleichzeitig." },
              { n: "03", icon: "⚙️", title: "Simulation läuft", desc: "20–1.000 Agenten lesen, reagieren und diskutieren. Meinungen formen sich in Echtzeit." },
              { n: "04", icon: "📊", title: "Report + Insights", desc: "Was gewinnt, warum, bei welchem Segment. Konkrete Handlungsempfehlungen, keine Datenberge." },
            ].map((s, i) => (
              <div key={i} style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: mobile ? "18px 20px" : 24, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -6, right: -2, fontSize: 56, fontWeight: 800, color: C.border, fontFamily: "'Outfit',sans-serif", lineHeight: 1, userSelect: "none" }}>{s.n}</div>
                <div style={{ fontSize: 22, marginBottom: 10 }}>{s.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.55 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERSONA BUILDER highlight */}
      <section style={{ padding: mobile ? "52px 0" : "84px 0" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 20, padding: mobile ? 28 : 48, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -40, left: -40, width: 200, height: 200, background: C.purple + "08", borderRadius: "50%", filter: "blur(50px)" }} />
            <div style={{ position: "absolute", bottom: -40, right: -40, width: 160, height: 160, background: C.accent + "08", borderRadius: "50%", filter: "blur(40px)" }} />
            <div style={{ position: "relative" }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Zielgruppen-Builder</div>
              <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 14 }}>
                Deine Zielgruppe — nicht eine generische
              </h3>
              <p style={{ fontSize: mobile ? 14 : 15, color: C.textMuted, lineHeight: 1.65, maxWidth: 600, marginBottom: 28 }}>
                Keine vorgefertigten Personas. Beschreibe deinen Kunden, und SimTest generiert KI-Agenten die <em>wirklich</em> zu deinem Markt passen — mit Persönlichkeit, Kaufmotiven, Einwänden und sozialem Kontext.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr 1fr", gap: 12, marginBottom: 28 }}>
                {[
                  { label: "Demografisch", items: ["Alter, Geschlecht, Region", "Einkommen, Bildung", "Beruf & Branche"] },
                  { label: "Psychografisch", items: ["Werte & Einstellungen", "Kaufmotive & Einwände", "Medienkonsumverhalten"] },
                  { label: "Kontextuell", items: ["Branchenspezifisch", "Saisonale Schwankungen", "Wettbewerb & Alternativen"] },
                ].map((col, i) => (
                  <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, fontFamily: "'Outfit',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{col.label}</div>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 13, color: C.textMuted, padding: "4px 0", borderBottom: j < col.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <span style={{ color: C.accent, marginRight: 6 }}>·</span>{item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {["20 Personas", "50 Personas", "200 Personas", "1.000 Personas"].map((p, i) => (
                    <span key={i} style={{ fontSize: 11, color: i === 1 ? C.accent : C.textDim, background: i === 1 ? C.accentGlow : "transparent", border: `1px solid ${i === 1 ? C.accentDim : C.border}`, padding: "4px 10px", borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", fontWeight: i === 1 ? 600 : 400 }}>{p}</span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: C.textDim }}>Wähle die Tiefe — du bestimmst das Signal-Rauschen-Verhältnis.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HONESTY */}
      <section style={{ padding: mobile ? "0 0 44px" : "0 0 64px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ background: "rgba(167,139,250,0.05)", border: `1px solid rgba(167,139,250,0.15)`, borderRadius: 14, padding: mobile ? 20 : 28 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.purple, fontFamily: "'Outfit',sans-serif", marginBottom: 8, letterSpacing: "0.04em" }}>⚡ Ehrlich gesagt</div>
            <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 16 : 18, fontWeight: 700, marginBottom: 8 }}>SimTest ersetzt keine echte Marktforschung.</h4>
            <p style={{ fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}>
              KI-Personas sind keine echten Menschen. SimTest liefert <span style={{ color: C.accent, fontWeight: 600 }}>direktionale Erkenntnisse</span> — es zeigt Richtungen, Muster und Unterschiede zwischen Varianten. Große Media-Investitionen solltest du nie ausschließlich auf Simulationsdaten basieren. Aber für 95% der täglichen Entscheidungen ist Richtung + Geschwindigkeit wichtiger als Repräsentativität.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: mobile ? "44px 0" : "72px 0", background: "rgba(18,18,26,0.4)", borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 28 : 44 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: C.blue, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10 }}>Kein Panel-Budget. Kein Agenturpreis.</h3>
            <p style={{ fontSize: 13, color: C.textMuted, maxWidth: 480, margin: "0 auto" }}>
              Inkludierte Runs im Monats-Abo. Mehr gebraucht? Pay-per-Use dazu — automatisch, ohne Plan-Wechsel.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: 10 }}>
            {[
              {
                name: "Free", price: "€0", sub: "Beta — kostenlos", color: C.textMuted,
                runs: "3 Runs/Mo", agents: "max. 30 Agenten", extra: "—",
                features: ["Ebene 1: Copy-Testing", "Basis-Report", "1 Persona-Profil"],
                cta: "Gratis starten", highlight: false,
              },
              {
                name: "Starter", price: "€12", sub: "pro Monat", color: C.blue,
                runs: "15 Runs/Mo", agents: "max. 100 Agenten", extra: "+€0,90 / Extra-Run",
                features: ["Ebene 1 & 2", "Detaillierter Report", "3 Persona-Profile", "Jahresabo: €119"],
                cta: "Starter wählen", highlight: false,
              },
              {
                name: "Pro", price: "€34", sub: "pro Monat", color: C.accent,
                runs: "60 Runs/Mo", agents: "max. 500 Agenten", extra: "+€0,65 / Extra-Run",
                features: ["Ebene 1, 2 & 3", "Segment-Vergleiche", "Unbegrenzte Profile", "Jahresabo: €340"],
                cta: "Pro wählen", highlight: true,
              },
              {
                name: "Business", price: "€89", sub: "pro Monat", color: C.purple,
                runs: "200 Runs/Mo", agents: "unbegrenzt", extra: "+€0,45 / Extra-Run",
                features: ["Alle 4 Ebenen (inkl. Beta)", "Team-Zugang", "API-Zugang", "Jahresabo: €890"],
                cta: "Business wählen", highlight: false,
              },
            ].map((plan, i) => (
              <div key={i} style={{
                background: plan.highlight ? `linear-gradient(160deg, ${C.accent}0d, ${C.bgCard})` : C.bgCard,
                border: `1px solid ${plan.highlight ? C.accentDim + "70" : C.border}`,
                borderRadius: 16, padding: mobile ? 20 : 24,
                position: "relative", display: "flex", flexDirection: "column",
              }}>
                {plan.highlight && (
                  <div style={{ position: "absolute", top: -1, left: "50%", transform: "translateX(-50%)", background: `linear-gradient(90deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontSize: 9, fontWeight: 700, padding: "3px 10px", borderRadius: "0 0 7px 7px", fontFamily: "'Outfit',sans-serif", letterSpacing: "0.07em", whiteSpace: "nowrap" }}>EMPFOHLEN</div>
                )}
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 900, color: C.text, lineHeight: 1, marginBottom: 2 }}>{plan.price}</div>
                <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16 }}>{plan.sub}</div>

                {/* Core specs */}
                <div style={{ background: plan.highlight ? C.accent + "10" : C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 5 }}>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 600 }}>{plan.runs}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{plan.agents}</div>
                  <div style={{ fontSize: 11, color: plan.extra === "—" ? C.textDim : C.textMuted, fontFamily: "'JetBrains Mono', monospace" }}>{plan.extra}</div>
                </div>

                {plan.features.map((f, j) => (
                  <div key={j} style={{ fontSize: 12, color: C.textMuted, padding: "4px 0", display: "flex", gap: 7, alignItems: "flex-start" }}>
                    <span style={{ color: plan.highlight ? C.accent : plan.color, marginTop: 1, flexShrink: 0, fontSize: 10 }}>✓</span>{f}
                  </div>
                ))}

                <div style={{ flex: 1 }} />
                <button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{
                  marginTop: 18, width: "100%",
                  background: plan.highlight ? `linear-gradient(135deg, ${C.accentDim}, ${C.accent})` : "transparent",
                  border: `1px solid ${plan.highlight ? "transparent" : C.border}`,
                  color: plan.highlight ? C.bg : C.textMuted,
                  fontWeight: 700, fontSize: 12, padding: "10px 16px", borderRadius: 9,
                  cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease",
                }}>{plan.cta}</button>
              </div>
            ))}
          </div>

          {/* Pricing footnote */}
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <span style={{ fontSize: 11, color: C.textDim, fontFamily: "'JetBrains Mono', monospace" }}>
              Alle Pläne monatlich kündbar · Jahresabo: 2 Monate gratis · Alle Preise zzgl. MwSt.
            </span>
          </div>
        </div>
      </section>

      {/* WAITLIST */}
      <section id="waitlist" style={{ padding: mobile ? "52px 0 72px" : "84px 0 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 26 : 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Teste deinen Markt —{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              bevor du investierst
            </span>
          </h2>
          <p style={{ fontSize: mobile ? 14 : 16, color: C.textMuted, marginBottom: 32, maxWidth: 460, margin: "0 auto 32px", lineHeight: 1.6 }}>
            Beta-Zugang ist kostenlos. Wir starten mit einer kleinen Gruppe — sichere dir deinen Platz jetzt.
          </p>

          {!submitted ? (
            <div style={{ display: "flex", gap: 10, flexDirection: mobile ? "column" : "row", justifyContent: "center", alignItems: "stretch", maxWidth: 420, margin: "0 auto" }}>
              <input type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              <button className="cta-main" onClick={handleSubmit} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 15, padding: "14px 24px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Outfit',sans-serif", animation: "pulseGlow 3s ease-in-out infinite", whiteSpace: "nowrap", transition: "all 0.2s ease" }}>
                Platz sichern →
              </button>
            </div>
          ) : (
            <div style={{ background: C.accentGlow, border: `1px solid ${C.accentDim}`, borderRadius: 12, padding: 20, maxWidth: 360, margin: "0 auto", animation: "slideUp 0.5s ease-out" }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>✓</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 4 }}>Du bist auf der Liste!</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>Wir melden uns, sobald dein Platz frei wird.</div>
            </div>
          )}

          <div style={{ display: "flex", gap: mobile ? 12 : 20, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {["Kein Abo nötig", "Keine Kreditkarte", "Beta gratis"].map((t, i) => (
              <span key={i} style={{ fontSize: 11, color: C.textDim, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: C.accent }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: `1px solid ${C.border}`, padding: "24px 0" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", flexDirection: mobile ? "column" : "row", justifyContent: "space-between", alignItems: "center", gap: 6, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 20, height: 20, borderRadius: 5, background: `linear-gradient(135deg, ${C.accentDim}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: C.bg, fontFamily: "'Outfit',sans-serif" }}>S</div>
            <span style={{ fontSize: 11, color: C.textDim }}>© 2026 SimTest · Dein Markt als Simulation</span>
          </div>
          <div style={{ fontSize: 10, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Basierend auf MiroFish / OASIS · Made in 🇩🇪</div>
        </div>
      </footer>
    </div>
  );
}
