// K1ND.world v4.8 — South Asian / code-mixed abuse policy pack.
//
// Curated from corpus research and dictionary evidence, not copied wholesale
// from user-submitted slang sites. Ambiguous initials such as BC/MC are omitted.
// Romanised, Devanagari, Gujarati and Urdu forms can reach the same rule.

export const MULTILINGUAL_PACK_VERSION = "2026.08-indic-1";

export const MULTILINGUAL_ABUSE_RULES = [
  {
    id:"sa-suspected-family-evasion", displayTerm:"hinchod", language:"Uncorroborated / suspected evasion",
    roman:"hin\\s*ch(?:o|u|oo)t?d(?:e|s)?", scripts:[], mechanism:"suspected_evasive_abuse",
    targetedOutcome:"review", untargetedOutcome:"warning",
    rationale:"This spelling is not sufficiently corroborated as a stable lexical form. When directed at a person it is held for contextual review as a likely evasion or misspelling of family-sexual abuse, rather than being automatically hard-blocked.",
    rewrite:"I'm frustrated, but I want to express that without suspected abusive language.",
    safeExample:"A moderator asks whether ‘hinchod’ is a misspelling.",
  },
  {
    id:"sa-family-sexual-sister", displayTerm:"behenchod / benchod", language:"Hindustani · Punjabi · code-mixed",
    roman:"(?:behen|behn|bhen|ben|bahen|bahan|bahin|bhaen|pen|pan)\\s*ch(?:o|u|oo)t?d(?:e|s)?",
    scripts:["बहनचोद","بہن چود","બહેનચોદ"], mechanism:"sexualised_family_abuse",
    targetedOutcome:"block", untargetedOutcome:"warning",
    rationale:"The expression invokes sexual violence or incest involving the target's sister. Directed use is severe sexualised family abuse; an untargeted exclamation still receives profanity friction.",
    rewrite:"I'm extremely frustrated, but I want to express that without sexualised or family-directed abuse.",
    safeExample:"The term ‘benchod’ is a severe South Asian insult.",
  },
  {
    id:"sa-family-sexual-mother", displayTerm:"madarchod", language:"Hindustani · code-mixed",
    roman:"(?:madar|mader|madhar|maadar|madr)\\s*ch(?:o|u|oo)t?d(?:e|s)?",
    scripts:["मादरचोद","मदरचोद","مادرچود","માદરચોદ"], mechanism:"sexualised_family_abuse",
    targetedOutcome:"block", untargetedOutcome:"warning",
    rationale:"The expression invokes sexual violence or incest involving the target's mother. Direct use is severe sexualised family abuse.",
    rewrite:"I'm extremely frustrated, but I want to express that without sexualised or family-directed abuse.",
    safeExample:"The paper analyses variants of the word ‘madarchod’.",
  },
  {
    id:"sa-sexualised-woman", displayTerm:"randi", language:"Hindi · Urdu · Gujarati · code-mixed",
    roman:"randi(?:i|ya|yon|o)?", scripts:["रंडी","रण्डी","رنڈی","રાંડી"], mechanism:"sexualised_misogyny",
    targetedOutcome:"block", untargetedOutcome:"warning",
    rationale:"Used at a woman, this is a sexualised misogynistic slur that attacks perceived sexual behaviour rather than any sporting action.",
    rewrite:"I want to keep the criticism focused on the performance without sexualising or degrading anyone.",
    safeExample:"The dictionary labels ‘randi’ as derogatory.",
  },
  {
    id:"sa-sexualised-insult", displayTerm:"chutiya", language:"Hindi · Gujarati · code-mixed",
    roman:"chut(?:iya|ia|iye|iyo|iy[a-z]*)", scripts:["चूतिया","चुतिया","ચુતિયા"], mechanism:"sexualised_personal_abuse",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"The term is a vulgar genital-derived personal insult. It receives intervention even when code-mixed or transliterated.",
    rewrite:"I disagree, but I want to express that without sexualised personal abuse.",
    safeExample:"The dataset lists ‘chutiya’ as an offensive code-mixed term.",
  },
  {
    id:"sa-sexualised-insult-gandu", displayTerm:"gandu", language:"Hindi · Gujarati · code-mixed",
    roman:"gand(?:u|oo|ua|ue)", scripts:["गांडू","गाण्डू","ગાંડુ"], mechanism:"sexualised_personal_abuse",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"The word is used as a vulgar sexualised insult; intervention is based on its abusive function, not the script used.",
    rewrite:"I disagree, but I want to express that without sexualised personal abuse.",
    safeExample:"The moderator is reviewing the word ‘gandu’ as a quoted term.",
  },
  {
    id:"sa-legitimacy-insult", displayTerm:"harami", language:"Hindi · Urdu · Gujarati · code-mixed",
    roman:"hara?mi(?:o|yon)?", scripts:["हरामी","حرامی","હરામી"], mechanism:"personal_degradation",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"The term attacks a person's legitimacy or character rather than addressing their contribution.",
    rewrite:"I strongly disagree, but I want to criticise the conduct rather than degrade the person.",
    safeExample:"The article quotes ‘harami’ while discussing translation.",
  },
  {
    id:"sa-mental-ridicule", displayTerm:"pagal", language:"Hindi · Urdu · Gujarati · code-mixed",
    roman:"paagal|pagal", scripts:["पागल","پاگل","પાગલ"], mechanism:"mental_state_ridicule",
    targetedOutcome:"warning", untargetedOutcome:"clean",
    rationale:"Applied to a person, the term ridicules a perceived mental state. Non-targeted idiomatic use is not automatically moderated.",
    rewrite:"I disagree with that view, but I want to explain why without ridiculing anyone's mental state.",
    safeExample:"That was a pagal match!",
  },
  {
    id:"sa-sycophant-ridicule", displayTerm:"chamcha", language:"Hindi · Urdu · Gujarati · code-mixed",
    roman:"chamcha(?:s|giri)?", scripts:["चमचा","چمچہ","ચમચો"], mechanism:"personal_ridicule",
    targetedOutcome:"warning", untargetedOutcome:"clean",
    rationale:"Used as a label for a person, the word ridicules them as a sycophant instead of engaging with their position.",
    rewrite:"I think that support is excessive, but I want to address the position rather than insult the person.",
    safeExample:"Pass me a chamcha from the kitchen.",
  },
  {
    id:"sa-silencing", displayTerm:"chup ho", language:"Hindi · Urdu · code-mixed",
    roman:"chup\\s+ho(?:\\s+jao?)?", scripts:["चुप हो","چپ ہو"], mechanism:"dismissal",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"The imperative is used to silence another participant rather than respond to their contribution.",
    rewrite:"I disagree, but I want to respond respectfully rather than silence anyone.",
    safeExample:"The phrase ‘chup ho’ translates as ‘be quiet’.",
  },
  {
    id:"sa-saala", displayTerm:"saala / saali", language:"Hindi · Urdu · Gujarati · code-mixed",
    roman:"saa?l(?:a|i|e|ey)", scripts:["साला","साली","سالہ","سالی","સાલા","સાળી"], mechanism:"personal_degradation",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"Although the literal kinship word can be neutral, it functions as a personal insult in direct or exclamatory use. Literal family-reference and educational contexts remain allowed.",
    rewrite:"I'm frustrated, but I want to address the conduct without insulting the person.",
    safeExample:"My saala (brother-in-law) is visiting this weekend.",
  },
  {
    id:"sa-haraam-saala", displayTerm:"haraam saala", language:"Hindi · Urdu · code-mixed",
    roman:"haraa?m(?:i)?\\s+saa?l(?:a|i|e)", scripts:["हराम साला","हरामी साला","حرام سالہ","હરામ સાલા"], mechanism:"stacked_personal_degradation",
    targetedOutcome:"warning", untargetedOutcome:"warning",
    rationale:"The stacked phrase intensifies a character/legitimacy insult. It receives intervention and a non-degrading rewrite.",
    rewrite:"I strongly disagree with the conduct, but I want to criticise it without degrading the person.",
    safeExample:"The moderator is reviewing the phrase ‘haraam saala’.",
  },
];

const ROMAN_TARGET = /\b(?:you|u|your|youre|you\s+re|tu|tum|tujhe|tera|teri|tame|he|she|this\s+(?:player|athlete|fan)|that\s+(?:player|athlete|fan)|@[a-z0-9_.-]+)\b/;
const SCRIPT_TARGET = /(?:तू|तुम|तुझे|तेरा|तेरी|તું|તમે|તારો|તારી|تم|آپ|وہ|@)/u;
const EDUCATIONAL = /\b(?:mean|means|meaning|translate|translates|translated|translation|definition|dictionary|term|word|spelling|misspelling|quoted?|paper|dataset|moderator|analyse|analyzes?|analyze|discuss(?:es|ed|ing)?|literal|brother[ -]in[ -]law|sister[ -]in[ -]law|kinship)\b/;

function containsTerm(rule, norm, original) {
  return new RegExp(`\\b(?:${rule.roman})\\b`).test(norm) || rule.scripts.some((term) => original.includes(term));
}

function isTargeted(rule, norm, original) {
  const roman = new RegExp(`(?:${ROMAN_TARGET.source})[^.!?]{0,45}\\b(?:${rule.roman})\\b|\\b(?:${rule.roman})\\b[^.!?]{0,45}(?:${ROMAN_TARGET.source})`);
  return roman.test(norm) || (rule.scripts.some((term) => original.includes(term)) && SCRIPT_TARGET.test(original));
}

export function moderateMultilingualAbuse(norm, original) {
  const rule = MULTILINGUAL_ABUSE_RULES.find((candidate) => candidate.id === "sa-haraam-saala" && containsTerm(candidate, norm, original)) ||
    MULTILINGUAL_ABUSE_RULES.find((candidate) => containsTerm(candidate, norm, original));
  if (!rule || EDUCATIONAL.test(norm)) return null;
  const targeted = isTargeted(rule, norm, original);
  const outcome = targeted ? rule.targetedOutcome : rule.untargetedOutcome;
  if (outcome === "clean") return null;
  return {
    outcome,
    category: rule.mechanism,
    reason: targeted ? "Targeted multilingual abuse" : "Multilingual profanity / abusive language",
    rewriteSuggestion: outcome === "block" ? undefined : rule.rewrite,
    multilingualRule: rule.id,
    policyRationale: rule.rationale,
  };
}
