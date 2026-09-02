import json
import re
import unicodedata
from pathlib import Path

RANK = {"clean": 0, "warning": 1, "review": 2, "block": 3}
POLICY_PATH = Path(__file__).with_name("policy_snapshot.json")

def evasion_phrase(term):
    body = r"[^a-z0-9]{0,12}".join(rf"{re.escape(char)}+" for char in term)
    return re.compile(rf"(?:^|[^a-z0-9]){body}(?=$|[^a-z0-9])", re.I)


SELF_HARM_COMMANDS = [
    evasion_phrase(term) for term in (
        "killyourself", "gokillyourself", "unaliveyourself", "neckyourself",
        "offyourself", "hangyourself", "slityourwrists", "endyourlife", "godie", "kys",
    )
]

THREATS = [
    re.compile(r"\b(?:i(?:'|’)m(?:\s+going\s+to)?|i am(?:\s+going\s+to)?|i(?:'|’)ll|i will|gonna)\s+(?:(?:fucking|bloody|damn|goddamn)\s+)*(?:kill|hurt|stab|shoot|attack|beat|choke|strangle|kidnap|bomb|burn|poison)\s+(?:you|him|her|them|your family|that player)\b", re.I),
    re.compile(r"\b(?:watch your back|i know where you live)\b", re.I),
]
PERSONAL_CONTACT = [
    re.compile(r"\b(?:\+?44\s?7\d{3}|07\d{3})[\s-]?\d{3}[\s-]?\d{3}\b"),
    re.compile(r"\b\d{1,4}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+(?:road|street|lane|avenue|drive|close|way)\b", re.I),
]
PROTECTED_CONTEXT = re.compile(
    r"\b(?:dictionary|defines?|word|term|means?|translation|example|histor(?:y|ical)|research|moderator|"
    r"report(?:ing|ed)?|called me|said to me|told me|don[’']t call|do not call|stop saying|quoted?|spell|"
    r"diccionario|define|palabra|dictionnaire|mot|w[oö]rterbuch|wort|dizionario|parola|dicion[aá]rio|palavra|"
    r"s[lł]ownik|s[lł]owo|s[oõ]naraamat|s[oõ]na)\b",
    re.I,
)
DIRECT_TARGET = re.compile(r"(?:^|[.!?]\s*)(?:you|u|he|she|they|that player|this player|the player|the umpire|tu|tú|vous|du|ihr|tum|tumi|nee|ty|sa)\b", re.I)
OBFUSCATED_TARGET = re.compile(r"\b(?:you|u|he|she|player|athlete)\b.{0,20}(?:[a-z][\W_]+){3,}[a-z]", re.I)
CORE_PERSONAL_ATTACKS = [
    re.compile(r"\b(?:you|u)\s+(?:are|re|r)\s+(?:an?\s+)?(?:idiot|clown|moron|loser|fool|cookers?)\b", re.I),
    re.compile(r"\b(?:he|she|they|the player|that player|the umpire)\s+(?:is|are)\s+(?:an?\s+)?(?:idiot|clown|moron|loser|fool)\b", re.I),
    re.compile(r"\bty\s+jeste(?:s|ś)\s+(?:kurw(?:a|o|ą|ę|y)|idiot(?:a|ą)?)\b", re.I),
    re.compile(r"\bsa\s+oled\s+(?:loll|idioot|debiilik|sitapea|vardjas)\b", re.I),
]
DIRECTED_PROFANITY = [
    re.compile(r"\b(?:fuck|screw)\s+(?:you|u|him|her|them|that player|this player|the player|that umpire|the umpire|that referee|the referee|@[a-z0-9_.-]+)\b", re.I),
    re.compile(r"\b(?:fuck|piss)\s+off\b|\b(?:go\s+)?fuck\s+yourself\b|\b(?:shut\s+(?:the\s+)?fuck\s+up|stfu)\b", re.I),
    re.compile(r"\b(?:you|u|he|she|they|the player|that player|the umpire)\b.{0,18}\bfucking\s+(?:idiot|clown|moron|loser|fool|useless|pathetic|fuckwit|asshole)\b", re.I),
]
LITERAL_COOKER = re.compile(r"\b(?:slow|rice|pressure)\s+cookers?\b|\b(?:kitchen|appliance|recipe)\b.{0,24}\bcookers?\b", re.I)


def fold(value):
    value = unicodedata.normalize("NFKC", str(value or "")).lower()
    latin_folded = "".join(ch for ch in unicodedata.normalize("NFKD", value) if not unicodedata.combining(ch))
    return latin_folded.replace("0", "o").replace("1", "i").replace("3", "e").replace("4", "a").replace("5", "s").replace("7", "t")


class PolicyEngine:
    def __init__(self, path=POLICY_PATH):
        snapshot = json.loads(Path(path).read_text(encoding="utf-8"))
        self.version = snapshot["version"]
        self.source_rule_count = snapshot["sourceRuleCount"]
        self.rules = []
        self.skipped_patterns = 0
        for rule in snapshot["rules"]:
            compiled = []
            for pattern in rule.get("patterns", []):
                try:
                    if pattern["type"] == "literal":
                        literal = fold(pattern["value"])
                        source = re.escape(literal)
                        if literal and literal[0].isascii() and literal[-1].isascii():
                            source = rf"(?<!\w){source}(?!\w)"
                    else:
                        source = pattern["value"]
                    compiled.append(re.compile(source, re.I))
                except (re.error, IndexError):
                    self.skipped_patterns += 1
            target = None
            if rule.get("targets"):
                try:
                    target = re.compile(rf"(?<!\w)(?:{rule['targets']})(?!\w)", re.I)
                except re.error:
                    self.skipped_patterns += 1
            self.rules.append({**rule, "compiled": compiled, "targetCompiled": target})
        self.executable_patterns = sum(len(rule["compiled"]) for rule in self.rules)

    def classify(self, text):
        original = str(text or "").strip()
        normalized = fold(original)
        if not normalized:
            return self._result("clean", "no_text", "No text supplied", [])
        for command in SELF_HARM_COMMANDS:
            if command.search(normalized):
                return self._result("block", "self_harm_encouragement", "Independent server policy detected encouragement of suicide or self-harm", ["server-core-self-harm-encouragement"])
        for threat in THREATS:
            if threat.search(normalized):
                return self._result("block", "targeted_violence", "Independent server policy detected a targeted threat", ["server-core-threat"])
        for contact in PERSONAL_CONTACT:
            if contact.search(original):
                return self._result("block", "personal_contact", "Independent server policy detected personal contact or location information", ["server-core-personal-contact"])

        protected = bool(PROTECTED_CONTEXT.search(original))
        if not protected:
            for pattern in DIRECTED_PROFANITY:
                if pattern.search(normalized):
                    return self._result("warning", "personal_degradation", "Independent server policy detected person-directed profanity or dismissal", ["server-core-directed-profanity"])
            for pattern in CORE_PERSONAL_ATTACKS:
                if pattern.search(normalized):
                    return self._result("warning", "personal_degradation", "Independent server policy detected a person-directed degrading label", ["server-core-personal-degradation"])
        direct = bool(DIRECT_TARGET.search(original))
        matches = []
        for rule in self.rules:
            if not rule["compiled"]:
                continue
            matched = any(pattern.search(original.lower()) or pattern.search(normalized) for pattern in rule["compiled"])
            if not matched:
                continue
            if rule.get("id") == "au-cooker-label" and LITERAL_COOKER.search(original):
                continue
            targeted = direct or bool(rule["targetCompiled"] and (rule["targetCompiled"].search(original) or rule["targetCompiled"].search(normalized)))
            if protected and not targeted:
                continue
            mode = rule.get("mode") or "contextual"
            if mode in {"targeted", "person_directed"} and not targeted:
                continue
            outcome = rule.get("outcome", "review")
            if not targeted and rule.get("untargetedOutcome"):
                outcome = rule["untargetedOutcome"]
            matches.append((outcome, rule))

        if OBFUSCATED_TARGET.search(original) and not matches and not protected:
            matches.append(("review", {"id": "server-obfuscation-guard", "mechanism": "suspected_evasion", "pack": "server_core"}))
        if not matches:
            return self._result("clean", "allowed", "Independent server policy found no enforceable signal", [])
        strongest = max(matches, key=lambda row: RANK.get(row[0], 2))
        outcome, rule = strongest
        ids = [item[1].get("id") for item in matches if RANK.get(item[0], 0) == RANK.get(outcome, 0)][:8]
        mechanism = rule.get("mechanism", "policy_signal")
        return self._result(outcome, mechanism, f"Independent server policy matched {mechanism.replace('_', ' ')}", ids)

    def _result(self, outcome, category, reason, rule_ids):
        return {
            "outcome": outcome,
            "category": category,
            "reason": reason,
            "matchedRuleIds": rule_ids,
            "policyVersion": self.version,
            "sourceRuleCount": self.source_rule_count,
            "executablePatternCount": self.executable_patterns,
            "skippedPatternCount": self.skipped_patterns,
            "independent": True,
        }


def strongest_outcome(*outcomes):
    return max((value for value in outcomes if value in RANK), key=lambda value: RANK[value], default="review")
