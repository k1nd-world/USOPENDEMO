# K1ND.world v4.17.1 changelog

V4.17.1 is the **Self-Harm Command Normalization Hotfix**, built from an exact preserved copy of V4.17.0.

## Fixed

- Closed the live-probe false negative where a direct self-harm command with its whitespace removed was labelled clean.
- Added one dedicated `self_harm_encouragement` hard-block category across browser and independent server policy.
- Added normalization for joined, whitespace-separated, punctuation/emoji-separated, repeated-letter, narrow-leetspeak and joined euphemistic forms.
- Resolved the target as the addressed participant even when the second-person words are collapsed.
- Added an explicit “directly encouraging suicide or self-harm” speech act and single-mechanism explanation.
- Kept direct self-harm encouragement out of the attacker-threat credibility and partner-security routing path.
- Preserved clean treatment for sporting discussion of self-belief.

## Added regression evidence

- Seven canonical cases covering direct, joined, punctuation, leetspeak, euphemistic, short command and sporting-counterexample forms.
- Six presenter-safe adversarial rows covering joined, spaced, punctuation, leetspeak, euphemistic and self-belief cases.
- Three protected server calibration fixtures.
- One black-box server contract proving the hard block and absence of attacker-threat/partner routing.

## Verified

- Canonical moderation and rewrite suite: **575/575**.
- Adversarial suite: **252/252**.
- Multimodal evidence suite: **20/20**.
- Combined browser readiness: **847/847**.
- No-bypass hard blocks: **362/362**.
- Neutral/contextual counterexamples: **175/175**.
- Protected curated server calibration: **23/23**.
- Authenticated server contracts: **50/50**.
- Exact reported phrase and five related cases verified through the live browser probe with no console errors.
- Preserved V4.17 archive SHA-256: `598c2358f5ecc1222f0fdde0e62197a48c46af9d5d6470317d38a1a379cdd71f`.

## Boundary

This hotfix proves the specified local normalization and policy fixtures. It does not prove universal self-harm detection, clinical risk assessment or real-world field precision/recall. A production service still requires maintained multilingual contextual models, specialist self-harm policy and escalation design, representative evaluation, trained safeguarding staff, crisis-resource localization, monitoring, appeals and independent review.

