import json
from pathlib import Path

from policy_engine import strongest_outcome


class VisualSafetyEnsemble:
    def __init__(self, root):
        path = Path(root) / "assets" / "server" / "known_harm_hashes.json"
        payload = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {"sha256": []}
        self.known_harm_hashes = set(payload.get("sha256", []))

    def assess(self, sha256, classifications, general_available):
        block_terms = {"blood", "gore", "corpse", "wound", "graphic violence", "dead body"}
        review_terms = {"weapon", "gun", "firearm", "rifle", "pistol", "knife", "sword", "explosive", "bomb", "swastika", "military weapon"}
        signals = []
        if sha256 in self.known_harm_hashes:
            signals.append({"label": "known-harm hash match", "confidence": 1, "outcome": "block", "reason": "governed known-harm hash match"})
        for item in classifications:
            label = str(item.get("label", "")).lower()
            confidence = float(item.get("confidence", 0))
            if confidence >= 0.45 and any(term in label for term in block_terms):
                signals.append({"label": item.get("label"), "confidence": confidence, "outcome": "block", "reason": "possible graphic-violence concept"})
            elif confidence >= 0.30 and any(term in label for term in review_terms):
                signals.append({"label": item.get("label"), "confidence": confidence, "outcome": "review", "reason": "possible weapon or extremist-symbol concept"})
        outcome = strongest_outcome(*(item["outcome"] for item in signals)) if signals else ("clean" if general_available else "review")
        return {
            "outcome": outcome,
            "signals": signals,
            "providers": [
                {"provider": "Apple Vision general classifier", "status": "active" if general_available else "unavailable", "purpose": "broad visual concepts"},
                {"provider": "Known-harm hash intelligence", "status": "active_empty_corpus" if not self.known_harm_hashes else "active", "purpose": "exact governed hash matches"},
                {"provider": "Identity-hate and extremist-symbol specialist", "status": "adapter_ready_not_configured", "purpose": "specialist symbol and identity-hate evidence"},
                {"provider": "Forensic manipulation detector", "status": "not_configured", "purpose": "synthetic and manipulated media evidence"},
            ],
        }
