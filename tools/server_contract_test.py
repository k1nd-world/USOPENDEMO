#!/usr/bin/env python3
"""Black-box checks for V4.24.1 Tournament Operations and retained platform safeguards."""
import argparse
import http.cookiejar
import json
import sys
import urllib.error
import urllib.request
import uuid


class Client:
    def __init__(self, base):
        self.base = base
        self.jar = http.cookiejar.CookieJar()
        self.opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(self.jar))
        self.csrf = ""
        self.arena_csrf = ""

    def call(self, path, payload=None, method=None, csrf=True, arena=False):
        data = None if payload is None else json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json"} if data is not None else {}
        if csrf and (method or ("POST" if data is not None else "GET")) != "GET":
            if arena and self.arena_csrf:
                headers["X-K1ND-ARENA-CSRF"] = self.arena_csrf
            elif self.csrf:
                headers["X-K1ND-CSRF"] = self.csrf
        request = urllib.request.Request(self.base + path, data=data, headers=headers, method=method or ("POST" if data is not None else "GET"))
        try:
            with self.opener.open(request, timeout=10) as response:
                return response.status, json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as error:
            return error.code, json.loads(error.read().decode("utf-8"))

    def login(self, user_id, pin):
        status, payload = self.call("/api/auth/login", {"userId": user_id, "pin": pin})
        if status == 200:
            self.csrf = payload["csrfToken"]
        return status, payload

    def arena_join(self, display_name, room_code="K1ND23"):
        status, payload = self.call(
            "/api/audience-arena/join",
            {"displayName": display_name, "roomCode": room_code},
            csrf=False,
        )
        if status == 201:
            self.arena_csrf = payload.get("session", {}).get("csrfToken", "")
        return status, payload


def enforcement(text, content_type="post", client="clean", forged_user="u_admin", context=None, **extra):
    return {
        "userId": forged_user,
        "contentType": content_type,
        "text": text,
        "clientDecision": {"outcome": client, "category": "fixture", "reason": "Contract fixture"},
        "context": context or {},
        **extra,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", default="http://127.0.0.1:8018")
    args = parser.parse_args()
    total = passed = 0

    def check(label, ok, detail=""):
        nonlocal total, passed
        total += 1
        passed += int(bool(ok))
        print("PASS" if ok else "FAIL", label, detail)

    public = Client(args.base)
    status, health = public.call("/api/health")
    check("Health identifies universal server authority", status == 200 and health.get("version") == "4.24.1" and health.get("feedAuthority") == "server" and health.get("moderationAuthority") == "server" and health.get("safetyIntelligence") == "active" and health.get("pilotOperations") == "active" and health.get("eventCommand") == "active_demo" and health.get("eventSafetyTwin") == "active_simulation" and health.get("publicExperience") == "session_scoped" and health.get("liveMatchRoom") == "active_simulation" and health.get("liveAudienceArena") == "active_local_demo" and health.get("tournamentOperations") == "active_local_demo" and health.get("arenaTransport") == "server_sent_events_with_polling_fallback")
    status, arena_public = public.call("/api/audience-arena/public")
    check("Arena public preview exposes a room without leaking its access code", status == 200 and arena_public.get("arena", {}).get("version") == "live-audience-arena-4.24.1" and arena_public.get("arena", {}).get("courtsAvailable") == 4 and arena_public.get("arena", {}).get("roomCodeRequired") is True and "roomCode" not in arena_public.get("arena", {}))
    status, _ = public.call("/api/audience-arena/summary?view=fan")
    check("Arena fan payload requires a temporary event pass", status == 401)
    status, _ = public.arena_join("Contract Guest", "WRONG23")
    check("Arena rejects an inactive room code", status == 403)
    status, _ = public.call("/api/audience-arena/summary?view=athlete&code=WRONG23")
    check("Protected athlete payload rejects the wrong room code", status == 403)
    status, _ = public.call("/api/live-match-room/summary")
    check("Live Match Room rejects unsigned spectators", status == 401)
    status, _ = public.call("/api/moderation/enforce", enforcement("Great match"))
    check("Unsigned moderation request rejected", status == 401)
    status, _ = public.login("u_trusted", "0000")
    check("Bad PIN rejected", status == 403)

    trusted = Client(args.base)
    status, login = trusted.login("u_trusted", "3579")
    check("Trusted poster receives signed session", status == 200 and login.get("authenticated") and bool(trusted.csrf))
    status, _ = trusted.call("/api/moderation/enforce", enforcement("A strong performance."), csrf=False)
    check("Missing CSRF token rejected", status == 403)

    clean_text = "Server-owned contract post " + uuid.uuid4().hex[:10]
    status, clean = trusted.call("/api/moderation/enforce", enforcement(clean_text, forged_user="u_admin"))
    check("Forged identity ignored", status == 200 and clean.get("outcome") == "clean" and clean.get("authenticatedUserId") == "u_trusted" and clean.get("tamperDetected") is True)
    status, publication = trusted.call("/api/publications/commit", {
        "userId": "u_admin", "contentType": "post", "text": clean_text,
        "receiptId": clean.get("receiptId"), "signature": clean.get("signature"),
        "metadata": {"sport": "tennis", "moderationStatus": "clean"},
    })
    check("Clean receipt creates authoritative server post", status == 201 and publication.get("content", {}).get("authorId") == "u_trusted" and publication.get("content", {}).get("content") == clean_text)
    status, bootstrap = public.call("/api/platform/bootstrap")
    check("Public bootstrap includes committed server post", status == 200 and any(item.get("id") == publication.get("content", {}).get("id") for item in bootstrap.get("posts", [])))

    status, warning = trusted.call("/api/moderation/enforce", enforcement("You are an idiot."))
    check("Personal attack intervened and case created", status == 200 and warning.get("outcome") in {"warning", "review", "block"} and bool(warning.get("caseId")))
    status, _ = trusted.call("/api/publications/commit", {
        "contentType": "post", "text": "You are an idiot.", "receiptId": warning.get("receiptId"), "signature": warning.get("signature"), "metadata": {},
    })
    check("Non-clean receipt cannot publish", status == 400)

    status, self_harm = trusted.call("/api/moderation/enforce", enforcement("killyourself"))
    self_harm_event = self_harm.get("eventCommand", {}) or {}
    check(
        "Joined self-harm command is blocked without attacker-threat routing",
        status == 200
        and self_harm.get("outcome") == "block"
        and self_harm.get("category") == "self_harm_encouragement"
        and self_harm.get("serverDecision", {}).get("category") == "self_harm_encouragement"
        and not self_harm.get("operationalIntelligence", {}).get("partnerNotificationId")
        and not self_harm_event.get("threatAssessment"),
    )

    context = {"targetUserId": "u_u18", "targetIsU18": True, "targetIsAthlete": False, "cumulativeSignals": 2, "turnsConsidered": 7}
    status, contextual = trusted.call("/api/moderation/enforce", enforcement("You are an idiot.", context=context))
    check("Server context escalates repeated U18 targeting", status == 200 and contextual.get("outcome") == "review" and contextual.get("contextDecision", {}).get("status") == "active")
    status, criticism = trusted.call("/api/moderation/enforce", enforcement("That was an awful performance.", context=context))
    check("Context does not suppress clean sporting criticism", status == 200 and criticism.get("outcome") == "clean")

    status, emphatic_praise = trusted.call("/api/moderation/enforce", enforcement("Fuck what a great shot"))
    praise_reasoning = emphatic_praise.get("safetyIntelligence", {}).get("reasoning", {})
    check("Untargeted profanity used as praise publishes cleanly", status == 200 and emphatic_praise.get("outcome") == "clean" and not emphatic_praise.get("caseId"))
    check("Safety reasoning explains profanity function rather than a word hit", praise_reasoning.get("speechAct") == "emphatic praise" and praise_reasoning.get("mechanism") == "emotional emphasis (non-abusive)" and praise_reasoning.get("profanity", {}).get("abuseSignal") is False and praise_reasoning.get("target", {}).get("class") == "sporting action or object")
    status, directed_profanity = trusted.call("/api/moderation/enforce", enforcement("Fuck that player."))
    check("Person-directed profanity still intervenes", status == 200 and directed_profanity.get("outcome") in {"warning", "review"} and directed_profanity.get("serverDecision", {}).get("category") == "personal_degradation")
    status, intensified_threat = trusted.call("/api/moderation/enforce", enforcement("I will fucking hurt you."))
    check("Profanity inserted into a threat cannot weaken the hard block", status == 200 and intensified_threat.get("outcome") == "block" and intensified_threat.get("serverDecision", {}).get("category") == "targeted_violence")
    status, reported_profanity = trusted.call("/api/moderation/enforce", enforcement("He told me to fuck off."))
    check("Reported profanity remains publishable", status == 200 and reported_profanity.get("outcome") == "clean" and reported_profanity.get("safetyIntelligence", {}).get("reasoning", {}).get("speechAct") == "reporting, quoting or analysing language")
    status, semantic_taunt = trusted.call("/api/moderation/enforce", enforcement("Nice job, genius."))
    semantic_taunt_reasoning = semantic_taunt.get("safetyIntelligence", {}).get("reasoning", {}).get("semanticIntent", {})
    check("Semantic policy catches contempt disguised as praise", status == 200 and semantic_taunt.get("outcome") == "warning" and semantic_taunt.get("serverDecision", {}).get("semanticOverride") == "implicit_personal_attack" and bool(semantic_taunt.get("caseId")))
    check("Clause proof resolves the implicit person target without echoing text", semantic_taunt_reasoning.get("summary", {}).get("dominantSpeechAct") == "sarcastic personal degradation" and semantic_taunt_reasoning.get("clauses", [{}])[0].get("target", {}).get("type") == "person" and semantic_taunt_reasoning.get("rawTextReturned") is False and "nice job" not in json.dumps(semantic_taunt_reasoning).lower())
    status, mixed_intent = trusted.call("/api/moderation/enforce", enforcement("That shot was brilliant; you are an idiot."))
    mixed_semantic = mixed_intent.get("safetyIntelligence", {}).get("reasoning", {}).get("semanticIntent", {})
    check("Mixed clauses retain praise while intervening on the personal attack", status == 200 and mixed_intent.get("outcome") in {"warning", "review"} and mixed_semantic.get("summary", {}).get("mixedIntent") is True and mixed_semantic.get("summary", {}).get("clauseCount") == 2)
    threat_semantic = intensified_threat.get("safetyIntelligence", {}).get("reasoning", {}).get("semanticIntent", {})
    check("Counterfactual reasoning cannot downgrade the severe-harm floor", threat_semantic.get("severeFloor", {}).get("locked") is True and len(threat_semantic.get("counterfactuals", [])) == 2 and threat_semantic.get("recommendation", {}).get("outcome") == "block")

    # Keep the Match Room checks repeatable even when this suite is rerun against
    # the same local preview database.
    match_setup = Client(args.base)
    match_setup.login("u_admin", "8642")
    match_setup.call("/api/live-match-room/reset", {})

    adult = Client(args.base)
    status, _ = adult.login("u_adult", "2468")
    check("Verified adult can authenticate", status == 200)
    status, match_summary = adult.call("/api/live-match-room/summary")
    match_room = match_summary.get("room", {})
    check("Verified participant sees the server-owned two-sided match room", status == 200 and match_room.get("version") == "live-match-room-4.22.0" and match_room.get("counters", {}).get("received") == 6 and match_room.get("counters", {}).get("delivered") == 3 and match_room.get("counters", {}).get("withheld") == 3 and any(item.get("category") == "campaign_harassment" and not item.get("deliveredToAthlete") for item in match_room.get("messages", [])) and all(item.get("authorDisplay") != "crowd-surge-7" for item in match_room.get("athleteInbox", [])) and match_room.get("capabilities", {}).get("serverAuthoritativeDecisions") is True and match_room.get("capabilities", {}).get("externalDelivery") is False)
    status, match_praise = adult.call("/api/live-match-room/message", {"text": "Fuck what a great shot", "sourceKind": "fan_message"})
    check("Contextual profanity reaches the protected athlete inbox", status == 201 and match_praise.get("fanDecision", {}).get("outcome") == "clean" and match_praise.get("fanDecision", {}).get("deliveredToAthlete") is True and any(item.get("safePreview") == "Fuck what a great shot" for item in match_praise.get("room", {}).get("athleteInbox", [])))
    status, match_criticism = adult.call("/api/live-match-room/message", {"text": "Your second serve was too predictable today.", "sourceKind": "fan_message"})
    check("Strong sporting criticism remains available to the athlete", status == 201 and match_criticism.get("fanDecision", {}).get("outcome") == "clean" and match_criticism.get("fanDecision", {}).get("deliveredToAthlete") is True)
    mixed_original = "Your first serve kept landing short, you useless clown."
    status, match_attack = adult.call("/api/live-match-room/message", {"text": mixed_original, "sourceKind": "fan_message"})
    match_attack_serialized = json.dumps(match_attack).lower()
    check("Personal attack is withheld while its sporting point survives for rewrite", status == 201 and match_attack.get("fanDecision", {}).get("outcome") in {"warning", "review", "block"} and match_attack.get("fanDecision", {}).get("deliveredToAthlete") is False and mixed_original.lower() not in match_attack_serialized and "withheld from athlete" in match_attack_serialized)
    status, match_rewrite = adult.call("/api/live-match-room/message", {"text": "Your first serve kept landing short.", "sourceKind": "accepted_rewrite"})
    check("A source-backed rewrite is rechecked and delivered", status == 201 and match_rewrite.get("fanDecision", {}).get("outcome") == "clean" and match_rewrite.get("fanDecision", {}).get("deliveredToAthlete") is True and any(item.get("safePreview") == "Your first serve kept landing short." and item.get("sourceKind") == "accepted_rewrite" for item in match_rewrite.get("room", {}).get("athleteInbox", [])))
    match_threat_original = "I will hurt you outside the stadium after the match."
    status, match_threat = adult.call("/api/live-match-room/message", {"text": match_threat_original, "sourceKind": "fan_message"})
    check("Credible live threat is blocked without raw athlete exposure or external delivery", status == 201 and match_threat.get("fanDecision", {}).get("outcome") == "block" and match_threat.get("fanDecision", {}).get("deliveredToAthlete") is False and match_threat.get("externalMessageSent") is False and match_threat_original.lower() not in json.dumps(match_threat).lower())
    status, match_preferences = adult.call("/api/live-match-room/preferences", {"shieldLevel": "maximum", "digestMode": "post_match", "repliesMode": "following_only"})
    check("Athlete shield preferences are audited without autonomous sanctions", status == 200 and match_preferences.get("auditRecorded") is True and match_preferences.get("automaticAccountAction") is False and match_preferences.get("room", {}).get("preferences", {}).get("shieldLevel") == "maximum")
    status, _ = adult.call("/api/live-match-room/reset", {})
    check("Only moderators can reset the live demonstration", status == 403)
    status, _ = adult.call("/api/moderation/enforce", enforcement("A clean post", content_type="post"))
    check("Non-poster denied post permission", status == 403)
    comment_text = "Thoughtful server comment " + uuid.uuid4().hex[:8]
    status, comment_receipt = adult.call("/api/moderation/enforce", enforcement(comment_text, content_type="comment"))
    status2, comment = adult.call("/api/publications/commit", {
        "contentType": "comment", "text": comment_text, "receiptId": comment_receipt.get("receiptId"), "signature": comment_receipt.get("signature"), "metadata": {"postId": "p1"},
    })
    check("Verified adult can create server-owned comment", status == 200 and status2 == 201 and comment.get("content", {}).get("postId") == "p1")
    status, _ = adult.call("/api/cases")
    check("Non-moderator cannot read case workspace", status == 403)
    status, _ = adult.call("/api/safeguarding/summary")
    check("Non-moderator cannot read safeguarding operations", status == 403)
    status, _ = adult.call("/api/models/status")
    check("Non-moderator cannot read provider operations", status == 403)
    status, _ = adult.call("/api/event-command/summary")
    check("Non-moderator cannot read event command", status == 403)
    status, _ = adult.call("/api/safety-intelligence/summary")
    check("Non-moderator cannot read Safety Intelligence", status == 403)
    status, _ = adult.call("/api/event-safety-twin/summary")
    check("Non-moderator cannot read Athlete Shield event intelligence", status == 403)
    status, _ = adult.call("/api/tournament-operations/summary")
    check("Non-moderator cannot read tournament operations", status == 403)

    appeal_id = "contract_" + uuid.uuid4().hex
    status, appeal = trusted.call("/api/appeals", {
        "appealId": appeal_id, "receiptId": warning.get("receiptId"), "localEventId": "contract-event",
        "userId": "u_admin", "statement": "Please review the contextual targeting evidence for this decision.",
    })
    check("Appeal is bound to signed-in receipt owner", status == 201 and appeal.get("durable") is True)

    admin = Client(args.base)
    status, _ = admin.login("u_admin", "8642")
    check("Moderator receives authenticated session", status == 200)
    status, arena_reset = admin.call("/api/audience-arena/reset", {})
    check("Moderator can restore an empty deterministic Arena", status == 200 and arena_reset.get("arena", {}).get("counters", {}).get("received") == 0 and arena_reset.get("arena", {}).get("state", {}).get("shieldLevel") == "heightened")
    status, arena_presenter = admin.call("/api/audience-arena/summary?view=presenter")
    check("Presenter receives the room handoff and redacted operational view", status == 200 and arena_presenter.get("arena", {}).get("roomCode") == "K1ND23" and arena_presenter.get("arena", {}).get("view") == "presenter" and arena_presenter.get("arena", {}).get("capabilities", {}).get("roleSeparatedPayloads") is True)

    arena_fan = Client(args.base)
    status, arena_join = arena_fan.arena_join("Casey Court")
    check("Room code issues a temporary audience pass", status == 201 and arena_join.get("session", {}).get("temporary") is True and arena_join.get("session", {}).get("badge") == "Event verified" and bool(arena_fan.arena_csrf))
    status, _ = arena_fan.call("/api/audience-arena/message", {"text": "What a point"}, csrf=False, arena=True)
    check("Arena message requires its separate anti-forgery token", status == 403)
    status, arena_praise = arena_fan.call("/api/audience-arena/message", {"text": "Fuck what a great shot"}, arena=True)
    check("Live contextual profanity reaches the athlete", status == 201 and arena_praise.get("fanDecision", {}).get("outcome") == "clean" and arena_praise.get("fanDecision", {}).get("deliveredToAthlete") is True)
    status, arena_criticism = arena_fan.call("/api/audience-arena/message", {"text": "That second serve was too predictable today."}, arena=True)
    check("Live sporting criticism remains available", status == 201 and arena_criticism.get("fanDecision", {}).get("outcome") == "clean" and arena_criticism.get("fanDecision", {}).get("deliveredToAthlete") is True)
    arena_attack_original = "Your first serve kept landing short, you useless clown."
    status, arena_attack = arena_fan.call("/api/audience-arena/message", {"text": arena_attack_original}, arena=True)
    check("Live mixed abuse is withheld and never returned raw", status == 201 and arena_attack.get("fanDecision", {}).get("outcome") in {"warning", "review", "block"} and arena_attack.get("fanDecision", {}).get("deliveredToAthlete") is False and arena_attack_original.lower() not in json.dumps(arena_attack).lower())
    status, arena_rewrite = arena_fan.call("/api/audience-arena/message", {"text": "Your first serve kept landing short.", "sourceKind": "accepted_rewrite"}, arena=True)
    check("Arena rechecks and delivers the source-backed rewrite", status == 201 and arena_rewrite.get("fanDecision", {}).get("outcome") == "clean" and arena_rewrite.get("fanDecision", {}).get("deliveredToAthlete") is True)

    threat_fan = Client(args.base)
    threat_fan.arena_join("Safety Signal")
    arena_threat_original = "I will hurt you outside the stadium after the match."
    status, arena_threat = threat_fan.call("/api/audience-arena/message", {"text": arena_threat_original}, arena=True)
    check("Live threat is blocked before athlete delivery without raw disclosure", status == 201 and arena_threat.get("fanDecision", {}).get("outcome") == "block" and arena_threat.get("fanDecision", {}).get("deliveredToAthlete") is False and arena_threat.get("externalMessageSent") is False and arena_threat_original.lower() not in json.dumps(arena_threat).lower())
    status, athlete_view = public.call("/api/audience-arena/summary?view=athlete&code=K1ND23")
    athlete_payload = athlete_view.get("arena", {})
    check("Athlete receives only allowed safe text", status == 200 and athlete_payload.get("view") == "athlete" and len(athlete_payload.get("athleteInbox", [])) == 3 and all(item.get("deliveredToAthlete") for item in athlete_payload.get("athleteInbox", [])) and arena_attack_original.lower() not in json.dumps(athlete_payload).lower() and arena_threat_original.lower() not in json.dumps(athlete_payload).lower())
    status, presenter_after = admin.call("/api/audience-arena/summary?view=presenter")
    presenter_payload = presenter_after.get("arena", {})
    check("Presenter ledger contains decisions and redacted evidence, not hostile originals", status == 200 and presenter_payload.get("counters", {}).get("received") == 5 and presenter_payload.get("counters", {}).get("delivered") == 3 and presenter_payload.get("counters", {}).get("withheld") == 2 and arena_attack_original.lower() not in json.dumps(presenter_payload).lower() and arena_threat_original.lower() not in json.dumps(presenter_payload).lower())
    status, duplicate = arena_fan.call("/api/audience-arena/message", {"text": "Your first serve kept landing short.", "sourceKind": "accepted_rewrite"}, arena=True)
    check("Arena suppresses rapid duplicate reactions", status == 429 and duplicate.get("retryAfter", 0) >= 1)

    status, controls = admin.call("/api/audience-arena/controls", {"status": "open", "shieldLevel": "maximum", "digestMode": "quiet", "repliesMode": "following_only", "slowMode": True})
    check("Presenter controls are audited and never sanction accounts automatically", status == 200 and controls.get("auditRecorded") is True and controls.get("automaticAccountAction") is False and controls.get("arena", {}).get("state", {}).get("repliesMode") == "following_only")
    boundary_fan = Client(args.base)
    boundary_fan.arena_join("New Voice")
    status, boundary_message = boundary_fan.call("/api/audience-arena/message", {"text": "Brilliant defence on break point."}, arena=True)
    check("Athlete reply preference can withhold otherwise clean temporary-pass content", status == 201 and boundary_message.get("fanDecision", {}).get("outcome") == "review" and boundary_message.get("fanDecision", {}).get("category") == "athlete_reply_boundary" and boundary_message.get("fanDecision", {}).get("deliveredToAthlete") is False)
    status, rehearsal = admin.call("/api/audience-arena/rehearsal", {})
    rehearsal_arena = rehearsal.get("arena", {})
    check("Offline rehearsal uses the active engine with a 3/3 protected split", status == 200 and rehearsal_arena.get("counters", {}).get("received") == 6 and rehearsal_arena.get("counters", {}).get("delivered") == 3 and rehearsal_arena.get("counters", {}).get("withheld") == 3 and rehearsal_arena.get("offline", {}).get("externalServicesRequired") is False and rehearsal_arena.get("shieldDigest", {}).get("rawHostileContentShown") is False)
    status, final_arena_reset = admin.call("/api/audience-arena/reset", {})
    check("Arena reset invalidates temporary passes and clears the room", status == 200 and final_arena_reset.get("arena", {}).get("counters", {}).get("received") == 0 and final_arena_reset.get("arena", {}).get("counters", {}).get("participants") == 0)
    status, _ = arena_fan.call("/api/audience-arena/summary?view=fan")
    check("Invalidated temporary pass cannot reopen fan data", status == 401)

    status, initial_tournament = admin.call("/api/tournament-operations/summary")
    initial_operations = initial_tournament.get("operations", {})
    check("Tournament command exposes four isolated courts and honest routes", status == 200 and initial_operations.get("version") == "tournament-operations-4.24.1" and len(initial_operations.get("courts", [])) == 4 and len({item.get("roomCode") for item in initial_operations.get("courts", [])}) == 4 and all(route.get("state") != "live" for route in initial_operations.get("routes", [])))
    status, preflight = admin.call("/api/tournament-operations/preflight", {})
    preflight_result = preflight.get("preflight", {})
    check("Event preflight separates required readiness from unconfigured connectors", status == 200 and preflight_result.get("launchReady") is True and preflight_result.get("requiredReady") == preflight_result.get("requiredTotal") and any(item.get("id") == "partner_connectors" and item.get("status") == "not_configured" and item.get("required") is False for item in preflight_result.get("checks", [])))
    status, launched = admin.call("/api/tournament-operations/launch", {})
    launched_operations = launched.get("operations", {})
    launched_serialized = json.dumps(launched_operations).lower()
    check("One launch runs the real moderation engine across four courts", status == 200 and launched_operations.get("tournament", {}).get("status") == "active_demo" and launched_operations.get("totals", {}).get("received") == 24 and launched_operations.get("totals", {}).get("delivered") == 12 and launched_operations.get("totals", {}).get("withheld") == 12)
    check("Tournament launch creates redacted incident intelligence with no external delivery", launched_operations.get("totals", {}).get("openIncidents") == 8 and launched_operations.get("totals", {}).get("criticalIncidents") == 4 and launched_operations.get("totals", {}).get("externalMessagesSent") == 0 and "i will hurt you" not in launched_serialized and all(not item.get("external_sent") for item in launched_operations.get("incidentDesk", [])))

    armstrong_fan = Client(args.base)
    status, armstrong_join = armstrong_fan.arena_join("Armstrong Fan", "K1ND24")
    check("Second-court room code issues an isolated temporary audience pass", status == 201 and armstrong_join.get("session", {}).get("arenaId") == "arena_k1nd_armstrong" and armstrong_join.get("arena", {}).get("event", {}).get("court") == "Armstrong Court")
    status, armstrong_praise = armstrong_fan.call("/api/audience-arena/message", {"text": "Fuck what a great shot"}, arena=True)
    check("Contextual praise reaches the correct second-court athlete", status == 201 and armstrong_praise.get("fanDecision", {}).get("outcome") == "clean" and armstrong_praise.get("arena", {}).get("event", {}).get("score", {}).get("player") == "Emi Tanaka")
    status, armstrong_athlete = public.call("/api/audience-arena/summary?view=athlete&code=K1ND24")
    check("Second-court athlete payload remains role separated", status == 200 and armstrong_athlete.get("arena", {}).get("athlete", {}).get("displayName") == "Emi Tanaka" and len(armstrong_athlete.get("arena", {}).get("athleteInbox", [])) == 4 and all(item.get("deliveredToAthlete") for item in armstrong_athlete.get("arena", {}).get("athleteInbox", [])))

    status, report = admin.call("/api/tournament-operations/report?arenaId=arena_k1nd_armstrong")
    report_payload = report.get("report", {})
    check("Post-match report is privacy safe and honest about measurement", status == 200 and report_payload.get("conversation", {}).get("received") == 7 and report_payload.get("conversation", {}).get("delivered") == 4 and report_payload.get("assurance", {}).get("rawHostileContentIncluded") is False and report_payload.get("assurance", {}).get("productionEffectivenessClaim") is False and report_payload.get("assurance", {}).get("externalMessagesSent") == 0)

    critical_incident = next(item for item in launched_operations.get("incidentDesk", []) if item.get("severity") == "critical")
    status, prepared = admin.call("/api/tournament-operations/incident", {"incidentId": critical_incident["incident_id"], "action": "prepare_escalation", "note": "Credible threat metadata verified for security coordination."})
    check("Critical incident prepares a redacted packet without sending", status == 200 and prepared.get("status") == "escalation_prepared" and prepared.get("externalMessageSent") is False)
    status, authorised = admin.call("/api/tournament-operations/escalation-authorize", {"incidentId": critical_incident["incident_id"], "note": "Human authorisation recorded for the local routing demonstration."})
    check("Human authorisation cannot pretend an unconfigured connector delivered", status == 200 and authorised.get("status") == "authorised_not_sent" and authorised.get("routeState") == "connector_not_configured" and authorised.get("externalMessageSent") is False)
    status, phase = admin.call("/api/tournament-operations/athlete-phase", {"arenaId": "arena_k1nd_armstrong", "phase": "recovery"})
    check("Athlete protection follows from live play into recovery", status == 200 and phase.get("phase") == "recovery" and phase.get("shieldFollowsAthlete") is True and phase.get("auditRecorded") is True)
    status, recovered = admin.call("/api/tournament-operations/reset", {})
    recovered_ops = recovered.get("operations", {})
    check("One recovery action returns every court to a clean baseline", status == 200 and recovered_ops.get("tournament", {}).get("status") == "ready" and recovered_ops.get("totals", {}).get("received") == 0 and recovered_ops.get("totals", {}).get("openIncidents") == 0 and all(item.get("matchStatus") == "scheduled" for item in recovered_ops.get("courts", [])))

    status, match_reset = admin.call("/api/live-match-room/reset", {})
    reset_room = match_reset.get("room", {})
    check("Moderator reset restores the deterministic safe demo baseline", status == 200 and reset_room.get("counters", {}).get("received") == 6 and reset_room.get("preferences", {}).get("shieldLevel") == "heightened" and reset_room.get("shieldDigest", {}).get("rawHostileContentShown") is False)
    status, cases = admin.call("/api/cases")
    check("Moderator can read prioritised cases", status == 200 and any(item.get("case_id") == warning.get("caseId") for item in cases.get("cases", [])))
    status, evaluation = admin.call("/api/evaluations/summary")
    check("Quality endpoint separates measured and unmeasured metrics", status == 200 and evaluation.get("deterministicRegression", {}).get("passed") == 882 and evaluation.get("labelledPilot", {}).get("precision") is None)

    status, safety_summary = admin.call("/api/safety-intelligence/summary")
    graph = safety_summary.get("policyGraph", {})
    check("Safety summary exposes one governed server authority", status == 200 and safety_summary.get("authority", {}).get("decision") == "server_authoritative" and safety_summary.get("authority", {}).get("clientMayWeaken") is False and len(safety_summary.get("pipeline", [])) == 10 and len(graph.get("families", [])) == 7 and graph.get("governance", {}).get("automaticLiveLearning") is False)
    startup_gate = safety_summary.get("adversarialGate", {})
    check("Startup release gate has zero severe misses", startup_gate.get("releaseGate", {}).get("status") == "passed" and startup_gate.get("releaseGate", {}).get("releaseAllowed") is True and startup_gate.get("generated") == 180 and startup_gate.get("severeMisses") == 0 and startup_gate.get("falsePositives") == 0 and startup_gate.get("rawFixturesReturned") is False)

    inspect_context = {"targetUserId": "u_athlete", "targetRole": "professional athlete", "targetIsAthlete": True}
    status, inspected_harm = admin.call("/api/safety-intelligence/inspect", {"text": "killyourself", "context": inspect_context})
    harm_analysis = inspected_harm.get("analysis", {})
    check("Reasoning inspector resolves self-harm target speech act and route", status == 200 and harm_analysis.get("decision", {}).get("outcome") == "block" and harm_analysis.get("decision", {}).get("category") == "self_harm_encouragement" and harm_analysis.get("reasoning", {}).get("target", {}).get("class") == "specific participant" and harm_analysis.get("reasoning", {}).get("speechAct") == "direct self-harm instruction" and harm_analysis.get("specialistRouting", {}).get("id") == "self_harm_safety")
    check("Reasoning response never echoes submitted hostile text", inspected_harm.get("rawTextReturned") is False and harm_analysis.get("reasoning", {}).get("normalization", {}).get("rawTextReturned") is False and "killyourself" not in json.dumps(inspected_harm).lower())

    status, inspected_threat = admin.call("/api/safety-intelligence/inspect", {"text": "i.w.i.l.l.s.t.a.b.y.o.u", "context": inspect_context})
    check("Evasion-normalized threat reaches credible-violence route", status == 200 and inspected_threat.get("analysis", {}).get("decision", {}).get("outcome") == "block" and inspected_threat.get("analysis", {}).get("decision", {}).get("category") == "targeted_violence" and inspected_threat.get("analysis", {}).get("specialistRouting", {}).get("id") == "credible_violence")
    status, inspected_clean = admin.call("/api/safety-intelligence/inspect", {"text": "That was an awful performance, but the player can recover.", "context": inspect_context})
    check("Reasoning inspector preserves strong sporting criticism", status == 200 and inspected_clean.get("analysis", {}).get("decision", {}).get("outcome") == "clean" and inspected_clean.get("analysis", {}).get("reasoning", {}).get("mechanism") == "none detected")
    status, rerun_gate = admin.call("/api/safety-intelligence/adversarial-run", {})
    gate_result = rerun_gate.get("adversarialGate", {})
    check("Moderator can rerun protected adversarial gate without raw fixtures", status == 200 and gate_result.get("releaseGate", {}).get("status") == "passed" and gate_result.get("severeMisses") == 0 and gate_result.get("rawFixturesReturned") is False and not any(key.lower() in {"text", "seed", "phrase", "fixture"} for item in gate_result.get("families", []) for key in item))

    threat_context = {
        "postId": "p1", "sport": "tennis", "targetUserId": "u_athlete",
        "targetRole": "professional athlete", "targetIsAthlete": True,
        "turnsConsidered": 4, "postMatchWindow": True,
    }
    status, threat = trusted.call("/api/moderation/enforce", enforcement(
        "I'm going to stab you outside the stadium after the match.", content_type="comment", context=threat_context,
    ))
    operations = threat.get("operationalIntelligence", {})
    check("Credible threat creates critical safeguarding path", status == 200 and threat.get("outcome") == "block" and bool(operations.get("incidentId")) and bool(operations.get("partnerNotificationId")))
    check("Threat decision exposes ensemble reasoning", threat.get("ensembleDecision", {}).get("finalOutcome") == "block" and threat.get("ensembleDecision", {}).get("calibratedProbability") is None)
    check("Enforcement returns inspectable universal reasoning", threat.get("safetyIntelligence", {}).get("authority", {}).get("decision") == "server_authoritative" and threat.get("safetyIntelligence", {}).get("specialistRouting", {}).get("id") == "credible_violence" and threat.get("safetyIntelligence", {}).get("reasoning", {}).get("normalization", {}).get("rawTextReturned") is False)
    event_threat = threat.get("eventCommand", {}).get("threatAssessment") or {}
    check("Event command fuses threat credibility signals", event_threat.get("band") == "critical" and event_threat.get("score", 0) >= 80 and event_threat.get("signals", {}).get("protectedTarget") and event_threat.get("signals", {}).get("locationOrAccessKnowledge") and event_threat.get("signals", {}).get("capabilityOrMethod"))

    status, contact = trusted.call("/api/moderation/enforce", enforcement(
        "Call me on 07123 456 789.", content_type="comment", context=threat_context,
    ))
    contact_ops = contact.get("operationalIntelligence", {})
    check("Personal data exposure is not mislabelled as threat notification", status == 200 and contact.get("outcome") == "block" and bool(contact_ops.get("incidentId")) and not contact_ops.get("partnerNotificationId"))

    status, safeguarding = admin.call("/api/safeguarding/summary")
    threat_incident = next((item for item in safeguarding.get("incidents", []) if item.get("incident_id") == operations.get("incidentId")), {})
    notification = threat_incident.get("partnerNotification") or {}
    check("Tennis threat prepares WTA ATP security packet", status == 200 and threat_incident.get("priority") == "critical" and notification.get("status") == "pending_human_authorization" and "WTA / ATP" in notification.get("destination_label", ""))
    check("Partner route remains human authorized and unconfigured", safeguarding.get("evidenceVault", {}).get("status") == "required_not_configured" and all("human-authorized" in route.get("delivery", "") or "protocol" in route.get("delivery", "") for route in safeguarding.get("partnerRoutes", [])))
    status, authorization = admin.call("/api/partner-notifications/authorize", {
        "notificationId": operations.get("partnerNotificationId"),
        "notes": "Threat and target verified for contracted partner review.",
    })
    check("Authorization cannot pretend external delivery occurred", status == 200 and authorization.get("status") == "approved_not_sent" and "No external message sent" in authorization.get("delivery", "") and authorization.get("eventDelivery", {}).get("externalMessageSent") is False)

    status, command = admin.call("/api/event-command/summary")
    check("Event command exposes protected people and honest routes", status == 200 and len(command.get("protectedPeople", [])) >= 2 and len(command.get("securityRoutes", [])) == 3 and all(route.get("connector_state") != "live" for route in command.get("securityRoutes", [])) and "no external" in command.get("boundaries", {}).get("delivery", "").lower())
    status, controls = admin.call("/api/event-command/controls", {
        "mode": "lockdown_demo", "slowMode": True, "newAccountFriction": True,
        "replyBurstLimit": 3, "highRiskLanguageReview": True,
        "note": "Contract drill elevated event protections for a threat scenario.",
    })
    check("Moderator can apply audited event controls", status == 200 and controls.get("mode") == "lockdown_demo" and controls.get("replyBurstLimit") == 3)
    status, protection = admin.call("/api/event-command/protection", {
        "userId": "u_athlete", "level": "critical", "notes": "Threat drill requires temporary critical monitoring.",
    })
    check("Protected-person level is server controlled", status == 200 and protection.get("monitoringLevel") == "critical")
    status, ack_drill = admin.call("/api/event-command/delivery-drill", {"scenario": "acknowledged"})
    status2, fallback_drill = admin.call("/api/event-command/delivery-drill", {"scenario": "timeout_fallback"})
    check("Routing drills test acknowledgement and fallback without sending", status == 200 and status2 == 200 and ack_drill.get("state") == "simulated_acknowledged" and fallback_drill.get("state") == "simulated_fallback_triggered" and not ack_drill.get("externalMessageSent") and not fallback_drill.get("externalMessageSent"))
    status, access = admin.call("/api/event-command/evidence-access", {
        "incidentId": operations.get("incidentId"), "scope": "restricted_raw_evidence",
        "reason": "Verify location and capability indicators for the critical threat drill.",
    })
    check("Restricted evidence request requires two-person control", status == 201 and access.get("status") == "pending_second_approver" and access.get("twoPersonControl") and access.get("rawEvidenceReturned") is False)
    status, same_person_approval = admin.call("/api/event-command/evidence-approve", {"accessId": access.get("accessId")})
    check("Evidence requester cannot self-approve", status == 400 and "different authorised approver" in same_person_approval.get("error", ""))
    status, readiness = admin.call("/api/event-command/readiness-run", {})
    check("Event readiness drill verifies configuration only", status == 200 and readiness.get("passed") == 6 and readiness.get("total") == 6 and readiness.get("fieldQuality") is None and readiness.get("status") == "configuration drill only")
    status, command_after = admin.call("/api/event-command/summary")
    check("Event timeline separates live and simulated operations", status == 200 and any(not item.get("simulated") for item in command_after.get("timeline", [])) and any(item.get("simulated") for item in command_after.get("timeline", [])) and any(item.get("state") == "simulated_fallback_triggered" for item in command_after.get("deliveries", [])))

    status, twin_idle = admin.call("/api/event-safety-twin/summary")
    check("Athlete Shield starts as an honest idle simulation", status == 200 and twin_idle.get("run") is None and twin_idle.get("event", {}).get("status") == "SIMULATED" and twin_idle.get("capabilities", {}).get("externalIngestion") is False and twin_idle.get("capabilities", {}).get("externalDelivery") is False)
    status, twin = admin.call("/api/event-safety-twin/run", {"scenario": "match_point_surge"})
    twin_run = twin.get("run") or {}
    twin_counts = twin_run.get("counters") or {}
    check("Event Safety Twin runs the real server engine across the full burst", status == 200 and twin_counts.get("received") == 24 and twin_counts.get("languages") == 15 and twin_counts.get("scripts") == 4 and twin_counts.get("delivered", 0) >= 7 and twin_counts.get("protected", 0) >= 14)
    check("Athlete inbox preserves contextual profanity while withholding hostility", any(item.get("safe_preview") == "Fuck what a great shot" and item.get("delivered_to_athlete") for item in twin_run.get("messages", [])) and all(item.get("safe_preview", "").startswith("[intercepted") for item in twin_run.get("messages", []) if not item.get("delivered_to_athlete")))
    graph = twin_run.get("attackGraph") or {}
    check("Campaign graph joins accounts, threads and languages without attribution claims", graph.get("signals", {}).get("accounts") == 4 and graph.get("signals", {}).get("interventions") == 8 and graph.get("signals", {}).get("threads") == 3 and graph.get("humanVerificationRequired") is True and "not a probability" in graph.get("scoreMeaning", ""))
    packet = twin_run.get("escalation") or {}
    check("Threat packet waits for a human and cannot claim delivery", packet.get("state") == "pending_human_authorization" and packet.get("connectorState") == "not_configured" and packet.get("externalMessageSent") is False and packet.get("rawEvidenceIncluded") is False)
    check("Moderator Copilot recommends but never applies emergency action", twin_run.get("copilot", {}).get("automaticEmergencyAction") is False and len(twin_run.get("copilot", {}).get("recommendations", [])) >= 3 and all(item.get("actionApplied") is False for item in twin_run.get("copilot", {}).get("recommendations", [])))
    status, twin_controls = admin.call("/api/event-safety-twin/controls", {"mode": "lockdown_demo", "slowMode": True, "newAccountFriction": True, "enhancedLanguageReview": True, "replyBurstLimit": 2})
    check("Human-set Athlete Shield controls are audited and never autonomous", status == 200 and twin_controls.get("controls", {}).get("mode") == "lockdown_demo" and twin_controls.get("controls", {}).get("replyBurstLimit") == 2 and twin_controls.get("automaticAction") is False)
    status, twin_auth = admin.call("/api/event-safety-twin/escalation-authorize", {"packetId": packet.get("packetId")})
    check("Human authorization records a local packet without external delivery", status == 200 and twin_auth.get("packet", {}).get("state") == "approved_not_sent" and twin_auth.get("externalMessageSent") is False and "No external message sent" in twin_auth.get("delivery", ""))
    status, twin_reset = admin.call("/api/event-safety-twin/reset", {})
    check("Athlete Shield reset returns the deterministic idle baseline", status == 200 and twin_reset.get("run") is None and twin_reset.get("controls", {}).get("mode") == "heightened" and twin_reset.get("controls", {}).get("replyBurstLimit") == 6)

    campaign_signal = None
    for post_id in ("p2", "p3", "p4"):
        campaign_context = {"postId": post_id, "targetUserId": "u_athlete", "targetRole": "professional athlete", "targetIsAthlete": True}
        _, campaign_decision = trusted.call("/api/moderation/enforce", enforcement("You are an idiot.", content_type="comment", context=campaign_context))
        campaign_signal = campaign_decision.get("operationalIntelligence", {}).get("campaignSignal") or campaign_signal
    check("Cross-thread repeat targeting creates campaign signal", campaign_signal and campaign_signal.get("signalType") in {"cross_thread_repeat_targeting", "coordinated_pile_on"})
    status, intelligence = admin.call("/api/intelligence/summary")
    check("Campaign graph links subject target and threads", status == 200 and any(edge.get("subjectUserId") == "u_trusted" and edge.get("targetUserId") == "u_athlete" and edge.get("threads", 0) >= 3 for edge in intelligence.get("edges", [])))

    status, calibration = admin.call("/api/pilot-evaluations/run", {})
    check("Protected curated calibration runs exactly", status == 200 and calibration.get("exact") == 23 and calibration.get("total") == 23 and calibration.get("fn") == 0 and calibration.get("severeMisses") == 0)
    status, pilot_evaluation = admin.call("/api/pilot-evaluations/summary")
    check("Curated and representative field metrics remain separated", status == 200 and pilot_evaluation.get("curatedCalibration", {}).get("metrics", {}).get("exact") == 23 and pilot_evaluation.get("representativePilot", {}).get("precision") is None)

    status, candidate = admin.call("/api/learning/candidates", {
        "title": "Contract context candidate", "rationale": "Native review evidence for a context-sensitive emerging pattern.",
        "language": "English", "harmType": "context_error", "sourceType": "contract_fixture",
    })
    candidate_id = candidate.get("candidateId")
    check("Learning candidate begins in native review", status == 201 and candidate.get("status") == "native_review" and bool(candidate_id))
    status, regression_ready = admin.call("/api/learning/advance", {"candidateId": candidate_id, "nextStatus": "regression_ready"})
    status2, shadow = admin.call("/api/learning/advance", {"candidateId": candidate_id, "nextStatus": "shadow"})
    check("Passing calibration permits shadow only", status == 200 and status2 == 200 and shadow.get("status") == "shadow" and shadow.get("automaticLiveChange") is False)
    status, learning = admin.call("/api/learning/summary")
    check("Shadow deployment cannot auto-promote", status == 200 and any(item.get("candidate_id") == candidate_id and item.get("metrics", {}).get("automaticPromotion") is False for item in learning.get("deployments", [])))

    status, models = admin.call("/api/models/status")
    providers = {item.get("id"): item for item in models.get("providers", [])}
    check("Model seams disclose configured capability", status == 200 and providers.get("deterministic_policy", {}).get("status") == "active" and providers.get("multilingual_context_model", {}).get("status") in {"configured", "adapter_ready_not_configured"} and models.get("calibration", {}).get("fieldConfidence") is None)
    status, case_update = admin.call("/api/cases/update", {"caseId": warning.get("caseId"), "status": "in_review", "notes": "Contract moderator reviewed the targeting evidence."})
    check("Moderator can update durable case", status == 200 and case_update.get("status") == "in_review")
    status, adjudication = admin.call("/api/appeals/adjudicate", {
        "appealId": appeal_id, "moderatorId": "u_trusted", "decision": "upheld", "correctedCategory": None,
        "notes": "The direct personal attack was correctly intercepted.",
    })
    check("Adjudication uses authenticated moderator identity", status == 200 and bool(adjudication.get("adjudicationId")))

    status, _ = trusted.call("/api/auth/logout", {}, method="POST")
    status2, session = trusted.call("/api/auth/session")
    check("Logout revokes server session", status == 200 and status2 == 200 and session.get("authenticated") is False)

    print(f"server contract: {passed}/{total}")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
