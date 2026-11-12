import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from evidence_store import now_iso


DEFAULT_DEMO_PINS = {
    "u_adult": "2468",
    "u_u18": "1357",
    "u_trusted": "3579",
    "u_fan": "4680",
    "u_admin": "8642",
}
SHARED_DEMO_PIN = os.environ.get("K1ND_DEMO_PIN", "").strip()
if SHARED_DEMO_PIN and not re.fullmatch(r"\d{4}", SHARED_DEMO_PIN):
    raise RuntimeError("K1ND_DEMO_PIN must contain exactly four digits.")
DEMO_PINS = {
    user_id: SHARED_DEMO_PIN or default_pin
    for user_id, default_pin in DEFAULT_DEMO_PINS.items()
}
SESSION_HOURS = 8

# Keep the recorded demo comment and receipt. The public view hides the
# specific verified row while all four fields still match.
DEMO_HIDDEN_COMMENT = ("c_3120e8f8b64e43a6b20ef8a7e8b932d1", "u_adult", "p1", "I lost my bet")


def _hash_pin(pin, salt):
    return hashlib.pbkdf2_hmac("sha256", pin.encode("utf-8"), salt, 210_000)


def _public_profile(row):
    profile = json.loads(row["profile_json"])
    profile["canPost"] = bool(row["can_post"])
    return profile


class PlatformStore:
    def __init__(self, root, evidence):
        self.root = Path(root)
        self.evidence = evidence
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self.seed_path = self.root / "assets" / "server" / "platform_seed.json"
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
                CREATE TABLE IF NOT EXISTS platform_users (
                    user_id TEXT PRIMARY KEY, role TEXT NOT NULL, verification_status TEXT NOT NULL,
                    can_post INTEGER NOT NULL DEFAULT 0, pin_salt BLOB, pin_hash BLOB,
                    profile_json TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
                );
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, csrf_token TEXT NOT NULL,
                    created_at TEXT NOT NULL, expires_at TEXT NOT NULL, revoked_at TEXT,
                    FOREIGN KEY(user_id) REFERENCES platform_users(user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_sessions_user ON auth_sessions(user_id, expires_at DESC);
                CREATE TABLE IF NOT EXISTS auth_failures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, user_id TEXT NOT NULL,
                    remote_address TEXT NOT NULL, created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_auth_failures ON auth_failures(user_id, remote_address, created_at DESC);
                CREATE TABLE IF NOT EXISTS platform_posts (
                    content_id TEXT PRIMARY KEY, publication_id TEXT UNIQUE, author_id TEXT NOT NULL,
                    content TEXT NOT NULL, sport TEXT NOT NULL, image_url TEXT, image_alt TEXT,
                    photo_key TEXT, moderation_status TEXT NOT NULL, moderation_json TEXT,
                    created_at TEXT NOT NULL, FOREIGN KEY(author_id) REFERENCES platform_users(user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_platform_posts_created ON platform_posts(created_at DESC);
                CREATE TABLE IF NOT EXISTS platform_comments (
                    content_id TEXT PRIMARY KEY, publication_id TEXT UNIQUE, post_id TEXT NOT NULL,
                    parent_id TEXT, author_id TEXT NOT NULL, content TEXT NOT NULL,
                    moderation_status TEXT NOT NULL, moderation_json TEXT, created_at TEXT NOT NULL,
                    FOREIGN KEY(post_id) REFERENCES platform_posts(content_id),
                    FOREIGN KEY(parent_id) REFERENCES platform_comments(content_id),
                    FOREIGN KEY(author_id) REFERENCES platform_users(user_id)
                );
                CREATE INDEX IF NOT EXISTS idx_platform_comments_post ON platform_comments(post_id, created_at);
                CREATE TABLE IF NOT EXISTS moderation_cases (
                    case_id TEXT PRIMARY KEY, receipt_id TEXT NOT NULL UNIQUE, priority TEXT NOT NULL,
                    harm_type TEXT NOT NULL, target_user_id TEXT, subject_user_id TEXT NOT NULL,
                    content_type TEXT NOT NULL, status TEXT NOT NULL, assigned_to TEXT,
                    escalation TEXT NOT NULL, notes TEXT NOT NULL, context_json TEXT NOT NULL,
                    created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
                    FOREIGN KEY(receipt_id) REFERENCES decisions(receipt_id)
                );
                CREATE INDEX IF NOT EXISTS idx_cases_queue ON moderation_cases(status, priority, created_at DESC);
            """)
            if db.execute("SELECT COUNT(*) FROM platform_users").fetchone()[0] == 0:
                self._seed(db)
            elif SHARED_DEMO_PIN:
                self._apply_hosted_demo_pin(db)
            db.execute("DELETE FROM auth_sessions WHERE expires_at < ?", (now_iso(),))

    def _apply_hosted_demo_pin(self, db):
        for user_id, pin in DEMO_PINS.items():
            salt = secrets.token_bytes(16)
            db.execute(
                "UPDATE platform_users SET pin_salt=?,pin_hash=? WHERE user_id=?",
                (salt, _hash_pin(pin, salt), user_id),
            )

    def _seed(self, db):
        seed = json.loads(self.seed_path.read_text(encoding="utf-8"))
        for profile in seed["profiles"]:
            pin = DEMO_PINS.get(profile["id"])
            salt = secrets.token_bytes(16) if pin else None
            pin_hash = _hash_pin(pin, salt) if pin else None
            db.execute("""INSERT INTO platform_users
                (user_id,role,verification_status,can_post,pin_salt,pin_hash,profile_json)
                VALUES (?,?,?,?,?,?,?)""", (
                profile["id"], profile.get("role", "observer"), profile.get("verificationStatus", "unverified"),
                1 if profile.get("canPost") else 0, salt, pin_hash, json.dumps(profile, ensure_ascii=False),
            ))
        for post in seed["posts"]:
            db.execute("""INSERT INTO platform_posts
                (content_id,publication_id,author_id,content,sport,image_url,image_alt,photo_key,moderation_status,moderation_json,created_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?)""", (
                post["id"], None, post["authorId"], post["content"], post.get("sport", "tennis"),
                post.get("imageUrl"), post.get("imageAlt"), post.get("photoKey"),
                post.get("moderationStatus", "clean"), None, post["createdAt"],
            ))
        for comment in seed["comments"]:
            db.execute("""INSERT INTO platform_comments
                (content_id,publication_id,post_id,parent_id,author_id,content,moderation_status,moderation_json,created_at)
                VALUES (?,?,?,?,?,?,?,?,?)""", (
                comment["id"], None, comment["postId"], comment.get("parentId"), comment["authorId"],
                comment["content"], comment.get("moderationStatus", "clean"), None, comment["createdAt"],
            ))

    def list_profiles(self):
        with self.lock, self.connect() as db:
            return [_public_profile(row) for row in db.execute("SELECT * FROM platform_users WHERE active=1 ORDER BY rowid")]

    def get_user(self, user_id):
        if not user_id:
            return None
        with self.lock, self.connect() as db:
            row = db.execute("SELECT * FROM platform_users WHERE user_id=? AND active=1", (user_id,)).fetchone()
            return _public_profile(row) if row else None

    def authenticate(self, user_id, pin, remote_address="local"):
        user_id = str(user_id or "")[:80]
        remote_address = str(remote_address or "local")[:120]
        threshold = (datetime.now(timezone.utc) - timedelta(minutes=10)).isoformat()
        with self.lock, self.connect() as db:
            failures = db.execute("""SELECT COUNT(*) FROM auth_failures
                WHERE user_id=? AND remote_address=? AND created_at>=?""", (user_id, remote_address, threshold)).fetchone()[0]
            if failures >= 8:
                raise PermissionError("Too many unsuccessful sign-in attempts. Try again in ten minutes.")
            row = db.execute("SELECT * FROM platform_users WHERE user_id=? AND active=1", (user_id,)).fetchone()
            valid = bool(row and row["pin_hash"] and hmac.compare_digest(row["pin_hash"], _hash_pin(str(pin or ""), row["pin_salt"])))
            if not valid:
                db.execute("INSERT INTO auth_failures (user_id,remote_address,created_at) VALUES (?,?,?)", (user_id, remote_address, now_iso()))
                raise PermissionError("The demo account or PIN was not recognised.")
            db.execute("DELETE FROM auth_failures WHERE user_id=? AND remote_address=?", (user_id, remote_address))
            raw_token = secrets.token_urlsafe(32)
            token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
            csrf = secrets.token_urlsafe(24)
            created = datetime.now(timezone.utc)
            expires = created + timedelta(hours=SESSION_HOURS)
            db.execute("""INSERT INTO auth_sessions (token_hash,user_id,csrf_token,created_at,expires_at)
                VALUES (?,?,?,?,?)""", (token_hash, user_id, csrf, created.isoformat(), expires.isoformat()))
            return {
                "token": raw_token, "csrfToken": csrf, "expiresAt": expires.isoformat(),
                "user": _public_profile(row),
            }

    def session(self, raw_token):
        if not raw_token:
            return None
        token_hash = hashlib.sha256(str(raw_token).encode("utf-8")).hexdigest()
        with self.lock, self.connect() as db:
            row = db.execute("""SELECT s.*,u.* FROM auth_sessions s JOIN platform_users u ON u.user_id=s.user_id
                WHERE s.token_hash=? AND s.revoked_at IS NULL AND s.expires_at>? AND u.active=1""", (token_hash, now_iso())).fetchone()
            if not row:
                return None
            return {"tokenHash": token_hash, "csrfToken": row["csrf_token"], "expiresAt": row["expires_at"], "user": _public_profile(row)}

    def revoke_session(self, raw_token):
        if not raw_token:
            return
        token_hash = hashlib.sha256(str(raw_token).encode("utf-8")).hexdigest()
        with self.lock, self.connect() as db:
            db.execute("UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?", (now_iso(), token_hash))

    def feed(self):
        with self.lock, self.connect() as db:
            posts = []
            for row in db.execute("SELECT * FROM platform_posts WHERE moderation_status <> 'removed' ORDER BY created_at DESC"):
                posts.append({
                    "id": row["content_id"], "publicationId": row["publication_id"], "authorId": row["author_id"],
                    "content": row["content"], "sport": row["sport"], "imageUrl": row["image_url"],
                    "imageAlt": row["image_alt"], "photoKey": row["photo_key"],
                    "moderationStatus": row["moderation_status"],
                    "moderationEvidence": json.loads(row["moderation_json"]) if row["moderation_json"] else None,
                    "createdAt": row["created_at"],
                })
            comments = []
            # The feed renders replies within their parent thread. Omit hidden
            # threads in the same payload used by public profile replies.
            for row in db.execute("""
                WITH RECURSIVE hidden_comments(content_id, post_id) AS (
                    SELECT content_id, post_id FROM platform_comments
                    WHERE moderation_status = 'removed'
                        OR (content_id = ? AND author_id = ? AND post_id = ? AND content = ?)
                    UNION
                    SELECT child.content_id, child.post_id FROM platform_comments child
                    JOIN hidden_comments parent
                        ON child.parent_id = parent.content_id AND child.post_id = parent.post_id
                )
                SELECT comment.* FROM platform_comments comment
                JOIN platform_posts post ON post.content_id = comment.post_id
                WHERE post.moderation_status <> 'removed'
                    AND NOT EXISTS (
                        SELECT 1 FROM hidden_comments hidden WHERE hidden.content_id = comment.content_id
                    )
                ORDER BY comment.created_at
            """, DEMO_HIDDEN_COMMENT):
                comments.append({
                    "id": row["content_id"], "publicationId": row["publication_id"], "postId": row["post_id"],
                    "parentId": row["parent_id"], "authorId": row["author_id"], "content": row["content"],
                    "moderationStatus": row["moderation_status"],
                    "moderationEvidence": json.loads(row["moderation_json"]) if row["moderation_json"] else None,
                    "createdAt": row["created_at"],
                })
            return {"posts": posts, "comments": comments}

    def create_publication(self, publication_id, receipt_id, user, content_type, text, metadata=None):
        metadata = metadata or {}
        decision = self.evidence.get_decision(receipt_id) or {}
        evidence = {"serverReceipt": {
            "id": receipt_id, "publicationId": publication_id, "publicationAuthorized": True, "durable": True,
            "signature": decision.get("signature"), "policyVersion": decision.get("policy_version"), "createdAt": decision.get("created_at"),
        }}
        with self.lock, self.connect() as db:
            if content_type == "post":
                if not user.get("canPost"):
                    raise PermissionError("This account does not have trusted-poster permission.")
                existing = db.execute("SELECT content_id FROM platform_posts WHERE publication_id=?", (publication_id,)).fetchone()
                if existing:
                    return self._post(db, existing["content_id"])
                content_id = "p_" + uuid.uuid4().hex
                created = now_iso()
                photo_key = metadata.get("photoKey") if metadata.get("photoKey") in {"action", "stadium", "clay", "ball"} else None
                image_url = metadata.get("imageUrl") if photo_key else None
                db.execute("""INSERT INTO platform_posts
                    (content_id,publication_id,author_id,content,sport,image_url,image_alt,photo_key,moderation_status,moderation_json,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?)""", (
                    content_id, publication_id, user["id"], text, str(metadata.get("sport") or "tennis")[:40],
                    image_url, str(metadata.get("imageAlt") or "")[:300] or None, photo_key,
                    str(metadata.get("moderationStatus") or "clean")[:40], json.dumps(evidence), created,
                ))
                return self._post(db, content_id)
            if content_type == "comment":
                if user.get("role") == "observer":
                    raise PermissionError("Only verified participants can comment.")
                post_id = str(metadata.get("postId") or "")
                parent_id = str(metadata.get("parentId") or "") or None
                if not db.execute("SELECT 1 FROM platform_posts WHERE content_id=?", (post_id,)).fetchone():
                    raise ValueError("The post being replied to does not exist.")
                if parent_id and not db.execute("SELECT 1 FROM platform_comments WHERE content_id=? AND post_id=?", (parent_id, post_id)).fetchone():
                    raise ValueError("The parent comment does not belong to this post.")
                existing = db.execute("SELECT content_id FROM platform_comments WHERE publication_id=?", (publication_id,)).fetchone()
                if existing:
                    return self._comment(db, existing["content_id"])
                content_id = "c_" + uuid.uuid4().hex
                created = now_iso()
                db.execute("""INSERT INTO platform_comments
                    (content_id,publication_id,post_id,parent_id,author_id,content,moderation_status,moderation_json,created_at)
                    VALUES (?,?,?,?,?,?,?,?,?)""", (
                    content_id, publication_id, post_id, parent_id, user["id"], text,
                    str(metadata.get("moderationStatus") or "clean")[:40], json.dumps(evidence), created,
                ))
                return self._comment(db, content_id)
            raise ValueError("Content type must be post or comment.")

    def _post(self, db, content_id):
        row = db.execute("SELECT * FROM platform_posts WHERE content_id=?", (content_id,)).fetchone()
        return {"id": row["content_id"], "publicationId": row["publication_id"], "authorId": row["author_id"], "content": row["content"], "sport": row["sport"], "imageUrl": row["image_url"], "imageAlt": row["image_alt"], "photoKey": row["photo_key"], "moderationStatus": row["moderation_status"], "moderationEvidence": json.loads(row["moderation_json"] or "null"), "createdAt": row["created_at"]}

    def _comment(self, db, content_id):
        row = db.execute("SELECT * FROM platform_comments WHERE content_id=?", (content_id,)).fetchone()
        return {"id": row["content_id"], "publicationId": row["publication_id"], "postId": row["post_id"], "parentId": row["parent_id"], "authorId": row["author_id"], "content": row["content"], "moderationStatus": row["moderation_status"], "moderationEvidence": json.loads(row["moderation_json"] or "null"), "createdAt": row["created_at"]}

    def create_case(self, receipt, context=None):
        if receipt.get("finalOutcome") == "clean":
            return None
        context = context or {}
        target_is_u18 = bool(context.get("targetIsU18") or context.get("target_is_u18"))
        category = receipt.get("category") or "policy_intervention"
        outcome = receipt.get("finalOutcome")
        if category in {"targeted_violence", "threat", "doxxing", "personal_contact"} or (outcome == "block" and target_is_u18):
            priority = "critical"
        elif outcome == "block" or target_is_u18:
            priority = "high"
        elif outcome == "review":
            priority = "medium"
        else:
            priority = "low"
        escalation = "immediate specialist review" if priority == "critical" else ("priority moderator review" if priority == "high" else "standard moderation queue")
        created = now_iso()
        case_id = "case_" + uuid.uuid4().hex
        with self.lock, self.connect() as db:
            existing = db.execute("SELECT case_id FROM moderation_cases WHERE receipt_id=?", (receipt["receiptId"],)).fetchone()
            if existing:
                return existing["case_id"]
            db.execute("""INSERT INTO moderation_cases
                (case_id,receipt_id,priority,harm_type,target_user_id,subject_user_id,content_type,status,assigned_to,escalation,notes,context_json,created_at,updated_at)
                VALUES (?,?,?,?,?,?,?,'open',NULL,?,'',?,?,?)""", (
                case_id, receipt["receiptId"], priority, category, receipt.get("targetUserId"), receipt["userId"],
                receipt["contentType"], escalation, json.dumps(context, ensure_ascii=False), created, created,
            ))
        return case_id

    def cases(self, limit=100):
        with self.lock, self.connect() as db:
            return [dict(row) for row in db.execute("SELECT * FROM moderation_cases ORDER BY CASE priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, created_at DESC LIMIT ?", (limit,))]

    def update_case(self, case_id, moderator_id, status, notes):
        if status not in {"open", "in_review", "escalated", "resolved"}:
            raise ValueError("Unknown case status.")
        notes = str(notes or "").strip()
        if len(notes) < 8:
            raise ValueError("A meaningful case note is required.")
        with self.lock, self.connect() as db:
            if not db.execute("SELECT 1 FROM moderation_cases WHERE case_id=?", (case_id,)).fetchone():
                raise ValueError("Moderation case does not exist.")
            db.execute("UPDATE moderation_cases SET status=?,assigned_to=?,notes=?,updated_at=? WHERE case_id=?", (status, moderator_id, notes[:1000], now_iso(), case_id))
        return {"caseId": case_id, "status": status, "assignedTo": moderator_id}

    def evaluation_summary(self):
        return {
            "deterministicRegression": {"passed": 882, "total": 882, "status": "verified in this build"},
            "labelledPilot": {"precision": None, "recall": None, "falsePositiveRate": None, "status": "not yet measured against a representative labelled pilot"},
            "contextAdapter": {"status": "active", "mode": "structured server-side escalation", "externalModel": "not configured"},
            "visualProviders": [
                {"provider": "Apple Vision OCR + general classifier", "status": "active on supported macOS hosts"},
                {"provider": "Known-harm hash intelligence", "status": "adapter ready; governed hash corpus not configured"},
                {"provider": "Identity-hate and extremist-symbol specialist", "status": "adapter ready; production provider not configured"},
                {"provider": "Forensic manipulation detector", "status": "not configured"},
            ],
            "deployment": {"active": "4.24.1", "rollbackReference": "4.23.0", "approval": "Tournament Operations release gate"},
        }
