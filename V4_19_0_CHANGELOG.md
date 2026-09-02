# K1ND.world v4.19.0 changelog

V4.19.0 is the **Semantic Context & Intent Engine**, created from an exact copy of V4.18.1. The V4.18.1 source and archive remain unchanged.

## Added

- Clause segmentation for mixed-intent posts.
- Per-clause target, speech act, stance, profanity function, harm mechanism and confidence evidence.
- Counterfactual checks that remove profanity and person targets to expose what drives the harmful reading.
- A deterministic severe-harm floor that semantic reasoning cannot downgrade.
- High-confidence intervention for contempt disguised as praise.
- A server-owned semantic reasoner that does not echo the submitted wording.
- A ten-stage Safety Intelligence path with clause and counterfactual proof cards.
- Twenty-five semantic-context regression cases, increasing the canonical suite from 575 to 600.
- Four authenticated server contracts for implicit taunts, mixed intent, response privacy and severe-floor protection.

## Demonstrated outcomes

- `Fuck what a great shot` → clean emphatic praise; no rewrite.
- `That serve was fucking awful` → clean sporting criticism.
- `He told me to fuck off` → clean reported speech.
- `That shot was brilliant; you are an idiot.` → warning; praise retained in a source-faithful rewrite.
- `Nice job, genius.` → warning for implicit personal degradation; no generic rewrite invented.
- `I will fucking hurt you` → block; severe-harm floor locked.

## Verification

- Canonical moderation, semantics and rewrite suite: **600/600**.
- Adversarial hate suite: **262/262**.
- Multimodal evidence suite: **20/20**.
- Combined browser readiness: **882/882**.
- Generated severe-evasion gate: **180/180**, 0 severe misses, 0 control regressions.
- Authenticated server contracts: **68/68**.
- Curated calibration: **23/23**.

These are deterministic release checks, not proof of universal field accuracy or superiority to trained human moderation.
