import { writeFileSync } from "node:fs";
import { EMERGING_LANGUAGE_RULES } from "../assets/js/emergingLanguage.js";
import { MULTILINGUAL_ABUSE_RULES } from "../assets/js/multilingualAbuse.js";
import { POLISH_ABUSE_RULES } from "../assets/js/polishAbuse.js";
import { GLOBAL_RACIAL_SLUR_RULES } from "../assets/js/globalRacialSlurs.js";
import { AUSTRALIAN_ABUSE_RULES } from "../assets/js/australianAbuse.js";
import { CZECH_BALTIC_ABUSE_RULES } from "../assets/js/czechBalticAbuse.js";
import { WESTERN_EUROPEAN_ABUSE_RULES } from "../assets/js/westernEuropeanAbuse.js";
import { PRIORITY_GLOBAL_ABUSE_RULES } from "../assets/js/priorityGlobalAbuse.js";
import { NEXT_WAVE_ABUSE_RULES } from "../assets/js/nextWaveAbuse.js";
import { V412_LANGUAGE_RULES } from "../assets/js/v412LanguageWave.js";
import { V412_SIGNAL_RULES } from "../assets/js/v412ContextSignals.js";

const packs = [
  ["emerging", EMERGING_LANGUAGE_RULES], ["south_asian", MULTILINGUAL_ABUSE_RULES],
  ["polish", POLISH_ABUSE_RULES], ["global_racial", GLOBAL_RACIAL_SLUR_RULES],
  ["australian", AUSTRALIAN_ABUSE_RULES], ["czech_baltic", CZECH_BALTIC_ABUSE_RULES],
  ["western_european", WESTERN_EUROPEAN_ABUSE_RULES], ["priority_global", PRIORITY_GLOBAL_ABUSE_RULES],
  ["next_wave", NEXT_WAVE_ABUSE_RULES], ["v412_language", V412_LANGUAGE_RULES],
  ["v412_context", V412_SIGNAL_RULES],
];

function patterns(rule) {
  const rows = [];
  if (rule.term) rows.push({ type:"literal", value:rule.term });
  if (Array.isArray(rule.forms)) rule.forms.forEach((value) => rows.push({ type:"literal", value }));
  else if (typeof rule.forms === "string") rows.push({ type:"regex", value:rule.forms });
  if (typeof rule.roman === "string") rows.push({ type:"regex", value:rule.roman });
  return rows;
}

const rules = packs.flatMap(([pack, list]) => list.map((rule) => ({
  id:rule.id,
  pack,
  language:rule.language || rule.code || "English / contextual",
  mechanism:rule.mechanism || "contextual_signal",
  outcome:pack === "global_racial" ? "block" : (rule.outcome || rule.targetedOutcome || "review"),
  untargetedOutcome:rule.untargetedOutcome || null,
  mode:rule.mode || (pack === "global_racial" ? "identity_slur" : "contextual"),
  targets:rule.targets || null,
  patterns:patterns(rule),
  safeExample:rule.safeExample || null,
})));

writeFileSync(new URL("../assets/server/policy_snapshot.json", import.meta.url), JSON.stringify({
  version:"server-policy-4.19.0",
  sourceRuleCount:rules.length,
  executablePatternCount:rules.reduce((sum, rule) => sum + rule.patterns.length, 0),
  rules,
}, null, 2) + "\n");
