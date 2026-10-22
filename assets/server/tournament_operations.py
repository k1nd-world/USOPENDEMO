import json
import importlib.util
import platform
import sqlite3
import uuid
from pathlib import Path

from evidence_store import now_iso


TOURNAMENT_ID = "k1nd_new_york_major_demo"
TOURNAMENT_VERSION = "tournament-operations-4.24.1"


class TournamentOperations:
    """Server-owned multi-court demonstration command layer.

    The Arena remains the moderation and delivery authority. This layer joins
    its isolated courts into operational views, incident workflow, athlete
    continuity and privacy-safe reports. It never sends an external message.
    """

    def __init__(self, evidence, arena, startup_gate, root):
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self.arena = arena
        self.startup_gate = startup_gate
        self.root = Path(root)
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
                CREATE TABLE IF NOT EXISTS tournament_program (
                    tournament_id TEXT PRIMARY KEY, status TEXT NOT NULL,
                    mode TEXT NOT NULL, revision INTEGER NOT NULL,
                    launched_at TEXT, updated_by TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tournament_match_state (
                    arena_id TEXT PRIMARY KEY, match_status TEXT NOT NULL,
                    athlete_phase TEXT NOT NULL, protection_level TEXT NOT NULL,
                    assigned_lead TEXT NOT NULL, updated_by TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS tournament_incidents (
                    incident_id TEXT PRIMARY KEY, arena_id TEXT NOT NULL,
                    severity TEXT NOT NULL, category TEXT NOT NULL,
                    status TEXT NOT NULL, owner TEXT NOT NULL,
                    target_label TEXT NOT NULL, evidence_digest TEXT NOT NULL,
                    route_state TEXT NOT NULL, external_sent INTEGER NOT NULL,
                    note TEXT NOT NULL, opened_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_tournament_incident_status
                    ON tournament_incidents(status,severity);
                CREATE TABLE IF NOT EXISTS tournament_actions (
                    action_id TEXT PRIMARY KEY, action_type TEXT NOT NULL,
                    arena_id TEXT, incident_id TEXT, actor_id TEXT NOT NULL,
                    detail_json TEXT NOT NULL, external_sent INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_tournament_actions_created
                    ON tournament_actions(created_at DESC);
            """)
            db.execute("""INSERT OR IGNORE INTO tournament_program
                (tournament_id,status,mode,revision,launched_at,updated_by,updated_at)
                VALUES (?,'ready','major_demo',1,NULL,'system',?)""", (TOURNAMENT_ID, created))
            for index, arena in enumerate(self.arena.definitions()):
                level = "critical" if arena["targetUserId"] == "u_u18" else "heightened"
                db.execute("""INSERT OR IGNORE INTO tournament_match_state
                    (arena_id,match_status,athlete_phase,protection_level,assigned_lead,updated_by,updated_at)
                    VALUES (?,'scheduled','pre_match',?,?, 'system',?)""", (
                        arena["id"], level, f"Safety lead {index + 1}", created,
                    ))

    def _record_action(self, db, action_type, actor_id, detail, arena_id=None, incident_id=None):
        db.execute("""INSERT INTO tournament_actions
            (action_id,action_type,arena_id,incident_id,actor_id,detail_json,external_sent,created_at)
            VALUES (?,?,?,?,?,?,0,?)""", (
                "tour_action_" + uuid.uuid4().hex, action_type, arena_id, incident_id,
                actor_id, json.dumps(detail, ensure_ascii=False), now_iso(),
            ))

    def _bump(self, db, actor_id, status=None):
        if status:
            db.execute("""UPDATE tournament_program SET status=?,revision=revision+1,
                updated_by=?,updated_at=? WHERE tournament_id=?""",
                (status, actor_id, now_iso(), TOURNAMENT_ID))
        else:
            db.execute("""UPDATE tournament_program SET revision=revision+1,
                updated_by=?,updated_at=? WHERE tournament_id=?""",
                (actor_id, now_iso(), TOURNAMENT_ID))

    def launch(self, moderator_id):
        profiles = {
            "arena_k1nd_centre_court": ("heightened", False),
            "arena_k1nd_armstrong": ("balanced", False),
            "arena_k1nd_grandstand": ("maximum", True),
            "arena_k1nd_court_17": ("heightened", True),
        }
        for arena in self.arena.definitions():
            arena_id = arena["id"]
            self.arena.reset(moderator_id, arena_id)
            self.arena.run_rehearsal(moderator_id, arena_id)
            shield, slow = profiles[arena_id]
            self.arena.update_controls(moderator_id, {
                "arenaId": arena_id, "status": "open", "shieldLevel": shield,
                "digestMode": "quiet", "repliesMode": "all_verified", "slowMode": slow,
            })

        created = now_iso()
        definitions = {item["id"]: item for item in self.arena.definitions()}
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM tournament_incidents")
            db.execute("DELETE FROM tournament_actions")
            for arena_id, definition in definitions.items():
                rows = db.execute("""SELECT category,evidence_digest,outcome FROM arena_messages
                    WHERE arena_id=? AND outcome!='clean' ORDER BY sequence_no""", (arena_id,)).fetchall()
                selected = []
                for row in rows:
                    if row["category"] in {"targeted_violence", "campaign_harassment"}:
                        selected.append(row)
                for row in selected[:2]:
                    severity = "critical" if row["category"] == "targeted_violence" else "high"
                    incident_id = "tour_incident_" + uuid.uuid4().hex
                    db.execute("""INSERT INTO tournament_incidents
                        (incident_id,arena_id,severity,category,status,owner,target_label,
                         evidence_digest,route_state,external_sent,note,opened_at,updated_at)
                        VALUES (?,?,?,?,?,'Tournament safety',?,?,'awaiting_human_triage',0,?,?,?)""", (
                            incident_id, arena_id, severity, row["category"], "open",
                            definition["player"], row["evidence_digest"],
                            "Created from redacted Arena decision metadata", created, created,
                        ))
                db.execute("""UPDATE tournament_match_state SET match_status='live',
                    athlete_phase='live',updated_by=?,updated_at=? WHERE arena_id=?""",
                    (moderator_id, created, arena_id))
            db.execute("""UPDATE tournament_program SET status='active_demo',mode='major_demo',
                revision=revision+1,launched_at=?,updated_by=?,updated_at=? WHERE tournament_id=?""",
                (created, moderator_id, created, TOURNAMENT_ID))
            self._record_action(db, "major_demo_launched", moderator_id, {
                "courts": len(definitions), "realSafetyEngine": True,
                "externalServicesRequired": False, "externalMessagesSent": 0,
            })
        return self.summary()

    def reset(self, moderator_id):
        for arena in self.arena.definitions():
            self.arena.reset(moderator_id, arena["id"])
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM tournament_incidents")
            db.execute("DELETE FROM tournament_actions")
            db.execute("""UPDATE tournament_match_state SET match_status='scheduled',
                athlete_phase='pre_match',protection_level=CASE
                    WHEN arena_id='arena_k1nd_grandstand' THEN 'critical' ELSE 'heightened' END,
                updated_by=?,updated_at=?""", (moderator_id, now_iso()))
            db.execute("""UPDATE tournament_program SET status='ready',mode='major_demo',
                revision=revision+1,launched_at=NULL,updated_by=?,updated_at=? WHERE tournament_id=?""",
                (moderator_id, now_iso(), TOURNAMENT_ID))
            self._record_action(db, "demo_recovered", moderator_id, {
                "result": "deterministic empty baseline", "externalMessagesSent": 0,
            })
        return self.summary()

    def preflight(self, moderator_id):
        db_ready = False
        try:
            with self.lock, self.connect() as db:
                db_ready = bool(db.execute("SELECT 1").fetchone()[0])
        except sqlite3.Error:
            db_ready = False
        gate = self.startup_gate.get("releaseGate", {})
        qr_ready = (
            platform.system() == "Darwin" and (self.root / "assets/server/qr_code.swift").exists()
        ) or importlib.util.find_spec("qrcode") is not None
        checks = [
            {"id": "server_authority", "label": "Server moderation authority", "status": "ready", "required": True},
            {"id": "severe_gate", "label": "Severe-evasion release gate", "status": "ready" if gate.get("releaseAllowed") else "blocked", "required": True},
            {"id": "evidence_store", "label": "Local evidence and incident store", "status": "ready" if db_ready else "blocked", "required": True},
            {"id": "court_isolation", "label": "Four isolated court rooms", "status": "ready", "required": True},
            {"id": "local_qr", "label": "Audience QR generation", "status": "ready" if qr_ready else "warning", "required": False},
            {"id": "offline_assets", "label": "Offline demo assets", "status": "ready", "required": True},
            {"id": "partner_connectors", "label": "WTA / ATP / venue connectors", "status": "not_configured", "required": False},
        ]
        required = [item for item in checks if item["required"]]
        result = {
            "checks": checks, "requiredReady": sum(item["status"] == "ready" for item in required),
            "requiredTotal": len(required), "launchReady": all(item["status"] == "ready" for item in required),
            "externalConnectorClaim": False, "runAt": now_iso(),
        }
        with self.lock, self.connect() as db:
            self._record_action(db, "preflight_run", moderator_id, result)
            self._bump(db, moderator_id)
        return result

    def update_incident(self, moderator_id, incident_id, action, note):
        note = str(note or "").strip()
        if len(note) < 12:
            raise ValueError("A specific incident decision note is required.")
        status_map = {
            "acknowledge": ("acknowledged", "human_review_active"),
            "investigate": ("investigating", "credibility_review"),
            "prepare_escalation": ("escalation_prepared", "awaiting_human_authorization"),
            "resolve": ("resolved", "closed_no_external_delivery"),
        }
        if action not in status_map:
            raise ValueError("Unknown incident action.")
        status, route_state = status_map[action]
        with self.lock, self.connect() as db:
            incident = db.execute("SELECT * FROM tournament_incidents WHERE incident_id=?", (incident_id,)).fetchone()
            if not incident:
                raise ValueError("Tournament incident does not exist.")
            if action == "prepare_escalation" and incident["severity"] not in {"high", "critical"}:
                raise ValueError("Only high or critical incidents can prepare an escalation packet.")
            db.execute("""UPDATE tournament_incidents SET status=?,route_state=?,owner=?,note=?,
                updated_at=? WHERE incident_id=?""", (
                    status, route_state, moderator_id, note[:500], now_iso(), incident_id,
                ))
            self._record_action(db, action, moderator_id, {
                "note": note[:500], "rawContentIncluded": False, "externalMessageSent": False,
            }, incident["arena_id"], incident_id)
            self._bump(db, moderator_id)
        return {"incidentId": incident_id, "status": status, "routeState": route_state,
                "externalMessageSent": False, "auditRecorded": True}

    def authorize_escalation(self, moderator_id, incident_id, note):
        note = str(note or "").strip()
        if len(note) < 12:
            raise ValueError("An authorisation reason is required.")
        with self.lock, self.connect() as db:
            incident = db.execute("SELECT * FROM tournament_incidents WHERE incident_id=?", (incident_id,)).fetchone()
            if not incident:
                raise ValueError("Tournament incident does not exist.")
            if incident["status"] != "escalation_prepared":
                raise ValueError("Prepare a redacted escalation packet before authorising it.")
            db.execute("""UPDATE tournament_incidents SET status='authorised_not_sent',
                route_state='connector_not_configured',owner=?,note=?,external_sent=0,updated_at=?
                WHERE incident_id=?""", (moderator_id, note[:500], now_iso(), incident_id))
            self._record_action(db, "human_authorisation", moderator_id, {
                "note": note[:500], "route": "tournament / governing-body security",
                "connectorState": "not_configured", "externalMessageSent": False,
            }, incident["arena_id"], incident_id)
            self._bump(db, moderator_id)
        return {"incidentId": incident_id, "status": "authorised_not_sent",
                "routeState": "connector_not_configured", "externalMessageSent": False,
                "humanAuthorised": True, "auditRecorded": True}

    def update_athlete_phase(self, moderator_id, arena_id, phase):
        phases = {"pre_match", "live", "recovery", "off_duty"}
        if arena_id not in {item["id"] for item in self.arena.definitions()}:
            raise ValueError("Tournament match does not exist.")
        if phase not in phases:
            raise ValueError("Unknown athlete protection phase.")
        match_status = "live" if phase == "live" else "complete" if phase in {"recovery", "off_duty"} else "scheduled"
        with self.lock, self.connect() as db:
            db.execute("""UPDATE tournament_match_state SET match_status=?,athlete_phase=?,
                updated_by=?,updated_at=? WHERE arena_id=?""",
                (match_status, phase, moderator_id, now_iso(), arena_id))
            self._record_action(db, "athlete_phase_changed", moderator_id, {
                "phase": phase, "shieldFollowsAthlete": phase != "off_duty",
                "automaticSanction": False,
            }, arena_id)
            self._bump(db, moderator_id)
        return {"arenaId": arena_id, "phase": phase, "matchStatus": match_status,
                "shieldFollowsAthlete": phase != "off_duty", "auditRecorded": True}

    def report(self, arena_id):
        definition = self.arena.definition(arena_id)
        arena = self.arena.summary("presenter", arena_id=arena_id)
        with self.lock, self.connect() as db:
            incidents = [dict(row) for row in db.execute("""SELECT severity,category,status,route_state,
                external_sent,opened_at,updated_at FROM tournament_incidents WHERE arena_id=?
                ORDER BY opened_at""", (arena_id,))]
        counts = arena["counters"]
        return {
            "version": TOURNAMENT_VERSION, "generatedAt": now_iso(),
            "match": arena["event"], "athlete": definition["player"],
            "conversation": {
                "received": counts["received"], "delivered": counts["delivered"],
                "withheld": counts["withheld"], "deliveryRate": round(100 * counts["delivered"] / max(1, counts["received"])),
                "rewriteRecoveries": sum(item["sourceKind"] == "accepted_rewrite" and item["deliveredToAthlete"] for item in arena["messageLedger"]),
                "averageLocalLatencyMs": arena["latency"]["averageMs"],
            },
            "interventionCategories": arena["shieldDigest"]["categories"],
            "incidents": incidents,
            "assurance": {
                "rawHostileContentIncluded": False, "externalMessagesSent": 0,
                "automaticSanctions": False, "productionEffectivenessClaim": False,
                "statement": "This report describes the local demonstration traffic for this match only.",
            },
        }

    def summary(self):
        definitions = self.arena.definitions()
        arenas = [self.arena.summary("presenter", arena_id=item["id"]) for item in definitions]
        with self.lock, self.connect() as db:
            program = dict(db.execute("SELECT * FROM tournament_program WHERE tournament_id=?", (TOURNAMENT_ID,)).fetchone())
            states = {row["arena_id"]: dict(row) for row in db.execute("SELECT * FROM tournament_match_state")}
            incidents = [dict(row) for row in db.execute("""SELECT * FROM tournament_incidents
                ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END, opened_at DESC""")]
            actions = [dict(row) for row in db.execute("""SELECT action_type,arena_id,incident_id,actor_id,
                detail_json,external_sent,created_at FROM tournament_actions ORDER BY created_at DESC LIMIT 18""")]
        courts = []
        for definition, arena in zip(definitions, arenas):
            match_state = states[definition["id"]]
            courts.append({
                "arenaId": definition["id"], "roomCode": definition["code"],
                "joinPath": f"/arena?room={definition['code']}",
                "athletePath": f"/arena-athlete?room={definition['code']}",
                "controlPath": f"/arena-control?room={definition['code']}",
                "court": definition["court"], "round": definition["round"],
                "athlete": definition["player"], "opponent": definition["opponent"],
                "score": definition["sets"], "accent": definition["accent"],
                "matchStatus": match_state["match_status"], "athletePhase": match_state["athlete_phase"],
                "protectionLevel": match_state["protection_level"], "assignedLead": match_state["assigned_lead"],
                "state": arena["state"], "counters": arena["counters"], "crowd": arena["crowd"],
                "latency": arena["latency"], "incidentCount": sum(item["arena_id"] == definition["id"] and item["status"] != "resolved" for item in incidents),
            })
        total_received = sum(item["counters"]["received"] for item in courts)
        total_delivered = sum(item["counters"]["delivered"] for item in courts)
        total_withheld = sum(item["counters"]["withheld"] for item in courts)
        timeline = []
        for item in actions:
            detail = json.loads(item.pop("detail_json"))
            timeline.append({**item, "detail": detail})
        return {
            "version": TOURNAMENT_VERSION,
            "tournament": {
                "id": TOURNAMENT_ID, "name": "K1ND MVP v10/2026",
                "venue": "New York tournament demonstration environment",
                "status": program["status"], "mode": program["mode"],
                "revision": program["revision"], "launchedAt": program["launched_at"],
                "independentDemo": True,
            },
            "courts": courts,
            "incidentDesk": incidents,
            "athleteContinuity": [{
                "arenaId": item["arenaId"], "athlete": item["athlete"], "court": item["court"],
                "phase": item["athletePhase"], "protectionLevel": item["protectionLevel"],
                "shieldActive": item["athletePhase"] != "off_duty", "assignedLead": item["assignedLead"],
            } for item in courts],
            "exposureComparison": {
                "sameTraffic": True, "messagesReceived": total_received,
                "withoutK1NDDirectExposure": total_received,
                "withK1NDAthleteDelivery": total_delivered,
                "interceptedBeforeAthlete": total_withheld,
                "claimType": "local counterfactual replay, not a production effectiveness or wellbeing claim",
            },
            "totals": {
                "courts": len(courts), "received": total_received, "delivered": total_delivered,
                "withheld": total_withheld, "openIncidents": sum(item["status"] != "resolved" for item in incidents),
                "criticalIncidents": sum(item["severity"] == "critical" and item["status"] != "resolved" for item in incidents),
                "externalMessagesSent": sum(int(item["external_sent"]) for item in incidents),
            },
            "routes": [
                {"id": "tournament_security", "label": "Tournament security control room", "state": "not_configured", "humanAuthorizationRequired": True},
                {"id": "governing_body", "label": "WTA / ATP security coordination", "state": "not_configured", "humanAuthorizationRequired": True},
                {"id": "emergency_protocol", "label": "Emergency-services protocol", "state": "jurisdiction_protocol_required", "humanAuthorizationRequired": True},
            ],
            "storyFlow": [
                "Fan message", "Contextual decision", "Accurate rewrite when appropriate",
                "Protected athlete delivery", "Tournament-wide safety intelligence",
            ],
            "timeline": timeline,
            "boundaries": {
                "traffic": "Rehearsal traffic is simulated; live fan entries use the active server moderation engine.",
                "privacy": "Incident and report views contain category metadata and evidence digests, never hostile originals.",
                "external": "No WTA, ATP, venue-security or emergency-service connector is configured; authorisation remains local and sends nothing.",
                "partnership": "This is an independent K1ND demonstration and does not claim endorsement or deployment by a tournament or governing body.",
            },
        }
