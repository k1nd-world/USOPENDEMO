import re
import unicodedata


VERSION = "k1nd-semantic-intent-4.22.0"

SEVERE_CATEGORIES = {
    "self_harm_encouragement", "targeted_violence", "sexual_violence",
    "identity_hate", "personal_contact", "doxxing", "threat", "harm",
    "slur", "racial_slur", "identity_slur", "homophobic_slur",
    "hate_symbol", "dehumanising", "severe_abuse", "discriminatory",
}

PROFANITY = re.compile(r"\b(?:fuck(?:ing|ed)?|shit(?:ty)?|shite|bullshit|piss(?:ed)?|damn|goddamn|bollocks|crap(?:py)?)\b", re.I)
PERSON = re.compile(r"\b(?:you|u|your|yours|yourself|he|him|his|she|her|hers|they|them|their|player|athlete|umpire|referee|official|coach|fan|@[a-z0-9_.-]+)\b", re.I)
SPORT = re.compile(r"\b(?:performance|match|game|set|result|decision|call|shot|serve|return|rally|point|forehand|backhand|volley|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|goal|save|team|final|tournament)\b", re.I)
IDEA = re.compile(r"\b(?:argument|point|idea|claim|take|opinion|view|analysis|reasoning|proposal|comment|message|post)\b", re.I)
PRAISE = re.compile(r"\b(?:great|brilliant(?:ly)?|amazing(?:ly)?|incredible|fantastic(?:ally)?|beautiful(?:ly)?|stunning|excellent|magnificent|perfect(?:ly)?|awesome|sensational|quality|love|loved)\b", re.I)
NEGATIVE = re.compile(r"\b(?:hate|hated|frustrating|awful|terrible|poor|bad|dreadful|shocking|disappointing|stupid|idiotic|clueless|useless|pathetic|hopeless|garbage|trash|rubbish|shit|shite|crap)\b", re.I)
PERSONAL_LABEL = re.compile(r"\b(?:idiot|moron|clown|loser|fool|genius|hero|champ|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b", re.I)
DIRECT_ATTACK = re.compile(
    r"\b(?:you|u|he|she|they|player|athlete|umpire|referee|official|coach|fan|@[a-z0-9_.-]+)\b[^.!?;]{0,28}\b(?:idiot|moron|clown|loser|fool|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b|"
    r"\b(?:idiot|moron|clown|loser|fool|fraud|coward|scum|worthless|pathetic|useless|garbage|trash|disgrace|fuckwit|dickhead|asshole|arsehole)\b[^.!?;]{0,16}\b(?:you|u|him|her|them|player|athlete|umpire|referee|official|coach|fan)\b",
    re.I,
)
DIRECTED_PROFANITY = re.compile(
    r"\b(?:fuck|screw)\s+(?:you|u|him|her|them|that\s+player|this\s+player|the\s+player|@[a-z0-9_.-]+)\b|"
    r"\b(?:fuck|piss)\s+off\b|\b(?:go\s+)?fuck\s+yourself\b|\b(?:shut\s+(?:the\s+)?fuck\s+up|stfu)\b",
    re.I,
)
THREAT = re.compile(
    r"\b(?:i(?:'|’)m|i am|i(?:'|’)ll|i will|gonna)\s+(?:(?:fucking|bloody|damn|goddamn)\s+)*(?:kill|hurt|stab|shoot|attack|beat|choke|strangle|kidnap|bomb|burn|poison)\s+(?:you|him|her|them|your family|that player)\b|"
    r"\b(?:watch your back|i know where you live|coming for you)\b",
    re.I,
)
REPORTING = re.compile(r"\b(?:said|says|wrote|posted|sent|called|told|quoted|repeated|received|reported|reporting|flagged|documented|screenshot|message\s+said|comment\s+said)\b", re.I)
COUNTERSPEECH = re.compile(
    r"\b(?:(?:do\s+not|don['’]?t|never|stop|quit|shouldn['’]?t|should\s+not)\s+(?:call(?:ing)?|say(?:ing)?|tell(?:ing)?|send(?:ing)?|post(?:ing)?|writ(?:e|ing)|us(?:e|ing)|repeat(?:ing)?)|"
    r"(?:condemn|reject|challenge|report|flag|remove|oppose|criticise|criticize)(?:ed|ing|s)?\s+(?:that|this|the)?\s*(?:abuse|insult|slur|comment|message|language)?)\b",
    re.I,
)
EDUCATIONAL = re.compile(r"\b(?:word|term|phrase|definition|dictionary|translation|translate|linguistic|etymology|dataset|research|study|analysis|moderation|policy|example|means?|meaning)\b", re.I)
SELF_REFERENCE = re.compile(r"\b(?:i\s+(?:am|was|acted|behaved|felt|looked)|i['’]?m|myself|my\s+own)\b", re.I)
SARCASM_ATTACK = re.compile(
    r"\b(?:nice|great|brilliant|excellent)\s+(?:one|job|work|going)?\s*[,—-]\s*(?:genius|hero|champ)\b|"
    r"\bthanks?\s+for\s+(?:losing|throwing|ruining|bottling)[^.!?]{0,30}\b(?:genius|hero|champ)\b",
    re.I,
)
COORDINATED_HARASSMENT = re.compile(
    r"\b(?:everyone|everybody|all of you|fans?|people)\b[^.!?;]{0,24}\b(?:go\s+)?(?:spam|swarm|flood|brigade|dogpile|harass|mass[- ]?report)\b[^.!?;]{0,36}\b(?:him|her|them|their|his|hers?|account|profile|mentions?|replies?)\b|"
    r"\b(?:spam|swarm|flood|brigade|dogpile|harass|mass[- ]?report)\b[^.!?;]{0,36}\b(?:him|her|them|their|his|hers?|account|profile|mentions?|replies?)\b",
    re.I,
)


def fold(value):
    normalized = unicodedata.normalize("NFKD", str(value or "")).lower().replace("’", "'")
    return re.sub(r"\s+", " ", "".join(char for char in normalized if not unicodedata.combining(char))).strip()


def split_clauses(text):
    compact = re.sub(r"\s+", " ", str(text or "")).strip()
    if not compact:
        return []
    pieces = re.split(
        r"(?<=[.!?;])\s+|,\s+(?=(?:you|u|he|she|they|@[a-z0-9])\b)|\s+(?=(?:but|however|although|yet|because|while)\b)",
        compact,
        flags=re.I,
    )
    return [item.strip() for item in pieces if item.strip()][:12]


class SemanticIntentReasoner:
    version = VERSION

    def _target(self, normalized, context):
        handle = re.search(r"@[a-z0-9_.-]+", normalized, re.I)
        if handle:
            return {"type": "person", "basis": "named account"}
        if IDEA.search(normalized):
            return {"type": "idea", "basis": "idea or statement"}
        if SPORT.search(normalized) and not DIRECT_ATTACK.search(normalized):
            return {"type": "sporting_action", "basis": "sporting object or performance"}
        if PERSON.search(normalized):
            return {"type": "person", "basis": "person-reference language"}
        if isinstance(context, dict) and context.get("targetUserId"):
            return {"type": "contextual_person", "basis": "authenticated target envelope"}
        return {"type": "none", "basis": "no target resolved"}

    def _profanity(self, normalized, act, target_type):
        if not PROFANITY.search(normalized):
            return {"present": False, "function": "none", "abuseSignal": False}
        if act == "threat":
            return {"present": True, "function": "harm-intensifying profanity", "abuseSignal": True}
        if act in {"dismissal", "personal_attack"}:
            return {"present": True, "function": "person-directed hostility", "abuseSignal": True}
        if act == "praise":
            return {"present": True, "function": "positive emotional intensifier", "abuseSignal": False}
        if target_type == "sporting_action":
            return {"present": True, "function": "emphatic sporting reaction", "abuseSignal": False}
        if act in {"reported_speech", "counterspeech", "analysis"}:
            return {"present": True, "function": "reported, opposed or analysed profanity", "abuseSignal": False}
        return {"present": True, "function": "untargeted emotional expression", "abuseSignal": False}

    def _clause(self, clause, index, context):
        normalized = fold(clause)
        target = self._target(normalized, context)
        reporting = bool(REPORTING.search(normalized))
        counter = bool(COUNTERSPEECH.search(normalized))
        educational = bool(EDUCATIONAL.search(normalized))
        self_directed = bool(SELF_REFERENCE.search(normalized) and not re.search(r"\byou\b", normalized, re.I))
        act, label, harmful, confidence, mechanism = "general_expression", "general expression", False, "medium", "none detected"
        if counter:
            act, label, confidence = "counterspeech", "opposing or preventing abuse", "high"
        elif reporting:
            act, label, confidence = "reported_speech", "reporting or quoting another person's wording", "high"
        elif educational:
            act, label, confidence = "analysis", "analysing language or policy", "high"
        elif THREAT.search(normalized):
            act, label, harmful, confidence, mechanism = "threat", "threatening a person", True, "high", "violent intimidation"
        elif COORDINATED_HARASSMENT.search(normalized):
            act, label, harmful, confidence, mechanism = "campaign_harassment", "coordinating a targeted pile-on", True, "high", "coordinated targeting"
            target = {"type": "person", "basis": "coordinated-target reference"}
        elif DIRECTED_PROFANITY.search(normalized):
            act, label, harmful, confidence, mechanism = "dismissal", "directing hostility or dismissal", True, "high", "person-directed hostility"
        elif SARCASM_ATTACK.search(normalized):
            act, label, harmful, confidence, mechanism = "implicit_personal_attack", "sarcastic personal degradation", True, "high", "contempt disguised as praise"
            target = {"type": "person", "basis": "sarcastic vocative label"}
        elif DIRECT_ATTACK.search(normalized):
            act, label, harmful, confidence, mechanism = "personal_attack", "degrading a person", True, "high", "personal degradation"
        elif self_directed and PERSONAL_LABEL.search(normalized):
            act, label, confidence = "self_criticism", "self-directed criticism", "high"
        elif PRAISE.search(normalized) and not NEGATIVE.search(normalized):
            act, label, confidence = "praise", "expressing praise", "high"
        elif target["type"] == "sporting_action" and NEGATIVE.search(normalized):
            act, label, confidence = "sporting_criticism", "criticising play or performance", "high"
        elif target["type"] == "idea" and NEGATIVE.search(normalized):
            act, label, confidence = "idea_criticism", "criticising an idea or statement", "high"
        elif PROFANITY.search(normalized):
            act, label = "emotional_expression", "expressing strong emotion"
        return {
            "id": f"clause-{index + 1}", "ordinal": index + 1, "characters": len(str(clause or "")),
            "target": target, "speechAct": {"id": act, "label": label},
            "stance": "opposes harmful wording" if counter else ("attributes wording to another speaker" if reporting else ("analytical" if educational else ("self-directed" if self_directed else "authorial"))),
            "profanity": self._profanity(normalized, act, target["type"]), "harmful": harmful,
            "mechanism": mechanism, "confidence": confidence, "rawTextReturned": False,
        }

    def _counterfactual(self, label, transformed, context):
        clauses = [self._clause(part, index, context) for index, part in enumerate(split_clauses(transformed))]
        harmful = any(item["harmful"] for item in clauses)
        dominant = next((item for item in clauses if item["harmful"]), clauses[0] if clauses else None)
        return {
            "label": label, "harmful": harmful,
            "dominantSpeechAct": dominant["speechAct"]["label"] if dominant else "no remaining speech act",
            "rawTextReturned": False,
        }

    def analyze(self, text, decision, context=None):
        context = context if isinstance(context, dict) else {}
        clauses = [self._clause(part, index, context) for index, part in enumerate(split_clauses(text))]
        harmful = [item for item in clauses if item["harmful"]]
        safe = [item for item in clauses if not item["harmful"]]
        severe_floor = decision.get("outcome") == "block" or decision.get("category") in SEVERE_CATEGORIES
        implicit_attack = any(item["speechAct"]["id"] == "implicit_personal_attack" for item in clauses)
        represented_personal_attack = any(
            item["speechAct"]["id"] in {"personal_attack", "implicit_personal_attack", "dismissal", "campaign_harassment"}
            and item["confidence"] == "high"
            for item in clauses
        )
        campaign_attack = any(item["speechAct"]["id"] == "campaign_harassment" for item in clauses)
        semantic_outcome = decision.get("outcome")
        if not severe_floor and represented_personal_attack and semantic_outcome == "clean":
            semantic_outcome = "review" if campaign_attack else "warning"
        without_profanity = self._counterfactual("Remove profanity", PROFANITY.sub(" ", str(text or "")), context)
        target_removed = re.sub(r",?\s*\b(?:genius|hero|champ)\b", " ", str(text or ""), flags=re.I)
        without_target = self._counterfactual("Remove person target", PERSON.sub(" ", target_removed), context)
        disagreement = semantic_outcome != decision.get("outcome")
        dominant = harmful[0] if harmful else (clauses[0] if clauses else None)
        return {
            "version": self.version,
            "clauses": clauses,
            "summary": {
                "clauseCount": len(clauses), "harmfulClauses": len(harmful), "safeClauses": len(safe),
                "dominantSpeechAct": dominant["speechAct"]["label"] if dominant else "no speech act",
                "mixedIntent": bool(harmful and safe),
            },
            "counterfactuals": [
                {**without_profanity, "conclusion": "The profanity test isolates tone from independently harmful intent."},
                {**without_target, "conclusion": "The target test checks whether harm depends on a person-directed reading."},
            ],
            "severeFloor": {"locked": severe_floor, "reason": "A severe-harm family is non-downgradable." if severe_floor else "No severe-harm floor was invoked."},
            "recommendation": {
                "outcome": semantic_outcome,
                "reason": (
                    "Clause reasoning detected high-confidence contempt disguised as praise."
                    if implicit_attack
                    else "Clause reasoning detected a request to coordinate targeted harassment."
                    if campaign_attack
                    else "Clause reasoning detected a represented high-confidence person-directed attack."
                    if represented_personal_attack and decision.get("outcome") == "clean"
                    else "Clause reasoning agrees with the policy outcome."
                ),
            },
            "disagreement": {"present": disagreement, "baseline": decision.get("outcome"), "semantic": semantic_outcome, "route": "semantic intervention" if disagreement else "none"},
            "confidence": "bounded" if any(item["confidence"] == "medium" for item in clauses) else "high for represented patterns",
            "rawTextReturned": False,
        }

    def apply(self, text, decision, context=None):
        semantic = self.analyze(text, decision, context)
        if semantic["severeFloor"]["locked"] or not semantic["disagreement"]["present"]:
            return decision, semantic
        if decision.get("outcome") == "clean" and semantic["recommendation"]["outcome"] in {"warning", "review"}:
            speech_act = semantic.get("summary", {}).get("dominantSpeechAct")
            implicit = speech_act == "sarcastic personal degradation"
            campaign = speech_act == "coordinating a targeted pile-on"
            updated = {
                **decision,
                "outcome": "review" if campaign else "warning",
                "category": "campaign_harassment" if campaign else "personal_degradation",
                "reason": (
                    "Server semantic policy detected implicit personal degradation"
                    if implicit
                    else "Server semantic policy detected coordinated targeted harassment"
                    if campaign
                    else "Server semantic policy detected a high-confidence person-directed attack"
                ),
                "matchedRuleIds": [
                    "server-semantic-sarcastic-degradation"
                    if implicit
                    else "server-semantic-coordinated-harassment"
                    if campaign
                    else "server-semantic-person-directed-attack"
                ],
                "semanticOverride": (
                    "implicit_personal_attack" if implicit else "coordinated_harassment" if campaign else "person_directed_attack"
                ),
            }
            return updated, self.analyze(text, updated, context)
        return decision, semantic
