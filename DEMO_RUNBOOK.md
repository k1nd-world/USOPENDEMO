# K1ND.world — v4.24.1 Hosted Tournament Operations runbook

Build: **Hosted Tournament Operations Deployment v4.24.1**

For the Render deployment, open the supplied `onrender.com` address and use the private `K1ND_DEMO_PIN` chosen during Blueprint setup. The local PINs below apply only when running the unhosted build without that setting. Do not put the hosted PIN in slides, source control or the public sign-in screen.

## The showpiece: protect the whole tournament

1. Run `python3 serve.py`, sign in as Jordan Blake with local PIN `8642`, and open `/tournament-operations`.
2. Press **Run event preflight**. Required checks must read **5/5**. Point out that WTA/ATP and venue connectors are honestly labelled **Not configured** and are not required for the offline demo.
3. Press **Launch US Open demo**. The command card must read **4 courts / 24 decisions / 4 critical**, and the venue map must show **6 received / 3 delivered / 3 withheld** on each court.
4. Explain the five-step rail: fan message → contextual decision → accurate rewrite → protected athlete delivery → tournament-wide safety intelligence.
5. Compare **K1ND off: 24 direct exposures** with **K1ND on: 12 safe deliveries / 12 intercepted**. Say clearly that this is the same simulated traffic, not a production effectiveness or wellbeing claim.
6. Open Armstrong Court's **Fan view** using `K1ND24` and its **Athlete view** on a separate screen. Send `Fuck what a great shot`; it must reach Emi Tanaka unchanged as emphatic praise.
7. Return to Tournament Operations. Open one critical incident, add a specific note and press **Prepare escalation**. The hostile original must remain absent.
8. Add a second note and press **Human authorise · no send**. The incident must display **Authorised not sent** and **Connector not configured**.
9. Generate any court's **Protection report**. It must show conversation totals, intervention categories, incident count, hostile originals included: no, and external messages sent: 0.
10. Move one athlete from **Live** to **Recovery**. Explain that the shield follows the athlete through the event rather than belonging to a single post or court.
11. Press **Recover demo** and confirm every court returns to **Scheduled**, all message counters return to zero and the incident desk is empty.

Key line: **“K1ND is no longer showing one moderation decision. It is showing how a tournament can protect every athlete, on every court, while keeping every serious action human-owned and auditable.”**

The event, matches, identities and rehearsal traffic are simulated. The moderation engine is active locally. No tournament, WTA, ATP, venue-security or emergency-service connector is configured, and this build sends no external security message.

## Retained showpiece: turn one audience room into the demo

1. Run `python3 serve.py`, sign in as Jordan Blake with local PIN `8642`, and open `/arena-control`.
2. Press **Reset empty room**. The counters must read zero and the room code must read `K1ND23`.
3. Confirm the QR image is visible. For one-machine rehearsal use the displayed loopback link. For real phones, explicitly bind the server to a trusted LAN address and replace the loopback address in the QR field.
4. Open `/arena-athlete?room=K1ND23` full-screen on the athlete display.
5. On an audience phone or separate tab, scan the QR or open `/arena?room=K1ND23`, choose a display name and join with the room code.
6. Send `Fuck what a great shot`. It must display **Delivered live**, explain **emphatic praise** and **positive emotional intensifier**, and appear unchanged on the athlete screen.
7. Send `That second serve was too predictable today.` It must arrive unchanged as sporting criticism.
8. Send `Your first serve kept landing short, you useless clown.` The fan must receive a specific explanation and `Your first serve kept landing short.` The hostile original must not appear on athlete or presenter screens.
9. Press **Send safer version**. The repaired sporting point must be rechecked and then appear live on the athlete screen.
10. Send `I will hurt you outside the stadium after the match.` It must block before athlete delivery; the athlete counter may show one more withheld message but zero hostile originals shown.
11. Point to Arena Control: the same server revision updates received, delivered, withheld, pressure, local timing, temporary passes, redacted ledger and audit timeline.
12. Change **Who reaches the athlete** to **Following only**, apply the audited control, and explain that an otherwise clean temporary-pass message can be held by the athlete's personal boundary.
13. Press **Run offline rehearsal**. Confirm **6 received / 3 delivered / 3 withheld**, no external service required and no raw hostile wording in the athlete screen.
14. Press **View as user** for the clean public handoff. Internal navigation disappears and the user lands in Arena Live. Press **Shift+Escape** to restore presenter tools.

Key line: **“This is not a moderation dashboard pretending to be a product. The fan speaks, K1ND understands the act and target, and the athlete's separate screen receives only what passed the delivery boundary.”**

The match, identities and rehearsal traffic are simulated. Temporary event passes are not production identity. Local timing is not a production service-level claim. No WTA, ATP, venue-security or emergency message is sent.

## Before the presentation

1. Deploy the build or run `python3 serve.py`.
2. Open `/demo-rehearsal.html` and confirm the canonical engine regression count is **600/600**.
3. Open `/hate-stress-test` and confirm the combined readiness score is **882/882**.
4. Sign in as Jordan Blake with local demo PIN `8642`, then open `/tournament-operations` and confirm the four-court command view.
5. Open `/athlete-shield`, press **Run live protection demo**, and confirm **24 received / 8 delivered / 16 withheld / 15 languages / 5 hard blocks**.
6. Confirm the protected inbox includes `Fuck what a great shot`, `That serve was fucking awful` and reported profanity while hostile content appears only as redacted evidence.
7. Confirm the graph shows four accounts, eight interventions, three threads and eight languages; state that the 87/100 value is a routing heuristic requiring human verification.
8. Show Moderator Copilot recommendations and point out that every item says **not auto-applied**.
9. Authorise the local safeguarding packet and confirm **approved not sent**, **connector not configured** and **external sent: no**.
10. Open `/safety-intelligence`; confirm **Server authority active**, ten stages, seven governed families and **180 generated / 0 severe misses / 0 control regressions**.
11. In the reasoning inspector, verify the joined self-harm command is blocked and routed to **Self-harm safety**, while `That was an awful performance, but the player can recover.` remains clean.
12. Enter `Fuck what a great shot` and confirm **clean**, **emphatic praise**, **positive emotional intensifier** and **no abuse signal**. Contrast it with `Fuck that player` (warning) and `I will fucking hurt you` (block).
13. Open `/media-lab`, press **Run all three**, and confirm clean → warning → block.
14. Confirm Admin shows `server-policy-4.19.0`, authenticated cases and **882/882** measured regression readiness; the policy version is retained because the moderation rules were not silently changed in V4.20.
15. Open `/event-command`; confirm the operational-truth banner, protected people, threat assessments, route status and evidence-access controls.
16. Run the six-part readiness drill and confirm it is labelled configuration proof, not measured field performance.
17. Open `/pilot-ops`; confirm provider authority, campaign intelligence, safeguarding routes, curated calibration and the “external delivery not configured” boundary.
18. Press **Enter presenter lock** immediately before the safety-tool walkthrough.
19. Before handing the screen to a player, exit presenter lock and click **View as user**. Confirm it opens Arena Live and the visible navigation is Home, Feed, Match Live, Arena Live, Create, Profile, Appeals and About.
20. Confirm there is no Demo Lab, Media Lab, Stress Test, Control Room, Admin, Pilot Ops, Event Command, Safety Intel, Athlete Shield, demo preset, Moderator session label, Trust Trail button or trust-score panel.
21. Enter `/admin` directly and confirm the app returns to Arena Live. Press **Shift+Escape** only when you are ready to restore presenter tools.

## Player handoff sequence

1. Sign in as Jordan Blake with local PIN `8642` while the presenter controls are visible.
2. Open **Arena Control**, show the QR and open the protected athlete screen separately.
3. Click **View as user** in the top bar. Hand over the screen in **Arena Live**, join with the room code and watch the separate athlete screen update.
4. Try `Fuck what a great shot`; it must arrive unchanged because the profanity is emotional praise, not abuse.
5. Try `Your second serve was too predictable today.`; strong sporting criticism must also arrive unchanged.
6. Try `Your first serve kept landing short, you useless clown.`; the personal attack must stay out of the athlete inbox while the accurate rewrite keeps `Your first serve kept landing short.`
7. Accept the safer version and show that it is rechecked before delivery. Then try a bare insult to demonstrate **No rewrite invented**.
8. Try a credible threat. It must be blocked, absent from the athlete view and explicitly marked as not externally sent.
9. When the player handoff ends, press **Shift+Escape**. The full presenter navigation returns immediately.

Public Experience is a presentation curtain over the local build. It does not turn demo identities, storage or integrations into production services.

## The strongest five-minute sequence

### 1. “One live moment, three role-separated experiences”

Sign in as Jordan Blake, open **Arena Control**, put the athlete screen on `/arena-athlete?room=K1ND23`, then click **View as user**. The public experience opens directly in **Arena Live**.

Start with `Fuck what a great shot`. Show **clean**, **emphatic praise** and **delivered live**. Point to the same message in Mara's protected inbox.

Next send `Your first serve kept landing short, you useless clown.` The fan screen explains the person target and abuse mechanism. The athlete screen never displays the hostile original, and Arena Control receives only redacted evidence metadata. Accept `Your first serve kept landing short.` and show it arrive as the author's actual sporting point, not a generic “be kind” replacement.

Send a bare personal attack and show **No rewrite invented**. Finish with `I will hurt you outside the stadium after the match.` It must hard-block before athlete delivery, with **external message sent: no**.

The athlete screen contains only allowed conversation plus a quiet wellbeing digest. Arena Control shows the same received/delivered/withheld decision stream, temporary passes and audit timeline.

Say: **“K1ND is not muting passion. It is making a delivery decision between the fan's impulse and the athlete's screen—while keeping the genuine sporting point intact.”**

Point out that the crowd-pressure score is an explainable routing signal, not a probability, and that shield settings are audited preferences rather than automatic sanctions.

### 2. “This is the abuse the athlete never has to see”

Sign in as Jordan Blake and open **Athlete Shield**. Press **Run live protection demo**.

Say: **“These accounts and messages are simulated, but every decision is coming from the same K1ND server engine you have just seen.”**

Show the counters and then the protected inbox. Point out that praise, strong sporting criticism and emotionally profane reactions still reach the athlete. K1ND does not treat a swear word as abuse by itself.

Move to the graph and say: **“One message can look isolated. K1ND joins target, account, thread and language signals so the safeguarding team can see a possible campaign.”** Be explicit that the score is a routing heuristic, not an attribution or probability claim.

Finish with Moderator Copilot and the threat packet. Press **Authorise local packet**, then show **approved not sent**. Say: **“K1ND can prepare the evidence and recommend the next step, but a trained human remains responsible and this build cannot contact WTA, ATP or venue security.”**

### 3. “Try to break K1ND”

Open Demo Lab and say:

**“Don’t take my word for it. Type something you would not want an athlete, child or fan to receive.”**

Recommended sequence:

- `Your first serve kept landing short, you useless clown.` → Intervention + source-backed rewrite: `Your first serve kept landing short.`
- `I'm going to hurt you after the final.` → Hard Block.
- `That player is a cheat and she's doping.` → Enhanced Review.
- `That was an awful performance. She lost confidence in the second set.` → Clean.
- `I'm going to destroy you in the final.` → Clean sporting hyperbole.

Key line:

**“We didn’t silence the fan. We removed the personal abuse and preserved the sporting opinion.”**

Then open **Hate Stress Test**. Show the five green verdicts and explain that the suite covers canonical policy, adversarial evasion, multimodal evidence, non-bypassable blocks and neutral counterexamples. Use the live probe for an audience-supplied spelling or language and show the target, abuse mechanism and rationale.

Now sign in as Jordan Blake and open **Safety Intel**. Start with the passed generated gate: 180 server-created severe evasions, zero severe misses and zero protected neutral-control regressions. Explain that the raw fixtures stay restricted and that this is retained regression evidence—not field accuracy.

In the live reasoning inspector, enter the joined form of “kill yourself” shown in the reported screenshot and select **Target is a verified athlete**. It must display **block**, **specific participant**, **direct self-harm instruction**, **harmful instruction** and **Self-harm safety**. Point out the explicit boundary that this is not a clinical assessment and does not create attacker-threat evidence. Then enter `That was an awful performance, but the player can recover.`; it must display **clean**, **allow** and **none detected**.

Next enter three semantic contrasts:

- `Fuck what a great shot` → clean; one praise clause; removing profanity leaves praise; no rewrite.
- `That shot was brilliant; you are an idiot.` → warning; two clauses; the praise stays and the personal attack is removed; rewrite: `That shot was brilliant.`
- `Nice job, genius.` → warning for implicit personal degradation; no rewrite is invented because there is no separate proposition to preserve.

Finish with `I will fucking hurt you`. Show **block**, the threat speech act, harm-intensifying profanity and **severe floor locked**. Explain that neither contextual framing nor a counterfactual can downgrade that category.

Walk left to right through the ten-stage rail: normalization, language, clauses, target, speech act, mechanism, counterfactuals, context, specialist route and action. Then show that every policy-family card names its provenance and context safeguard. The central line is: **“K1ND is explaining what every clause is doing, who it targets and which element creates the harm—not merely showing a banned-word match.”**

Then open **Media Evidence Lab** and run all three PNGs. Point out that Apple Vision OCR and general visual classification are actually reading the pixels on-device, each text region is checked independently, and the independent server media verdict governs the result. The correct sequence is clean, warning, block. Be explicit that dedicated identity-hate/symbol, known-harm and forensic models remain production requirements.

For contextual Australian proof, compare `You are a cooker.` with `Use the slow cooker.` The first receives an intent-preserving intervention; the appliance sentence stays clean. For Baltic-region proof, compare `Sa oled loll.` with `See mõte on loll.` The first targets a person in Estonian; the second criticises an idea and stays clean.

Then show pragmatic context with three short contrasts:

- `He called me an idiot after the match.` → clean reported abuse.
- `He is an idiot.` → intervention for a direct personal attack.
- `Don’t call her an idiot, you moron.` → intervention because a fresh attack remains outside the counterspeech frame.

Point to **Context assessment** to show speech act, stance, target scope, protected framing, abuse stacking and the policy-risk band. Explain that quotation marks alone do not create an exemption.

Show **Presenter Shield** with a call-safe personal-insult mutation such as `You are an i___d___i___o___t.` Then enter an unknown targeted separated token. The first receives an intervention; the second is held for enhanced review because the browser engine detects evasion but cannot honestly infer the word's meaning.

Recommended line: **“If K1ND recognises the abuse, it intervenes. If targeted wording is deliberately obscured and the system is uncertain, it does not silently publish it or invent a meaning—it holds it.”**

Now keep one bare attack in the text box and switch through the four conversation settings. Show that standalone abuse receives an intervention, a reply identifies the athlete, an active pile-on escalates to review and an U18 target triggers the additional minor-safety safeguard. The explanation must name the target, role, recent turns and cumulative signals.

### Threat-to-security operations

Sign in as Jordan Blake and open **Event Command**. Start with the operational-truth banner: K1ND records are live locally, while governing-body and venue routes are unconfigured and every delivery exercise is simulated.

Show:

- the event risk mode, default safeguarding SLA and acknowledgement timeout;
- heightened and critical protected-person levels;
- the threat assessment's intent, target, time, location/access, capability/method and repeat-targeting signals;
- the combined timeline, with live and simulated badges;
- WTA / ATP / tournament-security route status;
- the evidence-minimised delivery ledger;
- the two-person restricted-evidence rule.

Run **Simulate acknowledgement**, then **Simulate no-ack fallback**. Point to `externalMessageSent: false` and the clearly simulated labels. Request restricted evidence access, then attempt approval as the same moderator; the server must deny self-approval.

Say: **“K1ND connects the threat to the person, event, repeated behaviour, access signals and safeguarding workflow. It prepares the right operational record but does not silently transmit personal or restricted evidence. Delivery begins only after a governing body or venue provides a contracted secure route and trained humans authorise the disclosure.”**

Then open **Pilot Ops** and show the corresponding critical 15-minute incident, signed receipt/digest boundary and final packet status **approved — not sent**.

### 4. Show it inside the real feed

Sign in as **Priya Anand** (local demo PIN `2468`) and open Feed. Comment on a post with:

`Your first serve kept landing short, you useless clown.`

The visual intervention should show:

- what K1ND detected;
- the original wording;
- the source-backed rewrite;
- the exact clause retained from the author's draft;
- the **Point kept** and **Removed** explanation;
- Rewrite with AI / Rewrite yourself / Cancel / Enhanced moderation;
- no “post anyway” path.

Accept the rewrite. Confirm that the published comment still says the first serve was landing short; it should not become generic criticism. Then click the **shield** beside the published comment and open its **Trust Trail**.

Next, test a hard-block draft that contains a separate sporting point. Explain that the original stays blocked while only the isolated, independently re-moderated sporting clause can be used as a new draft. A pure threat or prohibited slur must offer no draft at all.

Then try a bare attack such as `You are such an idiot.` K1ND should show **No rewrite invented** because there is no genuine sporting point to preserve. Explain that the system will not manufacture a polite-sounding opinion simply to keep the user posting.

Reply to an existing comment and point out that the composer now names the participant being answered and shows how many recent turns are being assessed. This is the live product path, not a separate laboratory-only mock-up.

### 5. Show accountability unlocking participation

Sign out to return to the anonymous observer state.

Show that the account can browse, like and follow but cannot comment or publish.

Open Verify and run the simulated verification journey. Explain the Public vs Private split:

- **Public:** account + Verified trust signal.
- **Private:** verification-provider reference / accountability architecture.
- Identity documents are not displayed to the community.

Be explicit: the browser demo does not run real identity checks.

### 6. Show behaviour changing over time

Return to Demo Lab while using a verified identity.

Press **Load repeat-behaviour scenario**. This seeds two demo interventions. The next harmful borderline attempt becomes the third intervention and demonstrates **Enhanced Safeguard / mandatory review**.

Explain:

- first intervention → safety nudge;
- second → reflection friction;
- third+ → stronger safeguard / hold;
- clean criticism remains publishable.

Key line:

**“K1ND is not only moderating individual posts. It is designed to change repeated behaviour.”**

### 7. Finish with the Control Room

Open Trust & Safety Control Room.

Start with **Illustrative Scale Scenario** and clearly state that the large figures are presentation-only modelling, not deployment or partner data.

Then switch to **Live Demo Session** and show the counters created by the interactions you just performed.

The narrative is:

**prevention → constructive rewrite → accountable publication → measurable outcome.**

### 8. Show the safety-operations loop

Open **Appeals** as a participating account, then switch to Admin. Show the preserved original decision, the member's context statement and the requirement for a reasoned upheld, overturned or corrected adjudication. A correction should create a regression-learning record without changing live policy automatically.

In Admin, finish on the persistent-targeting graph and language-quality dashboard. Be explicit that 49 language groups have functional fixture coverage, while field precision/recall is not yet claimed.

Sign in as **Jordan Blake** (local demo PIN `8642`) and show the connected Admin tools:

- the red-team queue created from live audience probes;
- the language-candidate form, which requires meaning, example and source but cannot activate an unreviewed rule;
- the searchable policy console with all 259 active rules/signals;
- the governed learning loop connecting native review and red-team evidence to regression and next-pack approval.

Key line: **“The demo does not pretend a scraped word list is intelligence. New language enters a governed review, native-speaker and regression-testing process.”**

For global-language proof, filter the policy console to **Next language wave**. Show Bengali, Persian, Hebrew, Indonesian, Vietnamese, Thai, Tagalog, Swahili or Amharic, then use one presenter-safe dismissive command in Demo Lab. Point out the native rewrite and its clean re-check. Avoid displaying identity slurs during the live presentation; their raw fixtures remain represented by redacted labels in the test view.

## Image-safety sequence

In Demo Lab cycle through:

1. Clean sports photo → Allow.
2. Abusive meme → Block.
3. Manipulated athlete image → Enhanced Review.
4. Threatening graphic → Block.

Then open **Media Evidence Lab** and run the three real PNG challenges. Explain that local OCR, Apple Vision classification, region-level text policy, caption fusion and durable server media evidence are active. Dedicated identity-hate/symbol, known-harm and manipulation models remain a transparent production boundary.

## Audience presets

### Sport
Focus on passion, criticism and verified participation.

### Youth Safety
Focus on Observer vs Verified access, U18 states and hard-block safeguards.

### Athlete Welfare
Focus on personal/body abuse, post-match targeting and serious allegations.

### Brand / Advertiser
Focus on measurable safety, accountable audiences and no gambling advertising.

### Investor
Focus on the trust layer, intervention conversion, behaviour escalation and the distinction between live demo metrics and scalable deployment metrics.

## Presenter-safe moderation examples

### Clean / publish

- `That was an awful performance.`
- `That was a terrible pass.`
- `What an awful shot.`
- `I strongly disagree with that decision.`
- `I'm going to destroy you in the final.`

### Intervention

- `You were useless today, never play again.`
- `You bottled it again.`
- `The umpire is a corrupt idiot.`
- `That was a terrible pass, you idiot.`
- `Fuck off.`

### Enhanced Review

- `That player is a cheat.`
- `She is doping.`
- `The umpire took money to make that call.`
- `Everyone go spam her account after that loss.`

### Hard Block

Use call-safe examples rather than real slurs:

- `Go back to where you came from.`
- `I'm going to hurt you after the final.`
- Address / phone-number examples from the private rehearsal page.

## Production boundary

Operational in V4.19.0: one authoritative server reasoning path, a governed policy graph, protected generated release gate, specialist harm routing, authenticated server sessions, server role authorization, CSRF protection, server-owned posts/comments, contextual escalation, joined/obfuscated severe-harm blocking, signed receipts, durable SQLite evidence and cases, Apple Vision OCR/classification, rewrite flow, appeals, adjudication, Trust Trail, coordinated-abuse signals, safeguarding incidents, protected calibration, governed next-release learning and a local audited Event Command workflow.

The 180-case gate and 882-case suite prove deterministic fixtures, not universal language quality or superiority to trained humans. Clause reasoning covers represented deterministic patterns; script/language resolution remains heuristic because no production multilingual context model is configured. The demonstration event, initial participants, seeded history and security-route exercises are labelled simulated. WTA/ATP/tournament-security entries are non-live routes, not delivered messages. Production integrations still required: contracted named security endpoints, acknowledgement and fallback procedures, lawful disclosure and jurisdiction protocols, a restricted encrypted evidence vault, real identity and privileged-access governance, managed infrastructure, venue/governing-body data feeds, representative field measurement, native-community evaluation, specialist providers, retention/deletion controls and trained safeguarding cover.

## Core lines

**The intervention happens between impulse and publication.**

**Don’t silence the fan. Change the behaviour.**

**Strong opinions without personal abuse.**
