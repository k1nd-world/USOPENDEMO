from policy_engine import RANK


class ContextualAdapter:
    """Explainable server-side context layer. It may only escalate, never weaken policy."""

    version = "k1nd-context-adapter-4.19.0"

    def assess(self, base_outcome, context, prior_interventions):
        context = context if isinstance(context, dict) else {}
        target_is_u18 = bool(context.get("targetIsU18"))
        target_is_athlete = bool(context.get("targetIsAthlete"))
        cumulative = max(int(context.get("cumulativeSignals") or 0), len(prior_interventions))
        turns = int(context.get("turnsConsidered") or 0)
        signals = []
        proposed = base_outcome

        if target_is_u18:
            signals.append("target is a verified under-18 participant")
        if target_is_athlete:
            signals.append("target is a professional athlete")
        if cumulative:
            signals.append(f"{cumulative} prior targeted intervention{'s' if cumulative != 1 else ''}")
        if turns >= 6:
            signals.append("multi-turn conversation context considered")

        if base_outcome == "warning" and (target_is_u18 or cumulative >= 2):
            proposed = "review"
            signals.append("warning escalated for vulnerable or repeated targeting")
        elif base_outcome == "review" and target_is_u18 and cumulative >= 2:
            proposed = "block"
            signals.append("review escalated for repeated targeting of an under-18 participant")

        return {
            "version": self.version,
            "status": "active",
            "mode": "structured server-side escalation",
            "externalFoundationModel": "not_configured",
            "baseOutcome": base_outcome,
            "outcome": proposed if RANK[proposed] >= RANK[base_outcome] else base_outcome,
            "signals": signals,
            "priorTargetedInterventions": len(prior_interventions),
            "reason": signals[-1] if signals else "No contextual escalation signal; base policy retained",
        }
