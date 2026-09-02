const LS_DEMO_PREFS = "k1nd_demo_prefs_v4_13";

export const AUDIENCE_PRESETS = {
  sport: {
    key: "sport", label: "Sport", icon: "🏟️",
    headline: "Protect the passion without flattening the conversation.",
    focus: ["Verified participation", "Pre-post intervention", "Strong criticism stays publishable"],
    demoPrompt: "Your first serve kept landing short, you useless clown.",
  },
  youth: {
    key: "youth", label: "Youth safety", icon: "🛡️",
    headline: "Age-aware participation with accountable identities and safer defaults.",
    focus: ["Observer vs verified access", "U18 safeguards", "Hard blocks for high-risk content"],
    demoPrompt: "Nobody wants you here. Go cry to your mum.",
  },
  athlete: {
    key: "athlete", label: "Athlete welfare", icon: "🏅",
    headline: "Reduce the personal abuse athletes receive in the moments that matter most.",
    focus: ["Personal abuse intervention", "Body/appearance abuse", "Enhanced review for serious allegations"],
    demoPrompt: "You useless fat cow, you bottled it again. Fuck off.",
  },
  brand: {
    key: "brand", label: "Brand / advertiser", icon: "🤝",
    headline: "A verified, brand-safer social environment built around accountable participation.",
    focus: ["Brand-safe inventory", "No gambling advertising", "Measurable safety outcomes"],
    demoPrompt: "The referee is a corrupt idiot and took money for that call.",
  },
  investor: {
    key: "investor", label: "Investor", icon: "📈",
    headline: "A defensible trust layer that changes user behaviour before harm reaches the feed.",
    focus: ["Intervention conversion", "Behaviour escalation", "Scalable moderation architecture"],
    demoPrompt: "That player is a cheat and she's doping.",
  },
};

const DEFAULTS = { audience: "sport", metricView: "scenario", presenterLocked:false };

function load() {
  try {
    const raw = localStorage.getItem(LS_DEMO_PREFS);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch (_) { return { ...DEFAULTS }; }
}

export function getDemoPrefs() { return load(); }
export function getAudiencePreset() { return AUDIENCE_PRESETS[load().audience] || AUDIENCE_PRESETS.sport; }
export function isPresenterLocked() { return load().presenterLocked === true; }

export function setPresenterLocked(locked) {
  const prefs = load();
  prefs.presenterLocked = locked === true;
  localStorage.setItem(LS_DEMO_PREFS, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("k1nd:demo-prefs", { detail:prefs }));
  return prefs;
}

export function setAudiencePreset(key) {
  const prefs = load();
  prefs.audience = AUDIENCE_PRESETS[key] ? key : "sport";
  localStorage.setItem(LS_DEMO_PREFS, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("k1nd:demo-prefs", { detail: prefs }));
  return prefs;
}

export function setMetricView(view) {
  const prefs = load();
  prefs.metricView = view === "live" ? "live" : "scenario";
  localStorage.setItem(LS_DEMO_PREFS, JSON.stringify(prefs));
  window.dispatchEvent(new CustomEvent("k1nd:demo-prefs", { detail: prefs }));
  return prefs;
}

export function resetDemoPrefs() {
  localStorage.setItem(LS_DEMO_PREFS, JSON.stringify(DEFAULTS));
  window.dispatchEvent(new CustomEvent("k1nd:demo-prefs", { detail: DEFAULTS }));
}
