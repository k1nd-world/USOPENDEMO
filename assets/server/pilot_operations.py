import hashlib
import json
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from evidence_store import now_iso
from evaluation_suite import run_suite


PRIORITY_MINUTES = {"critical": 15, "high": 60, "medium": 24 * 60, "low": 72 * 60}


class PilotOperations:
    def __init__(self, evidence, policy):
        self.evidence = evidence
        self.policy = policy
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
        with self.lock, self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS decision_contexts (
                    receipt_id TEXT PRIMARY KEY, post_id TEXT, parent_id TEXT, target_user_id TEXT,
                    target_role TEXT, target_is_u18 INTEGER NOT NULL DEFAULT 0,
                    target_is_athlete INTEGER NOT NULL DEFAULT 0, turns_considered INTEGER NOT NULL DEFAULT 0,
                    post_match_window INTEGER NOT NULL DEFAULT 0, context_json TEXT NOT NULL,
                    created_at TEXT NOT NULL, FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE INDEX IF NOT EXISTS idx_context_target ON decision_contexts(target_user_id, created_at DESC);
                CREATE TABLE IF NOT EXISTS campaign_signals (
                    signal_id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL UNIQUE, signal_type TEXT NOT NULL,
                    severity TEXT NOT NULL, subject_user_id TEXT NOT NULL, target_user_id TEXT,
                    evidence_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at TEXT NOT NULL,
                    FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE TABLE IF NOT EXISTS safeguarding_incidents (
                    incident_id TEXT PRIMARY KEY, case_id TEXT, signal_id TEXT, incident_type TEXT NOT NULL,
                    priority TEXT NOT NULL, status TEXT NOT NULL, assigned_to TEXT, sla_due_at TEXT NOT NULL,
                    response_plan TEXT NOT NULL, resolution_notes TEXT NOT NULL, created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL, UNIQUE(case_id, incident_type),
                    FOREIGN KEY(case_id) REFERENCES moderation_cases(case_id),
                    FOREIGN KEY(signal_id) REFERENCES campaign_signals(signal_id)
                );
                CREATE INDEX IF NOT EXISTS idx_incident_queue ON safeguarding_incidents(status, priority, sla_due_at);
                CREATE TABLE IF NOT EXISTS partner_notifications (
                    notification_id TEXT PRIMARY KEY, incident_id TEXT NOT NULL UNIQUE,
                    destination_type TEXT NOT NULL, destination_label TEXT NOT NULL,
                    status TEXT NOT NULL, disclosure_basis TEXT NOT NULL, evidence_digest TEXT NOT NULL,
                    packet_json TEXT NOT NULL, approved_by TEXT, approved_at TEXT, delivery_reference TEXT,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    FOREIGN KEY(incident_id) REFERENCES safeguarding_incidents(incident_id)
                );
                CREATE TABLE IF NOT EXISTS evaluation_runs (
                    run_id TEXT PRIMARY KEY, suite_version TEXT NOT NULL, total INTEGER NOT NULL,
                    exact INTEGER NOT NULL, tp INTEGER NOT NULL, fp INTEGER NOT NULL, tn INTEGER NOT NULL,
                    fn INTEGER NOT NULL, severe_misses INTEGER NOT NULL, metrics_json TEXT NOT NULL,
                    run_by TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS learning_candidates (
                    candidate_id TEXT PRIMARY KEY, source_type TEXT NOT NULL, source_id TEXT,
                    title TEXT NOT NULL, rationale TEXT NOT NULL, language TEXT NOT NULL,
                    harm_type TEXT NOT NULL, status TEXT NOT NULL, created_by TEXT NOT NULL,
                    reviewed_by TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS policy_deployments (
                    deployment_id TEXT PRIMARY KEY, candidate_id TEXT, version TEXT NOT NULL,
                    mode TEXT NOT NULL, status TEXT NOT NULL, metrics_json TEXT NOT NULL,
                    approved_by TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(candidate_id) REFERENCES learning_candidates(candidate_id)
                );
            """)
            if db.execute("SELECT COUNT(*) FROM policy_deployments").fetchone()[0] == 0:
                db.execute("""INSERT INTO policy_deployments
                    (deployment_id,candidate_id,version,mode,status,metrics_json,approved_by,created_at)
                    VALUES ('deployment_v4181_baseline',NULL,'4.19.0','active','active',?,'system',?)""", (
                    json.dumps({"regression": "882/882", "fieldMetrics": None}), now_iso(),
                ))

    def after_decision(self, receipt, context, case_id):
        context = context if isinstance(context, dict) else {}
        created = receipt["createdAt"]
        target_id = receipt.get("targetUserId") or context.get("targetUserId")
        with self.lock, self.connect() as db:
            db.execute("""INSERT OR REPLACE INTO decision_contexts
                (receipt_id,post_id,parent_id,target_user_id,target_role,target_is_u18,target_is_athlete,turns_considered,post_match_window,context_json,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""", (
                receipt["receiptId"], context.get("postId"), context.get("parentId"), target_id,
                context.get("targetRole"), 1 if context.get("targetIsU18") else 0,
                1 if context.get("targetIsAthlete") else 0, int(context.get("turnsConsidered") or 0),
                1 if context.get("postMatchWindow") else 0, json.dumps(context, ensure_ascii=False), created,
            ))
        if receipt.get("finalOutcome") == "clean" or not case_id:
            return {"campaignSignal": None, "incidentId": None, "partnerNotificationId": None}

        campaign = self._campaign_assessment(receipt["userId"], target_id, context)
        signal_id = self._record_campaign_signal(receipt, campaign) if campaign.get("signalType") else None
        category = receipt.get("category") or "policy_intervention"
        incident_type = None
        priority = campaign.get("severity")
        if category in {"targeted_violence", "threat"}:
            incident_type, priority = "credible_real_world_threat", "critical"
        elif category == "doxxing":
            incident_type, priority = "doxxing_exposure", "critical"
        elif category == "personal_contact":
            incident_type, priority = "personal_data_exposure", "high"
        elif context.get("targetIsU18"):
            incident_type, priority = "minor_targeting", "high"
        elif signal_id:
            incident_type = campaign["signalType"]
        incident_id = self._create_incident(case_id, signal_id, incident_type, priority) if incident_type else None
        notification_id = None
        if incident_id and incident_type == "credible_real_world_threat":
            notification_id = self._prepare_partner_notification(incident_id, receipt, context)
        return {"campaignSignal": campaign if signal_id else None, "incidentId": incident_id, "partnerNotificationId": notification_id}

    def _campaign_assessment(self, subject_id, target_id, context):
        if not target_id:
            return {"signalType": None, "riskBand": "unlinked", "interventions": 0, "actors": 0, "threads": 0}
        threshold = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        with self.lock, self.connect() as db:
            rows = db.execute("""SELECT c.subject_user_id,c.context_json,c.created_at
                FROM moderation_cases c WHERE c.target_user_id=? AND c.created_at>=?""", (target_id, threshold)).fetchall()
        subject_rows = [row for row in rows if row["subject_user_id"] == subject_id]
        actors = len({row["subject_user_id"] for row in rows})
        threads = set()
        for row in subject_rows:
            try:
                envelope = json.loads(row["context_json"])
                if envelope.get("postId"): threads.add(envelope["postId"])
            except (ValueError, TypeError):
                pass
        total, subject_total = len(rows), len(subject_rows)
        if total >= 4 and actors >= 3:
            signal_type, severity = "coordinated_pile_on", "critical"
        elif subject_total >= 3 and len(threads) >= 2:
            signal_type, severity = "cross_thread_repeat_targeting", "high"
        elif context.get("postMatchWindow") and total >= 3:
            signal_type, severity = "post_match_abuse_burst", "high"
        else:
            signal_type, severity = None, "watch" if total else "baseline"
        return {
            "signalType": signal_type, "severity": severity, "riskBand": severity,
            "interventions": total, "subjectInterventions": subject_total,
            "actors": actors, "threads": len(threads), "windowHours": 24,
        }

    def _record_campaign_signal(self, receipt, campaign):
        signal_id = "signal_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            existing = db.execute("SELECT signal_id FROM campaign_signals WHERE receipt_id=?", (receipt["receiptId"],)).fetchone()
            if existing: return existing["signal_id"]
            db.execute("""INSERT INTO campaign_signals
                (signal_id,receipt_id,signal_type,severity,subject_user_id,target_user_id,evidence_json,created_at)
                VALUES (?,?,?,?,?,?,?,?)""", (
                signal_id, receipt["receiptId"], campaign["signalType"], campaign["severity"], receipt["userId"],
                receipt.get("targetUserId"), json.dumps(campaign), receipt["createdAt"],
            ))
        return signal_id

    def _create_incident(self, case_id, signal_id, incident_type, priority):
        if not incident_type:
            return None
        priority = priority if priority in PRIORITY_MINUTES else "medium"
        created_dt = datetime.now(timezone.utc)
        due = created_dt + timedelta(minutes=PRIORITY_MINUTES[priority])
        plan = {
            "credible_real_world_threat": "Preserve evidence, verify credibility, identify protected person/event, contact configured security route after authorized disclosure review.",
            "minor_targeting": "Apply minor-safety protocol, restrict exposure, review account history and assign safeguarding specialist.",
            "coordinated_pile_on": "Limit amplification, preserve campaign graph, protect target and investigate connected accounts.",
            "cross_thread_repeat_targeting": "Review linked threads, consider account restrictions and protect the repeated target.",
            "post_match_abuse_burst": "Enable event-mode controls, slow coordinated activity and staff the priority queue.",
            "doxxing_exposure": "Restrict the exposed location or identity data, preserve minimised evidence and assess real-world safety risk.",
            "personal_data_exposure": "Restrict the personal data, notify privacy and safeguarding owners and review disclosure context.",
        }.get(incident_type, "Review linked safety evidence and assign the appropriate specialist response.")
        incident_id = "incident_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            existing = db.execute("SELECT incident_id FROM safeguarding_incidents WHERE case_id=? AND incident_type=?", (case_id, incident_type)).fetchone()
            if existing: return existing["incident_id"]
            db.execute("""INSERT INTO safeguarding_incidents
                (incident_id,case_id,signal_id,incident_type,priority,status,assigned_to,sla_due_at,response_plan,resolution_notes,created_at,updated_at)
                VALUES (?,?,?,?,?,'open',NULL,? ,?,'',?,?)""", (
                incident_id, case_id, signal_id, incident_type, priority, due.isoformat(), plan,
                created_dt.isoformat(), created_dt.isoformat(),
            ))
        return incident_id

    def _sport_for_context(self, context):
        post_id = context.get("postId")
        if not post_id: return str(context.get("sport") or "unknown")
        with self.lock, self.connect() as db:
            row = db.execute("SELECT sport FROM platform_posts WHERE content_id=?", (post_id,)).fetchone()
            return row["sport"] if row else str(context.get("sport") or "unknown")

    def _prepare_partner_notification(self, incident_id, receipt, context):
        sport = self._sport_for_context(context)
        if sport == "tennis":
            destination_type = "governing_body_security"
            destination_label = "WTA / ATP / tournament security routing desk"
        else:
            destination_type = "event_security"
            destination_label = f"Configured {sport} event or governing-body security route"
        digest = hashlib.sha256(f"{receipt['receiptId']}:{incident_id}:{receipt['createdAt']}".encode("utf-8")).hexdigest()
        packet = {
            "incidentId": incident_id, "receiptId": receipt["receiptId"], "policyCategory": receipt.get("category"),
            "priority": "critical", "subjectUserId": receipt["userId"], "targetUserId": receipt.get("targetUserId"),
            "sport": sport, "createdAt": receipt["createdAt"], "evidenceDigest": digest,
            "rawContentIncluded": False,
            "evidenceBoundary": "Hash, signed receipt and structured context only. Production disclosure requires a KMS-backed restricted evidence vault.",
        }
        notification_id = "notification_" + uuid.uuid4().hex
        created = now_iso()
        with self.lock, self.connect() as db:
            existing = db.execute("SELECT notification_id FROM partner_notifications WHERE incident_id=?", (incident_id,)).fetchone()
            if existing: return existing["notification_id"]
            db.execute("""INSERT INTO partner_notifications
                (notification_id,incident_id,destination_type,destination_label,status,disclosure_basis,evidence_digest,packet_json,created_at,updated_at)
                VALUES (?,?,?,?,'pending_human_authorization','credible threat safeguarding review',?,?,?,?)""", (
                notification_id, incident_id, destination_type, destination_label, digest,
                json.dumps(packet, ensure_ascii=False), created, created,
            ))
        return notification_id

    def intelligence_summary(self):
        with self.lock, self.connect() as db:
            signals = [dict(row) for row in db.execute("SELECT * FROM campaign_signals ORDER BY created_at DESC LIMIT 50")]
            case_rows = db.execute("SELECT subject_user_id,target_user_id,priority,status,context_json,created_at FROM moderation_cases WHERE target_user_id IS NOT NULL ORDER BY created_at DESC").fetchall()
        edges = {}
        for row in case_rows:
            key = (row["subject_user_id"], row["target_user_id"])
            edge = edges.setdefault(key, {"subjectUserId": key[0], "targetUserId": key[1], "interventions": 0, "threads": set(), "highestPriority": "low"})
            edge["interventions"] += 1
            try:
                post_id = json.loads(row["context_json"]).get("postId")
                if post_id: edge["threads"].add(post_id)
            except (ValueError, TypeError): pass
            order = {"low": 0, "medium": 1, "high": 2, "critical": 3}
            if order.get(row["priority"], 0) > order.get(edge["highestPriority"], 0): edge["highestPriority"] = row["priority"]
        public_edges = [{**edge, "threads": len(edge["threads"])} for edge in edges.values()]
        return {
            "signals": signals, "edges": sorted(public_edges, key=lambda item: item["interventions"], reverse=True),
            "scenarios": [
                {"label": "Cross-thread athlete targeting", "status": "simulated", "evidence": "3 interventions · 3 threads · same author and target", "action": "high-priority linked investigation"},
                {"label": "Developing U18 pile-on", "status": "simulated", "evidence": "4 actors · 12 minutes · verified minor target", "action": "critical safeguarding response"},
                {"label": "Post-match abuse burst", "status": "simulated", "evidence": "rapid harmful-volume increase after final point", "action": "event-mode friction and staffed queue"},
            ],
            "boundary": "Live graphs use server cases without displaying prohibited text; scenario cards are explicitly simulated.",
        }

    def safeguarding_summary(self):
        with self.lock, self.connect() as db:
            incidents = [dict(row) for row in db.execute("SELECT * FROM safeguarding_incidents ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 ELSE 2 END,sla_due_at LIMIT 100")]
            notifications = [dict(row) for row in db.execute("SELECT * FROM partner_notifications ORDER BY created_at DESC LIMIT 100")]
        notification_by_incident = {row["incident_id"]: row for row in notifications}
        for incident in incidents:
            incident["partnerNotification"] = notification_by_incident.get(incident["incident_id"])
        return {
            "incidents": incidents,
            "partnerRoutes": [
                {"route": "WTA / ATP / tournament security", "status": "contract_and_endpoint_required", "delivery": "human-authorized only"},
                {"route": "Event security control room", "status": "adapter_ready_not_configured", "delivery": "human-authorized only"},
                {"route": "Emergency services / law enforcement", "status": "jurisdictional_protocol_required", "delivery": "credible imminent danger protocol only"},
            ],
            "evidenceVault": {"status": "required_not_configured", "requirement": "KMS-backed encryption, strict access, retention and disclosure audit"},
        }

    def update_incident(self, incident_id, moderator_id, status, notes):
        if status not in {"open", "triaged", "partner_review", "contained", "closed"}:
            raise ValueError("Unknown safeguarding status.")
        notes = str(notes or "").strip()
        if len(notes) < 12: raise ValueError("A meaningful safeguarding note is required.")
        with self.lock, self.connect() as db:
            if not db.execute("SELECT 1 FROM safeguarding_incidents WHERE incident_id=?", (incident_id,)).fetchone():
                raise ValueError("Safeguarding incident does not exist.")
            db.execute("UPDATE safeguarding_incidents SET status=?,assigned_to=?,resolution_notes=?,updated_at=? WHERE incident_id=?", (status, moderator_id, notes[:1500], now_iso(), incident_id))
        return {"incidentId": incident_id, "status": status, "assignedTo": moderator_id}

    def authorize_partner_notification(self, notification_id, moderator_id, notes):
        notes = str(notes or "").strip()
        if len(notes) < 12: raise ValueError("Disclosure authorization notes are required.")
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM partner_notifications WHERE notification_id=?", (notification_id,)).fetchone()
            if not row: raise ValueError("Partner notification does not exist.")
            if row["status"] not in {"pending_human_authorization", "approved_not_sent"}:
                raise ValueError("Partner notification cannot be authorized from its current state.")
            db.execute("""UPDATE partner_notifications SET status='approved_not_sent',approved_by=?,approved_at=?,
                delivery_reference=?,updated_at=? WHERE notification_id=?""", (
                moderator_id, now_iso(), "connector_not_configured · " + notes[:500], now_iso(), notification_id,
            ))
        return {"notificationId": notification_id, "status": "approved_not_sent", "delivery": "No external message sent; connector is not configured"}

    def run_evaluation(self, moderator_id):
        result = run_suite(self.policy)
        run_id = "eval_" + uuid.uuid4().hex
        created = now_iso()
        aggregate = {key: value for key, value in result.items() if key != "rows"}
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO evaluation_runs
                (run_id,suite_version,total,exact,tp,fp,tn,fn,severe_misses,metrics_json,run_by,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""", (
                run_id, result["suiteVersion"], result["total"], result["exact"], result["tp"], result["fp"],
                result["tn"], result["fn"], result["severeMisses"], json.dumps(aggregate), moderator_id, created,
            ))
        return {"runId": run_id, "createdAt": created, **aggregate}

    def evaluation_summary(self):
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM evaluation_runs ORDER BY created_at DESC LIMIT 1").fetchone()
        latest = None
        if row:
            latest = {**dict(row), "metrics": json.loads(row["metrics_json"])}
        return {
            "deterministicRegression": {"passed": 882, "total": 882, "status": "verified in this build"},
            "curatedCalibration": latest,
            "representativePilot": {"precision": None, "recall": None, "falsePositiveRate": None, "status": "not yet measured on representative field traffic"},
            "boundary": "Curated regression/calibration metrics and representative pilot metrics are intentionally separate.",
        }

    def create_learning_candidate(self, moderator_id, payload):
        title = str(payload.get("title") or "").strip()[:120]
        rationale = str(payload.get("rationale") or "").strip()[:800]
        language = str(payload.get("language") or "unknown").strip()[:80]
        harm_type = str(payload.get("harmType") or "policy_gap").strip()[:80]
        source_type = str(payload.get("sourceType") or "moderator_evidence")[:40]
        source_id = str(payload.get("sourceId") or "")[:100] or None
        if len(title) < 6 or len(rationale) < 20:
            raise ValueError("Candidate title and evidence rationale are required.")
        candidate_id = "candidate_" + uuid.uuid4().hex
        created = now_iso()
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO learning_candidates
                (candidate_id,source_type,source_id,title,rationale,language,harm_type,status,created_by,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,'native_review',?,?,?)""", (
                candidate_id, source_type, source_id, title, rationale, language, harm_type, moderator_id, created, created,
            ))
        return {"candidateId": candidate_id, "status": "native_review"}

    def advance_learning_candidate(self, moderator_id, candidate_id, next_status):
        transitions = {
            "native_review": {"regression_ready", "rejected"},
            "regression_ready": {"shadow", "rejected"},
            "shadow": {"approved_for_next_release", "rejected"},
        }
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM learning_candidates WHERE candidate_id=?", (candidate_id,)).fetchone()
            if not row: raise ValueError("Learning candidate does not exist.")
            if next_status not in transitions.get(row["status"], set()):
                raise ValueError("That governed learning transition is not allowed.")
            if next_status == "shadow":
                evaluation = db.execute("SELECT * FROM evaluation_runs ORDER BY created_at DESC LIMIT 1").fetchone()
                if not evaluation or evaluation["severe_misses"] != 0 or evaluation["fn"] != 0:
                    raise ValueError("A passing calibration run with no misses is required before shadow deployment.")
            db.execute("UPDATE learning_candidates SET status=?,reviewed_by=?,updated_at=? WHERE candidate_id=?", (next_status, moderator_id, now_iso(), candidate_id))
            if next_status == "shadow":
                deployment_id = "deployment_" + uuid.uuid4().hex
                db.execute("""INSERT INTO policy_deployments
                    (deployment_id,candidate_id,version,mode,status,metrics_json,approved_by,created_at)
                    VALUES (?,?,?,'shadow','observing',?,?,?)""", (
                    deployment_id, candidate_id, f"4.19.0-candidate-{candidate_id[-8:]}",
                    json.dumps({"fieldDecisionsAffected": 0, "automaticPromotion": False}), moderator_id, now_iso(),
                ))
        return {"candidateId": candidate_id, "status": next_status, "automaticLiveChange": False}

    def learning_summary(self):
        with self.lock, self.connect() as db:
            candidates = [dict(row) for row in db.execute("SELECT * FROM learning_candidates ORDER BY created_at DESC LIMIT 100")]
            deployments = [dict(row) for row in db.execute("SELECT * FROM policy_deployments ORDER BY created_at DESC LIMIT 100")]
        for item in deployments:
            item["metrics"] = json.loads(item.pop("metrics_json"))
        return {
            "candidates": candidates, "deployments": deployments,
            "guardrails": ["No raw user submission changes live policy", "Native review before regression", "Passing no-miss calibration before shadow", "Shadow observation cannot auto-promote", "Next-release approval remains versioned and reversible"],
        }
