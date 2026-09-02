// K1ND.world v4.8 — fail-safe uncertainty and evasion guard.
// Suspicious targeted wording is intercepted when the deterministic policy
// cannot confidently read it. This is deliberately a review path, not a claim
// that an unknown token is abusive.

export const UNCERTAINTY_GUARD_VERSION = "2026.08-shield-1";

const REVIEWED_ABUSE = [
  "idiot", "moron", "stupid", "dumb", "useless", "pathetic", "hopeless",
  "clueless", "brainless", "clown", "loser", "scum", "worthless", "fool",
  "fuckwit", "dickhead", "arsehole", "asshole",
];

const EDUCATIONAL = /\b(?:spell|spelling|word|term|phrase|letters?|characters?|example|exercise|dictionary|definition|means?|meaning|translate|translation|linguistic|moderation|policy|research|study|variable|placeholder|unicode|script|compared?|comparison)\b/i;
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFE00-\uFE0F\uFEFF]/u;
const COMPATIBILITY = /[\u2460-\u24FF\uFF01-\uFF5E\u{1D400}-\u{1D7FF}]/u;
const LETTER = /\p{L}/u;
const LATIN = /[A-Za-z]/u;
const CYRILLIC_OR_GREEK = /[\u0370-\u03FF\u0400-\u04FF]/u;
const SPELLED_SEQUENCE = /(?:^|[^\p{L}\p{N}])(?:\p{L}[^\p{L}\p{N}]{1,12}){3,}\p{L}(?:$|[^\p{L}\p{N}])/u;

function fold(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[аɑ]/g, "a").replace(/[еёε]/g, "e").replace(/[іι|]/g, "i")
    .replace(/[оο]/g, "o").replace(/[сϲ]/g, "c").replace(/[рρ]/g, "p")
    .replace(/[хχ]/g, "x").replace(/[уγ]/g, "y")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060\u2066-\u2069\uFE00-\uFE0F\uFEFF]/g, "")
    .replace(/1/g, "i").replace(/3/g, "e").replace(/0/g, "o")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
    .replace(/@/g, "a").replace(/\$/g, "s");
}

function evasionRegex(word) {
  const body = [...word].map((char) => `${char}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`);
}

const ABUSE_EVASIONS = REVIEWED_ABUSE.map((word) => [word, evasionRegex(word)]);

function mixedScriptToken(value) {
  return String(value || "").split(/\s+/).some((token) => LATIN.test(token) && CYRILLIC_OR_GREEK.test(token));
}

function directTarget(folded) {
  const normal = folded.replace(/[^a-z0-9@\s]/g, " ").replace(/\s+/g, " ");
  const compact = folded.replace(/[^a-z0-9]/g, "");
  return /\b(?:you|u|your|he|him|she|her|they|them|player|athlete|umpire|referee|coach|fan)\b|@[a-z0-9_.-]+/.test(normal) || /(?:youare|youre|your|ur|uare)/.test(compact);
}

function separatorDensity(value) {
  const text = String(value || "");
  const letters = [...text].filter((char) => LETTER.test(char)).length;
  if (letters < 4) return 0;
  const separators = [...text].filter((char) => !LETTER.test(char) && !/\p{N}|\s/u.test(char)).length;
  return separators / letters;
}

export function moderateUncertainty(original) {
  const raw = String(original || "");
  if (!raw.trim() || EDUCATIONAL.test(raw)) return null;
  const folded = fold(raw);
  const targeted = directTarget(folded);
  const features = [];
  if (INVISIBLE.test(raw)) features.push("invisible or bidirectional control characters");
  if (COMPATIBILITY.test(raw)) features.push("compatibility or mathematical letter forms");
  if (mixedScriptToken(raw)) features.push("mixed-script token");
  if (LATIN.test(raw) && CYRILLIC_OR_GREEK.test(raw) && targeted) features.push("mixed-script target marker");
  if (SPELLED_SEQUENCE.test(raw)) features.push("letter-by-letter separator pattern");
  if (separatorDensity(raw) >= 0.45) features.push("high separator density");
  const abuseHit = ABUSE_EVASIONS.find(([, regex]) => regex.test(folded));
  if (abuseHit && !new RegExp(`\\b${abuseHit[0]}\\b`, "i").test(raw.normalize("NFKD"))) features.push("punctuation-separated reviewed term");
  const suspicious = features.length > 0;
  if (!suspicious) return null;

  if (abuseHit) {
    return {
      outcome:"warning",
      category:"moderation_evasion",
      reason:"Obfuscated personal abuse",
      uncertaintyRule:"known-abuse-evasion",
      uncertaintySignals:features,
      policyRationale:"A reviewed abuse term remains recognisable after removing separators, compatibility forms, invisible controls or common character substitutions.",
    };
  }

  if (targeted && (features.includes("invisible or bidirectional control characters") || features.includes("mixed-script token") || features.includes("mixed-script target marker") || features.includes("letter-by-letter separator pattern"))) {
    return {
      outcome:"review",
      category:"language_uncertainty",
      reason:"Suspicious targeted wording requires enhanced review",
      uncertaintyRule:"targeted-uncertain-evasion",
      uncertaintySignals:features,
      policyRationale:"The message targets a participant and uses an evasion pattern the deterministic browser policy cannot interpret confidently. It is held rather than silently published or incorrectly labelled as abuse.",
    };
  }
  return null;
}
