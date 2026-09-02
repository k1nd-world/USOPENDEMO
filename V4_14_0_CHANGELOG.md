# K1ND.world v4.14.0 changelog

V4.14.0 adds an authoritative server boundary and durable evidence to the V4.13 multimodal, contextual and appeal-capable product preview.

## Added

- Independent Python moderation engine built from the governed 259-rule JavaScript policy packs.
- Generated `server-policy-4.14.0` snapshot with 276 executable patterns.
- HMAC-signed decision receipts with content hashes, policy version, matched rules and sanitised previews.
- Verified publication commits bound to receipt, signature, exact text, user, content type and clean outcome.
- Durable SQLite tables for decisions, publication authorizations, media evidence, appeals and adjudications.
- Idempotent publication commit and server-side rejection of forged signatures or non-clean receipts.
- Active Apple Vision `VNClassifyImageRequest` alongside the existing on-device OCR.
- Visual safety-signal mapping and strongest-outcome fusion with OCR/caption evidence.
- Server health and durable evidence summary endpoints.
- Admin signed-evidence console and receipt-aware Trust Trail.
- 7 added media-fusion fixtures, bringing the multimodal suite to 20.
- 14 black-box server boundary checks.

## Changed

- All post and comment paths are asynchronous and fail closed without a server publication authorization.
- Rewrite and safe-draft choices receive their own server decision and publication commit.
- New appeals are durably stored; moderator decisions persist server-side before local adjudication completes.
- Non-clean Admin previews are withheld and represented by an evidence hash.
- Active modules use cache namespace `v=4.14.0.1` and V4.14 browser state.

## Verification

- 568/568 canonical cases.
- 246/246 adversarial cases.
- 20/20 multimodal cases.
- 834/834 combined checks.
- 14/14 black-box server boundary checks.
- 351/351 expected hard blocks and 173/173 clean/contextual examples.
- Evidence totals persisted unchanged across a server restart.
- Live Apple Vision clean and threat PNG checks returned clean and block respectively.
- Desktop and 390×844 browser verification completed with no console warnings or errors.

## Honest boundary

The server boundary is authoritative for the locally served preview, but demo role switching is not authentication. General Apple Vision classification is active but is not a dedicated identity-hate/symbol or known-harm system. Production still requires real auth, managed encrypted infrastructure, retention controls, specialist safeguarding and independently evaluated multilingual/vision models.
