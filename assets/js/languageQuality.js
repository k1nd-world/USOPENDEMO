export const LANGUAGE_QUALITY_PACKS = [
  { label:"English + emerging internet language", groups:1, rules:13, evidence:"Canonical, benign-context and evasion fixtures" },
  { label:"South Asian code-mixed", groups:4, rules:12, evidence:"Hindi, Urdu, Gujarati and Punjabi forms with literal-context controls" },
  { label:"Polish", groups:1, rules:3, evidence:"Targeting and ordinary-language counterexamples" },
  { label:"Australian English", groups:1, rules:7, evidence:"Dialect-specific targeting and banter distinctions" },
  { label:"Czech + Baltic", groups:4, rules:16, evidence:"Czech, Lithuanian, Latvian and Estonian fixtures" },
  { label:"Western European", groups:6, rules:24, evidence:"French, German, Spanish, Italian, Portuguese and Dutch fixtures" },
  { label:"Priority global", groups:12, rules:60, evidence:"Script-aware harmful and neutral pairs" },
  { label:"Next wave", groups:10, rules:50, evidence:"Targeted abuse plus literal and educational counterexamples" },
  { label:"V4.12 cross-script wave", groups:10, rules:50, evidence:"Native-script, romanised and safe-context fixtures" },
];

export const CROSS_PACK_SIGNALS = { rules:24, label:"16 global racial-slur + 8 contextual signal rules" };

export function getLanguageQualitySnapshot() {
  return {
    groups:LANGUAGE_QUALITY_PACKS.reduce((sum, pack) => sum + pack.groups, 0),
    rules:LANGUAGE_QUALITY_PACKS.reduce((sum, pack) => sum + pack.rules, 0) + CROSS_PACK_SIGNALS.rules,
    packs:LANGUAGE_QUALITY_PACKS.map((pack) => ({ ...pack, regressionStatus:"functional fixtures active", pilotPrecision:null, pilotRecall:null })),
    measurementBoundary:"No field precision, recall or native-speaker acceptance rate is claimed. Those metrics require labelled pilot traffic and independent native-language adjudication.",
  };
}
