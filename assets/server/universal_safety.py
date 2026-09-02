import json
import re
import unicodedata
from pathlib import Path

from policy_engine import RANK, fold, strongest_outcome
from semantic_reasoner import SemanticIntentReasoner


VERSION = "k1nd-universal-safety-4.19.0"
POLICY_GRAPH_PATH = Path(__file__).with_name("universal_policy.json")

CONFUSABLES = str.maketrans({
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
    "і": "i", "ј": "j", "ԁ": "d", "ɡ": "g", "ⅼ": "l", "ո": "n",
})


def _protected_pattern(term):
    compact = re.sub(r"[^a-z0-9]", "", term.lower())
    body = r"[^a-z0-9]{0,12}".join(rf"{re.escape(char)}+" for char in compact)
    return re.compile(rf"(?<![a-z0-9]){body}(?![a-z0-9])", re.I)


PROTECTED_SEVERE_TERMS = {
    "self_harm_encouragement": (
        "kill yourself", "go kill yourself", "unalive yourself", "neck yourself",
        "off yourself", "hang yourself", "slit your wrists", "end your life", "go die",
    ),
    "targeted_violence": (
        "i will kill you", "i will hurt you", "i will stab you", "i will shoot you",
        "watch your back", "i know where you live",
    ),
    "sexual_violence": (
        "i will rape you", "you deserve to be raped", "someone should rape you",
    ),
    "identity_hate": (
        "nigger", "nigga", "coon", "cotton picker",
    ),
}

PROTECTED_SEVERE_PATTERNS = {
    family: tuple(_protected_pattern(term) for term in terms)
    for family, terms in PROTECTED_SEVERE_TERMS.items()
}

REPORTING_CONTEXT = re.compile(
    r"\b(?:report(?:ing|ed)?|quote(?:d|s)?|called me|said to me|told me|received this|moderation test|"
    r"policy example|dictionary|translation|research|documenting|do not say|don['’]t say|"
    r"prevention message|support message)\b",
    re.I,
)
NEGATED_COMMAND = re.compile(r"\b(?:do not|don['’]t|never|should not|shouldn['’]t)\b.{0,32}\b(?:kill|hurt|harm|rape|attack)\b", re.I)
DIRECT_PERSON = re.compile(r"\b(?:you|your|u|ur|him|her|them|that player|the player|the umpire)\b", re.I)
GROUP_SIGNAL = re.compile(r"\b(?:people|group|race|religion|nationality|ethnicity|women|men|immigrants|fans)\b", re.I)
PROFANITY_SIGNAL = re.compile(r"\b(?:fuck(?:ing|ed)?|shit(?:ty)?|shite|bullshit|piss(?:ed)?|damn|goddamn|bollocks|crap(?:py)?)\b", re.I)
PRAISE_SIGNAL = re.compile(r"\b(?:great|brilliant(?:ly)?|amazing(?:ly)?|incredible|fantastic(?:ally)?|beautiful(?:ly)?|stunning|unbelievable|excellent|magnificent|perfect(?:ly)?|awesome|sensational|quality|love|loved)\b", re.I)
SPORT_SIGNAL = re.compile(r"\b(?:performance|match|game|set|result|decision|call|shot|serve|return|rally|point|forehand|backhand|volley|strategy|tactic|play|pass|tackle|penalty|lap|over|wicket|delivery|race|goal|save|team|final|tournament)\b", re.I)
DIRECTED_PROFANITY_SIGNAL = re.compile(
    r"\b(?:fuck|screw)\s+(?:you|u|him|her|them|that player|this player|the player|that umpire|the umpire|that referee|the referee|@[a-z0-9_.-]+)\b|"
    r"\b(?:fuck|piss)\s+off\b|\b(?:go\s+)?fuck\s+yourself\b|\b(?:shut\s+(?:the\s+)?fuck\s+up|stfu)\b",
    re.I,
)

SCRIPT_RANGES = (
    ("Latin", 0x0041, 0x024F), ("Greek", 0x0370, 0x03FF), ("Cyrillic", 0x0400, 0x052F),
    ("Hebrew", 0x0590, 0x05FF), ("Arabic", 0x0600, 0x06FF), ("Devanagari", 0x0900, 0x097F),
    ("Bengali", 0x0980, 0x09FF), ("Gurmukhi", 0x0A00, 0x0A7F), ("Gujarati", 0x0A80, 0x0AFF),
    ("Tamil", 0x0B80, 0x0BFF), ("Telugu", 0x0C00, 0x0C7F), ("Kannada", 0x0C80, 0x0CFF),
    ("Malayalam", 0x0D00, 0x0D7F), ("Thai", 0x0E00, 0x0E7F), ("Georgian", 0x10A0, 0x10FF),
    ("Hangul", 0xAC00, 0xD7AF), ("Hiragana", 0x3040, 0x309F), ("Katakana", 0x30A0, 0x30FF),
    ("Han", 0x4E00, 0x9FFF),
)

SPEECH_ACTS = {
    "self_harm_encouragement": "direct self-harm instruction",
    "targeted_violence": "threat or declaration of violent intent",
    "sexual_violence": "sexual threat or coercive degradation",
    "identity_hate": "identity-directed hate expression",
    "personal_contact": "disclosure of personal contact or location data",
    "personal_degradation": "person-directed degrading judgement",
    "campaign_harassment": "repeat or coordinated targeting signal",
    "allowed": "general expression",
    "no_text": "no speech act",
}

ROUTES = {
    "self_harm_encouragement": {
        "id": "self_harm_safety", "label": "Self-harm safety", "priority": "critical",
        "nextStep": "Block the direction and present the platform safety intervention.",
        "boundary": "This is content-safety routing, not a clinical or suicide-risk assessment.",
        "externalDelivery": "not_configured",
    },
    "targeted_violence": {
        "id": "credible_violence", "label": "Credible violence", "priority": "critical",
        "nextStep": "Block, preserve restricted evidence and evaluate intent, access, method, location and imminence.",
        "boundary": "A threat match is not proof of credibility; trained human verification remains required.",
        "externalDelivery": "human_authorized_route_not_configured",
    },
    "sexual_violence": {
        "id": "sexual_safety", "label": "Sexual safety", "priority": "critical",
        "nextStep": "Block and route for trauma-informed safeguarding review.",
        "boundary": "Victim reporting and educational discussion require distinct stance review.",
        "externalDelivery": "not_configured",
    },
    "identity_hate": {
        "id": "identity_hate", "label": "Identity hate", "priority": "high",
        "nextStep": "Block direct hate and retain target, stance and context evidence for review.",
        "boundary": "Reclaimed, quoted and counterspeech uses need language- and community-informed review.",
        "externalDelivery": "not_configured",
    },
    "personal_contact": {
        "id": "privacy_safeguarding", "label": "Privacy safeguarding", "priority": "critical",
        "nextStep": "Block exposure and restrict access to the underlying evidence.",
        "boundary": "No external evidence vault or removal network is connected in this build.",
        "externalDelivery": "not_configured",
    },
    "personal_degradation": {
        "id": "community_integrity", "label": "Community integrity", "priority": "medium",
        "nextStep": "Intervene at composition time and offer a meaning-preserving rewrite.",
        "boundary": "Strong criticism of play and performance remains allowed.",
        "externalDelivery": "not_applicable",
    },
}


class UniversalSafetyEngine:
    """One server-owned reasoning path. It can escalate a baseline decision but never weaken it."""

    version = VERSION

    def __init__(self, policy, contextual_adapter):
        self.policy = policy
        self.contextual_adapter = contextual_adapter
        self.semantic = SemanticIntentReasoner()
        self.graph = json.loads(POLICY_GRAPH_PATH.read_text(encoding="utf-8"))

    def _normalized(self, text):
        return fold(text).translate(CONFUSABLES)

    def _protected_match(self, text):
        normalized = self._normalized(text)
        for family, patterns in PROTECTED_SEVERE_PATTERNS.items():
            for index, pattern in enumerate(patterns):
                if pattern.search(normalized):
                    return family, f"universal-protected-{family}-{index + 1}"
        return None, None

    def classify(self, text):
        baseline = self.policy.classify(text)
        family, rule_id = self._protected_match(text)
        if not family:
            semantic_decision, _ = self.semantic.apply(text, baseline)
            return {**semantic_decision, "authority": "server_authoritative", "baselinePolicyVersion": self.policy.version, "reasoningVersion": self.version}

        original = str(text or "")
        reporting = bool(REPORTING_CONTEXT.search(original) or NEGATED_COMMAND.search(original))
        proposed = "review" if reporting and baseline.get("outcome") == "clean" else "block"
        final = strongest_outcome(baseline.get("outcome"), proposed)
        if RANK.get(baseline.get("outcome"), 0) >= RANK[proposed]:
            return {**baseline, "authority": "server_authoritative", "baselinePolicyVersion": self.policy.version, "reasoningVersion": self.version, "protectedSevereFamily": family}
        reason = (
            "Universal server policy retained a severe signal for stance review"
            if proposed == "review"
            else "Universal server policy detected a protected severe-harm pattern after evasion normalization"
        )
        return {
            "outcome": final,
            "category": family,
            "reason": reason,
            "matchedRuleIds": [rule_id],
            "policyVersion": self.version,
            "baselinePolicyVersion": self.policy.version,
            "sourceRuleCount": self.policy.source_rule_count,
            "executablePatternCount": self.policy.executable_patterns + sum(len(items) for items in PROTECTED_SEVERE_PATTERNS.values()),
            "skippedPatternCount": self.policy.skipped_patterns,
            "independent": True,
            "authority": "server_authoritative",
            "reasoningVersion": self.version,
            "protectedSevereFamily": family,
        }

    def _scripts(self, text):
        scripts = []
        for label, start, end in SCRIPT_RANGES:
            if any(start <= ord(char) <= end and char.isalpha() for char in str(text or "")):
                scripts.append(label)
        return scripts or ["undetermined"]

    def _language_signals(self, text, scripts):
        folded = self._normalized(text)
        signals = []
        if "Latin" in scripts:
            signals.append("Latin-script language signal")
        if "Cyrillic" in scripts:
            signals.append("Cyrillic-script language signal")
        if any(script in scripts for script in ("Arabic", "Devanagari", "Gujarati", "Gurmukhi", "Bengali")):
            signals.append("South Asian or Arabic-script language signal")
        if len([script for script in scripts if script != "undetermined"]) > 1:
            signals.append("mixed-script or code-switching signal")
        if re.search(r"\b(?:you|your|i will|go|the|that|was)\b", folded):
            signals.append("English lexical signal")
        return signals or ["language not resolved from deterministic signals"]

    def _target(self, text, category, context):
        context = context if isinstance(context, dict) else {}
        if context.get("targetUserId"):
            return {
                "class": "specific participant", "id": str(context.get("targetUserId")),
                "role": str(context.get("targetRole") or ("professional athlete" if context.get("targetIsAthlete") else "participant")),
                "isU18": bool(context.get("targetIsU18")), "basis": "authenticated structured context",
            }
        if category == "identity_hate" and GROUP_SIGNAL.search(str(text or "")):
            return {"class": "identity group", "id": None, "role": "protected-group reference", "isU18": False, "basis": "language signal"}
        if category in {"self_harm_encouragement", "targeted_violence", "sexual_violence", "personal_degradation"} or DIRECT_PERSON.search(str(text or "")):
            return {"class": "addressed person", "id": None, "role": "conversation participant", "isU18": False, "basis": "direct-address signal"}
        sport = SPORT_SIGNAL.search(str(text or ""))
        if sport:
            return {"class": "sporting action or object", "id": sport.group(0).lower(), "role": None, "isU18": False, "basis": "sporting-language signal"}
        return {"class": "no clear person", "id": None, "role": None, "isU18": False, "basis": "no target signal"}

    def _profanity_function(self, text, decision):
        original = str(text or "")
        if not PROFANITY_SIGNAL.search(original):
            return {"present": False, "function": "none", "targeted": False, "abuseSignal": False}
        if decision.get("category") in {"targeted_violence", "sexual_violence", "self_harm_encouragement"}:
            return {
                "present": True, "function": "harm-intensifying profanity",
                "targeted": True, "abuseSignal": True,
                "rationale": "The profanity intensifies an independently detected threat, coercive act or harmful instruction.",
            }
        if DIRECTED_PROFANITY_SIGNAL.search(original) or decision.get("category") == "personal_degradation":
            return {
                "present": True, "function": "person-directed hostility or dismissal",
                "targeted": True, "abuseSignal": True,
                "rationale": "The profanity is grammatically directed at a person or performs a dismissive command.",
            }
        if PRAISE_SIGNAL.search(original):
            function = "positive emotional intensifier"
        elif SPORT_SIGNAL.search(original):
            function = "emphatic sporting reaction"
        else:
            function = "untargeted exclamation or intensifier"
        return {
            "present": True, "function": function, "targeted": False, "abuseSignal": False,
            "rationale": "The profanity adds emotional force but does not attack, threaten, degrade, exclude or expose a person.",
        }

    def _mechanism(self, category, decision):
        mapping = {
            "self_harm_encouragement": "harmful instruction",
            "targeted_violence": "violent intimidation",
            "sexual_violence": "sexual threat or coercion",
            "identity_hate": "identity degradation",
            "personal_contact": "privacy exposure",
            "personal_degradation": "direct personal degradation",
            "suspected_evasion": "obfuscation or evasion",
            "allowed": "none detected",
        }
        return mapping.get(category, category.replace("_", " ") if decision != "clean" else "none detected")

    def _policy_family(self, category):
        category = str(category or "allowed")
        if category in {"self_harm_encouragement", "targeted_violence", "sexual_violence", "identity_hate", "personal_contact", "personal_degradation"}:
            return category
        if any(marker in category for marker in ("identity", "slur", "homophobic", "transphobic", "antisemit", "racist", "racial", "ethnic", "coded_exclusion")):
            return "identity_hate"
        if any(marker in category for marker in ("sexualised", "sexualized", "sexual_coerc", "rape")):
            return "sexual_violence"
        if any(marker in category for marker in ("dox", "contact", "address", "phone", "privacy")):
            return "personal_contact"
        if any(marker in category for marker in ("degradation", "ridicule", "taunting", "dismiss", "profanity", "silencing", "personal_abuse", "dehumanising_label")):
            return "personal_degradation"
        return category

    def _route(self, category, context, final):
        route = dict(ROUTES.get(category) or {
            "id": "community_integrity", "label": "Community integrity", "priority": "low" if final == "clean" else "medium",
            "nextStep": "Retain the server decision and monitor only if new evidence appears.",
            "boundary": "No specialist harm conclusion was reached.", "externalDelivery": "not_applicable",
        })
        context = context if isinstance(context, dict) else {}
        route["secondaryRoute"] = "child_safeguarding" if context.get("targetIsU18") and final != "clean" else None
        route["humanVerificationRequired"] = category in {"targeted_violence", "sexual_violence", "identity_hate", "personal_contact"} or bool(route["secondaryRoute"])
        return route

    def explain(self, text, server_decision, context_decision, context, client_outcome="clean", media_outcome="clean", final_outcome=None):
        context = context if isinstance(context, dict) else {}
        final = final_outcome or strongest_outcome(client_outcome, server_decision.get("outcome"), media_outcome, context_decision.get("outcome"))
        category = server_decision.get("category") or "allowed"
        policy_family = self._policy_family(category)
        scripts = self._scripts(text)
        reporting = bool(REPORTING_CONTEXT.search(str(text or "")) or NEGATED_COMMAND.search(str(text or "")))
        target = self._target(text, policy_family, context)
        profanity = self._profanity_function(text, server_decision)
        semantic = self.semantic.analyze(text, server_decision, context)
        if reporting and profanity.get("present") and final == "clean":
            profanity = {
                **profanity, "function": "reported or quoted profanity", "targeted": False, "abuseSignal": False,
                "rationale": "The wording attributes or analyses profanity rather than using it as the author's attack.",
            }
        mechanism = "emotional emphasis (non-abusive)" if final == "clean" and profanity.get("present") and not profanity.get("abuseSignal") else self._mechanism(category, final)
        route = self._route(policy_family, context, final)
        route["additionalRoutes"] = ["campaign_safety"] if int(context.get("cumulativeSignals") or 0) >= 3 and final != "clean" else []
        base_score = {"clean": 8, "warning": 38, "review": 66, "block": 92}.get(final, 66)
        score = min(100, base_score + (5 if context.get("targetIsU18") and final != "clean" else 0) + (3 if int(context.get("cumulativeSignals") or 0) >= 2 else 0))
        speech_act = SPEECH_ACTS.get(policy_family, "policy-relevant expression" if final != "clean" else "general expression")
        if reporting:
            speech_act = "reporting, quoting or analysing language"
        elif final == "clean" and profanity.get("function") == "positive emotional intensifier":
            speech_act = "emphatic praise"
        elif final == "clean" and profanity.get("function") == "emphatic sporting reaction":
            speech_act = "emphatic sporting reaction"
        elif final == "clean" and profanity.get("present"):
            speech_act = "untargeted emotional expression"
        context_signals = list(context_decision.get("signals") or [])
        if profanity.get("present"):
            context_signals.append(f"profanity function: {profanity.get('function')}")
        return {
            "version": self.version,
            "authority": {
                "decision": "server_authoritative", "browserRole": "early intervention and evidence signal",
                "deterministicFloor": True, "clientMayWeaken": False,
            },
            "decision": {
                "outcome": final, "category": category, "policyFamily": policy_family, "action": "prevent publication" if final == "block" else ("pause for review" if final == "review" else ("offer intervention and rewrite" if final == "warning" else "allow")),
                "reason": server_decision.get("reason"),
            },
            "reasoning": {
                "normalization": {
                    "status": "complete", "originalCharacters": len(str(text or "")),
                    "normalizedCharacters": len(self._normalized(text)), "evasionAware": True, "rawTextReturned": False,
                },
                "language": {
                    "scripts": scripts, "signals": self._language_signals(text, scripts),
                    "codeSwitching": len([item for item in scripts if item != "undetermined"]) > 1,
                    "confidenceBoundary": "heuristic script and lexical signals; no production language-identification model configured",
                },
                "target": target,
                "speechAct": speech_act,
                "stance": "reported, quoted or preventative" if reporting else "authorial or direct",
                "mechanism": mechanism,
                "profanity": profanity,
                "semanticIntent": semantic,
                "contextRisk": {
                    "score": score, "band": "critical" if score >= 90 else ("high" if score >= 65 else ("medium" if score >= 35 else "low")),
                    "signals": context_signals,
                    "priorTargetedInterventions": context_decision.get("priorTargetedInterventions", 0),
                    "probabilityClaim": False,
                },
            },
            "specialistRouting": route,
            "pipeline": [
                {"id": "normalize", "label": "Evasion-safe normalization", "status": "complete"},
                {"id": "language", "label": "Script and language signals", "status": "complete"},
                {"id": "clauses", "label": "Clause-level intent", "status": "complete"},
                {"id": "target", "label": "Target resolution", "status": "complete"},
                {"id": "speech_act", "label": "Speech act and stance", "status": "complete"},
                {"id": "mechanism", "label": "Abuse mechanism", "status": "complete"},
                {"id": "counterfactual", "label": "Counterfactual checks", "status": "complete"},
                {"id": "context", "label": "Cross-thread context", "status": context_decision.get("status", "complete")},
                {"id": "route", "label": "Specialist harm route", "status": "complete"},
                {"id": "action", "label": "Authoritative action", "status": "complete"},
            ],
            "boundaries": {
                "coverage": "Deterministic demo coverage is broad but not universal; representative field quality is not yet measured.",
                "learning": "No detector can learn into live enforcement automatically.",
                "delivery": "No WTA, ATP, venue-security or emergency-service connector is configured.",
                "rawEvidence": "This explanation returns structure and hashes, never the submitted text.",
            },
        }

    def inspect(self, text, context=None):
        context = context if isinstance(context, dict) else {}
        server = self.classify(text)
        context_decision = self.contextual_adapter.assess(server["outcome"], context, [])
        final = strongest_outcome(server["outcome"], context_decision["outcome"])
        return self.explain(text, server, context_decision, context, "clean", "clean", final)

    def summary(self):
        return {
            "version": self.version,
            "policyGraph": self.graph,
            "authority": {
                "decision": "server_authoritative", "browserRole": "early intervention and evidence signal",
                "clientMayWeaken": False, "protectedLexiconPublic": False,
            },
            "pipeline": [
                {"id": "normalize", "label": "Normalize", "purpose": "Recover joined, separated, repeated, leetspeak, mixed-script and Unicode variants."},
                {"id": "language", "label": "Language", "purpose": "Record script, transliteration and code-switching signals with an explicit confidence boundary."},
                {"id": "clauses", "label": "Clauses", "purpose": "Separate mixed praise, criticism, reporting and personal attack instead of flattening the whole post."},
                {"id": "target", "label": "Target", "purpose": "Separate performance criticism, person-directed abuse and identity-group targeting."},
                {"id": "speech_act", "label": "Speech act", "purpose": "Distinguish threat, instruction, degradation, quotation, reporting and counterspeech."},
                {"id": "mechanism", "label": "Mechanism", "purpose": "Explain what makes the expression harmful rather than returning a word-list match."},
                {"id": "counterfactual", "label": "Counterfactuals", "purpose": "Remove profanity and person targets to test which element actually changes the harmful reading."},
                {"id": "context", "label": "Context", "purpose": "Escalate for vulnerable or repeated targeting without weakening base policy."},
                {"id": "route", "label": "Specialist route", "purpose": "Send each harm family to the correct safety workflow."},
                {"id": "action", "label": "Action", "purpose": "Issue one server-owned allow, intervene, review or block result."}
            ],
            "specialistRoutes": list(ROUTES.values()) + [{
                "id": "child_safeguarding", "label": "Child safeguarding", "priority": "critical",
                "nextStep": "Escalate non-clean decisions targeting a verified under-18 participant.",
                "boundary": "Age and safeguarding status must come from verified platform context.", "externalDelivery": "not_configured",
            }],
            "languageCoverage": {
                "functionalGroupsInherited": 49,
                "scriptSignals": [item[0] for item in SCRIPT_RANGES],
                "transliterationAware": True, "codeSwitchingAware": True,
                "nativeModel": "not_configured",
                "boundary": "Coverage count describes deterministic functional groups, not validated native-speaker quality across every language.",
            },
        }
