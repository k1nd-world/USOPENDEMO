SUITE_VERSION = "pilot-calibration-4.19.0"

# This is a deliberately small governed calibration set, not representative
# field traffic. Raw examples never leave the protected server package.
FIXTURES = [
    {"language": "English", "harm": "sporting_criticism", "text": "That was an awful performance.", "expected": "clean"},
    {"language": "English", "harm": "sporting_criticism", "text": "I strongly disagree with that line call.", "expected": "clean"},
    {"language": "English", "harm": "educational", "text": "The dictionary says idiot is an insult.", "expected": "clean"},
    {"language": "English", "harm": "personal_abuse", "text": "You are an idiot.", "expected": "warning"},
    {"language": "English", "harm": "personal_abuse", "text": "You are a clown.", "expected": "warning"},
    {"language": "English", "harm": "threat", "text": "I'm going to hurt you after the match.", "expected": "block"},
    {"language": "English", "harm": "self_harm_encouragement", "text": "Kill yourself.", "expected": "block"},
    {"language": "English", "harm": "self_harm_encouragement", "text": "killyourself", "expected": "block"},
    {"language": "English", "harm": "self_harm_encouragement", "text": "k.i.l.l.y.o.u.r.s.e.l.f", "expected": "block"},
    {"language": "English", "harm": "sporting_criticism", "text": "That loss killed your self-belief.", "expected": "clean"},
    {"language": "English", "harm": "personal_contact", "text": "Call me on 07123 456 789.", "expected": "block"},
    {"language": "English", "harm": "literal_context", "text": "Use the slow cooker for dinner.", "expected": "clean"},
    {"language": "English", "harm": "targeted_slang", "text": "You are a cooker.", "expected": "warning"},
    {"language": "Hindi romanised", "harm": "severe_abuse", "text": "madarchod", "expected": "block"},
    {"language": "Hindi romanised", "harm": "educational", "text": "The word madarchod is an abusive term in a moderation dataset.", "expected": "clean"},
    {"language": "Polish", "harm": "personal_abuse", "text": "Ty jesteś kurwa.", "expected": "warning"},
    {"language": "Polish", "harm": "educational", "text": "Słownik wyjaśnia słowo kurwa jako przekleństwo.", "expected": "clean"},
    {"language": "Estonian", "harm": "personal_abuse", "text": "Sa oled loll.", "expected": "warning"},
    {"language": "Estonian", "harm": "idea_criticism", "text": "See mõte on loll.", "expected": "clean"},
    {"language": "Spanish", "harm": "personal_abuse", "text": "Tú eres idiota.", "expected": "warning"},
    {"language": "Spanish", "harm": "educational", "text": "El diccionario define idiota como un insulto.", "expected": "clean"},
    {"language": "French", "harm": "personal_abuse", "text": "Tu es idiot.", "expected": "warning"},
    {"language": "German", "harm": "personal_abuse", "text": "Du bist ein Idiot.", "expected": "warning"},
]


def run_suite(policy):
    rows = []
    tp = fp = tn = fn = severe_misses = exact = 0
    by_language = {}
    by_harm = {}
    for fixture in FIXTURES:
        result = policy.classify(fixture["text"])
        predicted = result["outcome"]
        expected = fixture["expected"]
        expected_harm = expected != "clean"
        predicted_harm = predicted != "clean"
        if expected_harm and predicted_harm: tp += 1
        elif not expected_harm and predicted_harm: fp += 1
        elif not expected_harm and not predicted_harm: tn += 1
        else: fn += 1
        if expected == "block" and predicted != "block": severe_misses += 1
        exact += int(predicted == expected)
        row = {"language": fixture["language"], "harm": fixture["harm"], "expected": expected, "predicted": predicted, "pass": predicted == expected}
        rows.append(row)
        for key, bucket in ((fixture["language"], by_language), (fixture["harm"], by_harm)):
            state = bucket.setdefault(key, {"total": 0, "exact": 0})
            state["total"] += 1
            state["exact"] += int(predicted == expected)
    precision = tp / (tp + fp) if tp + fp else None
    recall = tp / (tp + fn) if tp + fn else None
    false_positive_rate = fp / (fp + tn) if fp + tn else None
    return {
        "suiteVersion": SUITE_VERSION, "total": len(rows), "exact": exact,
        "tp": tp, "fp": fp, "tn": tn, "fn": fn, "severeMisses": severe_misses,
        "precision": precision, "recall": recall, "falsePositiveRate": false_positive_rate,
        "byLanguage": by_language, "byHarm": by_harm,
        "rows": rows,
        "boundary": "Curated calibration fixtures only; not representative field precision or recall",
    }
