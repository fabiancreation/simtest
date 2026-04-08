# SimTest Styleguide

> Abgeleitet aus der Landing Page. Verbindlich für alle App-Seiten.

---

## Aesthetic Direction

**Dark-Mode SaaS mit subtilen Glow-Akzenten.** Technisch, präzise, aber nicht kalt.
Die Landing Page kombiniert tiefe Backgrounds mit Emerald-Akzenten und dezenten Lichteffekten.
Das App-Backend soll diesen Look konsistent fortführen -- kein generisches Dashboard,
sondern ein Tool, das sich anfühlt wie die Landing Page verspricht.

**Ton:** Professionell-technisch mit einem Hauch Sci-Fi. Nicht Cyberpunk, nicht Brutalist --
eher "polished dark lab".

---

## Fonts

| Verwendung | Font | Gewicht | Quelle |
|---|---|---|---|
| Headlines, Branding, CTAs | **Outfit** | 600-900 | Google Fonts |
| Body, Labels, Descriptions | **Inter** | 300-600 | Google Fonts |
| Code, Zahlen, Metriken | **JetBrains Mono** | 400-600 | Google Fonts |

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap');
```

---

## Farben (Dark Mode)

### Basis

| Token | Hex | Verwendung |
|---|---|---|
| `--color-bg` | `#0a0a0f` | Seiten-Hintergrund |
| `--color-bg-card` | `#12121a` | Karten, Sidebar, Panels |
| `--color-bg-card-hover` | `#1a1a28` | Hover-State auf Karten |
| `--color-bg-elevated` | `#16162a` | Hervorgehobene Bereiche, aktive States |

### Akzente

| Token | Hex | Verwendung |
|---|---|---|
| `--color-accent` | `#6ee7b7` | Primärer Akzent (Emerald 300) |
| `--color-accent-dim` | `#34d399` | Dunklerer Akzent (Hover, Gradients) |
| `--color-accent-glow` | `rgba(110,231,183,0.15)` | Glow-Effekte, Schatten |

### Semantisch

| Token | Hex | Verwendung |
|---|---|---|
| `--color-purple` | `#a78bfa` | Sekundärer Akzent, Badges |
| `--color-blue` | `#60a5fa` | Info, Running-Status |
| `--color-warning` | `#f59e0b` | Warnungen, Neutral-Sentiment |
| `--color-red` | `#f87171` | Fehler, Negativ-Sentiment |

### Text

| Token | Hex | Verwendung |
|---|---|---|
| `--color-text` | `#e8e8f0` | Primärer Text |
| `--color-text-muted` | `#8888a0` | Sekundärer Text, Labels |
| `--color-text-dim` | `#5a5a72` | Tertiärer Text, Placeholder |

### Borders

| Token | Hex | Verwendung |
|---|---|---|
| `--color-border` | `#1e1e2e` | Standard-Border |
| `--color-border-hover` | `#2a2a3e` | Border auf Hover |

---

## Effekte & Backgrounds

### Gradient-Akzent (CTAs, Hero-Elemente)
```css
background: linear-gradient(135deg, var(--color-accent-dim), var(--color-accent));
```

### Glow-Schatten (wichtige Elemente)
```css
box-shadow: 0 0 24px rgba(110,231,183,0.12), 0 4px 16px rgba(0,0,0,0.2);
```

### Subtle Pulse (aktive Prozesse)
```css
@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 16px rgba(110,231,183,0.15); }
  50% { box-shadow: 0 0 32px rgba(110,231,183,0.3); }
}
```

### Karten-Hintergrund (statt flachem bg-card)
```css
background: linear-gradient(135deg, rgba(18,18,26,0.8), rgba(22,22,42,0.4));
border: 1px solid var(--color-border);
backdrop-filter: blur(8px);
```

### Noise-Overlay (optional, für Tiefe)
```css
/* Subtiles Rauschen über dem Hintergrund */
position: fixed; pointer-events: none; z-index: 0; opacity: 0.02;
```

---

## Spacing

| Name | Wert | Verwendung |
|---|---|---|
| `xs` | 4px | Inline-Gaps |
| `sm` | 8px | Tight padding |
| `md` | 16px | Standard padding |
| `lg` | 24px | Section padding |
| `xl` | 32px | Page padding |
| `2xl` | 48px | Section gaps |

---

## Border Radius

| Element | Radius |
|---|---|
| Buttons, Inputs | `10px` |
| Cards, Panels | `16px` (bzw. `18px` für Feature-Cards) |
| Badges, Pills | `8px` |
| Progress Bars | `full` (9999px) |
| Avatare | `full` |

---

## Animationen

| Aktion | Dauer | Easing |
|---|---|---|
| Hover-Transitions | `200ms` | `ease` |
| Einblenden (stagger) | `300-500ms` | `ease-out` |
| Loading-Pulse | `3s` | `ease-in-out` (infinite) |
| Slide-Up (Page Enter) | `400ms` | `ease-out` mit `translateY(24px)` |

### Stagger-Animationen für Listen
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Jedes Kind: animation-delay: calc(var(--i) * 80ms) */
```

---

## Komponenten-Regeln

### Stat-Cards (Dashboard)
- Gradient-Border-Akzent oben (3px farbige Linie)
- Icon mit Glow-Hintergrund
- Zahl in Outfit, groß
- Label in Inter, muted

### Buttons
- **Primary:** Gradient-Background (`accent-dim -> accent`), `color: bg`
- **Secondary:** Transparent, `border: 1px solid border`, `color: text-muted`
- **Danger:** `bg-red/10`, `color: red`
- Alle: `font-family: Outfit`, `font-weight: 700`, `border-radius: 10px`

### Inputs & Textareas
- `bg: bg-card`, `border: border`, `focus: border-accent`
- `font-family: Inter`, `padding: 14px 16px`
- Placeholder: `color: text-dim`

### Status-Badges
- `font-family: JetBrains Mono`, `font-size: 11px`, `font-weight: 600`
- Farbig hinterlegt mit 10% Opacity des Status-Farbe
- Uppercase, letter-spacing: 0.06em

### Empty States
- Zentriert, Icon mit Glow-Halo
- Beschreibung + CTA-Button
- Kein nackter Text

---

## Icons

- **SVG-Only** -- keine Emojis, keine Icon-Fonts
- Heroicons Outline (strokeWidth: 1.5) als Standard
- Größen: 16px (inline), 20px (nav), 24px (feature)

---

## Typography Scale

| Element | Font | Size | Weight | Letter-Spacing |
|---|---|---|---|---|
| Page Title | Outfit | 28-32px | 800 | -0.03em |
| Section Header | Outfit | 20px | 700 | -0.02em |
| Card Title | Outfit | 16px | 600 | -0.01em |
| Body | Inter | 14-15px | 400 | 0 |
| Label | Inter | 13px | 500 | 0 |
| Caption | Inter | 12px | 400 | 0 |
| Metric Value | JetBrains Mono | 28-36px | 700 | -0.02em |
| Badge | JetBrains Mono | 11px | 600 | 0.06em |

---

## prefers-reduced-motion

Landing Page unterstützt es bereits. App-Seiten müssen es auch respektieren:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

---

*Stand: 8. April 2026*
