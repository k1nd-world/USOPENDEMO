// K1ND.world v4.12 — code-switch, transliteration and coded-meaning signals.
// Ambiguous coded language is routed to review, never declared hateful from a
// single ordinary word. Known multilingual labels still require target evidence.

export const V412_SIGNAL_PACK_VERSION = "2026.08-cross-context-1";

export const V412_SIGNAL_RULES = [
  { id:"cross-target-label", displayTerm:"cross-language target + label", outcome:"warning", mechanism:"code_switched_abuse", rationale:"A target in one language and a reviewed degrading label in another still form one personal attack.", safeExample:"The dictionary compares the words boka and fool." },
  { id:"cross-stacked-labels", displayTerm:"stacked labels from two languages", outcome:"warning", mechanism:"stacked_personal_degradation", rationale:"Switching languages inside a stack does not remove the cumulative degrading function.", safeExample:"The study compares bodoh and mumu as dataset labels." },
  { id:"cross-separator-evasion", displayTerm:"punctuation-separated transliteration", outcome:"warning", mechanism:"moderation_evasion", rationale:"Separators and repeated letters do not hide a reviewed transliterated personal label.", safeExample:"Spell mumu as m-u-m-u for the exercise." },
  { id:"coded-good-ones", displayTerm:"group exception stereotype", outcome:"review", mechanism:"coded_group_stereotype", rationale:"Exception language can imply that an identity group is generally inferior; identity and discourse context are required.", safeExample:"The paper analyses the phrase one of the good ones as a stereotype." },
  { id:"coded-global-control", displayTerm:"coded control conspiracy", outcome:"review", mechanism:"coded_identity_conspiracy", rationale:"A control-of-media-or-banks conspiracy can act as coded identity targeting; ambiguity requires review rather than an automatic block.", safeExample:"The lecture discusses historical globalist conspiracy narratives." },
  { id:"coded-triple-parentheses", displayTerm:"triple-parenthesis account targeting", outcome:"review", mechanism:"coded_identity_targeting", rationale:"Triple parentheses around a named person can be a coded targeting convention and is held for contextual review.", safeExample:"The linguistics paper shows (((name))) as an example of coded notation." },
  { id:"coded-numeric", displayTerm:"coded numeric group reference", outcome:"review", mechanism:"coded_group_stereotype", rationale:"A reviewed numeric code tied to a racial claim is held for contextual review rather than treated as an ordinary statistic.", safeExample:"The research paper analyses the 13/50 dog-whistle construction." },
  { id:"coded-belonging", displayTerm:"identity belonging exclusion", outcome:"review", mechanism:"coded_exclusion", rationale:"Belonging language becomes exclusionary when paired with an identity-defined target.", safeExample:"The phrase not our kind appears in the film review." },
];

const LABELS = [
  ["bn","boka"], ["fa","ahmagh"], ["id","bodoh"], ["ms","bangang"],
  ["ta","muttal"], ["te","moorkhudu"], ["kn","moorkha"], ["ml","mandan"],
  ["mr-ne","murkh"], ["ha","wawa"], ["yo","omugo"], ["ig","nzuzu"],
  ["pcm","mumu"], ["sw","mjinga"], ["tl","bobo"],
];

const TARGET = /\b(?:you|u|your|that\s+player|the\s+player|that\s+athlete|the\s+athlete|he|she|they|him|her|them|@[a-z0-9_.-]+)\b/i;
const IDENTITY = /\b(?:black|asian|arab|jewish|muslim|christian|hindu|sikh|gay|lesbian|trans|disabled|immigrant|refugee|foreign|african|indian|nigerian|yoruba|hausa|igbo)\b/i;
const EDUCATIONAL = /\b(?:dictionary|definition|translation|translate|research|study|paper|dataset|analysis|linguistic|language|history|historical|lecture|example|means?|meaning|spell|spelling|notation|dog[ -]?whistle)\b/i;

function asciiFold(value) {
  return String(value || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[’']/g, "")
    .replace(/0/g,"o").replace(/1/g,"i").replace(/3/g,"e").replace(/4/g,"a").replace(/5/g,"s")
    .replace(/([a-z])\1{2,}/g, "$1$1");
}

function loose(term) {
  return new RegExp(`(?:^|[^a-z0-9])${[...term].map((c) => `${c}+`).join("[^a-z0-9]{0,5}")}(?=$|[^a-z0-9])`, "i");
}

function labelHits(original) {
  const text = asciiFold(original);
  return LABELS.filter(([, term]) => loose(term).test(text)).map(([code, term]) => ({ code, term, evasive:!new RegExp(`\\b${term}\\b`,"i").test(text) }));
}

function clean(reason, rule) {
  return { outcome:"clean", category:"contextual_safe", reason, v412SignalRule:rule, contextOverride:"educational", codedMeaning:{ status:"protected discussion", ambiguity:"resolved by explicit research or educational framing" } };
}

function review(rule, reason, mechanism, evidence, targetHint) {
  return {
    outcome:"review", category:mechanism, reason, v412SignalRule:rule,
    targetHint,
    policyRationale:V412_SIGNAL_RULES.find((item) => item.id === rule)?.rationale,
    codedMeaning:{ status:"contextual review required", ambiguity:"ordinary wording can have both coded and non-coded senses", evidence },
  };
}

export function moderateV412Signals(original) {
  const text = String(original || "");
  const folded = asciiFold(text);
  const educational = EDUCATIONAL.test(text);
  const hits = labelHits(text);

  if (hits.length && educational) return clean("Educational comparison of multilingual wording", "cross-target-label");
  if (hits.length && TARGET.test(text)) {
    const distinct = new Set(hits.map((item) => item.code));
    const evasive = hits.some((item) => item.evasive);
    const rule = evasive ? "cross-separator-evasion" : distinct.size > 1 ? "cross-stacked-labels" : "cross-target-label";
    return {
      outcome:"warning",
      category:rule === "cross-stacked-labels" ? "stacked_personal_degradation" : rule === "cross-separator-evasion" ? "moderation_evasion" : "code_switched_abuse",
      reason:rule === "cross-stacked-labels" ? "Stacked cross-language personal degradation" : rule === "cross-separator-evasion" ? "Transliterated abuse evasion" : "Code-switched personal degradation",
      v412SignalRule:rule,
      codeSwitch:true,
      languageSignals:[...distinct],
      transliterationEvidence:evasive ? "separator or repeated-letter transformation" : "Latin-script cross-language label",
      policyRationale:V412_SIGNAL_RULES.find((item) => item.id === rule)?.rationale,
    };
  }

  const goodOnes = /\bone\s+of\s+the\s+good\s+ones\b/i.test(text) && IDENTITY.test(text);
  if (goodOnes) return educational ? clean("Research discussion of an identity stereotype", "coded-good-ones") : review("coded-good-ones", "Potential coded identity stereotype", "coded_group_stereotype", "identity reference + exception stereotype", { label:"the referenced identity-defined participant or group", type:"group", scope:"identity-coded target", explicitness:"identity reference + exception frame" });

  const control = /\bglobalists?\b/i.test(text) && /\b(?:control|run|own)\b.{0,30}\b(?:banks?|media|press|government|world)\b/i.test(text);
  if (control) return educational ? clean("Historical or research discussion of a coded conspiracy", "coded-global-control") : review("coded-global-control", "Potential coded identity conspiracy", "coded_identity_conspiracy", "global-control conspiracy construction", { label:"a potentially coded identity group", type:"group", scope:"coded group reference", explicitness:"inferred; requires review" });

  const triple = /\(\(\([^()]{2,60}\)\)\)/u.test(text);
  if (triple) return educational ? clean("Educational discussion of coded notation", "coded-triple-parentheses") : review("coded-triple-parentheses", "Potential coded identity targeting", "coded_identity_targeting", "triple-parenthesis named-target convention", { label:"the account inside the coded notation", type:"person", scope:"coded named account", explicitness:"coded convention; requires review" });

  const numeric = /\b13\s*[\/:]\s*50\b/.test(text) && /\b(?:they|them|those|people|group|race|crime|criminal)\b/i.test(text);
  if (numeric) return educational ? clean("Research discussion of a coded numeric construction", "coded-numeric") : review("coded-numeric", "Potential coded racial stereotype", "coded_group_stereotype", "numeric code + group claim", { label:"the group referenced by the numeric claim", type:"group", scope:"coded group target", explicitness:"group wording + reviewed numeric code" });

  const belonging = /\b(?:not\s+our\s+kind|do(?:es)?nt\s+belong\s+with\s+us|real\s+(?:british|american|australian|french|german)\s+only)\b/i.test(folded) && (IDENTITY.test(text) || TARGET.test(text));
  if (belonging) return educational ? clean("Quoted or analytical discussion of exclusionary wording", "coded-belonging") : review("coded-belonging", "Potential coded identity exclusion", "coded_exclusion", "belonging claim + person or identity target", { label:"the identity-defined participant", type:"person", scope:"identity-coded individual", explicitness:"identity reference + belonging claim" });

  return null;
}

export const V412_SIGNAL_TEST_CASES = [
  { input:"You are boka.", expect:"warning", expectCodeSwitch:true },
  { input:"That player is m-u-m-u.", expect:"warning", expectCodeSwitch:true },
  { input:"You are mummmuu.", expect:"warning", expectCodeSwitch:true },
  { input:"You are bodoh and mumu.", expect:"warning", expectCodeSwitch:true },
  { input:"The dictionary compares the words boka and fool.", expect:"clean" },
  { input:"Spell mumu as m-u-m-u for the exercise.", expect:"clean" },
  { input:"That Muslim player is one of the good ones.", displayInput:"[identity exception stereotype]", expect:"review", expectCodedMeaning:true },
  { input:"The paper analyses the phrase one of the good ones as a stereotype.", expect:"clean" },
  { input:"Globalists control all the banks and media.", displayInput:"[coded global-control conspiracy]", expect:"review", expectCodedMeaning:true },
  { input:"The lecture discusses historical globalist conspiracy narratives.", expect:"clean" },
  { input:"(((playername))) lost again.", displayInput:"[triple-parenthesis account target]", expect:"review", expectCodedMeaning:true },
  { input:"The linguistics paper shows (((name))) as an example of coded notation.", expect:"clean" },
  { input:"13/50 proves those people are criminals.", displayInput:"[coded numeric racial claim]", expect:"review", expectCodedMeaning:true },
  { input:"The research paper analyses the 13/50 dog-whistle construction.", expect:"clean" },
  { input:"That immigrant is not our kind.", displayInput:"[identity belonging exclusion]", expect:"review", expectCodedMeaning:true },
  { input:"The phrase not our kind appears in the film review.", expect:"clean" },
  { input:"She is one of the good players on this team.", expect:"clean" },
  { input:"Global markets influence banks and media.", expect:"clean" },
];
