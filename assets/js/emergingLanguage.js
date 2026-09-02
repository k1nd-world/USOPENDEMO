// K1ND.world v4.8 — reviewed emerging-language policy pack.
// New language is isolated here so it can be versioned, tested and audited.

export const EMERGING_LANGUAGE_VERSION = "2026.08";

export const EMERGING_LANGUAGE_RULES = [
  { id:"unalive-self", term:"unalive yourself", outcome:"block", mechanism:"self_harm_encouragement", mode:"phrase", rewrite:null, rationale:"A euphemistic instruction encouraging self-harm carries the same risk as an explicit instruction.", safeExample:"The villain was unalived in the story." },
  { id:"npc-person", term:"NPC", outcome:"warning", mechanism:"dehumanising_label", mode:"targeted", rewrite:"I disagree with you, but I want to respond to what you said rather than reduce you to a label.", rationale:"The term reduces a person to a non-person/player-controlled object when used as a direct label.", safeExample:"NPC characters can make games feel repetitive." },
  { id:"bot-person", term:"bot", outcome:"warning", mechanism:"dehumanising_label", mode:"targeted", rewrite:"I don't think that contribution was good enough, but I want to keep the criticism constructive.", rationale:"Directly labelling a participant as a bot dismisses their agency rather than addressing their contribution.", safeExample:"The support bot answered quickly." },
  { id:"mid-person", term:"mid", outcome:"warning", mechanism:"personal_degradation", mode:"targeted", rewrite:"I don't think you are performing at your best right now.", rationale:"The term becomes personal degradation when it labels a person; criticism of an action or work remains allowed.", safeExample:"That album was mid." },
  { id:"cooked-person", term:"cooked", outcome:"warning", mechanism:"personal_degradation", mode:"second_person", rewrite:"I don't think you are performing at your best right now.", rationale:"A direct second-person taunt targets the participant, while team or match commentary remains ordinary sporting opinion.", safeExample:"This team is cooked after that injury." },
  { id:"washed-person", term:"washed", outcome:"warning", mechanism:"personal_degradation", mode:"targeted", rewrite:"I don't think you are performing at your best right now.", rationale:"Used as a direct identity label, the phrase degrades the person rather than a specific performance.", safeExample:"That was a washed-out match." },
  { id:"delulu-person", term:"delulu", outcome:"warning", mechanism:"mental_state_ridicule", mode:"targeted", rewrite:"I disagree with that view, but I want to explain why respectfully.", rationale:"Applied to a person, the term ridicules their perceived mental state; criticism of an idea remains allowed.", safeExample:"That is a delulu take." },
  { id:"glazer-person", term:"glazer", outcome:"warning", mechanism:"personal_ridicule", mode:"targeted", variants:"glaz(?:er|ers|ing)", rewrite:"I think that praise goes too far, but I want to discuss the opinion rather than insult the person.", rationale:"The wording attacks the speaker for praising someone rather than engaging with the praise.", safeExample:"There is too much glazing in that review." },
  { id:"yapper-person", term:"yapper", outcome:"warning", mechanism:"silencing_ridicule", mode:"targeted", variants:"yapp(?:er|ers|ing)", rewrite:"I disagree, but I want to respond to the point respectfully.", rationale:"The label dismisses a participant's right to speak instead of responding to their point.", safeExample:"We spent the evening yapping about the match." },
  { id:"skill-issue", term:"skill issue", outcome:"warning", mechanism:"taunting", mode:"second_person", rewrite:"That was a difficult performance, but I want to keep the criticism constructive.", rationale:"Directed at another participant, the phrase is a belittling taunt rather than specific sporting criticism.", safeExample:"The analysis identified a technical skill issue." },
  { id:"touch-grass", term:"touch grass", outcome:"warning", mechanism:"dismissal", mode:"direct", rewrite:"I disagree, but I want to keep this respectful.", rationale:"The imperative dismisses a participant rather than addressing their contribution.", safeExample:"I need to go outside and touch grass." },
  { id:"cry-more", term:"cry more", outcome:"warning", mechanism:"taunting", mode:"direct", rewrite:"I disagree, but I want to keep this respectful.", rationale:"The phrase mocks another person's emotional response and escalates conflict.", safeExample:"The coach said the baby may cry more tonight." },
  { id:"delete-account", term:"delete your account", outcome:"warning", mechanism:"exclusion", mode:"phrase", rewrite:"I disagree with that contribution, but I won't tell anyone to leave the platform.", rationale:"The phrase attempts to drive another participant out of the community.", safeExample:"I need to delete my old account." },
];

const escapeRe = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const TARGET = "(?:you|u|youre|you\\s+re|you\\s+s|you\\s+are|he|hes|he\\s+s|he\\s+is|she|shes|she\\s+s|she\\s+is|they|theyre|they\\s+re|they\\s+are|that\\s+(?:player|athlete|fan|referee|umpire)|@[a-z0-9_.-]+)";

function expression(rule) {
  return rule.variants || escapeRe(rule.term.toLowerCase()).replace(/\\ /g, "\\s+");
}

function matches(rule, norm) {
  const term = expression(rule);
  if (rule.mode === "phrase") return new RegExp(`\\b${term}\\b`).test(norm);
  if (rule.mode === "direct") return new RegExp(`(?:^|\\b(?:you|u)\\s+(?:should\\s+|need\\s+to\\s+|go\\s+)?)${term}\\b`).test(norm);
  if (rule.mode === "second_person") return new RegExp(`\\b(?:you|u)(?:re|\\s+are|\\s+look|\\s+seem)?\\s+(?:so\\s+|really\\s+)?${term}\\b|\\b${term}\\s+(?:bro|mate)\\b`).test(norm);
  return new RegExp(`\\b${TARGET}\\s+(?:(?:is|are|was|were|looks?|seems?|just|such|an?|so|really)\\s+){0,3}${term}\\b|\\b${term}\\s+${TARGET}\\b`).test(norm);
}

export function moderateEmergingLanguage(norm) {
  const rule = EMERGING_LANGUAGE_RULES.find((candidate) => matches(candidate, norm));
  if (!rule) return null;
  return {
    outcome: rule.outcome,
    category: rule.mechanism,
    reason: rule.outcome === "block" ? "Encouraging self-harm" : "Emerging targeted personal abuse",
    rewriteSuggestion: rule.rewrite || undefined,
    emergingLanguageRule: rule.id,
    policyRationale: rule.rationale,
  };
}
