# K1ND.world MVP v4.5.0

## AI-assisted rewrite accuracy

- Added phrase-level handling before word-level profanity removal.
- Fixed the reported failure where “fuck off” could collapse to “off”.
- “fuck off” now rewrites to “Please leave me alone.”
- Embedded dismissive profanity, aggressive silencing phrases and profanity within sporting criticism now produce complete, intent-preserving alternatives.
- Added a broken-fragment safety net for deletion-only outputs.
- Added four regression fixtures; the full suite now passes 41/41 tests.

## Deployment reliability

- Updated every JavaScript and HTML cache key from older 4.4.x values to `v=4.5.0` so Netlify and browsers load the patched engine rather than a cached copy.

## K1ND language

Added or strengthened these phrases across the homepage, About, Verify and Create screens:

- Accountability by design.
- Private verification. Public confidence.
- Prevention before publication.
- Strong opinions without personal abuse.
- Think before you post.
- Real identity behind every participating voice.

## MVP boundary

This remains a front-end demonstration using deterministic, intent-aware rewrite rules. A production version should replace or supplement this seam with a secure moderation and language-model service, policy versioning, multilingual coverage, human review and audit controls.
