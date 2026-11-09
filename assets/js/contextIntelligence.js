// K1ND.world v4.9 — conversation and target-aware moderation intelligence.
//
// This module does not replace the hard-safety policy. It adds a pragmatic
// reading around the lexical decision: who or what is targeted, what speech
// act is being performed, whether harmful wording is quoted/condemned, and
// whether several abuse mechanisms are stacked together.

export const CONTEXT_ENGINE_VERSION = "2026.09-context-6";

const INSULT = "(?:stupid|idiot(?:ic)?|moron(?:ic)?|dumb|useless|pathetic|hopeless|clueless|brainless|clown|loser|trash|garbage|rubbish|disgrace|fraud|coward|scum|worthless|vile|repulsive|fuckwit|dickhead|drongo|ratbag)";
const PROFANITY = "(?:fuck(?:ing)?|shit(?:ty)?|shite|bullshit|piss|bastard|arsehole|asshole)";
const PERSON = "(?:you|u|he|him|she|her|they|them|player|athlete|umpire|referee|official|coach|fan|woman|man|girl|boy|@[a-z0-9_.-]+)";
const IDEA_OBJECT = "(?:argument|point|idea|claim|take|opinion|view|analysis|reasoning|proposal|comment|message|post)";
const SPORT_OBJECT = "(?:performance|match|game|set|result|decision|call|shot|serve|return|strategy|strategies|tactic|tactics|formation|selection|play|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\\s*stop|team)";

const DIRECT_ATTACK_RE = new RegExp(`\\b${PERSON}\\b[^.!?]{0,24}\\b(?:is|are|was|were|look|looks|seem|seems|played|acts?|being)?\\s*(?:an?\\s+|such\\s+an?\\s+|so\\s+|really\\s+|absolute(?:ly)?\\s+|complete(?:ly)?\\s+)?${INSULT}\\b|\\b${INSULT}\\b[^.!?]{0,16}\\b${PERSON}\\b`);
const DIRECT_PROFANITY_RE = new RegExp(`\\b(?:fuck|screw)\\s+(?:you|u|him|her|them|that\\s+player|this\\s+player|the\\s+player|that\\s+umpire|the\\s+umpire|that\\s+referee|the\\s+referee|@[a-z0-9_.-]+)\\b|\\b(?:fuck|piss)\\s+off\\b|\\b(?:go\\s+)?fuck\\s+yourself\\b|\\b(?:shut\\s+(?:the\\s+)?fuck\\s+up|stfu)\\b|\\b${PERSON}\\b[^.!?]{0,18}\\bfucking\\s+${INSULT}\\b`);
const PROFANITY_RE = new RegExp(`\\b${PROFANITY}\\b`);
const IDEA_RE = new RegExp(`\\b(?:(?:your|his|her|their|that|this|the)\\s+${IDEA_OBJECT}s?|(?:argument|idea|claim|take|opinion|view|analysis|reasoning|proposal|comment|message|post)s?)\\b`);
const SPORT_RE = new RegExp(`\\b(?:(?:your|his|her|their|that|this|the|a|an)\\s+)?${SPORT_OBJECT}\\b`);
const OBJECT_CRITICISM_RE = new RegExp(`\\b(?:(?:your|his|her|their|that|this|the)\\s+)?${IDEA_OBJECT}s?\\b[^.!?]{0,18}\\b(?:is|are|was|were|seems?|sounds?)\\b[^.!?]{0,10}\\b${INSULT}\\b|\\b${INSULT}\\b[^.!?]{0,14}\\b${IDEA_OBJECT}s?\\b`);
const TACTICAL_CRITICISM_RE = /\b(?:(?:your|his|her|their|that|this|the)\s+)?(?:strategy|strategies|tactic|tactics|formation|selection)\b[^.!?]{0,18}\b(?:is|are|was|were|seems?|looked)\b[^.!?]{0,10}\b(?:stupid|clueless|dumb|rubbish|awful|terrible|hopeless)\b/;

const EDUCATIONAL_RE = /\b(?:spell|spelling|letters?|characters?|exercise|word|term|phrase|definition|dictionary|translation|translate|linguistic|linguistics|etymology|dataset|research|study|analysis|moderation|policy|example|means?|meaning|defined|labelled|labeled|classified)\b/;
const REPORTING_RE = /\b(?:said|says|wrote|posted|sent|called|told|quoted|repeated|received|reported|reporting|flagged|documented|screenshot|message\s+said|comment\s+said|headline\s+quoted)\b/;
const COUNTERSPEECH_RE = /\b(?:(?:do\s+not|dont|never|stop|quit|shouldnt|should\s+not)\s+(?:call(?:ing)?|say(?:ing)?|tell(?:ing)?|send(?:ing)?|post(?:ing)?|writ(?:e|ing)|us(?:e|ing)|repeat(?:ing)?)|(?:condemn|reject|challenge|report|flag|remove|oppose|criticise|criticize)(?:ed|ing|s)?\s+(?:that|this|the)?\s*(?:abuse|insult|slur|comment|message|language)?|(?:that|this|it)\s+(?:is|was)\s+(?:abusive|unacceptable|a\s+slur|an\s+insult|not\s+okay))\b/;
const SELF_REFERENCE_RE = new RegExp(`\\b(?:i\\s+(?:am|was|acted|behaved|felt|looked)|im\\s+(?:an?\\s+|such\\s+an?\\s+|so\\s+|really\\s+)?${INSULT}|myself|my\\s+own)\\b`);
const HYPOTHETICAL_RE = /\b(?:if|suppose|imagine|hypothetical(?:ly)?|what\s+if|for\s+example)\b/;
const QUOTE_MARK_RE = /["“”‘’'][^"“”‘’']{2,}["“”‘’']/u;
const IMPERATIVE_RE = /^(?:please\s+)?(?:go|stop|shut|leave|delete|cry|retire|quit|pull|watch|send|show|tell|call)\b/;
const GROUP_TARGET_RE = /\b(?:all|every|those|these)\s+(?:black|asian|muslim|jewish|gay|trans|disabled|immigrant|refugee|women|men|girls|boys)\s+(?:people|players|athletes|fans|men|women)?\b|\b(?:black|asian|muslim|jewish|gay|trans|disabled|immigrant|refugee)\s+(?:people|players|athletes|fans)\b/;
const ALLEGATION_RE = /\b(?:cheat|cheated|doping|steroids|bribe|fixed|rigged|rapist|paedophile|pedophile|nonce|criminal|racist|sexist|homophobe)\b/;
const THREAT_RE = /\b(?:kill|hurt|stab|shoot|attack|beat\s+up|watch\s+your\s+back|coming\s+for\s+you|find\s+you)\b/;
const DISMISSAL_RE = /\b(?:fuck\s+off|piss\s+off|shut\s+up|go\s+away|leave\s+me\s+alone|delete\s+your\s+account|touch\s+grass)\b/;

function fold(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9@.!?,;\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hostileSignalCount(norm) {
  return [
    DIRECT_ATTACK_RE.test(norm), DIRECT_PROFANITY_RE.test(norm),
    THREAT_RE.test(norm), ALLEGATION_RE.test(norm), DISMISSAL_RE.test(norm),
    /\b(?:fat|ugly|hideous)\b/.test(norm), GROUP_TARGET_RE.test(norm),
  ].filter(Boolean).length;
}

function hasResidualAttack(norm) {
  // A protective opening must not shield a fresh attack added afterwards:
  // “Don't call her an idiot, you moron.”
  const clauses = norm.split(/(?:,|;|\bbut\b|\bbecause\b|\bhowever\b)/).slice(1);
  return clauses.some((clause) => DIRECT_ATTACK_RE.test(clause) || DIRECT_PROFANITY_RE.test(clause));
}

function historySignals(context) {
  const history = Array.isArray(context?.conversationHistory) ? context.conversationHistory.slice(-8) : [];
  const hostilePriorTurns = history.filter((item) => {
    const norm = fold(typeof item === "string" ? item : item?.text);
    return ["warning", "review", "block"].includes(item?.outcome) || DIRECT_ATTACK_RE.test(norm) || DIRECT_PROFANITY_RE.test(norm) || THREAT_RE.test(norm);
  }).length;
  const priorTargeted = Array.isArray(context?.priorTargetedInterventions) ? context.priorTargetedInterventions.slice(-8) : [];
  const distinctAuthors = new Set(priorTargeted.map((item) => item.authorId).filter(Boolean));
  const currentAuthorId = context?.currentAuthorId;
  const repeatedAuthorInterventions = currentAuthorId ? priorTargeted.filter((item) => item.authorId === currentAuthorId).length : 0;
  const pileOn = distinctAuthors.size >= 2;
  const targetShift = !!context?.parentTargetUserId && !!context?.replyTarget?.id && context.parentTargetUserId !== context.replyTarget.id;
  const behaviourHistory = Array.isArray(context?.behaviourHistory) ? context.behaviourHistory.slice(-40) : [];
  const targetId = context?.replyTarget?.id || context?.postAuthor?.id || context?.lastReferencedParticipant?.id || null;
  const relevantBehaviour = behaviourHistory.filter((item) => {
    const sameAuthor = !currentAuthorId || !item?.authorId || item.authorId === currentAuthorId;
    const sameTarget = !targetId || !item?.targetId || item.targetId === targetId;
    return sameAuthor && sameTarget && ["warning","review","block"].includes(item?.outcome);
  });
  const severityWeight = { warning:1, review:2, block:3 };
  const weights = relevantBehaviour.map((item) => severityWeight[item.outcome] || 0);
  const escalatingSeverity = weights.length >= 2 && weights[weights.length - 1] > weights[0];
  const crossThreadInterventions = relevantBehaviour.length;
  const postEventBurst = context?.eventWindow === "post_match" && crossThreadInterventions >= 2;
  return {
    historyTurns:history.length,
    hostilePriorTurns,
    recentTargetedInterventions:priorTargeted.length,
    distinctTargetingAuthors:distinctAuthors.size,
    repeatedAuthorInterventions,
    pileOn,
    targetShift,
    crossThreadInterventions,
    escalatingSeverity,
    postEventBurst,
    behaviourTurns:behaviourHistory.length,
  };
}

function parentSignals(norm, context) {
  const parentNorm = fold(context?.parentText);
  if (!parentNorm) return { isReply:!!context?.isReply, quotedFromParent:false };
  const compactParent = parentNorm.replace(/[.!?]/g, "").trim();
  const quotedFromParent = compactParent.length >= 8 && norm.includes(compactParent) && (REPORTING_RE.test(norm) || COUNTERSPEECH_RE.test(norm));
  return { isReply:true, quotedFromParent };
}

function resolveTarget(norm, result, context, flags) {
  const handle = norm.match(/@[a-z0-9_.-]+/)?.[0];
  if (result?.targetHint) return result.targetHint;
  if (result?.category === "self_harm_encouragement") {
    const contextualTarget = context?.replyTarget || context?.postAuthor;
    return contextualTarget
      ? { label:`@${contextualTarget.handle || contextualTarget.id}`, type:"person", scope:context?.replyTarget ? "reply target" : "post author", explicitness:"policy-resolved direct command + conversation context" }
      : { label:"the addressed participant", type:"person", scope:"individual", explicitness:"policy-resolved direct command" };
  }
  if (GROUP_TARGET_RE.test(norm)) return { label:"an identity-defined group", type:"group", scope:"identity group", explicitness:"explicit" };
  const aliases = Array.isArray(context?.participantAliases) ? context.participantAliases : [];
  const alias = aliases.find((item) => item?.term && new RegExp(`(?:^|[^a-z0-9])${String(item.term).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}(?=$|[^a-z0-9])`, "i").test(norm));
  if (alias) return { label:`@${alias.profile?.handle || alias.profile?.id || alias.term}`, type:"person", scope:"named participant", explicitness:"conversation alias", profile:alias.profile || null };
  if (OBJECT_CRITICISM_RE.test(norm)) return { label:"the referenced argument or idea", type:"idea or argument", scope:"content / idea", explicitness:"explicit" };
  if (TACTICAL_CRITICISM_RE.test(norm)) return { label:"the sporting strategy or tactic", type:"sporting action or object", scope:"sporting object", explicitness:"explicit" };
  if (handle) return { label:handle, type:"person", scope:"named account", explicitness:"explicit" };
  if (/\b(?:you|u|your|yours|yourself|youre)\b/.test(norm)) {
    const contextualTarget = context?.replyTarget || context?.postAuthor;
    return contextualTarget
      ? { label:`@${contextualTarget.handle || contextualTarget.id}`, type:"person", scope:context?.replyTarget ? "reply target" : "post author", explicitness:"explicit wording + conversation context" }
      : { label:"the addressed participant", type:"person", scope:"individual", explicitness:"explicit" };
  }
  const indirect = norm.match(/\b(?:that|this|the)\s+(?:player|athlete|champion|number\s+one|umpire|referee|official|coach|fan)\b|\b(?:his|her|their)\s+(?:mother|father|partner|family|coach)\b/)?.[0];
  if (indirect && result.outcome !== "clean") {
    const profile = context?.lastReferencedParticipant || context?.replyTarget || context?.postAuthor || null;
    return { label:profile ? `@${profile.handle || profile.id}` : `the referenced ${indirect}`, type:"person", scope:"indirect participant reference", explicitness:"resolved from wording + conversation", profile };
  }
  const third = norm.match(/\b(?:he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|official|coach|fan)\b/)?.[0];
  if (third && (result.outcome !== "clean" || flags.reportedSpeech || flags.counterSpeech)) return { label:`the referenced ${third}`, type:"person", scope:"individual", explicitness:"explicit" };
  if (context?.lastReferencedParticipant && result.outcome !== "clean") {
    const profile = context.lastReferencedParticipant;
    return { label:`@${profile.handle || profile.id}`, type:"person", scope:"conversation participant", explicitness:"resolved from prior turn", profile };
  }
  if (context?.isReply && (result.outcome !== "clean" || IMPERATIVE_RE.test(norm))) return { label:"the replied-to participant", type:"person", scope:"reply target", explicitness:"inferred from reply" };
  const idea = norm.match(IDEA_RE)?.[0];
  if (idea) return { label:`the ${idea}`, type:"idea or argument", scope:"content / idea", explicitness:"explicit" };
  const sport = norm.match(SPORT_RE)?.[0];
  if (sport) return { label:`the sporting ${sport}`, type:"sporting action or object", scope:"sporting object", explicitness:"explicit" };
  return { label:"no clear person", type:"unclear / general expression", scope:"general", explicitness:"none" };
}

function targetAudience(norm, target, context) {
  const handle = norm.match(/@([a-z0-9_.-]+)/)?.[1];
  const known = Array.isArray(context?.knownProfiles) ? context.knownProfiles : [];
  let profile = target?.profile || (handle ? known.find((item) => item?.handle === handle || item?.id === handle) : null);
  if (!profile && target.scope === "reply target") profile = context?.replyTarget;
  if (!profile && target.scope === "post author") profile = context?.postAuthor;
  if (!profile && context?.isReply && target.type === "person") profile = context?.replyTarget;
  const athlete = !!(profile?.isAthlete || context?.athleteTarget);
  const under18 = !!(profile?.isU18 || profile?.role === "verified_u18");
  const role = under18 ? "U18 participant" : athlete ? "professional athlete" : profile ? "verified participant" : "participant role unknown";
  return {
    profileId:profile?.id || null,
    handle:profile?.handle || null,
    athlete,
    under18,
    role,
    protectionReason:under18 ? "minor-safety policy applies" : athlete ? "public-figure pile-on monitoring applies" : "standard participant safeguards apply",
  };
}

function profanityContext(norm, result) {
  if (!PROFANITY_RE.test(norm) && !result?.profanityFunction) return { present:false, id:"none", label:"none", targeted:false, abusive:false };
  if (result?.profanityFunction) return result.profanityFunction;
  if (["threat","harm","self_harm_encouragement","sexual_abuse"].includes(result?.category)) return { present:true, id:"harm_intensifier", label:"profanity intensifying an independently detected harm", targeted:true, abusive:true };
  if (DIRECT_PROFANITY_RE.test(norm)) return { present:true, id:"directed_hostility", label:"person-directed profanity or dismissal", targeted:true, abusive:true };
  return { present:true, id:"ambiguous_profanity", label:"strong language requiring contextual interpretation", targeted:false, abusive:result?.outcome !== "clean" };
}

function speechAct(result, target, flags, norm, profanity) {
  if (flags.counterSpeech) return { id:"counterspeech", label:"condemning or preventing abuse" };
  if (flags.reportedSpeech) return { id:"reported_abuse", label:"reporting or quoting abuse" };
  if (flags.educational) return { id:"educational_analysis", label:"educational or policy discussion" };
  if (result.category === "self_harm_encouragement") return { id:"self_harm_encouragement", label:"directly encouraging suicide or self-harm" };
  if (result.category === "threat" || THREAT_RE.test(norm)) return { id:"threat", label:"threatening a person" };
  if (["integrity_allegation","serious_allegation"].includes(result.category) || ALLEGATION_RE.test(norm)) return { id:"allegation", label:"making an allegation" };
  if (flags.selfReference && !flags.directAttack) return { id:"self_criticism", label:"self-directed criticism" };
  if (result.category === "coordinated_harassment") return { id:"coordination", label:"coordinating other users" };
  if (IMPERATIVE_RE.test(norm) || DISMISSAL_RE.test(norm)) return { id:"directive", label:"commanding or dismissing" };
  if (result.category === "expressive_profanity" && profanity.id === "positive_intensifier") return { id:"emphatic_praise", label:"emphatic praise" };
  if (result.category === "expressive_profanity" && profanity.id === "sporting_emphasis") return { id:"emphatic_sporting_reaction", label:"emphatic sporting reaction" };
  if (result.category === "expressive_profanity") return { id:"expressive_exclamation", label:"untargeted emotional expression" };
  if (target.type === "idea or argument") return { id:"idea_criticism", label:"criticising an idea or statement" };
  if (target.type === "sporting action or object") return { id:"sporting_criticism", label:"criticising sport or performance" };
  if (result.outcome !== "clean" && target.type === "person") return { id:"personal_attack", label:"attacking or degrading a person" };
  return { id:"general_expression", label:"general expression" };
}

export function analyzeContext(text, result, conversationContext = {}) {
  const norm = fold(text);
  const flags = {
    educational:EDUCATIONAL_RE.test(norm),
    reportedSpeech:REPORTING_RE.test(norm),
    counterSpeech:COUNTERSPEECH_RE.test(norm),
    selfReference:SELF_REFERENCE_RE.test(norm),
    hypothetical:HYPOTHETICAL_RE.test(norm),
    quotation:QUOTE_MARK_RE.test(String(text || "")),
    directAttack:DIRECT_ATTACK_RE.test(norm) || DIRECT_PROFANITY_RE.test(norm),
  };
  flags.residualAttack = hasResidualAttack(norm);
  const parent = parentSignals(norm, conversationContext);
  if (parent.quotedFromParent) flags.reportedSpeech = true;
  const history = historySignals(conversationContext);
  const target = resolveTarget(norm, result, conversationContext, flags);
  const audience = targetAudience(norm, target, conversationContext);
  const profanity = profanityContext(norm, result);
  const act = speechAct(result, target, flags, norm, profanity);
  const weakHypotheticalReport = flags.hypothetical && flags.reportedSpeech && !flags.counterSpeech && !flags.educational;
  const protectedFraming = (flags.counterSpeech || flags.reportedSpeech || flags.educational || flags.selfReference) && !flags.residualAttack && !weakHypotheticalReport;
  const ideaCriticism = OBJECT_CRITICISM_RE.test(norm) && !flags.directAttack && !flags.residualAttack;
  const tacticalCriticism = TACTICAL_CRITICISM_RE.test(norm) && !flags.directAttack && !flags.residualAttack;
  const lexicalMechanisms = hostileSignalCount(norm);
  const mechanisms = lexicalMechanisms || (result.category === "self_harm_encouragement" ? 1 : 0);
  const modifiers = [];
  if (flags.counterSpeech) modifiers.push("counterspeech / condemnation");
  if (flags.reportedSpeech) modifiers.push("reported or attributed wording");
  if (flags.educational) modifiers.push("educational / policy framing");
  if (flags.selfReference) modifiers.push("self-reference");
  if (flags.hypothetical) modifiers.push("hypothetical framing");
  if (flags.quotation) modifiers.push("quotation marks detected");
  if (parent.isReply) modifiers.push("reply context available");
  if (parent.quotedFromParent) modifiers.push("wording overlaps the parent message");
  if (history.hostilePriorTurns) modifiers.push(`${history.hostilePriorTurns} recent hostile turn${history.hostilePriorTurns === 1 ? "" : "s"}`);
  if (history.recentTargetedInterventions) modifiers.push(`${history.recentTargetedInterventions} recent intervention${history.recentTargetedInterventions === 1 ? "" : "s"} against this target`);
  if (history.pileOn) modifiers.push(`${history.distinctTargetingAuthors} accounts targeting the same participant`);
  if (history.repeatedAuthorInterventions) modifiers.push("repeat targeting by this author");
  if (history.targetShift) modifiers.push("target changed inside the reply chain");
  if (history.crossThreadInterventions) modifiers.push(`${history.crossThreadInterventions} cross-thread intervention${history.crossThreadInterventions === 1 ? "" : "s"} involving this author and target`);
  if (history.escalatingSeverity) modifiers.push("severity is escalating across conversations");
  if (history.postEventBurst) modifiers.push("repeat targeting inside the post-match risk window");
  if (audience.athlete) modifiers.push("professional athlete target recognised");
  if (audience.under18) modifiers.push("U18 target recognised");
  if (flags.residualAttack) modifiers.push("fresh attack remains outside the protected frame");
  if (profanity.present) modifiers.push(`profanity functions as ${profanity.label}`);
  const signals = [
    `${target.explicitness} ${target.scope} target`,
    act.label,
    ...modifiers,
  ];
  return {
    version:CONTEXT_ENGINE_VERSION,
    target,
    audience,
    speechAct:act,
    stance:flags.counterSpeech ? "opposes the abusive wording" : flags.reportedSpeech ? "attributes the wording to somebody else" : flags.educational ? "analyses the wording" : act.id === "self_criticism" ? "directed at the author" : flags.hypothetical ? "hypothetical but not automatically safe" : "authorial / direct",
    flags,
    protectedFraming,
    ideaCriticism,
    tacticalCriticism,
    profanity,
    mechanismCount:mechanisms,
    stacking:mechanisms >= 3 ? "multiple abuse mechanisms stacked" : mechanisms === 2 ? "two abuse mechanisms present" : mechanisms === 1 ? "single abuse mechanism" : "no abuse mechanism detected",
    conversation:{ ...parent, ...history },
    modifiers,
    signals,
  };
}

export function applyContextPolicy(result, context) {
  // Hard blocks and enhanced-review categories are never downgraded by quoted
  // or educational framing in this browser demo. That avoids an easy bypass;
  // production can route genuine edge cases through specialist review.
  if (!result || result.outcome !== "warning") return result;
  if (context.flags.residualAttack) return result;
  if (result.category === "abuse" && context.protectedFraming) {
    const reason = context.flags.counterSpeech ? "Counterspeech / abuse prevention" : context.flags.reportedSpeech ? "Reported or quoted abuse" : context.flags.educational ? "Educational or policy discussion" : "Self-directed expression";
    return { outcome:"clean", category:"contextual_safe", reason, contextOverride:context.speechAct.id, policyRationale:"The harmful wording is being reported, opposed, analysed or directed at the author—not used to attack another participant." };
  }
  if (result.category === "abuse" && (context.ideaCriticism || context.tacticalCriticism)) {
    return { outcome:"clean", category:"contextual_safe", reason:"Criticism of an idea or sporting tactic", contextOverride:"object_criticism", policyRationale:"The negative wording evaluates an argument, strategy or tactic rather than degrading a person." };
  }
  if (context.target.type === "person" && !context.protectedFraming) {
    if (context.audience.under18) {
      return { ...result, outcome:"review", category:"minor_targeted_abuse", reason:"Direct abuse targeting an U18 participant requires enhanced review", policyRationale:"The wording attacks a known U18 participant. K1ND.world applies additional safeguarding and keeps the original private for moderator assessment." };
    }
    if (context.conversation.pileOn) {
      return { ...result, outcome:"review", category:"coordinated_targeting", reason:"Conversation pattern indicates a developing pile-on", policyRationale:"Multiple accounts have recently targeted the same participant. The current attack is held to interrupt cumulative harassment rather than judging this line in isolation." };
    }
    if (context.conversation.repeatedAuthorInterventions >= 2) {
      return { ...result, outcome:"review", category:"repeated_targeting", reason:"Repeated targeting of the same participant", policyRationale:"This author has triggered repeated interventions against the same participant, so the new attack is held for enhanced review." };
    }
    if (context.conversation.crossThreadInterventions >= 3 || context.conversation.escalatingSeverity || context.conversation.postEventBurst) {
      return { ...result, outcome:"review", category:"persistent_targeting", reason:"Persistent targeting across conversations", policyRationale:"The current wording is assessed with prior author-to-target interventions across threads. The pattern is escalating or concentrated around a high-risk event window, so the original is held for review." };
    }
  }
  return result;
}

export function finalizeContext(context, result) {
  const resolvedProfanity = result.contextOverride && context.profanity?.present
    ? { ...context.profanity, id:"reported_or_analysed", label:"reported, quoted or analysed profanity", targeted:false, abusive:false }
    : context.profanity;
  const base = { clean:8, warning:52, review:76, block:94 }[result.outcome] ?? 20;
  let score = base;
  if (context.flags.directAttack && result.outcome !== "clean") score += 7;
  if (context.target.type === "group") score += 6;
  if (context.mechanismCount >= 2) score += Math.min(9, context.mechanismCount * 3);
  if (context.conversation.hostilePriorTurns) score += Math.min(8, context.conversation.hostilePriorTurns * 3);
  if (context.conversation.recentTargetedInterventions) score += Math.min(10, context.conversation.recentTargetedInterventions * 3);
  if (context.conversation.pileOn) score += 10;
  if (context.conversation.repeatedAuthorInterventions >= 2) score += 8;
  if (context.conversation.crossThreadInterventions) score += Math.min(12, context.conversation.crossThreadInterventions * 3);
  if (context.conversation.escalatingSeverity) score += 8;
  if (context.conversation.postEventBurst) score += 6;
  if (context.audience.athlete && context.target.type === "person") score += 4;
  if (context.audience.under18 && context.target.type === "person") score += 10;
  if (context.protectedFraming && result.outcome === "clean") score -= 5;
  score = Math.max(0, Math.min(100, score));
  const band = score >= 85 ? "critical" : score >= 70 ? "high" : score >= 45 ? "elevated" : score >= 20 ? "guarded" : "low";
  const explanation = result.category === "expressive_profanity"
    ? `${context.speechAct.label}; ${resolvedProfanity.label}. No person-directed abuse mechanism is present.`
    : result.contextOverride
    ? `${context.speechAct.label}; the context changes how the wording functions, so it is not treated as a direct attack.`
    : `${context.speechAct.label}; target scope is ${context.target.scope}. ${context.audience.role}; ${context.stacking}.`;
  return { ...context, profanity:resolvedProfanity, riskScore:score, riskBand:band, explanation };
}
