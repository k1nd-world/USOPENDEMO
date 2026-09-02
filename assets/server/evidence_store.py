import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class EvidenceStore:
    def __init__(self, root):
        configured_data_dir = os.environ.get("K1ND_DATA_DIR", "").strip()
        self.data_dir = Path(configured_data_dir).expanduser() if configured_data_dir else Path(root) / "data"
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.db_path = self.data_dir / "k1nd_platform_v4_24_1.sqlite3"
        self.secret_path = self.data_dir / ".k1nd_server_secret"
        self.lock = threading.RLock()
        self.secret = self._load_secret()
        self._initialize()

    def _load_secret(self):
        if not self.secret_path.exists():
            self.secret_path.write_bytes(secrets.token_bytes(32))
            try:
                os.chmod(self.secret_path, 0o600)
            except OSError:
                pass
        return self.secret_path.read_bytes()

    def connect(self):
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self):
        with self.lock, self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS decisions (
                    receipt_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, user_id TEXT NOT NULL,
                    content_type TEXT NOT NULL, content_hash TEXT NOT NULL, text_preview TEXT NOT NULL,
                    client_outcome TEXT NOT NULL, server_outcome TEXT NOT NULL, final_outcome TEXT NOT NULL,
                    category TEXT NOT NULL, reason TEXT NOT NULL, policy_version TEXT NOT NULL,
                    matched_rule_ids TEXT NOT NULL, media_sha256 TEXT, target_user_id TEXT,
                    signature TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'enforced'
                );
                CREATE INDEX IF NOT EXISTS idx_decisions_created ON decisions(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_decisions_user ON decisions(user_id, created_at DESC);
                CREATE TABLE IF NOT EXISTS media_evidence (
                    sha256 TEXT PRIMARY KEY, created_at TEXT NOT NULL, bytes INTEGER NOT NULL,
                    width INTEGER, height INTEGER, ocr_text_hash TEXT NOT NULL, ocr_confidence REAL NOT NULL,
                    ocr_status TEXT NOT NULL, visual_provider TEXT NOT NULL, visual_status TEXT NOT NULL,
                    classifications_json TEXT NOT NULL, safety_signals_json TEXT NOT NULL,
                    server_outcome TEXT NOT NULL, server_reason TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS appeals (
                    appeal_id TEXT PRIMARY KEY, receipt_id TEXT, local_event_id TEXT, user_id TEXT NOT NULL,
                    statement TEXT NOT NULL, status TEXT NOT NULL, created_at TEXT NOT NULL,
                    resolved_at TEXT, resolved_by TEXT, FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE TABLE IF NOT EXISTS adjudications (
                    adjudication_id TEXT PRIMARY KEY, appeal_id TEXT NOT NULL, moderator_id TEXT NOT NULL,
                    decision TEXT NOT NULL, corrected_category TEXT, notes TEXT NOT NULL, created_at TEXT NOT NULL,
                    FOREIGN KEY(appeal_id) REFERENCES appeals(appeal_id)
                );
                CREATE TABLE IF NOT EXISTS publications (
                    publication_id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL UNIQUE,
                    user_id TEXT NOT NULL, content_type TEXT NOT NULL, content_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL, FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE INDEX IF NOT EXISTS idx_publications_created ON publications(created_at DESC);
            """)
            db.execute("""INSERT OR IGNORE INTO appeals
                (appeal_id,receipt_id,local_event_id,user_id,statement,status,created_at)
                VALUES ('ap1',NULL,'m1','u_fan',?,'pending',?)""", (
                "I was criticising the line call and want the decision checked in context.", now_iso(),
            ))

    def sign(self, payload):
        canonical = json.dumps(payload, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
        return hmac.new(self.secret, canonical, hashlib.sha256).hexdigest()

    def record_media(self, evidence):
        with self.lock, self.connect() as db:
            db.execute("""INSERT OR REPLACE INTO media_evidence
                (sha256,created_at,bytes,width,height,ocr_text_hash,ocr_confidence,ocr_status,visual_provider,visual_status,classifications_json,safety_signals_json,server_outcome,server_reason)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                evidence["sha256"], now_iso(), evidence["bytes"], evidence.get("width"), evidence.get("height"),
                evidence["ocrTextHash"], evidence.get("ocrConfidence", 0), evidence["ocrStatus"],
                evidence["visualProvider"], evidence["visualStatus"], json.dumps(evidence.get("classifications", []), ensure_ascii=False),
                json.dumps(evidence.get("safetySignals", []), ensure_ascii=False), evidence["serverOutcome"], evidence["serverReason"],
            ))

    def get_media(self, sha256):
        if not sha256:
            return None
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM media_evidence WHERE sha256=?", (sha256,)).fetchone()
            return dict(row) if row else None

    def get_decision(self, receipt_id):
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM decisions WHERE receipt_id=?", (receipt_id,)).fetchone()
            return dict(row) if row else None

    def prior_targeted_interventions(self, user_id, target_user_id, limit=20):
        if not user_id or not target_user_id:
            return []
        with self.lock, self.connect() as db:
            rows = db.execute("""SELECT receipt_id,created_at,final_outcome,category
                FROM decisions WHERE user_id=? AND target_user_id=? AND final_outcome!='clean'
                ORDER BY created_at DESC LIMIT ?""", (user_id, target_user_id, limit)).fetchall()
            return [dict(row) for row in rows]

    def record_decision(self, row):
        receipt_id = "rcpt_" + uuid.uuid4().hex
        signed = {"receiptId": receipt_id, "createdAt": now_iso(), **row}
        signed["signature"] = self.sign(signed)
        with self.lock, self.connect() as db:
            db.execute("""INSERT INTO decisions
                (receipt_id,created_at,user_id,content_type,content_hash,text_preview,client_outcome,server_outcome,final_outcome,category,reason,policy_version,matched_rule_ids,media_sha256,target_user_id,signature,status)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                receipt_id, signed["createdAt"], row["userId"], row["contentType"], row["contentHash"], row["textPreview"],
                row["clientOutcome"], row["serverOutcome"], row["finalOutcome"], row["category"], row["reason"], row["policyVersion"],
                json.dumps(row.get("matchedRuleIds", [])), row.get("mediaSha256"), row.get("targetUserId"), signed["signature"], "enforced",
            ))
        return signed

    def record_appeal(self, payload):
        with self.lock, self.connect() as db:
            if payload.get("receiptId") and not db.execute("SELECT 1 FROM decisions WHERE receipt_id=?", (payload["receiptId"],)).fetchone():
                raise ValueError("Receipt does not exist")
            db.execute("""INSERT OR REPLACE INTO appeals
                (appeal_id,receipt_id,local_event_id,user_id,statement,status,created_at) VALUES (?,?,?,?,?,'pending',?)""", (
                payload["appealId"], payload.get("receiptId"), payload.get("localEventId"), payload["userId"], payload["statement"], now_iso(),
            ))

    def record_publication(self, payload):
        receipt_id = str(payload.get("receiptId") or "")
        signature = str(payload.get("signature") or "")
        text = str(payload.get("text") or "")
        user_id = str(payload.get("userId") or "")[:80]
        content_type = str(payload.get("contentType") or "")[:40]
        content_hash = hashlib.sha256(text.encode("utf-8")).hexdigest()
        with self.lock, self.connect() as db:
            receipt = db.execute("SELECT * FROM decisions WHERE receipt_id=?", (receipt_id,)).fetchone()
            if not receipt:
                raise ValueError("Server moderation receipt does not exist")
            if not hmac.compare_digest(receipt["signature"], signature):
                raise ValueError("Server moderation signature is invalid")
            if receipt["final_outcome"] != "clean":
                raise ValueError("Only a clean server decision can authorize publication")
            if not hmac.compare_digest(receipt["content_hash"], content_hash):
                raise ValueError("Publication content does not match the moderated content hash")
            if receipt["user_id"] != user_id or receipt["content_type"] != content_type:
                raise ValueError("Publication identity or content type does not match the receipt")
            existing = db.execute("SELECT publication_id,created_at FROM publications WHERE receipt_id=?", (receipt_id,)).fetchone()
            if existing:
                return {"publicationId": existing["publication_id"], "createdAt": existing["created_at"], "idempotent": True}
            publication_id = "pub_" + uuid.uuid4().hex
            created = now_iso()
            db.execute("""INSERT INTO publications
                (publication_id,receipt_id,user_id,content_type,content_hash,created_at) VALUES (?,?,?,?,?,?)""", (
                publication_id, receipt_id, user_id, content_type, content_hash, created,
            ))
            db.execute("UPDATE decisions SET status='publication_authorized' WHERE receipt_id=?", (receipt_id,))
        return {"publicationId": publication_id, "createdAt": created, "idempotent": False}

    def record_adjudication(self, payload):
        created = now_iso()
        with self.lock, self.connect() as db:
            appeal = db.execute("SELECT * FROM appeals WHERE appeal_id=? AND status='pending'", (payload["appealId"],)).fetchone()
            if not appeal:
                raise ValueError("Pending appeal does not exist")
            adjudication_id = "adj_" + uuid.uuid4().hex
            db.execute("""INSERT INTO adjudications
                (adjudication_id,appeal_id,moderator_id,decision,corrected_category,notes,created_at) VALUES (?,?,?,?,?,?,?)""", (
                adjudication_id, payload["appealId"], payload["moderatorId"], payload["decision"], payload.get("correctedCategory"), payload["notes"], created,
            ))
            db.execute("UPDATE appeals SET status=?,resolved_at=?,resolved_by=? WHERE appeal_id=?", (payload["decision"], created, payload["moderatorId"], payload["appealId"]))
        return {"adjudicationId": adjudication_id, "createdAt": created}

    def summary(self, limit=12):
        with self.lock, self.connect() as db:
            counts = {row["final_outcome"]: row["n"] for row in db.execute("SELECT final_outcome,COUNT(*) n FROM decisions GROUP BY final_outcome")}
            totals = {
                "decisions": db.execute("SELECT COUNT(*) FROM decisions").fetchone()[0],
                "mediaEvidence": db.execute("SELECT COUNT(*) FROM media_evidence").fetchone()[0],
                "appeals": db.execute("SELECT COUNT(*) FROM appeals").fetchone()[0],
                "pendingAppeals": db.execute("SELECT COUNT(*) FROM appeals WHERE status='pending'").fetchone()[0],
                "adjudications": db.execute("SELECT COUNT(*) FROM adjudications").fetchone()[0],
                "publications": db.execute("SELECT COUNT(*) FROM publications").fetchone()[0],
            }
            recent = [dict(row) for row in db.execute("SELECT receipt_id,created_at,user_id,content_type,text_preview,client_outcome,server_outcome,final_outcome,category,reason,policy_version,media_sha256,signature FROM decisions ORDER BY created_at DESC LIMIT ?", (limit,))]
            appeals = [dict(row) for row in db.execute("SELECT appeal_id,receipt_id,local_event_id,user_id,statement,status,created_at,resolved_at,resolved_by FROM appeals ORDER BY created_at DESC LIMIT ?", (limit,))]
            return {"totals": totals, "outcomes": counts, "recent": recent, "appeals": appeals, "database": self.db_path.name}
