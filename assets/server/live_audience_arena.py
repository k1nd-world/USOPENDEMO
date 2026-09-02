import hashlib
import re
import secrets
import sqlite3
import threading
import time
import uuid
from datetime import datetime, timezone

from evidence_store import now_iso


ARENA_ID = "arena_k1nd_centre_court"
ARENA_CODE = "K1ND23"
ARENA_VERSION = "live-audience-arena-4.24.1"

ARENA_DEFINITIONS = (
    {
        "id": ARENA_ID, "code": ARENA_CODE,
        "name": "K1ND Centre Court Audience Arena", "court": "Centre Court",
        "round": "Quarter-final", "player": "Mara Volkov", "handle": "@maravolkov",
        "opponent": "Sofia Reyes", "sets": "6–4 3–2", "targetUserId": "u_athlete",
        "status": "LIVE LOCAL DEMO", "accent": "electric_teal",
    },
    {
        "id": "arena_k1nd_armstrong", "code": "K1ND24",
        "name": "K1ND Armstrong Audience Arena", "court": "Armstrong Court",
        "round": "Round of 16", "player": "Emi Tanaka", "handle": "@emitanaka",
        "opponent": "Leila Haddad", "sets": "7–5 1–2", "targetUserId": "u_athlete_emi",
        "status": "LIVE LOCAL DEMO", "accent": "signal_blue",
    },
    {
        "id": "arena_k1nd_grandstand", "code": "K1ND25",
        "name": "K1ND Grandstand Audience Arena", "court": "Grandstand",
        "round": "Third round", "player": "Noah Kim", "handle": "@noahkim",
        "opponent": "Mateo Silva", "sets": "4–6 5–3", "targetUserId": "u_u18",
        "status": "LIVE LOCAL DEMO", "accent": "warning_amber",
    },
    {
        "id": "arena_k1nd_court_17", "code": "K1ND26",
        "name": "K1ND Court 17 Audience Arena", "court": "Court 17",
        "round": "Doubles quarter-final", "player": "Ava Cole", "handle": "@avacole",
        "opponent": "N. Jensen / P. Novak", "sets": "6–2 2–4", "targetUserId": "u_athlete_ava",
        "status": "LIVE LOCAL DEMO", "accent": "violet",
    },
)
ARENA_BY_ID = {item["id"]: item for item in ARENA_DEFINITIONS}
ARENA_BY_CODE = {item["code"]: item for item in ARENA_DEFINITIONS}

REHEARSAL_MESSAGES = (
    ("Amira", "Fuck what a great shot"),
    ("Theo", "That second serve was too predictable today."),
    ("Priya", "The way you defended break point was incredible."),
    ("supporter-42", "Your first serve kept landing short, you useless clown."),
    ("crowd-surge-7", "Everyone go spam her account after that miss."),
    ("risk-signal-9", "I will hurt you outside the stadium after the match."),
)


class ArenaRateLimited(Exception):
    def __init__(self, message, retry_after=4):
        super().__init__(message)
        self.retry_after = max(1, int(retry_after))


class LiveAudienceArena:
    """Server-owned, multi-device audience demonstration.

    Hostile originals are classified in memory and never written to the Arena
    transcript. Role-specific summaries are created on the server so an athlete
    client cannot request the fan-side decision object by changing browser code.
    """

    def __init__(self, evidence, safety):
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self.safety = safety
        self.secret = evidence.secret
        self.condition = threading.Condition()
        self._revision = 0
        self._initialize()

    def connect(self):
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    @staticmethod
    def _token_hash(token):
        return hashlib.sha256(str(token or "").encode("utf-8")).hexdigest()

    def _initialize(self):
        with self.lock, self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS arena_state (
                    arena_id TEXT PRIMARY KEY, room_code TEXT NOT NULL,
                    status TEXT NOT NULL, slow_mode INTEGER NOT NULL,
                    shield_level TEXT NOT NULL, digest_mode TEXT NOT NULL,
                    replies_mode TEXT NOT NULL, revision INTEGER NOT NULL,
                    updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS arena_participants (
                    participant_id TEXT PRIMARY KEY, arena_id TEXT NOT NULL,
                    token_hash TEXT NOT NULL UNIQUE, csrf_token TEXT NOT NULL,
                    display_name TEXT NOT NULL, badge TEXT NOT NULL,
                    status TEXT NOT NULL, joined_at TEXT NOT NULL,
                    last_seen REAL NOT NULL, expires_at REAL NOT NULL,
                    clean_messages INTEGER NOT NULL DEFAULT 0,
                    interventions INTEGER NOT NULL DEFAULT 0
                );
                CREATE INDEX IF NOT EXISTS idx_arena_participant_token
                    ON arena_participants(token_hash);
                CREATE TABLE IF NOT EXISTS arena_messages (
                    message_id TEXT PRIMARY KEY, arena_id TEXT NOT NULL,
                    sequence_no INTEGER NOT NULL, participant_id TEXT NOT NULL,
                    display_name TEXT NOT NULL, safe_preview TEXT NOT NULL,
                    outcome TEXT NOT NULL, category TEXT NOT NULL,
                    mechanism TEXT NOT NULL, speech_act TEXT NOT NULL,
                    target_class TEXT NOT NULL, profanity_function TEXT NOT NULL,
                    risk_band TEXT NOT NULL, delivered_to_athlete INTEGER NOT NULL,
                    source_kind TEXT NOT NULL, evidence_digest TEXT NOT NULL,
                    latency_ms INTEGER NOT NULL, created_epoch REAL NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_arena_message_sequence
                    ON arena_messages(arena_id, sequence_no);
                CREATE INDEX IF NOT EXISTS idx_arena_message_participant
                    ON arena_messages(participant_id, created_epoch);
                CREATE TABLE IF NOT EXISTS arena_events (
                    event_id TEXT PRIMARY KEY, arena_id TEXT NOT NULL,
                    revision INTEGER NOT NULL, event_type TEXT NOT NULL,
                    actor_label TEXT NOT NULL, detail TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_arena_event_revision
                    ON arena_events(arena_id, revision);
            """)
            for arena in ARENA_DEFINITIONS:
                db.execute("""INSERT OR IGNORE INTO arena_state VALUES
                    (?, ?, 'open', 0, 'heightened', 'quiet', 'all_verified', 1, 'system', ?)""",
                    (arena["id"], arena["code"], now_iso()))
            self._revision = int(db.execute(
                "SELECT COALESCE(MAX(revision),1) FROM arena_state"
            ).fetchone()[0])

    @staticmethod
    def arena_id_for_code(code):
        arena = ARENA_BY_CODE.get(str(code or "").strip().upper())
        return arena["id"] if arena else None

    @staticmethod
    def definition(arena_id=ARENA_ID):
        arena = ARENA_BY_ID.get(str(arena_id or ARENA_ID))
        if not arena:
            raise ValueError("That tournament court is not configured.")
        return dict(arena)

    @staticmethod
    def definitions():
        return [dict(item) for item in ARENA_DEFINITIONS]

    @staticmethod
    def _resolve_arena_id(payload=None, fallback=ARENA_ID):
        payload = payload or {}
        arena_id = str(payload.get("arenaId") or "").strip()
        room_code = str(payload.get("roomCode") or "").strip().upper()
        if arena_id and arena_id in ARENA_BY_ID:
            return arena_id
        if room_code and room_code in ARENA_BY_CODE:
            return ARENA_BY_CODE[room_code]["id"]
        if fallback in ARENA_BY_ID:
            return fallback
        raise ValueError("That tournament court is not configured.")

    @staticmethod
    def _validate_name(value):
        name = re.sub(r"\s+", " ", str(value or "").strip())
        if not 2 <= len(name) <= 30:
            raise ValueError("Your event display name must contain between 2 and 30 characters.")
        if not re.fullmatch(r"[\w\-.' ]+", name, re.UNICODE):
            raise ValueError("Use letters, numbers, spaces, hyphens or apostrophes in the event display name.")
        return name

    def public_preview(self, code=None):
        arena_id = self.arena_id_for_code(code) or ARENA_ID
        with self.lock, self.connect() as db:
            state = dict(db.execute("SELECT * FROM arena_state WHERE arena_id=?", (arena_id,)).fetchone())
            active = db.execute(
                "SELECT COUNT(*) FROM arena_participants WHERE arena_id=? AND status='active' AND expires_at>?",
                (arena_id, time.time()),
            ).fetchone()[0]
        return {
            "version": ARENA_VERSION,
            "event": self._event(arena_id),
            "status": state["status"],
            "activeParticipants": active,
            "roomCodeRequired": True,
            "offlineReady": True,
            "externalServicesRequired": False,
            "courtsAvailable": len(ARENA_DEFINITIONS),
        }

    def join(self, payload):
        payload = payload or {}
        room_code = str(payload.get("roomCode") or "").strip().upper()
        arena = ARENA_BY_CODE.get(room_code)
        if not arena:
            raise PermissionError("That Arena room code is not active.")
        arena_id = arena["id"]
        display_name = self._validate_name(payload.get("displayName"))
        token = secrets.token_urlsafe(32)
        csrf = secrets.token_urlsafe(24)
        participant_id = "arena_fan_" + uuid.uuid4().hex
        now = time.time()
        with self.lock, self.connect() as db:
            state = db.execute("SELECT status FROM arena_state WHERE arena_id=?", (arena_id,)).fetchone()
            if not state or state["status"] != "open":
                raise PermissionError("The presenter has paused audience joining.")
            active = db.execute(
                "SELECT COUNT(*) FROM arena_participants WHERE arena_id=? AND status='active' AND expires_at>?",
                (arena_id, now),
            ).fetchone()[0]
            if active >= 40:
                raise ArenaRateLimited("The local Arena is at its 40-participant demonstration limit.", 15)
            db.execute("""INSERT INTO arena_participants
                (participant_id,arena_id,token_hash,csrf_token,display_name,badge,status,
                 joined_at,last_seen,expires_at,clean_messages,interventions)
                VALUES (?,?,?,?,?,'Event verified','active',?,?,?,?,0)""", (
                    participant_id, arena_id, self._token_hash(token), csrf, display_name,
                    now_iso(), now, now + 8 * 60 * 60, 0,
                ))
            revision = self._bump(db, arena_id, "participant_joined", display_name, "Temporary event pass joined")
        self._notify(revision)
        return {
            "token": token,
            "session": {
                "authenticated": True, "participantId": participant_id,
                "displayName": display_name, "badge": "Event verified",
                "csrfToken": csrf, "expiresAt": datetime.fromtimestamp(now + 8 * 60 * 60, timezone.utc).isoformat(),
                "temporary": True, "arenaId": arena_id, "roomCode": room_code,
            },
            "arena": self.summary("fan", participant_id, arena_id),
        }

    def session(self, token):
        if not token:
            return None
        now = time.time()
        with self.lock, self.connect() as db:
            row = db.execute("""SELECT * FROM arena_participants
                WHERE token_hash=? AND status='active' AND expires_at>?""",
                (self._token_hash(token), now)).fetchone()
            if not row:
                return None
            db.execute("UPDATE arena_participants SET last_seen=? WHERE participant_id=?", (now, row["participant_id"]))
        return {
            "authenticated": True, "participantId": row["participant_id"],
            "displayName": row["display_name"], "badge": row["badge"],
            "csrfToken": row["csrf_token"],
            "expiresAt": datetime.fromtimestamp(row["expires_at"], timezone.utc).isoformat(),
            "temporary": True, "arenaId": row["arena_id"],
            "roomCode": ARENA_BY_ID.get(row["arena_id"], {}).get("code"),
        }

    def leave(self, participant_id):
        with self.lock, self.connect() as db:
            row = db.execute("SELECT display_name,arena_id FROM arena_participants WHERE participant_id=?", (participant_id,)).fetchone()
            if not row:
                return {"authenticated": False}
            db.execute("UPDATE arena_participants SET status='left' WHERE participant_id=?", (participant_id,))
            revision = self._bump(db, row["arena_id"], "participant_left", row["display_name"], "Temporary event pass left")
        self._notify(revision)
        return {"authenticated": False}

    def submit(self, session, payload):
        if not session:
            raise PermissionError("Join the Arena before sending a reaction.")
        payload = payload or {}
        text = str(payload.get("text") or "").strip()
        if not 1 <= len(text) <= 700:
            raise ValueError("Arena messages must contain between 1 and 700 characters.")
        source_kind = str(payload.get("sourceKind") or "fan_message")
        if source_kind not in {"fan_message", "accepted_rewrite"}:
            raise ValueError("Unknown Arena message source.")
        started = time.perf_counter()
        with self.lock, self.connect() as db:
            participant = db.execute(
                "SELECT * FROM arena_participants WHERE participant_id=? AND status='active' AND expires_at>?",
                (session["participantId"], time.time()),
            ).fetchone()
            if not participant:
                raise PermissionError("This temporary event pass has expired.")
            arena_id = participant["arena_id"]
            state = dict(db.execute("SELECT * FROM arena_state WHERE arena_id=?", (arena_id,)).fetchone())
            if state["status"] != "open":
                raise PermissionError("The presenter has paused new Arena messages.")
            self._enforce_rate_limit(db, participant["participant_id"], state, text)
            row = self._record(
                db, arena_id, participant["participant_id"], participant["display_name"], text,
                source_kind, state, started,
            )
            field = "clean_messages" if row["deliveredToAthlete"] else "interventions"
            db.execute(f"UPDATE arena_participants SET {field}={field}+1,last_seen=? WHERE participant_id=?",
                (time.time(), participant["participant_id"]))
            detail = "Allowed message reached the protected athlete stream" if row["deliveredToAthlete"] else f"{row['category'].replace('_', ' ')} withheld before athlete delivery"
            revision = self._bump(db, arena_id, "message_decision", participant["display_name"], detail)
        self._notify(revision)
        return {
            "fanDecision": self._fan_decision(row),
            "arena": self.summary("fan", participant["participant_id"], arena_id),
            "externalMessageSent": False,
        }

    def _enforce_rate_limit(self, db, participant_id, state, text):
        now = time.time()
        pressure = self._pressure(self._message_rows(db, state["arena_id"]))
        limits = {"balanced": (6, 10), "heightened": (4, 10), "maximum": (3, 12)}
        limit, window = limits.get(state["shield_level"], (4, 10))
        if state["slow_mode"] or pressure["score"] >= 70:
            limit = max(1, limit - 1)
            window += 4
        recent = db.execute("""SELECT created_epoch,evidence_digest FROM arena_messages
            WHERE participant_id=? AND created_epoch>=? ORDER BY created_epoch DESC""",
            (participant_id, now - window)).fetchall()
        if len(recent) >= limit:
            retry = max(1, round(window - (now - recent[-1]["created_epoch"])))
            raise ArenaRateLimited("Slow down so every fan gets room in the conversation.", retry)
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]
        duplicate = db.execute("""SELECT 1 FROM arena_messages
            WHERE participant_id=? AND evidence_digest=? AND created_epoch>=? LIMIT 1""",
            (participant_id, digest, now - 20)).fetchone()
        if duplicate:
            raise ArenaRateLimited("That reaction was already received. Try a new point.", 5)

    def _record(self, db, arena_id, participant_id, display_name, text, source_kind, state, started=None):
        arena = self.definition(arena_id)
        prior_harm = db.execute(
            "SELECT COUNT(*) FROM arena_messages WHERE arena_id=? AND outcome!='clean'", (arena_id,)
        ).fetchone()[0]
        context = {
            "targetUserId": arena["targetUserId"], "targetRole": "professional athlete",
            "targetIsAthlete": True, "postMatchWindow": True,
            "turnsConsidered": 12, "cumulativeSignals": min(8, prior_harm),
        }
        analysis = self.safety.inspect(text, context)
        decision = analysis["decision"]
        reasoning = analysis["reasoning"]
        outcome = decision["outcome"]
        category = decision.get("policyFamily") or decision.get("category") or "allowed"
        reason = decision.get("reason") or "Server policy decision"
        action = decision.get("action") or ("allow" if outcome == "clean" else "withhold")
        delivered = outcome == "clean"
        if delivered and state["replies_mode"] != "all_verified" and source_kind != "offline_rehearsal":
            delivered = False
            outcome = "review"
            category = "athlete_reply_boundary"
            reason = f"{arena['player']}'s personal reply boundary does not currently include temporary event-pass accounts"
            action = "withhold from athlete stream"
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        safe_preview = text if delivered else self._redacted(category, digest)
        sequence = db.execute(
            "SELECT COALESCE(MAX(sequence_no),0)+1 FROM arena_messages WHERE arena_id=?", (arena_id,)
        ).fetchone()[0]
        latency = max(1, round((time.perf_counter() - (started or time.perf_counter())) * 1000))
        row = {
            "messageId": "arena_msg_" + uuid.uuid4().hex,
            "sequence": sequence, "participantId": participant_id,
            "displayName": display_name, "safePreview": safe_preview,
            "outcome": outcome, "category": category,
            "mechanism": reasoning.get("mechanism") or "none detected",
            "speechAct": reasoning.get("speechAct") or "general expression",
            "targetClass": (reasoning.get("target") or {}).get("class") or "no clear person",
            "profanityFunction": (reasoning.get("profanity") or {}).get("function") or "none",
            "riskBand": (reasoning.get("contextRisk") or {}).get("band") or "low",
            "deliveredToAthlete": delivered, "sourceKind": source_kind,
            "evidenceDigest": digest[:16], "latencyMs": latency,
            "createdEpoch": time.time(), "createdAt": now_iso(),
            "reason": reason, "action": action,
        }
        db.execute("""INSERT INTO arena_messages
            (message_id,arena_id,sequence_no,participant_id,display_name,safe_preview,outcome,
             category,mechanism,speech_act,target_class,profanity_function,risk_band,
             delivered_to_athlete,source_kind,evidence_digest,latency_ms,created_epoch,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                row["messageId"], arena_id, row["sequence"], row["participantId"], row["displayName"],
                row["safePreview"], row["outcome"], row["category"], row["mechanism"],
                row["speechAct"], row["targetClass"], row["profanityFunction"], row["riskBand"],
                int(row["deliveredToAthlete"]), row["sourceKind"], row["evidenceDigest"],
                row["latencyMs"], row["createdEpoch"], row["createdAt"],
            ))
        return row

    @staticmethod
    def _redacted(category, digest):
        return f"[withheld from athlete · {str(category).replace('_', ' ')} · evidence {digest[:10]}]"

    @staticmethod
    def _fan_decision(row):
        outcome = row["outcome"]
        return {
            "messageId": row["messageId"], "outcome": outcome,
            "category": row["category"], "reason": row["reason"], "action": row["action"],
            "speechAct": row["speechAct"], "target": row["targetClass"],
            "mechanism": row["mechanism"], "profanityFunction": row["profanityFunction"],
            "riskBand": row["riskBand"], "deliveredToAthlete": row["deliveredToAthlete"],
            "evidenceDigest": row["evidenceDigest"], "latencyMs": row["latencyMs"],
            "intervention": (
                "Delivered live to the protected athlete stream."
                if row["deliveredToAthlete"]
                else "Paused before delivery. Keep the real sporting point and remove the personal attack."
                if outcome == "warning"
                else "Held outside Mara's stream for a human context decision."
                if outcome == "review"
                else "Blocked before Mara's screen could receive it."
            ),
            "originalReturned": False, "externalMessageSent": False,
        }

    def update_controls(self, moderator_id, payload):
        payload = payload or {}
        arena_id = self._resolve_arena_id(payload)
        status = str(payload.get("status") or "")
        shield = str(payload.get("shieldLevel") or "")
        digest = str(payload.get("digestMode") or "")
        replies = str(payload.get("repliesMode") or "")
        if status not in {"open", "paused"}:
            raise ValueError("Arena status must be open or paused.")
        if shield not in {"balanced", "heightened", "maximum"}:
            raise ValueError("Shield level must be balanced, heightened or maximum.")
        if digest not in {"live", "quiet", "post_match"}:
            raise ValueError("Digest mode must be live, quiet or post_match.")
        if replies not in {"all_verified", "following_only", "mentions_only"}:
            raise ValueError("Reply mode is not supported.")
        slow_mode = bool(payload.get("slowMode"))
        with self.lock, self.connect() as db:
            db.execute("""UPDATE arena_state SET status=?,slow_mode=?,shield_level=?,
                digest_mode=?,replies_mode=?,updated_by=?,updated_at=? WHERE arena_id=?""", (
                    status, int(slow_mode), shield, digest, replies, moderator_id, now_iso(), arena_id,
                ))
            revision = self._bump(db, arena_id, "controls_updated", "Presenter", f"Arena {status}; {shield} shield; {'slow mode' if slow_mode else 'normal pace'}")
        self._notify(revision)
        return {"arena": self.summary("presenter", arena_id=arena_id), "automaticAccountAction": False, "auditRecorded": True}

    def reset(self, moderator_id, arena_id=ARENA_ID):
        arena_id = self._resolve_arena_id({"arenaId": arena_id})
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM arena_messages WHERE arena_id=?", (arena_id,))
            db.execute("DELETE FROM arena_events WHERE arena_id=?", (arena_id,))
            db.execute("DELETE FROM arena_participants WHERE arena_id=?", (arena_id,))
            db.execute("""UPDATE arena_state SET status='open',slow_mode=0,shield_level='heightened',
                digest_mode='quiet',replies_mode='all_verified',updated_by=?,updated_at=? WHERE arena_id=?""",
                (moderator_id, now_iso(), arena_id))
            revision = self._bump(db, arena_id, "arena_reset", "Presenter", "Arena returned to an empty deterministic baseline")
        self._notify(revision)
        return self.summary("presenter", arena_id=arena_id)

    def run_rehearsal(self, moderator_id, arena_id=ARENA_ID):
        arena_id = self._resolve_arena_id({"arenaId": arena_id})
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM arena_messages WHERE arena_id=?", (arena_id,))
            db.execute("DELETE FROM arena_events WHERE arena_id=?", (arena_id,))
            db.execute("""UPDATE arena_state SET status='open',slow_mode=0,shield_level='heightened',
                digest_mode='quiet',replies_mode='all_verified',updated_by=?,updated_at=? WHERE arena_id=?""",
                (moderator_id, now_iso(), arena_id))
            state = dict(db.execute("SELECT * FROM arena_state WHERE arena_id=?", (arena_id,)).fetchone())
            for index, (name, text) in enumerate(REHEARSAL_MESSAGES):
                self._record(db, arena_id, f"rehearsal_{arena_id}_{index + 1}", name, text, "offline_rehearsal", state)
            revision = self._bump(db, arena_id, "offline_rehearsal", "Presenter", "Six-message offline-safe rehearsal processed by the active server engine")
        self._notify(revision)
        return self.summary("presenter", arena_id=arena_id)

    def summary(self, view, participant_id=None, arena_id=None):
        if view not in {"fan", "athlete", "presenter"}:
            raise ValueError("Unknown Arena view.")
        if participant_id and not arena_id:
            with self.lock, self.connect() as db:
                participant_arena = db.execute(
                    "SELECT arena_id FROM arena_participants WHERE participant_id=?", (participant_id,)
                ).fetchone()
            arena_id = participant_arena["arena_id"] if participant_arena else ARENA_ID
        arena_id = self._resolve_arena_id({"arenaId": arena_id or ARENA_ID})
        arena_definition = self.definition(arena_id)
        with self.lock, self.connect() as db:
            state = dict(db.execute("SELECT * FROM arena_state WHERE arena_id=?", (arena_id,)).fetchone())
            rows = self._message_rows(db, arena_id)
            participant_rows = [dict(row) for row in db.execute("""SELECT participant_id,display_name,badge,
                status,joined_at,last_seen,clean_messages,interventions FROM arena_participants
                WHERE arena_id=? ORDER BY joined_at DESC""", (arena_id,))]
            events = [dict(row) for row in db.execute("""SELECT revision,event_type,actor_label,detail,created_at
                FROM arena_events WHERE arena_id=? ORDER BY revision DESC LIMIT 16""", (arena_id,))]
        messages = [self._serialize_message(row) for row in rows]
        delivered = [row for row in messages if row["deliveredToAthlete"]]
        counts = {
            "received": len(messages), "delivered": len(delivered),
            "withheld": len(messages) - len(delivered),
            "warnings": sum(row["outcome"] == "warning" for row in messages),
            "reviews": sum(row["outcome"] == "review" for row in messages),
            "blocks": sum(row["outcome"] == "block" for row in messages),
            "participants": sum(row["status"] == "active" for row in participant_rows),
        }
        latencies = [row["latencyMs"] for row in messages]
        categories = {}
        for row in messages:
            if not row["deliveredToAthlete"]:
                categories[row["category"]] = categories.get(row["category"], 0) + 1
        common = {
            "version": ARENA_VERSION, "revision": state["revision"],
            "view": view, "event": self._event(arena_id),
            "state": {
                "status": state["status"], "slowMode": bool(state["slow_mode"]),
                "shieldLevel": state["shield_level"], "digestMode": state["digest_mode"],
                "repliesMode": state["replies_mode"], "updatedAt": state["updated_at"],
            },
            "counters": counts, "crowd": self._pressure(rows),
            "latency": {
                "averageMs": round(sum(latencies) / len(latencies)) if latencies else None,
                "latestMs": latencies[-1] if latencies else None,
                "measuredLocally": True, "productionClaim": False,
            },
            "shieldDigest": {
                "headline": f"{counts['withheld']} messages kept outside {arena_definition['player']}'s stream",
                "categories": [{"category": key, "count": value} for key, value in sorted(categories.items())],
                "rawHostileContentShown": False,
                "wellbeingCopy": "Your live stream contains verified support and sporting conversation. Hostile originals stay out of view.",
            },
            "offline": {
                "ready": True, "allInterfaceAssetsLocal": True, "externalServicesRequired": False,
                "transport": "server-sent events with timed polling fallback",
                "network": "For multiple devices, use a trusted local network and explicitly opt in to LAN binding.",
            },
            "capabilities": {
                "multiDevice": True, "temporaryEventPasses": True, "serverSentEvents": True,
                "pollingFallback": True, "pressureAwareRateLimit": True,
                "roleSeparatedPayloads": True, "sourceBackedRewriteRetry": True,
                "automaticAccountAction": False, "externalDelivery": False,
            },
            "boundaries": {
                "simulation": "The match, score and rehearsal traffic are simulated. Live audience entries use the active K1ND server safety engine.",
                "privacy": "Non-clean originals are not stored in the Arena transcript. Athlete and presenter payloads contain safe text or redacted metadata only.",
                "latency": "Displayed latency is measured on this local demonstration host, not a production service-level claim.",
                "operations": "No sanction, governing-body notification, venue-security message or emergency action occurs automatically.",
            },
        }
        if view == "athlete":
            return {
                **common,
                "athlete": {"displayName": arena_definition["player"], "handle": arena_definition["handle"], "protected": True},
                "athleteInbox": delivered[-14:],
            }
        if view == "fan":
            participant = next((row for row in participant_rows if row["participant_id"] == participant_id), None)
            return {
                **common, "participant": participant,
                "roomStream": messages[-18:],
                "ownActivity": [row for row in messages if row["participantId"] == participant_id][-8:],
            }
        return {
            **common, "roomCode": arena_definition["code"], "joinPath": f"/arena?room={arena_definition['code']}",
            "participants": participant_rows[:40], "messageLedger": messages[-30:],
            "timeline": events, "athleteInbox": delivered[-12:],
        }

    @staticmethod
    def _event(arena_id=ARENA_ID):
        arena = ARENA_BY_ID.get(arena_id, ARENA_BY_ID[ARENA_ID])
        return {
            "id": arena["id"], "name": arena["name"], "sport": "Tennis",
            "round": arena["round"], "court": arena["court"], "status": arena["status"],
            "accent": arena["accent"],
            "score": {"player": arena["player"], "opponent": arena["opponent"], "sets": arena["sets"]},
        }

    def _message_rows(self, db, arena_id=ARENA_ID):
        return [dict(row) for row in db.execute(
            "SELECT * FROM arena_messages WHERE arena_id=? ORDER BY sequence_no", (arena_id,)
        )]

    @staticmethod
    def _serialize_message(row):
        return {
            "messageId": row["message_id"], "sequence": row["sequence_no"],
            "participantId": row["participant_id"], "displayName": row["display_name"],
            "safePreview": row["safe_preview"], "outcome": row["outcome"],
            "category": row["category"], "mechanism": row["mechanism"],
            "speechAct": row["speech_act"], "targetClass": row["target_class"],
            "profanityFunction": row["profanity_function"], "riskBand": row["risk_band"],
            "deliveredToAthlete": bool(row["delivered_to_athlete"]),
            "sourceKind": row["source_kind"], "evidenceDigest": row["evidence_digest"],
            "latencyMs": row["latency_ms"], "createdAt": row["created_at"],
        }

    @staticmethod
    def _pressure(rows):
        recent = rows[-20:]
        harmful = [row for row in recent if row["outcome"] != "clean"]
        blocks = [row for row in recent if row["outcome"] == "block"]
        distinct = len({row["participant_id"] for row in harmful})
        ratio = len(harmful) / max(1, len(recent))
        score = min(100, round(10 + ratio * 55 + len(blocks) * 8 + max(0, distinct - 1) * 4))
        if score >= 80:
            status, friction, delay = "critical surge", "safety lock", 8
        elif score >= 60:
            status, friction, delay = "hostility rising", "slow mode", 5
        elif score >= 35:
            status, friction, delay = "watching closely", "context pause", 2
        else:
            status, friction, delay = "healthy conversation", "normal flow", 0
        return {
            "score": score, "status": status, "friction": friction,
            "replyDelaySeconds": delay, "window": len(recent),
            "harmfulSignals": len(harmful), "distinctParticipants": distinct,
            "probabilityClaim": False,
            "meaning": "Conversation-pressure routing signal, not a prediction of individual behaviour.",
        }

    def _bump(self, db, arena_id, event_type, actor_label, detail):
        self._revision += 1
        db.execute("UPDATE arena_state SET revision=?,updated_at=? WHERE arena_id=?",
            (self._revision, now_iso(), arena_id))
        db.execute("""INSERT INTO arena_events
            (event_id,arena_id,revision,event_type,actor_label,detail,created_at)
            VALUES (?,?,?,?,?,?,?)""", (
                "arena_event_" + uuid.uuid4().hex, arena_id, self._revision,
                event_type, actor_label, detail, now_iso(),
            ))
        return self._revision

    def _notify(self, revision):
        with self.condition:
            self._revision = max(self._revision, revision)
            self.condition.notify_all()

    def wait_for_revision(self, after_revision, timeout=2.0):
        with self.condition:
            self.condition.wait_for(lambda: self._revision > int(after_revision or 0), timeout=timeout)
            return self._revision
