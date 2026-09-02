# K1ND.world v4.18.1 changelog

V4.18.1 is the **Contextual Profanity Intelligence Hotfix**, created from an exact copy of V4.18.0. The V4.18.0 source and archive remain unchanged.

## Fixed

- `Fuck what a great shot` is now clean emphatic praise and publishes without a rewrite prompt.
- English profanity is no longer treated as abuse merely because a swear word appears.
- Positive intensifiers, untargeted exclamations, emphatic sporting reactions and non-personal sporting frustration are allowed when no harmful mechanism is present.
- Reported, quoted and educational profanity remains clean.
- Directed dismissal, person-directed profanity and profane personal labels still receive an intervention.
- Profanity inserted between threat intent and the violent verb—such as `I will fucking hurt you`—cannot weaken threat detection and remains a hard block.

## Explanation upgrades

- Browser analysis now exposes a structured profanity function with `targeted` and `abusive` flags.
- The Hate Stress Test shows whether profanity is a positive intensifier, sporting reaction, reported wording, directed hostility or harm intensifier.
- The server Safety Intelligence response now explains profanity function, target, speech act and mechanism separately.
- The authenticated inspector displays a dedicated **Profanity function** card and explicitly states whether it is an abuse signal.

## Regression evidence

- Canonical moderation and rewrite suite: **575/575**.
- Adversarial stress suite: **262/262**, including ten new profanity-context pairs.
- Multimodal evidence suite: **20/20**.
- Combined browser readiness: **857/857**.
- Generated protected severe-evasion gate: **180/180**, zero severe misses and zero neutral-control regressions.
- Authenticated server contracts: **64/64**.
- Protected curated calibration: **23/23**.

These deterministic checks prove the documented build behaviours only. They do not establish universal field accuracy or replace representative multilingual evaluation and trained human safeguarding judgement.
