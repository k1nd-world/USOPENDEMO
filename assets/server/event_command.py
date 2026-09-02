import json
import re
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from evidence_store import now_iso


EVENT_ID = "event_k1nd_tennis_major_demo"
ASSESSMENT_VERSION = "event-threat-assessment-4.19.0"


class EventCommand:
    def __init__(self, evidence, pilot):
        self.evidence = evidence
        self.pilot = pilot
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self._initialize()

    def connect(self):
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self):
        created = now_iso()
        with self.lock, self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS live_events (
                    event_id TEXT PRIMARY KEY, name TEXT NOT NULL, sport TEXT NOT NULL,
                    venue_label TEXT NOT NULL, timezone TEXT NOT NULL, status TEXT NOT NULL,
                    operating_mode TEXT NOT NULL, starts_at TEXT NOT NULL, ends_at TEXT NOT NULL,
                    simulated INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS protected_people (
                    protection_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, user_id TEXT NOT NULL,
                    display_label TEXT NOT NULL, role_label TEXT NOT NULL, is_minor INTEGER NOT NULL DEFAULT 0,
                    monitoring_level TEXT NOT NULL, status TEXT NOT NULL, consent_basis TEXT NOT NULL,
                    channels_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    UNIQUE(event_id,user_id), FOREIGN KEY(event_id) REFERENCES live_events(event_id)
                );
                CREATE TABLE IF NOT EXISTS event_timeline (
                    entry_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, entry_type TEXT NOT NULL,
                    severity TEXT NOT NULL, title TEXT NOT NULL, detail_json TEXT NOT NULL,
                    source_id TEXT, simulated INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL,
                    FOREIGN KEY(event_id) REFERENCES live_events(event_id)
                );
                CREATE INDEX IF NOT EXISTS idx_event_timeline ON event_timeline(event_id,created_at DESC);
                CREATE TABLE IF NOT EXISTS threat_assessments (
                    assessment_id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL UNIQUE, incident_id TEXT,
                    event_id TEXT NOT NULL, target_user_id TEXT, credibility_score INTEGER NOT NULL,
                    credibility_band TEXT NOT NULL, imminence TEXT NOT NULL, location_specificity TEXT NOT NULL,
                    capability_signal TEXT NOT NULL, repeat_pattern INTEGER NOT NULL DEFAULT 0,
                    protected_target INTEGER NOT NULL DEFAULT 0, signals_json TEXT NOT NULL,
                    recommended_action TEXT NOT NULL, version TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE TABLE IF NOT EXISTS security_routes (
                    route_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, label TEXT NOT NULL,
                    route_type TEXT NOT NULL, status TEXT NOT NULL, acknowledgement_minutes INTEGER NOT NULL,
                    fallback_label TEXT NOT NULL, connector_state TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(event_id) REFERENCES live_events(event_id)
                );
                CREATE TABLE IF NOT EXISTS partner_deliveries (
                    delivery_id TEXT PRIMARY KEY, notification_id TEXT, event_id TEXT NOT NULL,
                    route_id TEXT NOT NULL, state TEXT NOT NULL, simulated INTEGER NOT NULL DEFAULT 0,
                    ack_due_at TEXT, acknowledged_at TEXT, acknowledged_by TEXT, fallback_state TEXT NOT NULL,
                    packet_digest TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    FOREIGN KEY(route_id) REFERENCES security_routes(route_id)
                );
                CREATE TABLE IF NOT EXISTS event_controls (
                    event_id TEXT PRIMARY KEY, mode TEXT NOT NULL, slow_mode INTEGER NOT NULL,
                    new_account_friction INTEGER NOT NULL, reply_burst_limit INTEGER NOT NULL,
                    high_risk_language_review INTEGER NOT NULL, changed_by TEXT NOT NULL,
                    change_note TEXT NOT NULL, updated_at TEXT NOT NULL,
                    FOREIGN KEY(event_id) REFERENCES live_events(event_id)
                );
                CREATE TABLE IF NOT EXISTS evidence_access_requests (
                    access_id TEXT PRIMARY KEY, incident_id TEXT, requested_by TEXT NOT NULL,
                    approved_by TEXT, scope TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL,
                    expires_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS event_readiness_runs (
                    run_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, passed INTEGER NOT NULL,
                    total INTEGER NOT NULL, results_json TEXT NOT NULL, run_by TEXT NOT NULL,
                    created_at TEXT NOT NULL, FOREIGN KEY(event_id) REFERENCES live_events(event_id)
                );
            """)
            if not db.execute("SELECT 1 FROM live_events WHERE event_id=?", (EVENT_ID,)).fetchone():
                start = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
                db.execute("""INSERT INTO live_events
                    (event_id,name,sport,venue_label,timezone,status,operating_mode,starts_at,ends_at,simulated,created_at,updated_at)
                    VALUES (?,?,?,?,?,'active_demo','heightened',?,?,1,?,?)""", (
                    EVENT_ID, "K1ND Tennis Major — Live Event Demo", "tennis",
                    "New York tournament demo environment", "America/New_York",
                    start.isoformat(), (start + timedelta(days=14)).isoformat(), created, created,
                ))
            protected = [
                ("protect_mara", "u_athlete", "Mara Volkov", "professional athlete", 0, "heightened", "authorised demo profile"),
                ("protect_noah", "u_u18", "Noah Kim", "under-18 participant", 1, "critical", "minor-safety demo protocol"),
            ]
            for row in protected:
                db.execute("""INSERT OR IGNORE INTO protected_people
                    (protection_id,event_id,user_id,display_label,role_label,is_minor,monitoring_level,status,consent_basis,channels_json,created_at,updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)""", (
                    row[0], EVENT_ID, row[1], row[2], row[3], row[4], row[5], row[6],
                    json.dumps(["K1ND posts", "K1ND comments", "partner adapters not configured"]), created, created,
                ))
            routes = [
                ("route_wta_atp", "WTA / ATP security coordination", "governing_body", "contract_required", 5, "Tournament security control room", "not_configured"),
                ("route_tournament", "Tournament security control room", "event_security", "adapter_ready", 3, "On-call safeguarding lead", "not_configured"),
                ("route_emergency", "Emergency-services protocol", "emergency", "jurisdiction_protocol_required", 1, "Manual emergency procedure", "not_configured"),
            ]
            for route in routes:
                db.execute("""INSERT OR IGNORE INTO security_routes
                    (route_id,event_id,label,route_type,status,acknowledgement_minutes,fallback_label,connector_state,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?)""", (route[0], EVENT_ID, *route[1:], created))
            db.execute("""INSERT OR IGNORE INTO event_controls
                (event_id,mode,slow_mode,new_account_friction,reply_burst_limit,high_risk_language_review,changed_by,change_note,updated_at)
                VALUES (?,'heightened',1,1,6,1,'system','V4.19.0 universal safety defaults',?)""", (EVENT_ID, created))
            if db.execute("SELECT COUNT(*) FROM event_timeline WHERE event_id=?", (EVENT_ID,)).fetchone()[0] == 0:
                seeds = [
                    ("event_mode", "info", "Event Shield entered heightened demo mode", {"source": "configured rehearsal", "liveTraffic": False}),
                    ("campaign", "high", "Cross-thread athlete targeting scenario staged", {"actors": 3, "threads": 4, "status": "simulated"}),
                    ("safeguarding", "critical", "Credible-threat routing drill ready", {"route": "WTA / ATP security coordination", "delivery": "not configured"}),
                ]
                for kind, severity, title, detail in seeds:
                    db.execute("INSERT INTO event_timeline VALUES (?,?,?,?,?,?,NULL,1,?)", (
                        "timeline_" + uuid.uuid4().hex, EVENT_ID, kind, severity, title, json.dumps(detail), created,
                    ))

    def _timeline(self, kind, severity, title, detail, source_id=None, simulated=False):
        with self.lock, self.connect() as db:
            db.execute("INSERT INTO event_timeline VALUES (?,?,?,?,?,?,?,?,?)", (
                "timeline_" + uuid.uuid4().hex, EVENT_ID, kind, severity, title,
                json.dumps(detail, ensure_ascii=False), source_id, 1 if simulated else 0, now_iso(),
            ))

    def after_decision(self, receipt, context, operations, raw_text):
        context = context if isinstance(context, dict) else {}
        operations = operations if isinstance(operations, dict) else {}
        if receipt.get("finalOutcome") == "clean":
            return {"eventId": EVENT_ID, "threatAssessment": None, "protectedTarget": False}
        target_id = receipt.get("targetUserId") or context.get("targetUserId")
        with self.lock, self.connect() as db:
            protected = bool(target_id and db.execute(
                "SELECT 1 FROM protected_people WHERE event_id=? AND user_id=? AND status='active'", (EVENT_ID, target_id),
            ).fetchone())
        severity = "critical" if receipt.get("finalOutcome") == "block" else "high" if receipt.get("finalOutcome") == "review" else "medium"
        self._timeline("moderation", severity, "Safety intervention linked to live event", {
            "receiptId": receipt["receiptId"], "outcome": receipt.get("finalOutcome"),
            "category": receipt.get("category"), "targetUserId": target_id,
            "protectedTarget": protected, "rawContentStored": False,
        }, receipt["receiptId"])
        assessment = None
        if receipt.get("category") in {"targeted_violence", "threat"}:
            assessment = self._assess_threat(receipt, context, operations, raw_text, protected)
        elif operations.get("campaignSignal"):
            campaign = operations["campaignSignal"]
            self._timeline("campaign", campaign.get("severity", "high"), "Campaign signal linked across event traffic", campaign, operations.get("incidentId"))
        return {"eventId": EVENT_ID, "threatAssessment": assessment, "protectedTarget": protected}

    def _assess_threat(self, receipt, context, operations, raw_text, protected):
        normalized = str(raw_text or "").lower()
        temporal = bool(re.search(r"\b(?:today|tonight|now|after (?:the )?match|after (?:the )?final|when you leave|waiting)\b", normalized))
        location = bool(re.search(r"\b(?:hotel|home|house|venue|stadium|car park|parking|locker room|outside|where you live)\b", normalized))
        capability = bool(re.search(r"\b(?:gun|knife|weapon|bomb|shoot|stab|burn|poison)\b", normalized))
        target_id = receipt.get("targetUserId") or context.get("targetUserId")
        with self.lock, self.connect() as db:
            repeats = db.execute("""SELECT COUNT(*) FROM decisions WHERE user_id=? AND target_user_id=?
                AND final_outcome!='clean'""", (receipt["userId"], target_id)).fetchone()[0] if target_id else 0
        score = 45 + (15 if protected else 0) + (12 if temporal else 0) + (14 if location else 0) + (14 if capability else 0) + (10 if repeats >= 3 else 0)
        score = min(score, 100)
        band = "critical" if score >= 80 else "high" if score >= 60 else "elevated"
        imminence = "immediate_or_near_term" if temporal else "unspecified"
        location_label = "specific_or_access-linked" if location else "not_detected"
        capability_label = "weapon_or_method_reference" if capability else "not_detected"
        action = "Immediate safeguarding verification and authorised security routing" if band == "critical" else "Priority credibility review and target protection"
        signals = {
            "explicitViolence": True, "protectedTarget": protected, "temporalProximity": temporal,
            "locationOrAccessKnowledge": location, "capabilityOrMethod": capability,
            "repeatTargeting": repeats >= 3, "priorTargetedInterventions": max(0, repeats - 1),
            "semanticModel": "not_configured", "rawContentPersisted": False,
        }
        assessment_id = "threat_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            db.execute("""INSERT OR REPLACE INTO threat_assessments
                (assessment_id,receipt_id,incident_id,event_id,target_user_id,credibility_score,credibility_band,imminence,location_specificity,capability_signal,repeat_pattern,protected_target,signals_json,recommended_action,version,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                assessment_id, receipt["receiptId"], operations.get("incidentId"), EVENT_ID, target_id,
                score, band, imminence, location_label, capability_label, 1 if repeats >= 3 else 0,
                1 if protected else 0, json.dumps(signals), action, ASSESSMENT_VERSION, now_iso(),
            ))
            if operations.get("partnerNotificationId"):
                route = db.execute("SELECT * FROM security_routes WHERE route_id='route_wta_atp'").fetchone()
                db.execute("""INSERT OR IGNORE INTO partner_deliveries
                    (delivery_id,notification_id,event_id,route_id,state,simulated,ack_due_at,fallback_state,packet_digest,created_at,updated_at)
                    VALUES (?,?,?,'route_wta_atp','pending_human_authorization',0,NULL,'not_started',NULL,?,?)""", (
                    "delivery_" + uuid.uuid4().hex, operations["partnerNotificationId"], EVENT_ID, now_iso(), now_iso(),
                ))
        self._timeline("threat", band, "Threat credibility assessment created", {
            "assessmentId": assessment_id, "score": score, "band": band, "imminence": imminence,
            "protectedTarget": protected, "recommendedAction": action, "rawContentStored": False,
        }, assessment_id)
        return {"assessmentId": assessment_id, "score": score, "band": band, "signals": signals, "recommendedAction": action}

    def on_partner_authorized(self, notification_id, moderator_id):
        with self.lock, self.connect() as db:
            db.execute("""UPDATE partner_deliveries SET state='approved_not_sent',ack_due_at=NULL,
                fallback_state='connector_not_configured',updated_at=? WHERE notification_id=?""", (now_iso(), notification_id))
        self._timeline("partner_route", "critical", "Partner packet authorised but not sent", {
            "notificationId": notification_id, "authorisedBy": moderator_id,
            "externalMessageSent": False, "reason": "connector not configured",
        }, notification_id)
        return {"notificationId": notification_id, "state": "approved_not_sent", "externalMessageSent": False}

    def update_controls(self, moderator_id, payload):
        mode = str(payload.get("mode") or "")
        if mode not in {"standard", "heightened", "lockdown_demo"}: raise ValueError("Unknown event operating mode.")
        reply_limit = int(payload.get("replyBurstLimit") or 0)
        if reply_limit < 1 or reply_limit > 30: raise ValueError("Reply burst limit must be between 1 and 30.")
        note = str(payload.get("note") or "").strip()
        if len(note) < 12: raise ValueError("An event-control change note is required.")
        values = (
            mode, 1 if payload.get("slowMode") else 0, 1 if payload.get("newAccountFriction") else 0,
            reply_limit, 1 if payload.get("highRiskLanguageReview") else 0, moderator_id, note[:500], now_iso(), EVENT_ID,
        )
        with self.lock, self.connect() as db:
            db.execute("""UPDATE event_controls SET mode=?,slow_mode=?,new_account_friction=?,reply_burst_limit=?,
                high_risk_language_review=?,changed_by=?,change_note=?,updated_at=? WHERE event_id=?""", values)
            db.execute("UPDATE live_events SET operating_mode=?,updated_at=? WHERE event_id=?", (mode, now_iso(), EVENT_ID))
        self._timeline("event_mode", "high" if mode != "standard" else "info", f"Event controls changed to {mode}", {"changedBy": moderator_id, "note": note, "replyBurstLimit": reply_limit})
        return {"eventId": EVENT_ID, "mode": mode, "replyBurstLimit": reply_limit}

    def update_protection(self, moderator_id, user_id, level, notes):
        if level not in {"standard", "heightened", "critical"}: raise ValueError("Unknown protection level.")
        if len(str(notes or "").strip()) < 12: raise ValueError("A protection change note is required.")
        with self.lock, self.connect() as db:
            if not db.execute("SELECT 1 FROM protected_people WHERE event_id=? AND user_id=?", (EVENT_ID, user_id)).fetchone():
                raise ValueError("Protected person does not exist.")
            db.execute("UPDATE protected_people SET monitoring_level=?,updated_at=? WHERE event_id=? AND user_id=?", (level, now_iso(), EVENT_ID, user_id))
        self._timeline("protection", "high", "Protected-person monitoring level changed", {"userId": user_id, "level": level, "changedBy": moderator_id, "notes": str(notes)[:500]})
        return {"userId": user_id, "monitoringLevel": level}

    def run_delivery_drill(self, moderator_id, scenario):
        if scenario not in {"acknowledged", "timeout_fallback"}: raise ValueError("Unknown routing drill scenario.")
        created = datetime.now(timezone.utc)
        if scenario == "acknowledged":
            state, fallback, ack_at = "simulated_acknowledged", "not_required", created.isoformat()
        else:
            state, fallback, ack_at = "simulated_fallback_triggered", "tournament_control_room", None
        delivery_id = "delivery_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO partner_deliveries
                (delivery_id,notification_id,event_id,route_id,state,simulated,ack_due_at,acknowledged_at,acknowledged_by,fallback_state,packet_digest,created_at,updated_at)
                VALUES (?,NULL,?,'route_wta_atp',?,1,?,?,?,?,NULL,?,?)""", (
                delivery_id, EVENT_ID, state, (created + timedelta(minutes=5)).isoformat(), ack_at,
                "simulated WTA/ATP duty officer" if ack_at else None, fallback, created.isoformat(), created.isoformat(),
            ))
        self._timeline("partner_route", "high", "Security-routing acknowledgement drill completed", {
            "scenario": scenario, "state": state, "fallback": fallback, "runBy": moderator_id,
            "externalMessageSent": False,
        }, delivery_id, simulated=True)
        return {"deliveryId": delivery_id, "state": state, "fallbackState": fallback, "externalMessageSent": False, "simulated": True}

    def request_evidence_access(self, moderator_id, incident_id, scope, reason):
        if scope not in {"metadata_only", "restricted_raw_evidence"}: raise ValueError("Unknown evidence scope.")
        reason = str(reason or "").strip()
        if len(reason) < 20: raise ValueError("A specific evidence-access reason is required.")
        status = "pending_second_approver" if scope == "restricted_raw_evidence" else "metadata_granted"
        access_id = "access_" + uuid.uuid4().hex
        expires = (datetime.now(timezone.utc) + timedelta(minutes=30)).isoformat() if status == "metadata_granted" else None
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO evidence_access_requests
                (access_id,incident_id,requested_by,approved_by,scope,reason,status,expires_at,created_at,updated_at)
                VALUES (?,?,?,NULL,?,?,?,?,?,?)""", (access_id, incident_id, moderator_id, scope, reason[:800], status, expires, now_iso(), now_iso()))
        self._timeline("evidence_access", "high", "Restricted evidence access requested", {"accessId": access_id, "scope": scope, "status": status, "requestedBy": moderator_id}, access_id)
        return {"accessId": access_id, "status": status, "twoPersonControl": scope == "restricted_raw_evidence", "rawEvidenceReturned": False}

    def approve_evidence_access(self, moderator_id, access_id):
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM evidence_access_requests WHERE access_id=?", (access_id,)).fetchone()
            if not row: raise ValueError("Evidence access request does not exist.")
            if row["status"] != "pending_second_approver": raise ValueError("Evidence request is not awaiting approval.")
            if row["requested_by"] == moderator_id: raise ValueError("Two-person control requires a different authorised approver.")
            expires = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            db.execute("UPDATE evidence_access_requests SET status='approved_time_limited',approved_by=?,expires_at=?,updated_at=? WHERE access_id=?", (moderator_id, expires, now_iso(), access_id))
        return {"accessId": access_id, "status": "approved_time_limited", "expiresAt": expires, "rawEvidenceReturned": False}

    def run_readiness_drill(self, moderator_id):
        with self.lock, self.connect() as db:
            controls = db.execute("SELECT * FROM event_controls WHERE event_id=?", (EVENT_ID,)).fetchone()
            routes = db.execute("SELECT * FROM security_routes WHERE event_id=?", (EVENT_ID,)).fetchall()
            protected = db.execute("SELECT COUNT(*) FROM protected_people WHERE event_id=? AND status='active'", (EVENT_ID,)).fetchone()[0]
        results = [
            {"check": "event mode configured", "pass": bool(controls)},
            {"check": "protected people enrolled", "pass": protected >= 2},
            {"check": "security routes declare connector state", "pass": all(row["connector_state"] for row in routes)},
            {"check": "no route falsely claims live delivery", "pass": all(row["connector_state"] != "live" for row in routes)},
            {"check": "restricted evidence requires two-person control", "pass": True},
            {"check": "representative field quality remains unclaimed", "pass": True},
        ]
        passed = sum(1 for item in results if item["pass"])
        run_id = "eventrun_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            db.execute("INSERT INTO event_readiness_runs VALUES (?,?,?,?,?,?,?)", (run_id, EVENT_ID, passed, len(results), json.dumps(results), moderator_id, now_iso()))
        return {"runId": run_id, "passed": passed, "total": len(results), "results": results, "fieldQuality": None, "status": "configuration drill only"}

    def summary(self):
        with self.lock, self.connect() as db:
            event = dict(db.execute("SELECT * FROM live_events WHERE event_id=?", (EVENT_ID,)).fetchone())
            controls = dict(db.execute("SELECT * FROM event_controls WHERE event_id=?", (EVENT_ID,)).fetchone())
            routes = [dict(row) for row in db.execute("SELECT * FROM security_routes WHERE event_id=? ORDER BY acknowledgement_minutes", (EVENT_ID,))]
            timeline = [dict(row) for row in db.execute("SELECT * FROM event_timeline WHERE event_id=? ORDER BY created_at DESC LIMIT 80", (EVENT_ID,))]
            threats = [dict(row) for row in db.execute("SELECT * FROM threat_assessments WHERE event_id=? ORDER BY created_at DESC LIMIT 40", (EVENT_ID,))]
            deliveries = [dict(row) for row in db.execute("SELECT * FROM partner_deliveries WHERE event_id=? ORDER BY created_at DESC LIMIT 40", (EVENT_ID,))]
            access = [dict(row) for row in db.execute("SELECT * FROM evidence_access_requests ORDER BY created_at DESC LIMIT 40")]
            people = [dict(row) for row in db.execute("SELECT * FROM protected_people WHERE event_id=? ORDER BY is_minor DESC,display_label", (EVENT_ID,))]
            latest_run = db.execute("SELECT * FROM event_readiness_runs WHERE event_id=? ORDER BY created_at DESC LIMIT 1", (EVENT_ID,)).fetchone()
            for person in people:
                person["interventions"] = db.execute("SELECT COUNT(*) FROM moderation_cases WHERE target_user_id=?", (person["user_id"],)).fetchone()[0]
                person["open_incidents"] = db.execute("""SELECT COUNT(*) FROM safeguarding_incidents i JOIN moderation_cases c ON c.case_id=i.case_id
                    WHERE c.target_user_id=? AND i.status!='closed'""", (person["user_id"],)).fetchone()[0]
        for item in timeline: item["detail"] = json.loads(item.pop("detail_json"))
        for item in threats: item["signals"] = json.loads(item.pop("signals_json"))
        for item in people: item["channels"] = json.loads(item.pop("channels_json"))
        readiness = None
        if latest_run:
            readiness = {**dict(latest_run), "results": json.loads(latest_run["results_json"])}
            readiness.pop("results_json", None)
        stats = {
            "protectedPeople": len(people),
            "openCritical": sum(1 for item in timeline if item["severity"] == "critical" and not item["simulated"]),
            "threatAssessments": len(threats),
            "campaignSignals": sum(1 for item in timeline if item["entry_type"] == "campaign" and not item["simulated"]),
            "pendingRouteActions": sum(1 for item in deliveries if item["state"] in {"pending_human_authorization", "approved_not_sent"} and not item["simulated"]),
        }
        return {
            "event": event, "controls": controls, "stats": stats, "protectedPeople": people,
            "timeline": timeline, "threatAssessments": threats, "securityRoutes": routes,
            "deliveries": deliveries, "evidenceAccess": access, "readiness": readiness,
            "boundaries": {
                "event": "The configured event and initial timeline scenarios are explicitly simulated for a local product demonstration.",
                "coverage": "Only K1ND server traffic is live; social-network and governing-body ingestion adapters are not configured.",
                "delivery": "No external security message can be sent from this build. Route drills are labelled simulated.",
                "evidence": "Restricted raw evidence requires a KMS-backed vault and two-person access; this preview returns no raw content.",
                "quality": "Configuration drills are not representative precision, recall or real safeguarding effectiveness.",
            },
        }
