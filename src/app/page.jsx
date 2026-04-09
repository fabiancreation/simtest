"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import PersonaCrowdSection from "@/components/PersonaCrowdSection";

const themes = {
  dark: {
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
    navBg: "rgba(10,10,15,0.9)",
    statsBg: "rgba(18,18,26,0.5)",
    honestBg: "rgba(167,139,250,0.05)",
    honestBorder: "rgba(167,139,250,0.15)",
  },
  light: {
    bg: "#f8f9fc",
    bgCard: "#ffffff",
    bgCardHover: "#f0f1f5",
    accent: "#059669",
    accentDim: "#10b981",
    accentGlow: "rgba(5, 150, 105, 0.1)",
    text: "#0f172a",
    textMuted: "#475569",
    textDim: "#64748b",
    border: "#e2e4ea",
    borderHover: "#d0d2da",
    warning: "#b45309",
    purple: "#7c3aed",
    blue: "#1d4ed8",
    red: "#dc2626",
    navBg: "rgba(248,249,252,0.92)",
    statsBg: "rgba(240,241,245,0.6)",
    honestBg: "rgba(124,58,237,0.04)",
    honestBorder: "rgba(124,58,237,0.12)",
  },
};

// Default für Komponenten die außerhalb des Theme-Kontexts rendern
let C = themes.dark;

// SVG Icon Komponente — ersetzt Emojis
function Icon({ name, size = 20, color = "currentColor" }) {
  const icons = {
    pen: <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />,
    puzzle: <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959V8.25m6.75 0h1.875c.621 0 1.125.504 1.125 1.125v1.5c0 .355-.186.676-.401.959a1.382 1.382 0 00-.349 1.003c0 1.035 1.007 1.875 2.25 1.875s2.25-.84 2.25-1.875c0-.369-.128-.713-.349-1.003a1.392 1.392 0 01-.401-.959v-1.5c0-.621-.504-1.125-1.125-1.125H18M14.25 8.25v6.75m0 0h-3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .355.186.676.401.959.221.29.349.634.349 1.003 0 1.035-1.007 1.875-2.25 1.875s-2.25-.84-2.25-1.875c0-.369.128-.713.349-1.003.215-.283.401-.604.401-.959v-1.5c0-.621-.504-1.125-1.125-1.125H2.25" />,
    chess: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />,
    globe: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />,
    dna: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />,
    inbox: <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859" />,
    cog: <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />,
    bolt: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} style={{ flexShrink: 0 }}>
      {icons[name]}
    </svg>
  );
}

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
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const mouseTimer = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const pad = 20;
    const agentCount = width < 350 ? 30 : 55;
    const colors = [C.accent, C.purple, C.blue, "#f472b6", C.warning];
    agentsRef.current = Array.from({ length: agentCount }, () => ({
      x: pad + Math.random() * (width - pad * 2),
      y: pad + Math.random() * (height - pad * 2),
      vx: (Math.random() - 0.5) * 0.8, vy: (Math.random() - 0.5) * 0.8,
      radius: 2 + Math.random() * 1.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      pulse: Math.random() * Math.PI * 2,
      influenceRadius: 55 + Math.random() * 35,
    }));

    function draw() {
      ctx.clearRect(0, 0, width, height);
      const agents = agentsRef.current;
      const minDist = 18;

      // Verbindungen zeichnen
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

      for (let i = 0; i < agents.length; i++) {
        const agent = agents[i];
        agent.pulse += 0.02;
        const ps = 1 + Math.sin(agent.pulse) * 0.3;

        // Maus-Interaktion nur wenn aktiv (tatsächlich bewegt)
        if (mouseRef.current.active) {
          const mdx = mouseRef.current.x - agent.x, mdy = mouseRef.current.y - agent.y;
          const mD = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mD < 100 && mD > 8) { agent.vx += (mdx / mD) * 0.008; agent.vy += (mdy / mD) * 0.008; }
        }

        // Leichte Abstoßung nur bei sehr engem Kontakt (verhindert Zentral-Cluster)
        for (let j = i + 1; j < agents.length; j++) {
          const dx = agents[j].x - agent.x, dy = agents[j].y - agent.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 10 && dist > 0.1) {
            const force = (10 - dist) / 10 * 0.05;
            const fx = (dx / dist) * force, fy = (dy / dist) * force;
            agent.vx -= fx; agent.vy -= fy;
            agents[j].vx += fx; agents[j].vy += fy;
          }
        }

        agent.x += agent.vx; agent.y += agent.vy;
        if (agent.x < 0 || agent.x > width) agent.vx *= -1;
        if (agent.y < 0 || agent.y > height) agent.vy *= -1;
        agent.x = Math.max(0, Math.min(width, agent.x));
        agent.y = Math.max(0, Math.min(height, agent.y));
        agent.vx *= 0.998; agent.vy *= 0.998;
        agent.vx += (Math.random() - 0.5) * 0.04; agent.vy += (Math.random() - 0.5) * 0.04;

        // Zeichnen
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

  function handleMouseMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    mouseRef.current = { x: (e.clientX - r.left) * (width / r.width), y: e.clientY - r.top, active: true };
    clearTimeout(mouseTimer.current);
    mouseTimer.current = setTimeout(() => { mouseRef.current.active = false; }, 200);
  }

  return (
    <canvas ref={canvasRef} style={{ width: "100%", height, borderRadius: 12, display: "block" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseRef.current.active = false; }}
      onTouchMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); const t = e.touches[0]; mouseRef.current = { x: (t.clientX - r.left) * (width / r.width), y: t.clientY - r.top, active: true }; }}
      onTouchEnd={() => { mouseRef.current.active = false; }}
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
    { persona: "Ad-Headline · A/B-Vergleich", color: C.blue, level: "Ebene 1", text: "\"'Spare 3 Stunden pro Woche' schlägt 'Steigere deine Effizienz' mit 71% Zustimmung.\"" },
    { persona: "Pricing-Analyse · SaaS-Tool", color: C.purple, level: "Ebene 2", text: "\"Sweet Spot bei €34–37/Mo. Ab €49 bricht die Conversion um 38% ein.\"" },
    { persona: "Markteintritt · DACH-Strategie", color: C.accent, level: "Ebene 3", text: "\"B2B via LinkedIn empfohlen. Direktvertrieb zu langsam für diese Buyer Persona.\"" },
  ];
  const [vc, setVc] = useState(1);
  useEffect(() => {
    if (vc < messages.length) {
      const t = setTimeout(() => setVc(v => v + 1), 2500);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setVc(1), 4000);
      return () => clearTimeout(t);
    }
  }, [vc]);

  const levelColor = { "Ebene 1": C.blue, "Ebene 2": C.purple, "Ebene 3": C.accent };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, height: "100%", overflow: "hidden", position: "relative" }}>
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
          <div style={{ fontSize: mobile ? 12 : 13, color: C.text, lineHeight: 1.4, fontStyle: "italic" }}>{msg.text}</div>
        </div>
      ))}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 50, background: `linear-gradient(transparent, ${C.bgCard})`, pointerEvents: "none" }} />
    </div>
  );
}

const LEVELS = [
  {
    n: "01",
    label: "Copy & Creative",
    color: C.blue,
    iconName: "pen",
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
    iconName: "puzzle",
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
    iconName: "chess",
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
    iconName: "globe",
    tag: "Ebene 4",
    headline: "Was-wäre-wenn — simuliert",
    desc: "Bald: Wie reagiert dein Markt wenn sich das Weltgeschehen ändert? Inflation, Rezession, Branchenkrisen. SimTest mit realem Kontext.",
    examples: ["Kommt bald"],
    badge: "Coming Soon",
    locked: true,
  },
];

const PLANS = [
  {
    name: "Free",
    monthly: 0, annual: 0,
    color: null,
    runs: "3 Runs/Mo", agents: "max. 30 Agenten", extra: null,
    features: ["Ebene 1: Copy-Testing", "Basis-Report", "1 Persona-Profil"],
    cta: "Gratis starten", highlight: false,
  },
  {
    name: "Starter",
    monthly: 12, annual: 119,
    color: "blue",
    runs: "15 Runs/Mo", agents: "max. 100 Agenten", extra: "+€0,90 / Extra-Run",
    features: ["Ebene 1 & 2", "Detaillierter Report", "3 Persona-Profile"],
    cta: "Starter wählen", highlight: false,
  },
  {
    name: "Pro",
    monthly: 34, annual: 340,
    color: "accent",
    runs: "60 Runs/Mo", agents: "max. 500 Agenten", extra: "+€0,65 / Extra-Run",
    features: ["Ebene 1, 2 & 3", "Segment-Vergleiche", "Unbegrenzte Profile"],
    cta: "Pro wählen", highlight: true,
  },
  {
    name: "Business",
    monthly: 89, annual: 890,
    color: "purple",
    runs: "200 Runs/Mo", agents: "unbegrenzt", extra: "+€0,45 / Extra-Run",
    features: ["Alle 4 Ebenen (inkl. Beta)", "Team-Zugang", "API-Zugang"],
    cta: "Business wählen", highlight: false,
  },
];

function PricingSection({ mobile, onCta }) {
  const [annual, setAnnual] = useState(false);

  function planColor(plan) {
    if (!plan.color) return C.textMuted;
    return C[plan.color] || plan.color;
  }

  function formatPrice(plan) {
    if (plan.monthly === 0) return "€0";
    return annual ? `€${Math.round(plan.annual / 12)}` : `€${plan.monthly}`;
  }

  function savings(plan) {
    if (plan.monthly === 0) return null;
    const saved = plan.monthly * 12 - plan.annual;
    return saved > 0 ? `€${saved} gespart` : null;
  }

  return (
    <section style={{ padding: mobile ? "44px 0" : "72px 0", background: C.statsBg, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
      <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 20px" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: mobile ? 24 : 36 }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.blue, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Pricing</div>
          <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 10 }}>Kein Panel-Budget. Kein Agenturpreis.</h3>
          <p style={{ fontSize: 15, color: C.textMuted, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
            Inkludierte Runs im Monats-Abo. Mehr gebraucht? Pay-per-Use dazu.
          </p>
        </div>

        {/* Toggle */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: mobile ? 28 : 40 }}>
          <span style={{ fontSize: 14, fontWeight: annual ? 400 : 700, color: annual ? C.textMuted : C.text, transition: "all 0.2s", cursor: "pointer" }} onClick={() => setAnnual(false)}>Monatlich</span>
          <button onClick={() => setAnnual(!annual)} style={{
            position: "relative", width: 52, height: 28, borderRadius: 14, border: "none",
            background: annual ? C.accent : C.border, cursor: "pointer", transition: "background 0.3s ease", padding: 0, flexShrink: 0,
          }}>
            <div style={{
              position: "absolute", top: 3, left: annual ? 27 : 3,
              width: 22, height: 22, borderRadius: 11,
              background: annual ? C.bg : C.textMuted,
              transition: "left 0.3s ease, background 0.3s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          </button>
          <span style={{ fontSize: 14, fontWeight: annual ? 700 : 400, color: annual ? C.text : C.textMuted, transition: "all 0.2s", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }} onClick={() => setAnnual(true)}>
            Jährlich
            <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, background: C.accentGlow, padding: "2px 8px", borderRadius: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em" }}>-17%</span>
          </span>
        </div>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: mobile ? 12 : 14, alignItems: "stretch" }}>
          {PLANS.map((plan, i) => {
            const pc = planColor(plan);
            const isHighlight = plan.highlight;
            return (
              <div key={i} style={{
                background: C.bgCard,
                border: `${isHighlight ? 2 : 1}px solid ${isHighlight ? pc : C.border}`,
                borderRadius: 18,
                padding: mobile ? "24px 20px" : "28px 24px",
                position: "relative", display: "flex", flexDirection: "column",
                transition: "border-color 0.2s, box-shadow 0.2s",
                boxShadow: isHighlight ? `0 0 24px ${pc}18, 0 4px 16px rgba(0,0,0,0.08)` : "none",
              }}>
                {/* Badge */}
                {isHighlight && (
                  <div style={{
                    position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                    background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`,
                    color: C.bg, fontSize: 11, fontWeight: 700,
                    padding: "4px 16px", borderRadius: 8,
                    fontFamily: "'Outfit',sans-serif", letterSpacing: "0.06em",
                    whiteSpace: "nowrap", boxShadow: `0 2px 8px ${C.accent}40`,
                  }}>EMPFOHLEN</div>
                )}

                {/* Plan name */}
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, color: pc, marginBottom: 12, marginTop: isHighlight ? 4 : 0 }}>{plan.name}</div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 32 : 36, fontWeight: 900, color: C.text, lineHeight: 1 }}>{formatPrice(plan)}</span>
                  {plan.monthly > 0 && <span style={{ fontSize: 14, color: C.textDim }}>/Mo</span>}
                </div>

                {/* Annual sub / savings */}
                <div style={{ minHeight: 20, marginBottom: 16 }}>
                  {plan.monthly === 0 ? (
                    <span style={{ fontSize: 13, color: C.textDim }}>Für immer kostenlos</span>
                  ) : annual ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13, color: C.textDim }}>€{plan.annual}/Jahr</span>
                      {savings(plan) && <span style={{ fontSize: 11, fontWeight: 600, color: C.accent }}>{savings(plan)}</span>}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: C.textDim }}>monatlich kündbar</span>
                  )}
                </div>

                {/* CTA */}
                <button onClick={onCta} style={{
                  width: "100%", marginBottom: 20,
                  background: isHighlight ? `linear-gradient(135deg, ${C.accentDim}, ${C.accent})` : "transparent",
                  border: isHighlight ? "none" : `1px solid ${C.border}`,
                  color: isHighlight ? C.bg : C.text,
                  fontWeight: 700, fontSize: 14, padding: "12px 16px", borderRadius: 10,
                  cursor: "pointer", fontFamily: "'Outfit',sans-serif",
                  transition: "all 0.2s ease",
                }}>{plan.cta}</button>

                {/* Divider */}
                <div style={{ height: 1, background: C.border, marginBottom: 16 }} />

                {/* Specs */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    <span style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{plan.runs}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span style={{ fontSize: 14, color: C.textMuted }}>{plan.agents}</span>
                  </div>
                  {plan.extra && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.textDim} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                      <span style={{ fontSize: 13, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>{plan.extra}</span>
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {plan.features.map((f, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: C.textMuted }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isHighlight ? C.accent : pc} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footnote */}
        <div style={{ marginTop: 24, textAlign: "center", display: "flex", justifyContent: "center", gap: mobile ? 8 : 20, flexWrap: "wrap" }}>
          {["Monatlich kündbar", "Keine Kreditkarte für Free", "Alle Preise zzgl. MwSt."].map((t, i) => (
            <span key={i} style={{ fontSize: 13, color: C.textDim, display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: C.accent, fontSize: 10 }}>&#9679;</span> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [activeLevel, setActiveLevel] = useState(0);
  const [theme, setTheme] = useState("light");
  const w = useWindowWidth();
  const mobile = w < 680;
  const tablet = w < 960;

  // Theme global setzen damit Sub-Komponenten es nutzen koennen
  C = themes[theme];

  const handleSubmit = useCallback(async () => {
    if (!email || !email.includes("@") || submitting) return;
    setSubmitting(true);
    setWaitlistError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setWaitlistError("Fehler beim Speichern. Bitte versuche es erneut.");
      }
    } catch {
      setWaitlistError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setSubmitting(false);
    }
  }, [email, submitting]);

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
        .hero-grad { background: ${theme === "dark" ? "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(110,231,183,0.05) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(167,139,250,0.04) 0%, transparent 60%)" : "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(5,150,105,0.06) 0%, transparent 70%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(124,58,237,0.04) 0%, transparent 60%)"}; }
        .noise { position:fixed;top:0;left:0;right:0;bottom:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.02'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:${theme === "dark" ? 1 : 0}; }
        input[type="email"] { background:${C.bgCard};border:1px solid ${C.border};color:${C.text};padding:14px 16px;border-radius:10px;font-size:16px;font-family:'Inter',sans-serif;outline:none;transition:border-color 0.2s, background 0.3s;width:100%;-webkit-appearance:none; }
        input[type="email"]:focus { border-color:${C.accentDim}; }
        input[type="email"]::placeholder { color:${C.textDim}; }
        .level-btn:hover { border-color: var(--hover-color) !important; background: var(--hover-bg) !important; }
        .level-pill:hover { opacity: 1 !important; }
        .cta-main:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(110,231,183,0.25) !important; }
        .cta-ghost:hover { border-color: ${C.accentDim} !important; color: ${C.accent} !important; }
        .card-hover { transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease; }
        .card-hover:hover { border-color: ${C.borderHover} !important; box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-2px); }
        .step-card { transition: border-color 0.2s ease, box-shadow 0.2s ease; }
        .step-card:hover { border-color: ${C.borderHover} !important; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>
      <div className="noise" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: C.navBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${C.border}`, padding: "10px 0", transition: "background 0.3s" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${C.accentDim}, ${C.purple})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: C.bg, fontFamily: "'Outfit',sans-serif" }}>S</div>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: "-0.02em" }}>SimTest</span>
            <span style={{ fontSize: 9, fontWeight: 600, color: C.accent, background: C.accentGlow, padding: "2px 6px", borderRadius: 4, fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.06em" }}>BETA</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {!mobile && (
              <a href="#levels" style={{ fontSize: 15, color: C.textMuted, textDecoration: "none" }} onClick={(e) => { e.preventDefault(); document.getElementById("levels")?.scrollIntoView({ behavior: "smooth" }); }}>Anwendungsfälle</a>
            )}
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontSize: 14, color: C.textMuted, transition: "all 0.2s ease", lineHeight: 1, minWidth: 44, minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center" }} title={theme === "dark" ? "Light Mode" : "Dark Mode"}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {theme === "dark"
                  ? <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>
                  : <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>}
              </svg>
            </button>
            <a href="/login" style={{ fontSize: 14, color: C.textMuted, textDecoration: "none", marginRight: 4, padding: "8px 4px", cursor: "pointer" }}>Login</a>
            <button className="cta-main" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 14, padding: "9px 16px", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease", minHeight: 36 }}>
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
            <div style={{ display: "flex", justifyContent: "center", gap: 10, flexDirection: mobile ? "column" : "row", alignItems: "center", marginBottom: mobile ? 12 : 16, padding: mobile ? "0 20px" : 0 }}>
              <button className="cta-main" onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 16, padding: "14px 28px", border: "none", borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", animation: "pulseGlow 3s ease-in-out infinite", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                Kostenlos zur Beta →
              </button>
              <button className="cta-ghost" onClick={() => document.getElementById("levels")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: C.textMuted, fontWeight: 600, fontSize: 15, padding: "14px 24px", border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontFamily: "'Outfit',sans-serif", transition: "all 0.2s ease", whiteSpace: "nowrap" }}>
                Was kann SimTest?
              </button>
            </div>

            <p style={{ fontSize: mobile ? 14 : 15, color: C.textDim, maxWidth: 480, margin: "0 auto", lineHeight: 1.55, marginBottom: mobile ? 32 : 48, textAlign: "center" }}>
              Deine nächste Entscheidung → getestet an 500 KI-Kunden.
            </p>

            {/* Hero visual */}
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexDirection: mobile ? "column" : "row", alignItems: "stretch", maxWidth: 840, margin: "0 auto", padding: mobile ? "0 0" : 0, height: mobile ? "auto" : canvasHeight + 44 }}>
              <div style={{ flex: "0 0 auto", background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, width: mobile ? "100%" : canvasWidth + 24, height: mobile ? "auto" : canvasHeight + 44 }}>
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
              <div style={{ flex: 1, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: 12, minWidth: 0, height: mobile ? 320 : canvasHeight + 44, overflow: "hidden", display: "flex", flexDirection: "column" }}>
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
      <section style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: mobile ? "24px 0" : "32px 0", background: C.statsBg }}>
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
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Vier Ebenen. Ein Tool.</div>
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
                  padding: mobile ? "10px 14px" : "9px 18px",
                  borderRadius: 10, cursor: "pointer",
                  fontSize: mobile ? 14 : 13,
                  minHeight: 44,
                  fontFamily: "'Inter',sans-serif",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap", flexShrink: 0,
                  opacity: lv.locked ? 0.55 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                <Icon name={lv.iconName} size={16} color={activeLevel === i ? lv.color : C.textMuted} />
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
                <Icon name={level.iconName} size={28} color={level.color} />
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
                  <span style={{ fontSize: 14, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>In Entwicklung · Bald verfügbar</span>
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
                    <span style={{ color: level.locked ? C.textDim : level.color, fontSize: 14, flexShrink: 0 }}>
                      {level.locked ? "◌" : "→"}
                    </span>
                    <span style={{ fontSize: 15, color: level.locked ? C.textDim : C.text, fontStyle: level.locked ? "italic" : "normal" }}>{ex}</span>
                  </div>
                ))}
              </div>

              {!level.locked && (
                <button onClick={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} style={{
                  marginTop: 20, width: "100%",
                  background: level.color + "15",
                  border: `1px solid ${level.color + "40"}`,
                  color: level.color, fontWeight: 700, fontSize: 15,
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
              <span style={{ opacity: 0.5, animation: "shimmer 2.5s ease-in-out infinite" }}><Icon name="globe" size={18} color={C.textDim} /></span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 14, color: C.textDim, fontFamily: "'JetBrains Mono',monospace" }}>Ebene 4 · Coming Soon · </span>
                <span style={{ fontSize: 14, color: C.textMuted }}>Krisensimulation & Weltgeschehen — teste deine Marktreaktion auf externe Schocks</span>
              </div>
              <span style={{ fontSize: 11, color: C.textDim, flexShrink: 0 }}>→</span>
            </div>
          )}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: mobile ? "44px 0" : "72px 0", background: C.statsBg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ textAlign: "center", marginBottom: mobile ? 28 : 44 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>So funktioniert's</div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 22 : 34, fontWeight: 800, lineHeight: 1.15, letterSpacing: "-0.02em" }}>
              In 4 Schritten zum Ergebnis
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
            {[
              { n: "01", iconName: "dna", title: "Zielgruppe definieren", desc: "Beschreibe deine Zielgruppe in 2–3 Sätzen. SimTest generiert passende KI-Personas — keine generischen Templates." },
              { n: "02", iconName: "inbox", title: "Stimulus eingeben", desc: "Copy, Produkt-Idee, Pricing oder Strategie-Frage. Bis zu 5 Varianten gleichzeitig." },
              { n: "03", iconName: "cog", title: "Simulation läuft", desc: "20–1.000 Agenten lesen, reagieren und diskutieren. Meinungen formen sich in Echtzeit." },
              { n: "04", iconName: "chart", title: "Report + Insights", desc: "Was gewinnt, warum, bei welchem Segment. Konkrete Handlungsempfehlungen, keine Datenberge." },
            ].map((s, i) => (
              <div key={i} className="step-card" style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14, padding: mobile ? "18px 20px" : 24, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -6, right: -2, fontSize: 56, fontWeight: 800, color: C.border, fontFamily: "'Outfit',sans-serif", lineHeight: 1, userSelect: "none" }}>{s.n}</div>
                <div style={{ marginBottom: 10 }}><Icon name={s.iconName} size={22} color={C.accent} /></div>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>{s.title}</div>
                <div style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.55 }}>{s.desc}</div>
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
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: C.purple, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Zielgruppen-Builder</div>
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
                  <div key={i} className="card-hover" style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.purple, fontFamily: "'Outfit',sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10 }}>{col.label}</div>
                    {col.items.map((item, j) => (
                      <div key={j} style={{ fontSize: 15, color: C.textMuted, padding: "4px 0", borderBottom: j < col.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
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
                <span style={{ fontSize: 14, color: C.textDim }}>Wähle die Tiefe — du bestimmst das Signal-Rauschen-Verhältnis.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PERSONA CROWD — Canvas-Animation: Grid → Netzwerk */}
      <PersonaCrowdSection C={C} mobile={mobile} />

      {/* HONESTY */}
      <section style={{ padding: mobile ? "0 0 44px" : "0 0 64px" }}>
        <div style={{ maxWidth: 620, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ background: C.honestBg, border: `1px solid ${C.honestBorder}`, borderRadius: 14, padding: mobile ? 20 : 28 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.purple, fontFamily: "'Outfit',sans-serif", marginBottom: 8, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}><Icon name="bolt" size={16} color={C.purple} /> Ehrlich gesagt</div>
            <h4 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 16 : 18, fontWeight: 700, marginBottom: 8 }}>SimTest ersetzt keine echte Marktforschung.</h4>
            <p style={{ fontSize: 15, color: C.textMuted, lineHeight: 1.65 }}>
              KI-Personas sind keine echten Menschen. SimTest liefert <span style={{ color: C.accent, fontWeight: 600 }}>direktionale Erkenntnisse</span> — es zeigt Richtungen, Muster und Unterschiede zwischen Varianten. Große Media-Investitionen solltest du nie ausschließlich auf Simulationsdaten basieren. Aber für 95% der täglichen Entscheidungen ist Richtung + Geschwindigkeit wichtiger als Repräsentativität.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <PricingSection mobile={mobile} onCta={() => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" })} />

      {/* WAITLIST */}
      <section id="waitlist" style={{ padding: mobile ? "52px 0 72px" : "84px 0 100px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 20px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: mobile ? 26 : 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 14 }}>
            Teste deinen Markt —{" "}
            <span style={{ background: `linear-gradient(135deg, ${C.accent}, ${C.blue})`, backgroundClip: "text", WebkitBackgroundClip: "text", color: "transparent" }}>
              bevor du investierst
            </span>
          </h2>
          <p style={{ fontSize: mobile ? 14 : 16, color: C.textMuted, marginBottom: 20, maxWidth: 460, margin: "0 auto 20px", lineHeight: 1.6 }}>
            Beta-Zugang ist kostenlos. Wir starten mit einer kleinen Gruppe — sichere dir deinen Platz jetzt.
          </p>

          {/* Social Proof */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 32 }}>
            <div style={{ display: "flex" }}>
              {["#6ee7b7", "#a78bfa", "#60a5fa", "#f472b6", "#f59e0b"].map((c, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: 14, background: c, border: `2px solid ${C.bg}`, marginLeft: i > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#0a0a0f", fontFamily: "'Outfit',sans-serif" }}>
                  {["F", "M", "S", "K", "L"][i]}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 13, color: C.textMuted }}>
              <strong style={{ color: C.accent }}>127+</strong> auf der Warteliste
            </span>
          </div>

          {!submitted ? (
            <div style={{ display: "flex", gap: 10, flexDirection: "column", justifyContent: "center", alignItems: "center", maxWidth: 420, margin: "0 auto" }}>
              <div style={{ display: "flex", gap: 10, flexDirection: mobile ? "column" : "row", width: "100%", alignItems: "stretch" }}>
                <input type="email" placeholder="deine@email.de" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                <button className="cta-main" onClick={handleSubmit} disabled={submitting} style={{ background: `linear-gradient(135deg, ${C.accentDim}, ${C.accent})`, color: C.bg, fontWeight: 700, fontSize: 15, padding: "14px 24px", border: "none", borderRadius: 10, cursor: submitting ? "wait" : "pointer", fontFamily: "'Outfit',sans-serif", animation: submitting ? "none" : "pulseGlow 3s ease-in-out infinite", whiteSpace: "nowrap", transition: "all 0.2s ease", opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? "Wird gespeichert..." : "Platz sichern →"}
                </button>
              </div>
              {waitlistError && <p style={{ color: "#ef4444", fontSize: 13, marginTop: 4 }}>{waitlistError}</p>}
            </div>
          ) : (
            <div style={{ background: C.accentGlow, border: `1px solid ${C.accentDim}`, borderRadius: 12, padding: 20, maxWidth: 360, margin: "0 auto", animation: "slideUp 0.5s ease-out" }}>
              <div style={{ marginBottom: 4 }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, color: C.accent, marginBottom: 4 }}>Du bist auf der Liste!</div>
              <div style={{ fontSize: 15, color: C.textMuted }}>Wir melden uns, sobald dein Platz frei wird.</div>
            </div>
          )}

          <div style={{ display: "flex", gap: mobile ? 12 : 20, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
            {["Kein Abo nötig", "Keine Kreditkarte", "Beta gratis"].map((t, i) => (
              <span key={i} style={{ fontSize: 13, color: C.textDim, display: "flex", alignItems: "center", gap: 5 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {t}
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
