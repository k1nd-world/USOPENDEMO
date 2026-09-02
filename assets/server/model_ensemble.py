import os


class ModelEnsemble:
    version = "k1nd-ensemble-4.19.0"

    def status(self):
        external = bool(os.environ.get("K1ND_MULTILINGUAL_MODEL_URL"))
        translation = bool(os.environ.get("K1ND_TRANSLATION_PROVIDER_URL"))
        return {
            "version": self.version,
            "decisionRule": "strongest configured safety outcome; no provider may silently weaken hard policy",
            "providers": [
                {"id": "deterministic_policy", "label": "Deterministic multilingual policy", "status": "active", "authority": "enforcement"},
                {"id": "structured_context", "label": "Structured context adapter", "status": "active", "authority": "escalation_only"},
                {"id": "campaign_intelligence", "label": "Cross-thread campaign intelligence", "status": "active", "authority": "escalation_and_operations"},
                {"id": "multilingual_context_model", "label": "Maintained multilingual context model", "status": "configured" if external else "adapter_ready_not_configured", "authority": "advisory_until_evaluated"},
                {"id": "translation_crosscheck", "label": "Translation semantic cross-check", "status": "configured" if translation else "adapter_ready_not_configured", "authority": "secondary_only"},
                {"id": "native_specialist_review", "label": "Native-language specialist review", "status": "workflow_ready_staffing_required", "authority": "human_adjudication"},
            ],
            "calibration": {"fieldConfidence": None, "status": "not calibrated on representative pilot traffic"},
        }

    def explain(self, client_outcome, server_decision, context_decision, media_outcome, final_outcome):
        votes = [
            {"provider": "browser_advisory", "outcome": client_outcome, "authority": "advisory"},
            {"provider": "deterministic_policy", "outcome": server_decision.get("outcome"), "authority": "enforcement"},
            {"provider": "structured_context", "outcome": context_decision.get("outcome"), "authority": "escalation_only"},
            {"provider": "media_evidence", "outcome": media_outcome, "authority": "enforcement_when_attached"},
        ]
        outcomes = {item["outcome"] for item in votes if item.get("outcome")}
        return {
            "version": self.version,
            "votes": votes,
            "finalOutcome": final_outcome,
            "disagreement": len(outcomes) > 1,
            "disagreementReason": "Configured safety signals differ; strongest outcome retained" if len(outcomes) > 1 else "Configured signals agree",
            "calibratedProbability": None,
            "probabilityBoundary": "No probability is claimed before representative pilot calibration",
        }
