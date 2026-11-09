// K1ND.world v4.12 — proposition-preserving multilingual rewrite refinement.
//
// A moderation rewrite must not manufacture a new opinion or replace the
// author's point with generic safety language. This layer either:
//   1. preserves a recoverable sporting/opinion point and removes the attack;
//   2. qualifies a risky allegation without presenting it as fact; or
//   3. offers no automatic rewrite when the draft contains abuse but no
//      meaningful point to preserve.

const META_LANGUAGE = /\b(?:i want to|keep (?:this|the criticism) respectful|without (?:attacking|insulting|degrading|ridiculing|sexualising)|without (?:strong|suspected|sexualised|family-directed|abusive|hateful) language|rather than (?:insult|degrade|silence|reduce)|express that respectfully|keep the criticism constructive|come back stronger)\b/i;
const SPORT_SIGNAL = /\b(?:match|performance|game|set|result|decision|call|line\s*call|shot|serve|return|strategy|tactic|position|play|played|pass|tackle|penalty|lap|over|wicket|delivery|race|pit\s*stop|team|player|athlete|umpire|referee|official|final|ball|court|tennis|football|golf|cricket|rugby|basketball|baseball|hockey|boxing)\b/i;
const DISCUSSION_SIGNAL = /\b(?:point|argument|idea|view|take|claim|evidence|reason|praise|support|conduct|behaviou?r|comment|reply|analysis)\b/i;
const OBSERVABLE_SIGNAL = /\b(?:miss(?:ed|ing)?|lost|won|changed|land(?:ed|ing)?|short|wide|late|slow|weak|predictable|passive|aggressive|confidence|position|score|lead|error|mistake|timing|movement|choice|pattern)\b/i;
const PERSONAL_LABEL = "(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum|coward|fool|useless|pathetic|hopeless|worthless|scum|pig|cow|slob|bitch|slag|skank|whore|slut|disgusting|repulsive|vile)";
const TARGET = "(?:you|u|he|she|they|the\\s+player|that\\s+player|the\\s+athlete|that\\s+athlete|@[a-z0-9_.-]+)";
const REMAINING_UNSAFE = /(?:\b(?:fuck|fucking|shit|shite|crap|bullshit|garbage|trash|blind|mentally\s+weak|emotionally\s+weak)\b|🖕)/iu;

function tidy(value) {
  let out = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, "")
    .trim();
  if (!out) return "";
  out = out[0].toUpperCase() + out.slice(1);
  if (!/[.!?]$/.test(out)) out += ".";
  return out;
}

function measuredVersion(value) {
  const clean = tidy(value);
  if (!clean || !/^[A-Za-z]/.test(clean)) return clean;
  const body = clean.replace(/[.!?]$/u, "");
  if (/^i\s+(?:think|believe|feel|suspect|am concerned)/i.test(body)) return clean;
  return tidy(`I think ${body[0].toLowerCase()}${body.slice(1)}`);
}

function noPoint(reason = "The draft contains an attack, but no sporting or discussion point that can be safely preserved.") {
  return {
    status: "needs_author_point",
    suggestion: undefined,
    preservedPoint: "None detected",
    removed: "Personal attack / abusive expression",
    rationale: `${reason} K1ND.world will not invent a replacement opinion; the author must state the real point in their own words.`,
  };
}

function preserved(suggestion, preservedPoint, removed = "Personal attack / abusive expression", evidence = {}) {
  const measured = measuredVersion(suggestion);
  const options = evidence.options || [
    { id:"direct", label:"Direct", suggestion, stance:"Keeps the original force" },
    ...(measured && measured !== suggestion
      ? [{ id:"measured", label:"Measured", suggestion:measured, stance:"Keeps the point with less certainty" }]
      : []),
  ];
  return {
    status: "intent_preserved",
    suggestion,
    preservedPoint,
    removed,
    sourceBasis:evidence.sourceBasis || preservedPoint,
    fidelity:evidence.fidelity || "meaning and stance preserved",
    transformation:evidence.transformation || "delete abusive span; retain proposition",
    clauses:evidence.clauses || [
      { role:"retain", text:preservedPoint, reason:"Recoverable proposition" },
      { role:"remove", text:removed, reason:"Unsafe or abusive element" },
    ],
    options,
    rationale: evidence.rationale || "The rewrite keeps the recoverable point and removes only the abusive or unsafe element.",
  };
}

function qualified(suggestion, preservedPoint) {
  const measured = measuredVersion(suggestion);
  return {
    status: "claim_qualified",
    suggestion,
    preservedPoint,
    removed: "Unsupported certainty / direct accusation",
    sourceBasis:preservedPoint,
    fidelity:"concern preserved; certainty reduced",
    transformation:"qualify allegation; retain observable basis",
    clauses:[
      { role:"retain", text:preservedPoint, reason:"Source-backed concern" },
      { role:"qualify", text:"The allegation as certainty", reason:"The claim is not verified" },
    ],
    options:[
      { id:"qualified", label:"Qualified", suggestion, stance:"Keeps the concern without stating it as fact" },
      ...(measured && measured !== suggestion
        ? [{ id:"measured", label:"Measured", suggestion:measured, stance:"Uses a more personal statement of concern" }]
        : []),
    ],
    rationale: "The concern is retained, but the rewrite does not present an unverified allegation as established fact.",
  };
}

function safeDraft(suggestion, preservedPoint, removed, sourceBasis) {
  return {
    ...preserved(suggestion, preservedPoint, removed, {
      sourceBasis,
      fidelity:"source-backed clean proposition",
      transformation:"block original; create a separate clean draft from retained wording",
      rationale:"The original remains blocked. This separate draft keeps only a source-backed, non-abusive proposition and must pass moderation as a new submission.",
    }),
    status:"safe_new_draft",
  };
}

function wordCount(value) {
  return (String(value || "").match(/[\p{L}\p{N}]+/gu) || []).length;
}

function stripEnglishAttack(clause) {
  let out = String(clause || "")
    .replace(new RegExp(`\\b${TARGET}\\s+(?:are|re|is|was|were|look|looks|looked)?\\s*(?:such\\s+)?(?:an?\\s+)?${PERSONAL_LABEL}\\b`, "giu"), " ")
    .replace(new RegExp(`\\b${TARGET}\\s+${PERSONAL_LABEL}\\b`, "giu"), " ")
    .replace(new RegExp(`\\b${PERSONAL_LABEL}\\b\\s*(?:${TARGET})?\\s*$`, "giu"), " ")
    .replace(/\b(?:shut\s+(?:the\s+)?fuck\s+up|shut\s+up|stfu|(?:fuck|piss)\s+off|go\s+fuck\s+yourself)\b/giu, " ")
    .replace(/\bnever\s+(?:play|compete|coach|officiate)(?:\s+again)?\b/giu, " ")
    .replace(/\b(?:fucking|bloody|damn)\b(?=\s+(?:awful|terrible|poor|bad|weak|slow|late|short|wide|match|performance|decision|call|shot|serve|return|strategy|tactic))/giu, " ")
    .replace(/\b(?:stupid|idiotic|dumb)\b(?=\s+(?:match|performance|decision|call|shot|serve|return|strategy|tactic|play))/giu, "poor")
    .replace(/\b(?:shit|crap)\b(?=\s+(?:match|performance|decision|call|shot|serve|return|strategy|tactic|play))/giu, "poor")
    .replace(/🖕/gu, " ")
    .replace(/\byou\s+(?:bottled\s+it|choked)(?:\s+again)?\b/giu, "you lost confidence at the key moment")
    .replace(/\byour\s+family\s+must\s+be\s+proud\b/giu, " ")
    .replace(/\s+/g, " ")
    .replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, "")
    .trim();
  return out;
}

function sourceClauses(text) {
  return String(text || "")
    .replace(/([.!?。！？;；])\s*/gu, "$1\n")
    .replace(/,\s+(?=(?:you|u|he|she|they|the\s+player|that\s+player|the\s+athlete|that\s+athlete|@[a-z0-9_.-]+)\b)/giu, "\n")
    .replace(/\b(?:but|although)\s+(?=(?:your|the|that|this|my|our|their|his|her)\b)/giu, "\n")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function sourceBackedPoint(text) {
  const candidates = sourceClauses(text)
    .map((source) => ({ source, cleaned:stripEnglishAttack(source) }))
    .filter(({ cleaned }) => cleaned && wordCount(cleaned) >= 4)
    .filter(({ cleaned }) => (SPORT_SIGNAL.test(cleaned) || DISCUSSION_SIGNAL.test(cleaned) || OBSERVABLE_SIGNAL.test(cleaned)))
    .filter(({ cleaned }) => !META_LANGUAGE.test(cleaned))
    .filter(({ cleaned }) => !new RegExp(`\\b${PERSONAL_LABEL}\\b`, "iu").test(cleaned))
    .filter(({ cleaned }) => !REMAINING_UNSAFE.test(cleaned))
    .slice(0, 2);
  if (!candidates.length) return null;
  const suggestion = candidates.map(({ cleaned }) => tidy(cleaned)).join(" ");
  return {
    suggestion,
    point:suggestion.replace(/[.!?]\s*$/u, ""),
    sourceBasis:candidates.map(({ source }) => source.replace(/[.!?]\s*$/u, "")).join(" · "),
  };
}

function qualifySourceClaim(text, category, prior) {
  const because = String(text).match(/\bbecause\s+([^.!?]+)/i)?.[1];
  const observable = because ? stripEnglishAttack(because) : "";
  if (observable && wordCount(observable) >= 3) {
    const basis = tidy(observable);
    const suffix = category === "integrity_allegation"
      ? "That raised a concern for me, but I cannot verify wrongdoing."
      : "That raised a serious concern for me, but I cannot verify the allegation.";
    return {
      ...qualified(`${basis} ${suffix}`, basis.replace(/[.!?]$/, "")),
      sourceBasis:`because ${because}`,
    };
  }
  if (/\bdop(?:e|ing|ed)\b/i.test(text)) return qualified("I suspect there may be a doping issue, but I do not have evidence to verify it.", "A concern about possible doping");
  if (/\b(?:cheat|fixed|rigged|corrupt)\b/i.test(text)) return qualified("I am concerned about possible unfair conduct, but I do not have evidence to verify wrongdoing.", "A concern about possible unfair conduct");
  return qualified(prior || (category === "integrity_allegation" ? "That raised an integrity concern for me, but I do not have evidence of wrongdoing." : "I have a serious concern, but I cannot verify that allegation."), "The concern stated in the original draft");
}

function polishPoint(original) {
  const stripped = String(original)
    .replace(/\bkur[wv]a\s+m(?:a[cć]|atc|atch|ats?)(?![a-ząćęłńóśźż])[.!?,;:]*/giu, " ")
    .replace(/\bkur[wv](?:a|ą|o|ę|e|y)\b[.!?,;:]*/giu, " ")
    .trim();
  return /[\p{L}\p{N}]{2,}/u.test(stripped) ? tidy(stripped) : "";
}

export function refineRewrite(original, result) {
  if (!result || result.outcome === "clean") {
    return { status:"not_applicable", suggestion:result?.rewriteSuggestion };
  }
  if (result.semanticOverride === "implicit_personal_attack") {
    return noPoint("The sarcastic personal label contains no separate proposition K1ND.world can safely reconstruct without inventing the author's intent.");
  }

  const text = String(original || "").trim();
  const norm = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[’']/g, "");
  const prior = result.rewriteSuggestion;

  // Preserve the author's constructive contrast exactly. The previous engine
  // incorrectly introduced disagreement into "your point is fair".
  const contrast = text.match(/\b(?:but|although)\s+(.+)$/i);
  if (contrast && /\b(?:point|argument|idea|view|take)\b/i.test(contrast[1])) {
    const point = tidy(contrast[1]);
    return result.outcome === "block"
      ? safeDraft(point, point.replace(/[.!?]$/, ""), "The prohibited material before the contrast", contrast[1])
      : preserved(point, point.replace(/[.!?]$/, ""), "The direct personal insult before the contrast", { sourceBasis:contrast[1] });
  }

  // Untargeted Polish profanity can be removed while leaving the user's own
  // Polish-language sporting statement intact.
  if (result.polishRule) {
    const point = polishPoint(text);
    if (point) return preserved(point, point.replace(/[.!?]$/, ""), "The Polish profanity");
    return noPoint("The draft is only a profane exclamation and contains no further point to preserve.");
  }

  // High-risk claims need precise qualification, not an unrelated positivity
  // message. They remain eligible for enhanced review.
  if (result.category === "integrity_allegation") {
    return qualifySourceClaim(text, result.category, prior);
  }
  if (result.category === "serious_allegation") {
    return qualifySourceClaim(text, result.category, prior);
  }
  if (result.category === "gambling_attack") {
    return preserved(prior, "Frustration about the betting result", "Blaming or demanding money from the athlete");
  }
  if (result.category === "coordinated_harassment") {
    return noPoint("Organising a pile-on is an abusive action, not a publishable sporting opinion.");
  }

  // First try to retain the author's own observable sporting or discussion
  // proposition. This happens before rule templates so a specific point such
  // as "the second serve kept landing short" is never replaced with generic
  // courtesy copy. For a hard block the output is a separate new draft; the
  // original remains non-bypassable.
  const sourcePoint = sourceBackedPoint(text);
  if (sourcePoint) {
    return result.outcome === "block"
      ? safeDraft(sourcePoint.suggestion, sourcePoint.point, "The prohibited or abusive clause", sourcePoint.sourceBasis)
      : preserved(sourcePoint.suggestion, sourcePoint.point, "The targeted or abusive clause", {
        sourceBasis:sourcePoint.sourceBasis,
        fidelity:"original wording and critical stance preserved",
      });
  }

  // Specific contemporary-language meanings can be translated into their
  // actual proposition rather than a lecture about politeness.
  if (result.emergingLanguageRule === "delulu-person") return preserved("I don't think that view is realistic.", "The view seems unrealistic", "Mental-state ridicule");
  if (result.emergingLanguageRule === "glazer-person") return preserved("I think that praise goes too far.", "The praise seems excessive", "The personal label");
  if (result.emergingLanguageRule === "skill-issue") return preserved("That performance exposed a technical weakness.", "There was a technical weakness in the performance", "The belittling taunt");
  if (["npc-person","yapper-person","touch-grass","cry-more","delete-account"].includes(result.emergingLanguageRule)) return noPoint();

  // Selected multilingual labels carry an underlying proposition; bare
  // insults do not. Never translate a bare insult into an invented opinion.
  if (result.multilingualRule === "sa-sycophant-ridicule") return preserved("I think that support is uncritical.", "The support seems uncritical", "The personal label");
  if (result.multilingualRule === "sa-mental-ridicule") return noPoint();
  if (result.multilingualRule) return noPoint();

  if (result.australianRule === "au-cooker-label") return preserved("I don't think that claim is credible.", "The claim does not seem credible", "The personal political/conspiracy label");
  if (result.australianRule === "au-pull-head-in") return preserved("Please stop that behaviour.", "A request for the behaviour to stop", "The confrontational idiom");
  if (result.australianRule) return noPoint("The Australian insult labels a person but does not state a specific sporting or discussion point.");

  // Preserve a recoverable request in the author's language. Personal labels
  // and slurs still receive no invented replacement opinion.
  if (result.czechBalticRule === "cz-dismissal") {
    if (/\bdrz\s+hubu\b/.test(norm)) return preserved("Prosím, přestaň mluvit.", "A request for the other person to stop talking", "The aggressive Czech silencing command");
    return preserved("Prosím, nech mě být.", "A request to be left alone", "The vulgar Czech dismissal");
  }
  if (result.czechBalticRule === "lt-dismissal") return preserved("Prašau, palik mane ramybėje.", "A request to be left alone", "The vulgar Lithuanian dismissal");
  if (result.czechBalticRule === "lv-dismissal") return preserved("Lūdzu, liec mani mierā.", "A request to be left alone", "The vulgar Latvian dismissal");
  if (result.czechBalticRule === "et-dismissal") return preserved("Palun jäta mind rahule.", "A request to be left alone", "The vulgar Estonian dismissal");
  if (result.czechBalticRule) return noPoint("The regional-language draft contains abuse but no separate proposition that can be safely retained.");

  const westernDismissalRewrites = {
    "es-dismissal":["Por favor, déjame en paz.", "A request to be left alone", "The vulgar Spanish dismissal"],
    "fr-dismissal":["S’il te plaît, laisse-moi tranquille.", "A request to be left alone", "The vulgar French dismissal"],
    "de-dismissal":["Bitte lass mich in Ruhe.", "A request to be left alone", "The vulgar German dismissal"],
    "it-dismissal":["Per favore, lasciami in pace.", "A request to be left alone", "The vulgar Italian dismissal"],
    "pt-dismissal":["Por favor, deixa-me em paz.", "A request to be left alone", "The vulgar Portuguese dismissal"],
    "nl-dismissal":["Laat me alsjeblieft met rust.", "A request to be left alone", "The vulgar Dutch dismissal"],
  };
  if (result.westernEuropeanRule && westernDismissalRewrites[result.westernEuropeanRule]) {
    return preserved(...westernDismissalRewrites[result.westernEuropeanRule]);
  }
  if (result.westernEuropeanRule) return noPoint("The regional-language draft labels or attacks a person but contains no separate proposition K1ND.world can safely reconstruct.");

  const priorityDismissalRewrites = {
    "ar-dismissal":["من فضلك اتركني وشأني.", "A request to be left alone", "The aggressive Arabic dismissal"],
    "ru-dismissal":["Пожалуйста, оставь меня в покое.", "A request to be left alone", "The vulgar Russian dismissal"],
    "uk-dismissal":["Будь ласка, залиш мене в спокої.", "A request to be left alone", "The vulgar Ukrainian dismissal"],
    "zh-dismissal":["请别再打扰我。", "A request for the interaction to stop", "The aggressive Mandarin dismissal"],
    "ja-dismissal":["もう関わらないでください。", "A request for the interaction to stop", "The aggressive Japanese dismissal"],
    "ko-dismissal":["제발 나를 내버려 둬.", "A request to be left alone", "The aggressive Korean dismissal"],
    "tr-dismissal":["Lütfen beni rahat bırak.", "A request to be left alone", "The vulgar Turkish dismissal"],
    "el-dismissal":["Σε παρακαλώ, άφησέ με ήσυχο.", "A request to be left alone", "The vulgar Greek dismissal"],
    "ro-dismissal":["Te rog, lasă-mă în pace.", "A request to be left alone", "The Romanian dismissal"],
    "hu-dismissal":["Kérlek, hagyj békén.", "A request to be left alone", "The vulgar Hungarian dismissal"],
    "sk-dismissal":["Prosím, nechaj ma na pokoji.", "A request to be left alone", "The vulgar Slovak dismissal"],
    "bcs-dismissal":["Molim te, ostavi me na miru.", "A request to be left alone", "The South Slavic dismissal"],
  };
  if (result.priorityGlobalRule && priorityDismissalRewrites[result.priorityGlobalRule]) {
    return preserved(...priorityDismissalRewrites[result.priorityGlobalRule]);
  }
  if (result.priorityGlobalRule) return noPoint("The multilingual draft attacks a person but contains no separate proposition K1ND.world can safely reconstruct.");

  const nextWaveDismissalRewrites = {
    "bn-dismissal":["দয়া করে আমাকে একটু সময় দিন।", "A request for space", "The Bengali silencing command"],
    "fa-dismissal":["لطفاً من را تنها بگذار.", "A request to be left alone", "The Persian dismissal"],
    "he-dismissal":["בבקשה, תנו לי מרחב.", "A request for space", "The Hebrew dismissal"],
    "id-dismissal":["Tolong beri saya ruang.", "A request for space", "The Indonesian dismissal"],
    "ms-dismissal":["Tolong beri saya ruang.", "A request for space", "The Malay silencing command"],
    "vi-dismissal":["Xin hãy để tôi yên.", "A request to be left alone", "The Vietnamese dismissal"],
    "th-dismissal":["กรุณาปล่อยฉันไว้ตามลำพัง", "A request to be left alone", "The Thai dismissal"],
    "tl-dismissal":["Pakiusap, bigyan mo muna ako ng espasyo.", "A request for space", "The Tagalog silencing command"],
    "sw-dismissal":["Tafadhali niache kwa sasa.", "A request for space", "The Swahili silencing command"],
    "am-dismissal":["እባክዎ ብቻዬን ይተዉኝ።", "A request to be left alone", "The Amharic silencing command"],
  };
  if (result.nextWaveRule && nextWaveDismissalRewrites[result.nextWaveRule]) {
    return preserved(...nextWaveDismissalRewrites[result.nextWaveRule]);
  }
  if (result.nextWaveRule) return noPoint("The next-wave language draft contains abuse but no separate proposition K1ND.world can safely preserve.");

  const v412DismissalRewrites = {
    "ta-dismissal":["தயவுசெய்து எனக்கு சிறிது இடம் கொடுங்கள்.", "A request for space", "The aggressive Tamil dismissal"],
    "te-dismissal":["దయచేసి నాకు కొంత సమయం ఇవ్వండి.", "A request for space", "The aggressive Telugu dismissal"],
    "kn-dismissal":["ದಯವಿಟ್ಟು ನನಗೆ ಸ್ವಲ್ಪ ಸಮಯ ಕೊಡಿ.", "A request for space", "The aggressive Kannada dismissal"],
    "ml-dismissal":["ദയവായി എനിക്ക് കുറച്ച് ഇടം തരൂ.", "A request for space", "The aggressive Malayalam dismissal"],
    "mr-dismissal":["कृपया मला थोडी जागा द्या.", "A request for space", "The aggressive Marathi dismissal"],
    "ne-dismissal":["कृपया मलाई केही समय दिनुहोस्।", "A request for space", "The aggressive Nepali dismissal"],
    "ha-dismissal":["Don Allah ka bar ni.", "A request to be left alone", "The aggressive Hausa dismissal"],
    "yo-dismissal":["Jọ̀wọ́, fi mí sílẹ̀.", "A request to be left alone", "The aggressive Yorùbá dismissal"],
    "ig-dismissal":["Biko, hapụ m.", "A request to be left alone", "The aggressive Igbo dismissal"],
    "pcm-dismissal":["Abeg give me space.", "A request for space", "The aggressive Nigerian Pidgin dismissal"],
  };
  if (result.v412LanguageRule && v412DismissalRewrites[result.v412LanguageRule]) {
    return preserved(...v412DismissalRewrites[result.v412LanguageRule]);
  }
  if (result.v412LanguageRule) return noPoint("The code-switched or regional-language draft contains abuse but no separate proposition K1ND.world can safely preserve.");
  if (result.v412SignalRule) return noPoint("The coded construction is context-dependent and contains no proposition K1ND.world can safely reconstruct without inventing intent.");

  if (result.uncertaintyRule) return noPoint("The message uses obfuscation or uncertain targeted wording and contains no proposition the browser engine can recover safely.");

  if (/\bbottled\s+it\b|\bchok(?:e|ed|ing|er|e\s+artist)\b/i.test(text) && prior && !META_LANGUAGE.test(prior)) {
    return preserved(prior, "The participant lost confidence at a key moment", "Personal and/or appearance abuse");
  }

  if (/\bnever\s+(?:play|compete|coach|officiate)\b/i.test(norm)) {
    const sport = norm.match(/\b(tennis|football|golf|cricket|rugby|basketball|baseball|hockey|boxing)\b/)?.[1];
    const timing = /\btoday\b/.test(norm) ? " today" : "";
    const suggestion = `That ${sport ? `${sport} ` : ""}performance was not good enough${timing}.`;
    return preserved(suggestion, `The ${sport ? `${sport} ` : ""}performance was not good enough${timing}`, "The personal degradation and exclusionary command");
  }

  if (/\byou\s+(?:played|looked)\s+like\s+(?:an?\s+)?(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum)\b/i.test(text)) {
    const timing = /\btoday\b/i.test(text) ? " today" : "";
    return preserved(`That performance was disappointing${timing}.`, `The performance was disappointing${timing}`, "The personal comparison");
  }

  if (/\byour\s+family\s+must\s+be\s+proud\b/i.test(text)) {
    return preserved("That performance was disappointing.", "The performance was disappointing", "The family-directed personal attack");
  }

  if (/\b(?:shut\s+(?:the\s+)?fuck\s+up|shut\s+up|stfu)\b/i.test(text)) {
    return preserved("Please give me some space.", "A request for the interaction to stop", "The aggressive silencing phrase");
  }

  if (/\b(?:fuck|fucking|piss)\s+off\b|\b(?:go\s+)?fuck\s+yourself\b/i.test(text) && !SPORT_SIGNAL.test(text)) {
    return preserved("Please leave me alone.", "A request for distance", "The directed profanity");
  }

  // Appearance attacks, worthlessness/dehumanisation and bare insult labels do
  // not contain a legitimate point for the model to reconstruct.
  if (/\b(?:fat|ugly|hideous)\s+(?:cow|pig|slob|bitch|slag|skank|whore|slut)\b|\byou\s+(?:look|are|re)\s+(?:so\s+|really\s+)?(?:fat|ugly|hideous)\b/i.test(norm)) return noPoint();
  if (/\b(?:worthless|scum|disgusting|repulsive|vile|nothing|piece\s+of\s+(?:shit|trash|garbage))\b/i.test(norm)) return noPoint();
  if (/\bgo\s+cry\s+to\b|\bnobody\s+(?:wants|likes)\s+you\b|\b(?:fuck|screw)\s+(?:you|u)\b/i.test(norm)) return noPoint();
  if (/^\s*(?:you\s+(?:are|re|were)\s+)?(?:such\s+an?\s+|an?\s+)?(?:idiot|moron|clown|loser|muppet|numpty|donkey|bum|coward|useless|pathetic|hopeless|worthless)[.!?]*\s*$/i.test(text)) return noPoint();
  if (!SPORT_SIGNAL.test(text) && !DISCUSSION_SIGNAL.test(text) && !OBSERVABLE_SIGNAL.test(text) && new RegExp(`\\b${PERSONAL_LABEL}\\b`, "iu").test(text)) return noPoint();

  if (result.outcome === "block") {
    return noPoint("The original is prohibited and no separable, source-backed sporting or discussion proposition was found for a safe new draft.");
  }

  // Keep existing rewrites only when they are direct propositions. Reject
  // meta-copy about being respectful or "wanting to express" something.
  if (prior && !META_LANGUAGE.test(prior)) {
    return preserved(prior, "The recoverable opinion or request in the draft");
  }

  if (SPORT_SIGNAL.test(text)) {
    if (/\b(?:umpire|referee|official|decision|call)\b/i.test(text)) return preserved("I strongly disagree with that decision.", "Strong disagreement with the decision");
    const timing = /\btoday\b/i.test(text) ? " today" : "";
    return preserved(`That performance was disappointing${timing}.`, `The performance was disappointing${timing}`);
  }

  return noPoint();
}
