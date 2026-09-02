import hashlib
import sqlite3
import uuid

from evidence_store import now_iso


MATCH_ID = "match_k1nd_centre_court_demo"
MATCH_VERSION = "live-match-room-4.22.0"

SEED_MESSAGES = (
    {"text": "The way you defended break point was incredible.", "author": "Priya Anand", "source": "seed"},
    {"text": "That second serve was too predictable today.", "author": "Theo Marsh", "source": "seed"},
    {"text": "Fuck what a great shot", "author": "Amira Hassan", "source": "seed"},
    {"text": "Your first serve kept landing short, you useless clown.", "author": "supporter-42", "source": "seed"},
    {"text": "Everyone go spam her account after that miss.", "author": "crowd-surge-7", "source": "seed"},
    {"text": "I will hurt you outside the stadium after the match.", "author": "risk-signal-9", "source": "seed"},
)


class LiveMatchRoom:
    """Server-owned two-sided match experience.

    Clean text may enter the athlete inbox. Non-clean text is never stored in
    the room transcript and is represented only by policy metadata and a
    digest. This class does not send external messages or apply account action.
    """

    def __init__(self, evidence, safety):
        self.db_path = evidence.db_path
        self.lock = evidence.lock
        self.safety = safety
        self._initialize()
        self._seed_if_empty()

    def connect(self):
        connection = sqlite3.connect(self.db_path, timeout=10)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        connection.execute("PRAGMA journal_mode=WAL")
        return connection

    def _initialize(self):
        with self.lock, self.connect() as db:
            db.executescript("""
                CREATE TABLE IF NOT EXISTS live_match_state (
                    match_id TEXT PRIMARY KEY, shield_level TEXT NOT NULL,
                    digest_mode TEXT NOT NULL, replies_mode TEXT NOT NULL,
                    updated_by TEXT NOT NULL, updated_at TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS live_match_messages (
                    message_id TEXT PRIMARY KEY, match_id TEXT NOT NULL,
                    sequence_no INTEGER NOT NULL, author_id TEXT NOT NULL,
                    author_display TEXT NOT NULL, safe_preview TEXT NOT NULL,
                    outcome TEXT NOT NULL, category TEXT NOT NULL,
                    mechanism TEXT NOT NULL, speech_act TEXT NOT NULL,
                    target_class TEXT NOT NULL, profanity_function TEXT NOT NULL,
                    risk_band TEXT NOT NULL, delivered_to_athlete INTEGER NOT NULL,
                    source_kind TEXT NOT NULL, evidence_digest TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_live_match_sequence
                    ON live_match_messages(match_id, sequence_no);
            """)
            db.execute("""INSERT OR IGNORE INTO live_match_state
                VALUES (?, 'heightened', 'quiet', 'all_verified', 'system', ?)""",
                (MATCH_ID, now_iso()))

    def _seed_if_empty(self):
        with self.lock, self.connect() as db:
            count = db.execute(
                "SELECT COUNT(*) FROM live_match_messages WHERE match_id=?", (MATCH_ID,)
            ).fetchone()[0]
            if count:
                return
            for fixture in SEED_MESSAGES:
                self._record(db, "seed-account", fixture["author"], fixture["text"], fixture["source"])

    @staticmethod
    def _redacted_preview(analysis, digest):
        family = str(
            analysis["decision"].get("policyFamily")
            or analysis["decision"].get("category")
            or "safety signal"
        ).replace("_", " ")
        return f"[withheld from athlete · {family} · evidence {digest[:10]}]"

    def _record(self, db, author_id, author_display, text, source_kind):
        prior_harm = db.execute(
            "SELECT COUNT(*) FROM live_match_messages WHERE match_id=? AND outcome!='clean'",
            (MATCH_ID,),
        ).fetchone()[0]
        context = {
            "targetUserId": "u_athlete",
            "targetRole": "professional athlete",
            "targetIsAthlete": True,
            "postMatchWindow": True,
            "turnsConsidered": 10,
            "cumulativeSignals": min(6, prior_harm),
        }
        analysis = self.safety.inspect(text, context)
        decision = analysis["decision"]
        reasoning = analysis["reasoning"]
        outcome = decision["outcome"]
        delivered = outcome == "clean"
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        sequence = db.execute(
            "SELECT COALESCE(MAX(sequence_no),0)+1 FROM live_match_messages WHERE match_id=?",
            (MATCH_ID,),
        ).fetchone()[0]
        message_id = "matchmsg_" + uuid.uuid4().hex
        safe_preview = text if delivered else self._redacted_preview(analysis, digest)
        row = {
            "messageId": message_id,
            "sequence": sequence,
            "authorId": author_id,
            "authorDisplay": author_display,
            "safePreview": safe_preview,
            "outcome": outcome,
            "category": decision.get("policyFamily") or decision.get("category") or "allowed",
            "mechanism": reasoning.get("mechanism") or "none detected",
            "speechAct": reasoning.get("speechAct") or "general expression",
            "targetClass": (reasoning.get("target") or {}).get("class") or "no clear person",
            "profanityFunction": (reasoning.get("profanity") or {}).get("function") or "none",
            "riskBand": (reasoning.get("contextRisk") or {}).get("band") or "low",
            "deliveredToAthlete": delivered,
            "sourceKind": source_kind,
            "evidenceDigest": digest[:16],
            "createdAt": now_iso(),
            "reason": decision.get("reason") or "Server policy decision",
            "action": decision.get("action") or ("allow" if delivered else "withhold"),
        }
        db.execute("""INSERT INTO live_match_messages
            (message_id,match_id,sequence_no,author_id,author_display,safe_preview,outcome,
             category,mechanism,speech_act,target_class,profanity_function,risk_band,
             delivered_to_athlete,source_kind,evidence_digest,created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", (
                row["messageId"], MATCH_ID, row["sequence"], row["authorId"], row["authorDisplay"],
                row["safePreview"], row["outcome"], row["category"], row["mechanism"],
                row["speechAct"], row["targetClass"], row["profanityFunction"], row["riskBand"],
                int(row["deliveredToAthlete"]), row["sourceKind"], row["evidenceDigest"], row["createdAt"],
            ))
        return row

    def submit(self, user, payload):
        if user.get("role") == "observer":
            raise PermissionError("Only verified participants can join the Live Match Room.")
        text = str((payload or {}).get("text") or "").strip()
        if not text or len(text) > 700:
            raise ValueError("Match Room messages must contain between 1 and 700 characters.")
        source_kind = str((payload or {}).get("sourceKind") or "fan_message")
        if source_kind not in {"fan_message", "accepted_rewrite"}:
            raise ValueError("Unknown Match Room message source.")
        with self.lock, self.connect() as db:
            row = self._record(db, user["id"], user["displayName"], text, source_kind)
        outcome = row["outcome"]
        fan_decision = {
            "messageId": row["messageId"],
            "outcome": outcome,
            "category": row["category"],
            "reason": row["reason"],
            "action": row["action"],
            "speechAct": row["speechAct"],
            "target": row["targetClass"],
            "mechanism": row["mechanism"],
            "profanityFunction": row["profanityFunction"],
            "riskBand": row["riskBand"],
            "deliveredToAthlete": row["deliveredToAthlete"],
            "evidenceDigest": row["evidenceDigest"],
            "intervention": (
                "Delivered live to the athlete inbox."
                if outcome == "clean"
                else "Paused before delivery. Keep the point and remove the personal attack."
                if outcome == "warning"
                else "Held privately for human context review."
                if outcome == "review"
                else "Blocked before the athlete could receive it."
            ),
            "originalReturned": False,
        }
        return {"fanDecision": fan_decision, "room": self.summary(), "externalMessageSent": False}

    def update_preferences(self, user, payload):
        payload = payload or {}
        shield = str(payload.get("shieldLevel") or "")
        digest = str(payload.get("digestMode") or "")
        replies = str(payload.get("repliesMode") or "")
        if shield not in {"balanced", "heightened", "maximum"}:
            raise ValueError("Shield level must be balanced, heightened or maximum.")
        if digest not in {"live", "quiet", "post_match"}:
            raise ValueError("Digest mode must be live, quiet or post_match.")
        if replies not in {"all_verified", "following_only", "mentions_only"}:
            raise ValueError("Reply mode is not supported.")
        with self.lock, self.connect() as db:
            db.execute("""UPDATE live_match_state SET shield_level=?,digest_mode=?,replies_mode=?,
                updated_by=?,updated_at=? WHERE match_id=?""",
                (shield, digest, replies, user["id"], now_iso(), MATCH_ID))
        return {"room": self.summary(), "automaticAccountAction": False, "auditRecorded": True}

    def reset(self, moderator_id):
        with self.lock, self.connect() as db:
            db.execute("DELETE FROM live_match_messages WHERE match_id=?", (MATCH_ID,))
            db.execute("""UPDATE live_match_state SET shield_level='heightened',digest_mode='quiet',
                replies_mode='all_verified',updated_by=?,updated_at=? WHERE match_id=?""",
                (moderator_id, now_iso(), MATCH_ID))
            for fixture in SEED_MESSAGES:
                self._record(db, "seed-account", fixture["author"], fixture["text"], fixture["source"])
        return self.summary()

    @staticmethod
    def _crowd_state(messages):
        recent = messages[-10:]
        harmful = [row for row in recent if row["outcome"] != "clean"]
        blocks = [row for row in recent if row["outcome"] == "block"]
        ratio = len(harmful) / max(1, len(recent))
        score = min(100, round(14 + ratio * 58 + len(blocks) * 9))
        if score >= 80:
            status, friction, delay = "critical surge", "safety lock", 8
        elif score >= 60:
            status, friction, delay = "hostility rising", "slow mode", 5
        elif score >= 35:
            status, friction, delay = "watching closely", "context pause", 2
        else:
            status, friction, delay = "healthy conversation", "normal flow", 0
        return {
            "score": score,
            "status": status,
            "friction": friction,
            "replyDelaySeconds": delay,
            "window": len(recent),
            "harmfulSignals": len(harmful),
            "probabilityClaim": False,
            "meaning": "Conversation-pressure routing signal, not a prediction of individual behaviour.",
        }

    def summary(self):
        with self.lock, self.connect() as db:
            state = dict(db.execute("SELECT * FROM live_match_state WHERE match_id=?", (MATCH_ID,)).fetchone())
            rows = [dict(row) for row in db.execute(
                "SELECT * FROM live_match_messages WHERE match_id=? ORDER BY sequence_no", (MATCH_ID,)
            )]
        messages = []
        for row in rows:
            messages.append({
                "messageId": row["message_id"], "sequence": row["sequence_no"],
                "authorDisplay": row["author_display"], "safePreview": row["safe_preview"],
                "outcome": row["outcome"], "category": row["category"],
                "mechanism": row["mechanism"], "speechAct": row["speech_act"],
                "targetClass": row["target_class"], "profanityFunction": row["profanity_function"],
                "riskBand": row["risk_band"], "deliveredToAthlete": bool(row["delivered_to_athlete"]),
                "sourceKind": row["source_kind"], "evidenceDigest": row["evidence_digest"],
                "createdAt": row["created_at"],
            })
        counts = {
            "received": len(messages),
            "delivered": sum(row["outcome"] == "clean" for row in messages),
            "warnings": sum(row["outcome"] == "warning" for row in messages),
            "reviews": sum(row["outcome"] == "review" for row in messages),
            "blocks": sum(row["outcome"] == "block" for row in messages),
        }
        counts["withheld"] = counts["received"] - counts["delivered"]
        category_counts = {}
        for row in messages:
            if row["outcome"] != "clean":
                category_counts[row["category"]] = category_counts.get(row["category"], 0) + 1
        return {
            "version": MATCH_VERSION,
            "event": {
                "id": MATCH_ID, "name": "K1ND Centre Court Live", "sport": "Tennis",
                "round": "Quarter-final", "court": "Centre Court", "status": "LIVE SIMULATION",
                "score": {"player": "Mara Volkov", "opponent": "Sofia Reyes", "sets": "6–4 3–2", "server": "Mara Volkov"},
            },
            "athlete": {"id": "u_athlete", "displayName": "Mara Volkov", "handle": "@maravolkov", "protected": True},
            "preferences": {
                "shieldLevel": state["shield_level"], "digestMode": state["digest_mode"],
                "repliesMode": state["replies_mode"], "updatedBy": state["updated_by"], "updatedAt": state["updated_at"],
            },
            "counters": counts,
            "crowd": self._crowd_state(messages),
            "messages": messages[-14:],
            "athleteInbox": [row for row in messages if row["deliveredToAthlete"]][-8:],
            "shieldDigest": {
                "headline": f"{counts['withheld']} hostile or uncertain messages kept away from Mara",
                "categories": [{"category": key, "count": value} for key, value in sorted(category_counts.items())],
                "rawHostileContentShown": False,
                "wellbeingCopy": "Your inbox contains verified support and sporting conversation. Hostile originals stay out of view.",
            },
            "capabilities": {
                "serverAuthoritativeDecisions": True, "liveFanToAthleteComparison": True,
                "contextualProfanity": True, "sourceBackedRewriteRetry": True,
                "crowdPressureSignal": True, "personalShieldPreferences": True,
                "automaticAccountAction": False, "externalDelivery": False,
            },
            "boundaries": {
                "simulation": "The match, score and room participants are simulated. Decisions come from the active K1ND server safety engine.",
                "athletePrivacy": "Only allowed messages can contain readable content in the athlete view. Intercepted originals are not stored in the Match Room transcript.",
                "crowdSignal": "The crowd-pressure score is an explainable routing heuristic, not a probability or individual prediction.",
                "operations": "No account sanction, emergency action or external governing-body delivery occurs automatically.",
            },
        }
