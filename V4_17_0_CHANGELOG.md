# K1ND.world v4.17.0 changelog

V4.17.0 is the **Live Event Safety Command Preview**, built from an exact preserved copy of V4.16.0.

## Added

- An authenticated `/event-command` workspace for tournament-wide safety operations.
- Audited live-event controls for risk mode, default safeguarding SLA, acknowledgement timeout, simulation mode and operational notes.
- Protected-person levels for athlete and under-18 demonstration participants.
- Structured threat-credibility assessment across violence, target, time, location/access, capability/method and repeat-targeting signals.
- A single event timeline joining real K1ND decisions, safeguarding records, campaign signals and clearly labelled simulated drills.
- WTA/ATP and tournament-security acknowledgement and no-ack fallback drills with enforced no-send status.
- A partner-delivery ledger that distinguishes prepared, authorised, acknowledged and simulated states.
- Metadata-minimised evidence previews and two-person approval for restricted access, including self-approval prevention and short access windows.
- Six configuration-readiness invariants with an explicit distinction between configuration proof and unmeasured field quality.
- New Event Command APIs, persistence tables and browser client controls.

## Hardened

- Threat operations are driven by intent, target, access and imminence signals rather than a banned-word match alone.
- Raw prohibited content is excluded from the normal event timeline and command summaries.
- Route drills always record `externalMessageSent: false`.
- Human-authorised packets remain `approved_not_sent` when no secure partner connector exists.
- State-changing Event Command actions require an authenticated moderator session and CSRF evidence.
- Event and evidence-control changes create audit records with the authenticated actor.

## Verified

- Browser regression: **834/834**.
- Protected curated server calibration: **20/20** in the controlled suite.
- Authenticated server, safeguarding, pilot-operations and Event Command contracts: **49/49**.
- Event Command verified at desktop and **390×844** without horizontal overflow.
- Browser console verified with no warnings or errors.
- V4.16 archive reverified unchanged at SHA-256 `e7671e8d3929c8d30cddac46e6a094ee4dc149c501f17f1f2429cded6602c409`.

## Explicit boundary

V4.17 runs real authenticated K1ND moderation, persistence and audit logic locally. The event is a demonstration environment; seeded history and delivery exercises are labelled simulated. No external WTA, ATP, tournament-security, emergency-services or law-enforcement connector is configured, and no message can leave the build. The credibility score is a routing heuristic, not a probability, identity determination or substitute for trained human safeguarding judgement. Field precision, recall, partner acknowledgement performance and response-time outcomes remain unmeasured until a governed pilot exists.

