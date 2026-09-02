import hashlib
import json
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone

from evidence_store import now_iso


EVENT_ID = "event_k1nd_tennis_major_demo"
TWIN_VERSION = "event-safety-twin-4.20.0"
DEFAULT_SEED = "K1ND-US-OPEN-DEMO-420"


FIXTURES = (
    {"language": "English", "script": "Latin", "text": "What a brilliant shot", "author": "supporter-01", "thread": "match-point", "channel": "comment"},
    {"language": "Swedish", "script": "Latin", "text": "Vilket fantastiskt slag", "author": "supporter-02", "thread": "match-point", "channel": "comment"},
    {"language": "French", "script": "Latin", "text": "Quel point incroyable", "author": "supporter-03", "thread": "match-point", "channel": "comment"},
    {"language": "Japanese", "script": "Han", "text": "素晴らしいショット", "author": "supporter-04", "thread": "match-point", "channel": "comment"},
    {"language": "Hindi transliteration", "script": "Latin", "text": "Kya zabardast shot", "author": "supporter-05", "thread": "match-point", "channel": "comment"},
    {"language": "English", "script": "Latin", "text": "Fuck what a great shot", "author": "supporter-06", "thread": "match-point", "channel": "comment"},
    {"language": "English", "script": "Latin", "text": "That serve was fucking awful", "author": "critic-01", "thread": "set-two", "channel": "comment"},
    {"language": "English", "script": "Latin", "text": "He told me to fuck off", "author": "reporter-01", "thread": "press-room", "channel": "comment"},
    {"language": "Spanish", "script": "Latin", "text": "eres un idiota", "author": "cluster-7a", "thread": "match-point", "channel": "reply", "cluster": "campaign-7"},
    {"language": "French", "script": "Latin", "text": "tu es un idiot", "author": "cluster-7a", "thread": "set-two", "channel": "reply", "cluster": "campaign-7"},
    {"language": "German", "script": "Latin", "text": "du idiot", "author": "cluster-7b", "thread": "post-match", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Portuguese", "script": "Latin", "text": "voce e idiota", "author": "cluster-7b", "thread": "match-point", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Italian", "script": "Latin", "text": "sei un idiota", "author": "cluster-7c", "thread": "set-two", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Turkish", "script": "Latin", "text": "sen aptalsin", "author": "cluster-7c", "thread": "post-match", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Russian", "script": "Cyrillic", "text": "ты идиот", "author": "cluster-7d", "thread": "match-point", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Arabic", "script": "Arabic", "text": "أنت غبي", "author": "cluster-7d", "thread": "post-match", "channel": "reply", "cluster": "campaign-7"},
    {"language": "Czech", "script": "Latin", "text": "ty debil", "author": "hostile-03", "thread": "set-two", "channel": "comment"},
    {"language": "Hindi transliteration", "script": "Latin", "text": "tu madarchod hai", "author": "hostile-04", "thread": "post-match", "channel": "comment"},
    {"language": "English", "script": "Latin", "text": "I will stab you outside the stadium after the match", "author": "risk-09", "thread": "direct-mention", "channel": "mention", "threat": True},
    {"language": "English", "script": "Latin", "text": "killyourself", "author": "risk-10", "thread": "direct-mention", "channel": "mention"},
    {"language": "English", "script": "Latin", "text": "Call me on 07123 456 789", "author": "risk-11", "thread": "direct-mention", "channel": "comment"},
    {"language": "English", "script": "Latin", "text": "you are a nigger", "author": "risk-12", "thread": "image-reply", "channel": "image_ocr", "media": "simulated screenshot OCR"},
    {"language": "Australian English", "script": "Latin", "text": "you are a dickhead", "author": "hostile-05", "thread": "post-match", "channel": "comment"},
    {"language": "Estonian", "script": "Latin", "text": "sa oled idioot", "author": "hostile-06", "thread": "set-two", "channel": "comment"},
)


class EventSafetyTwin:
    def __init__(self, evidence, safety):
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self.safety = safety
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
                CREATE TABLE IF NOT EXISTS safety_twin_controls (
                    event_id TEXT PRIMARY KEY, mode TEXT NOT NULL, slow_mode INTEGER NOT NULL,
                    new_account_friction INTEGER NOT NULL, enhanced_language_review INTEGER NOT NULL,
                    reply_burst_limit INTEGER NOT NULL, updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS safety_twin_runs (
                    run_id TEXT PRIMARY KEY, event_id TEXT NOT NULL, version TEXT NOT NULL,
                    seed TEXT NOT NULL, scenario TEXT NOT NULL, status TEXT NOT NULL,
                    counters_json TEXT NOT NULL, attack_graph_json TEXT NOT NULL,
                    copilot_json TEXT NOT NULL, escalation_json TEXT NOT NULL,
                    created_by TEXT NOT NULL, started_at TEXT NOT NULL, completed_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS safety_twin_messages (
                    message_id TEXT PRIMARY KEY, run_id TEXT NOT NULL, sequence_no INTEGER NOT NULL,
                    author_alias TEXT NOT NULL, target_label TEXT NOT NULL, language TEXT NOT NULL,
                    script TEXT NOT NULL, channel TEXT NOT NULL, thread_label TEXT NOT NULL,
                    safe_preview TEXT NOT NULL, outcome TEXT NOT NULL, category TEXT NOT NULL,
                    mechanism TEXT NOT NULL, speech_act TEXT NOT NULL, target_class TEXT NOT NULL,
                    delivered_to_athlete INTEGER NOT NULL, cluster_id TEXT, media_signal TEXT,
                    evidence_digest TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(run_id) REFERENCES safety_twin_runs(run_id) ON DELETE CASCADE
                );
                CREATE INDEX IF NOT EXISTS idx_twin_messages_run ON safety_twin_messages(run_id,sequence_no);
            """)
            db.execute("""INSERT OR IGNORE INTO safety_twin_controls
                VALUES (?, 'heightened', 1, 1, 1, 6, 'system', ?)""", (EVENT_ID, now_iso()))

    def _controls(self, db):
        row = dict(db.execute("SELECT * FROM safety_twin_controls WHERE event_id=?", (EVENT_ID,)).fetchone())
        return {
            "mode": row["mode"], "slowMode": bool(row["slow_mode"]),
            "newAccountFriction": bool(row["new_account_friction"]),
            "enhancedLanguageReview": bool(row["enhanced_language_review"]),
            "replyBurstLimit": row["reply_burst_limit"], "updatedBy": row["updated_by"],
            "updatedAt": row["updated_at"],
        }

    @staticmethod
    def _safe_preview(text, analysis):
        outcome = analysis["decision"]["outcome"]
        if outcome == "clean":
            return text
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:10]
        family = str(analysis["decision"].get("policyFamily") or analysis["decision"].get("category") or "safety signal")
        return f"[intercepted · {family.replace('_', ' ')} · evidence {digest}]"

    @staticmethod
    def _counter_map(rows):
        counts = {"received": len(rows), "delivered": 0, "intervened": 0, "reviewed": 0, "blocked": 0, "protected": 0, "languages": 0, "scripts": 0}
        for row in rows:
            outcome = row["outcome"]
            if outcome == "clean": counts["delivered"] += 1
            elif outcome == "warning": counts["intervened"] += 1
            elif outcome == "review": counts["reviewed"] += 1
            elif outcome == "block": counts["blocked"] += 1
        counts["protected"] = counts["received"] - counts["delivered"]
        counts["languages"] = len({row["language"] for row in rows})
        counts["scripts"] = len({row["script"] for row in rows})
        return counts

    @staticmethod
    def _attack_graph(rows):
        campaign = [row for row in rows if row.get("cluster_id") == "campaign-7" and row["outcome"] != "clean"]
        authors = sorted({row["author_alias"] for row in campaign})
        languages = sorted({row["language"] for row in campaign})
        threads = sorted({row["thread_label"] for row in campaign})
        nodes = [{"id": "athlete", "label": "Protected athlete", "kind": "target"}]
        nodes.extend({"id": author, "label": author, "kind": "source"} for author in authors)
        edges = []
        for author in authors:
            authored = [row for row in campaign if row["author_alias"] == author]
            edges.append({
                "from": author, "to": "athlete", "interventions": len(authored),
                "languages": sorted({row["language"] for row in authored}),
                "threads": sorted({row["thread_label"] for row in authored}),
            })
        return {
            "status": "coordinated-pattern candidate" if len(campaign) >= 6 else "no campaign candidate",
            "clusterId": "campaign-7", "nodes": nodes, "edges": edges,
            "signals": {"accounts": len(authors), "interventions": len(campaign), "languages": len(languages), "threads": len(threads)},
            "coordinationScore": 87 if len(campaign) >= 6 else 0,
            "scoreMeaning": "explainable routing heuristic, not a probability or attribution finding",
            "humanVerificationRequired": True,
        }

    @staticmethod
    def _copilot(counters, graph, has_threat):
        items = []
        if has_threat:
            items.append({"priority": "critical", "title": "Open human threat review", "reason": "A blocked threat contains venue and timing specificity.", "suggestedAction": "Verify intent, access, location and imminence; prepare the restricted packet.", "actionApplied": False})
        if graph["signals"]["interventions"] >= 6:
            items.append({"priority": "high", "title": "Contain the campaign candidate", "reason": "Multiple accounts targeted one athlete across threads and languages.", "suggestedAction": "Apply thread-level reply friction and review account linkage evidence.", "actionApplied": False})
        if counters["languages"] >= 10:
            items.append({"priority": "medium", "title": "Keep enhanced language review active", "reason": "The stream spans many languages and scripts.", "suggestedAction": "Queue borderline cases for language-qualified human review.", "actionApplied": False})
        return {"mode": "recommendation_only", "automaticEmergencyAction": False, "recommendations": items}

    def run(self, moderator_id, payload):
        scenario = str((payload or {}).get("scenario") or "match_point_surge")
        if scenario not in {"match_point_surge", "post_match_pile_on", "threat_and_campaign"}:
            raise ValueError("Unknown Event Safety Twin scenario.")
        run_id = "twin_" + uuid.uuid4().hex
        started = datetime.now(timezone.utc)
        rows = []
        for index, fixture in enumerate(FIXTURES, start=1):
            context = {
                "targetUserId": "u_athlete", "targetRole": "professional athlete", "targetIsAthlete": True,
                "postMatchWindow": True, "turnsConsidered": 8,
                "cumulativeSignals": 4 if fixture.get("cluster") else 0,
            }
            analysis = self.safety.inspect(fixture["text"], context)
            outcome = analysis["decision"]["outcome"]
            digest = hashlib.sha256(fixture["text"].encode("utf-8")).hexdigest()[:12]
            created = (started + timedelta(seconds=index * 7)).isoformat()
            rows.append({
                "message_id": f"twinmsg_{digest}_{index}", "sequence_no": index,
                "author_alias": fixture["author"], "target_label": "Mara Volkov",
                "language": fixture["language"], "script": fixture["script"], "channel": fixture["channel"],
                "thread_label": fixture["thread"], "safe_preview": self._safe_preview(fixture["text"], analysis),
                "outcome": outcome, "category": analysis["decision"].get("policyFamily") or analysis["decision"].get("category") or "allowed",
                "mechanism": analysis["reasoning"].get("mechanism") or "none detected",
                "speech_act": analysis["reasoning"].get("speechAct") or "general expression",
                "target_class": analysis["reasoning"].get("target", {}).get("class") or "no clear person",
                "delivered_to_athlete": outcome == "clean", "cluster_id": fixture.get("cluster"),
                "media_signal": fixture.get("media"), "evidence_digest": digest, "created_at": created,
            })
        counters = self._counter_map(rows)
        graph = self._attack_graph(rows)
        threat = next((row for row in rows if row["category"] == "targeted_violence" and row["outcome"] == "block"), None)
        escalation = {
            "packetId": "packet_" + uuid.uuid4().hex[:16], "state": "pending_human_authorization" if threat else "not_required",
            "destination": "WTA / ATP security coordination", "connectorState": "not_configured",
            "externalMessageSent": False, "rawEvidenceIncluded": False,
            "evidenceDigest": threat["evidence_digest"] if threat else None,
            "signals": ["violent intent", "venue specificity", "post-match timing", "protected athlete"] if threat else [],
            "requiredHumanChecks": ["intent", "capability", "access", "location", "imminence"],
            "authorizedBy": None, "authorizedAt": None,
        }
        copilot = self._copilot(counters, graph, bool(threat))
        completed = (started + timedelta(seconds=len(rows) * 7)).isoformat()
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO safety_twin_runs
                (run_id,event_id,version,seed,scenario,status,counters_json,attack_graph_json,copilot_json,escalation_json,created_by,started_at,completed_at)
                VALUES (?,?,?,?,?,'complete',?,?,?,?,?,?,?)""", (
                run_id, EVENT_ID, TWIN_VERSION, DEFAULT_SEED, scenario, json.dumps(counters), json.dumps(graph),
                json.dumps(copilot), json.dumps(escalation), moderator_id, started.isoformat(), completed,
            ))
            db.executemany("""INSERT INTO safety_twin_messages
                (message_id,run_id,sequence_no,author_alias,target_label,language,script,channel,thread_label,safe_preview,outcome,category,mechanism,speech_act,target_class,delivered_to_athlete,cluster_id,media_signal,evidence_digest,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", [(
                row["message_id"], run_id, row["sequence_no"], row["author_alias"], row["target_label"], row["language"],
                row["script"], row["channel"], row["thread_label"], row["safe_preview"], row["outcome"], row["category"],
                row["mechanism"], row["speech_act"], row["target_class"], int(row["delivered_to_athlete"]), row["cluster_id"],
                row["media_signal"], row["evidence_digest"], row["created_at"],
            ) for row in rows])
        return self.summary()

    def update_controls(self, moderator_id, payload):
        payload = payload or {}
        mode = str(payload.get("mode") or "")
        if mode not in {"standard", "heightened", "lockdown_demo"}:
            raise ValueError("Mode must be standard, heightened or lockdown_demo.")
        limit = int(payload.get("replyBurstLimit") or 0)
        if not 1 <= limit <= 30:
            raise ValueError("Reply burst limit must be between 1 and 30.")
        with self.lock, self.connect() as db:
            db.execute("""UPDATE safety_twin_controls SET mode=?,slow_mode=?,new_account_friction=?,
                enhanced_language_review=?,reply_burst_limit=?,updated_by=?,updated_at=? WHERE event_id=?""", (
                mode, int(bool(payload.get("slowMode"))), int(bool(payload.get("newAccountFriction"))),
                int(bool(payload.get("enhancedLanguageReview"))), limit, moderator_id, now_iso(), EVENT_ID,
            ))
        return {"controls": self.summary()["controls"], "automaticAction": False, "auditRecorded": True}

    def authorize_packet(self, moderator_id, packet_id):
        with self.lock, self.connect() as db:
            run = db.execute("SELECT * FROM safety_twin_runs WHERE event_id=? ORDER BY started_at DESC LIMIT 1", (EVENT_ID,)).fetchone()
            if not run:
                raise ValueError("Run the Event Safety Twin before reviewing a packet.")
            escalation = json.loads(run["escalation_json"])
            if escalation.get("packetId") != packet_id:
                raise ValueError("Escalation packet does not exist in the active run.")
            if escalation.get("state") != "pending_human_authorization":
                raise ValueError("Escalation packet is not awaiting human authorization.")
            escalation.update({"state": "approved_not_sent", "authorizedBy": moderator_id, "authorizedAt": now_iso(), "externalMessageSent": False})
            db.execute("UPDATE safety_twin_runs SET escalation_json=? WHERE run_id=?", (json.dumps(escalation), run["run_id"]))
        return {"packet": escalation, "externalMessageSent": False, "delivery": "No external message sent; connector is not configured."}

    def reset(self, moderator_id):
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM safety_twin_messages WHERE run_id IN (SELECT run_id FROM safety_twin_runs WHERE event_id=?)", (EVENT_ID,))
            db.execute("DELETE FROM safety_twin_runs WHERE event_id=?", (EVENT_ID,))
            db.execute("""UPDATE safety_twin_controls SET mode='heightened',slow_mode=1,new_account_friction=1,
                enhanced_language_review=1,reply_burst_limit=6,updated_by=?,updated_at=? WHERE event_id=?""", (moderator_id, now_iso(), EVENT_ID))
        return self.summary()

    @staticmethod
    def _timeline(rows, escalation):
        items = [{"at": row["created_at"], "kind": "message", "outcome": row["outcome"], "title": "Message allowed to athlete" if row["delivered_to_athlete"] else "Hostile message intercepted", "detail": f"{row['language']} · {row['category'].replace('_', ' ')}", "sequence": row["sequence_no"]} for row in rows]
        if any(row.get("cluster_id") for row in rows):
            items.append({"at": rows[15]["created_at"], "kind": "campaign", "outcome": "review", "title": "Coordinated-pattern candidate formed", "detail": "Account, thread, target and language edges joined", "sequence": 16.5})
        if escalation.get("state") != "not_required":
            items.append({"at": rows[18]["created_at"], "kind": "safeguarding", "outcome": "block", "title": "Threat packet held for human authorization", "detail": "External delivery remains unavailable", "sequence": 19.5})
        return sorted(items, key=lambda item: item["sequence"])

    def summary(self):
        with self.lock, self.connect() as db:
            controls = self._controls(db)
            run = db.execute("SELECT * FROM safety_twin_runs WHERE event_id=? ORDER BY started_at DESC LIMIT 1", (EVENT_ID,)).fetchone()
            if not run:
                active = None
            else:
                row = dict(run)
                messages = [dict(item) for item in db.execute("SELECT * FROM safety_twin_messages WHERE run_id=? ORDER BY sequence_no", (row["run_id"],))]
                for item in messages:
                    item["delivered_to_athlete"] = bool(item["delivered_to_athlete"])
                escalation = json.loads(row["escalation_json"])
                active = {
                    "runId": row["run_id"], "version": row["version"], "seed": row["seed"], "scenario": row["scenario"],
                    "status": row["status"], "counters": json.loads(row["counters_json"]),
                    "attackGraph": json.loads(row["attack_graph_json"]), "copilot": json.loads(row["copilot_json"]),
                    "escalation": escalation, "messages": messages, "timeline": self._timeline(messages, escalation),
                    "startedAt": row["started_at"], "completedAt": row["completed_at"],
                }
        return {
            "version": TWIN_VERSION, "event": {"name": "K1ND Grand Slam Athlete Shield", "target": "Mara Volkov", "status": "SIMULATED", "scope": "24-message deterministic match-point surge"},
            "controls": controls, "run": active,
            "capabilities": {"liveModerationEngine": True, "multilingualFixtures": True, "multimodalFusion": "simulated OCR fixture", "externalIngestion": False, "externalDelivery": False, "autonomousEmergencyAction": False},
            "boundaries": {
                "simulation": "The message stream, authors, media signal and event are simulated. Decisions come from the active K1ND server safety engine.",
                "rawContent": "Allowed messages may be shown; intercepted content is replaced by a category and evidence digest.",
                "coordination": "Graph scores are explainable routing heuristics and require human verification; they are not attribution or probability claims.",
                "delivery": "No WTA, ATP, venue-security or emergency-service connector is configured. Human authorization prepares a local packet but sends nothing.",
            },
        }
