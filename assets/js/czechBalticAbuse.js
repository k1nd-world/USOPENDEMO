// K1ND.world v4.8 — Czech and Baltic-region abuse policy pack.
// Czech is West Slavic. Lithuanian and Latvian are Baltic languages; Estonian
// is a Finnic language included here as part of the Baltic regional pack.

export const CZECH_BALTIC_PACK_VERSION = "2026.08-cz-baltic-1";

export const CZECH_BALTIC_ABUSE_RULES = [
  { id:"cz-personal-labels", language:"Czech · West Slavic", displayTerm:"blbec · debil · kretén · hajzl · zmrd · čurák · kokot · sráč", forms:"blb(?:ec|ce|ci)|debil(?:e|ka|ko|i)?|kreten(?:e|i)?|hajzl(?:e|i)?|zmrd(?:e|i)?|curak(?:u|i)?|kokot(?:e|i)?|srac(?:i)?", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"Czech personal labels ranging from fool/idiot to strong genital or scatological abuse are moderated when directed at a person.", safeExample:"Slovo ‘blbec’ je ve slovníku označeno jako urážka." },
  { id:"cz-sexualised-target", language:"Czech · West Slavic", displayTerm:"píča · targeted kurva", forms:"pica|kurva", mode:"sexualised", outcome:"block", untargetedOutcome:"warning", mechanism:"sexualised_misogyny", rationale:"When used as a noun or vocative for a person, these are severe sexualised terms of abuse; untargeted profanity is handled proportionately.", safeExample:"Lingvista vysvětluje význam slova ‘kurva’." },
  { id:"cz-dismissal", language:"Czech · West Slavic", displayTerm:"drž hubu · táhni do prdele", forms:"drz\\s+hubu|tahni\\s+do\\s+prdele", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"These are aggressive commands to silence or dismiss another person.", safeExample:"Článek překládá frázi ‘drž hubu’." },
  { id:"cz-death-wish", language:"Czech · West Slavic", displayTerm:"chcípni", forms:"chcipni", mode:"prohibited", outcome:"block", mechanism:"harm", rationale:"The imperative tells the target to die and is treated as encouragement or wishing of harm.", safeExample:"Slovo ‘chcípni’ je uvedeno pouze jako překladový příklad." },
  { id:"cz-identity-slurs", language:"Czech · West Slavic", displayTerm:"high-confidence Czech identity slurs", forms:"buzn(?:a|o|y)|cigos(?:i|e)?|negr(?:e|i)?", mode:"prohibited", outcome:"block", mechanism:"identity_slur", rationale:"High-confidence homophobic, ethnic or racial slur forms are blocked without a publication bypass.", safeExample:"Výzkumník cituje urážlivé slovo v odborné analýze." },

  { id:"lt-personal-labels", language:"Lithuanian · Baltic", displayTerm:"debilas · durnius · idiotas · lochas · gaidys", forms:"debil(?:as|e|ai|u)|durn(?:ius|iau|iai)|idiot(?:as|e|ai)|loch(?:as|e|ai)|gaid(?:ys|y|ziai)", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"These Lithuanian labels function as fool, idiot, loser or animal-based personal abuse when directed at somebody.", safeExample:"Gaidys gieda kieme. (The rooster crows in the yard.)" },
  { id:"lt-dismissal", language:"Lithuanian · Baltic", displayTerm:"eik šikt", forms:"eik\\s+sikt", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"The phrase is a vulgar command telling another person to go away.", safeExample:"Žodynas paaiškina frazę ‘eik šikt’." },
  { id:"lt-homophobic-slur", language:"Lithuanian · Baltic", displayTerm:"high-confidence Lithuanian homophobic slur", forms:"p[yi]der(?:as|e|ai)", mode:"prohibited", outcome:"block", mechanism:"homophobic_slur", rationale:"A high-confidence homophobic slur is blocked; quoted educational discussion is exempted.", safeExample:"Tyrimas analizuoja homofobinį žodį kaip duomenų pavyzdį." },

  { id:"lv-personal-labels", language:"Latvian · Baltic", displayTerm:"stulbenis · lohs · idiots · debils", forms:"stulben(?:is|e|i)|loh(?:s|u|i)|idiot(?:s|e|i)|debil(?:s|ais|a|i)", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"These Latvian fool/idiot/loser labels receive intervention when used against a person.", safeExample:"Vārdnīca skaidro vārdu ‘stulbenis’." },
  { id:"lv-sexualised-target", language:"Latvian · Baltic", displayTerm:"mauka", forms:"mauk(?:a|as|u)", mode:"sexualised", outcome:"block", untargetedOutcome:"warning", mechanism:"sexualised_misogyny", rationale:"Directed at a person, the word is sexualised misogynistic abuse; an untargeted exclamation receives profanity friction.", safeExample:"Pētnieks apspriež vārda ‘mauka’ lietojumu." },
  { id:"lv-dismissal", language:"Latvian · Baltic", displayTerm:"ej dirst", forms:"ej\\s+dirst", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"The phrase is a vulgar command telling another person to go away.", safeExample:"Vārdnīca tulko frāzi ‘ej dirst’." },
  { id:"lv-homophobic-slur", language:"Latvian · Baltic", displayTerm:"high-confidence Latvian homophobic slur", forms:"pidar(?:s|i|u)", mode:"prohibited", outcome:"block", mechanism:"homophobic_slur", rationale:"A high-confidence homophobic slur is blocked without a bypass.", safeExample:"Pētījums citē homofobisku apzīmējumu analīzes nolūkā." },

  { id:"et-personal-labels", language:"Estonian · Finnic (Baltic region)", displayTerm:"loll · jobu · idioot · debiilik · sitapea · värdjas", forms:"loll(?:id|i)?|jobu(?:d)?|idioot(?:i|id)?|debiilik(?:u|ud)?|sitapea(?:d)?|vardjas(?:e|ed)?", mode:"targeted", outcome:"warning", mechanism:"personal_degradation", rationale:"These Estonian labels function as fool, jerk, idiot, shithead or bastard when directed at a person.", safeExample:"See mõte on loll. (That idea is stupid.)" },
  { id:"et-dismissal", language:"Estonian · Finnic (Baltic region)", displayTerm:"mine perse / persse", forms:"mine\\s+perss?e", mode:"phrase", outcome:"warning", mechanism:"dismissive_command", rationale:"The phrase is a vulgar directive telling another person to go away.", safeExample:"Sõnaraamat selgitab väljendit ‘mine persse’." },
  { id:"et-sexualised-target", language:"Estonian · Finnic (Baltic region)", displayTerm:"hoor", forms:"hoor(?:a|ad|aks)?", mode:"sexualised", outcome:"block", untargetedOutcome:"warning", mechanism:"sexualised_misogyny", rationale:"Directed at a person, the term is sexualised misogynistic abuse.", safeExample:"Keeleteadlane arutab sõna ‘hoor’ ajalugu." },
  { id:"et-identity-slurs", language:"Estonian · Finnic (Baltic region)", displayTerm:"high-confidence Estonian identity slurs", forms:"tibla(?:d)?|pede(?:d)?", mode:"prohibited", outcome:"block", mechanism:"identity_slur", rationale:"High-confidence ethnic and homophobic slur forms are blocked; educational quotation remains allowed.", safeExample:"Uurimus käsitleb solvavat sõna ajaloolises kontekstis." },
];

const EDUCATIONAL = /\b(?:word|term|phrase|dictionary|definition|means?|meaning|translate|translation|quoted?|research|study|analysis|example|slovo|vyraz|znamena|slovnik|zodis|reiskia|zodynas|vards|nozime|vardnica|sona|tahendab|sonaraamat|uurimus|pet(?:nieks|ijums)|tyrimas|lingvist(?:a|ika))\b/;
const COMMON_TARGETS = "you|u|he|she|they|player|athlete";
const LANGUAGE_TARGETS = {
  cz:"ty|jsi|on|ona|hrac|hracka",
  lt:"tu|tave|tavo|jis|ji|zaidejas|zaideja",
  lv:"tu|tevi|tavs|vins|vina|speletajs|speletaja",
  et:"sa|sina|sind|tema|mangija",
};

function targetPattern(rule) {
  const language = rule.id.slice(0, 2);
  return `(?:${COMMON_TARGETS}|${LANGUAGE_TARGETS[language]}|@[a-z0-9_.-]+)`;
}

function has(rule, norm) { return new RegExp(`\\b(?:${rule.forms})\\b`).test(norm); }
function targeted(rule, norm) {
  const term = `(?:${rule.forms})`;
  const target = targetPattern(rule);
  return new RegExp(`(?:\\b${target}\\b|@[a-z0-9_.-]+)[^.!?]{0,32}\\b${term}\\b|\\b${term}\\b[^.!?]{0,24}(?:\\b${target}\\b|@[a-z0-9_.-]+)`).test(norm);
}

export function moderateCzechBalticAbuse(norm, original) {
  if (EDUCATIONAL.test(norm)) return null;
  const rule = CZECH_BALTIC_ABUSE_RULES.find((candidate) => has(candidate, norm));
  if (!rule) return null;
  const isTargeted = targeted(rule, norm);

  if (rule.mode === "targeted" && !isTargeted) return null;
  if (rule.mode === "sexualised") {
    const accentedCzechForm = rule.id === "cz-sexualised-target" && /\bpíča\b/iu.test(original);
    if (!isTargeted && rule.id === "cz-sexualised-target" && !accentedCzechForm) return null;
    const outcome = isTargeted ? rule.outcome : rule.untargetedOutcome;
    return { outcome, category:rule.mechanism, reason:isTargeted ? "Targeted regional sexualised abuse" : "Regional strong profanity", czechBalticRule:rule.id, policyRationale:rule.rationale };
  }

  return {
    outcome:rule.outcome,
    category:rule.mechanism,
    reason:rule.mechanism === "harm" ? "Wishing or encouraging death" : rule.mode === "prohibited" ? "Identity-based regional slur" : rule.mode === "phrase" ? "Regional dismissive abuse" : "Targeted Czech/Baltic-region abuse",
    czechBalticRule:rule.id,
    policyRationale:rule.rationale,
  };
}
