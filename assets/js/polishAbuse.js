// K1ND.world v4.8 — first Polish profanity/abuse policy pack.

export const POLISH_PACK_VERSION = "2026.08-pl-1";

export const POLISH_ABUSE_RULES = [
  {
    id:"pl-kurwa-mac", displayTerm:"kurwa mać", mechanism:"strong_profanity", outcome:"warning",
    rationale:"The phrase is normally a highly vulgar exclamation expressing anger or frustration, not automatically an attack on a person.",
    rewrite:"I'm extremely frustrated, but I want to express that without strong profanity.",
    safeExample:"The dictionary defines ‘kurwa mać’ as a vulgar exclamation.",
  },
  {
    id:"pl-kurwa-target", displayTerm:"kurwa / kurwo", mechanism:"sexualised_misogyny", outcome:"block",
    rationale:"Used as a noun or vocative for a woman, the word is a sexualised misogynistic term of abuse. The same word used as a general expletive receives a warning instead.",
    rewrite:null,
    safeExample:"Kurwa! Znowu przegraliśmy! (an untargeted exclamation)",
  },
  {
    id:"pl-kurwa-expletive", displayTerm:"kurwa", mechanism:"strong_profanity", outcome:"warning",
    rationale:"As an interjection or intensifier, the word expresses strong profanity without necessarily targeting a person.",
    rewrite:"I'm frustrated, but I want to express that without strong profanity.",
    safeExample:"A linguistics paper discusses the word ‘kurwa’.",
  },
];

const EDUCATIONAL = /\b(?:mean|means|meaning|translate|translates|translation|definition|dictionary|term|word|paper|study|linguistic|discuss(?:es|ed|ing)?)\b/;
const KURWA_MAC = /\bkur[wv]a\s+m(?:a[cć]|atc|atch|ats?)(?![a-ząćęłńóśźż])/u;
const KURWA = /\bkur[wv](?:a|ą|o|ę|e|y)(?![a-ząćęłńóśźż])/u;
const POLISH_TARGET = /\b(?:ty|ciebie|cię|ona|kobieta|dziewczyna|zawodniczka|sportsmenka|you|she|woman|girl|player|athlete|@[a-z0-9_.-]+)\b/;

export function moderatePolishAbuse(norm, original) {
  if (EDUCATIONAL.test(norm)) return null;
  const folded = original.toLowerCase();
  if (KURWA_MAC.test(folded)) {
    const rule = POLISH_ABUSE_RULES[0];
    return { outcome:rule.outcome, category:rule.mechanism, reason:"Strong Polish profanity", rewriteSuggestion:rule.rewrite, polishRule:rule.id, policyRationale:rule.rationale };
  }
  if (!KURWA.test(folded)) return null;
  const targeted = /\b(?:ty\s+(?:jesteś\s+)?kur[wv][aąoyęe]|kur[wv]o\s+ty|you\s+(?:are\s+)?(?:a\s+)?kur[wv]a|she\s+is\s+(?:a\s+)?kur[wv]a)(?![a-ząćęłńóśźż])/u.test(folded) || (POLISH_TARGET.test(norm) && /\bkur[wv]o(?![a-ząćęłńóśźż])/u.test(folded));
  const rule = targeted ? POLISH_ABUSE_RULES[1] : POLISH_ABUSE_RULES[2];
  return { outcome:rule.outcome, category:rule.mechanism, reason:targeted ? "Targeted Polish sexualised abuse" : "Strong Polish profanity", rewriteSuggestion:rule.rewrite || undefined, polishRule:rule.id, policyRationale:rule.rationale };
}
