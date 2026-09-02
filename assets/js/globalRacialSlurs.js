// K1ND.world v4.8 — high-confidence cross-language racial-slur pack.
//
// This pack contains only forms judged sufficiently specific for a hard block.
// Ambiguous colour/demonym words are excluded unless the form is independently
// derogatory. Expansion requires native-speaker review and paired false-positive
// tests; automatic translation of a slur list is not accepted policy evidence.

export const GLOBAL_RACIAL_PACK_VERSION = "2026.08-racial-1";

export const GLOBAL_RACIAL_SLUR_RULES = [
  { id:"racial-nword-cyrillic", language:"Russian / Ukrainian transliteration", forms:["ниггер","ніґґер","ниґґер"], label:"N-word transliteration" },
  { id:"racial-nword-devanagari", language:"Devanagari transliteration", forms:["निग्गर"], label:"N-word transliteration" },
  { id:"racial-nword-gujarati", language:"Gujarati transliteration", forms:["નિગ્ગર"], label:"N-word transliteration" },
  { id:"racial-black-polish", language:"Polish", forms:["czarnuch","czarnucha","czarnuchy","czarnuchem"], label:"Anti-Black racial slur" },
  { id:"racial-black-dutch", language:"Dutch", forms:["nikker","nikkers"], label:"Anti-Black racial slur" },
  { id:"racial-black-german", language:"German", forms:["neger","negerin","negern"], label:"Anti-Black racial slur" },
  { id:"racial-black-french", language:"French", forms:["négro","négros"], label:"Anti-Black racial slur" },
  { id:"racial-north-african-french", language:"French", forms:["bougnoule","bougnoules","bicot","bicots"], label:"Anti-North-African ethnic slur" },
  { id:"racial-black-spanish", language:"Spanish", forms:["negrata","negratas"], label:"Anti-Black racial slur" },
  { id:"racial-south-american-spanish", language:"Spanish", forms:["sudaca","sudacas"], label:"Anti-South-American ethnic slur" },
  { id:"racial-black-italian", language:"Italian", forms:["negraccio","negracci","negraccia","negracce"], label:"Anti-Black racial slur" },
  { id:"racial-black-mandarin", language:"Mandarin", forms:["黑鬼"], label:"Anti-Black racial slur" },
  { id:"racial-black-portuguese-targeted", language:"Portuguese", forms:["macaco","macaca","macacos","macacas"], label:"Targeted anti-Black simian slur", mode:"targeted" },
  { id:"racial-black-hindi-targeted", language:"Hindi / Urdu / Gujarati", forms:["habshi","habsi","हब्शी","हबशी","حبشی","હબશી"], label:"Targeted anti-Black ethnic slur", mode:"targeted" },
  { id:"racial-middle-eastern-german-targeted", language:"German", forms:["kanake","kanaken","kanacke","kanak"], label:"Targeted anti-Middle-Eastern ethnic slur", mode:"targeted" },
  { id:"racial-black-arabic-vocative", language:"Arabic", forms:["يا عبيد"], label:"Anti-Black racialised slave slur", mode:"phrase" },
];

function unicodeTokenHit(text, form) {
  const escaped = form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu").test(text); }
  catch (_) { return text.toLowerCase().includes(form.toLowerCase()); }
}

export function moderateGlobalRacialSlurs(original) {
  const lower = original.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  const targetContext = /\b(?:you|u|your|tu|tum|tame|du|dich|você|voce|seu|sua|ele|ela|jogador|jogadora|atleta|player|athlete|@[a-z0-9_.-]+)\b|(?:तू|तुम|તું|તમે|آپ|تم)/u;
  const targetedTerm = GLOBAL_RACIAL_SLUR_RULES.find((candidate) => candidate.mode === "targeted" && candidate.forms.some((form) => unicodeTokenHit(original, form)) && targetContext.test(lower));
  const phraseTerm = GLOBAL_RACIAL_SLUR_RULES.find((candidate) => candidate.mode === "phrase" && candidate.forms.some((form) => original.includes(form)));
  const rule = targetedTerm || phraseTerm || GLOBAL_RACIAL_SLUR_RULES.find((candidate) => !candidate.mode && candidate.forms.some((form) => unicodeTokenHit(original, form)));
  if (!rule) return null;
  return {
    outcome:"block",
    category:"racial_slur",
    reason:"Racial slur / anti-Black abuse",
    globalRacialRule:rule.id,
    policyRationale:`${rule.label} (${rule.language}). High-confidence racial slurs are not publishable and have no bypass or rewrite path.`,
  };
}
