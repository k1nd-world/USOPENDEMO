#!/usr/bin/env python3
from http.cookies import SimpleCookie
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import hmac
import io
import json
import os
import platform
import re
import subprocess
import sys
import tempfile
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT / "assets" / "server"))
from contextual_adapter import ContextualAdapter
from evidence_store import EvidenceStore
from event_command import EventCommand
from event_safety_twin import EventSafetyTwin
from live_match_room import LiveMatchRoom
from live_audience_arena import LiveAudienceArena, ArenaRateLimited, ARENA_ID
from tournament_operations import TournamentOperations
from platform_store import PlatformStore
from pilot_operations import PilotOperations
from model_ensemble import ModelEnsemble
from policy_engine import PolicyEngine, RANK, strongest_outcome
from universal_safety import UniversalSafetyEngine
from adversarial_lab import AdversarialLab
from visual_safety import VisualSafetyEnsemble

os.chdir(ROOT)
POLICY = PolicyEngine()
EVIDENCE = EvidenceStore(ROOT)
PLATFORM = PlatformStore(ROOT, EVIDENCE)
CONTEXT = ContextualAdapter()
SAFETY = UniversalSafetyEngine(POLICY, CONTEXT)
ADVERSARIAL = AdversarialLab(SAFETY)
STARTUP_GATE = ADVERSARIAL.run()
if not STARTUP_GATE["releaseGate"]["releaseAllowed"]:
    raise RuntimeError("V4.24.1 severe-evasion release gate failed")
VISUAL = VisualSafetyEnsemble(ROOT)
ENSEMBLE = ModelEnsemble()
PILOT = PilotOperations(EVIDENCE, POLICY)
EVENT = EventCommand(EVIDENCE, PILOT)
SAFETY_TWIN = EventSafetyTwin(EVIDENCE, SAFETY)
MATCH_ROOM = LiveMatchRoom(EVIDENCE, SAFETY)
AUDIENCE_ARENA = LiveAudienceArena(EVIDENCE, SAFETY)
TOURNAMENT = TournamentOperations(EVIDENCE, AUDIENCE_ARENA, STARTUP_GATE, ROOT)
JSON_LIMIT = 512 * 1024
IMAGE_LIMIT = 8 * 1024 * 1024
COOKIE_NAME = "k1nd_session"
ARENA_COOKIE_NAME = "k1nd_arena_session"
SECURE_COOKIES = os.environ.get("K1ND_SECURE_COOKIES", "").strip().lower() in {"1", "true", "yes", "on"}
TRUST_PROXY_HEADERS = os.environ.get("K1ND_TRUST_PROXY_HEADERS", "").strip().lower() in {"1", "true", "yes", "on"}
DEMO_BETTING_CORRECTION = "k1nd-demo-betting-disclosure-2026-11-12.1"
DEMO_BETTING_REASON = "The demo blocks this standalone betting-loss disclosure."


def is_demo_betting_disclosure(text):
    return text.strip().rstrip(".!?…").rstrip().casefold() == "i lost my bet"


class AuthRequired(Exception):
    pass


class Forbidden(Exception):
    pass


def preview_for(text, outcome):
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:12]
    if outcome != "clean":
        return f"[restricted content withheld · evidence {digest}]"
    compact = re.sub(r"\s+", " ", text).strip()
    return compact[:180] + ("…" if len(compact) > 180 else "")


class SPAHandler(SimpleHTTPRequestHandler):
    server_version = "K1ND/4.24.1"
    sys_version = ""
    protocol_version = "HTTP/1.1"

    def request_is_secure(self):
        return SECURE_COOKIES or self.headers.get("X-Forwarded-Proto", "").split(",", 1)[0].strip().lower() == "https"

    def session_cookie(self, name, value, max_age):
        secure = "; Secure" if self.request_is_secure() else ""
        return f"{name}={value}; Path=/; HttpOnly; SameSite=Strict; Max-Age={max_age}{secure}"

    def request_client_address(self):
        if TRUST_PROXY_HEADERS:
            forwarded = self.headers.get("X-Forwarded-For", "").split(",", 1)[0].strip()
            if forwarded:
                return forwarded[:120]
        return str(self.client_address[0])[:120]

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        self.send_header("Cross-Origin-Resource-Policy", "same-origin")
        if self.request_is_secure():
            self.send_header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
        self.send_header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'sha256-+FnytL2r4TlnINXWHTWsdSj/0XlBam2HTytdRue4KG4=' 'sha256-x3rBvXO01U9y5q6RHpKbuPHMwdbIAbcGn5qcuzRrfag=' 'sha256-zGzSSahtfsR0mf/5YDXN2WsdeifyZ3C0z4MZv1Ko7N4='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'")
        super().end_headers()

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def send_binary(self, status, body, content_type, headers=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length", "0") or 0)
        if not content_type.startswith("application/json"):
            raise ValueError("Content-Type must be application/json")
        if length <= 0 or length > JSON_LIMIT:
            raise ValueError("JSON body is empty or too large")
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def raw_session_token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        morsel = cookie.get(COOKIE_NAME)
        return morsel.value if morsel else None

    def raw_arena_token(self):
        cookie = SimpleCookie()
        try:
            cookie.load(self.headers.get("Cookie", ""))
        except Exception:
            return None
        morsel = cookie.get(ARENA_COOKIE_NAME)
        return morsel.value if morsel else None

    def current_session(self):
        return PLATFORM.session(self.raw_session_token())

    def require_session(self, csrf=True):
        session = self.current_session()
        if not session:
            raise AuthRequired("Sign in is required for this operation.")
        if csrf and not hmac.compare_digest(str(session["csrfToken"]), str(self.headers.get("X-K1ND-CSRF", ""))):
            raise Forbidden("The session safety token is missing or invalid. Refresh and try again.")
        return session

    def require_admin(self, csrf=False):
        session = self.require_session(csrf=csrf)
        if session["user"].get("role") != "admin":
            raise Forbidden("Moderator permission is required.")
        return session

    def current_arena_session(self):
        return AUDIENCE_ARENA.session(self.raw_arena_token())

    def require_arena_session(self, csrf=True):
        session = self.current_arena_session()
        if not session:
            raise AuthRequired("Join the Live Audience Arena first.")
        if csrf and not hmac.compare_digest(str(session["csrfToken"]), str(self.headers.get("X-K1ND-ARENA-CSRF", ""))):
            raise Forbidden("The temporary event-pass safety token is missing or invalid.")
        return session

    def do_POST(self):
        clean = self.path.split("?", 1)[0]
        try:
            if clean == "/api/auth/login": return self.handle_login()
            if clean == "/api/auth/logout": return self.handle_logout()
            if clean == "/api/media/analyze": return self.handle_media()
            if clean == "/api/moderation/enforce": return self.handle_enforce()
            if clean == "/api/publications/commit": return self.handle_publication()
            if clean == "/api/appeals": return self.handle_appeal()
            if clean == "/api/appeals/adjudicate": return self.handle_adjudication()
            if clean == "/api/cases/update": return self.handle_case_update()
            if clean == "/api/incidents/update": return self.handle_incident_update()
            if clean == "/api/partner-notifications/authorize": return self.handle_partner_authorization()
            if clean == "/api/pilot-evaluations/run": return self.handle_pilot_evaluation()
            if clean == "/api/learning/candidates": return self.handle_learning_candidate()
            if clean == "/api/learning/advance": return self.handle_learning_advance()
            if clean == "/api/event-command/controls": return self.handle_event_controls()
            if clean == "/api/event-command/protection": return self.handle_protection_update()
            if clean == "/api/event-command/delivery-drill": return self.handle_delivery_drill()
            if clean == "/api/event-command/evidence-access": return self.handle_evidence_access()
            if clean == "/api/event-command/evidence-approve": return self.handle_evidence_approval()
            if clean == "/api/event-command/readiness-run": return self.handle_event_readiness()
            if clean == "/api/safety-intelligence/inspect": return self.handle_safety_inspect()
            if clean == "/api/safety-intelligence/adversarial-run": return self.handle_adversarial_run()
            if clean == "/api/event-safety-twin/run": return self.handle_safety_twin_run()
            if clean == "/api/event-safety-twin/reset": return self.handle_safety_twin_reset()
            if clean == "/api/event-safety-twin/controls": return self.handle_safety_twin_controls()
            if clean == "/api/event-safety-twin/escalation-authorize": return self.handle_safety_twin_authorize()
            if clean == "/api/live-match-room/message": return self.handle_match_room_message()
            if clean == "/api/live-match-room/preferences": return self.handle_match_room_preferences()
            if clean == "/api/live-match-room/reset": return self.handle_match_room_reset()
            if clean == "/api/audience-arena/join": return self.handle_arena_join()
            if clean == "/api/audience-arena/leave": return self.handle_arena_leave()
            if clean == "/api/audience-arena/message": return self.handle_arena_message()
            if clean == "/api/audience-arena/controls": return self.handle_arena_controls()
            if clean == "/api/audience-arena/reset": return self.handle_arena_reset()
            if clean == "/api/audience-arena/rehearsal": return self.handle_arena_rehearsal()
            if clean == "/api/tournament-operations/launch": return self.handle_tournament_launch()
            if clean == "/api/tournament-operations/reset": return self.handle_tournament_reset()
            if clean == "/api/tournament-operations/preflight": return self.handle_tournament_preflight()
            if clean == "/api/tournament-operations/incident": return self.handle_tournament_incident()
            if clean == "/api/tournament-operations/escalation-authorize": return self.handle_tournament_escalation()
            if clean == "/api/tournament-operations/athlete-phase": return self.handle_tournament_athlete_phase()
            return self.send_json(404, {"ok": False, "error": "Unknown API route"})
        except AuthRequired as error:
            return self.send_json(401, {"ok": False, "error": str(error)})
        except (Forbidden, PermissionError) as error:
            return self.send_json(403, {"ok": False, "error": str(error)})
        except ArenaRateLimited as error:
            return self.send_json(429, {"ok": False, "error": str(error), "retryAfter": error.retry_after}, {"Retry-After": str(error.retry_after)})
        except (ValueError, json.JSONDecodeError) as error:
            return self.send_json(400, {"ok": False, "error": str(error)})
        except Exception as error:
            return self.send_json(500, {"ok": False, "error": f"Server operation failed: {type(error).__name__}"})

    def handle_login(self):
        payload = self.read_json()
        session = PLATFORM.authenticate(payload.get("userId"), payload.get("pin"), self.request_client_address())
        cookie = self.session_cookie(COOKIE_NAME, session["token"], 28800)
        return self.send_json(200, {"ok": True, "authenticated": True, "user": session["user"], "csrfToken": session["csrfToken"], "expiresAt": session["expiresAt"]}, {"Set-Cookie": cookie})

    def handle_logout(self):
        self.require_session(csrf=True)
        PLATFORM.revoke_session(self.raw_session_token())
        return self.send_json(200, {"ok": True, "authenticated": False}, {"Set-Cookie": self.session_cookie(COOKIE_NAME, "", 0)})

    def handle_enforce(self):
        session = self.require_session(csrf=True)
        payload = self.read_json()
        user = session["user"]
        content_type = str(payload.get("contentType") or "")
        if content_type not in {"post", "comment"}:
            raise ValueError("Content type must be post or comment.")
        if content_type == "post" and not user.get("canPost"):
            raise Forbidden("This account does not have trusted-poster permission.")
        if content_type == "comment" and user.get("role") == "observer":
            raise Forbidden("Only verified participants can comment.")
        text = str(payload.get("text", "")).strip()
        if not text or len(text) > 5000:
            raise ValueError("Text must contain between 1 and 5000 characters")
        client = payload.get("clientDecision") or {}
        client_outcome = client.get("outcome")
        invalid_client = client_outcome not in RANK
        if invalid_client:
            client_outcome = "review"
        server = SAFETY.classify(text)
        if is_demo_betting_disclosure(text) and server["outcome"] != "block":
            server = {
                **server,
                "outcome": "block",
                "category": "gambling_disclosure",
                "reason": DEMO_BETTING_REASON,
                "matchedRuleIds": [*server["matchedRuleIds"], DEMO_BETTING_CORRECTION],
                "policyVersion": DEMO_BETTING_CORRECTION,
            }
        media_sha = payload.get("mediaSha256")
        known_asset = payload.get("photoKey") if payload.get("photoKey") in {"action", "stadium", "clay", "ball"} else None
        media = EVIDENCE.get_media(media_sha) if media_sha else None
        if media_sha and not media:
            media_outcome, media_reason = "review", "Media evidence hash was not issued by this server"
        elif media:
            media_outcome, media_reason = media["server_outcome"], media["server_reason"]
        elif known_asset:
            media_outcome, media_reason = "clean", f"Known local asset manifest verified: {known_asset}"
        else:
            media_outcome, media_reason = "clean", "No uploaded media attached"
        context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
        target_id = context.get("targetUserId")
        prior = EVIDENCE.prior_targeted_interventions(user["id"], target_id)
        base_final = strongest_outcome(client_outcome, server["outcome"], media_outcome)
        context_decision = CONTEXT.assess(base_final, context, prior)
        final = strongest_outcome(base_final, context_decision["outcome"])
        source_rows = [
            (client_outcome, client.get("category") or "client_policy", client.get("reason") or "Browser policy decision"),
            (server["outcome"], server["category"], server["reason"]),
            (media_outcome, "server_media_evidence", media_reason),
            (context_decision["outcome"], "contextual_targeting", context_decision["reason"]),
        ]
        source = next((row for row in source_rows[1:] if row[0] == final), source_rows[0])
        row = {
            "userId": user["id"], "contentType": content_type,
            "contentHash": hashlib.sha256(text.encode("utf-8")).hexdigest(), "textPreview": preview_for(text, final),
            "clientOutcome": client_outcome, "serverOutcome": server["outcome"], "finalOutcome": final,
            "category": source[1], "reason": source[2], "policyVersion": server.get("policyVersion", SAFETY.version),
            "matchedRuleIds": server["matchedRuleIds"], "mediaSha256": media_sha, "targetUserId": target_id,
        }
        receipt = EVIDENCE.record_decision(row)
        case_id = PLATFORM.create_case(receipt, context)
        operations = PILOT.after_decision(receipt, context, case_id)
        event_command = EVENT.after_decision(receipt, context, operations, text)
        ensemble = ENSEMBLE.explain(client_outcome, server, context_decision, media_outcome, final)
        safety_intelligence = SAFETY.explain(text, server, context_decision, context, client_outcome, media_outcome, final)
        return self.send_json(200, {
            "ok": True, "outcome": final, "category": source[1], "reason": source[2],
            "receiptId": receipt["receiptId"], "signature": receipt["signature"], "createdAt": receipt["createdAt"],
            "policyVersion": server.get("policyVersion", SAFETY.version), "serverDecision": server, "contextDecision": context_decision,
            "mediaDecision": {"outcome": media_outcome, "reason": media_reason, "verified": bool(media)},
            "caseId": case_id, "authenticatedUserId": user["id"],
            "ensembleDecision": ensemble, "operationalIntelligence": operations,
            "eventCommand": event_command,
            "safetyIntelligence": safety_intelligence,
            "tamperDetected": invalid_client or str(payload.get("userId") or user["id"]) != user["id"] or RANK[server["outcome"]] > RANK[client_outcome],
            "durable": True,
        })

    def handle_safety_inspect(self):
        self.require_admin(csrf=True)
        payload = self.read_json()
        text = str(payload.get("text") or "").strip()
        if not text or len(text) > 5000:
            raise ValueError("Text must contain between 1 and 5000 characters")
        context = payload.get("context") if isinstance(payload.get("context"), dict) else {}
        return self.send_json(200, {"ok": True, "analysis": SAFETY.inspect(text, context), "rawTextReturned": False})

    def handle_adversarial_run(self):
        self.require_admin(csrf=True)
        self.read_json()
        return self.send_json(200, {"ok": True, "adversarialGate": ADVERSARIAL.run()})

    def handle_media(self):
        session = self.require_session(csrf=True)
        if session["user"].get("role") == "observer":
            raise Forbidden("Only verified participants can submit media.")
        content_type = self.headers.get("Content-Type", "")
        length = int(self.headers.get("Content-Length", "0") or 0)
        if not content_type.startswith("image/"):
            return self.send_json(415, {"ok": False, "error": "Only image uploads are accepted"})
        if length <= 0 or length > IMAGE_LIMIT:
            return self.send_json(413, {"ok": False, "error": "Image must be between 1 byte and 8 MB"})
        data = self.rfile.read(length)
        magic_ok = data.startswith(b"\xff\xd8\xff") or data.startswith(b"\x89PNG\r\n\x1a\n") or data.startswith((b"GIF87a", b"GIF89a")) or (len(data) > 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP")
        if not magic_ok:
            return self.send_json(400, {"ok": False, "error": "The upload is not a supported image file"})
        suffixes = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
        suffix = suffixes.get(content_type.split(";", 1)[0], ".img")
        temp_path = None
        try:
            with tempfile.NamedTemporaryFile(prefix="k1nd-media-", suffix=suffix, delete=False) as handle:
                handle.write(data)
                temp_path = handle.name
            analysis = {"ok": False, "engine": "unavailable", "text": "", "confidence": 0, "observations": [], "classifications": [], "visualOk": False}
            script = ROOT / "assets" / "server" / "media_ocr.swift"
            binary = ROOT / "assets" / "server" / "media_ocr"
            if platform.system() == "Darwin" and Path("/usr/bin/swift").exists() and script.exists():
                use_binary = binary.exists() and platform.machine().lower() in {"arm64", "aarch64"}
                command = [str(binary), temp_path] if use_binary else ["/usr/bin/swift", str(script), temp_path]
                try:
                    run = subprocess.run(command, capture_output=True, text=True, timeout=20 if use_binary else 150, check=False)
                    if run.stdout.strip(): analysis = json.loads(run.stdout)
                    elif run.stderr.strip(): analysis = {**analysis, "error": run.stderr.strip()[-240:]}
                except (subprocess.TimeoutExpired, json.JSONDecodeError) as error:
                    analysis = {**analysis, "error": f"Vision analysis unavailable: {type(error).__name__}"}
            sha256 = hashlib.sha256(data).hexdigest()
            classifications = analysis.get("classifications", [])
            visual = VISUAL.assess(sha256, classifications, bool(analysis.get("visualOk")))
            text_decisions = [POLICY.classify(analysis.get("text", ""))]
            text_decisions.extend(POLICY.classify(item.get("text", "")) for item in analysis.get("observations", []))
            text_outcome = strongest_outcome(*(item["outcome"] for item in text_decisions))
            ocr_outcome = text_outcome if analysis.get("ok") else "review"
            server_outcome = strongest_outcome(ocr_outcome, visual["outcome"])
            if server_outcome == "block": server_reason = "Server media evidence contains a hard-block safety signal"
            elif server_outcome == "review": server_reason = "Server media evidence requires enhanced review"
            else: server_reason = "OCR and the configured visual ensemble found no enforceable signal"
            visual_status = "active" if analysis.get("visualOk") else "unavailable"
            EVIDENCE.record_media({
                "sha256": sha256, "bytes": len(data), "width": analysis.get("width"), "height": analysis.get("height"),
                "ocrTextHash": hashlib.sha256(str(analysis.get("text", "")).encode("utf-8")).hexdigest(),
                "ocrConfidence": analysis.get("confidence", 0), "ocrStatus": "active" if analysis.get("ok") else "unavailable",
                "visualProvider": "K1ND visual provider ensemble", "visualStatus": visual_status,
                "classifications": classifications, "safetySignals": visual["signals"], "serverOutcome": server_outcome, "serverReason": server_reason,
            })
            return self.send_json(200, {
                "ok": True, "privacy": "processed locally; temporary image deleted after analysis", "sha256": sha256,
                "authenticatedUserId": session["user"]["id"],
                "media": {"contentType": content_type.split(";", 1)[0], "bytes": len(data), "width": analysis.get("width"), "height": analysis.get("height")},
                "ocr": {key: analysis.get(key) for key in ["ok", "engine", "text", "confidence", "observations", "width", "height", "error"] if analysis.get(key) is not None},
                "visualClassifier": {"status": visual_status, "provider": "K1ND visual provider ensemble", "modelType": "provider ensemble with explicit capability states", "classifications": classifications, "safetySignals": visual["signals"], "providers": visual["providers"]},
                "serverMediaDecision": {"outcome": server_outcome, "reason": server_reason, "policyVersion": POLICY.version, "durable": True},
                "manipulationSignals": [], "manipulationDetector": {"status": "not_configured", "reason": "No production forensic manipulation model is bundled"},
            })
        finally:
            if temp_path:
                try: Path(temp_path).unlink(missing_ok=True)
                except OSError: pass

    def handle_publication(self):
        session = self.require_session(csrf=True)
        payload = self.read_json()
        user = session["user"]
        text = str(payload.get("text", ""))
        content_type = str(payload.get("contentType") or "")
        if not text or len(text) > 5000:
            raise ValueError("Publication text must contain between 1 and 5000 characters")
        if content_type == "post" and not user.get("canPost"):
            raise Forbidden("This account does not have trusted-poster permission.")
        if content_type == "comment" and user.get("role") == "observer":
            raise Forbidden("Only verified participants can comment.")
        # A clean receipt may predate the current publication rule.
        if content_type in {"post", "comment"} and is_demo_betting_disclosure(text):
            raise ValueError(DEMO_BETTING_REASON)
        ledger = EVIDENCE.record_publication({**payload, "userId": user["id"], "contentType": content_type})
        content = PLATFORM.create_publication(ledger["publicationId"], payload.get("receiptId"), user, content_type, text, payload.get("metadata"))
        return self.send_json(201, {"ok": True, "authorized": True, "durable": True, **ledger, "content": content, "authenticatedUserId": user["id"]})

    def handle_appeal(self):
        session = self.require_session(csrf=True)
        payload = self.read_json()
        statement = str(payload.get("statement", "")).strip()[:600]
        if len(statement) < 12:
            raise ValueError("Appeal statement is too short")
        receipt_id = payload.get("receiptId")
        decision = EVIDENCE.get_decision(receipt_id) if receipt_id else None
        if decision and decision["user_id"] != session["user"]["id"]:
            raise Forbidden("An appeal can only reference your own moderation receipt.")
        EVIDENCE.record_appeal({**payload, "userId": session["user"]["id"], "statement": statement})
        return self.send_json(201, {"ok": True, "appealId": payload.get("appealId"), "durable": True})

    def handle_adjudication(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        if payload.get("decision") not in {"upheld", "overturned", "corrected"}:
            raise ValueError("Unknown adjudication decision")
        if len(str(payload.get("notes", "")).strip()) < 8:
            raise ValueError("Adjudication reason is required")
        result = EVIDENCE.record_adjudication({**payload, "moderatorId": session["user"]["id"]})
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_case_update(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = PLATFORM.update_case(payload.get("caseId"), session["user"]["id"], payload.get("status"), payload.get("notes"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_incident_update(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = PILOT.update_incident(payload.get("incidentId"), session["user"]["id"], payload.get("status"), payload.get("notes"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_partner_authorization(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = PILOT.authorize_partner_notification(payload.get("notificationId"), session["user"]["id"], payload.get("notes"))
        event_delivery = EVENT.on_partner_authorized(payload.get("notificationId"), session["user"]["id"])
        return self.send_json(200, {"ok": True, "durable": True, **result, "eventDelivery": event_delivery})

    def handle_pilot_evaluation(self):
        session = self.require_admin(csrf=True)
        result = PILOT.run_evaluation(session["user"]["id"])
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_learning_candidate(self):
        session = self.require_admin(csrf=True)
        result = PILOT.create_learning_candidate(session["user"]["id"], self.read_json())
        return self.send_json(201, {"ok": True, "durable": True, **result})

    def handle_learning_advance(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = PILOT.advance_learning_candidate(session["user"]["id"], payload.get("candidateId"), payload.get("nextStatus"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_event_controls(self):
        session = self.require_admin(csrf=True)
        result = EVENT.update_controls(session["user"]["id"], self.read_json())
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_protection_update(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = EVENT.update_protection(session["user"]["id"], payload.get("userId"), payload.get("level"), payload.get("notes"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_delivery_drill(self):
        session = self.require_admin(csrf=True)
        result = EVENT.run_delivery_drill(session["user"]["id"], self.read_json().get("scenario"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_evidence_access(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = EVENT.request_evidence_access(session["user"]["id"], payload.get("incidentId"), payload.get("scope"), payload.get("reason"))
        return self.send_json(201, {"ok": True, "durable": True, **result})

    def handle_evidence_approval(self):
        session = self.require_admin(csrf=True)
        result = EVENT.approve_evidence_access(session["user"]["id"], self.read_json().get("accessId"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_event_readiness(self):
        session = self.require_admin(csrf=True)
        result = EVENT.run_readiness_drill(session["user"]["id"])
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_safety_twin_run(self):
        session = self.require_admin(csrf=True)
        result = SAFETY_TWIN.run(session["user"]["id"], self.read_json())
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_safety_twin_reset(self):
        session = self.require_admin(csrf=True)
        self.read_json()
        result = SAFETY_TWIN.reset(session["user"]["id"])
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_safety_twin_controls(self):
        session = self.require_admin(csrf=True)
        result = SAFETY_TWIN.update_controls(session["user"]["id"], self.read_json())
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_safety_twin_authorize(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = SAFETY_TWIN.authorize_packet(session["user"]["id"], payload.get("packetId"))
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_match_room_message(self):
        session = self.require_session(csrf=True)
        result = MATCH_ROOM.submit(session["user"], self.read_json())
        return self.send_json(201, {"ok": True, "durable": True, **result})

    def handle_match_room_preferences(self):
        session = self.require_session(csrf=True)
        result = MATCH_ROOM.update_preferences(session["user"], self.read_json())
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_match_room_reset(self):
        session = self.require_admin(csrf=True)
        self.read_json()
        return self.send_json(200, {"ok": True, "durable": True, "room": MATCH_ROOM.reset(session["user"]["id"])})

    def handle_arena_join(self):
        result = AUDIENCE_ARENA.join(self.read_json())
        token = result.pop("token")
        cookie = self.session_cookie(ARENA_COOKIE_NAME, token, 28800)
        return self.send_json(201, {"ok": True, "durable": True, **result}, {"Set-Cookie": cookie})

    def handle_arena_leave(self):
        session = self.require_arena_session(csrf=True)
        self.read_json()
        result = AUDIENCE_ARENA.leave(session["participantId"])
        return self.send_json(200, {"ok": True, **result}, {
            "Set-Cookie": self.session_cookie(ARENA_COOKIE_NAME, "", 0)
        })

    def handle_arena_message(self):
        session = self.require_arena_session(csrf=True)
        result = AUDIENCE_ARENA.submit(session, self.read_json())
        return self.send_json(201, {"ok": True, "durable": True, **result})

    def handle_arena_controls(self):
        session = self.require_admin(csrf=True)
        result = AUDIENCE_ARENA.update_controls(session["user"]["id"], self.read_json())
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_arena_reset(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        arena_id = AUDIENCE_ARENA._resolve_arena_id(payload)
        return self.send_json(200, {"ok": True, "durable": True, "arena": AUDIENCE_ARENA.reset(session["user"]["id"], arena_id)})

    def handle_arena_rehearsal(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        arena_id = AUDIENCE_ARENA._resolve_arena_id(payload)
        return self.send_json(200, {"ok": True, "durable": True, "arena": AUDIENCE_ARENA.run_rehearsal(session["user"]["id"], arena_id)})

    def handle_tournament_launch(self):
        session = self.require_admin(csrf=True)
        self.read_json()
        return self.send_json(200, {"ok": True, "durable": True, "operations": TOURNAMENT.launch(session["user"]["id"])})

    def handle_tournament_reset(self):
        session = self.require_admin(csrf=True)
        self.read_json()
        return self.send_json(200, {"ok": True, "durable": True, "operations": TOURNAMENT.reset(session["user"]["id"])})

    def handle_tournament_preflight(self):
        session = self.require_admin(csrf=True)
        self.read_json()
        return self.send_json(200, {"ok": True, "durable": True, "preflight": TOURNAMENT.preflight(session["user"]["id"])})

    def handle_tournament_incident(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = TOURNAMENT.update_incident(
            session["user"]["id"], payload.get("incidentId"), payload.get("action"), payload.get("note")
        )
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_tournament_escalation(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = TOURNAMENT.authorize_escalation(
            session["user"]["id"], payload.get("incidentId"), payload.get("note")
        )
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def handle_tournament_athlete_phase(self):
        session = self.require_admin(csrf=True)
        payload = self.read_json()
        result = TOURNAMENT.update_athlete_phase(
            session["user"]["id"], payload.get("arenaId"), payload.get("phase")
        )
        return self.send_json(200, {"ok": True, "durable": True, **result})

    def _arena_view_context(self, query):
        view = str((query.get("view") or ["fan"])[0])
        if view == "fan":
            session = self.require_arena_session(csrf=False)
            return view, session["participantId"], session["arenaId"]
        if view == "athlete":
            code = str((query.get("code") or [""])[0]).upper()
            arena_id = AUDIENCE_ARENA.arena_id_for_code(code)
            if not arena_id:
                raise Forbidden("The protected athlete screen requires the active room code.")
            return view, None, arena_id
        if view == "presenter":
            self.require_admin(csrf=False)
            code = str((query.get("code") or [""])[0]).upper()
            arena_id = AUDIENCE_ARENA.arena_id_for_code(code) or ARENA_ID
            return view, None, arena_id
        raise ValueError("Arena view must be fan, athlete or presenter.")

    def handle_arena_summary(self, query):
        view, participant_id, arena_id = self._arena_view_context(query)
        return self.send_json(200, {"ok": True, "arena": AUDIENCE_ARENA.summary(view, participant_id, arena_id)})

    def handle_arena_events(self, query):
        view, participant_id, arena_id = self._arena_view_context(query)
        try:
            last_revision = int((query.get("since") or [self.headers.get("Last-Event-ID", "0")])[0] or 0)
        except (TypeError, ValueError):
            last_revision = 0
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Connection", "close")
        self.send_header("X-Accel-Buffering", "no")
        self.end_headers()
        try:
            for index in range(30):
                revision = AUDIENCE_ARENA.wait_for_revision(last_revision, timeout=2.0)
                if index == 0 or revision > last_revision:
                    payload = json.dumps({
                        "ok": True, "arena": AUDIENCE_ARENA.summary(view, participant_id, arena_id)
                    }, ensure_ascii=False, separators=(",", ":"))
                    self.wfile.write(f"id: {revision}\nretry: 1200\nevent: arena\ndata: {payload}\n\n".encode("utf-8"))
                    last_revision = revision
                else:
                    self.wfile.write(b": k1nd-local-heartbeat\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, OSError):
            return
        finally:
            self.close_connection = True

    def handle_arena_qr(self, query):
        target = str((query.get("url") or [""])[0]).strip()
        parsed = urlparse(target)
        if len(target) > 500 or parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise ValueError("A valid local Arena join URL is required for the QR code.")
        helper = ROOT / "assets" / "server" / "qr_code.swift"
        png = b""
        if platform.system() == "Darwin" and helper.exists():
            result = subprocess.run(
                ["swift", str(helper), target], stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                timeout=12, check=False,
            )
            if not result.returncode and result.stdout.startswith(b"\x89PNG"):
                png = result.stdout
        if not png:
            try:
                import qrcode
                image = qrcode.make(target)
                buffer = io.BytesIO()
                image.save(buffer, format="PNG")
                png = buffer.getvalue()
            except (ImportError, OSError, ValueError):
                return self.send_json(503, {"ok": False, "error": "QR rendering is unavailable. Use the displayed join link and room code."})
        return self.send_binary(200, png, "image/png", {"Content-Disposition": "inline; filename=k1nd-arena-join.png"})

    def do_GET(self):
        parsed = urlparse(self.path)
        clean = parsed.path
        query = parse_qs(parsed.query)
        try:
            if clean == "/api/health":
                return self.send_json(200, {"ok": True, "version": "4.24.1", "policyVersion": SAFETY.version, "baselinePolicyVersion": POLICY.version, "rules": POLICY.source_rule_count, "executablePatterns": POLICY.executable_patterns, "database": EVIDENCE.db_path.name, "auth": "signed-cookie-session", "feedAuthority": "server", "moderationAuthority": "server", "demoBettingCorrection": DEMO_BETTING_CORRECTION, "safetyIntelligence": "active", "pilotOperations": "active", "eventCommand": "active_demo", "eventSafetyTwin": "active_simulation", "publicExperience": "session_scoped", "liveMatchRoom": "active_simulation", "liveAudienceArena": "active_local_demo", "tournamentOperations": "active_local_demo", "arenaTransport": "server_sent_events_with_polling_fallback"})
            if clean == "/api/auth/session":
                session = self.current_session()
                return self.send_json(200, {"ok": True, "authenticated": bool(session), "user": session["user"] if session else None, "csrfToken": session["csrfToken"] if session else None, "expiresAt": session["expiresAt"] if session else None})
            if clean == "/api/platform/bootstrap":
                session = self.current_session()
                return self.send_json(200, {"ok": True, "profiles": PLATFORM.list_profiles(), **PLATFORM.feed(), "session": {"authenticated": bool(session), "user": session["user"] if session else None, "csrfToken": session["csrfToken"] if session else None, "expiresAt": session["expiresAt"] if session else None}})
            if clean == "/api/evidence/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **EVIDENCE.summary()})
            if clean == "/api/cases":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, "cases": PLATFORM.cases()})
            if clean == "/api/evaluations/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **PLATFORM.evaluation_summary()})
            if clean == "/api/intelligence/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **PILOT.intelligence_summary()})
            if clean == "/api/safeguarding/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **PILOT.safeguarding_summary()})
            if clean == "/api/pilot-evaluations/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **PILOT.evaluation_summary()})
            if clean == "/api/learning/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **PILOT.learning_summary()})
            if clean == "/api/models/status":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **ENSEMBLE.status()})
            if clean == "/api/event-command/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **EVENT.summary()})
            if clean == "/api/safety-intelligence/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **SAFETY.summary(), "adversarialGate": ADVERSARIAL.summary()})
            if clean == "/api/event-safety-twin/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, **SAFETY_TWIN.summary()})
            if clean == "/api/live-match-room/summary":
                self.require_session(csrf=False)
                return self.send_json(200, {"ok": True, "room": MATCH_ROOM.summary()})
            if clean == "/api/audience-arena/public":
                code = str((query.get("code") or [""])[0]).upper()
                return self.send_json(200, {"ok": True, "arena": AUDIENCE_ARENA.public_preview(code)})
            if clean == "/api/audience-arena/session":
                session = self.current_arena_session()
                return self.send_json(200, {"ok": True, "authenticated": bool(session), "session": session})
            if clean == "/api/audience-arena/summary":
                return self.handle_arena_summary(query)
            if clean == "/api/audience-arena/events":
                return self.handle_arena_events(query)
            if clean == "/api/audience-arena/qr.png":
                return self.handle_arena_qr(query)
            if clean == "/api/tournament-operations/summary":
                self.require_admin(csrf=False)
                return self.send_json(200, {"ok": True, "operations": TOURNAMENT.summary()})
            if clean == "/api/tournament-operations/report":
                self.require_admin(csrf=False)
                arena_id = str((query.get("arenaId") or [""])[0])
                return self.send_json(200, {"ok": True, "report": TOURNAMENT.report(arena_id)})
            if clean.startswith(("/data", "/assets/server", "/tools")):
                return self.send_json(404, {"ok": False, "error": "Not found"})
            target = ROOT / clean.lstrip("/")
            if clean != "/" and not target.exists() and "." not in Path(clean).name:
                self.path = "/index.html"
            return super().do_GET()
        except AuthRequired as error:
            return self.send_json(401, {"ok": False, "error": str(error)})
        except (Forbidden, PermissionError) as error:
            return self.send_json(403, {"ok": False, "error": str(error)})
        except ValueError as error:
            return self.send_json(400, {"ok": False, "error": str(error)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    host = os.environ.get("K1ND_HOST", "127.0.0.1")
    display_host = "localhost" if host == "127.0.0.1" else host
    print(f"K1ND v4.24.1 Tournament Operations running at http://{display_host}:{port}")
    if host != "127.0.0.1":
        print("Public/LAN binding enabled explicitly. Use HTTPS outside a trusted local network.")
    ThreadingHTTPServer((host, port), SPAHandler).serve_forever()
