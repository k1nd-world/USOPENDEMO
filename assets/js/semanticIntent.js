// K1ND.world v4.19 — clause-level semantic context and intent reasoning.
//
// This layer explains how each clause functions and compares that reading with
// the lexical/context policy. It may add an intervention for a high-confidence
// implicit personal attack, but it can never weaken a severe-harm decision.

export const SEMANTIC_INTENT_VERSION = "2026.09-semantic-1";

const SEVERE_CATEGORIES = new Set([
  "self_harm_encouragement", "threat", "harm", "sexual_abuse", "slur",
  "racial_slur", "identity_slur", "homophobic_slur", "hate_symbol",
  "dehumanising", "severe_abuse", "discriminatory", "personal_contact",
  "doxxing", "targeted_violence", "sexual_violence", "identity_hate",
]);

const PROFANITY_RE = /\b(?:fuck(?:ing|ed)?|shit(?:ty)?|shite|bullshit|piss(?:ed)?|damn|goddamn|bollocks|crap(?:py)?)\b/gi;
const PERSON_RE = /\b(?:you|u|your|yours|yourself|he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|official|coach|fan|@[a-z0-9_.-]+)\b/i;
const SPORT_RE = /\b(?:performance|match|game|set|result|decision|call|shot|serve|return|rally|point|forehand|backhand|volley|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|goal|save|team|final|tournament)\b/i;
const IDEA_RE = /\b(?:argument|point|idea|claim|take|opinion|view|analysis|reasoning|proposal|comment|message|post)\b/i;
const PRAISE_RE = /\b(?:great|brilliant(?:ly)?|amazing(?:ly)?|incredible|fantastic(?:ally)?|beautiful(?:ly)?|stunning|excellent|magnificent|perfect(?:ly)?|awesome|sensational|quality|love|loved)\b/i;
const NEGATIVE_EVALUATION_RE = /\b(?:hate|hated|frustrating|awful|terrible|poor|bad|dreadful|shocking|disappointing|stupid|idiotic|clueless|useless|pathetic|hopeless|garbage|trash|rubbish|shit|shite|crap)\b/i;
const PERSONAL_LABEL_RE = /\b(?:idiot|moron|clown|loser|fool|genius|hero|champ|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b/i;
const DIRECT_ATTACK_RE = /\b(?:you|u|he|she|they|player|athlete|umpire|referee|official|coach|fan|@[a-z0-9_.-]+)\b[^.!?;]{0,28}\b(?:idiot|moron|clown|loser|fool|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b|\b(?:idiot|moron|clown|loser|fool|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b[^.!?;]{0,16}\b(?:you|u|him|her|them|player|athlete|umpire|referee|official|coach|fan)\b/i;
const DIRECTED_PROFANITY_RE = /\b(?:fuck|screw)\s+(?:you|u|him|her|them|that\s+player|this\s+player|the\s+player|@[a-z0-9_.-]+)\b|\b(?:fuck|piss)\s+off\b|\b(?:go\s+)?fuck\s+yourself\b|\b(?:shut\s+(?:the\s+)?fuck\s+up|stfu)\b/i;
const THREAT_RE = /\b(?:i(?:'|’)m|i am|i(?:'|’)ll|i will|gonna)\s+(?:(?:fucking|bloody|damn|goddamn)\s+)*(?:kill|hurt|stab|shoot|attack|beat|choke|strangle|kidnap|bomb|burn|poison)\s+(?:you|him|her|them|your family|that player)\b|\b(?:watch your back|i know where you live|coming for you)\b/i;
const REPORTING_RE = /\b(?:said|says|wrote|posted|sent|called|told|quoted|repeated|received|reported|reporting|flagged|documented|screenshot|message\s+said|comment\s+said)\b/i;
const COUNTERSPEECH_RE = /\b(?:(?:do\s+not|don['’]?t|never|stop|quit|shouldn['’]?t|should\s+not)\s+(?:call(?:ing)?|say(?:ing)?|tell(?:ing)?|send(?:ing)?|post(?:ing)?|writ(?:e|ing)|us(?:e|ing)|repeat(?:ing)?)|(?:condemn|reject|challenge|report|flag|remove|oppose|criticise|criticize)(?:ed|ing|s)?\s+(?:that|this|the)?\s*(?:abuse|insult|slur|comment|message|language)?)\b/i;
const EDUCATIONAL_RE = /\b(?:word|term|phrase|definition|dictionary|translation|translate|linguistic|etymology|dataset|research|study|analysis|moderation|policy|example|means?|meaning)\b/i;
const SELF_RE = /\b(?:i\s+(?:am|was|acted|behaved|felt|looked)|i['’]?m|myself|my\s+own)\b/i;
const SARCASM_ATTACK_RE = /\b(?:nice|great|brilliant|excellent)\s+(?:one|job|work|going)?\s*[,—-]\s*(?:genius|hero|champ)\b|\bthanks?\s+for\s+(?:losing|throwing|ruining|bottling)[^.!?]{0,30}\b(?:genius|hero|champ)\b/i;

function fold(value) {
  return String(value || "")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[’]/g, "'").replace(/\s+/g, " ").trim();
}

function splitClauses(text) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return [];
  const pieces = compact
    .split(/(?<=[.!?;])\s+|,\s+(?=(?:you|u|he|she|they|@[a-z0-9])\b)|\s+(?=(?:but|however|although|yet|because|while)\b)/i)
    .map((item) => item.trim()).filter(Boolean);
  return (pieces.length ? pieces : [compact]).slice(0, 12);
}

function profanityFunction(norm, act, targetType) {
  const present = PROFANITY_RE.test(norm);
  PROFANITY_RE.lastIndex = 0;
  if (!present) return { present:false, id:"none", label:"none", abuseSignal:false };
  if (act === "threat") return { present:true, id:"harm_intensifier", label:"harm-intensifying profanity", abuseSignal:true };
  if (act === "dismissal" || act === "personal_attack") return { present:true, id:"directed_hostility", label:"person-directed hostility", abuseSignal:true };
  if (act === "praise") return { present:true, id:"positive_intensifier", label:"positive emotional intensifier", abuseSignal:false };
  if (targetType === "sporting_action") return { present:true, id:"sporting_emphasis", label:"emphatic sporting reaction", abuseSignal:false };
  if (act === "reported_speech" || act === "counterspeech" || act === "analysis") return { present:true, id:"attributed_language", label:"reported, opposed or analysed profanity", abuseSignal:false };
  return { present:true, id:"untargeted_expression", label:"untargeted emotional expression", abuseSignal:false };
}

function clauseTarget(norm, context) {
  if (/@[a-z0-9_.-]+/i.test(norm)) return { type:"person", basis:"named account" };
  if (IDEA_RE.test(norm)) return { type:"idea", basis:"idea or statement" };
  if (SPORT_RE.test(norm) && !DIRECT_ATTACK_RE.test(norm)) return { type:"sporting_action", basis:"sporting object or performance" };
  if (PERSON_RE.test(norm)) return { type:"person", basis:"person-reference language" };
  if (context?.isReply) return { type:"reply_context", basis:"reply envelope only" };
  return { type:"none", basis:"no target resolved" };
}

function classifyClause(text, index, context) {
  const norm = fold(text);
  let target = clauseTarget(norm, context);
  const reporting = REPORTING_RE.test(norm);
  const counter = COUNTERSPEECH_RE.test(norm);
  const educational = EDUCATIONAL_RE.test(norm);
  const selfDirected = SELF_RE.test(norm) && !/\byou\b/i.test(norm);
  let act = "general_expression";
  let label = "general expression";
  let harmful = false;
  let confidence = "medium";
  let mechanism = "none detected";

  if (counter) { act = "counterspeech"; label = "opposing or preventing abuse"; confidence = "high"; }
  else if (reporting) { act = "reported_speech"; label = "reporting or quoting another person's wording"; confidence = "high"; }
  else if (educational) { act = "analysis"; label = "analysing language or policy"; confidence = "high"; }
  else if (THREAT_RE.test(norm)) { act = "threat"; label = "threatening a person"; harmful = true; confidence = "high"; mechanism = "violent intimidation"; }
  else if (DIRECTED_PROFANITY_RE.test(norm)) { act = "dismissal"; label = "directing hostility or dismissal"; harmful = true; confidence = "high"; mechanism = "person-directed hostility"; }
  else if (SARCASM_ATTACK_RE.test(norm)) { act = "implicit_personal_attack"; label = "sarcastic personal degradation"; harmful = true; confidence = "high"; mechanism = "contempt disguised as praise"; target = { type:"person", basis:"sarcastic vocative label" }; }
  else if (DIRECT_ATTACK_RE.test(norm)) { act = "personal_attack"; label = "degrading a person"; harmful = true; confidence = "high"; mechanism = "personal degradation"; }
  else if (selfDirected && PERSONAL_LABEL_RE.test(norm)) { act = "self_criticism"; label = "self-directed criticism"; confidence = "high"; }
  else if (PRAISE_RE.test(norm) && !NEGATIVE_EVALUATION_RE.test(norm)) { act = "praise"; label = "expressing praise"; confidence = "high"; }
  else if (target.type === "sporting_action" && NEGATIVE_EVALUATION_RE.test(norm)) { act = "sporting_criticism"; label = "criticising play or performance"; confidence = "high"; }
  else if (target.type === "idea" && NEGATIVE_EVALUATION_RE.test(norm)) { act = "idea_criticism"; label = "criticising an idea or statement"; confidence = "high"; }
  else if (PROFANITY_RE.test(norm)) { act = "emotional_expression"; label = "expressing strong emotion"; confidence = "medium"; }
  PROFANITY_RE.lastIndex = 0;

  const profanity = profanityFunction(norm, act, target.type);
  return {
    id:`clause-${index + 1}`,
    ordinal:index + 1,
    characters:String(text || "").length,
    target,
    speechAct:{ id:act, label },
    stance:counter ? "opposes harmful wording" : reporting ? "attributes wording to another speaker" : educational ? "analytical" : selfDirected ? "self-directed" : "authorial",
    profanity,
    harmful,
    mechanism,
    confidence,
    rawTextReturned:false,
  };
}

function withoutProfanity(text) {
  return String(text || "").replace(PROFANITY_RE, " ").replace(/\s+/g, " ").trim();
}

function withoutPersonTarget(text) {
  return String(text || "")
    .replace(/,?\s*\b(?:genius|hero|champ)\b/gi, " ")
    .replace(/@[a-z0-9_.-]+|\b(?:you|u|your|yours|yourself|he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|official|coach|fan)\b/gi, " ")
    .replace(/\s+/g, " ").trim();
}

function counterfactual(label, transformed, context) {
  const clauses = splitClauses(transformed).map((part, index) => classifyClause(part, index, context));
  const harmful = clauses.some((item) => item.harmful);
  const dominant = clauses.find((item) => item.harmful) || clauses[0];
  return { label, harmful, dominantSpeechAct:dominant?.speechAct?.label || "no remaining speech act", rawTextReturned:false };
}

export function analyzeSemanticIntent(text, decision, context = {}) {
  const clauses = splitClauses(text).map((part, index) => classifyClause(part, index, context));
  const harmfulClauses = clauses.filter((item) => item.harmful);
  const safeClauses = clauses.filter((item) => !item.harmful);
  const severeFloor = decision?.outcome === "block" || SEVERE_CATEGORIES.has(decision?.category);
  const implicitAttack = clauses.some((item) => item.speechAct.id === "implicit_personal_attack");
  const semanticOutcome = severeFloor ? decision.outcome : implicitAttack && decision?.outcome === "clean" ? "warning" : decision?.outcome;
  const disagreement = semanticOutcome !== decision?.outcome;
  const withoutProfanityResult = counterfactual("Remove profanity", withoutProfanity(text), context);
  const withoutTargetResult = counterfactual("Remove person target", withoutPersonTarget(text), context);
  const profanityChangedHarm = harmfulClauses.some((item) => item.profanity.present) && !withoutProfanityResult.harmful;
  const targetChangedHarm = harmfulClauses.length > 0 && !withoutTargetResult.harmful;
  const dominant = harmfulClauses[0] || clauses[0] || null;
  return {
    version:SEMANTIC_INTENT_VERSION,
    clauses,
    summary:{
      clauseCount:clauses.length,
      harmfulClauses:harmfulClauses.length,
      safeClauses:safeClauses.length,
      dominantSpeechAct:dominant?.speechAct?.label || "no speech act",
      mixedIntent:harmfulClauses.length > 0 && safeClauses.length > 0,
    },
    counterfactuals:[
      { ...withoutProfanityResult, conclusion:profanityChangedHarm ? "The harm depends on how profanity is directed." : "Removing profanity does not create or erase the independently detected intent." },
      { ...withoutTargetResult, conclusion:targetChangedHarm ? "The person target is necessary to the harmful reading." : "No person-target dependency changes the result." },
    ],
    severeFloor:{ locked:severeFloor, reason:severeFloor ? "A severe-harm family is non-downgradable." : "No severe-harm floor was invoked." },
    recommendation:{ outcome:semanticOutcome, reason:implicitAttack ? "Clause reasoning detected high-confidence contempt disguised as praise." : "Clause reasoning agrees with the policy outcome." },
    disagreement:{ present:disagreement, baseline:decision?.outcome || "unknown", semantic:semanticOutcome || "unknown", route:disagreement ? "semantic intervention" : "none" },
    confidence:clauses.some((item) => item.confidence === "medium") ? "bounded" : "high for represented patterns",
    rawTextReturned:false,
  };
}

export function applySemanticPolicy(result, semantic) {
  if (!result || !semantic || semantic.severeFloor.locked || !semantic.disagreement.present) return result;
  if (result.outcome === "clean" && semantic.recommendation.outcome === "warning") {
    return {
      ...result,
      outcome:"warning",
      category:"implicit_personal_attack",
      reason:"Implicit personal degradation",
      policyRationale:"Clause-level reasoning found a person-directed taunt whose praise wording functions as contempt. The sporting opinion can be restated without the personal label.",
      semanticOverride:"implicit_personal_attack",
    };
  }
  return result;
}

export const SEMANTIC_INTENT_TEST_CASES = [
  { input:"What a fucking shot!", expect:"clean", expectSemanticAct:"expressing strong emotion" },
  { input:"That serve was fucking awful.", expect:"clean", expectSemanticAct:"criticising play or performance" },
  { input:"Fuck yes, what a point.", expect:"clean", expectSemanticAct:"expressing strong emotion" },
  { input:"She played fucking brilliantly.", expect:"clean", expectSemanticAct:"expressing praise" },
  { input:"I hated that fucking decision.", expect:"clean", expectSemanticAct:"criticising play or performance" },
  { input:"That argument is fucking stupid.", expect:"clean", expectSemanticAct:"criticising an idea or statement" },
  { input:"He told me to fuck off.", expect:"clean", expectSemanticAct:"reporting or quoting another person's wording" },
  { input:"Don't tell players to fuck off.", expect:"clean", expectSemanticAct:"opposing or preventing abuse" },
  { input:"The phrase fuck off is aggressive.", expect:"clean", expectSemanticAct:"analysing language or policy" },
  { input:"I was a fucking idiot for missing that shot.", expect:"clean", expectSemanticAct:"self-directed criticism" },
  { input:"Nice job, genius.", expect:"warning", expectSemanticAct:"sarcastic personal degradation", expectNoRewrite:true },
  { input:"Great work, hero.", expect:"warning", expectSemanticAct:"sarcastic personal degradation", expectNoRewrite:true },
  { input:"Thanks for losing that point, genius.", expect:"warning", expectSemanticAct:"sarcastic personal degradation", expectNoRewrite:true },
  { input:"That shot was brilliant; you are an idiot.", expect:"warning", expectMixedIntent:true },
  { input:"Your first serve was short, you fucking clown.", expect:"warning", expectMixedIntent:true },
  { input:"Fuck off.", expect:"warning", expectSemanticAct:"directing hostility or dismissal" },
  { input:"You fucking idiot.", expect:"warning", expectSemanticAct:"degrading a person" },
  { input:"That player is fucking useless.", expect:"warning", expectSemanticAct:"degrading a person" },
  { input:"That player is fucking brilliant.", expect:"clean", expectSemanticAct:"expressing praise" },
  { input:"That idea is stupid; the argument is fair.", expect:"clean", expectSemanticAct:"criticising an idea or statement" },
  { input:"I will fucking hurt you.", expect:"block", expectSevereFloor:true },
  { input:"Kill yourself.", expect:"block", expectSevereFloor:true },
  { input:"I'm going to stab you after the match.", expect:"block", expectSevereFloor:true },
  { input:"Your serve was late; I will hurt you outside.", expect:"block", expectSevereFloor:true, expectMixedIntent:true },
  { input:"‘Fuck off.’", expect:"warning", expectSemanticAct:"directing hostility or dismissal" },
];
