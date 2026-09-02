# K1ND.world v4.15.0 changelog

V4.15.0 is the **Authenticated Safety Platform Preview**, built from an exact preserved copy of V4.14.0.

## Added

- Salted PBKDF2 demo credential verification and login throttling.
- Expiring server sessions in HttpOnly, SameSite cookies with revocation.
- Session-bound CSRF protection for every state-changing API.
- Server user/role authorization for moderation, publication, media, appeals, adjudication and case operations.
- Server platform seed containing the preserved 14 profiles, 10 posts and 8 comments.
- Server-owned posts and comments created only after signed clean-receipt verification.
- Public platform bootstrap API and browser feed hydration.
- Escalation-only contextual server adapter using target age/role, conversation turns and prior targeting evidence.
- Prioritised moderation cases and an authenticated Admin case workspace.
- Evaluation-readiness endpoint distinguishing 834 verified checks from unmeasured field metrics.
- Visual safety provider ensemble with explicit known-harm, specialist-symbol and forensic readiness states.
- Protected static paths for server source, data and tools.
- Authenticated sign-in experience and session identity in the product header.
- 23 black-box authenticated server contracts.

## Changed

- Browser role switching no longer controls product permissions.
- Publication returns the authoritative server post/comment record.
- Request-body `userId` and `moderatorId` values are advisory only and cannot grant authority.
- Admin evidence access requires a signed moderator session.
- The policy snapshot is versioned `server-policy-4.15.0`.
- Active browser modules use `v=4.15.0.1`.

## Verified

- 834/834 combined moderation checks.
- 23/23 authenticated server contracts.
- Moderator sign-in, server cases, readiness reporting and mobile feed verified in browser.
- No browser warnings or errors.
- V4.14 archive SHA-256 unchanged: `5b6b470b32960e39cfad9b5b2472e5c5f04ef61a750de5fe628e30b53585c350`.

## Honest boundary

This is real local authentication and authorization, not a production identity deployment. Managed infrastructure, representative field evaluation, specialist provider configuration and accountable safeguarding operations remain required before a pilot.
