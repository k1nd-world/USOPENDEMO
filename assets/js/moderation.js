// assets/js/moderation.js
import { moderateEmergingLanguage } from "./emergingLanguage.js?v=4.24.1.0";
import { moderateMultilingualAbuse } from "./multilingualAbuse.js?v=4.24.1.0";
import { getLanguageCoverage } from "./languageCoverage.js?v=4.24.1.0";
import { moderatePolishAbuse } from "./polishAbuse.js?v=4.24.1.0";
import { moderateGlobalRacialSlurs } from "./globalRacialSlurs.js?v=4.24.1.0";
import { refineRewrite } from "./intentRewrite.js?v=4.24.1.0";
import { moderateAustralianAbuse } from "./australianAbuse.js?v=4.24.1.0";
import { moderateCzechBalticAbuse } from "./czechBalticAbuse.js?v=4.24.1.0";
import { moderateWesternEuropeanAbuse } from "./westernEuropeanAbuse.js?v=4.24.1.0";
import { moderatePriorityGlobalAbuse, PRIORITY_GLOBAL_TEST_CASES } from "./priorityGlobalAbuse.js?v=4.24.1.0";
import { moderateNextWaveAbuse, NEXT_WAVE_TEST_CASES } from "./nextWaveAbuse.js?v=4.24.1.0";
import { analyzeContext, applyContextPolicy, finalizeContext } from "./contextIntelligence.js?v=4.24.1.0";
import { moderateUncertainty } from "./uncertaintyGuard.js?v=4.24.1.0";
import { moderateV412LanguageWave, V412_LANGUAGE_TEST_CASES } from "./v412LanguageWave.js?v=4.24.1.0";
import { moderateV412Signals, V412_SIGNAL_TEST_CASES } from "./v412ContextSignals.js?v=4.24.1.0";
import { evaluateRewriteFidelity } from "./rewriteFidelity.js?v=4.24.1.0";
import { analyzeSemanticIntent, applySemanticPolicy, SEMANTIC_INTENT_TEST_CASES } from "./semanticIntent.js?v=4.24.1.0";
// =============================================================================
// K1ND.world — pre-publication moderation engine (Phase 1, pure client-side).
//
//   moderateContent(text) => { outcome, reason, category, rewriteSuggestion? }
//   outcome: "clean" | "warning" | "review" | "block"
//
// This function runs BEFORE any post or comment is written to the store —
// stopping harmful content before publication is the entire point of K1ND.
//   • clean   → allowed as typed.
//   • warning → "Are you sure?" — targeted, aggressive, insulting or borderline.
//               A safer rewrite is offered, generated FROM the user's own text.
//   • review  → borderline/high-risk context. Held from publication and routed
//               to enhanced human moderation unless safely rewritten.
//   • block   → slurs, threats, doxxing/address patterns, discriminatory abuse,
//               racist symbols. Not publishable. No rewrite offered.
//
// NOTE FOR PHASE 2: this rule engine is the seam where a real moderation API
// (called via a Netlify Function) would slot in. The call site in the UI
// (Stage 4) carries the matching `// TODO: replace with real moderation API`.
// =============================================================================

// ---------------------------------------------------------------------------
// Normalisation — lowercase + strip accents + undo common leetspeak so simple
// evasion ("st0opid", "id1ot") still matches. Used only for LEXICAL categories;
// address/postcode detection runs on the ORIGINAL text (it needs the digits).
// ---------------------------------------------------------------------------
function foldBase(text) {
  return String(text || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Common Latin/Cyrillic homoglyphs used to evade lexical moderation.
    .replace(/[аɑ]/g, "a").replace(/[еёε]/g, "e").replace(/[іι|]/g, "i")
    .replace(/[оο]/g, "o").replace(/[сϲ]/g, "c").replace(/[рρ]/g, "p")
    .replace(/[хχ]/g, "x").replace(/[уγ]/g, "y")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/1/g, "i").replace(/3/g, "e").replace(/0/g, "o")
    .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t")
    .replace(/@/g, "a").replace(/\$/g, "s");
}

function normalize(text) {
  return foldBase(text)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Hard-block signals
// ---------------------------------------------------------------------------

// Curated hard-block lexicon. This MVP list covers racial, ethnic,
// religious, homophobic, transphobic and disability-directed slurs plus common
// English-language variants. It is deliberately never displayed back to users.
// Production must replace this with a maintained, localised policy service,
// contextual classifiers, audit/version control and specialist review.
const SLURS = [
  // racial / ethnic
  "nigger", "nigga", "niggah", "niglet", "jigaboo", "sambo", "coon", "koon",
  "golliwog", "darkie", "pickaninny", "chink", "gook", "zipperhead",
  "slanteye", "spic", "wetback", "beaner", "wop", "dago", "guinea",
  "wog", "paki", "gyppo", "pikey", "redskin", "injun", "halfbreed",
  "kaffir", "kafir", "boong", "abo", "abbo", "cholo", "wigger",
  "chingchong", "porchmonkey", "sandnigger",
  // religion / nationality-directed hate
  "kike", "yid", "jewboy", "christkiller", "raghead", "towelhead",
  "muzzie", "hajji", "hadji",
  // sexual orientation / gender identity
  "faggot", "fagot", "poofter", "battyboy", "tranny", "shemale", "heshe",
  // disability-directed abuse
  "retard", "retarded", "mongoloid", "mong", "spastic", "windowlicker",
];
const SLUR_SUFFIX = "(?:s|z|es|a|as|in|ing|er|ers|y|ies|ah|o|os|ez)?";
const SLUR_RE = new RegExp("\\b(?:" + SLURS.join("|") + ")" + SLUR_SUFFIX + "\\b");
const escapeRe = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const SLUR_EVASION_RES = SLURS.map((word) => {
  // Permit punctuation/spacing between letters and repeated letters while
  // preserving a token boundary so benign words such as "snigger" do not hit.
  const body = [...word].map((char) => `${escapeRe(char)}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}${SLUR_SUFFIX}(?=$|[^a-z0-9])`);
});
const SLUR_PHRASES = [
  /\bspear\s*chuck(?:er|ers|ing)?\b/,
  /\bcotton\s*pick(?:er|ers|ing)?\b/,
  /\bcamel\s*jock(?:ey|eys)\b/,
  /\bcurry\s*munch(?:er|ers|ing)?\b/,
  /\bporch\s*monk(?:ey|eys)\b/,
  /\bching\s*chong\b/,
  /\bslant\s*eye(?:d|s)?\b/,
  /\bjew\s*boy\b/,
  /\bchrist\s*killer\b/,
  /\bdirty\s+(?:jew|muslim|arab|immigrant|foreigner)\b/,
  /\bblack\s+monk(?:ey|eys)\b/,
  /\byellow\s+monk(?:ey|eys)\b/,
];
const SLUR_PHRASE_EVASION_TERMS = [
  "spearchucker", "cottonpicker", "cameljockey", "currymuncher",
  "porchmonkey", "chingchong", "slanteye", "jewboy", "christkiller",
];
const SLUR_PHRASE_EVASION_RES = SLUR_PHRASE_EVASION_TERMS.map((term) => {
  const body = [...term].map((char) => `${escapeRe(char)}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`);
});
function containsSlur(original, norm) {
  if (SLUR_RE.test(norm) || SLUR_PHRASES.some((re) => re.test(norm))) return true;
  const folded = foldBase(original);
  const bangAsI = folded.replace(/!/g, "i");
  return [...SLUR_EVASION_RES, ...SLUR_PHRASE_EVASION_RES].some((re) => re.test(folded) || re.test(bangAsI));
}

// Severe targeted misogynistic abuse that the K1ND policy does not permit to
// be published. Kept separate from the hate-slur taxonomy so moderation logs
// use an accurate reason code. Common spacing, punctuation, repeated-letter
// and leetspeak evasions are handled by the same pre-publication guard.
const PROHIBITED_SEVERE_ABUSE = ["cunt", "cunts", "cunting", "cuntface", "cuntbag"];
const PROHIBITED_SEVERE_ABUSE_RE = new RegExp(`\\b(?:${PROHIBITED_SEVERE_ABUSE.join("|")})\\b`);
const PROHIBITED_SEVERE_ABUSE_EVASION_RES = PROHIBITED_SEVERE_ABUSE.map((word) => {
  const body = [...word].map((char) => `${escapeRe(char)}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`);
});
function containsProhibitedSevereAbuse(original, norm) {
  if (PROHIBITED_SEVERE_ABUSE_RE.test(norm)) return true;
  const folded = foldBase(original);
  const bangAsI = folded.replace(/!/g, "i");
  return PROHIBITED_SEVERE_ABUSE_EVASION_RES.some((re) => re.test(folded) || re.test(bangAsI));
}

const NEAR_SEVERE_ABUSE_RE = /(?:^|[^a-z0-9])c+[^a-z0-9]{0,3}u+[^a-z0-9]{0,3}n+(?=$|[^a-z0-9])/;
function containsNearCompleteSevereAbuse(original) {
  return NEAR_SEVERE_ABUSE_RE.test(foldBase(original));
}

// A live guard deliberately stops the final keystroke that would complete a
// hard-block slur. The remaining near-complete fragment must therefore never
// fall through as clean content. These exact-token prefixes are routed to the
// four-choice intervention flow rather than being published.
//
// We include the high-risk four-letter stem used by common variants and all
// one-character-short prefixes of five-or-more-character terms. Exact token
// boundaries avoid substring false positives such as "snigger".
const NEAR_SLUR_PREFIXES = [...new Set([
  "nigg",
  ...SLURS.map((word) => word.slice(0, -1)).filter((prefix) => prefix.length >= 5),
])];
const NEAR_SLUR_EVASION_RES = NEAR_SLUR_PREFIXES.map((prefix) => {
  const body = [...prefix].map((char) => `${escapeRe(char)}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`);
});
function containsNearCompleteSlur(original) {
  const folded = foldBase(original);
  return NEAR_SLUR_EVASION_RES.some((re) => re.test(folded));
}
const NEAR_SLUR_REWRITE = "I want to express my frustration without using hateful or dehumanising language.";

// Emoji and symbol policy. Some symbols are hard-blocked wherever they appear
// because they are commonly used as racist dehumanisation in sport. Others are
// context-gated to avoid blocking ordinary discussion about animals or food.
const PRIMATE_EMOJI = /[\u{1F412}\u{1F435}\u{1F648}\u{1F649}\u{1F64A}\u{1F98D}\u{1F9A7}]/u;
const BANANA_EMOJI = /\u{1F34C}/u;
const DEHUMANISING_EMOJI = /[\u{1F437}\u{1F416}\u{1F400}\u{1F401}\u{1F40D}\u{1FAB3}\u{1F4A9}]/u;
const WEAPON_EMOJI = /[\u{1F52B}\u{1F52A}\u{1F5E1}\u{1F4A3}\u{1FA93}\u{1F9E8}\u{2620}]/u;
const SEXUAL_EMOJI = /[\u{1F346}\u{1F351}\u{1F4A6}\u{1F445}]/u;
const OBSCENE_EMOJI = /\u{1F595}/u;
const TARGET_CONTEXT = /\b(?:you|u|your|yours|he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|woman|girl|boy|man|family|mother|father|child|kid)\b|@[a-z0-9_.-]+/;
const THREAT_CONTEXT = /\b(?:kill|hurt|stab|shoot|attack|bomb|explode|knife|beat|batter|smash|die|dead|find|coming\s+for|watch\s+your\s+back)\b/;
const SEXUAL_CONTEXT = /\b(?:sex|sexy|nude|nudes|naked|body|boobs?|breasts?|tits?|ass|arse|rape|fuck|cum|send|show|leak)\b/;
function detectHardBlockEmoji(original, norm) {
  if (PRIMATE_EMOJI.test(original)) return { category: "racist_symbol", reason: "Racist / dehumanising primate emoji" };
  if (BANANA_EMOJI.test(original) && TARGET_CONTEXT.test(norm)) return { category: "racist_symbol", reason: "Targeted dehumanising emoji" };
  if (DEHUMANISING_EMOJI.test(original) && TARGET_CONTEXT.test(norm)) return { category: "dehumanising_symbol", reason: "Targeted dehumanising emoji" };
  if (WEAPON_EMOJI.test(original) && (TARGET_CONTEXT.test(norm) || THREAT_CONTEXT.test(norm))) return { category: "threat", reason: "Threatening weapon symbol" };
  if (SEXUAL_EMOJI.test(original) && TARGET_CONTEXT.test(norm) && SEXUAL_CONTEXT.test(norm)) return { category: "sexual_abuse", reason: "Targeted sexual harassment symbol" };
  return null;
}

const DEHUMANISING_TEXT = [
  /\b(?:you|he|she|they|that\s+(?:player|athlete|umpire|woman|man))\s+(?:are|is|look(?:s)?\s+like)\s+(?:an?\s+)?(?:ape|monkey|gorilla|pig|rat|cockroach|vermin|animal|subhuman)\b/,
  /\b(?:ape|monkey|gorilla|pig|rat|cockroach|vermin|subhuman)\s+(?:doesnt|does\s+not|dont|do\s+not)\s+belong\b/,
  /\btreat\s+(?:him|her|them)\s+like\s+(?:an?\s+)?(?:animal|vermin)\b/,
];
const HATE_IDEOLOGY = [
  /\bwhite\s+power\b/,
  /\bheil\s+hitler\b/,
  /\bgas\s+the\s+(?:jews|muslims|gays|immigrants)\b/,
  /\b(?:racial|ethnic)\s+purity\b/,
  /\b14\s*88\b/,
];
const HATE_SYMBOL = /[\u5350\u534D]/u;

const THREAT_PATTERNS = [
  /\bi\s*(?:ll|will|m\s+going\s+to|am\s+going\s+to|mma|gonna|would)\s+(?:(?:fucking|bloody|damn|goddamn)\s+)*(?:kill|hurt|batter|beat|beat\s+up|smash|stab|shoot|knife|end|destroy|find|get|choke|strangle|kidnap|abduct|bomb|burn|poison|attack)\s+(?:you|him|her|them|your\s+family|his\s+family|her\s+family|that\s+\w+)\b/,
  /\b(?:kill|hang|neck|off)\s+your\s*self\b/,
  /\bkys\b/,
  /\bhope\s+you\s+(?:die|rot|suffer|burn|choke)\b/,
  /\byou\s*(?:re|are)\s+(?:dead|finished|done\s+for)\b/,
  /\bwatch\s+your\s+back\b/,
  /\bi\s+know\s+where\s+you\s+(?:live|work|train|stay|go\s+to\s+school|are\s+staying)\b/,
  /\bi\s*(?:ll|will|m\s+gonna|am\s+going\s+to)\s+find\s+(?:you|your\s+family|your\s+hotel)\b/,
  /\b(?:you|u|he|she|they)\s+(?:should|deserve\s+to|need\s+to|ought\s+to|oughta)\s+(?:die|rot|suffer|burn|be\s+dead|be\s+shot|be\s+beaten|be\s+stabbed)\b/,
  /\b(?:drop\s+dead|die\s+in\s+a\s+fire|go\s+die|go\s+kill\s+your\s*self|slit\s+your\s+wrists)\b/,
  /\b(?:beat|batter|smash|do|rough)\s+(?:you|him|her|them)\s+up\b/,
  /\bgonna\s+(?:get|end|batter|do|hurt|stab|shoot)\s+(?:you|him|her|them)\b/,
  /\b(?:acid|petrol)\s+(?:attack|in\s+your\s+face)\b/,
  /\b(?:bomb|burn|blow\s+up|set\s+fire\s+to)\s+(?:your|his|her|their)\s+(?:house|home|car|hotel)\b/,
  /\b(?:coming|waiting)\s+(?:for\s+you|outside\s+your\s+(?:house|hotel|school|training))\b/,
  /\b(?:your|his|her|their)\s+(?:family|kids?|children|parents?|partner)\s+(?:will|are\s+going\s+to)\s+(?:pay|suffer|get\s+hurt)\b/,

];

// Competitive language can sound violent without being a real-world threat.
// Keep a narrow exception for explicit sporting contexts; real threats outside
// that context remain hard blocks.
const COMPETITIVE_HYPERBOLE = [
  /\bi\s*(?:ll|will|m\s+going\s+to|am\s+going\s+to|gonna)\s+destroy\s+you\s+(?:in|during|on)\s+(?:the\s+)?(?:final|match|game|set|race|competition|court|pitch|field|ring)\b/,
  /\bwe\s*(?:ll|will|re\s+going\s+to|are\s+going\s+to|gonna)\s+destroy\s+(?:you|them)\s+(?:in|during|on)\s+(?:the\s+)?(?:final|match|game|set|race|competition|court|pitch|field|ring)\b/,
];

// Direct encouragement of suicide or self-harm is its own hard-block category,
// not a generic attacker-threat signal. The evasion forms accept joined words,
// punctuation/emoji spacing, repeated letters and the same narrow leetspeak
// folding used by the rest of the policy engine.
const SELF_HARM_ENCOURAGEMENT_PATTERNS = [
  /\b(?:kill|hang|neck|unalive|off)\s+your\s*self\b/,
  /\b(?:go\s+)?kill\s+your\s*self\b/,
  /\b(?:go\s+die|slit\s+your\s+wrists|end\s+your\s+life)\b/,
  /\bkys\b/,
];
const SELF_HARM_EVASION_TERMS = [
  "killyourself", "gokillyourself", "unaliveyourself", "neckyourself",
  "offyourself", "hangyourself", "slityourwrists", "endyourlife", "godie", "kys",
];
const SELF_HARM_EVASION_RES = SELF_HARM_EVASION_TERMS.map((term) => {
  const body = [...term].map((char) => `${escapeRe(char)}+`).join("[^a-z0-9]{0,12}");
  return new RegExp(`(?:^|[^a-z0-9])${body}(?=$|[^a-z0-9])`);
});
function containsSelfHarmEncouragement(original, norm) {
  if (SELF_HARM_ENCOURAGEMENT_PATTERNS.some((re) => re.test(norm))) return true;
  const folded = foldBase(original);
  return SELF_HARM_EVASION_RES.some((re) => re.test(folded));
}

// Explicit sexual threats, coercion and non-consensual intimate-image abuse are
// immediate hard blocks rather than warnings or rewrites.
const SEXUAL_ABUSE_PATTERNS = [
  /\b(?:i\s*(?:ll|will|m\s+going\s+to|am\s+going\s+to|gonna)\s+)?(?:rape|sexually\s+assault|molest)\s+(?:you|her|him|them)\b/,
  /\bforce\s+(?:myself|himself|herself)\s+on\s+(?:you|her|him|them)\b/,
  /\b(?:send|show|dm)\s+(?:me\s+)?(?:your\s+)?(?:nudes|naked\s+(?:pics|photos)|intimate\s+(?:pics|photos))\b/,
  /\b(?:leak|post|share|publish)\s+(?:your|her|his|their)\s+(?:nudes|intimate\s+(?:pics|photos|images)|sex\s+tape)\b/,
  /\b(?:i\s+have|got)\s+(?:your|her|his|their)\s+(?:nudes|intimate\s+(?:pics|photos|images))\b/,
  /\b(?:strip|take\s+your\s+clothes\s+off)\s+(?:for\s+me|now)\b/,
  /\b(?:i\s+want\s+to|i\s*(?:ll|will)|gonna)\s+fuck\s+(?:you|her|him)\b/,
  /\b(?:hope|wish|want)\s+(?:someone|somebody|they)\s+(?:rapes?|sexually\s+assaults?)\s+(?:you|her|him|them)\b/,
  /\b(?:you|she|he|they)\s+(?:deserve|deserves|should)\s+(?:to\s+be\s+)?(?:raped|sexually\s+assaulted)\b/,
  /\b(?:go\s+)?get\s+raped\b/,
];

// Wishing death, illness, injury or disaster on a PERSON or group — blocked.
// Deliberately distinguishes harm from ordinary sporting defeat: "hope Norway
// lose / get knocked out / get relegated" is fine; "hope their plane crashes"
// or "hope the umpire gets cancer" is not.
const HARM_WORDS =
  "die|dies|died|dead|death|cancer|tumou?r|terminal|aids|leukaemia|leukemia|" +
  "ill|sick|suffer|suffers|rot|rots|burn|burns|drown|drowns|choke|chokes|" +
  "starve|paralysed|paralyzed|coma|killed|murdered|slaughtered|stabbed|shot|" +
  "hospitalised|hospitalized|injured|maimed|crippled|crash|crashes|crashed|" +
  "explode|explodes|beaten\\s+up|beat\\s+up|hit\\s+by\\s+a?\\s*(?:bus|car|train|truck)|" +
  "run\\s+over|break\\s+(?:your|his|her|their)\\s+(?:neck|legs?|arms?|back|spine)|" +
  "end\\s+up\\s+(?:in\\s+)?(?:a\\s+)?(?:coffin|grave|wheelchair|hospital|morgue|icu)";
const WISH_HARM = new RegExp(
  "\\b(?:hope|hoping|wish|wishing|pray|praying|prays|hopin)\\b[^.!?]{0,60}?\\b(?:" + HARM_WORDS + ")\\b",
  "i"
);
const HARM_DIRECT = new RegExp(
  "\\b(?:you|u|he|she|they|yous)\\s+(?:get|gets|catch|deserve|deserves|caught|should\\s+get)\\s+(?:cancer|aids|ill|sick|hurt|hospitalised|hospitalized|beaten\\s+up)\\b",
  "i"
);

// Discriminatory abuse (identity-based). Apostrophes are stripped by normalize.
const DISCRIMINATORY = [
  /\bgo\s+back\s+to\s+(?:where\s+you\s+came\s+from|your\s+(?:own\s+)?country|your\s+own\s+country)\b/,
  /\byou\s+dont\s+belong\s+(?:here|in\s+this\s+(?:country|sport|team|tour))\b/,
  /\bwe\s+dont\s+want\s+(?:your\s+kind|people\s+like\s+you)\b/,
  /\bgo\s+home\s+(?:you\s+)?(?:immigrant|foreigner|refugee)s?\b/,
  /\bgo\s+back\s+to\s+the\s+kitchen\b/,
  /\bwomen\s+(?:belong|should\s+stay)\s+in\s+the\s+kitchen\b/,
  /\bwomen\s+are\s+only\s+good\s+for\s+(?:cooking|cleaning|sex)\b/,
  /\bwomen\s+(?:cant|cannot|shouldnt|should\s+not)\s+(?:play|compete|be\s+in|officiate)\b/,
  /\b(?:girls|women)\s+dont\s+belong\s+in\s+(?:sport|tennis|football|coaching|management)\b/,
  /\b(?:gay|trans|disabled|black|asian|muslim|jewish)\s+(?:people|players|athletes|women|men)\s+(?:dont|do\s+not|shouldnt|should\s+not)\s+belong\b/,
  /\b(?:all|every)\s+(?:black|asian|muslim|jewish|gay|trans|disabled)\s+(?:people|players|athletes|men|women)\s+(?:are|should\s+be)\s+(?:banned|removed|deported|excluded)\b/,
  /\b(?:keep|ban|remove)\s+(?:black|asian|muslim|jewish|gay|trans|disabled)\s+(?:people|players|athletes|men|women)\s+(?:out|from)\b/,
  /\b(?:being|because\s+youre|because\s+you\s+are)\s+(?:gay|trans|black|asian|muslim|jewish|disabled)\s+(?:is\s+)?(?:disgusting|wrong|a\s+disease)\b/,
];

// Doxxing / address — run on ORIGINAL text.
const STREET = /\b(?:flat|apartment|apt|unit|suite)?\s*#?\s*\d{1,5}[A-Za-z]?\s+(?:[A-Za-z][A-Za-z.'-]*\s+){0,4}(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|court|ct|way|close|crescent|cres|terrace|place|pl|row|gardens|grove|mews|square|parade|walk)\b\.?/i;
const UK_POSTCODE = /\b(?:GIR\s*0AA|[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i;
const PO_BOX = /\bP\.?\s*O\.?\s*Box\s+\d{1,6}\b/i;
const FLAT_BUILDING = /\b(?:flat|apartment|apt|unit)\s+#?\d{1,5}[A-Za-z]?\s*,?\s+[A-Za-z][A-Za-z' -]{1,40}(?:house|court|tower|building|mansions|apartments)\b/i;
const COORDINATES = /(?:^|\s)[+-]?(?:90(?:\.0+)?|[1-8]?\d(?:\.\d{3,})?)\s*[,;]\s*[+-]?(?:180(?:\.0+)?|(?:1[0-7]\d|[1-9]?\d)(?:\.\d{3,})?)(?:$|\s)/;
const HOTEL_ROOM = /\b(?:(?:room|suite)\s+\d{1,4}\s+(?:at|in)|(?:staying|checked\s+in)\s+at)\s+(?:the\s+)?[A-Za-z][A-Za-z' -]{1,40}(?:hotel|resort|inn)\b/i;
const DOX_PHRASE = /\b(?:lives?\s+at|your\s+address\s+is|home\s+address|i\s+know\s+where\s+you\s+live|here'?s?\s+(?:his|her|their|your)\s+address|posting\s+(?:his|her|their|your)\s+address|send\s+it\s+to\s+(?:his|her|their|your)\s+house)\b/i;
const SCHOOL_OR_TRAINING = /\b(?:trains?|training|practises?|practices?|goes?\s+to\s+school|children?\s+attend)\s+(?:at|in)\s+(?:the\s+)?[A-Za-z][A-Za-z' -]{2,50}(?:school|academy|club|centre|center|gym|courts?)\b/i;
const TRAVEL_DETAIL = /\b(?:flight|train)\s+(?:number\s+)?[A-Z]{1,3}\s?\d{2,4}\b|\b(?:arrives?|lands?|departs?|leaves?)\s+(?:at|from)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i;
const EMAIL_ADDRESS = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const PHONE_CONTEXT = /\b(?:call|phone|mobile|telephone|tel|text|sms|whats?app|facetime|signal|contact|number|ring|reach\s+(?:me|him|her|them))\b/i;
function containsPhoneNumber(original) {
  const candidates = String(original).match(/(?:\+?\d[\d\s().-]{6,}\d)/g) || [];
  return candidates.some((candidate) => {
    const compact = candidate.trim();
    const digits = compact.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) return false;
    if (compact.startsWith("+") && digits.length >= 8) return true;
    if (/^0/.test(compact) && (digits.length === 10 || digits.length === 11)) return true;
    if (/^(?:\(?\d{3}\)?[\s.-])\d{3}[\s.-]\d{4}$/.test(compact)) return true;
    // Global grouped numbers: three or more digit groups, 10-15 digits total.
    // This avoids treating dates or match scores as telephone numbers.
    const groups = compact.replace(/^\+/, "").split(/[\s().-]+/).filter(Boolean);
    if (digits.length >= 10 && groups.length >= 2 && groups.every((g) => /^\d{2,6}$/.test(g))) return true;
    return PHONE_CONTEXT.test(original) && digits.length >= 7;
  });
}

function containsAddressOrLocation(original) {
  return STREET.test(original) || UK_POSTCODE.test(original) || PO_BOX.test(original) ||
    FLAT_BUILDING.test(original) || COORDINATES.test(original) || HOTEL_ROOM.test(original) ||
    DOX_PHRASE.test(original) || SCHOOL_OR_TRAINING.test(original) || TRAVEL_DETAIL.test(original);
}
function containsPersonalContact(original) {
  return containsPhoneNumber(original) || EMAIL_ADDRESS.test(original);
}

// ---------------------------------------------------------------------------
// Warning signals
// ---------------------------------------------------------------------------
const INSULTS = [
  "stupid", "idiot", "idiotic", "moron", "moronic", "dumb", "useless", "pathetic",
  "hopeless", "clueless", "brainless", "clown", "loser", "trash", "garbage",
  "rubbish", "disgrace", "embarrassing", "embarrassment", "awful", "terrible",
  "worst", "shocking", "dreadful", "joke", "washed up", "overrated", "bum",
  "muppet", "numpty", "donkey", "fraud", "cheat", "corrupt", "spineless",
  "gutless", "coward", "shameful", "disgraceful",
];
const PROFANITY = [
  "shit", "shite", "shitty", "bullshit", "crap", "crappy", "piss", "pissed",
  "arse", "arsehole", "ass", "asshole", "jackass", "dumbass", "smartass",
  "damn", "goddamn", "bastard", "bugger", "bollocks", "prick", "dick",
  "dickhead", "cock", "knob", "knobhead", "wanker", "tosser", "twat", "bellend",
  "git", "douche", "douchebag", "jerk", "freaking", "frigging", "fuck",
  "fucking", "fucker", "fucked", "motherfucker", "fuckwit", "wtf", "stfu",
  "bitch", "bitches", "slag", "skank", "hoe", "whore", "slut", "screw",
];
// Profanity is not itself an abuse mechanism. These two groups let the engine
// distinguish an expressive expletive ("what a fucking shot") from a label or
// command aimed at a person ("you fuckwit" / "fuck off").
const EXPRESSIVE_PROFANITY = [
  "shit", "shite", "shitty", "bullshit", "crap", "crappy", "piss", "pissed",
  "damn", "goddamn", "bollocks", "bugger", "freaking", "frigging", "fuck",
  "fucking", "fucked", "wtf",
];
const PERSONAL_PROFANITY_LABELS = [
  "arse", "ass", "arsehole", "asshole", "jackass", "dumbass", "smartass", "bastard", "prick",
  "dick", "dickhead", "cock", "knob", "knobhead", "wanker", "tosser", "twat",
  "bellend", "git", "douche", "douchebag", "jerk", "motherfucker", "fucker",
  "fuckwit", "stfu", "bitch", "bitches", "slag", "skank", "hoe", "whore", "slut",
];
const DIRECTED_PROFANITY_PATTERNS = [
  /\b(?:fuck|screw)\s+(?:you|u|him|her|them|that\s+player|this\s+player|the\s+player|that\s+umpire|the\s+umpire|that\s+referee|the\s+referee|@[a-z0-9_.-]+)\b/,
  /\b(?:fuck|fucking|piss)\s+off\b/,
  /\b(?:go\s+)?fuck\s+yourself\b/,
  /\b(?:shut\s+(?:the\s+)?fuck\s+up|shut\s+up|stfu)\b/,
  /\b(?:you|u|he|him|she|her|they|them|player|athlete|umpire|referee|coach|fan)\b[^.!?]{0,18}\bfucking\s+(?:idiot|clown|moron|loser|fool|useless|pathetic|hopeless|fuckwit|asshole)\b/,
];
const AGGRO = [
  /\bnever\s+(?:play|compete|coach|officiate)(?:\s+[a-z]+){0,3}\s+again\b/,
  /\bretire\s+already\b/, /\bjust\s+retire\b/,
  /\bgive\s+up\b/, /\bshould\s+be\s+ashamed\b/, /\bpack\s+it\s+in\b/,
  /\bhang\s+up\s+(?:your\s+)?(?:boots|racket)\b/, /\bquit\s+the\s+sport\b/,
  /\bjust\s+disappear\b/, /\bgo\s+away\s+forever\b/,
  /\bbottled\s+it\b/,
  /\b(?:umpire|referee|official|linesperson)\s+(?:is|was|are|were)\s+blind\b/,
];

// Targeted abuse that is not always captured by a simple insult lexicon.
// These trigger the Are-you-sure intervention rather than being silently
// published. Contextual patterns reduce false positives for ordinary words.
const PERSONAL_ABUSE_PATTERNS = [
  /\byou\s+suck\b/,
  /\byou\s+(?:are|re)\s+(?:absolutely\s+|completely\s+|totally\s+|really\s+)?(?:worthless|scum|disgusting|repulsive|vile|nothing)\b/,
  /\bnobody\s+(?:wants|likes)\s+you\s+(?:here|around)\b/,
  /\bgo\s+cry\s+to\s+(?:your\s+)?(?:mum|mom|mother|dad|daddy|parents?)\b/,
  /\byou\s+(?:are|re)\s+(?:mentally|emotionally)\s+weak\b/,
  /\b(?:fat|ugly)\s+(?:cow|pig|slob)\b/,
  /\b(?:fat|ugly|hideous)\s+(?:bitch|slag|skank|whore|slut)\b/,
  /\byou\s+(?:look|are|re)\s+(?:so\s+|really\s+)?(?:fat|ugly|hideous)\b/,
  /\bpiece\s+of\s+(?:shit|trash|garbage)\b/,
  /\bchoke\s+artist\b/,
  /\byour\s+family\s+must\s+be\s+proud\s+of\s+(?:that|this)\s+(?:garbage|trash|rubbish|shit)\b/,
];

// Borderline / high-risk signals. These are not auto-published even after a
// warning because context, intent or truthfulness needs a human decision.
const COORDINATED_HARASSMENT = [
  /\b(?:everyone|everybody|all\s+(?:of\s+)?you|fans?)\s+(?:go\s+)?(?:message|dm|spam|target|attack|pile\s+on|go\s+after)\b/,
  /\b(?:spam|target|attack|message|dm|go\s+after)\s+(?:his|her|their|the)\s+(?:account|family|partner|parents?|children|kids)\b/,
  /\bmake\s+(?:his|her|their)\s+(?:life|inbox)\s+(?:hell|miserable)\b/,
];
const GAMBLING_ATTACK = [
  /\b(?:you|u|he|she|they)\s+(?:lost|ruined|busted|killed)\s+(?:my|the)\s+(?:bet|acca|parlay|wager)\b/,
  /\b(?:lost|ruined|busted|killed)\s+(?:my|the)\s+(?:bet|acca|parlay|wager)\s+(?:because\s+of|cos\s+of|thanks\s+to)\s+(?:you|him|her|them)\b/,
  /\b(?:you|u|he|she|they)\s+(?:owe|owes)\s+me\s+(?:money|cash|\d+)\b/,
  /\bcost\s+me\s+(?:£|\$|€)?\s*\d+\b/,
];
const INTEGRITY_ALLEGATION = [
  /\b(?:fixed|fixing|threw|throwing|rigged|rigging)\s+(?:the|that|this|a)?\s*(?:match|game|set|point)\b/,
  /\b(?:decision|call|line\s+call|result|match|game|set|point)\s+(?:looked|was|is|seems?)\s+(?:fixed|rigged|corrupt)\b/,
  /\bmatch\s*fixer\b/,
  /\b(?:took|taking|accepted)\s+(?:a\s+)?bribe\b/,
  /\bpaid\s+to\s+(?:lose|throw|tank)\b/,
  /\b(?:umpire|referee|official|judge)\s+(?:took|accepted|was\s+paid|got)\s+(?:money|cash|a\s+bribe)\b/,
  /\b(?:bought|paid\s+off|bribed)\s+(?:the\s+)?(?:umpire|referee|official|judge)\b/,
];

// Serious criminal, safeguarding or doping allegations should not be stated as
// fact without evidence. They are held for enhanced moderation rather than
// auto-published, while good-faith discussion can be rewritten more carefully.
const SERIOUS_ALLEGATION = [
  /\b(?:that|this|the)\s+(?:player|athlete|coach|official|referee|umpire|person|man|woman|guy|girl)\s+(?:is|s|was)\s+(?:a\s+)?(?:paedophile|pedophile|rapist|murderer|abuser|sexual\s+predator|thief|criminal)\b/,
  /\b(?:he|she|they)\s+(?:is|s|are|was|were)\s+(?:a\s+)?(?:paedophile|pedophile|nonce|rapist|murderer|abuser|sexual\s+predator)\b/,
  /\b(?:that|this|the)\s+(?:player|athlete|coach|official|referee|umpire|person)\s+(?:is|s|was)\s+(?:a\s+)?(?:cheat|drug\s+cheat|racist|sexist|homophobe)\b/,
  /\b(?:he|she|they)\s+(?:is|s|are|was|were)\s+(?:a\s+)?(?:cheat|drug\s+cheat|racist|sexist|homophobe)\b/,
  /\b(?:that|this|the)\s+(?:player|athlete)\s+cheated\b/,
  /\b(?:that|this|the)\s+(?:player|athlete|team|competitor)\s+(?:is|s|was)\s+(?:doping|on\s+steroids|on\s+drugs|using\s+(?:steroids|peds?|performance\s+enhancing\s+drugs))\b/,
  /\b(?:he|she|they)\s+(?:is|s|are|was|were)\s+(?:doping|on\s+steroids|using\s+(?:steroids|peds?|performance\s+enhancing\s+drugs))\b/,
  /\b(?:failed|faked)\s+(?:a\s+)?drug\s+test\b/,
];

function review(category, reason, rewriteSuggestion) {
  return { outcome: "review", category, reason, rewriteSuggestion };
}
function reviewRewrite(category) {
  const map = {
    coordinated_harassment: "I strongly disagree, but I won't encourage anyone to target the player or their family.",
    gambling_attack: "I'm frustrated by the result, but the player is not responsible for my betting losses.",
    integrity_allegation: "That performance raised questions for me, but I don't have evidence of wrongdoing.",
    serious_allegation: "I have a serious concern, but I should not present an unverified allegation as fact.",
  };
  return map[category] || "I want to make this point without targeting or accusing anyone unfairly.";
}

function wordHit(list, norm) {
  return list.find((w) => new RegExp(`\\b${w.replace(/\s+/g, "\\s+")}\\b`).test(norm));
}

function classifyProfanityFunction(norm) {
  const term = wordHit(PROFANITY, norm);
  if (!term) return null;
  const directed = DIRECTED_PROFANITY_PATTERNS.some((pattern) => pattern.test(norm));
  const personalLabel = wordHit(PERSONAL_PROFANITY_LABELS, norm);
  if (directed) {
    return { present:true, term, id:"directed_hostility", label:"person-directed profanity or dismissal", targeted:true, abusive:true };
  }
  if (personalLabel) {
    return { present:true, term:personalLabel, id:"personal_label", label:"profane personal label", targeted:/\b(?:you|u|he|him|she|her|they|them|player|athlete|umpire|referee|coach|fan)\b/.test(norm), abusive:true };
  }
  const praise = /\b(?:great|brilliant(?:ly)?|amazing(?:ly)?|incredible|fantastic(?:ally)?|beautiful(?:ly)?|stunning|unbelievable|excellent|magnificent|perfect(?:ly)?|awesome|sensational|quality|love|loved)\b/.test(norm);
  const sport = /\b(?:performance|match|game|set|result|decision|call|shot|serve|return|rally|point|forehand|backhand|volley|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|goal|save|team|final|tournament)\b/.test(norm);
  if (praise) {
    return { present:true, term, id:"positive_intensifier", label:"positive emotional intensifier", targeted:false, abusive:false };
  }
  if (sport) {
    return { present:true, term, id:"sporting_emphasis", label:"emphatic sporting reaction", targeted:false, abusive:false };
  }
  if (wordHit(EXPRESSIVE_PROFANITY, norm)) {
    return { present:true, term, id:"untargeted_exclamation", label:"untargeted exclamation or intensifier", targeted:false, abusive:false };
  }
  return { present:true, term, id:"ambiguous_profanity", label:"ambiguous strong language", targeted:false, abusive:true };
}

// ===========================================================================
// Rewrite generator — transforms the user's OWN text into a constructive
// version. Ordered passes: specific subject-preserving rewrites first, then
// generic softening. It never returns an unrelated canned positive message.
// ===========================================================================
const SOFTEN = {
  stupid: "poor", idiotic: "poor", dumb: "poor", brainless: "rushed",
  useless: "disappointing", pathetic: "disappointing", hopeless: "off the pace",
  clueless: "not convincing", awful: "poor", shocking: "poor", dreadful: "poor",
  terrible: "below-par", worst: "toughest", embarrassing: "disappointing",
  disgraceful: "disappointing", shameful: "disappointing", spineless: "hesitant",
  gutless: "hesitant", rubbish: "below-par", garbage: "below-par",
  trash: "below-par", overrated: "not at their best", "washed up": "past their best",
  shit: "poor", shite: "poor", shitty: "poor", crap: "poor", crappy: "poor",
  bullshit: "not convincing",
};
const REMOVE_NOUNS = /\b(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum|coward|disgrace|fraud|cheat)\b/gi;
const REMOVE_PROF = new RegExp(`\\b(?:${PROFANITY.join("|")})\\b`, "gi");

function tidy(s) {
  let out = s
    .replace(/\s+/g, " ")
    .replace(/\s*—\s*/g, " — ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/,\s*,/g, ",")
    .replace(/^[\s,;:–-]+/, "")
    .replace(/\s{2,}/g, " ")
    .trim();
  out = out.replace(/\bi\b/g, "I");
  if (out) out = out[0].toUpperCase() + out.slice(1);
  if (out && !/[.!?]$/.test(out)) out += ".";
  return out;
}

function rewriteDirectProfanity(original, norm) {
  const decisionContext = /\b(?:umpire|referee|official|linesperson|line\s+call|decision|call)\b/.test(norm);
  const sportContext = /\b(?:match|performance|played|player|serve|return|shot|set|game|result|team|tournament|final)\b/.test(norm);

  // Phrase-level handling must happen before individual profanity words are
  // removed. Otherwise phrases such as "fuck off" collapse into fragments.
  // The rewrite keeps the underlying point while removing the personal attack.
  if (/\b(?:shut\s+(?:the\s+)?fuck\s+up|shut\s+up|stfu)\b/.test(norm)) {
    return "Please stop. I want to keep this respectful.";
  }
  if (/\b(?:fuck|fucking|piss)\s+off\b/.test(norm) || /\b(?:go\s+)?fuck\s+yourself\b/.test(norm)) {
    if (decisionContext) return "I strongly disagree with that decision, but I want to keep the criticism respectful.";
    if (sportContext) return "I'm frustrated by the performance, but I want to keep the criticism about the sport.";
    return "Please leave me alone.";
  }
  if (/\b(?:fuck|screw)\s+(?:you|u)\b/.test(norm)) {
    if (decisionContext) return "I strongly disagree with that decision, but I want to keep the criticism respectful.";
    if (sportContext) return "I'm frustrated by the performance, but I want to keep the criticism about the sport.";
    return "I'm frustrated, but I want to express that without attacking anyone.";
  }
  if (/^what\s+the\s+fuck[.!?]*$/.test(norm)) {
    return "What happened there?";
  }
  const whatTheFuckSubject = norm.match(/^what\s+the\s+fuck\s+was\s+(?:that|the)\s+(.+)$/);
  if (whatTheFuckSubject) {
    return `What happened with that ${whatTheFuckSubject[1]}?`;
  }
  if (/\b(?:this|that)\s+(?:match|performance|game|set|result)\s+(?:is|was)\s+fucking\s+(?:terrible|awful|shit|shite|crap|rubbish)\b/.test(norm)) {
    const tense = /\bwas\b/.test(norm) ? "was" : "has been";
    const subject = /\bthat\b/.test(norm) ? "That" : "This";
    return `${subject} ${/match/.test(norm) ? "match" : /performance/.test(norm) ? "performance" : /game/.test(norm) ? "game" : /set/.test(norm) ? "set" : "result"} ${tense} very disappointing.`;
  }
  return null;
}

function suggestRewrite(original) {
  const direct = original.trim();
  const directNorm = normalize(direct);

  // Key compound sports-abuse demo: preserve the underlying performance point
  // even when body abuse, "bottled it" and dismissive profanity are combined.
  if (/\b(?:fat|ugly)\s+(?:cow|pig|slob)\b/.test(directNorm) && /\bbottled\s+it\b/.test(directNorm)) {
    return "That was a disappointing performance and they seemed to lose confidence at a key moment.";
  }
  if (/\byou\s+(?:were|are|re)\s+(?:useless|hopeless|pathetic)\b/.test(directNorm) && /\bbottled\s+it\b/.test(directNorm)) {
    return "That was a disappointing performance and they seemed to lose confidence at a key moment.";
  }

  const directProfanityRewrite = rewriteDirectProfanity(direct, directNorm);
  if (directProfanityRewrite) return directProfanityRewrite;

  // Preserve harsh criticism of the sporting action while removing a trailing
  // personal insult. This is a core K1ND distinction: "terrible pass" can stay;
  // "you idiot" cannot.
  if (/\b(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop)\b/i.test(direct) &&
      /,?\s*you\s+(?:are\s+|were\s+)?(?:an?\s+)?(?:idiot|moron|clown|loser|muppet|numpty|donkey|coward)\b/i.test(direct)) {
    const kept = direct.replace(/,?\s*you\s+(?:are\s+|were\s+)?(?:an?\s+)?(?:idiot|moron|clown|loser|muppet|numpty|donkey|coward)\b.*$/i, "");
    return tidy(kept);
  }

  // High-frequency adversarial abuse patterns need semantic rewrites rather
  // than word deletion, which can create broken or nonsensical sentences.
  if (/\bpiece\s+of\s+(?:shit|trash|garbage)\b/i.test(direct)) {
    return "I'm very frustrated, but I want to express that without attacking anyone.";
  }
  if (/\byour\s+family\s+must\s+be\s+proud\s+of\s+(?:that|this)\s+(?:garbage|trash|rubbish|shit)\b/i.test(direct)) {
    return "That was disappointing, but I want to keep the criticism focused on the performance.";
  }
  if (/\bwhat\s+a\s+(?:fucking\s+)?choke\s+artist\b/i.test(direct)) {
    return "They seemed to lose confidence at a key moment.";
  }
  if (/^\s*you\s+suck[.!?]*\s*$/i.test(direct)) {
    return "I don't think that was good enough.";
  }
  if (/\byou\s+(?:are|re)\s+(?:absolutely\s+|completely\s+|totally\s+|really\s+)?(?:worthless|scum|disgusting|repulsive|vile|nothing)\b/.test(directNorm)) {
    return "I'm very frustrated, but I want to express that without attacking anyone.";
  }
  if (/\bnobody\s+(?:wants|likes)\s+you\s+(?:here|around)\b/i.test(direct)) {
    return "I don't think this is working, but I want to keep the criticism respectful.";
  }
  if (/\bgo\s+cry\s+to\s+(?:your\s+)?(?:mum|mom|mother|dad|daddy|parents?)\b/i.test(direct)) {
    return "I disagree, but I want to keep this respectful.";
  }
  if (/\byou\s+(?:are|re)\s+(?:mentally|emotionally)\s+weak\b/.test(directNorm)) {
    return "They seemed to lose confidence under pressure.";
  }
  if (/\b(?:fat|ugly)\s+(?:cow|pig|slob)\b|\b(?:fat|ugly|hideous)\s+(?:bitch|slag|skank|whore|slut)\b|\byou\s+(?:look|are|re)\s+(?:so\s+|really\s+)?(?:fat|ugly|hideous)\b/.test(directNorm)) {
    return "I want to keep the criticism focused on the performance, not someone's appearance.";
  }

  // Canonical live-demo case: keep the underlying match opinion while removing
  // the personal degradation and disappearance language completely.
  if (/you\s+(?:are|re)\s+(?:a\s+)?complete\s+disgrace[.!?\s]+choking\s+again[.!?\s]+just\s+disappear/i.test(direct)) {
    return "That was a very disappointing performance. She seemed to lose confidence at the key moments.";
  }

  // Common personal attacks are rewritten semantically rather than by deleting
  // the insult noun. This prevents broken outputs such as "You are such an."
  const insultWithContrast = direct.match(/^\s*you\s+(?:are|re|were)\s+(?:such\s+an?|an?|the|a\s+total|a\s+complete|an\s+absolute|a\s+complete|a\s+total)?\s*(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum|coward)\s*(,?\s+but\s+.+)$/i);
  if (insultWithContrast) {
    const contrast = tidy(insultWithContrast[1].replace(/^,?\s*/, ""));
    return `I disagree with you, ${contrast[0].toLowerCase()}${contrast.slice(1)}`;
  }
  if (/\byou\s+(?:are|re|were)\s+(?:such\s+an?|an?|the|a\s+total|a\s+complete|an\s+absolute|a\s+complete|a\s+total)?\s*(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum|coward)\b/i.test(direct)) {
    return "I disagree with you, but I want to express that respectfully.";
  }
  if (/\byou\s+(?:played|looked)\s+like\s+(?:an?\s+)?(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum)\b/i.test(direct)) {
    return "That was a disappointing performance, but I want to keep the criticism about the sport.";
  }
  if (/\byou\s+(?:are|re|were)\s+(?:a\s+|an\s+)?(?:total\s+|complete\s+|absolute\s+)?(?:fraud|disgrace|cheat)\b/i.test(direct)) {
    return "I don't think that performance lived up to expectations.";
  }
  if (/\byou\s+(?:are|re|look|seem)\s+(?:so\s+|really\s+|completely\s+|totally\s+)?overrated(?:\s+and\s+washed\s+up)?\b/i.test(direct) ||
      /\byou\s+(?:are|re|look|seem)\s+(?:so\s+|really\s+|completely\s+|totally\s+)?washed\s+up\b/i.test(direct)) {
    return "I don't think you are performing at your best right now.";
  }
  if (/\bchoking\s+again[.!?\s]+(?:so\s+)?embarrassing\b/i.test(direct)) {
    return "That was disappointing; they seemed to lose confidence at the key moments.";
  }
  if (/\b(?:just\s+)?retire\s+already\b|\bjust\s+retire\b/i.test(direct)) {
    return "I think it may be time to consider the next stage of your career.";
  }
  if (/\bgo\s+away\s+forever\b/i.test(direct)) {
    return "Please give me some space.";
  }
  if (/^\s*never\s+(?:play|compete|coach|officiate)(?:\s+[a-z]+){0,3}\s+again[.!?]*\s*$/i.test(direct)) {
    return "That was a difficult performance — I hope you come back stronger.";
  }
  if (/\bbottled\s+it\b/i.test(direct)) {
    return "They seemed to lose confidence at a key moment.";
  }
  if (/\b(?:the\s+)?(?:umpire|referee|official|linesperson)\s+(?:is|was|are|were)\s+blind\b/i.test(direct)) {
    return "I think the official missed that call.";
  }
  if (/\byou\s+should\s+be\s+ashamed(?:\s+of\s+yourself)?\b/i.test(direct)) {
    return "I expected more from that performance.";
  }
  if (/\b(?:this|that|the)\s+(player|team|side)\s+(?:is|was)\s+(?:garbage|trash|rubbish)\b/i.test(direct)) {
    const subject = direct.match(/\b(this|that|the)\s+(player|team|side)\b/i);
    const label = subject ? `${subject[1][0].toUpperCase()}${subject[1].slice(1).toLowerCase()} ${subject[2].toLowerCase()}'s` : "The team's";
    return `${label} performance was below-par.`;
  }

  let t = direct;

  // Pass 1 — "The <subject> is a [corrupt/…] idiot/clown/…" → constructive,
  // subject preserved.
  t = t.replace(
    /\bthe\s+(\w+)\s+is\s+(?:a\s+|an\s+)?(?:corrupt\s+|useless\s+|clueless\s+|biased\s+|bent\s+|blind\s+|pathetic\s+|absolute\s+|total\s+|complete\s+)*(?:idiot|moron|clown|joke|disgrace|fraud|cheat|muppet|numpty|donkey)\b\.?/i,
    (_m, subj) => `I strongly disagree with that decision and think the ${subj.toLowerCase()} got it wrong.`
  );

  // Pass 1b — "The <subject> is/was <adjective-insult>" → measured disagreement,
  // subject preserved (covers "the umpire is clueless").
  t = t.replace(
    /\bthe\s+(\w+)\s+(?:is|was|are|were)\s+(?:so\s+|really\s+|absolutely\s+|totally\s+|completely\s+|utterly\s+|fucking\s+)?(?:clueless|useless|hopeless|pathetic|awful|terrible|shocking|dreadful|corrupt|spineless|gutless|overrated|brainless|embarrassing|a\s+disgrace|a\s+joke)\b\.?/i,
    (_m, subj) => `I don't think the ${subj.toLowerCase()} got that right.`
  );

  // Pass 1c — "was/is a joke" and "what a joke" phrasings.
  t = t.replace(/\bwhat\s+a\s+joke\s+of\s+a\s+(\w+)\b\.?/i, (_m, n) => `that ${n.toLowerCase()} was really frustrating.`);
  t = t.replace(/\bwhat\s+a\s+joke\b/i, "that was really frustrating");
  t = t.replace(/\bwas\s+(?:an?\s+)?(?:complete\s+|total\s+|absolute\s+)?joke\b/i, "was poor");
  t = t.replace(/\bis\s+(?:an?\s+)?(?:complete\s+|total\s+|absolute\s+)?joke\b/i, "is not good enough");

  // Pass 2 — "You were <bad> …" → "Tough performance …" (keeps trailing words).
  t = t.replace(
    /\byou\s+(?:were|are|looked|played)\s+(?:so\s+|really\s+|completely\s+|absolutely\s+|totally\s+|utterly\s+)?(?:useless|terrible|awful|hopeless|pathetic|garbage|trash|rubbish|shocking|dreadful|abysmal)\b/i,
    "Tough performance"
  );
  // Pass 2b — strip the "never play again"-style attack, replace with encouragement.
  t = t.replace(
    /,?\s*(?:you\s+should\s+)?(?:so\s+)?never\s+(?:(?:play|compete|coach|officiate)(?:\s+[a-z]+){0,3}|come\s+back|show\s+your\s+face)\s+again\b\.?/i,
    " — I hope you come back stronger next match."
  );

  // Pass 3 — exclamatory "What a …" → measured "That was a …".
  t = t.replace(/\bwhat\s+a\s+/i, "That was a ");

  // Pass 4 — soften insult adjectives (topic words kept intact).
  for (const [bad, good] of Object.entries(SOFTEN)) {
    t = t.replace(new RegExp(`\\b${bad.replace(/\s+/g, "\\s+")}\\b`, "gi"), good);
  }

  // Pass 5 — convert sentence-leading profanity into the emotion it conveys
  // before removing residual individual profanity words.
  t = t.replace(/^(?:fuck|screw)\s+(this|that)\b/i, (_m, which) => `I'm frustrated by ${which.toLowerCase()}`);
  t = t.replace(/\bwhat\s+the\s+fuck\b/gi, "what");

  // Pass 5b — drop leftover insult nouns, profanity and obscene gestures.
  t = t.replace(REMOVE_NOUNS, "").replace(REMOVE_PROF, "").replace(OBSCENE_EMOJI, "");

  // Pass 6 — soften remaining aggressive imperatives.
  t = t.replace(/\byou\s+should\s+be\s+ashamed(?:\s+of\s+yourself)?\b/gi, "I expected more from that performance");
  t = t.replace(/\bjust\s+retire\b|\bretire\s+already\b/gi, "I think it may be time to consider the next stage of your career");
  t = t.replace(/\bgive\s+up\b/gi, "keep going");
  t = t.replace(/\bchoking\s+again\b/gi, "seemed to lose confidence at the key moments");
  t = t.replace(/\bjust\s+disappear\b|\bgo\s+away\s+forever\b/gi, "");
  t = t.replace(/\byou\s+(?:are|re)\s+(?:a\s+)?complete\s*[.!?]?/gi, "That performance was");

  let out = tidy(t);

  // Guarantee a warning rewrite is actually different & softer than the input.
  // If nothing changed, strip any residual insult/profanity words and retidy.
  if (out && out.toLowerCase() === original.trim().toLowerCase()) {
    let t2 = original
      .replace(new RegExp(`\\b(?:${INSULTS.map((w) => w.replace(/\s+/g, "\\s+")).join("|")})\\b`, "gi"), "")
      .replace(REMOVE_PROF, "");
    out = tidy(t2);
  }

  // A deletion-only rewrite can leave a dangling pronoun (for example
  // "fuck you" becoming "You."). Detect that and replace it with a complete
  // intent-aware sentence rather than presenting broken AI copy.
  const fragmentOnly = /^[.\s]*(?:you|u|he|she|they|him|her|them|your|his|hers|their)[.!?\s]*$/i.test(out || "");
  const outputWords = normalize(out || "").split(" ").filter(Boolean);
  const danglingWords = new Set(["off", "up", "away", "again", "now", "today", "just", "the", "a", "an", "and", "but", "so", "to", "of", "at", "it", "this", "that"]);
  const deletionFragment = outputWords.length > 0 && outputWords.length <= 3 && outputWords.every((word) => danglingWords.has(word));
  const structuralFragment = /\b(?:a|an|the|such|total|absolute|complete)\s*[.!?]$/i.test(out || "") ||
    /\blike\s+(?:a|an)?\s*(?:today|again|now)?[.!?]$/i.test(out || "") ||
    /\b(?:are|is|was|were)\s+(?:a|an|the)?\s*(?:to|at|of|for|with)\b/i.test(out || "");
  if (fragmentOnly || deletionFragment || structuralFragment) {
    const sourceNorm = normalize(original);
    if (/\b(?:umpire|referee|official|linesperson|line\s+call|decision|call)\b/.test(sourceNorm)) {
      return "I strongly disagree with that decision, but I want to keep the criticism respectful.";
    }
    if (/\b(?:match|performance|played|player|serve|return|shot|set|game|team|tournament|sport)\b/.test(sourceNorm)) {
      return "I was disappointed by that performance, but I want to keep the criticism constructive.";
    }
    return "I disagree, but I want to express that respectfully.";
  }

  // Safety net: if we somehow stripped everything, keep it on-topic and neutral
  // rather than returning a generic unrelated message.
  if (!out || out === ".") {
    const sourceNorm = normalize(original);
    if (/\b(?:match|performance|played|player|serve|return|shot|set|game|team|tournament|sport)\b/.test(sourceNorm)) {
      return "I was frustrated by the performance, but I want to keep the criticism constructive.";
    }
    return "I want to express my frustration without attacking anyone.";
  }
  return out;
}


// Strong criticism of a sporting object (performance, decision, shot, strategy)
// is deliberately allowed. K1ND intervenes when criticism becomes a personal
// attack, not simply because the sporting opinion is harsh. These phrases are
// removed from the warning scan; any other abusive wording in the same message
// still triggers the normal rules.
function stripSportingObjectCriticism(norm) {
  return norm
    .replace(/\b(?:that|this|the|a|an)?\s*(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop)\s+(?:is|was|were|looked|felt)\s+(?:absolutely\s+|really\s+|completely\s+|fucking\s+|bloody\s+)?(?:stupid|awful|terrible|rubbish|poor|shocking|dreadful|embarrassing|abysmal)\b/g, " sporting criticism ")
    .replace(/\b(?:that|this)\s+(?:was|is)\s+(?:an?\s+)?(?:fucking\s+|bloody\s+)?(?:stupid|awful|terrible|rubbish|poor|shocking|dreadful|embarrassing|abysmal)\s+(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop)\b/g, " sporting criticism ")
    .replace(/\bwhat\s+(?:an?\s+)?(?:fucking\s+|bloody\s+)?(?:stupid|awful|terrible|rubbish|poor|shocking|dreadful|embarrassing|abysmal)\s+(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop)\b/g, " sporting criticism ")
    .replace(/\b(?:this|that|the|a|an)\s+(?:fucking\s+|bloody\s+)?(?:stupid|awful|terrible|rubbish|poor|shocking|dreadful|embarrassing|abysmal)\s+(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop)\b/g, " sporting criticism ");
}

// ===========================================================================
// Main entry point
// ===========================================================================
function block(category, reason) {
  return { outcome: "block", category, reason };
}

function moderateContentBase(text) {
  const original = (text || "").trim();
  if (!original) return { outcome: "clean", category: "empty", reason: "Empty message" };

  const norm = normalize(original);
  const multilingualAbuse = moderateMultilingualAbuse(norm, original);
  const polishAbuse = moderatePolishAbuse(norm, original);
  const globalRacialSlur = moderateGlobalRacialSlurs(original);
  const australianAbuse = moderateAustralianAbuse(norm);
  const czechBalticAbuse = moderateCzechBalticAbuse(norm, original);
  const westernEuropeanAbuse = moderateWesternEuropeanAbuse(norm, original);
  const priorityGlobalAbuse = moderatePriorityGlobalAbuse(original);
  const nextWaveAbuse = moderateNextWaveAbuse(original);
  const v412Language = moderateV412LanguageWave(original);
  const v412Signals = moderateV412Signals(original);
  const uncertainty = moderateUncertainty(original);

  // ---- HARD BLOCK (most severe first) ----
  const emojiBlock = detectHardBlockEmoji(original, norm);
  if (emojiBlock) return block(emojiBlock.category, emojiBlock.reason);
  if (containsSelfHarmEncouragement(original, norm)) {
    return {
      ...block("self_harm_encouragement", "Encouragement of suicide or self-harm"),
      policyRationale:"A direct command encouraging suicide or self-harm is prevented from publication, including joined or obfuscated spellings.",
    };
  }
  if (globalRacialSlur) return globalRacialSlur;
  if (czechBalticAbuse?.outcome === "block") return czechBalticAbuse;
  if (westernEuropeanAbuse?.outcome === "block") return westernEuropeanAbuse;
  if (priorityGlobalAbuse?.outcome === "block") return priorityGlobalAbuse;
  if (nextWaveAbuse?.outcome === "block") return nextWaveAbuse;
  if (v412Language?.outcome === "block") return v412Language;
  if (HATE_SYMBOL.test(original) || HATE_IDEOLOGY.some((re) => re.test(norm))) return block("hate_symbol", "Hate symbol or extremist hate expression");
  if (containsSlur(original, norm)) return block("slur", "Slur / hate speech");
  if (containsProhibitedSevereAbuse(original, norm)) return block("severe_abuse", "Severe targeted misogynistic abuse");
  if (DEHUMANISING_TEXT.some((re) => re.test(norm))) return block("dehumanising", "Targeted dehumanising abuse");
  if (SEXUAL_ABUSE_PATTERNS.some((re) => re.test(norm))) return block("sexual_abuse", "Sexual threat, coercion or intimate-image abuse");
  if (THREAT_PATTERNS.some((re) => re.test(norm)) && !COMPETITIVE_HYPERBOLE.some((re) => re.test(norm)))
    return block("threat", "Threat of violence");
  if (WISH_HARM.test(norm) || HARM_DIRECT.test(norm)) return block("harm", "Wishing harm, illness or death on a person");
  if (DISCRIMINATORY.some((re) => re.test(norm))) return block("discriminatory", "Discriminatory abuse");
  if (containsPersonalContact(original))
    return block("personal_contact", "Phone number, email address or personal contact information");
  if (containsAddressOrLocation(original))
    return block("doxxing", "Personal address, travel or sensitive location information");
  if (multilingualAbuse?.outcome === "block") return multilingualAbuse;
  if (polishAbuse?.outcome === "block") return polishAbuse;

  // Versioned emerging-language rules sit behind universal safety blocks but
  // ahead of generic abuse rules. Most require evidence that a person, rather
  // than a sporting action or idea, is being targeted.
  const emergingLanguage = moderateEmergingLanguage(norm);
  if (emergingLanguage?.outcome === "block") return emergingLanguage;

  // If the live guard has stopped the last character of a prohibited severe
  // abuse term, the remaining fragment is still not allowed to publish.
  if (containsNearCompleteSevereAbuse(original)) {
    return {
      outcome: "warning",
      category: "near_severe_abuse",
      reason: "Potentially prohibited targeted abuse",
      rewriteSuggestion: "I'm frustrated, but I want to express that without attacking anyone.",
    };
  }

  // A near-complete slur is not published. This most commonly occurs after the
  // live guard has refused the final character. It receives the same four safe
  // choices as other warning content: AI rewrite, self-edit, cancel or enhanced
  // moderation.
  if (containsNearCompleteSlur(original)) {
    return {
      outcome: "warning",
      category: "near_slur",
      reason: "Potentially prohibited hateful language",
      rewriteSuggestion: NEAR_SLUR_REWRITE,
    };
  }

  // ---- ENHANCED REVIEW (held, never published immediately) ----
  // A fully recognised V4.12 construction is more informative than the
  // generic uncertainty shield, including when separators were inserted.
  if (v412Signals?.outcome === "warning") return v412Signals;
  if (v412Language?.outcome === "warning") return v412Language;
  if (v412Signals?.outcome === "review") return v412Signals;
  if (v412Language?.outcome === "review") return v412Language;
  if (uncertainty?.outcome === "review") return uncertainty;
  if (COORDINATED_HARASSMENT.some((re) => re.test(norm)))
    return review("coordinated_harassment", "Coordinated targeting / pile-on", reviewRewrite("coordinated_harassment"));
  if (GAMBLING_ATTACK.some((re) => re.test(norm)))
    return review("gambling_attack", "Gambling-linked targeted abuse", reviewRewrite("gambling_attack"));
  if (INTEGRITY_ALLEGATION.some((re) => re.test(norm)))
    return review("integrity_allegation", "Serious unverified integrity allegation", reviewRewrite("integrity_allegation"));
  if (SERIOUS_ALLEGATION.some((re) => re.test(norm)))
    return review("serious_allegation", "Serious unverified allegation", reviewRewrite("serious_allegation"));
  if (multilingualAbuse?.outcome === "review") return multilingualAbuse;
  if (emergingLanguage?.outcome === "review") return emergingLanguage;

  // ---- WARNING ----
  if (v412Signals?.outcome === "warning") return v412Signals;
  if (v412Signals?.outcome === "clean") return v412Signals;
  if (v412Language?.outcome === "warning") return v412Language;
  if (v412Language?.outcome === "clean") return v412Language;
  if (uncertainty?.outcome === "warning") return uncertainty;
  if (westernEuropeanAbuse?.outcome === "warning") return westernEuropeanAbuse;
  if (priorityGlobalAbuse?.outcome === "warning") return priorityGlobalAbuse;
  if (priorityGlobalAbuse?.outcome === "clean") return priorityGlobalAbuse;
  if (nextWaveAbuse?.outcome === "warning") return nextWaveAbuse;
  if (nextWaveAbuse?.outcome === "clean") return nextWaveAbuse;
  if (czechBalticAbuse?.outcome === "warning") return czechBalticAbuse;
  if (australianAbuse?.outcome === "warning") return australianAbuse;
  if (multilingualAbuse?.outcome === "warning") return multilingualAbuse;
  if (polishAbuse?.outcome === "warning") return polishAbuse;
  if (emergingLanguage?.outcome === "warning") return emergingLanguage;
  const warningNorm = stripSportingObjectCriticism(norm);
  const insultHit = wordHit(INSULTS, warningNorm);
  const profanity = classifyProfanityFunction(norm);
  const profHit = profanity?.abusive ? profanity.term : null;
  const aggroHit = AGGRO.some((re) => re.test(warningNorm));
  const personalAbuseHit = PERSONAL_ABUSE_PATTERNS.some((re) => re.test(warningNorm));
  const obsceneEmojiHit = OBSCENE_EMOJI.test(original);
  if (insultHit || profHit || aggroHit || personalAbuseHit || obsceneEmojiHit) {
    const reason =
      (profHit || obsceneEmojiHit) && !insultHit && !aggroHit && !personalAbuseHit ? "Strong language / obscene gesture" : "Personal abuse / aggressive tone";
    return { outcome: "warning", category: "abuse", reason, rewriteSuggestion: suggestRewrite(original), profanityFunction:profanity || undefined };
  }

  // An expletive can intensify praise, frustration or sporting criticism
  // without targeting anybody. It remains visible in the explanation, but it
  // is not converted into an abuse warning or an unnecessary rewrite request.
  if (profanity && !profanity.abusive) {
    return {
      outcome:"clean",
      category:"expressive_profanity",
      reason:"Expressive profanity with no abuse detected",
      profanityFunction:profanity,
      policyRationale:`The profanity functions as ${profanity.label}. No person is attacked, threatened, degraded, excluded or exposed.`,
    };
  }

  return { outcome: "clean", category: "clean", reason: "No issues detected" };
}

function decisionAnalysis(original, result, context) {
  const norm = normalize(original);
  const directSelfHarm = result.category === "self_harm_encouragement";
  const secondPerson = /\b(?:you|u|your|yours|yourself|youre|tu|tum|tujhe|tera|teri|tame|ty|ciebie|cie|jestes)\b/.test(norm) || /(?:तू|तुम|तुझे|तेरा|तेरी|તું|તમે|તારો|તારી|تم|آپ)/u.test(original);
  const handle = original.match(/@[a-z0-9_.-]+/i)?.[0];
  const thirdPerson = norm.match(/\b(?:he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|fan)\b/)?.[0];
  const sportObject = norm.match(/\b(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|tactic|play|pass|tackle|penalty|lap|wicket|race|team)\b/)?.[0];
  const target = directSelfHarm ? "the addressed participant" : context?.target?.label || handle || (secondPerson ? "the addressed participant" : thirdPerson ? `the referenced ${thirdPerson}` : sportObject ? `the sporting ${sportObject}` : "no clear person");
  const targetType = directSelfHarm ? "person" : context?.target?.type || (handle || secondPerson || thirdPerson ? "person" : sportObject ? "sporting action or object" : "unclear / general expression");
  const mechanisms = {
    clean: "none detected", empty: "none detected", abuse: "personal degradation or aggressive expression",
    personal_degradation: "personal degradation", dehumanising_label: "reduction of a person to a non-person label",
    mental_state_ridicule: "ridicule of perceived mental state", personal_ridicule: "personal ridicule",
    silencing_ridicule: "ridicule intended to silence", taunting: "provocative taunting", dismissal: "dismissive command",
    exclusion: "attempted exclusion from the community", self_harm_encouragement: "encouragement of self-harm",
    sexualised_family_abuse: "sexualised abuse involving a family member", sexualised_misogyny: "sexualised misogynistic degradation",
    sexualised_personal_abuse: "sexualised personal abuse", strong_profanity: "strong profanity",
    suspected_evasive_abuse: "suspected evasion of severe abuse", stacked_personal_degradation: "stacked personal degradation",
    racial_slur: "identity-based anti-Black racial abuse",
    slur: "identity-based hateful language",
    severe_abuse: "severe targeted abuse", dehumanising: "dehumanisation", threat: "credible violence language",
    harm: "encouragement or wishing of harm", sexual_abuse: "sexual threat, coercion or intimate-image abuse",
    discriminatory: "identity-based exclusion", personal_contact: "exposure of personal contact information",
    doxxing: "exposure of sensitive location information", coordinated_harassment: "coordination of a pile-on",
    gambling_attack: "gambling-linked blame directed at a person", integrity_allegation: "unverified integrity allegation",
    serious_allegation: "unverified serious allegation", racist_symbol: "racist or dehumanising symbol",
    dehumanising_symbol: "dehumanising symbol", hate_symbol: "extremist hate expression",
    emotional_ridicule: "ridicule of emotion or complaint", class_based_ridicule: "class-based ridicule",
    belief_based_ridicule: "dismissive labelling based on beliefs", strong_personal_abuse: "strong personal abuse",
    dismissive_command: "aggressive dismissal", identity_slur: "identity-based hateful language",
    severe_family_degradation: "severe family-directed degradation",
    homophobic_slur: "homophobic identity abuse", contextual_safe: "quoted, opposed, self-directed or object-focused language",
    expressive_profanity: "emotional emphasis without an abuse mechanism",
    moderation_evasion: "obfuscation of reviewed personal abuse", language_uncertainty: "targeted wording using uncertain evasion patterns",
    minor_targeted_abuse: "direct abuse of an U18 participant", coordinated_targeting: "cumulative multi-account targeting",
    repeated_targeting: "repeated attacks on the same participant",
    persistent_targeting: "persistent attacks across conversations",
    code_switched_abuse: "code-switched personal degradation",
    coded_group_stereotype: "potential coded group stereotype",
    coded_identity_conspiracy: "potential coded identity conspiracy",
    coded_identity_targeting: "potential coded identity targeting",
    coded_exclusion: "potential coded identity exclusion",
  };
  const mechanism = mechanisms[result.category] || result.reason || "policy signal";
  const signals = [...(context?.signals || [])];
  if (secondPerson) signals.push("direct second-person address");
  if (directSelfHarm) signals.push("direct self-harm command, including collapsed-word normalization");
  if (handle) signals.push("named account handle");
  if (thirdPerson) signals.push("person-reference language");
  if (sportObject) signals.push("sporting-context language");
  if (result.emergingLanguageRule) signals.push(`emerging-language rule ${result.emergingLanguageRule}`);
  if (result.multilingualRule) signals.push(`multilingual policy rule ${result.multilingualRule}`);
  if (result.polishRule) signals.push(`Polish policy rule ${result.polishRule}`);
  if (result.globalRacialRule) signals.push(`global racial-slur rule ${result.globalRacialRule}`);
  if (result.australianRule) signals.push(`Australian English policy rule ${result.australianRule}`);
  if (result.czechBalticRule) signals.push(`Czech/Baltic regional policy rule ${result.czechBalticRule}`);
  if (result.westernEuropeanRule) signals.push(`Western European policy rule ${result.westernEuropeanRule}`);
  if (result.priorityGlobalRule) signals.push(`priority global policy rule ${result.priorityGlobalRule}`);
  if (result.nextWaveRule) signals.push(`next-wave policy rule ${result.nextWaveRule}`);
  if (result.v412LanguageRule) signals.push(`V4.12 language rule ${result.v412LanguageRule}`);
  if (result.v412SignalRule) signals.push(`V4.12 cross-context rule ${result.v412SignalRule}`);
  if (result.codeSwitch) signals.push("code-switching detected across target and abuse wording");
  if (result.transliterationEvidence) signals.push(result.transliterationEvidence);
  if (Array.isArray(result.languageSignals)) signals.push(...result.languageSignals.map((item) => `language signal ${item}`));
  if (result.uncertaintyRule) signals.push(`fail-safe rule ${result.uncertaintyRule}`);
  if (result.uncertaintySignals) signals.push(...result.uncertaintySignals);
  if (result.profanityFunction) signals.push(`profanity function: ${result.profanityFunction.label}`);
  if (["block", "review"].includes(result.outcome)) signals.push("high-consequence policy category");
  if (!signals.length) signals.push("lexical or phrase-level policy match");
  const action = result.outcome === "warning"
    ? (result.rewriteSuggestion ? "intervene before publication and offer a source-backed rewrite" : "intervene before publication and require the author to state a genuine point")
    : { clean:"publish as written", review:"hold the original privately for enhanced review", block:result.safeDraftSuggestion ? "block the original; offer a separately validated, source-backed new draft" : "prevent publication without a bypass" }[result.outcome];
  const implicitTargetProhibition = new Set(["slur","racial_slur","identity_slur","homophobic_slur","hate_symbol","severe_abuse","discriminatory"]);
  const abuseElement = result.outcome === "clean"
    ? (result.profanityFunction ? `No abuse element was found. The profanity functions as ${result.profanityFunction.label}, not as a person-directed attack.` : result.contextOverride ? "Potentially harmful wording is present, but it is being reported, opposed, analysed, self-directed or applied to an idea rather than used as a direct attack." : targetType === "sporting action or object" || targetType === "idea or argument" ? "The language critiques the sport, tactic or idea rather than attacking a person." : "No policy-defined abuse element was detected in context.")
    : targetType !== "person" && implicitTargetProhibition.has(result.category)
      ? `The abuse element is ${mechanism}. This high-confidence identity-based or severe form is prohibited even when the target is implicit.`
      : `The abuse element is ${mechanism}; it is directed at ${target}.`;
  return {
    target,
    targetType,
    mechanism,
    abuseElement,
    contextualReading: directSelfHarm ? "direct encouragement of self-harm" : context?.speechAct?.label || (targetType === "sporting action or object" ? "sporting criticism" : targetType === "person" ? "interpersonal / targeted language" : "general expression"),
    signals:[...new Set(signals)],
    policyRationale: result.policyRationale || `${result.reason}. K1ND distinguishes criticism of sporting actions from language that harms, degrades, threatens, exposes or unfairly accuses a person.`,
    confidence: result.contextOverride ? "high" : result.outcome === "clean" ? "medium" : result.outcome === "warning" ? "medium-high" : "high",
    action,
    codedMeaning:result.codedMeaning || null,
    contextAssessment: context ? {
      version:context.version,
      speechAct:context.speechAct.label,
      speechActId:context.speechAct.id,
      stance:context.stance,
      targetScope:context.target.scope,
      targetExplicitness:context.target.explicitness,
      protectedFraming:context.protectedFraming,
      modifiers:context.modifiers,
      stacking:context.stacking,
      riskScore:context.riskScore,
      riskBand:context.riskBand,
      explanation:context.explanation,
      conversation:context.conversation,
      targetAudience:context.audience,
      profanity:context.profanity,
    } : null,
  };
}

export function moderateContent(text, conversationContext = {}) {
  const original = String(text || "").trim();
  const lexicalResult = moderateContentBase(original);
  const initialContext = analyzeContext(original, lexicalResult, conversationContext);
  const contextualResult = applyContextPolicy(lexicalResult, initialContext);
  const initialSemantic = analyzeSemanticIntent(original, contextualResult, conversationContext);
  const result = applySemanticPolicy(contextualResult, initialSemantic);
  const semanticContext = result.semanticOverride === "implicit_personal_attack"
    ? {
      ...initialContext,
      target:{ label:"the implicitly addressed participant", type:"person", scope:"implicit vocative target", explicitness:"semantic clause resolution" },
      speechAct:{ id:"implicit_personal_attack", label:"sarcastic personal degradation" },
      stance:"authorial / person-directed contempt",
      flags:{ ...initialContext.flags, directAttack:true },
      mechanismCount:Math.max(1, initialContext.mechanismCount || 0),
      stacking:"single abuse mechanism",
      signals:[...(initialContext.signals || []), "implicit vocative target", "contempt disguised as praise"],
    }
    : initialContext;
  const context = finalizeContext(semanticContext, result);
  let rewrite = refineRewrite(original, result);
  if (Array.isArray(rewrite?.options) && rewrite.options.length) {
    const safeOptions = rewrite.options.filter((option) => {
      const optionBase = moderateContentBase(option.suggestion);
      const optionContext = analyzeContext(option.suggestion, optionBase, conversationContext);
      return applyContextPolicy(optionBase, optionContext).outcome === "clean";
    }).map((option) => {
      const evaluation = evaluateRewriteFidelity(original, { ...rewrite, suggestion:option.suggestion });
      return { ...option, validatedClean:true, evaluation };
    });
    const cleanOptions = safeOptions.filter((option) => option.evaluation.suitable);
    const preferred = cleanOptions.find((option) => option.id === "direct") || cleanOptions[0];
    rewrite = preferred
      ? { ...rewrite, suggestion:preferred.suggestion, options:cleanOptions, validatedClean:true }
      : safeOptions.length ? {
        ...rewrite, status:"fidelity_not_proven", suggestion:undefined, suppressedCandidate:safeOptions[0].suggestion,
        evaluation:safeOptions[0].evaluation, options:[],
        rationale:"The possible wording passed the safety rules, but K1ND could not prove that it preserves the author's real point, so it is withheld.",
      } : { status:"no_validated_option", suggestion:undefined, preservedPoint:"None validated", removed:rewrite.removed, clauses:rewrite.clauses, options:[], rationale:"Possible wording was generated, but no option passed K1ND's own moderation rules, so none is offered." };
  }
  let refined = ["warning", "review"].includes(result.outcome)
    ? { ...result, rewriteSuggestion:rewrite.suggestion, rewrite }
    : result.outcome === "block" ? { ...result, rewrite } : result;
  if (result.outcome === "block" && rewrite.status === "safe_new_draft" && rewrite.suggestion) {
    const draftBase = moderateContentBase(rewrite.suggestion);
    const draftInitialContext = analyzeContext(rewrite.suggestion, draftBase, conversationContext);
    const draftDecision = applyContextPolicy(draftBase, draftInitialContext);
    if (draftDecision.outcome === "clean") {
      refined = { ...refined, safeDraftSuggestion:rewrite.suggestion, rewrite:{ ...rewrite, validatedClean:true } };
    } else {
      refined = { ...result, rewrite:{ status:"blocked_no_safe_draft", suggestion:undefined, preservedPoint:"None validated", removed:"Prohibited original", rationale:"A possible draft was found but did not pass K1ND's own moderation rules, so it is not offered." } };
    }
  }
  if (refined.rewrite) {
    const evaluation = refined.rewrite.evaluation || evaluateRewriteFidelity(original, refined.rewrite);
    refined = {
      ...refined,
      rewrite:{ ...refined.rewrite, evaluation },
    };
    if (refined.rewrite.suggestion && !evaluation.suitable) {
      refined = {
        ...refined,
        rewriteSuggestion:undefined,
        safeDraftSuggestion:undefined,
        rewrite:{
          ...refined.rewrite,
          status:"fidelity_not_proven",
          suppressedCandidate:refined.rewrite.suggestion,
          suggestion:undefined,
          options:[],
          rationale:"A safer sentence was found, but K1ND could not prove that it accurately preserves the author's real point. It is withheld rather than replaced with generic wording.",
        },
      };
    }
  }
  const languageCoverage = getLanguageCoverage(original, refined);
  const baseAnalysis = decisionAnalysis(original, refined, context);
  const semanticIntent = analyzeSemanticIntent(original, refined, conversationContext);
  const confidenceProfile = {
    policy:refined.outcome === "block" ? "high" : refined.outcome === "review" ? "review-required" : refined.outcome === "warning" ? "medium-high" : "context-dependent",
    language:refined.languageConfidence || (languageCoverage.demoCoverage.startsWith("covered") ? "functional pack match" : "production model required"),
    target:context.target.explicitness,
    rewrite:refined.rewrite?.suggestion ? (refined.rewrite?.validatedClean ? "validated clean and source-faithful" : "candidate re-check required") : refined.rewrite?.status === "fidelity_not_proven" ? "withheld: meaning fidelity not proven" : "not applicable",
    uncertainty:refined.codedMeaning?.ambiguity || languageCoverage.disagreementRisk,
  };
  return { ...refined, analysis: { ...baseAnalysis, confidenceProfile, languageCoverage, semanticIntent } };
}

// ===========================================================================
// §6 canonical test fixtures — exercised by moderation-test.html and node.
// ===========================================================================
export const TEST_CASES = [
  { input:"bougnoule", displayInput:"[French ethnic slur]", expect:"block" },
  { input:"bicot", displayInput:"[French ethnic slur variant]", expect:"block" },
  { input:"negraccio", displayInput:"[Italian anti-Black slur]", expect:"block" },
  { input:"sudaca", displayInput:"[Spanish ethnic slur]", expect:"block" },
  { input:"Você é um macaco.", displayInput:"[targeted Portuguese simian slur]", expect:"block" },
  { input:"O macaco vive na floresta.", expect:"clean", note:"Literal Portuguese animal reference remains allowed." },
  { input:"Tum habshi ho.", displayInput:"[targeted Hindi anti-Black slur]", expect:"block" },
  { input:"The Habshi dynasty is part of Indian history.", expect:"clean", note:"Historical proper-name context remains allowed because the ambiguous term is not targeted." },
  { input:"Du Kanake.", displayInput:"[targeted German ethnic slur]", expect:"block" },
  { input:"Kanak is a personal name.", expect:"clean", note:"An ambiguous un-targeted proper name is not blocked." },
  { input:"يا عبيد", displayInput:"[Arabic anti-Black racialised slave slur]", expect:"block" },
  { input: "koon", displayInput:"[phonetic anti-Black slur evasion]", expect:"block", note:"Phonetic spelling evasion is hard-blocked." },
  { input: "k00n", displayInput:"[leetspeak anti-Black slur evasion]", expect:"block", note:"Leetspeak normalisation reaches the same hard block." },
  { input: "cottonpicker", displayInput:"[joined historical racial-abuse phrase]", expect:"block", note:"Joined spelling does not bypass the racial-slur phrase rule." },
  { input: "cotton-p1cker", displayInput:"[hyphenated/leetspeak historical racial-abuse phrase]", expect:"block" },
  { input: "ниггер", displayInput:"[Cyrillic N-word transliteration]", expect:"block" },
  { input: "निग्गर", displayInput:"[Devanagari N-word transliteration]", expect:"block" },
  { input: "નિગ્ગર", displayInput:"[Gujarati N-word transliteration]", expect:"block" },
  { input: "czarnuch", displayInput:"[Polish anti-Black slur]", expect:"block" },
  { input: "nikker", displayInput:"[Dutch anti-Black slur]", expect:"block" },
  { input: "négro", displayInput:"[French anti-Black slur]", expect:"block" },
  { input: "negrata", displayInput:"[Spanish anti-Black slur]", expect:"block" },
  { input: "黑鬼", displayInput:"[Mandarin anti-Black slur]", expect:"block" },
  { input: "El coche negro ganó la carrera.", expect:"clean", note:"The ordinary Spanish colour word remains allowed." },
  { input: "You hinchod.", expect: "review", expectNoRewrite:true, note: "Uncorroborated likely evasion is held for review; no replacement opinion is invented for a bare insult." },
  { input: "A moderator asks whether hinchod is a misspelling.", expect: "clean", note: "Research discussion of an uncertain form remains allowed." },
  { input: "You saala.", expect: "warning", expectNoRewrite:true },
  { input: "तुम साला हो।", expect: "warning", expectNoRewrite:true },
  { input: "The literal brother-in-law word is saala.", expect: "clean", note: "Literal kinship explanation remains allowed." },
  { input: "You haraam saala.", expect: "warning", expectNoRewrite:true },
  { input: "Kurwa mać!", expect: "warning", expectNoRewrite:true, note: "The Polish phrase is a profane exclamation with no further point, so K1ND does not invent a rewrite." },
  { input: "Kurva matc!", expect: "warning", expectNoRewrite:true, note: "The phonetic spelling is recognised, but a profanity-only draft has no proposition to preserve." },
  { input: "Ty jesteś kurwą.", expect: "block", note: "Polish sexualised abuse directed at a person is hard-blocked." },
  { input: "Kurwa! Znowu przegraliśmy!", expect: "warning", expectRewrite: "Znowu przegraliśmy!", note: "The Polish sporting statement is retained verbatim while the expletive is removed." },
  { input: "The dictionary defines kurwa mać as a vulgar exclamation.", expect: "clean", note: "Educational discussion remains allowed." },
  { input: "You benchod.", expect: "block", note: "Romanised targeted sexualised family abuse is hard-blocked." },
  { input: "Tu bhenchod hai.", expect: "block", note: "Code-mixed target markers are recognised." },
  { input: "તમે બહેનચોદ છો.", expect: "block", note: "Gujarati-script targeted use reaches the same policy rule." },
  { input: "Benchod!", expect: "warning", expectNoRewrite:true, note: "Untargeted exclamation receives profanity friction, but no generic replacement opinion is invented." },
  { input: "The term benchod means a severe South Asian insult.", expect: "clean", note: "Educational quotation remains allowed." },
  { input: "You madarchod.", expect: "block", note: "Romanised mother-directed sexualised family abuse is hard-blocked." },
  { input: "તું માદરચોદ છે.", expect: "block", note: "Gujarati-script variant is recognised." },
  { input: "You randi.", expect: "block", note: "Targeted sexualised misogyny is hard-blocked." },
  { input: "You chutiya.", expect: "warning", expectNoRewrite:true },
  { input: "તું ચુતિયા છે.", expect: "warning", expectNoRewrite:true, note: "Gujarati-script vulgar personal abuse is recognised without inventing a replacement point." },
  { input: "You gandu.", expect: "warning", expectNoRewrite:true },
  { input: "You harami.", expect: "warning", expectNoRewrite:true },
  { input: "Tum pagal ho.", expect: "warning", expectNoRewrite:true },
  { input: "That was a pagal match!", expect: "clean", note: "Non-targeted idiomatic use is not automatically moderated." },
  { input: "You are his chamcha.", expect: "warning", expectRewrite: "I think that support is uncritical." },
  { input: "The phrase chup ho translates as be quiet.", expect: "clean", note: "Translation discussion is allowed." },
  { input: "Go unalive yourself.", expect: "block", expectCategory:"self_harm_encouragement", note: "Emerging euphemistic self-harm instructions are hard-blocked." },
  { input: "Kill yourself.", expect: "block", expectCategory:"self_harm_encouragement", note:"Direct encouragement of suicide or self-harm is hard-blocked as its own safety category." },
  { input: "killyourself", expect: "block", expectCategory:"self_harm_encouragement", note:"Removing whitespace does not bypass the self-harm-command rule." },
  { input: "k.i.l.l.y.o.u.r.s.e.l.f", displayInput:"[punctuation-obfuscated self-harm command]", expect: "block", expectCategory:"self_harm_encouragement" },
  { input: "k1lly0urself", displayInput:"[leetspeak self-harm command]", expect: "block", expectCategory:"self_harm_encouragement" },
  { input: "unaliveyourself", expect: "block", expectCategory:"self_harm_encouragement", note:"A joined euphemistic command reaches the same hard block." },
  { input: "go die", expect: "block", expectCategory:"self_harm_encouragement" },
  { input: "That loss killed your self-belief.", expect:"clean", note:"Sporting discussion of self-belief is not mistaken for a self-harm command." },
  { input: "You're such an NPC.", expect: "warning", expectNoRewrite:true, note: "Emerging terminology is context-gated; a bare label has no genuine point to preserve." },
  { input: "NPC characters can make games feel repetitive.", expect: "clean", note: "Benign gaming context is not over-blocked." },
  { input: "You are mid.", expect: "warning", expectRewrite: "I don't think you are performing at your best right now." },
  { input: "That album was mid.", expect: "clean", note: "Criticism of creative work remains allowed." },
  { input: "You're cooked, mate.", expect: "warning", expectRewrite: "I don't think you are performing at your best right now." },
  { input: "This team is cooked after that injury.", expect: "clean", note: "Sporting opinion remains allowed." },
  { input: "She's delulu.", expect: "warning", expectRewrite: "I don't think that view is realistic." },
  { input: "That is a delulu take.", expect: "clean", note: "Criticism of an idea is distinguished from attacking a person." },
  { input: "You're just a glazer.", expect: "warning", expectRewrite: "I think that praise goes too far." },
  { input: "You are such a yapper.", expect: "warning", expectNoRewrite:true },
  { input: "Touch grass.", expect: "warning", expectNoRewrite:true },
  { input: "Cry more.", expect: "warning", expectNoRewrite:true },
  { input: "Delete your account.", expect: "warning", expectNoRewrite:true },
  {
    input: "She played too passively in the final set and needs to be more aggressive on the return.",
    expect: "clean",
    note: "Legitimate sporting criticism remains publishable.",
  },
  {
    input: "You are a complete disgrace. Choking again. Just disappear.",
    expect: "warning",
    expectRewrite: "That was a very disappointing performance. She seemed to lose confidence at the key moments.",
    note: "Canonical live intervention example.",
  },
  {
    input: "You were useless today, never play again.",
    expect: "warning",
    expectRewrite: "That performance was not good enough today.",
  },
  {
    input: "The umpire is a corrupt idiot.",
    expect: "warning",
    expectRewrite: "I strongly disagree with that decision and think the umpire got it wrong.",
  },
  {
    input: "Go back to where you came from.",
    expect: "block",
    note: "Discriminatory abuse — no rewrite offered.",
  },
  {
    input: "n1gger",
    displayInput: "[obfuscated racial slur test]",
    expect: "block",
    note: "Leetspeak evasion is blocked before publication.",
  },
  {
    input: "n!gger",
    displayInput: "[punctuation-obfuscated racial slur test]",
    expect: "block",
    note: "Punctuation evasion is also blocked.",
  },
  {
    input: "What a stupid shot under pressure.",
    expect: "clean",
    note: "Harsh criticism of the shot remains allowed because the sporting action—not a person—is targeted.",
  },
  {
    input: "You live at 42 Oakfield Road, SW1A 2AA — everyone should turn up.",
    expect: "block",
    note: "Street address + postcode pattern.",
  },
  {
    input: "Call her on 07700 900123.",
    displayInput: "Call her on [UK mobile number].",
    expect: "block",
    note: "Phone numbers and personal contact details are hard-blocked.",
  },
  {
    input: "Call 212-555-0198.",
    displayInput: "Call [international phone number].",
    expect: "block",
    note: "Grouped international phone formats are hard-blocked.",
  },
  {
    input: "She lives at Flat 28, Henrietta House.",
    displayInput: "She lives at [flat and building address].",
    expect: "block",
    note: "Flat and building combinations are treated as address information.",
  },
  {
    input: "The hotel room is Room 214 at the Riverside Hotel.",
    displayInput: "The hotel room is [specific room and hotel].",
    expect: "block",
    note: "Specific hotel-room information is treated as a physical-safety risk.",
  },
  {
    input: "Send that 🐵 back where he belongs.",
    expect: "block",
    note: "Racist symbol (monkey emoji aimed at a person).",
  },
  {
    input: "Everyone go spam her account after that loss.",
    expect: "review",
    expectNoRewrite: true,
    note: "Coordinated targeting is held for enhanced moderation.",
  },
  {
    input: "You fixed that match and took a bribe.",
    expect: "review",
    expectRewrite: "I am concerned about possible unfair conduct, but I do not have evidence to verify wrongdoing.",
    note: "Serious unverified allegation is not published automatically.",
  },
  {
    input: "You ruined my acca and owe me money.",
    expect: "review",
    expectRewrite: "I'm frustrated by the result, but the player is not responsible for my betting losses.",
    note: "Gambling-linked targeting is held for enhanced moderation.",
  },
  {
    input: "nigge",
    displayInput: "[near-complete prohibited slur test]",
    expect: "warning",
    expectNoRewrite: true,
    note: "A fragment left after the final character is stopped cannot publish directly.",
  },
  {
    input: "nigg",
    displayInput: "[short near-complete prohibited slur stem test]",
    expect: "warning",
    expectNoRewrite: true,
    note: "Common near-complete variants are routed to the intervention flow.",
  },
  {
    input: "I heard a snigger from the back row.",
    expect: "clean",
    note: "Substring-safe matching avoids blocking an unrelated English word.",
  },
  {
    input: "n i g g e r",
    displayInput: "[spaced racial slur test]",
    expect: "block",
    note: "Spacing between letters does not bypass the hard block.",
  },
  {
    input: "niiiigger",
    displayInput: "[repeated-letter racial slur test]",
    expect: "block",
    note: "Repeated-letter evasion does not bypass the hard block.",
  },
  {
    input: "Send that 🦍 back where she belongs.",
    displayInput: "[targeted primate emoji test]",
    expect: "block",
    note: "Expanded primate emoji coverage is hard-blocked.",
  },
  {
    input: "You are a 🐷",
    displayInput: "[targeted dehumanising emoji test]",
    expect: "block",
    note: "Targeted dehumanising animal emoji is blocked contextually.",
  },
  {
    input: "I'm coming for you 🔪",
    displayInput: "[threat plus weapon emoji test]",
    expect: "block",
    note: "Threatening weapon imagery is hard-blocked.",
  },
  {
    input: "Send me your nudes.",
    displayInput: "[sexual coercion test]",
    expect: "block",
    note: "Sexual coercion and intimate-image requests are hard-blocked.",
  },
  {
    input: "Email her at player.private@example.com.",
    displayInput: "Email her at [personal email address].",
    expect: "block",
    note: "Email addresses are treated as personal contact information.",
  },
  {
    input: "She trains at Riverside Tennis Academy.",
    displayInput: "She trains at [specific training location].",
    expect: "block",
    note: "Specific training locations are treated as safeguarding-sensitive.",
  },
  {
    input: "Her flight BA281 lands at 18:30.",
    displayInput: "Her [specific travel details].",
    expect: "block",
    note: "Travel movements are treated as sensitive location information.",
  },
  {
    input: "She won 7-6 6-4 and saved three break points.",
    expect: "clean",
    note: "Ordinary tennis scores are not mistaken for phone numbers.",
  },
  {
    input: "I had a banana smoothie before the match 🍌",
    expect: "clean",
    note: "Benign emoji context remains allowed.",
  },
  {
    input: "That call was ridiculous 🖕",
    expect: "warning",
    note: "An obscene gesture triggers an intervention rather than direct publication.",
  },
  {
    input: "You are a subhuman animal.",
    displayInput: "[targeted dehumanising language test]",
    expect: "block",
    note: "Targeted dehumanisation is hard-blocked.",
  },
  {
    input: "White power.",
    displayInput: "[extremist hate expression test]",
    expect: "block",
    note: "Clear extremist hate expressions are hard-blocked.",
  },
  {
    input: "cunt",
    displayInput: "[severe misogynistic abuse test]",
    expect: "block",
    note: "Severe targeted misogynistic abuse is hard-blocked before publication.",
  },
  {
    input: "c u n t",
    displayInput: "[spaced severe-abuse evasion test]",
    expect: "block",
    note: "Spacing and punctuation do not bypass the severe-abuse hard block.",
  },
  {
    input: "fuck you",
    displayInput: "[direct profanity aimed at another user]",
    expect: "warning",
    expectNoRewrite: true,
    note: "A bare attack contains no point to preserve, so no generic replacement is offered.",
  },
  {
    input: "fuck off",
    displayInput: "[direct dismissive profanity]",
    expect: "warning",
    expectRewrite: "Please leave me alone.",
    note: "Phrase-level rewrite preserves the meaning and never collapses to 'off'.",
  },
  {
    input: "Why don't you just fuck off, you idiot?",
    displayInput: "[dismissive profanity plus insult]",
    expect: "warning",
    expectRewrite: "Please leave me alone.",
    note: "Embedded profanity phrases are rewritten before word-level deletion.",
  },
  {
    input: "Shut the fuck up.",
    displayInput: "[aggressive silencing phrase]",
    expect: "warning",
    expectRewrite: "Please give me some space.",
    note: "The request for distance is preserved without the aggressive silencing phrase.",
  },
  {
    input: "Fuck this stupid match.",
    displayInput: "[frustrated sporting criticism with profanity]",
    expect: "clean",
    note: "Untargeted frustration about the match is strong language, not personal abuse.",
  },
  {
    input: "You are such an idiot.",
    expect: "warning",
    expectNoRewrite: true,
    note: "A bare insult has no recoverable point, so K1ND does not manufacture disagreement.",
  },
  {
    input: "You played like a clown today.",
    expect: "warning",
    expectRewrite: "That performance was disappointing today.",
    note: "The timing and performance criticism are retained while the personal comparison is removed.",
  },
  {
    input: "Never play tennis again.",
    expect: "warning",
    expectRewrite: "That tennis performance was not good enough.",
    note: "The tennis criticism is retained without inventing encouragement.",
  },
  {
    input: "You are a disgrace to the sport.",
    expect: "warning",
    expectRewrite: "I don't think that performance lived up to expectations.",
    note: "The attack becomes performance-focused criticism.",
  },
  {
    input: "You bottled it again.",
    expect: "warning",
    expectRewrite: "You lost confidence at the key moment.",
    note: "Common sporting abuse is softened without losing the underlying point.",
  },
  {
    input: "Choking again. Embarrassing.",
    expect: "warning",
    expectRewrite: "That was disappointing; they seemed to lose confidence at the key moments.",
    note: "Multi-sentence criticism is rewritten coherently.",
  },
  {
    input: "Just retire already.",
    expect: "warning",
    expectRewrite: "I think it may be time to consider the next stage of your career.",
    note: "Aggressive retirement demands become a measured opinion.",
  },
  {
    input: "Go away forever.",
    expect: "warning",
    expectRewrite: "Please give me some space.",
    note: "Dismissive language is rewritten without inventing a sporting context.",
  },
  {
    input: "You are overrated and washed up.",
    expect: "warning",
    expectRewrite: "I don't think you are performing at your best right now.",
    note: "Stacked insults become current-performance criticism.",
  },
  {
    input: "This player is garbage.",
    expect: "warning",
    expectRewrite: "This player's performance was below-par.",
    note: "The person is separated from the performance.",
  },
  {
    input: "The umpire was blind.",
    expect: "warning",
    expectRewrite: "I think the official missed that call.",
    note: "A personal insult becomes criticism of the decision.",
  },
  {
    input: "You should be ashamed of yourself.",
    expect: "warning",
    expectRewrite: "I expected more from that performance.",
    note: "Shaming language becomes measured disappointment.",
  },
  {
    input: "That call was ridiculous 🖕",
    expect: "warning",
    expectRewrite: "That call was ridiculous.",
    note: "The obscene gesture is removed from an otherwise comprehensible criticism.",
  },
  {
    input: "What the fuck was that serve?",
    expect: "clean",
    note: "An emphatic reaction to a serve remains publishable when nobody is attacked.",
  },
  {
    input: "What the fuck?",
    expect: "clean",
    note: "An untargeted emotional exclamation is not forced through a rewrite.",
  },
  {
    input: "FUCK OFF!!!",
    expect: "warning",
    expectRewrite: "Please leave me alone.",
    note: "Capitalisation and repeated exclamation marks do not corrupt phrase recognition.",
  },
  {
    input: "Choking again! Embarrassing!",
    expect: "warning",
    expectRewrite: "That was disappointing; they seemed to lose confidence at the key moments.",
    note: "Exclamation punctuation remains punctuation rather than being treated as leetspeak.",
  },
  {
    input: "This is bullshit.",
    expect: "clean",
    note: "Strong rejection without a person-directed attack remains publishable.",
  },
  {
    input: "That serve was shit.",
    expect: "clean",
    note: "A profane opinion about a serve targets the sporting action, not a person.",
  },
  {
    input: "You were useless, never play football again.",
    expect: "warning",
    expectRewrite: "That football performance was not good enough.",
    note: "The named sport and performance criticism are retained without inventing encouragement.",
  },
  {
    input: "You are an idiot but your point is fair.",
    expect: "warning",
    expectRewrite: "Your point is fair.",
    note: "The constructive point is retained exactly; the engine does not invent disagreement.",
  },
  { input: "You suck.", expect: "warning", expectRewrite: "I don't think that was good enough.", note: "Common direct abuse triggers intervention." },
  { input: "You're worthless.", expect: "warning", expectNoRewrite:true },
  { input: "You're scum.", expect: "warning", expectNoRewrite:true },
  { input: "You're disgusting.", expect: "warning", expectNoRewrite:true },
  { input: "Go cry to your mum.", expect: "warning", expectNoRewrite:true },
  { input: "You're mentally weak.", expect: "warning", expectRewrite: "They seemed to lose confidence under pressure." },
  { input: "Fat cow.", expect: "warning", expectNoRewrite:true },
  { input: "You look ugly.", expect: "warning", expectNoRewrite:true },
  { input: "Nobody wants you here.", expect: "warning", expectNoRewrite:true },
  { input: "You're a piece of shit.", expect: "warning", expectNoRewrite:true },
  { input: "Your family must be proud of that garbage.", expect: "warning", expectRewrite: "That performance was disappointing." },
  { input: "What a fucking choke artist.", expect: "warning", expectRewrite: "They seemed to lose confidence at a key moment." },
  { input: "That player is a paedophile.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact.", note: "Serious safeguarding allegations are held for review." },
  { input: "That player is a rapist.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "She is doping.", expect: "review", expectRewrite: "I suspect there may be a doping issue, but I do not have evidence to verify it." },
  { input: "He's on steroids.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "The umpire took money to make that call.", expect: "review", expectRewrite: "That performance raised questions for me, but I don't have evidence of wrongdoing." },
  { input: "They paid off the referee.", expect: "review", expectRewrite: "That performance raised questions for me, but I don't have evidence of wrongdoing." },
  { input: "I'm going to destroy you in the final.", expect: "clean", note: "Explicit sporting hyperbole is not treated as a real-world threat." },
  { input: "I'm going to destroy you after the final.", expect: "block", note: "Threat exception stays narrowly limited to competition context." },
  { input: "I'm going to hurt you in the final.", expect: "block", note: "Literal violence remains blocked even in a sporting setting." },
  { input: "That was a brutal match.", expect: "clean", note: "Ordinary sporting metaphor remains allowed." },
  { input: "She murdered that forehand today.", expect: "clean", note: "Non-targeted sporting metaphor should not be over-blocked." },
  { input: "The team destroyed them 6-0.", expect: "clean", note: "Result commentary is allowed." },
  { input: "I think the referee had a poor game.", expect: "clean", note: "Constructive criticism remains clean." },
  { input: "I disagree with the decision and want it reviewed.", expect: "clean" },
  { input: "This performance was disappointing.", expect: "clean" },
  { input: "That outfit is bright yellow.", expect: "clean", note: "Appearance description without abuse remains allowed." },
  { input: "Everyone should report the abusive comment through the platform.", expect: "clean", note: "Safety coordination is not a pile-on." },
  { input: "I lost my bet because the favourite retired injured.", expect: "clean", note: "Betting discussion without targeting a person is not automatically abuse." },
  { input: "Please leave me alone.", expect: "clean" },
  { input: "That decision was terrible.", expect: "clean", note: "Harsh criticism of a sporting decision is allowed when it does not attack a person." },
  { input: "You are vile.", expect: "warning", expectNoRewrite:true },
  { input: "You are repulsive.", expect: "warning", expectNoRewrite:true },
  { input: "You are nothing.", expect: "warning", expectNoRewrite:true },
  { input: "Ugly pig.", expect: "warning", expectNoRewrite:true },
  { input: "You are so fat.", expect: "warning", expectNoRewrite:true },
  { input: "Go cry to daddy.", expect: "warning", expectNoRewrite:true },
  { input: "He is a sexual predator.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "The athlete is using performance enhancing drugs.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "She failed a drug test.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "I hope someone rapes you.", expect: "block", note: "Wishing sexual violence on a person is a hard block." },
  { input: "You deserve to be raped.", expect: "block" },
  { input: "Go get raped.", expect: "block" },
  { input: "Women belong in the kitchen.", expect: "block", note: "Explicit sex-based exclusion is discriminatory abuse." },
  { input: "Women are only good for cooking.", expect: "block" },
  { input: "That player is a cheat.", expect: "review", expectRewrite: "I am concerned about possible unfair conduct, but I do not have evidence to verify wrongdoing." },
  { input: "She is a racist.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "He is a nonce.", expect: "review", expectRewrite: "I have a serious concern, but I should not present an unverified allegation as fact." },
  { input: "Ugly bitch.", expect: "warning", expectNoRewrite:true },

  { input: "That was an awful performance.", expect: "clean", note: "Harsh performance criticism remains publishable." },
  { input: "That was a terrible pass.", expect: "clean", note: "Football action criticism is allowed." },
  { input: "What an awful shot.", expect: "clean", note: "Strong criticism of a sporting action is allowed." },
  { input: "That strategy was rubbish.", expect: "clean", note: "Tactical criticism stays publishable." },
  { input: "That was a dreadful pit stop.", expect: "clean", note: "Motorsport criticism stays publishable." },
  { input: "He was terrible today.", expect: "warning", note: "Direct personal degradation still triggers friction." },
  { input: "That was a terrible pass, you idiot.", expect: "warning", expectRewrite: "That was a terrible pass.", note: "The sporting opinion is preserved while the personal insult is removed." },
  { input: "That performance was awful, you idiot.", expect: "warning", expectRewrite: "That performance was awful.", note: "Harsh performance criticism survives the rewrite unchanged." },

  { input: "You useless fat cow, you bottled it again. Fuck off.", expect: "warning", expectRewrite: "You lost confidence at the key moment.", note: "Compound abuse keeps the recoverable confidence criticism while removing body abuse and dismissal." },
  { input: "You were useless, you bottled it again. Fuck off.", expect: "warning", expectRewrite: "You lost confidence at the key moment.", note: "Compound performance abuse keeps the recoverable confidence criticism rather than inserting generic positivity." },

  // Australian English: contextual personal abuse, banter-sensitive terms and literal counterexamples.
  { input:"You are a drongo.", expect:"warning", expectNoRewrite:true, note:"A bare Australian personal label receives friction without an invented opinion." },
  { input:"A galah landed beside the oval.", expect:"clean", note:"The literal Australian bird reference remains allowed." },
  { input:"You flamin galah.", expect:"warning", expectNoRewrite:true },
  { input:"That galah bird flew away.", expect:"clean" },
  { input:"You dropkick.", expect:"warning", expectNoRewrite:true },
  { input:"He practised a drop kick for goal.", expect:"clean", note:"Sporting vocabulary is not confused with the personal label." },
  { input:"You flog.", expect:"warning", expectNoRewrite:true },
  { input:"The club will flog old tickets.", expect:"clean", note:"The ordinary sale verb remains allowed." },
  { input:"You grub.", expect:"warning", expectNoRewrite:true },
  { input:"The gardener found a grub in the soil.", expect:"clean", note:"The literal insect reference remains allowed." },
  { input:"Stop being a sook.", expect:"warning", expectNoRewrite:true },
  { input:"I had a sook after the result.", expect:"clean", note:"Self-description is not treated as targeted abuse." },
  { input:"You bogan.", expect:"warning", expectNoRewrite:true },
  { input:"I am a proud bogan.", expect:"clean", note:"Reclaimed self-identification remains allowed." },
  { input:"You are a cooker.", expect:"warning", expectRewrite:"I don't think that claim is credible.", note:"The recoverable challenge to credibility is retained without the personal label." },
  { input:"Use the slow cooker.", expect:"clean", note:"The kitchen appliance remains allowed." },
  { input:"You deadshit.", expect:"warning", expectNoRewrite:true },
  { input:"You fuckwit.", expect:"warning", expectNoRewrite:true },
  { input:"Pull your head in.", expect:"warning", expectRewrite:"Please stop that behaviour.", note:"The direct request is retained without the confrontational idiom." },
  { input:"What a ratbag.", expect:"warning", expectNoRewrite:true },

  // Czech: person-directed labels, commands, severe abuse and educational counterexamples.
  { input:"Ty jsi blbec.", expect:"warning", expectNoRewrite:true },
  { input:"Slovo blbec je ve slovníku označeno jako urážka.", expect:"clean", note:"Czech dictionary discussion remains allowed." },
  { input:"Ten hráč je hajzl.", expect:"warning", expectNoRewrite:true },
  { input:"Drž hubu.", expect:"warning", expectRewrite:"Prosím, přestaň mluvit.", note:"The rewrite preserves the request in Czech and removes the aggressive silencing command." },
  { input:"Táhni do prdele.", expect:"warning", expectRewrite:"Prosím, nech mě být.", note:"The rewrite preserves the request for distance in Czech." },
  { input:"Chcípni.", expect:"block", note:"A Czech death wish is blocked." },
  { input:"Ty jsi píča.", displayInput:"[targeted Czech sexualised abuse]", expect:"block" },
  { input:"Ty jsi kurva.", displayInput:"[targeted Czech sexualised abuse variant]", expect:"block" },
  { input:"Výzkumník cituje slovo buzna v odborné analýze.", displayInput:"[Czech academic discussion of an identity slur]", expect:"clean" },
  { input:"Ty buzno.", displayInput:"[Czech homophobic slur]", expect:"block" },

  // Lithuanian: Baltic-language labels, dismissive abuse and literal/educational safeguards.
  { input:"Tu esi debilas.", expect:"warning", expectNoRewrite:true },
  { input:"Tu esi durnius.", expect:"warning", expectNoRewrite:true },
  { input:"Gaidys gieda kieme.", expect:"clean", note:"The literal Lithuanian rooster reference remains allowed." },
  { input:"Tu esi gaidys.", expect:"warning", expectNoRewrite:true, note:"The same word becomes animal-based ridicule when aimed at a person." },
  { input:"Eik šikt.", expect:"warning", expectRewrite:"Prašau, palik mane ramybėje.", note:"The rewrite preserves the request for distance in Lithuanian." },
  { input:"Tu esi pideras.", displayInput:"[Lithuanian homophobic slur]", expect:"block" },
  { input:"Tyrimas analizuoja žodį pideras kaip pavyzdį.", displayInput:"[Lithuanian academic discussion of a homophobic slur]", expect:"clean" },

  // Latvian: personal labels, dismissal, sexualised targeting and research safeguards.
  { input:"Tu esi stulbenis.", expect:"warning", expectNoRewrite:true },
  { input:"Tu esi lohs.", expect:"warning", expectNoRewrite:true },
  { input:"Ej dirst.", expect:"warning", expectRewrite:"Lūdzu, liec mani mierā.", note:"The rewrite preserves the request for distance in Latvian." },
  { input:"Tu esi mauka.", displayInput:"[targeted Latvian sexualised abuse]", expect:"block" },
  { input:"Mauka!", displayInput:"[untargeted Latvian strong profanity]", expect:"warning", expectNoRewrite:true },
  { input:"Tu esi pidars.", displayInput:"[Latvian homophobic slur]", expect:"block" },
  { input:"Pētījums analizē vārdu pidars.", displayInput:"[Latvian academic discussion of a homophobic slur]", expect:"clean" },

  // Estonian: Finnic-language coverage for the Baltic region with cross-language isolation.
  { input:"Sa oled loll.", expect:"warning", expectNoRewrite:true },
  { input:"See mõte on loll.", expect:"clean", note:"Criticism of an idea remains allowed and Czech target markers do not bleed into Estonian." },
  { input:"Sa oled sitapea.", expect:"warning", expectNoRewrite:true },
  { input:"Mine persse.", expect:"warning", expectRewrite:"Palun jäta mind rahule.", note:"The rewrite preserves the request for distance in Estonian." },
  { input:"Sa oled hoor.", displayInput:"[targeted Estonian sexualised abuse]", expect:"block" },
  { input:"Sa oled tibla.", displayInput:"[Estonian identity slur]", expect:"block" },
  { input:"Uurimus käsitleb sõna tibla ajaloolises kontekstis.", displayInput:"[Estonian academic discussion of an identity slur]", expect:"clean" },

  // Context intelligence: the same lexical wording can report, oppose, quote,
  // self-direct or discuss abuse rather than perform an attack.
  { input:"Don’t call her an idiot.", expect:"clean", note:"Counterspeech opposing an insult remains publishable." },
  { input:"He called me an idiot after the match.", expect:"clean", note:"Reporting received abuse is distinguished from performing it." },
  { input:"The word idiot is insulting.", expect:"clean", note:"Educational discussion of abusive vocabulary remains allowed." },
  { input:"I was an idiot for missing that shot.", expect:"clean", note:"Self-directed criticism is not treated as an attack on another participant." },
  { input:"That argument is stupid.", expect:"clean", note:"Criticism of an argument is distinguished from degrading its author." },
  { input:"Your argument is stupid.", expect:"clean", note:"A possessive target marker does not override the explicit idea target." },
  { input:"Stop saying ‘you are useless’ to athletes.", expect:"clean", note:"Preventive counterspeech can quote the wording it opposes." },
  { input:"She wrote ‘you are a clown’ in the chat, and I reported it.", expect:"clean", note:"Attributed and reported wording remains allowed." },
  { input:"‘You are an idiot.’", expect:"warning", expectNoRewrite:true, note:"Quotation marks alone are not a safe-context bypass." },
  { input:"Don’t call her an idiot, you moron.", expect:"warning", note:"A fresh attack outside counterspeech still receives intervention." },
  { input:"He is an idiot.", expect:"warning", expectNoRewrite:true, note:"Direct third-person degradation remains moderated." },
  { input:"The player is pathetic.", expect:"warning", note:"A person remains the target even in sporting context." },
  { input:"The phrase fuck off is vulgar.", expect:"clean", note:"Explicit linguistic discussion of profanity remains allowed." },
  { input:"He told me to fuck off.", expect:"clean", note:"Reported profanity is not treated as the author's command." },
  { input:"Fuck off.", expect:"warning", expectRewrite:"Please leave me alone.", note:"The direct command still receives an intent-preserving rewrite." },
  { input:"I reported the comment ‘fuck you’.", expect:"clean", note:"Reporting harmful content is recognised as counterspeech." },
  { input:"If someone calls her an idiot, report it.", expect:"clean", note:"A hypothetical safety instruction remains allowed." },
  { input:"Reporting this from the reply: You are an idiot.", expect:"clean", note:"Explicit reporting context changes the speech act." },
  { input:"Your tactics were clueless.", expect:"clean", note:"Harsh criticism of sporting tactics remains publishable." },
  { input:"Suppose I said you are an idiot.", expect:"warning", note:"Hypothetical framing alone does not create a moderation bypass." },

  // Presenter Shield: known abuse evasions intervene; uncertain targeted
  // obfuscation is held rather than silently published.
  { input:"Y o u are an i d i o t.", expect:"warning", expectNoRewrite:true, note:"Spelling out both target and insult does not bypass intervention." },
  { input:"You are an id.io.t.", expect:"warning", expectNoRewrite:true, note:"Partial punctuation inside a reviewed insult is normalised." },
  { input:"You are an i🤡d🤡i🤡o🤡t.", expect:"warning", expectNoRewrite:true, note:"Emoji separators do not bypass a reviewed personal-abuse term." },
  { input:"u r an 1d10t.", expect:"warning", note:"Shorthand targeting and leetspeak remain moderated." },
  { input:"You are a f o o l.", expect:"warning", expectNoRewrite:true },
  { input:"Spell idiot as i d i o t for the exercise.", expect:"clean", note:"Educational spelling remains publishable." },
  { input:"The term i.d.i.o.t is insulting.", expect:"clean", note:"Educational discussion is not mistaken for evasion." },
  { input:"You are x‍q‍z.", displayInput:"[targeted wording with invisible controls]", expect:"review", expectNoRewrite:true },
  { input:"You are x‮qz.", displayInput:"[targeted wording with bidirectional controls]", expect:"review", expectNoRewrite:true },
  { input:"y о u are xqz.", displayInput:"[mixed-script target with unknown label]", expect:"review", expectNoRewrite:true },
  { input:"The variables x‍q‍z are placeholders.", displayInput:"[technical use of invisible characters]", expect:"clean" },
  { input:"The Greek and Latin letters aа are compared.", displayInput:"[educational mixed-script comparison]", expect:"clean" },
  { input:"You are an ⓘⓓⓘⓞⓣ.", expect:"warning", expectNoRewrite:true, note:"Circled compatibility letters are normalised." },
  { input:"You are an 𝐢𝐝𝐢𝐨𝐭.", expect:"warning", expectNoRewrite:true, note:"Mathematical Unicode letters are normalised." },
  { input:"You are an i___d___i___o___t.", expect:"warning", expectNoRewrite:true },
  { input:"You are z•z•z•z.", displayInput:"[targeted unknown separated token]", expect:"review", expectNoRewrite:true, note:"Unknown targeted obfuscation is held without falsely labelling the token as abuse." },

  // Western European policy: high-confidence targeted rules plus native
  // rewrites for dismissive commands and educational counterexamples.
  { input:"Tú eres un idiota.", expect:"warning", expectNoRewrite:true },
  { input:"Vete a la mierda.", expect:"warning", expectRewrite:"Por favor, déjame en paz." },
  { input:"La palabra idiota aparece en el diccionario.", expect:"clean" },
  { input:"Ojalá te mueras.", expect:"block" },
  { input:"Tu es un imbécile.", expect:"warning", expectNoRewrite:true },
  { input:"Va te faire foutre.", expect:"warning", expectRewrite:"S’il te plaît, laisse-moi tranquille." },
  { input:"Le dictionnaire explique le mot imbécile.", expect:"clean" },
  { input:"Va crever.", expect:"block" },
  { input:"Du bist ein Trottel.", expect:"warning", expectNoRewrite:true },
  { input:"Verpiss dich.", expect:"warning", expectRewrite:"Bitte lass mich in Ruhe." },
  { input:"Das Wörterbuch erklärt das Wort Trottel.", expect:"clean" },
  { input:"Stirb.", expect:"block" },
  { input:"Sei un pagliaccio.", expect:"warning", expectNoRewrite:true },
  { input:"Vai a fanculo.", expect:"warning", expectRewrite:"Per favore, lasciami in pace." },
  { input:"Il dizionario spiega la parola pagliaccio.", expect:"clean" },
  { input:"Muori.", expect:"block" },
  { input:"Você é um palhaço.", expect:"warning", expectNoRewrite:true },
  { input:"Vai tomar no cu.", expect:"warning", expectRewrite:"Por favor, deixa-me em paz." },
  { input:"O dicionário explica a palavra palhaço.", expect:"clean" },
  { input:"Morre.", expect:"block" },
  { input:"Jij bent een sukkel.", expect:"warning", expectNoRewrite:true },
  { input:"Rot op.", expect:"warning", expectRewrite:"Laat me alsjeblieft met rust." },
  { input:"Het woordenboek legt het woord sukkel uit.", expect:"clean" },
  { input:"Sterf.", expect:"block" },

  // Product conversation envelopes: player and U18 target resolution,
  // cumulative targeting and protected speech acts.
  { input:"You are an idiot.", expect:"warning", expectNoRewrite:true, expectTargetRole:"professional athlete", context:{ isReply:true, replyTarget:{ id:"athlete-1", handle:"player", role:"verified_adult", isAthlete:true }, conversationHistory:[{ text:"Tough match.", authorId:"fan-1", outcome:"clean" }] } },
  { input:"You are an idiot.", expect:"review", expectNoRewrite:true, expectTargetRole:"U18 participant", context:{ isReply:true, replyTarget:{ id:"junior-1", handle:"junior", role:"verified_u18", isU18:true }, conversationHistory:[] } },
  { input:"You are useless.", expect:"review", expectPileOn:true, context:{ isReply:true, currentAuthorId:"fan-3", replyTarget:{ id:"athlete-1", handle:"player", role:"verified_adult", isAthlete:true }, priorTargetedInterventions:[{ authorId:"fan-1", outcome:"warning" }, { authorId:"fan-2", outcome:"warning" }] } },
  { input:"You are useless.", expect:"review", expectRepeatedTargeting:2, context:{ isReply:true, currentAuthorId:"fan-1", replyTarget:{ id:"athlete-1", handle:"player", role:"verified_adult", isAthlete:true }, priorTargetedInterventions:[{ authorId:"fan-1", outcome:"warning" }, { authorId:"fan-1", outcome:"warning" }] } },
  { input:"That performance was awful.", expect:"clean", context:{ isReply:true, replyTarget:{ id:"athlete-1", handle:"player", role:"verified_adult", isAthlete:true }, priorTargetedInterventions:[{ authorId:"fan-1", outcome:"warning" }, { authorId:"fan-2", outcome:"warning" }] }, note:"A pile-on signal does not suppress clean sporting criticism." },
  { input:"Don’t call her an idiot.", expect:"clean", expectTargetRole:"professional athlete", context:{ isReply:true, replyTarget:{ id:"athlete-1", handle:"player", role:"verified_adult", isAthlete:true } }, note:"Athlete awareness does not override genuine counterspeech." },
  { input:"He called me an idiot after the match.", expect:"clean", context:{ isReply:true, parentText:"You are an idiot.", replyTarget:{ id:"fan-1", handle:"fan", role:"verified_adult" } }, note:"Reported parent abuse remains publishable." },
  { input:"You are an idiot.", expect:"warning", expectNoRewrite:true, expectTargetScope:"reply target", context:{ isReply:true, replyTarget:{ id:"coach-1", handle:"coach", role:"verified_adult" }, parentTargetUserId:"athlete-1" }, note:"A nested reply resolves the current participant rather than carrying forward the old target." },

  // V4.11+ proposition-preserving rewrite contract. These fixtures prove that
  // the output is derived from the author's actual sporting point rather than
  // a generic courtesy message.
  { input:"Your first serve kept landing short, you useless clown.", expect:"warning", expectRewrite:"Your first serve kept landing short.", expectSourceBasis:"Your first serve kept landing short" },
  { input:"You moron; your return position was too deep all match.", expect:"warning", expectRewrite:"Your return position was too deep all match.", expectSourceBasis:"your return position was too deep all match" },
  { input:"That line call was fucking awful, you idiot.", expect:"warning", expectRewrite:"That line call was awful.", expectSourceBasis:"That line call was fucking awful" },
  { input:"Your tactical point about returning position is fair, you moron.", expect:"warning", expectRewrite:"Your tactical point about returning position is fair.", expectSourceBasis:"Your tactical point about returning position is fair" },
  { input:"You are a clown. The second serve was too predictable.", expect:"warning", expectRewrite:"The second serve was too predictable.", expectSourceBasis:"The second serve was too predictable" },
  { input:"That line call looked fixed because it changed after the challenge.", expect:"review", expectRewrite:"It changed after the challenge. That raised a concern for me, but I cannot verify wrongdoing." },
  { input:"That player is a cheat and she's doping.", expect:"review", expectRewrite:"I suspect there may be a doping issue, but I do not have evidence to verify it." },
  { input:"Your return position was too deep all match. You nigger.", displayInput:"[sporting point followed by a racial slur]", expect:"block", expectSafeDraft:"Your return position was too deep all match." },
  { input:"Your second serve kept landing short. I'm going to hurt you.", displayInput:"[sporting point followed by a threat]", expect:"block", expectSafeDraft:"Your second serve kept landing short.", expectSpeechAct:"threat" },
  { input:"Nigger.", displayInput:"[bare racial slur]", expect:"block", expectNoSafeDraft:true },
  { input:"You are pathetic.", expect:"warning", expectNoRewrite:true },

  // V4.12 cross-conversation and rewrite-choice contract.
  { input:"Your backhand preparation was late, you useless clown.", expect:"warning", expectRewrite:"Your backhand preparation was late.", expectRewriteOptions:2, expectClauseMap:true },
  { input:"Mara is useless.", expect:"warning", expectNoRewrite:true, expectTargetScope:"named participant", context:{ participantAliases:[{ term:"mara", profile:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true } }] } },
  { input:"That champion is pathetic.", expect:"warning", expectNoRewrite:true, expectTargetScope:"indirect participant reference", context:{ lastReferencedParticipant:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true } } },
  { input:"Her mother is an idiot.", expect:"warning", expectNoRewrite:true, expectTargetScope:"indirect participant reference", context:{ lastReferencedParticipant:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true } } },
  { input:"You are useless.", expect:"review", expectCrossThread:3, context:{ isReply:true, currentAuthorId:"fan-7", replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true }, behaviourHistory:[{ authorId:"fan-7", targetId:"athlete-1", outcome:"warning" }, { authorId:"fan-7", targetId:"athlete-1", outcome:"warning" }, { authorId:"fan-7", targetId:"athlete-1", outcome:"review" }] } },
  { input:"You are useless.", expect:"review", expectCrossThread:2, context:{ isReply:true, eventWindow:"post_match", currentAuthorId:"fan-8", replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true }, behaviourHistory:[{ authorId:"fan-8", targetId:"athlete-1", outcome:"warning" }, { authorId:"fan-8", targetId:"athlete-1", outcome:"warning" }] } },
  { input:"That backhand preparation was late.", expect:"clean", context:{ isReply:true, eventWindow:"post_match", currentAuthorId:"fan-8", replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true }, behaviourHistory:[{ authorId:"fan-8", targetId:"athlete-1", outcome:"warning" }, { authorId:"fan-8", targetId:"athlete-1", outcome:"review" }] }, note:"Behaviour memory does not suppress clean, specific sporting criticism." },

  ...PRIORITY_GLOBAL_TEST_CASES,
  ...NEXT_WAVE_TEST_CASES,
  ...V412_LANGUAGE_TEST_CASES,
  ...V412_SIGNAL_TEST_CASES,
  ...SEMANTIC_INTENT_TEST_CASES,

];
