# K1ND.world — MVP v10/2026

Launch START_OFFLINE_DEMO.command to run this separate copy at http://127.0.0.1:8137/.

The product label is MVP v10/2026. It retains the black, white and fluorescent yellow theme and the original v4.24.1 application functionality, four courts, policies and demo content. Internal policy versions, API identifiers and deterministic seed values are preserved. No deployment was performed.

The original source instructions follow as historical application documentation.

---

# K1ND.world Functional Social MVP v4.24.1

Version: **4.24.1 — Hosted Tournament Operations Deployment**

V4.24.1 was created from an exact copy of V4.24.0. The preserved V4.24.0 source and archive were not modified. This release retains the four-court Tournament Operations experience and adds a full-function Render deployment path without weakening the authoritative moderation engine.

## Hosted deployment upgrade

- `render.yaml` provisions one same-origin Python web service and a 1 GB persistent data disk.
- Hosted sessions receive `Secure`, `HttpOnly`, `SameSite=Strict` cookies and HTTPS transport protection.
- Render proxy addresses are handled explicitly for sign-in rate limiting.
- `K1ND_DEMO_PIN` supplies a private four-digit hosted-demo PIN; credentials are no longer displayed in the public sign-in page.
- SQLite data and the receipt-signing secret can be placed under `K1ND_DATA_DIR` and preserved across redeploys.
- Audience QR generation now has a cross-platform Python path for the Linux host while retaining the macOS local path.
- Static-only hosting failures now explain that the K1ND application service is required instead of showing a generic 404.
- See `DEPLOY_TO_RENDER.md` for the exact setup sequence.

## Offline flight launch on a Mac

1. Keep the complete `USOPENDEMO` folder on the Mac before travelling.
2. Double-click `START_OFFLINE_DEMO.command` while still online once, so macOS can approve it.
3. If macOS blocks it, Control-click the file, choose **Open**, then choose **Open** again.
4. Keep the Terminal window open while presenting. The browser opens at `http://127.0.0.1:8035/sign-in` and does not require internet.
5. Use the local account PINs. Jordan Blake's moderator PIN is `8642`.
6. Close the Terminal window when the demonstration is finished.

## The major upgrade

- **Four isolated live courts:** Centre Court, Armstrong Court, Grandstand and Court 17 each have a separate room code, temporary-pass population, athlete payload, presenter controls, message ledger and QR handoff.
- **One-button event launch:** **Launch US Open demo** resets and runs all four court rehearsals through the active server engine, producing 24 decisions, 12 safe athlete deliveries and 12 interceptions.
- **Tournament command map:** one view displays court status, protected athlete, match phase, crowd pressure, latency, delivery totals and live incident count.
- **Human-owned incident desk:** critical threats and campaign harassment become redacted incident records. A moderator can acknowledge, investigate, prepare a packet, authorise locally or resolve with a required audit note.
- **No fictional delivery:** authorisation ends at **authorised — not sent** because WTA/ATP, venue-security and emergency connectors remain unconfigured.
- **Athlete continuity:** protection follows each athlete through pre-match, live play, recovery and off-duty state with a named safety lead.
- **Same-traffic comparison:** K1ND on/off exposure is calculated from the identical local rehearsal set and labelled as a counterfactual demo—not a production effectiveness or wellbeing claim.
- **Post-match protection reports:** each court can generate a privacy-safe report covering delivery, interception, categories, incidents and assurance boundaries without hostile originals.
- **Event preflight and recovery:** required checks are separated from optional unconfigured connectors, and one recovery action restores all four courts to a deterministic baseline.

## Retained V4.23 Live Audience Arena

- **The room remains the demo:** fans join `/arena` with a temporary event pass and room code, while `/arena-athlete` and `/arena-control` show protected role-specific views.
- **Live multi-device handoff:** server-sent events and a timed synchronization safety net keep audience, athlete and presenter screens on the same server revision.
- **Local QR join:** the presenter receives a scannable local QR and explicit room code without sending the join address to an external service.
- **Context, not a swear-word ban:** `Fuck what a great shot` and strong sporting criticism are delivered as written; person-directed abuse is withheld.
- **Meaning-preserving recovery:** mixed comments keep their genuine sporting point. The safer version is rechecked by the server before athlete delivery.
- **Athlete privacy by construction:** non-clean originals are not stored in the Arena transcript. Athlete and presenter payloads contain safe text or redacted evidence metadata only.
- **Pressure-aware protection:** duplicate suppression, per-pass rate limits, slow mode and an explainable crowd-pressure routing signal protect the live room.
- **Human-owned boundaries:** room status, shield, digest and reply access are moderator-controlled and audited without autonomous sanctions.
- **Offline rehearsal:** six deterministic messages run through the active local safety engine with no external service dependency.
- **True public handoff:** **View as user** lands directly in Arena Live. Internal routes return to Arena Live until Shift+Escape restores presenter tools.
- **Severe-harm floor:** credible threats are blocked before athlete delivery. No governing-body or security message is sent automatically.

## Retained V4.22 Live Match Room

- The original two-sided Match Live experience and Personal Athlete Shield remain available.
- Accurate source-backed rewrites, contextual profanity handling and the quiet athlete digest are retained.
- The V4.22.0 source and archive remain unchanged.

## Retained V4.21 public experience

- Session-scoped public mode with Home, Feed, Match Live, Create, Profile, Appeals and About.
- Demo, admin, trust, internal scores and fictional labels remain behind the presentation curtain.
- Interactive follows, likes, reposts, comments, reporting and moderated publishing remain available.
- Shift+Escape provides the discreet presenter return.

## Retained V4.21/V4.20 safety and event capability

- Live Athlete Shield and deterministic 24-message tournament burst.
- Before/after protected athlete inbox, incident replay and multilingual campaign graph.
- Moderator Copilot recommendations and human-authorised local threat packet.
- Audited event controls and explicit external-connector boundaries.

## Retained semantic capability

- **Clause-level reasoning:** mixed praise, sporting criticism, reporting, dismissal, personal degradation and threats are separated instead of flattening the entire post into one label.
- **Target and speech-act resolution:** every clause records whether it addresses a person, sporting action, idea or no clear target, and whether it performs praise, criticism, reporting, counterspeech, dismissal, degradation or threat.
- **Profanity-function reasoning:** a swear word can be praise, sporting emphasis, reported language, untargeted expression, directed hostility or harm intensification. Presence alone is not treated as abuse.
- **Counterfactual proof:** the engine removes profanity and then the person target to show which element actually changes the harmful reading.
- **Implicit taunts:** high-confidence contempt disguised as praise receives an intervention even without an ordinary insult construction.
- **Mixed-intent rewrites:** a clean sporting clause is retained while only the abusive clause is removed. If no genuine proposition exists, no generic rewrite is invented.
- **Non-downgradable severe floor:** threats, self-harm encouragement, sexual violence, identity hate, doxxing and other severe families cannot be weakened by the semantic layer or a counterfactual.
- **Ten-stage server path:** normalization, language, clauses, target, speech act, mechanism, counterfactuals, cross-thread context, specialist route and action.
- **One authoritative path:** the independent server owns the final enforcement decision; the browser can intervene early but cannot weaken it.
- **Governed learning only:** new terms still require native review, regression, shadow observation and explicit human promotion. No submitted term edits live enforcement automatically.

## Retained product capability

- Authenticated local demo accounts, salted PIN hashes, opaque HttpOnly sessions and CSRF protection.
- Server-derived identity, receipt-bound publication and signed moderation evidence.
- Source-backed rewrite generation with clean re-checks and meaning-fidelity checks.
- Appeals, adjudication, prioritised cases and cross-thread campaign signals.
- Safeguarding incidents, protected-person controls and Live Event Safety Command.
- Explicitly non-live WTA/ATP, venue-security and emergency fallback routes.
- Metadata-only evidence previews and two-person restricted-evidence approval.
- Apple Vision OCR/general classification on supported macOS hosts, with unconfigured specialist providers labelled honestly.
- Forty-nine deterministic functional language groups and maintained regional policy packs, without claiming equivalent native-speaker quality.

## Verified build evidence

- **11/11** hosted deployment checks covering health, HTTPS headers, source privacy, private PIN override, secure cookies, hosted sessions, Tournament Operations preflight and Linux-compatible QR generation.
- **600/600** canonical moderation, semantic-intent and rewrite checks.
- **262/262** adversarial stress checks.
- **20/20** multimodal evidence checks.
- **882/882** combined browser readiness.
- **367/367** expected hard blocks remain non-bypassable.
- **200/200** neutral and contextual examples remain clean.
- **180/180** generated protected severe-evasion variants, with **0 severe misses** and **0 neutral-control regressions**.
- **122/122** authenticated black-box server contracts, including multi-court isolation, tournament launch, preflight, incident workflow, athlete continuity, reporting and recovery.
- **23/23** protected curated server calibration fixtures.
- `Fuck what a great shot` remains clean emphatic praise with no rewrite.
- `That shot was brilliant; you are an idiot.` intervenes on one harmful clause, retains the praise and offers `That shot was brilliant.`
- `Nice job, genius.` is identified as a high-confidence implicit personal taunt and receives no invented rewrite.
- `I will fucking hurt you` remains a hard threat block with the severe floor locked.
- The preserved V4.23.0 archive remains unchanged at SHA-256 `8bc13607d90728624be80ec6d92dcb14f212c3b941f26eb9251aac23cf6197ed`.

## Run locally

1. Run `python3 serve.py` from this folder.
2. Open `http://localhost:8000/`.
3. Sign in as Jordan Blake with the labelled local demo PIN `8642`.
4. Open `/tournament-operations` and run **Event preflight**. Required readiness must read **5/5**; partner connectors must read **Not configured**.
5. Press **Launch US Open demo**. Confirm **4 courts / 24 decisions / 12 delivered / 12 withheld / 8 incidents / 0 external sent**.
6. Open any court's Fan, Athlete and Control views. Each uses its own room code (`K1ND23` through `K1ND26`) and separate server payload.
7. Send `Fuck what a great shot` on Armstrong Court. It must reach Emi Tanaka as emphatic praise, not be blocked for profanity.
8. Prepare and then human-authorise a critical incident. Confirm **Authorised not sent** and **Connector not configured**.
9. Generate a **Protection report**, move an athlete into **Recovery**, then use **Recover demo** to clear all four courts.
10. Run `python3 tools/server_contract_test.py --base http://127.0.0.1:8000` to verify **122/122** server contracts.

Do not double-click `index.html`; modules, sessions and APIs require the local server.

## Important files

- `serve.py` — authenticated API and single server enforcement authority.
- `assets/js/semanticIntent.js` — browser clause, target, speech-act and counterfactual reasoning.
- `assets/server/semantic_reasoner.py` — independent server semantic reasoner.
- `assets/server/universal_safety.py` — authoritative classification, explanation and specialist routing.
- `assets/server/universal_policy.json` — governed policy graph metadata; no protected raw fixtures.
- `assets/server/adversarial_lab.py` — protected mutation generator and startup release gate.
- `assets/js/pages/safetyIntelligence.js` — authenticated ten-stage reasoning inspector.
- `assets/js/pages/eventSafetyTwin.js` — animated Athlete Shield, campaign graph, inbox comparison, replay, controls and Copilot UI.
- `assets/server/event_safety_twin.py` — server-owned deterministic event simulation, redacted evidence and escalation state.
- `assets/js/pages/liveMatchRoom.js` — fan composer, decision spine, athlete inbox, crowd radar and personal shield controls.
- `assets/server/live_match_room.py` — server-owned delivery gate, redacted room record, preferences and deterministic room state.
- `assets/js/pages/audienceArena.js` — fan join, protected athlete screen and presenter command experience.
- `assets/js/arenaPlatform.js` — temporary audience session, Arena requests and live synchronization client.
- `assets/server/live_audience_arena.py` — event-pass authority, delivery gate, redacted role payloads, rate limits, controls and rehearsal.
- `assets/server/tournament_operations.py` — multi-court launch, preflight, incidents, athlete continuity, exposure comparison, reports and recovery.
- `assets/js/pages/tournamentOperations.js` — tournament map, incident desk, reports, continuity and event presentation UI.
- `assets/js/tournamentPlatform.js` — authenticated tournament operations client.
- `assets/server/qr_code.swift` — local macOS Core Image QR renderer; no external QR service.
- `assets/js/lib/publicExperience.js` — session-scoped public curtain state and internal-route policy.
- `assets/js/app.js` — filtered public navigation, one-click entry, route guard and discreet presenter return.
- `assets/js/pages/hateStressTest.js` — presenter-safe combined readiness and live probe.
- `assets/js/intentRewrite.js` — source-backed rewrite generation and no-invention guard.
- `tools/server_contract_test.py` — 122 authenticated black-box contracts.

## Honest production boundary

V4.24.1 is not a claim of universal, infallible or human-superior moderation. The tournament, matches, scores, identities and rehearsal traffic are simulated; the moderation decisions come from the active local server engine. A temporary event pass is not production identity verification. The local QR defaults to loopback; audience phones require explicit LAN binding on a trusted network. The four-court picture proves role and room isolation in this build, not production scale, latency or field accuracy. Clause reasoning covers represented patterns; it is not a production semantic model. The 49 functional groups do not establish equal native-speaker quality, and no production multilingual context model is configured. The crowd-pressure score is a routing heuristic, not a probability or judgement about an individual. The K1ND on/off comparison is a same-traffic demonstration, not measured harm reduction. The generated gate is retained regression evidence, not representative field precision or recall.

Threat scores are routing heuristics, not probabilities or guilt findings. Self-harm routing is content safety, not clinical assessment. No WTA, ATP, venue-security, emergency-service or law-enforcement connector is configured, and the build cannot send an external security message.

A live tournament pilot still requires managed infrastructure and identity; contracted secure partner routes; a restricted encrypted evidence vault; lawful disclosure and jurisdiction rules; round-the-clock trained safeguarding; maintained multilingual and specialist models; representative field measurement; native-community evaluation; and independent privacy, security, human-rights, safeguarding and adversarial assessment.

**Passion stays; personal abuse doesn't.**
