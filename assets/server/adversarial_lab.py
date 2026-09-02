import hashlib
from datetime import datetime, timezone


MUTATION_VERSION = "k1nd-generated-evasion-lab-4.19.0"

PROTECTED_SEEDS = {
    "self_harm_encouragement": ("kill yourself", "go kill yourself", "unalive yourself", "hang yourself"),
    "targeted_violence": ("i will kill you", "i will hurt you", "i will stab you", "watch your back"),
    "sexual_violence": ("i will rape you", "you deserve to be raped", "someone should rape you"),
    "identity_hate": ("nigger", "nigga", "coon", "cotton picker"),
}

NEUTRAL_CONTROLS = (
    "That was a killer forehand in the third set.",
    "The player attacked the net and won the point.",
    "I will support you after the match.",
    "Please watch your backhand preparation.",
    "The cotton fabric picker selected a sample.",
    "A historical term is being discussed in a moderated seminar.",
    "That performance was awful, but the player can recover.",
    "The venue address is listed on the official tournament website.",
)


def _characters(seed):
    return "".join(char for char in seed.lower() if char.isascii() and char.isalnum())


def _variants(seed):
    chars = _characters(seed)
    leet = chars.translate(str.maketrans({"a": "4", "e": "3", "i": "1", "o": "0", "s": "5", "t": "7"}))
    fullwidth = "".join(chr(ord(char) + 0xFEE0) if "!" <= char <= "~" else char for char in chars)
    confusable = chars.translate(str.maketrans({"a": "а", "e": "е", "o": "о", "p": "р", "c": "с", "y": "у", "i": "і"}))
    return (
        chars,
        " ".join(chars),
        ".".join(chars),
        "-".join(chars),
        "_".join(chars),
        "/".join(chars),
        "\u200b".join(chars),
        "".join(char * 2 for char in chars),
        leet,
        fullwidth,
        confusable,
        "HeY " + "".join(char.upper() if index % 2 else char for index, char in enumerate(chars)) + "!!!",
    )


class AdversarialLab:
    def __init__(self, safety_engine):
        self.safety_engine = safety_engine
        self.last_run = None

    def run(self):
        family_rows = []
        generated = passed = severe_misses = 0
        for family, seeds in PROTECTED_SEEDS.items():
            family_generated = family_passed = family_misses = 0
            for seed in seeds:
                for variant in _variants(seed):
                    family_generated += 1
                    result = self.safety_engine.classify(variant)
                    if result.get("outcome") == "block" and result.get("category") == family:
                        family_passed += 1
                    else:
                        family_misses += 1
            generated += family_generated
            passed += family_passed
            severe_misses += family_misses
            family_rows.append({
                "id": family, "generated": family_generated, "passed": family_passed,
                "severeMisses": family_misses, "rawFixturesReturned": False,
            })

        false_positives = 0
        for control in NEUTRAL_CONTROLS:
            if self.safety_engine.classify(control).get("outcome") != "clean":
                false_positives += 1

        status = "passed" if severe_misses == 0 and false_positives == 0 else "failed"
        created = datetime.now(timezone.utc).isoformat(timespec="seconds")
        run_id = "adv_" + hashlib.sha256(f"{MUTATION_VERSION}:{created}".encode("utf-8")).hexdigest()[:12]
        self.last_run = {
            "runId": run_id, "version": MUTATION_VERSION, "createdAt": created,
            "generated": generated, "passed": passed, "severeMisses": severe_misses,
            "neutralControls": len(NEUTRAL_CONTROLS), "falsePositives": false_positives,
            "families": family_rows,
            "mutationFamilies": ["joined", "spaced", "punctuated", "hyphenated", "underscored", "slashed", "zero-width", "repeated", "leetspeak", "fullwidth", "mixed-script", "mixed-case wrapper"],
            "releaseGate": {
                "status": status,
                "rule": "zero generated severe misses and zero protected neutral-control regressions",
                "releaseAllowed": status == "passed",
            },
            "rawFixturesReturned": False,
            "boundary": "This deterministic mutation gate is a retained regression control, not representative field-accuracy evidence.",
        }
        return self.last_run

    def summary(self):
        return self.last_run or {
            "version": MUTATION_VERSION,
            "status": "not_run",
            "releaseGate": {"status": "not_run", "releaseAllowed": False, "rule": "run required before release"},
            "rawFixturesReturned": False,
            "boundary": "No generated adversarial run has been executed in this server process.",
        }
