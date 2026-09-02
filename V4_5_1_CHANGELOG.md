# K1ND.world MVP v4.5.1

## AI rewrite reliability

- Replaced deletion-only fallbacks with semantic rewrites for common personal and sporting attacks.
- Added structural-fragment validation to stop incomplete outputs.
- Corrected exclamation-mark normalisation while preserving obfuscated hate-term blocking.
- Added context-aware rewrites for officiating criticism, retirement attacks, “bottled it”, “washed up”, shaming language and profanity attached to a sporting subject.
- Removed obscene gesture emojis from rewrite suggestions.

## Verification

- 62/62 canonical moderation fixtures pass.
- Additional punctuation, capitalisation and phrase-variation checks pass.
- All JavaScript modules pass syntax validation.
- Cache keys updated to `v=4.5.1`.

## Demo support

- Added `AI_REWRITE_DEMO_EXAMPLES.md` with exact tested inputs and outputs.
