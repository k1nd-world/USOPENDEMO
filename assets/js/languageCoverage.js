// K1ND.world v4.12 — language/script coverage diagnostics.
// This does not pretend that script detection equals language understanding.

const SCRIPT_TESTS = [
  ["Latin", /[A-Za-z]/u], ["Gujarati", /[\u0A80-\u0AFF]/u],
  ["Devanagari", /[\u0900-\u097F]/u], ["Arabic-derived", /[\u0600-\u06FF\u0750-\u077F]/u],
  ["Bengali", /[\u0980-\u09FF]/u], ["Gurmukhi", /[\u0A00-\u0A7F]/u],
  ["Tamil", /[\u0B80-\u0BFF]/u], ["Telugu", /[\u0C00-\u0C7F]/u],
  ["Kannada", /[\u0C80-\u0CFF]/u], ["Malayalam", /[\u0D00-\u0D7F]/u],
  ["Thai", /[\u0E00-\u0E7F]/u], ["Hebrew", /[\u0590-\u05FF]/u],
  ["Cyrillic", /[\u0400-\u04FF]/u], ["Greek", /[\u0370-\u03FF]/u],
  ["Han", /[\u3400-\u4DBF\u4E00-\u9FFF]/u], ["Hiragana", /[\u3040-\u309F]/u],
  ["Katakana", /[\u30A0-\u30FF]/u], ["Hangul", /[\uAC00-\uD7AF]/u],
  ["Ethiopic", /[\u1200-\u137F]/u],
];

export const LANGUAGE_POLICY_ARCHITECTURE = [
  { layer:"Script and language identification", purpose:"Detect mixed scripts, likely languages and transliteration." },
  { layer:"Native-language policy packs", purpose:"Versioned terms, idioms, evasions, protected meanings and safe counterexamples." },
  { layer:"Multilingual contextual model", purpose:"Infer target, intent, abuse mechanism, severity and conversational context." },
  { layer:"Translation cross-check", purpose:"Secondary semantic check only; never the sole source of a high-impact block." },
  { layer:"Cross-lingual ensemble", purpose:"Compare native, multilingual and translated decisions and expose disagreement." },
  { layer:"Specialist review and appeal", purpose:"Resolve uncertainty, dialect, reclaimed terms, humour and high-impact cases." },
];

export function getLanguageCoverage(text, result) {
  const scripts = SCRIPT_TESTS.filter(([, re]) => re.test(text)).map(([name]) => name);
  const mixedScript = scripts.length > 1;
  const packs = ["universal safety", "English contextual policy", "emerging-language 2026.08"];
  if (scripts.some((s) => ["Latin", "Gujarati", "Devanagari", "Arabic-derived"].includes(s))) packs.push("South Asian code-mixed 2026.08-indic-1");
  if (result.polishRule) packs.push("Polish profanity/abuse 2026.08-pl-1");
  if (result.australianRule) packs.push("Australian English abuse 2026.08-au-1");
  if (result.czechBalticRule) packs.push("Czech/Baltic regional abuse 2026.08-cz-baltic-1");
  if (result.westernEuropeanRule) packs.push("Western European targeted-abuse 2026.08-west-eu-1");
  if (result.priorityGlobalRule) packs.push("priority global functional-abuse 2026.08-priority-global-1");
  if (result.nextWaveRule) packs.push("next-wave functional-abuse 2026.08-next-wave-1");
  if (result.v412LanguageRule) packs.push("cross-script language wave 2026.08-context-wave-1");
  if (result.v412SignalRule) packs.push("cross-context coded-signal review 2026.08-cross-context-1");
  if (result.uncertaintyRule) packs.push("targeted uncertainty fail-safe 2026.08-shield-1");
  packs.push("high-confidence global racial-slur 2026.08-racial-1");
  const directlyCovered = Boolean(result.priorityGlobalRule || result.nextWaveRule || result.v412LanguageRule || result.v412SignalRule) || scripts.length === 0 || scripts.every((s) => ["Latin", "Gujarati", "Devanagari", "Arabic-derived"].includes(s));
  return {
    scripts: scripts.length ? scripts : ["no alphabetic script detected"],
    mixedScript,
    packs,
    demoCoverage: directlyCovered ? "covered by active demo rules" : "requires production multilingual model",
    productionRoute: directlyCovered ? "native rules + contextual ensemble" : "language ID + native model + translation cross-check + uncertainty review",
    disagreementRisk: result.outcome === "clean" && !directlyCovered ? "elevated—absence of a demo match is not proof of safety" : "standard",
    languageConfidence:result.languageConfidence || (directlyCovered ? "functional pack match" : "production model required"),
    codeSwitch:Boolean(result.codeSwitch || mixedScript),
    transliteration:result.transliterationEvidence || "none detected",
  };
}
