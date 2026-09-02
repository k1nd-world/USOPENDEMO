# K1ND.world v4.8.0 — Contextual Abuse Intelligence Build

## Moderation reasoning

- Every moderation decision now includes a structured explanation of the target, target type, language function, abuse mechanism, contextual reading, evidence signals, policy rationale, confidence and resulting action.
- The engine explicitly distinguishes attacks on a person from criticism of a sporting action, performance, idea or creative work.
- Demo Lab now displays the full abuse-intelligence explanation alongside the outcome and rewrite.
- Replaced generic “I want to express…” fallbacks with an intent-preserving rewrite refinement layer.
- Rewrites now report **Point kept** and **Removed**, making it clear what changed.
- Abuse-only drafts receive **No rewrite invented** instead of a fabricated opinion; the user must state the real sporting or discussion point.
- Corrected contrast handling so `You are an idiot but your point is fair.` becomes `Your point is fair.` rather than incorrectly introducing disagreement.
- Untargeted Polish profanity can now be removed while retaining the author's original Polish statement.

## Pragmatic context intelligence

- Added a versioned context engine that resolves whether the target is a person, identity group, reply participant, sporting object, tactic, argument or unclear expression.
- Added speech-act classification for direct attack, sporting/idea criticism, allegation, command, counterspeech, reported abuse, quotation, education and self-directed criticism.
- Added stance and framing signals for condemnation, attribution, quotation marks, educational language, self-reference and hypothetical wording.
- Added residual-attack detection: `Don’t call her an idiot, you moron.` still intervenes because the second insult sits outside the counterspeech frame.
- Added safe contrasts for reported abuse, counterspeech and idea criticism while keeping direct personal attacks moderated.
- Added optional `parentText`, `isReply` and `conversationHistory` inputs to the moderation API for reply-target inference, parent-message overlap and recent hostile-turn signals.
- Added an explainable 0–100 policy-risk score, risk band, target scope and abuse-stacking summary to Demo Lab and the live stress probe.
- Hard blocks and enhanced-review categories cannot be downgraded through the context layer in this browser demo.

## US Open Presenter Shield

- Added a fail-safe uncertainty guard for suspicious targeted wording the deterministic browser policy cannot interpret confidently.
- Expanded reviewed-term mutations from eight to sixteen transformations: uppercase, spacing, punctuation, hyphens, repeated characters, leetspeak, zero-width, fullwidth, underscores, slashes, line breaks, combining marks, circled letters, mathematical letters, emoji separators and repeated punctuation.
- Added phrase-level evasion handling for joined, hyphenated, leetspeak, zero-width, underscore, slash, line-break and emoji-separated forms.
- Added detection for invisible controls, bidirectional controls, compatibility characters, mixed-script targets, letter-by-letter spelling and high separator density.
- Known obfuscated abuse receives intervention. Unknown targeted obfuscation is held for enhanced review without falsely asserting that the unknown token is abusive.
- Added educational counterexamples for spelling exercises, variables, Unicode discussion and script comparison.

## Emerging language

- Added a separate, versioned emerging-language policy pack so fast-changing terminology can be reviewed without scattering terms through the core engine.
- Added context-sensitive rules for NPC, bot, mid, cooked, washed, delulu, glazer/glazing, yapper/yapping, skill issue, touch grass, cry more and delete your account.
- Added a hard block for the euphemistic self-harm instruction “unalive yourself.”
- Each rule includes its abuse mechanism, rationale and an allowed counterexample to limit false positives.
- Added an Admin policy surface showing the review methodology and complete active pack.

## Australian and Czech/Baltic-region language

- Added a versioned Australian English pack for contextual uses of `drongo`, `galah`, `dill`, `dropkick`, `ratbag`, `flog`, `grub`, `deadshit`, `sook`, `whinger`, `bogan`, `cooker`, `fuckwit`, `dickhead` and `pull your head in`.
- Protected literal, sporting, reclaimed and self-descriptive contexts such as a galah bird, a drop kick, a garden grub, a slow cooker and proud bogan self-identification.
- Added Czech, Lithuanian, Latvian and Estonian policy modules for high-confidence personal degradation, dismissive commands, sexualised targeting, death wishes and identity slurs.
- Kept Czech correctly classified as West Slavic, Lithuanian and Latvian as Baltic languages, and Estonian as a Finnic language covered within the Baltic regional pack.
- Added per-language target markers to prevent words in one language from turning a harmless sentence in another language into a false positive.
- Added educational/research exemptions and paired safe counterexamples for every regional policy family.
- Regional bare insults receive **No rewrite invented**. Recoverable intent is rewritten precisely: Czech, Lithuanian, Latvian and Estonian dismissive commands retain the request for space in the original language.

## Quality

- Expanded canonical moderation coverage from 122 to **274 cases**.
- Expanded the separate Hate Stress Test to **246 cases**, producing **520/520 passing automated checks** across the canonical and adversarial suites.
- Added a private presenter route at `/hate-stress-test` with four readiness verdicts, a live explainability probe, redacted fixtures and coverage filters.
- Added generated uppercase, spacing, punctuation, hyphenation, repeated-character, leetspeak, zero-width and fullwidth Unicode evasion tests for high-confidence hate terms.
- Added paired abusive/safe-context fixtures for emerging language.
- Added a South Asian/code-mixed policy pack covering Romanised, Devanagari, Gujarati and Urdu forms, including contextual handling of `benchod` / `bhenchod` / `behenchod`.
- Added script-coverage diagnostics and an honest all-language production architecture covering native policy packs, multilingual models, translation cross-checks, ensemble disagreement and specialist appeal.
- Added contextual Hindi/code-mixed handling for `saala` / `saali`, `haraam saala`, and the uncertain spelling `hinchod`; uncertain targeted forms are held for review instead of receiving an unsupported automatic hard block.
- Added the first Polish pack: `kurwa mać` and phonetic variants receive strong-profanity intervention, while `kurwa` / `kurwo` directed at a person is treated as sexualised abuse.
- Hardened the existing anti-Black racial-abuse rules with the phonetic `koon` evasion, joined/hyphenated historical-abuse phrases, and a high-confidence global pack covering selected Cyrillic, Devanagari, Gujarati, Polish, Dutch, German, French, Spanish and Mandarin slur forms.
- Extended the global pack with additional reviewed French, Spanish, Italian, Portuguese, Hindi/Urdu/Gujarati, German and Arabic forms, using targeting gates where literal or proper-name counterexamples make a blanket block unsafe.
- Added a negative test proving that the ordinary Spanish colour word `negro` is not blanket-blocked.
- All JavaScript modules pass syntax validation.

## Product boundary

This deterministic browser build demonstrates explainable, context-aware policy reasoning. A production system still requires maintained multilingual models and lexicons, trained specialist review, appeal and audit workflows, adversarial monitoring, protected evidence systems and measured real-world evaluation. Human oversight remains necessary for ambiguous and high-impact decisions.
