// --- Preset Types ---

export interface Distribution {
  distribution: string;
  mean?: number;
  std_dev?: number;
  median?: number;
  min?: number;
  max?: number;
  peaks?: Array<{ mean: number; std_dev: number; weight: number; label?: string }>;
}

export interface BigFiveTrait {
  mean: number;
  std_dev: number;
}

export interface PlatformBehavior {
  posting_probability_per_round: number;
  comment_probability: number;
  like_probability: number;
  share_probability: number;
  ignore_probability: number;
  upvote_probability?: number;
}

export interface PresetData {
  preset_id: string;
  label: string;
  subtitle: string;
  icon: string;
  description: string;

  demographics: {
    age: Distribution;
    gender: Record<string, number>;
    education: Record<string, number>;
    income_monthly_net_eur: Distribution;
    region: Record<string, number>;
    bundesland_weight: string;
    living_situation?: Record<string, number>;
    company_size_employees?: Record<string, number>;
    role?: Record<string, number>;
  };

  psychographics: {
    big_five: {
      openness: BigFiveTrait;
      conscientiousness: BigFiveTrait;
      extraversion: BigFiveTrait;
      agreeableness: BigFiveTrait;
      neuroticism: BigFiveTrait;
    };
    values: string[];
    pain_points: string[];
    buying_triggers: string[];
    buying_blockers: string[];
    buyer_subtypes?: Record<string, { weight: number; traits: string; decision_time?: string; influence_radius?: string; pain_points?: string[]; buying_triggers?: string[]; buying_blockers?: string[] }>;
    engagement_subtypes?: Record<string, { weight: number; traits: string; influence_radius: string; pain_points?: string[]; buying_triggers?: string[]; buying_blockers?: string[] }>;
    decision_process?: {
      stakeholders: string[];
      avg_decision_time_weeks: number;
      stages: string[];
      description: string;
    };
  };

  media_behavior: {
    primary_platforms: string[];
    secondary_platforms: string[];
    content_consumption: string;
    trust_sources: string[];
    ad_sensitivity: string;
  };

  network_topology: {
    type: string;
    avg_connections: number;
    clustering_coefficient: number;
    description: string;
  };

  platform_behavior: {
    twitter_like: PlatformBehavior;
    reddit_like: PlatformBehavior;
  };

  virality_model?: {
    share_cascade_enabled: boolean;
    initial_seed_size: number;
    viral_threshold: number;
    decay_rate_per_round: number;
    description: string;
  };

  persona_generation_prompt: string;

  sample_personas: Array<Record<string, unknown>>;
}

// --- Helper: Statistisch samplen ---

function sampleNormal(mean: number, stdDev: number): number {
  // Box-Muller Transform
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stdDev;
}

function sampleFromDistribution(dist: Distribution): number {
  if (dist.distribution === "uniform") {
    return Math.floor(Math.random() * ((dist.max ?? 100) - (dist.min ?? 0) + 1)) + (dist.min ?? 0);
  }
  if (dist.distribution === "normal") {
    const val = sampleNormal(dist.mean ?? 40, dist.std_dev ?? 10);
    return Math.round(Math.max(dist.min ?? 0, Math.min(dist.max ?? 100, val)));
  }
  if (dist.distribution === "lognormal") {
    const median = dist.median ?? dist.mean ?? 3000;
    const val = sampleNormal(median, dist.std_dev ?? 1000);
    return Math.round(Math.max(dist.min ?? 0, Math.min(dist.max ?? 50000, val)));
  }
  if (dist.distribution === "bimodal" && dist.peaks) {
    // Gewichtete Auswahl eines Peaks
    const r = Math.random();
    let cumulative = 0;
    for (const peak of dist.peaks) {
      cumulative += peak.weight;
      if (r <= cumulative) {
        const val = sampleNormal(peak.mean, peak.std_dev);
        return Math.round(Math.max(dist.min ?? 0, Math.min(dist.max ?? 100000, val)));
      }
    }
    const last = dist.peaks[dist.peaks.length - 1];
    return Math.round(sampleNormal(last.mean, last.std_dev));
  }
  // Fallback
  return Math.round(sampleNormal(dist.mean ?? 35, dist.std_dev ?? 10));
}

function weightedPick<T extends string>(weights: Record<T, number>): T {
  const r = Math.random();
  let cumulative = 0;
  for (const [key, weight] of Object.entries(weights) as [T, number][]) {
    cumulative += weight;
    if (r <= cumulative) return key;
  }
  return Object.keys(weights)[0] as T;
}

function sampleBigFive(traits: PresetData["psychographics"]["big_five"]): Record<string, number> {
  return {
    openness: Math.round(Math.max(1, Math.min(10, sampleNormal(traits.openness.mean * 10, traits.openness.std_dev * 10)))),
    conscientiousness: Math.round(Math.max(1, Math.min(10, sampleNormal(traits.conscientiousness.mean * 10, traits.conscientiousness.std_dev * 10)))),
    extraversion: Math.round(Math.max(1, Math.min(10, sampleNormal(traits.extraversion.mean * 10, traits.extraversion.std_dev * 10)))),
    agreeableness: Math.round(Math.max(1, Math.min(10, sampleNormal(traits.agreeableness.mean * 10, traits.agreeableness.std_dev * 10)))),
    neuroticism: Math.round(Math.max(1, Math.min(10, sampleNormal(traits.neuroticism.mean * 10, traits.neuroticism.std_dev * 10)))),
  };
}

// --- Deutsche Vornamen & Nachnamen ---

const VORNAMEN_M = ["Thomas", "Stefan", "Michael", "Andreas", "Markus", "Christian", "Martin", "Daniel", "Marco", "Jens", "Tobias", "Alexander", "Florian", "Dennis", "Patrick", "Lukas", "Jonas", "Leon", "Felix", "Emre", "Nico", "Kevin", "Tim", "Jan", "Sven"];
const VORNAMEN_F = ["Sabine", "Claudia", "Sandra", "Nicole", "Andrea", "Katharina", "Lisa", "Anna", "Julia", "Laura", "Lena", "Sarah", "Maria", "Mia", "Sophie", "Hannah", "Lea", "Emma", "Jana", "Miriam", "Petra", "Monika", "Birgit", "Stefanie", "Christina"];
const NACHNAMEN = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Koch", "Richter", "Wolf", "Schröder", "Neumann", "Schwarz", "Braun", "Zimmermann", "Krüger", "Hartmann", "Lange", "Werner", "Lehmann", "Krause", "König"];

const STAEDTE: Record<string, string[]> = {
  "großstadt": ["Berlin", "Hamburg", "München", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dresden", "Hannover", "Nürnberg", "Bremen", "Essen", "Dortmund", "Bonn"],
  "mittelstadt": ["Freiburg", "Regensburg", "Kiel", "Rostock", "Kassel", "Ulm", "Heidelberg", "Würzburg", "Göttingen", "Potsdam", "Erlangen", "Jena", "Trier", "Oldenburg", "Osnabrück"],
  "kleinstadt": ["Bad Homburg", "Starnberg", "Celle", "Bautzen", "Neustadt", "Lüneburg", "Ravensburg", "Marburg", "Wetzlar", "Meiningen"],
  "ländlich": ["Berchtesgaden", "Cochem", "Quedlinburg", "Freyung", "Wittmund", "Prüm", "Rottweil", "Havelberg"],
};

const BERUFE: Record<string, string[]> = {
  "solo_unternehmer": ["Business Coach", "Unternehmensberater", "Personal Trainer", "Webdesigner", "Texter", "Social Media Berater", "Ernährungsberater", "Steuerberater", "Fotograf", "Grafikdesigner", "IT-Freelancer", "Yoga-Lehrerin", "Kommunikationstrainer", "Heilpraktiker", "Online-Kursersteller"],
  "ecom_kaeufer": ["Marketing-Assistentin", "Sachbearbeiter", "Erzieherin", "Krankenpflegerin", "Bürokauffrau", "Softwareentwickler", "Lehrerin", "Einzelhandelskaufmann", "Ingenieurin", "Studentin", "Mechatroniker", "Bankkauffrau", "Altenpfleger", "Mediengestalter", "Physiotherapeutin"],
  "b2b_entscheider": ["Geschäftsführer", "Abteilungsleiterin Marketing", "Teamlead IT", "Projektleiter", "COO", "Vertriebsleiter", "Head of Product", "Prokuristin", "Bereichsleiter Operations", "CTO"],
  "gen_z": ["BWL-Student", "Junior UX Designer", "Auszubildende Mediengestalterin", "Werkstudent Marketing", "Junior Softwareentwickler", "Barista", "Content Creator", "Praktikantin PR", "Azubi Einzelhandel", "Dualer Student Informatik"],
  "dach_allgemein": ["Projektmanagerin", "Handwerksmeister", "Ärztin", "Lehrer", "Ingenieur", "Verkäuferin", "IT-Administrator", "Rechtsanwältin", "Sozialarbeiterin", "Architekt", "Polizist", "Journalistin", "Beamter", "Pflegekraft", "Unternehmerin"],
};

/** Baut einen reichhaltigen Persönlichkeitstext aus Big Five + Kontext */
function buildPersonalityText(
  bigFive: Record<string, number>,
  age: number,
  income: number,
  subtype?: string,
  subtypeTraits?: string,
): string {
  const parts: string[] = [];

  // Big Five in natürliche Sprache (mit mehr Varianz als vorher)
  const openness = bigFive.openness ?? 5;
  const consc = bigFive.conscientiousness ?? 5;
  const extra = bigFive.extraversion ?? 5;
  const agree = bigFive.agreeableness ?? 5;
  const neuro = bigFive.neuroticism ?? 5;

  // Openness
  if (openness >= 8) parts.push(pick(["experimentierfreudig und neugierig", "liebt neue Ideen und unkonventionelle Ansätze", "probiert ständig Neues aus"]));
  else if (openness >= 6) parts.push(pick(["offen für Neues, aber nicht leichtgläubig", "interessiert sich für Trends, prüft aber kritisch"]));
  else if (openness <= 3) parts.push(pick(["bevorzugt Bewährtes", "skeptisch gegenüber Hypes und Trends", "ändert ungern Gewohnheiten"]));

  // Conscientiousness
  if (consc >= 8) parts.push(pick(["plant alles durch bevor eine Entscheidung fällt", "braucht Struktur und klare Fakten", "sehr gründlich bei Kaufentscheidungen"]));
  else if (consc <= 3) parts.push(pick(["entscheidet spontan aus dem Bauch", "lässt sich von Stimmungen leiten", "plant wenig voraus"]));

  // Extraversion
  if (extra >= 8) parts.push(pick(["teilt Erfahrungen gern mit anderen", "redet viel über Produkte die begeistern", "beeinflusst den Freundeskreis"]));
  else if (extra >= 6) parts.push(pick(["tauscht sich gelegentlich mit Freunden über Käufe aus"]));
  else if (extra <= 3) parts.push(pick(["recherchiert lieber allein als andere zu fragen", "behält Meinungen eher für sich", "entscheidet still für sich"]));

  // Neuroticism
  if (neuro >= 8) parts.push(pick(["macht sich oft Sorgen über Fehlkäufe", "braucht Sicherheit und Garantien"]));
  else if (neuro <= 3) parts.push(pick(["entspannt bei Kaufentscheidungen", "lässt sich nicht unter Druck setzen"]));

  // Agreeableness
  if (agree >= 8) parts.push(pick(["vertraut Empfehlungen von Freunden schnell", "geht Konflikten aus dem Weg"]));
  else if (agree <= 3) parts.push(pick(["hinterfragt alles kritisch", "lässt sich nicht von Meinungen anderer beeinflussen"]));

  // Kontext-Einflüsse
  if (age < 25 && income < 1500) {
    parts.push(pick(["achtet stark aufs Budget", "überlegt zweimal bevor Geld ausgegeben wird"]));
  } else if (income > 5000) {
    parts.push(pick(["Preis ist weniger wichtig als Qualität und Zeitersparnis"]));
  }

  // Subtype-Traits integrieren (falls vorhanden und kurz genug)
  if (subtypeTraits && subtypeTraits.length < 100) {
    // Ersten Satz des Subtype-Traits nehmen
    const firstSentence = subtypeTraits.split(/[.!]/)[0]?.trim();
    if (firstSentence) parts.push(firstSentence);
  }

  if (parts.length === 0) return "Ausgeglichene Persönlichkeit mit mittlerer Entscheidungsfreude.";
  return parts.join(". ") + ".";
}

function pick(options: string[]): string {
  return options[Math.floor(Math.random() * options.length)];
}

/** Samplet individuell aus Primary + Secondary Pool. Primary wird bevorzugt (70/30). */
function sampleFromPool(primary: string[], secondary: string[], count: number): string[] {
  const all = [...new Set([...primary, ...secondary])];
  if (all.length <= count) return [...all].sort(() => Math.random() - 0.5);
  // Gewichtete Auswahl: Primary-Items haben höhere Wahrscheinlichkeit
  const selected: string[] = [];
  const pool = [...all];
  for (let i = 0; i < count && pool.length > 0; i++) {
    // 70% Chance auf Primary, 30% auf Secondary
    const preferPrimary = Math.random() < 0.7;
    const candidates = preferPrimary ? pool.filter(p => primary.includes(p)) : pool.filter(p => !primary.includes(p));
    const source = candidates.length > 0 ? candidates : pool;
    const idx = Math.floor(Math.random() * source.length);
    selected.push(source[idx]);
    pool.splice(pool.indexOf(source[idx]), 1);
  }
  return selected;
}

/** Mischt Subtype-spezifische Items mit globalem Pool. Subtype-Items werden priorisiert. */
function mixWithSubtype(globalPool: string[], subtypePool?: string[]): string[] {
  const totalCount = 2 + Math.floor(Math.random() * 2); // 2-3 Items
  if (!subtypePool || subtypePool.length === 0) {
    const shuffled = [...globalPool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, totalCount);
  }
  // 1-2 aus Subtype, Rest aus globalem Pool (ohne Duplikate)
  const fromSubtype = [...subtypePool].sort(() => Math.random() - 0.5).slice(0, Math.min(2, totalCount));
  const subtypeSet = new Set(fromSubtype);
  const fromGlobal = globalPool.filter(p => !subtypeSet.has(p)).sort(() => Math.random() - 0.5);
  const remaining = totalCount - fromSubtype.length;
  return [...fromSubtype, ...fromGlobal.slice(0, Math.max(0, remaining))];
}

// --- Persona-Generierung aus Preset ---

export interface RichPersona {
  name: string;
  age: number;
  gender: string;
  occupation: string;
  location: string;
  region_type: string;
  education: string;
  income_monthly: number;
  personality: string;
  big_five: Record<string, number>;
  values: string[];
  pain_points: string[];
  buying_triggers: string[];
  buying_blockers: string[];
  media_primary: string[];
  trust_sources: string[];
  subtype?: string;
  subtype_traits?: string;
  // Legacy-kompatible Felder
  buy_triggers: string[];
  objections: string[];
  media_consumption: string;
}

export function generatePersonasFromPreset(preset: PresetData, count: number): RichPersona[] {
  const personas: RichPersona[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    const genderKey = weightedPick(preset.demographics.gender as Record<string, number>);
    const gender = genderKey === "male" ? "männlich" : genderKey === "female" ? "weiblich" : "divers";
    const isMale = genderKey === "male";

    const vornamen = isMale ? VORNAMEN_M : VORNAMEN_F;
    let name: string;
    let nameAttempts = 0;
    do {
      name = `${vornamen[Math.floor(Math.random() * vornamen.length)]} ${NACHNAMEN[Math.floor(Math.random() * NACHNAMEN.length)]}`;
      nameAttempts++;
    } while (usedNames.has(name) && nameAttempts < 20);
    usedNames.add(name);

    const age = sampleFromDistribution(preset.demographics.age);
    const income = sampleFromDistribution(preset.demographics.income_monthly_net_eur);
    const education = weightedPick(preset.demographics.education as Record<string, number>);
    const regionType = weightedPick(preset.demographics.region as Record<string, number>);
    const cityList = STAEDTE[regionType] ?? STAEDTE["großstadt"];
    const city = cityList[Math.floor(Math.random() * cityList.length)];

    const berufsListe = BERUFE[preset.preset_id] ?? BERUFE["dach_allgemein"];
    const occupation = berufsListe[Math.floor(Math.random() * berufsListe.length)];

    const bigFive = sampleBigFive(preset.psychographics.big_five);

    // Subtype bestimmen (vor Pain Points, da Subtype die Auswahl beeinflusst)
    let subtype: string | undefined;
    let subtypeTraits: string | undefined;
    let subtypeData: { pain_points?: string[]; buying_triggers?: string[]; buying_blockers?: string[] } | undefined;
    const subtypes = preset.psychographics.buyer_subtypes ?? preset.psychographics.engagement_subtypes;
    if (subtypes) {
      const subtypeWeights: Record<string, number> = {};
      for (const [key, val] of Object.entries(subtypes)) {
        subtypeWeights[key] = val.weight;
      }
      subtype = weightedPick(subtypeWeights);
      subtypeTraits = subtypes[subtype]?.traits;
      subtypeData = subtypes[subtype];
    }

    // Subtype-korrelierte Auswahl: Subtype-spezifische Items priorisieren, globale ergänzen
    const valueCount = 2 + Math.floor(Math.random() * 2);
    const shuffledValues = [...preset.psychographics.values].sort(() => Math.random() - 0.5);

    const selectedPains = mixWithSubtype(preset.psychographics.pain_points, subtypeData?.pain_points);
    const selectedTriggers = mixWithSubtype(preset.psychographics.buying_triggers, subtypeData?.buying_triggers);
    const selectedBlockers = mixWithSubtype(preset.psychographics.buying_blockers, subtypeData?.buying_blockers);

    // Persönlichkeitsbeschreibung aus Big Five + Kontext ableiten
    const personality = buildPersonalityText(bigFive, age, income, subtype, subtypeTraits);

    personas.push({
      name,
      age,
      gender,
      occupation,
      location: city,
      region_type: regionType,
      education,
      income_monthly: income,
      personality,
      big_five: bigFive,
      values: shuffledValues.slice(0, valueCount),
      pain_points: selectedPains,
      buying_triggers: selectedTriggers,
      buying_blockers: selectedBlockers,
      media_primary: sampleFromPool(preset.media_behavior.primary_platforms, preset.media_behavior.secondary_platforms, 2 + Math.floor(Math.random() * 2)),
      trust_sources: sampleFromPool(preset.media_behavior.trust_sources, [], 2 + Math.floor(Math.random() * 2)),
      subtype,
      subtype_traits: subtypeTraits,
      // Legacy-Kompatibilität
      buy_triggers: selectedTriggers,
      objections: selectedBlockers,
      media_consumption: preset.media_behavior.content_consumption,
    });
  }

  return personas;
}

// ============================================
// PRESET-DATEN
// ============================================

export const PRESETS: Record<string, PresetData> = {
  solo_unternehmer: {
    preset_id: "solo_unternehmer",
    label: "Solo-Unternehmer",
    subtitle: "Coaches, Berater, Trainer",
    icon: "briefcase",
    description: "Selbstständige im Dienstleistungsbereich. Entscheiden allein, kaufen Tools die Zeit sparen, sind pragmatisch und ROI-orientiert.",
    demographics: {
      age: { distribution: "normal", mean: 42, std_dev: 8, min: 25, max: 62 },
      gender: { male: 0.55, female: 0.42, diverse: 0.03 },
      education: { hauptschule: 0.05, realschule: 0.12, abitur: 0.18, bachelor: 0.30, master: 0.28, promotion: 0.07 },
      income_monthly_net_eur: { distribution: "lognormal", median: 3800, std_dev: 1800, min: 1200, max: 15000 },
      region: { "großstadt": 0.40, mittelstadt: 0.35, kleinstadt: 0.18, "ländlich": 0.07 },
      bundesland_weight: "population_proportional",
    },
    psychographics: {
      big_five: {
        openness: { mean: 0.72, std_dev: 0.10 },
        conscientiousness: { mean: 0.75, std_dev: 0.09 },
        extraversion: { mean: 0.65, std_dev: 0.12 },
        agreeableness: { mean: 0.58, std_dev: 0.11 },
        neuroticism: { mean: 0.45, std_dev: 0.13 },
      },
      values: ["Autonomie", "Selbstverwirklichung", "Zeitfreiheit", "Wirkung / Impact", "Persönliches Wachstum"],
      pain_points: ["Zu wenig Sichtbarkeit trotz Expertise", "Feast-or-Famine bei der Auftragslage", "Kein Budget für echte Marktforschung", "Unsicherheit ob Copy / Angebot ankommt", "Zeitmangel für Marketing"],
      buying_triggers: ["Klare Zeitersparnis", "Nachweisbarer ROI", "Empfehlung von Peers", "Niedriges Risiko (Free Trial, Geld-zurück)", "Sofort nutzbar ohne Einarbeitung"],
      buying_blockers: ["Unklarer Nutzen", "Zu hoher Preis ohne Proof", "Zu technisch / kompliziert", "Hype ohne Substanz", "Vendor Lock-in"],
    },
    media_behavior: {
      primary_platforms: ["LinkedIn", "Instagram", "Facebook-Gruppen"],
      secondary_platforms: ["YouTube", "Podcasts", "Newsletter"],
      content_consumption: "Praxis-orientiert. Sucht Abkürzungen und Frameworks. Überfliegt Headlines, liest nur bei direktem Nutzen weiter.",
      trust_sources: ["Peer-Empfehlungen", "Case Studies", "Bekannte Experten"],
      ad_sensitivity: "Mittel - reagiert auf Pain-Point-Headlines, ignoriert generischen Hype",
    },
    network_topology: {
      type: "small_world",
      avg_connections: 8,
      clustering_coefficient: 0.6,
      description: "Wenige enge Peer-Verbindungen (Mastermind-Gruppen, Kooperationspartner). Mittlere Brücken-Verbindungen über Facebook-Gruppen und Events.",
    },
    platform_behavior: {
      twitter_like: { posting_probability_per_round: 0.15, comment_probability: 0.25, like_probability: 0.50, share_probability: 0.10, ignore_probability: 0.40 },
      reddit_like: { posting_probability_per_round: 0.08, comment_probability: 0.35, upvote_probability: 0.45, share_probability: 0.05, ignore_probability: 0.45 },
    },
    persona_generation_prompt: "Du bist {name}, {age} Jahre alt, {gender}, wohnhaft in {city}. Du bist selbstständige/r {occupation} mit {income}€ monatlichem Nettoeinkommen. Bildung: {education}. Persönlichkeit: Offenheit {openness}/10, Gewissenhaftigkeit {conscientiousness}/10, Extraversion {extraversion}/10, Verträglichkeit {agreeableness}/10, Neurotizismus {neuroticism}/10. Dein größtes Problem: {primary_pain_point}. Du nutzt vor allem {primary_platform} und vertraust auf {trust_source}.",
    sample_personas: [
      { name: "Sabine Meier", age: 47, beruf: "Business Coach", city: "Stuttgart" },
      { name: "Marco Richter", age: 35, beruf: "Webdesign-Freelancer", city: "Berlin" },
      { name: "Claudia Hoffmann", age: 52, beruf: "Ernährungsberaterin", city: "München" },
    ],
  },

  ecom_kaeufer: {
    preset_id: "ecom_kaeufer",
    label: "E-Com Käufer",
    subtitle: "Online-Shopper, preisbewusst",
    icon: "shopping-cart",
    description: "Deutsche Online-Käufer. Breite demografische Streuung. Vergleichen viel, reagieren auf Social Proof, Rabatte und Urgency.",
    demographics: {
      age: { distribution: "bimodal", min: 18, max: 68, peaks: [{ mean: 29, std_dev: 5, weight: 0.45 }, { mean: 45, std_dev: 8, weight: 0.55 }] },
      gender: { male: 0.48, female: 0.50, diverse: 0.02 },
      education: { hauptschule: 0.12, realschule: 0.25, abitur: 0.22, bachelor: 0.25, master: 0.14, promotion: 0.02 },
      income_monthly_net_eur: { distribution: "lognormal", median: 2400, std_dev: 1200, min: 800, max: 8000 },
      region: { "großstadt": 0.35, mittelstadt: 0.30, kleinstadt: 0.22, "ländlich": 0.13 },
      bundesland_weight: "population_proportional",
    },
    psychographics: {
      big_five: {
        openness: { mean: 0.55, std_dev: 0.14 },
        conscientiousness: { mean: 0.52, std_dev: 0.15 },
        extraversion: { mean: 0.50, std_dev: 0.16 },
        agreeableness: { mean: 0.60, std_dev: 0.12 },
        neuroticism: { mean: 0.55, std_dev: 0.14 },
      },
      values: ["Preis-Leistung", "Bequemlichkeit", "Sicherheit beim Kauf", "Schnelle Lieferung", "Vergleichbarkeit"],
      pain_points: ["Unübersichtliche Angebotsvielfalt", "Angst vor Fehlkäufen", "Versteckte Kosten (Versand, Abo-Fallen)", "Zu viel Werbung, zu wenig echte Info", "Retouren-Aufwand"],
      buying_triggers: ["Rabatt / zeitlich begrenztes Angebot", "Viele positive Bewertungen", "Kostenloser Versand", "Einfache Retoure", "Empfehlung von Freunden / Influencern"],
      buying_blockers: ["Keine Bewertungen vorhanden", "Unbekannter Shop ohne Gütesiegel", "Komplizierter Checkout", "Hohe Versandkosten", "Zu aggressiver Sales-Druck"],
      buyer_subtypes: {
        "impulskäufer": { weight: 0.35, traits: "Kauft schnell bei emotionalem Trigger. Reagiert auf Scarcity und Social Proof. Bereut gelegentlich.", decision_time: "Minuten", pain_points: ["FOMO bei limitierten Angeboten", "Reue nach Spontankäufen", "Zu viele Verlockungen im Feed"], buying_triggers: ["Zeitlich begrenztes Angebot", "Nur noch wenige verfügbar", "Influencer zeigt Produkt"], buying_blockers: ["Zu langer Checkout-Prozess", "Keine sofortige Lieferung", "Kein visueller Wow-Effekt"] },
        "recherche_käufer": { weight: 0.40, traits: "Vergleicht 3-5 Anbieter. Liest Bewertungen. Braucht Fakten und Specs. Kauft beim besten Preis-Leistungs-Verhältnis.", decision_time: "Tage", pain_points: ["Widersprüchliche Bewertungen verwirren", "Technische Details fehlen oft", "Preisvergleich über Shops hinweg mühsam"], buying_triggers: ["Detaillierter Testbericht verfügbar", "Bestes Preis-Leistungs-Verhältnis im Vergleich", "Transparente Spezifikationen"], buying_blockers: ["Keine unabhängigen Tests vorhanden", "Fehlende technische Details", "Nicht beim günstigsten Anbieter"] },
        "gewohnheitskäufer": { weight: 0.25, traits: "Kauft bei bekannten Shops (Amazon, Otto). Wechselt selten. Braucht starken Grund um Neues zu probieren.", decision_time: "Sofort bei bekanntem Shop, sonst gar nicht", pain_points: ["Lieblingsprodukt wird eingestellt", "Gewohnter Shop ändert Oberfläche", "Neue Anbieter wirken unseriös"], buying_triggers: ["Verfügbar beim gewohnten Shop", "Prime/Express-Versand möglich", "Marke ist bereits bekannt"], buying_blockers: ["Unbekannter Shop ohne Trusted Shops", "Abweichung vom gewohnten Kaufprozess", "Kein Rückgaberecht erkennbar"] },
      },
    },
    media_behavior: {
      primary_platforms: ["Instagram", "Google Shopping", "Amazon"],
      secondary_platforms: ["YouTube Reviews", "TikTok", "Idealo/Check24"],
      content_consumption: "Visuell getrieben. Scrollt durch Feeds, reagiert auf Produktbilder und Preise. Liest Bewertungen aber selten längere Texte.",
      trust_sources: ["Kundenbewertungen", "Trusted Shops Siegel", "Influencer-Empfehlungen", "Preisvergleichsportale"],
      ad_sensitivity: "Hoch - klickt auf Rabatt-Ads, ignoriert Brand-Awareness-Kampagnen",
    },
    network_topology: {
      type: "scale_free",
      avg_connections: 12,
      clustering_coefficient: 0.3,
      description: "Wenige Influencer-Knoten mit vielen Followern. Produktempfehlungen verbreiten sich schnell über Hub-Nodes.",
    },
    platform_behavior: {
      twitter_like: { posting_probability_per_round: 0.08, comment_probability: 0.20, like_probability: 0.55, share_probability: 0.15, ignore_probability: 0.35 },
      reddit_like: { posting_probability_per_round: 0.05, comment_probability: 0.30, upvote_probability: 0.50, share_probability: 0.08, ignore_probability: 0.40 },
    },
    persona_generation_prompt: "Du bist {name}, {age} Jahre alt, {gender}, wohnhaft in {city}. Du arbeitest als {occupation} und verdienst ca. {income}€ netto im Monat. Dein Kauftyp: {subtype}. Persönlichkeit: Offenheit {openness}/10, Gewissenhaftigkeit {conscientiousness}/10, Extraversion {extraversion}/10, Verträglichkeit {agreeableness}/10, Neurotizismus {neuroticism}/10. Beim Online-Shopping ist dir am wichtigsten: {primary_value}. Du vertraust auf: {trust_source}.",
    sample_personas: [
      { name: "Lisa Krüger", age: 26, beruf: "Marketing-Assistentin", city: "Hamburg", buyer_subtype: "impulskäufer" },
      { name: "Thomas Weber", age: 51, beruf: "Sachbearbeiter", city: "Dortmund", buyer_subtype: "recherche_käufer" },
      { name: "Anna-Lena Scholz", age: 33, beruf: "Erzieherin", city: "Leipzig", buyer_subtype: "gewohnheitskäufer" },
    ],
  },

  b2b_entscheider: {
    preset_id: "b2b_entscheider",
    label: "B2B Entscheider",
    subtitle: "KMU-Geschäftsführer, Teamleads",
    icon: "building",
    description: "Entscheidungsträger in KMUs. Rationale Entscheider mit längeren Zyklen. Reagieren auf Daten, Case Studies und ROI-Argumente.",
    demographics: {
      age: { distribution: "normal", mean: 46, std_dev: 7, min: 30, max: 63 },
      gender: { male: 0.68, female: 0.30, diverse: 0.02 },
      education: { hauptschule: 0.03, realschule: 0.08, abitur: 0.10, bachelor: 0.28, master: 0.38, promotion: 0.13 },
      income_monthly_net_eur: { distribution: "lognormal", median: 5500, std_dev: 2500, min: 3000, max: 25000 },
      region: { "großstadt": 0.45, mittelstadt: 0.32, kleinstadt: 0.17, "ländlich": 0.06 },
      bundesland_weight: "wirtschaftskraft_proportional",
      company_size_employees: { "5-19": 0.35, "20-49": 0.30, "50-249": 0.25, "250+": 0.10 },
      role: { "geschäftsführer_inhaber": 0.40, abteilungsleiter: 0.25, teamlead: 0.20, projektleiter: 0.15 },
    },
    psychographics: {
      big_five: {
        openness: { mean: 0.60, std_dev: 0.11 },
        conscientiousness: { mean: 0.80, std_dev: 0.07 },
        extraversion: { mean: 0.58, std_dev: 0.13 },
        agreeableness: { mean: 0.52, std_dev: 0.10 },
        neuroticism: { mean: 0.38, std_dev: 0.11 },
      },
      values: ["Effizienz", "Skalierbarkeit", "Risikominimierung", "Messbare Ergebnisse", "Zuverlässigkeit"],
      pain_points: ["Keine Zeit für langwierige Evaluierungsprozesse", "Budget muss intern gerechtfertigt werden", "Angst vor Fehlentscheidungen mit Auswirkung aufs Team", "Tool-Überflutung", "Fachkräftemangel zwingt zu Automatisierung"],
      buying_triggers: ["Klarer ROI mit Zahlen belegt", "Case Study aus gleicher Branche/Größe", "Testphase ohne Risiko", "Empfehlung von Branchen-Peers", "Integration in bestehende Tools"],
      buying_blockers: ["Kein messbarer Business Case", "Zu langer Implementierungsaufwand", "Datenschutz-Bedenken (DSGVO)", "Keine deutsche Oberfläche / kein deutscher Support", "Vendor zu klein / unklar ob überlebensfähig"],
      decision_process: {
        stakeholders: ["Geschäftsführung", "Fachabteilung", "IT/Datenschutz", "Controlling"],
        avg_decision_time_weeks: 6,
        stages: ["Problemerkennung", "Recherche", "Shortlist", "Demo/Test", "Interne Abstimmung", "Entscheidung"],
        description: "Entscheidungen werden selten allein getroffen. Auch bei KMUs gibt es ein informelles Buying Center.",
      },
    },
    media_behavior: {
      primary_platforms: ["LinkedIn", "Fachmedien (t3n, Gründerszene)", "Google Suche"],
      secondary_platforms: ["Branchen-Events", "Podcasts", "Newsletter (OMR, deutsche-startups)"],
      content_consumption: "Liest selektiv und tief. Bevorzugt Long-Form mit konkreten Zahlen. Whitepaper und Case Studies werden heruntergeladen.",
      trust_sources: ["Branchen-Reports", "Peer-Empfehlungen auf Veranstaltungen", "Referenzkunden"],
      ad_sensitivity: "Niedrig - ignoriert Display Ads. Reagiert auf LinkedIn Sponsored Content nur wenn relevant.",
    },
    network_topology: {
      type: "hierarchical_cluster",
      avg_connections: 6,
      clustering_coefficient: 0.7,
      description: "Starke Cluster nach Branche und Region. GFs kennen sich über IHK, Verbände, lokale Unternehmer-Runden.",
    },
    platform_behavior: {
      twitter_like: { posting_probability_per_round: 0.05, comment_probability: 0.15, like_probability: 0.35, share_probability: 0.08, ignore_probability: 0.60 },
      reddit_like: { posting_probability_per_round: 0.03, comment_probability: 0.20, upvote_probability: 0.40, share_probability: 0.04, ignore_probability: 0.55 },
    },
    persona_generation_prompt: "Du bist {name}, {age} Jahre alt, {gender}, {role} in einem Unternehmen mit {company_size} Mitarbeitern in {city}. Du verdienst ca. {income}€ netto/Monat. Bildung: {education}. Persönlichkeit: Offenheit {openness}/10, Gewissenhaftigkeit {conscientiousness}/10, Extraversion {extraversion}/10, Verträglichkeit {agreeableness}/10, Neurotizismus {neuroticism}/10. Dein größtes Problem: {primary_pain_point}. Bei Tool-Entscheidungen achtest du auf: {primary_buying_trigger}.",
    sample_personas: [
      { name: "Stefan Brandt", age: 48, role: "Geschäftsführer", city: "Nürnberg" },
      { name: "Dr. Katharina Weiß", age: 41, role: "Abteilungsleiterin Marketing", city: "Köln" },
      { name: "Jens Hartmann", age: 53, role: "Teamlead IT", city: "Hannover" },
    ],
  },

  gen_z: {
    preset_id: "gen_z",
    label: "Gen Z",
    subtitle: "18-27, digital native",
    icon: "smartphone",
    description: "Digital Natives zwischen 18 und 27. Aufgewachsen mit Social Media. Schnelle Aufmerksamkeitsspanne, hoher Bullshit-Detektor, werte-orientiert.",
    demographics: {
      age: { distribution: "uniform", min: 18, max: 27 },
      gender: { male: 0.46, female: 0.48, diverse: 0.06 },
      education: { "schüler": 0.05, ausbildung: 0.20, student: 0.30, bachelor: 0.28, master: 0.15, promotion: 0.02 },
      income_monthly_net_eur: { distribution: "bimodal", min: 0, max: 4500, peaks: [{ mean: 650, std_dev: 300, weight: 0.35, label: "Studenten/Azubis" }, { mean: 2200, std_dev: 600, weight: 0.65, label: "Berufstätige" }] },
      region: { "großstadt": 0.50, mittelstadt: 0.25, kleinstadt: 0.15, "ländlich": 0.10 },
      bundesland_weight: "population_proportional",
      living_situation: { bei_eltern: 0.30, wg: 0.28, allein: 0.22, mit_partner: 0.18, sonstiges: 0.02 },
    },
    psychographics: {
      big_five: {
        openness: { mean: 0.75, std_dev: 0.12 },
        conscientiousness: { mean: 0.45, std_dev: 0.16 },
        extraversion: { mean: 0.62, std_dev: 0.15 },
        agreeableness: { mean: 0.58, std_dev: 0.14 },
        neuroticism: { mean: 0.60, std_dev: 0.13 },
      },
      values: ["Authentizität", "Nachhaltigkeit / Klimabewusstsein", "Diversität & Inklusion", "Mentale Gesundheit", "Erlebnis vor Besitz"],
      pain_points: ["Finanzielle Unsicherheit (Mieten, Einstiegsgehälter)", "Zukunftsangst (Klima, Arbeitsmarkt, KI)", "Überforderung durch Informationsflut", "Druck durch Social-Media-Vergleich", "Misstrauen gegenüber Institutionen und Werbung"],
      buying_triggers: ["Authentischer Content (nicht poliert)", "Empfehlung von Creator / Peer", "Brand steht für Werte die man teilt", "Viraler Moment / FOMO", "Transparente Preise, keine Tricks"],
      buying_blockers: ["Offensichtliche Werbung / Cringe-Marketing", "Brand mit Greenwashing-Verdacht", "Boomer-Ästhetik in der Kommunikation", "Zu teuer für das verfügbare Budget", "Keine Präsenz auf den eigenen Plattformen"],
      engagement_subtypes: {
        creator: { weight: 0.15, traits: "Produziert eigenen Content. TikTok, Instagram Reels, YouTube Shorts. Trendsetter im Netzwerk.", influence_radius: "hoch", pain_points: ["Algorithmus-Änderungen ruinieren Reichweite", "Monetarisierung als Creator schwierig", "Burnout durch Content-Druck"], buying_triggers: ["Produkt eignet sich für Content", "Exklusiver Creator-Zugang", "Brand passt zur eigenen Marke"], buying_blockers: ["Brand ist uncool oder zu corporate", "Kein UGC-Potenzial", "Produkt lässt sich nicht authentisch zeigen"] },
        active_consumer: { weight: 0.40, traits: "Liked, kommentiert, teilt. Folgt Trends. Nimmt an Diskussionen teil. Beeinflusst direkte Peers.", influence_radius: "mittel", pain_points: ["FOMO wenn Freunde etwas haben", "Schwer zwischen echtem und bezahltem Content zu unterscheiden", "Budget reicht nicht für alle Trends"], buying_triggers: ["Freunde haben es schon", "Trend auf TikTok gesehen", "Rabattcode von Lieblings-Creator"], buying_blockers: ["Niemand im Freundeskreis kennt die Marke", "Wirkt wie Boomer-Marketing", "Zu teuer ohne Studentenrabatt"] },
        lurker: { weight: 0.45, traits: "Konsumiert passiv. Scrollt viel, interagiert wenig. Wird durch Masse beeinflusst, nicht durch einzelne Posts.", influence_radius: "niedrig", pain_points: ["Entscheidungsparalyse durch zu viele Optionen", "Fühlt sich von aggressivem Marketing genervt", "Kauft selten impulsiv, bereut aber Nichtkäufe"], buying_triggers: ["Massenhaft positive Kommentare unter dem Post", "Produkt löst ein konkretes Alltagsproblem", "Ruhige, informative Darstellung statt Hype"], buying_blockers: ["Zu viel Druck im Marketing", "Nur ein einzelner Influencer bewirbt es", "Keine echten Nutzererfahrungen sichtbar"] },
      },
    },
    media_behavior: {
      primary_platforms: ["TikTok", "Instagram", "YouTube Shorts"],
      secondary_platforms: ["Snapchat", "Discord", "Reddit", "Spotify"],
      content_consumption: "Kurz, visuell, schnell. Durchschnittliche Aufmerksamkeit: 3-8 Sekunden. Hook muss sofort sitzen. Authentizität schlägt Produktionsqualität.",
      trust_sources: ["Micro-Influencer", "Peers / Freundeskreis", "TikTok-Kommentare", "Reddit-Threads"],
      ad_sensitivity: "Sehr kritisch - erkennt Werbung sofort. Native Content funktioniert, offensichtliche Ads werden abgestraft.",
    },
    network_topology: {
      type: "scale_free_dense",
      avg_connections: 25,
      clustering_coefficient: 0.4,
      description: "Dichte Netzwerke mit vielen schwachen Ties. Wenige Creator-Hubs mit überproportionalem Einfluss. Content kann viral gehen oder komplett untergehen.",
    },
    platform_behavior: {
      twitter_like: { posting_probability_per_round: 0.20, comment_probability: 0.35, like_probability: 0.60, share_probability: 0.25, ignore_probability: 0.30 },
      reddit_like: { posting_probability_per_round: 0.12, comment_probability: 0.40, upvote_probability: 0.55, share_probability: 0.18, ignore_probability: 0.25 },
    },
    virality_model: {
      share_cascade_enabled: true,
      initial_seed_size: 0.05,
      viral_threshold: 0.15,
      decay_rate_per_round: 0.30,
      description: "Wenn mehr als 15% der erreichten Agenten teilen, triggert virales Spreading. Schneller Decay nach 3 Runden.",
    },
    persona_generation_prompt: "Du bist {name}, {age} Jahre alt, {gender}, wohnhaft in {city}. Du bist {occupation} und verdienst ca. {income}€ im Monat. Dein Engagement-Typ: {subtype}. Persönlichkeit: Offenheit {openness}/10, Gewissenhaftigkeit {conscientiousness}/10, Extraversion {extraversion}/10, Verträglichkeit {agreeableness}/10, Neurotizismus {neuroticism}/10. Dir ist besonders wichtig: {primary_value}. Du verbringst am meisten Zeit auf {primary_platform}. Du vertraust: {trust_source}.",
    sample_personas: [
      { name: "Mia Schulz", age: 21, occupation: "BWL-Studentin", city: "Berlin", engagement_subtype: "active_consumer" },
      { name: "Emre Yilmaz", age: 24, occupation: "Junior UX Designer", city: "Frankfurt", engagement_subtype: "creator" },
      { name: "Lena Fischer", age: 19, occupation: "Auszubildende Mediengestalterin", city: "Freiburg", engagement_subtype: "lurker" },
    ],
  },

  dach_allgemein: {
    preset_id: "dach_allgemein",
    label: "DACH Allgemein",
    subtitle: "Breiter Querschnitt 25-55 J.",
    icon: "globe",
    description: "Breiter Querschnitt der deutschsprachigen Bevölkerung, 25-55 Jahre, verschiedene Berufe und Lebenssituationen.",
    demographics: {
      age: { distribution: "normal", mean: 40, std_dev: 10, min: 25, max: 55 },
      gender: { male: 0.49, female: 0.49, diverse: 0.02 },
      education: { hauptschule: 0.10, realschule: 0.22, abitur: 0.20, bachelor: 0.25, master: 0.18, promotion: 0.05 },
      income_monthly_net_eur: { distribution: "lognormal", median: 2800, std_dev: 1500, min: 1000, max: 12000 },
      region: { "großstadt": 0.35, mittelstadt: 0.30, kleinstadt: 0.22, "ländlich": 0.13 },
      bundesland_weight: "population_proportional",
    },
    psychographics: {
      big_five: {
        openness: { mean: 0.55, std_dev: 0.15 },
        conscientiousness: { mean: 0.60, std_dev: 0.14 },
        extraversion: { mean: 0.52, std_dev: 0.16 },
        agreeableness: { mean: 0.60, std_dev: 0.13 },
        neuroticism: { mean: 0.50, std_dev: 0.15 },
      },
      values: ["Sicherheit", "Familie", "Preis-Leistung", "Qualität", "Verlässlichkeit"],
      pain_points: ["Steigende Lebenshaltungskosten", "Zeitmangel im Alltag", "Informationsüberflutung", "Unsicherheit bei großen Kaufentscheidungen", "Komplexität neuer Technologien"],
      buying_triggers: ["Gutes Preis-Leistungs-Verhältnis", "Empfehlung von Bekannten", "Positive Bewertungen", "Vertrauenswürdige Marke", "Einfache Handhabung"],
      buying_blockers: ["Zu teuer", "Unbekannte Marke", "Kompliziert", "Versteckte Kosten", "Schlechte Bewertungen"],
    },
    media_behavior: {
      primary_platforms: ["Google", "YouTube", "Instagram"],
      secondary_platforms: ["Facebook", "WhatsApp-Gruppen", "Nachrichtenportale"],
      content_consumption: "Gemischt. Jüngere visuell orientiert, Ältere lesen auch längere Texte. Bewertungen und Vergleiche sind universell wichtig.",
      trust_sources: ["Freunde und Familie", "Online-Bewertungen", "Stiftung Warentest", "Bekannte Marken"],
      ad_sensitivity: "Mittel - reagiert auf relevante Angebote, ignoriert offensichtliche Manipulation",
    },
    network_topology: {
      type: "random",
      avg_connections: 10,
      clustering_coefficient: 0.4,
      description: "Heterogenes Netzwerk ohne dominante Struktur. Mischung aus starken und schwachen Ties.",
    },
    platform_behavior: {
      twitter_like: { posting_probability_per_round: 0.10, comment_probability: 0.20, like_probability: 0.45, share_probability: 0.12, ignore_probability: 0.40 },
      reddit_like: { posting_probability_per_round: 0.06, comment_probability: 0.25, upvote_probability: 0.45, share_probability: 0.08, ignore_probability: 0.40 },
    },
    persona_generation_prompt: "Du bist {name}, {age} Jahre alt, {gender}, wohnhaft in {city}. Du arbeitest als {occupation} und verdienst ca. {income}€ netto im Monat. Bildung: {education}. Persönlichkeit: Offenheit {openness}/10, Gewissenhaftigkeit {conscientiousness}/10, Extraversion {extraversion}/10, Verträglichkeit {agreeableness}/10, Neurotizismus {neuroticism}/10. Dir ist am wichtigsten: {primary_value}. Du vertraust beim Kaufen auf: {trust_source}.",
    sample_personas: [
      { name: "Markus Lehmann", age: 38, occupation: "Projektmanager", city: "Düsseldorf" },
      { name: "Sandra Koch", age: 44, occupation: "Lehrerin", city: "Freiburg" },
      { name: "Daniel Wolf", age: 31, occupation: "Softwareentwickler", city: "Berlin" },
    ],
  },
};
