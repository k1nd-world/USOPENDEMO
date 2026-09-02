// K1ND.world v4.8 — Australian English abuse policy pack.
// Context is essential: many Australian insults can be affectionate banter,
// literal animal/food/appliance words, or ordinary sporting vocabulary.

export const AUSTRALIAN_PACK_VERSION = "2026.08-au-1";

export const AUSTRALIAN_ABUSE_RULES = [
  {
    id:"au-fool-labels", displayTerm:"drongo · galah · dill · dropkick · ratbag", mechanism:"personal_ridicule",
    forms:"drongos?|galahs?|dills?|drop\\s*kicks?|ratbags?", outcome:"warning",
    rationale:"These are established Australian labels for a foolish, hopeless or ridiculous person. Intervention requires person-directed or explicit insult framing because several also have literal meanings.",
    safeExample:"A galah landed beside the oval; the player practised a drop kick.",
  },
  {
    id:"au-contempt-labels", displayTerm:"flog · grub · deadshit", mechanism:"personal_degradation",
    forms:"flogs?|grubs?|dead\\s*shits?", outcome:"warning",
    rationale:"Directed at a person, these terms express contempt or worthlessness rather than criticism of a sporting action. Literal insect, food and sale/verb uses remain outside the rule.",
    safeExample:"The gardener found a grub; the club will flog the old merchandise.",
  },
  {
    id:"au-emotion-taunt", displayTerm:"sook · sooky · whinger", mechanism:"emotional_ridicule",
    forms:"sooks?|sook(?:y|ier|iest)|whingers?", outcome:"warning",
    rationale:"Used directly, the terms mock a person for complaining, crying or showing emotion. Self-description and discussion of the term remain allowed.",
    safeExample:"I had a sook after the result and then moved on.",
  },
  {
    id:"au-class-ridicule", displayTerm:"bogan", mechanism:"class_based_ridicule",
    forms:"bogans?", outcome:"warning",
    rationale:"Bogan can be a class-coded insult but is also widely self-identified and reclaimed. Only direct derogatory labelling receives intervention.",
    safeExample:"She proudly describes herself as a cashed-up bogan.",
  },
  {
    id:"au-cooker-label", displayTerm:"cooker", mechanism:"belief_based_ridicule",
    forms:"cookers?", outcome:"warning",
    rationale:"In contemporary Australian usage, cooker can dismiss a person as an irrational conspiracy theorist. Literal cooking-appliance uses are protected.",
    safeExample:"Put the rice in the cooker before the match.",
  },
  {
    id:"au-strong-insult", displayTerm:"fuckwit · dickhead", mechanism:"strong_personal_abuse",
    forms:"fuck\\s*wits?|dick\\s*heads?", outcome:"warning",
    rationale:"These are strong person-directed insults. They receive pre-publication intervention even though their register may vary between Australian social groups.",
    safeExample:"The dictionary labels ‘fuckwit’ as offensive Australian slang.",
  },
  {
    id:"au-pull-head-in", displayTerm:"pull your head in", mechanism:"dismissive_command",
    forms:"pull\\s+(?:your|ya)\\s+head\\s+in", outcome:"warning", mode:"phrase",
    rationale:"The idiom is a confrontational command telling another person to stop or restrain their behaviour. It is moderated as dismissal rather than literal violence.",
    safeExample:"The coach explained what ‘pull your head in’ means in Australian English.",
  },
];

const EDUCATIONAL = /\b(?:word|term|phrase|dictionary|definition|means?|meaning|translate|translation|slang|quoted?|discuss(?:es|ed|ing)?|example|labels?)\b/;
const TARGET = "(?:you|u|youre|you\\s+re|he|hes|he\\s+s|she|shes|she\\s+s|they|theyre|that\\s+(?:player|athlete|fan|umpire|referee)|this\\s+(?:player|athlete|fan)|@[a-z0-9_.-]+)";

function safeLiteral(rule, norm) {
  if (rule.id === "au-fool-labels") {
    if (/\b(?:galah|drongo)s?\b/.test(norm) && /\b(?:bird|parrot|cockatoo|flock|species|racehorse|horse|landed|flew|nest)\b/.test(norm)) return true;
    if (/\bdrop\s*kick\b/.test(norm) && /\b(?:practis(?:e|ed|ing)|practice|technique|scored?|goal|kick)\b/.test(norm)) return true;
    if (/\bdill\b/.test(norm) && /\b(?:herb|pickle|recipe|kitchen|sauce)\b/.test(norm)) return true;
  }
  if (rule.id === "au-contempt-labels") {
    if (/\bgrubs?\b/.test(norm) && /\b(?:insect|larva|garden|soil|food|meal|feed)\b/.test(norm)) return true;
    if (/\bflog\b/.test(norm) && /\b(?:sell|sale|merchandise|tickets?|products?|ball)\b/.test(norm)) return true;
  }
  if (rule.id === "au-class-ridicule" && /\b(?:i|we)\s+(?:am|are|re|identify|describe)\b|\bproud(?:ly)?\s+(?:a\s+)?bogan\b/.test(norm)) return true;
  if (rule.id === "au-cooker-label" && /\b(?:slow|rice|pressure)\s+cooker\b|\b(?:kitchen|appliance|cook|recipe)\b/.test(norm)) return true;
  return false;
}

function targeted(rule, norm) {
  const term = `(?:${rule.forms})`;
  const framed = new RegExp(`\\b${TARGET}\\b[^.!?]{0,28}\\b${term}\\b|\\b${term}\\b[^.!?]{0,20}\\b${TARGET}\\b`);
  const explicit = new RegExp(`\\b(?:what\\s+an?|such\\s+an?|absolute|bloody|flamin(?:g)?|fucking)\\s+${term}\\b`);
  const imperative = new RegExp(`\\b(?:stop|quit)\\s+(?:being|acting\\s+like)\\s+(?:a\\s+)?${term}\\b|\\b(?:do\\s+not|dont)\\s+be\\s+(?:a\\s+)?${term}\\b`);
  return framed.test(norm) || explicit.test(norm) || imperative.test(norm);
}

export function moderateAustralianAbuse(norm) {
  if (EDUCATIONAL.test(norm)) return null;
  const rule = AUSTRALIAN_ABUSE_RULES.find((candidate) => new RegExp(`\\b(?:${candidate.forms})\\b`).test(norm) && !safeLiteral(candidate, norm));
  if (!rule) return null;
  if (rule.mode !== "phrase" && !targeted(rule, norm)) return null;
  return {
    outcome:rule.outcome,
    category:rule.mechanism,
    reason:"Targeted Australian English abuse",
    australianRule:rule.id,
    policyRationale:rule.rationale,
  };
}
