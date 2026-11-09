// assets/js/store.js
// -----------------------------------------------------------------------------
// K1ND.world data store — product-transition browser prototype.
// Public demo content is mirrored to localStorage so a refresh does not wipe
// the experience. V4.19.0 hydrates profiles, posts and comments from the server;
// moderation evidence, sessions, cases, appeals and adjudications are enforced
// and stored by serve.py. Browser state cannot grant account permissions.
// -----------------------------------------------------------------------------

import { uid, avatarDataUri } from "./lib/util.js";
import { DEMO_PHOTOS } from "./lib/photos.js";
import { moderateContent } from "./moderation.js?v=4.24.1.brand1";

const LS_STATE = "k1nd_state_v4_15_authenticated_platform";

// ---- roles -----------------------------------------------------------------
export const ROLES = {
  OBSERVER: "observer",
  VERIFIED_ADULT: "verified_adult",
  VERIFIED_U18: "verified_u18",
  ADMIN: "admin",
};

// verificationStatus values: unverified | pending | verified_adult | verified_u18 | rejected

// The five identities the dev role-switcher can jump between. "Trusted Poster"
// is a Verified Adult who additionally has canPost = true.
export const SWITCHABLE = [
  { id: "u_observer",  label: "Observer" },
  { id: "u_adult",     label: "Verified Adult" },
  { id: "u_u18",       label: "Verified U18" },
  { id: "u_trusted",   label: "Trusted Poster" },
  { id: "u_admin",     label: "Admin" },
];

// ---- seed ------------------------------------------------------------------
function iso(daysAgo = 0, hoursAgo = 0) {
  return new Date(Date.now() - (daysAgo * 24 + hoursAgo) * 3600 * 1000).toISOString();
}

function buildSeed() {
  const profiles = [
    // --- switchable demo identities ---
    {
      id: "u_observer", displayName: "Sam Rivera",
      avatarUrl: avatarDataUri("SR", 20), role: ROLES.OBSERVER,
      verificationStatus: "unverified", canPost: false, trustScore: 0,
      handle: "samrivera", bio: "Tennis fan, weekend player and K1ND.world observer.", location: "London", favouriteSport: "Tennis", baseFollowers: 18,
      createdAt: iso(30),
    },
    {
      id: "u_adult", displayName: "Priya Anand",
      avatarUrl: avatarDataUri("PA", 174), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: false, trustScore: 68,
      handle: "priyaanand", bio: "Grass-court obsessive. Here for thoughtful match analysis and good conversation.", location: "Birmingham", favouriteSport: "Tennis", baseFollowers: 164,
      createdAt: iso(26),
    },
    {
      id: "u_u18", displayName: "Noah Kim",
      avatarUrl: avatarDataUri("NK", 210), role: ROLES.VERIFIED_U18,
      verificationStatus: "verified_u18", canPost: false, trustScore: 54,
      handle: "noahk", bio: "Junior tennis player learning, watching and supporting the tour.", location: "Manchester", favouriteSport: "Tennis", baseFollowers: 91,
      createdAt: iso(21),
    },
    {
      id: "u_trusted", displayName: "Elena Duarte",
      avatarUrl: avatarDataUri("ED", 158), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 92,
      handle: "elenaduarte", bio: "Tennis writer covering the human stories behind the scoreline.", location: "Madrid", favouriteSport: "Tennis", baseFollowers: 2480,
      createdAt: iso(40),
    },
    {
      id: "u_admin", displayName: "Jordan Blake",
      avatarUrl: avatarDataUri("JB", 268), role: ROLES.ADMIN,
      verificationStatus: "verified_adult", canPost: true, trustScore: 100,
      handle: "jordanblake", bio: "K1ND.world community moderator. Safety, fairness and accountability by design.", location: "London", favouriteSport: "Multi-sport", baseFollowers: 340,
      createdAt: iso(60),
    },
    // --- extra fictional identities for feed variety ---
    {
      id: "u_athlete", displayName: "Mara Volkov",
      avatarUrl: avatarDataUri("MV", 340), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 97,
      handle: "maravolkov", bio: "Left-handed baseline grinder chasing a first Slam. Known for marathon three-setters and a ferocious return.", location: "On tour", favouriteSport: "Tennis",
      createdAt: iso(120), isAthlete: true, baseFollowers: 24500,
    },
    {
      id: "u_coach", displayName: "Theo Marsh",
      avatarUrl: avatarDataUri("TM", 44), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 88,
      handle: "theomarsh", bio: "Performance coach. Serve mechanics, decision-making and the work behind match day.", location: "Bath", favouriteSport: "Tennis", baseFollowers: 6120,
      createdAt: iso(75),
    },
    {
      id: "u_fan", displayName: "Amira Hassan",
      avatarUrl: avatarDataUri("AH", 300), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 71,
      handle: "amirahassan", bio: "Travelling fan, amateur doubles player and unapologetic backhand enthusiast.", location: "Leeds", favouriteSport: "Tennis", baseFollowers: 486,
      createdAt: iso(18),
    },
    {
      id: "u_tennisdesk", displayName: "K1ND.world Tennis Desk",
      avatarUrl: avatarDataUri("K1", 166), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 95,
      handle: "k1ndtennis", bio: "Analysis, match context and constructive tennis conversation from the K1ND.world desk.", location: "Global", favouriteSport: "Tennis", baseFollowers: 12800,
      createdAt: iso(90),
    },
    {
      id: "u_footballer", displayName: "Aisha Okafor",
      avatarUrl: avatarDataUri("AO", 236), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 96,
      handle: "aishaokafor", bio: "Professional footballer. Big games, recovery days and the work nobody sees.", location: "London", favouriteSport: "Football", baseFollowers: 31800,
      createdAt: iso(110), isAthlete: true,
    },
    {
      id: "u_rugby", displayName: "Jonah Reed",
      avatarUrl: avatarDataUri("JR", 12), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 89,
      handle: "jonahreed", bio: "Rugby analyst. Tactics, set piece and the human side of performance.", location: "Cardiff", favouriteSport: "Rugby", baseFollowers: 8400,
      createdAt: iso(70),
    },
    {
      id: "u_motorsport", displayName: "Leila Hart",
      avatarUrl: avatarDataUri("LH", 330), role: ROLES.VERIFIED_ADULT,
      verificationStatus: "verified_adult", canPost: true, trustScore: 91,
      handle: "leilahart", bio: "Motorsport reporter covering racing, engineering and the people behind the visor.", location: "Global", favouriteSport: "Motorsport", baseFollowers: 12600,
      createdAt: iso(83),
    },
    {
      id: "u_pending", displayName: "Riley Chen",
      avatarUrl: avatarDataUri("RC", 120), role: ROLES.OBSERVER,
      verificationStatus: "pending", canPost: false, trustScore: 0,
      handle: "rileychen", bio: "New to K1ND.world and completing verification.", location: "London", favouriteSport: "Tennis", baseFollowers: 6,
      createdAt: iso(0, 4),
    },
    {
      id: "u_review", displayName: "Deniz Aydın",
      avatarUrl: avatarDataUri("DA", 90), role: ROLES.OBSERVER,
      verificationStatus: "pending", canPost: false, trustScore: 0,
      handle: "denizaydin", bio: "Tennis supporter awaiting account review.", location: "Istanbul", favouriteSport: "Tennis", baseFollowers: 11,
      createdAt: iso(0, 9),
    },
  ];

  const posts = [
    {
      id: "p1", authorId: "u_athlete",
      content:
        "Three hours on court in that heat and we found a way. Thank you to everyone who stayed to the last point — I felt it. On to the quarters.",
      sport: "tennis", imageUrl: DEMO_PHOTOS.ball, imageAlt: "Close-up of a tennis ball resting on a hard court", photoKey: "ball", moderationStatus: "clean", createdAt: iso(0, 2),
    },
    {
      id: "p2", authorId: "u_coach",
      content:
        "The second-serve numbers tell the whole story today: 71% won behind it. That is what months of work looks like under pressure.",
      sport: "tennis", imageUrl: DEMO_PHOTOS.clay, imageAlt: "White tennis court lines crossing on red clay", photoKey: "clay", moderationStatus: "clean", createdAt: iso(0, 5),
    },
    {
      id: "p3", authorId: "u_trusted",
      content:
        "Tough draw for Volkov next round, but honestly the way she's returning right now I wouldn't bet against her.",
      sport: "tennis", moderationStatus: "clean", createdAt: iso(0, 9),
    },
    {
      id: "p4", authorId: "u_fan",
      content:
        "First time watching live and the atmosphere on the show court is unreal. Respect to both players — that was a battle.",
      sport: "tennis", imageUrl: DEMO_PHOTOS.stadium, imageAlt: "Wide view of an outdoor tennis stadium during a match", photoKey: "stadium", moderationStatus: "clean", createdAt: iso(1, 1),
    },
    {
      id: "p5", authorId: "u_athlete",
      content:
        "Recovery day. Ice, physio, and a lot of gratitude. The messages after last night's match meant more than you know.",
      sport: "tennis", moderationStatus: "clean", createdAt: iso(1, 6),
    },
    {
      id: "p6", authorId: "u_coach",
      content:
        "Reminder that a bad line call is part of the game. Disagree loudly, sure — but the umpire is doing a hard job in real time.",
      sport: "tennis", moderationStatus: "clean", createdAt: iso(2, 3),
    },
    {
      id: "p7", authorId: "u_tennisdesk",
      content:
        "Backhand detail: the preparation is finished before the bounce. That early shoulder turn is what buys time under pressure.",
      sport: "tennis", imageUrl: DEMO_PHOTOS.action,
      imageAlt: "Tennis player striking a backhand during a professional match on a blue hard court",
      photoKey: "action", moderationStatus: "clean", createdAt: iso(1, 10),
    },
    {
      id: "p8", authorId: "u_footballer",
      content: "Tough result, but the analysis starts with us. We were too slow moving the ball after half-time. Back to work tomorrow.",
      sport: "football", moderationStatus: "clean", createdAt: iso(0, 4),
    },
    {
      id: "p9", authorId: "u_rugby",
      content: "That final defensive set was outstanding. You can disagree with the referee and still keep the conversation about the decision, not the person.",
      sport: "rugby", moderationStatus: "clean", createdAt: iso(0, 11),
    },
    {
      id: "p10", authorId: "u_motorsport",
      content: "A brave strategy call that did not pay off today. Criticise the decision all you like; abuse of drivers and team staff adds nothing to the debate.",
      sport: "motorsport", moderationStatus: "clean", createdAt: iso(1, 3),
    },
  ];

  const comments = [
    {
      id: "c1", postId: "p1", authorId: "u_adult",
      content: "Absolute warrior performance. Enjoy the recovery!",
      moderationStatus: "clean", createdAt: iso(0, 1),
    },
    {
      id: "c2", postId: "p1", authorId: "u_u18",
      content: "Best match I've watched all tournament. Let's go!",
      moderationStatus: "clean", createdAt: iso(0, 1),
    },
    {
      id: "c3", postId: "p3", authorId: "u_fan",
      content: "Agreed — that backhand return is a weapon right now.",
      moderationStatus: "clean", createdAt: iso(0, 7),
    },
    {
      id: "c4", postId: "p6", authorId: "u_adult",
      content: "Needed to hear this. Easy to forget there's a human out there.",
      moderationStatus: "clean", createdAt: iso(2, 2),
    },
    {
      id: "c5", postId: "p2", authorId: "u_fan",
      content: "I strongly disagree with that call and don't think the umpire got it right.",
      moderationStatus: "rewritten", createdAt: iso(0, 3),
    },
    {
      id: "c6", postId: "p4", authorId: "u_coach",
      content: "Tough performance today — I hope you come back stronger next match.",
      moderationStatus: "rewritten", createdAt: iso(1, 2),
    },
    {
      id: "c7", postId: "p2", parentId: "c5", authorId: "u_coach",
      content: "Fair criticism of the call. I read the angle differently, but that's the debate we want.",
      moderationStatus: "clean", createdAt: iso(0, 2),
    },
    {
      id: "c8", postId: "p4", parentId: "c6", authorId: "u_fan",
      content: "Exactly. Tough analysis without turning it into an attack on the player.",
      moderationStatus: "clean", createdAt: iso(1, 1),
    },
  ];

  const likes = [
    { id: "l1", userId: "u_observer", postId: "p1", createdAt: iso(0, 1) },
    { id: "l2", userId: "u_adult",    postId: "p1", createdAt: iso(0, 1) },
    { id: "l3", userId: "u_u18",      postId: "p1", createdAt: iso(0, 1) },
    { id: "l4", userId: "u_fan",      postId: "p2", createdAt: iso(0, 4) },
    { id: "l5", userId: "u_adult",    postId: "p3", createdAt: iso(0, 8) },
    { id: "l6", userId: "u_observer", postId: "p5", createdAt: iso(1, 5) },
  ];

  const reposts = [
    { id: "rp1", userId: "u_adult", postId: "p1", createdAt: iso(0, 1) },
    { id: "rp2", userId: "u_fan", postId: "p8", createdAt: iso(0, 3) },
    { id: "rp3", userId: "u_trusted", postId: "p9", createdAt: iso(0, 8) },
    { id: "rp4", userId: "u_coach", postId: "p10", createdAt: iso(1, 2) },
  ];

  const reports = [
    {
      id: "r1", reporterId: "u_adult", targetType: "comment", targetId: "c5",
      reason: "Possible targeting of the match official", status: "open", createdAt: iso(0, 2),
    },
    {
      id: "r2", reporterId: "u_fan", targetType: "comment", targetId: "c6",
      reason: "Possible personal criticism of the player", status: "open", createdAt: iso(1, 1),
    },
    {
      id: "r3", reporterId: "u_u18", targetType: "comment", targetId: "c5",
      reason: "Aggressive language", status: "reviewed", createdAt: iso(3, 1),
    },
  ];

  // Baseline moderation history so dashboards aren't empty before the live
  // demo. New events append here as you test moderation in Stage 4+.
  const moderationEvents = [
    { id: "m1", userId: "u_fan",     contentType: "comment", originalText: "The umpire is a corrupt idiot.", eventType: "warning", reason: "Insult / aggressive tone", createdAt: iso(1, 2) },
    { id: "m2", userId: "u_fan",     contentType: "comment", originalText: "The umpire is a corrupt idiot.", eventType: "rewrite_accepted", reason: "User accepted safer rewrite", createdAt: iso(1, 2) },
    { id: "m3", userId: "u_adult",   contentType: "comment", originalText: "What a stupid shot under pressure.", eventType: "warning", reason: "Insulting phrasing", createdAt: iso(2, 5) },
    { id: "m4", userId: "u_observer",contentType: "comment", originalText: "[hard-blocked slur]", eventType: "block", reason: "Slur / discriminatory abuse", createdAt: iso(2, 8) },
    { id: "m5", userId: "u_trusted", contentType: "post",    originalText: "You were useless today, never play again.", eventType: "warning", reason: "Personal abuse", createdAt: iso(3, 4) },
    { id: "m6", userId: "u_observer",contentType: "comment", originalText: "[hard-blocked address]", eventType: "block", reason: "Address / doxxing pattern", createdAt: iso(3, 9) },
    { id: "m7", userId: "u_adult",   contentType: "comment", originalText: "Go back to where you came from.", eventType: "block", reason: "Discriminatory abuse", createdAt: iso(4, 2) },
    { id: "m8", userId: "u_fan",     contentType: "comment", originalText: "Great effort, gutted it didn't go your way.", eventType: "clean", reason: "Allowed", createdAt: iso(0, 3) },
    { id: "m9", userId: "u_observer",contentType: "comment", originalText: "[hard-blocked phone number]", eventType: "block", reason: "Phone number / personal contact information", createdAt: iso(1, 8) },
  ];

  // ~30 days of historical moderation activity so the investor dashboard has
  // depth. Deterministic (not random) so the demo is stable. Attributed only to
  // users who can actually comment.
  const historyUsers = ["u_fan", "u_adult", "u_trusted", "u_u18", "u_coach"];
  const history = [];
  let hn = 0;
  const pushEv = (userId, eventType, reason, daysAgo, hr) =>
    history.push({ id: "mh" + (hn++), userId, contentType: "comment", originalText: "(historical demo event)", eventType, reason, createdAt: iso(daysAgo, hr) });
  for (let d = 30; d >= 1; d--) {
    const u = (i) => historyUsers[(d + i) % historyUsers.length];
    const warnings = (d * 7) % 4;        // 0..3
    const blocks = (d * 3) % 3 === 0 ? 1 : 0;
    const rewrites = (d * 5) % 3 === 0 ? 1 : 0;
    const cleans = 2 + ((d * 11) % 5);    // 2..6
    for (let i = 0; i < warnings; i++) pushEv(u(i), "warning", "Personal abuse / aggressive tone", d, i);
    for (let i = 0; i < blocks; i++) pushEv(u(i + 1), "block", "Slur / hate speech", d, i + 2);
    for (let i = 0; i < rewrites; i++) pushEv(u(i), "rewrite_accepted", "Accepted safer rewrite", d, i + 3);
    for (let i = 0; i < cleans; i++) pushEv(u(i + 2), "clean", "Allowed", d, i + 4);
  }
  moderationEvents.push(...history);

  // Borderline content is hidden from the feed until a moderator decides.
  // This seeded example makes the enhanced-review workflow visible immediately.
  const reviewQueue = [
    {
      id: "er1", userId: "u_fan", contentType: "comment", postId: "p1",
      text: "You fixed that match and took a bribe.",
      reason: "Serious unverified integrity allegation", category: "integrity_allegation",
      status: "pending", createdAt: iso(0, 1),
    },
  ];
  moderationEvents.push({
    id: "m_review_seed", userId: "u_fan", contentType: "comment",
    originalText: "You fixed that match and took a bribe.", eventType: "review_submitted",
    reason: "Serious unverified integrity allegation", createdAt: iso(0, 1),
  });
  moderationEvents.push(
    { id:"mg1", userId:"u_fan", contentType:"comment", originalText:"(targeted intervention evidence)", eventType:"warning", reason:"Personal attack at the same athlete", context:{ postId:"p2", targetUserId:"u_athlete", targetRole:"professional athlete", riskBand:"elevated" }, createdAt:iso(8, 2) },
    { id:"mg2", userId:"u_fan", contentType:"comment", originalText:"(targeted intervention evidence)", eventType:"warning", reason:"Repeat targeting across a second thread", context:{ postId:"p8", targetUserId:"u_athlete", targetRole:"professional athlete", riskBand:"high" }, createdAt:iso(5, 2) },
    { id:"mg3", userId:"u_fan", contentType:"comment", originalText:"(targeted intervention evidence)", eventType:"review_required", reason:"Cross-thread repeat targeting held for review", context:{ postId:"p11", targetUserId:"u_athlete", targetRole:"professional athlete", riskBand:"high" }, createdAt:iso(2, 2) }
  );

  const verificationEvents = [
    { id: "v1", userId: "u_adult",   provider: "simulated", status: "verified_adult", referenceId: "DEMO-AD-1042", createdAt: iso(26) },
    { id: "v2", userId: "u_u18",     provider: "simulated", status: "verified_u18",   referenceId: "DEMO-YU-2210", createdAt: iso(21) },
    { id: "v3", userId: "u_trusted", provider: "simulated", status: "verified_adult", referenceId: "DEMO-AD-0087", createdAt: iso(40) },
    { id: "v4", userId: "u_pending", provider: "simulated", status: "pending",        referenceId: "DEMO-PD-5581", createdAt: iso(0, 4) },
  ];

  const follows = [
    { id: "fw1", followerId: "u_fan", targetId: "u_athlete", createdAt: iso(12) },
    { id: "fw2", followerId: "u_adult", targetId: "u_athlete", createdAt: iso(9) },
    { id: "fw3", followerId: "u_u18", targetId: "u_athlete", createdAt: iso(5) },
    { id: "fw4", followerId: "u_observer", targetId: "u_tennisdesk", createdAt: iso(7) },
    { id: "fw5", followerId: "u_observer", targetId: "u_coach", createdAt: iso(6) },
    { id: "fw6", followerId: "u_adult", targetId: "u_trusted", createdAt: iso(8) },
    { id: "fw7", followerId: "u_adult", targetId: "u_tennisdesk", createdAt: iso(7) },
    { id: "fw8", followerId: "u_trusted", targetId: "u_athlete", createdAt: iso(11) },
    { id: "fw9", followerId: "u_trusted", targetId: "u_coach", createdAt: iso(10) },
    { id: "fw10", followerId: "u_coach", targetId: "u_athlete", createdAt: iso(15) },
    { id: "fw11", followerId: "u_coach", targetId: "u_tennisdesk", createdAt: iso(14) },
    { id: "fw12", followerId: "u_fan", targetId: "u_trusted", createdAt: iso(4) },
    { id: "fw13", followerId: "u_fan", targetId: "u_tennisdesk", createdAt: iso(4) },
    { id: "fw14", followerId: "u_tennisdesk", targetId: "u_athlete", createdAt: iso(20) },
    { id: "fw15", followerId: "u_admin", targetId: "u_athlete", createdAt: iso(30) },
  ];

  const languageCandidates = [];
  const redTeamCases = [];
  const policyLearnings = [];
  const appeals = [{
    id:"ap1", userId:"u_fan", moderationEventId:"m1",
    statement:"I was criticising the line call and want the decision checked in context.",
    originalOutcome:"warning", originalCategory:"personal_abuse", status:"pending", createdAt:iso(0, 2),
  }];
  const adjudications = [];

  return {
    profiles, posts, comments, likes, reposts, reports, moderationEvents, reviewQueue, verificationEvents, follows,
    languageCandidates, redTeamCases, policyLearnings, appeals, adjudications,
    demoMeta: { startedAt: new Date().toISOString() },
  };
}

// ---- persistence -----------------------------------------------------------
let state = null;

function load() {
  try {
    const raw = localStorage.getItem(LS_STATE);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* fall through to seed */ }
  return buildSeed();
}
function persist() {
  try { localStorage.setItem(LS_STATE, JSON.stringify(state)); } catch (_) {}
}

state = load();
// Backfill collections added in later stages so older saved state stays valid.
["profiles", "posts", "comments", "likes", "reposts", "reports", "moderationEvents", "reviewQueue", "verificationEvents", "follows", "languageCandidates", "redTeamCases", "policyLearnings", "appeals", "adjudications"]
  .forEach((k) => { if (!Array.isArray(state[k])) state[k] = []; });
if (!state.demoMeta || !state.demoMeta.startedAt) state.demoMeta = { startedAt: new Date().toISOString() };

let currentUserId = "u_observer";
let serverAuthenticated = false;

// ---- subscription (so UI re-renders on any change) -------------------------
const listeners = new Set();
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { persist(); listeners.forEach((fn) => fn()); }

// ---- read helpers ----------------------------------------------------------
export function getState() { return state; }
export function getProfile(id) { return state.profiles.find((p) => p.id === id) || null; }
export function getProfileByHandle(handle) { return state.profiles.find((p) => p.handle === String(handle || "").replace(/^@/, "")) || null; }
export function profilePath(profileOrId) {
  const profile = typeof profileOrId === "string" ? getProfile(profileOrId) : profileOrId;
  return `/user/${encodeURIComponent(profile?.handle || profile?.id || "unknown")}`;
}
export function currentUser() { return getProfile(currentUserId) || state.profiles[0]; }

// This is the seam a real auth provider replaces later.
export function useCurrentUser() { return currentUser(); }

export function isServerAuthenticated() { return serverAuthenticated; }

export function hydrateServerPlatform(payload = {}) {
  if (Array.isArray(payload.profiles) && payload.profiles.length) {
    state.profiles = payload.profiles.map((profile) => {
      if (profile.id !== "u_tennisdesk") return profile;
      return {
        ...profile,
        displayName: profile.displayName === "K1ND Tennis Desk" ? "K1ND.world Tennis Desk" : profile.displayName,
        bio: profile.bio === "Analysis, match context and constructive tennis conversation from the K1ND desk."
          ? "Analysis, match context and constructive tennis conversation from the K1ND.world desk." : profile.bio,
      };
    });
  }
  if (Array.isArray(payload.posts)) state.posts = payload.posts;
  if (Array.isArray(payload.comments)) state.comments = payload.comments;
  emit();
}

export function hydrateServerIdentity(user = null) {
  serverAuthenticated = !!user;
  if (user && !getProfile(user.id)) state.profiles.push(user);
  currentUserId = user?.id || "u_observer";
  emit();
}

export function setCurrentUser(id) {
  // Retained only for old demo fixtures. Server identity and permissions are
  // controlled by the signed session and cannot be changed from browser state.
  if (serverAuthenticated || id !== "u_observer") return;
  currentUserId = "u_observer";
}

// Profile editing is intentionally limited to public-facing fields. Handles and
// verification status are immutable in this MVP so links and identity state
// cannot be silently changed. All profile copy passes the same moderation gate
// as posts and comments before it is persisted.
export function updateProfile(userId, fields = {}) {
  const profile = getProfile(userId);
  if (!profile) return { ok: false, error: "User not found." };

  const next = {
    displayName: String(fields.displayName ?? profile.displayName).trim(),
    bio: String(fields.bio ?? profile.bio ?? "").trim(),
    location: String(fields.location ?? profile.location ?? "").trim(),
    favouriteSport: String(fields.favouriteSport ?? profile.favouriteSport ?? "").trim(),
  };

  if (next.displayName.length < 2 || next.displayName.length > 40) {
    return { ok: false, error: "Display name must be between 2 and 40 characters." };
  }
  if (next.bio.length > 180) return { ok: false, error: "Bio must be 180 characters or fewer." };
  if (next.location.length > 50) return { ok: false, error: "Location must be 50 characters or fewer." };
  if (next.favouriteSport.length > 30) return { ok: false, error: "Favourite sport must be 30 characters or fewer." };

  const decision = moderateContent([next.displayName, next.bio, next.location, next.favouriteSport].join(" "));
  if (decision.outcome !== "clean") {
    return { ok: false, error: "Profile text must pass safety checks before it can be saved.", decision };
  }

  Object.assign(profile, next);
  emit();
  return { ok: true, profile };
}

// ---- permission logic (enforced here, not just in the UI) ------------------
export function canComment(user = currentUser()) {
  return !!user && user.role !== ROLES.OBSERVER;
}
export function canPublish(user = currentUser()) {
  return !!user && user.canPost === true;
}
export function isAdmin(user = currentUser()) {
  return !!user && user.role === ROLES.ADMIN;
}

// ---- moderation seam -------------------------------------------------------
// Defence in depth: the UI runs live entry checks and a publication gate, and
// these write functions independently refuse anything that is not clean. The
// enhanced-review resolver is the only route that can publish a reviewed original.

// ---- write functions (permission-enforcing) --------------------------------
export function addLike(userId, postId) {
  // Everyone, including observers, may like.
  const exists = state.likes.find((l) => l.userId === userId && l.postId === postId);
  if (exists) return { ok: true, alreadyLiked: true };
  state.likes.push({ id: uid("l"), userId, postId, createdAt: new Date().toISOString() });
  emit();
  return { ok: true };
}
export function removeLike(userId, postId) {
  const before = state.likes.length;
  state.likes = state.likes.filter((l) => !(l.userId === userId && l.postId === postId));
  if (state.likes.length !== before) emit();
  return { ok: true };
}

export function toggleRepost(user, postId) {
  if (!canComment(user)) return { ok: false, error: "Become verified to repost." };
  const i = state.reposts.findIndex((r) => r.userId === user.id && r.postId === postId);
  if (i >= 0) state.reposts.splice(i, 1);
  else state.reposts.push({ id: uid("rp"), userId: user.id, postId, createdAt: new Date().toISOString() });
  emit();
  return { ok: true, reposted: i < 0 };
}

// ---- follows ---------------------------------------------------------------
export function isFollowing(userId, targetId) {
  return state.follows.some((f) => f.followerId === userId && f.targetId === targetId);
}
export function getFollowerCount(targetId) {
  const base = getProfile(targetId)?.baseFollowers || 0;
  return base + state.follows.filter((f) => f.targetId === targetId).length;
}
export function getFollowingCount(userId) {
  return state.follows.filter((f) => f.followerId === userId).length;
}
export function getFollowers(targetId) {
  return state.follows
    .filter((f) => f.targetId === targetId)
    .map((f) => getProfile(f.followerId))
    .filter(Boolean);
}
export function getFollowing(userId) {
  return state.follows
    .filter((f) => f.followerId === userId)
    .map((f) => getProfile(f.targetId))
    .filter(Boolean);
}
export function toggleFollow(userId, targetId) {
  if (!getProfile(userId) || !getProfile(targetId)) return { ok: false, error: "User not found." };
  if (userId === targetId) return { ok: false, error: "You cannot follow yourself." };
  const i = state.follows.findIndex((f) => f.followerId === userId && f.targetId === targetId);
  if (i >= 0) state.follows.splice(i, 1);
  else state.follows.push({ id: uid("fw"), followerId: userId, targetId, createdAt: new Date().toISOString() });
  emit();
  return { ok: true, following: i < 0 };
}

function profileContext(profile) {
  if (!profile) return null;
  return {
    id:profile.id,
    handle:profile.handle,
    role:profile.role,
    isAthlete:!!profile.isAthlete,
    isU18:profile.role === ROLES.VERIFIED_U18 || profile.verificationStatus === "verified_u18",
  };
}

// Builds the smallest useful conversation envelope for the moderation engine.
// Raw private history is not copied into public content; only the live thread,
// participant roles and prior decision metadata needed for cumulative-risk
// assessment are supplied at decision time.
export function getConversationEnvelope({ postId, parentId = null, currentAuthorId = null } = {}) {
  const post = state.posts.find((item) => item.id === postId) || null;
  const parent = parentId ? state.comments.find((item) => item.id === parentId) || null : null;
  const replyTarget = profileContext(parent ? getProfile(parent.authorId) : null);
  const postAuthor = profileContext(post ? getProfile(post.authorId) : null);
  const targetProfile = replyTarget || postAuthor;
  const publicHistory = state.comments
    .filter((item) => item.postId === postId && item.moderationStatus !== "removed")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-8)
    .map((item) => ({
      text:item.content,
      authorId:item.authorId,
      targetUserId:item.moderationEvidence?.targetUserId || null,
      outcome:"clean",
      createdAt:item.createdAt,
    }));
  const priorTargetedInterventions = targetProfile?.id ? state.moderationEvents
    .filter((item) => item.context?.targetUserId === targetProfile.id && ["warning", "review_required", "block"].includes(item.eventType))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    .slice(-8)
    .map((item) => ({ authorId:item.userId, outcome:item.context?.outcome || item.eventType, createdAt:item.createdAt })) : [];

  return {
    isReply:!!parent,
    parentText:parent?.content || "",
    parentAuthorId:parent?.authorId || null,
    parentTargetUserId:parent?.moderationEvidence?.targetUserId || null,
    replyTarget,
    postAuthor,
    athleteTarget:!!targetProfile?.isAthlete,
    currentAuthorId,
    knownProfiles:state.profiles.map(profileContext),
    conversationHistory:publicHistory,
    priorTargetedInterventions,
    thread:{ postId, parentId, turnsConsidered:publicHistory.length },
  };
}

function moderationEvidence(result, envelope = {}, serverReceipt = null) {
  const context = result?.analysis?.contextAssessment;
  const evidence = context ? {
    engineVersion:context.version,
    targetUserId:context.targetAudience?.profileId || envelope?.replyTarget?.id || envelope?.postAuthor?.id || null,
    targetRole:context.targetAudience?.role || "participant role unknown",
    targetIsAthlete:!!context.targetAudience?.athlete,
    targetIsU18:!!context.targetAudience?.under18,
    speechAct:context.speechAct,
    targetScope:context.targetScope,
    riskBand:context.riskBand,
    riskScore:context.riskScore,
    turnsConsidered:context.conversation?.historyTurns || 0,
    cumulativeSignals:context.conversation?.recentTargetedInterventions || 0,
  } : {};
  if (serverReceipt?.receiptId) {
    evidence.serverReceipt = {
      id:serverReceipt.receiptId,
      signature:serverReceipt.signature,
      policyVersion:serverReceipt.policyVersion,
      createdAt:serverReceipt.createdAt,
      durable:serverReceipt.durable === true,
      publicationId:serverReceipt.publicationId || null,
      publicationAuthorized:serverReceipt.publicationAuthorized === true,
    };
  }
  return Object.keys(evidence).length ? evidence : null;
}

export function addComment(user, postId, content, moderationStatus = "clean", parentId = null, moderationMeta = {}) {
  if (!canComment(user)) return { ok: false, error: "Only verified users can comment." };
  if (moderationStatus !== "approved_after_review" && (!moderationMeta.serverReceipt?.receiptId || !moderationMeta.serverReceipt?.publicationId || moderationMeta.serverReceipt?.publicationAuthorized !== true)) {
    return { ok:false, error:"A server-verified publication authorization is required before publication." };
  }
  const envelope = moderationMeta.conversationContext || getConversationEnvelope({ postId, parentId, currentAuthorId:user.id });
  const decision = moderateContent(content, envelope);
  if (decision.outcome !== "clean") {
    return { ok: false, error: "Content must pass pre-publication moderation before it can be stored publicly.", decision };
  }
  const row = moderationMeta.serverReceipt?.publicationRecord;
  if (!row || row.authorId !== user.id || row.postId !== postId || row.content !== content) {
    return { ok:false, error:"The server did not return an authoritative matching comment." };
  }
  state.comments.push(row);
  emit();
  return { ok: true, comment: row };
}

export function addPost(user, content, opts = {}) {
  if (!canPublish(user)) return { ok: false, error: "Posting access is invite-only for trusted users." };
  if (opts.moderationStatus !== "approved_after_review" && (!opts.serverReceipt?.receiptId || !opts.serverReceipt?.publicationId || opts.serverReceipt?.publicationAuthorized !== true)) {
    return { ok:false, error:"A server-verified publication authorization is required before publication." };
  }
  const decision = moderateContent(content);
  if (decision.outcome !== "clean") {
    return { ok: false, error: "Content must pass pre-publication moderation before it can be stored publicly.", decision };
  }
  const row = opts.serverReceipt?.publicationRecord;
  if (!row || row.authorId !== user.id || row.content !== content) {
    return { ok:false, error:"The server did not return an authoritative matching post." };
  }
  state.posts.push(row);
  emit();
  return { ok: true, post: row };
}

export function addReport(user, targetType, targetId, reason) {
  if (!user) return { ok: false, error: "Sign in to report." };
  state.reports.push({
    id: uid("r"), reporterId: user.id, targetType, targetId, reason,
    status: "open", createdAt: new Date().toISOString(),
  });
  persist(); // silent: admin queue reads this on its next render
  return { ok: true };
}

export function logModerationEvent(userId, contentType, originalText, eventType, reason, context = null) {
  state.moderationEvents.push({
    id: uid("m"), userId, contentType, originalText, eventType, reason, context,
    createdAt: new Date().toISOString(),
  });
  persist(); // silent: the dashboard reads this on its next render
}

// Borderline content is stored in a non-public queue. Submission does not call
// addPost/addComment and therefore cannot appear in the feed by accident.
export function submitForEnhancedReview(user, payload = {}) {
  if (!user) return { ok: false, error: "Sign in to submit for review." };
  if (payload.contentType === "comment" && !canComment(user))
    return { ok: false, error: "Only verified users can comment." };
  if (payload.contentType === "post" && !canPublish(user))
    return { ok: false, error: "Posting access is invite-only for trusted users." };

  const row = {
    id: uid("er"), userId: user.id, contentType: payload.contentType,
    postId: payload.postId, parentId: payload.parentId || undefined, text: String(payload.text || "").trim(),
    sport: payload.sport || "tennis", imageUrl: payload.imageUrl,
    imageAlt: payload.imageAlt, photoKey: payload.photoKey,
    imageAnalysis: payload.imageAnalysis || null,
    reason: payload.reason || "Borderline content requires enhanced moderation",
    category: payload.category || "borderline", status: "pending",
    contextEvidence:payload.contextEvidence || null,
    createdAt: new Date().toISOString(),
  };
  state.reviewQueue.push(row);
  state.moderationEvents.push({
    id: uid("m"), userId: user.id, contentType: row.contentType,
    originalText: row.text, eventType: "review_submitted", reason: row.reason, context:row.contextEvidence,
    createdAt: row.createdAt,
  });
  emit();
  return { ok: true, review: row };
}

export function resolveEnhancedReview(admin, reviewId, decision) {
  if (!isAdmin(admin)) return { ok: false, error: "Admin only." };
  const row = state.reviewQueue.find((x) => x.id === reviewId);
  if (!row) return { ok: false, error: "Review item not found." };
  if (row.status !== "pending") return { ok: false, error: "This item has already been decided." };
  if (!['approved', 'rejected'].includes(decision)) return { ok: false, error: "Unknown decision." };

  row.status = decision;
  row.resolvedAt = new Date().toISOString();
  row.resolvedBy = admin.id;

  let published = null;
  if (decision === "approved") {
    if (row.contentType === "post") {
      published = {
        id: uid("p"), authorId: row.userId, content: row.text, sport: row.sport || "tennis",
        imageUrl: row.imageUrl, imageAlt: row.imageAlt, photoKey: row.photoKey,
        imageAnalysis: row.imageAnalysis, moderationStatus: "approved_after_review",
        createdAt: new Date().toISOString(),
      };
      state.posts.push(published);
    } else {
      published = {
        id: uid("c"), postId: row.postId, parentId: row.parentId || undefined, authorId: row.userId, content: row.text,
        moderationStatus: "approved_after_review", moderationEvidence:row.contextEvidence, createdAt: new Date().toISOString(),
      };
      state.comments.push(published);
    }
  }

  state.moderationEvents.push({
    id: uid("m"), userId: row.userId, contentType: row.contentType,
    originalText: row.text,
    eventType: decision === "approved" ? "review_approved" : "review_rejected",
    reason: decision === "approved" ? "Enhanced moderation approved publication" : "Enhanced moderation declined publication",
    createdAt: row.resolvedAt,
  });
  emit();
  return { ok: true, published };
}

// Admin-only mutations
export function updateReportStatus(user, reportId, status) {
  if (!isAdmin(user)) return { ok: false, error: "Admin only." };
  const r = state.reports.find((x) => x.id === reportId);
  if (r) { r.status = status; emit(); }
  return { ok: true };
}
export function setModerationStatus(user, contentType, id, status) {
  if (!isAdmin(user)) return { ok: false, error: "Admin only." };
  const list = contentType === "post" ? state.posts : state.comments;
  const row = list.find((x) => x.id === id);
  if (row) { row.moderationStatus = status; emit(); }
  return { ok: true };
}
// Core verification transition (shared by the wizard and the admin override).
function applyVerification(targetUserId, status) {
  const p = getProfile(targetUserId);
  if (!p) return { ok: false, error: "No such user." };
  p.verificationStatus = status;
  if (status === "verified_adult") {
    p.role = ROLES.VERIFIED_ADULT;
  } else if (status === "verified_u18") {
    p.role = ROLES.VERIFIED_U18;
    p.canPost = false; // U18 restricted
  } else {
    // unverified | pending | rejected → non-participating
    if (p.role !== ROLES.ADMIN) { p.role = ROLES.OBSERVER; p.canPost = false; }
  }
  state.verificationEvents.push({
    id: uid("v"), userId: targetUserId, provider: "simulated", status,
    referenceId: "DEMO-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
    createdAt: new Date().toISOString(),
  });
  emit();
  return { ok: true };
}

// Self-service: the /verify wizard applying its own (simulated) result.
export function simulateVerification(targetUserId, status) {
  return applyVerification(targetUserId, status);
}

// Admin override — flip any user's status for demos.
export function setVerificationStatus(user, targetUserId, status) {
  if (!isAdmin(user)) return { ok: false, error: "Admin only." };
  return applyVerification(targetUserId, status);
}


// ---- behaviour / friction model -------------------------------------------
// Demo-only behavioural escalation is derived from interventions recorded since
// the last reset. Production would use a server-side policy engine, appeal path,
// rate limits and calibrated windows rather than trusting browser state.
export function getBehaviourProfile(userId) {
  const started = new Date(state.demoMeta?.startedAt || 0).getTime();
  const flagged = state.moderationEvents.filter((m) =>
    m.userId === userId &&
    new Date(m.createdAt).getTime() >= started &&
    ["warning", "review_required", "block"].includes(m.eventType)
  );
  const n = flagged.length;
  let stage = "standard";
  let label = "Standard participation";
  let message = "No recent interventions in this demo session.";
  if (n >= 3) {
    stage = "mandatory_review";
    label = "Enhanced safeguard";
    message = "Repeated harmful attempts mean new borderline content is held for moderator review.";
  } else if (n === 2) {
    stage = "reflection";
    label = "Reflection friction";
    message = "Repeated interventions trigger stronger friction before the next publication attempt.";
  } else if (n === 1) {
    stage = "nudge";
    label = "Safety nudge active";
    message = "The account has received a recent pre-publication intervention.";
  }
  return { count: n, stage, label, message, events: flagged };
}

export function seedBehaviourEscalation(userId, count = 2) {
  const user = getProfile(userId);
  if (!user) return { ok: false, error: "User not found." };
  const safeCount = Math.max(0, Math.min(3, Number(count) || 0));
  for (let i = 0; i < safeCount; i++) {
    state.moderationEvents.push({
      id: uid("m"), userId, contentType: "comment",
      originalText: "(demo repeat-behaviour event)", eventType: "warning",
      reason: "Demo behaviour escalation seed",
      createdAt: new Date(Date.now() + i).toISOString(),
    });
  }
  emit();
  return { ok: true, profile: getBehaviourProfile(userId) };
}

// ---- language operations --------------------------------------------------
// Candidate terms never become live rules from the browser. A production
// policy service would require native-language review, counterexamples, tests,
// approval and a versioned deployment before activation.
export function submitLanguageCandidate(admin, payload = {}) {
  if (!isAdmin(admin)) return { ok:false, error:"Admin only." };
  const language = String(payload.language || "").trim().slice(0, 60);
  const term = String(payload.term || "").trim().slice(0, 120);
  const meaning = String(payload.meaning || "").trim().slice(0, 240);
  const example = String(payload.example || "").trim().slice(0, 280);
  const proposedAction = ["warning", "review", "block"].includes(payload.proposedAction) ? payload.proposedAction : "review";
  if (!language || !term || !meaning || !example) return { ok:false, error:"Language, term, meaning and a targeted example are required." };
  const row = {
    id:uid("lc"), language, term, meaning, example, proposedAction,
    status:"native_review_required", submittedBy:admin.id, createdAt:new Date().toISOString(),
  };
  state.languageCandidates.push(row);
  emit();
  return { ok:true, candidate:row };
}

export function resolveLanguageCandidate(admin, candidateId, decision) {
  if (!isAdmin(admin)) return { ok:false, error:"Admin only." };
  const row = state.languageCandidates.find((item) => item.id === candidateId);
  if (!row) return { ok:false, error:"Candidate not found." };
  if (!["validated_for_test", "declined"].includes(decision)) return { ok:false, error:"Unknown decision." };
  row.status = decision;
  row.reviewedBy = admin.id;
  row.reviewedAt = new Date().toISOString();
  if (decision === "validated_for_test" && !state.policyLearnings.some((item) => item.sourceType === "language_candidate" && item.sourceId === row.id)) {
    state.policyLearnings.push({
      id:uid("learn"), sourceType:"language_candidate", sourceId:row.id,
      label:`${row.language} candidate`, expectedOutcome:row.proposedAction,
      evidence:"Native review completed; requires abusive, clean-context and evasion regression fixtures.",
      status:"awaiting_regression", createdAt:new Date().toISOString(),
    });
  }
  emit();
  return { ok:true, candidate:row };
}

const RED_TEAM_WITHHELD = new Set(["slur", "racial_slur", "identity_slur", "homophobic_slur", "severe_abuse", "sexual_abuse", "sexualised_family_abuse", "personal_contact", "doxxing", "discriminatory"]);

export function recordRedTeamCase(user, text, result, scenario = "standalone") {
  if (!user || !result) return { ok:false, error:"A signed-in demo identity and decision are required." };
  const raw = String(text || "").trim();
  if (!raw) return { ok:false, error:"Enter a test message first." };
  const withheld = result.outcome === "block" || RED_TEAM_WITHHELD.has(result.category);
  const context = result.analysis?.contextAssessment;
  const row = {
    id:uid("rt"), capturedBy:user.id,
    displayText:withheld ? "[prohibited test wording withheld]" : raw.slice(0, 280),
    contentWithheld:withheld,
    expectedOutcome:result.outcome, category:result.category, reason:result.reason,
    riskBand:context?.riskBand || "unknown", riskScore:context?.riskScore ?? null,
    targetRole:context?.targetAudience?.role || "unknown", scenario,
    status:"captured", createdAt:new Date().toISOString(),
  };
  state.redTeamCases.push(row);
  emit();
  return { ok:true, testCase:row };
}

export function resolveRedTeamCase(admin, caseId, decision) {
  if (!isAdmin(admin)) return { ok:false, error:"Admin only." };
  const row = state.redTeamCases.find((item) => item.id === caseId);
  if (!row) return { ok:false, error:"Red-team case not found." };
  if (!["promoted_to_regression", "dismissed"].includes(decision)) return { ok:false, error:"Unknown decision." };
  row.status = decision;
  row.reviewedBy = admin.id;
  row.reviewedAt = new Date().toISOString();
  if (decision === "promoted_to_regression" && !state.policyLearnings.some((item) => item.sourceType === "red_team" && item.sourceId === row.id)) {
    state.policyLearnings.push({
      id:uid("learn"), sourceType:"red_team", sourceId:row.id,
      label:`${row.scenario} · ${row.category}`, expectedOutcome:row.expectedOutcome,
      evidence:`Live probe promoted with ${row.riskBand} context risk; raw prohibited wording remains ${row.contentWithheld ? "withheld" : "available to authorised review"}.`,
      status:"awaiting_regression", createdAt:new Date().toISOString(),
    });
  }
  emit();
  return { ok:true, testCase:row };
}

export function resolvePolicyLearning(admin, learningId, decision) {
  if (!isAdmin(admin)) return { ok:false, error:"Admin only." };
  const row = state.policyLearnings.find((item) => item.id === learningId);
  if (!row) return { ok:false, error:"Learning item not found." };
  if (!["approved_for_next_pack", "needs_more_evidence", "rejected"].includes(decision)) return { ok:false, error:"Unknown decision." };
  row.status = decision;
  row.reviewedBy = admin.id;
  row.reviewedAt = new Date().toISOString();
  emit();
  return { ok:true, learning:row };
}

// ---- appeals and adjudication ---------------------------------------------
// Appeals do not erase the original audit event. They create a linked,
// inspectable adjudication and turn corrected decisions into regression work.
export function submitAppeal(user, moderationEventId, statement) {
  if (!user) return { ok:false, error:"Sign in to appeal a decision." };
  const event = state.moderationEvents.find((item) => item.id === moderationEventId && item.userId === user.id);
  if (!event || !["warning", "block", "review_rejected", "review_required"].includes(event.eventType)) return { ok:false, error:"That moderation decision is not available for appeal." };
  if (state.appeals.some((item) => item.userId === user.id && item.moderationEventId === event.id && item.status === "pending")) return { ok:false, error:"This decision already has a pending appeal." };
  const cleanStatement = String(statement || "").trim().slice(0, 600);
  if (cleanStatement.length < 12) return { ok:false, error:"Explain what context the moderator should reconsider." };
  const row = {
    id:uid("ap"), userId:user.id, moderationEventId:event.id, statement:cleanStatement,
    receiptId:event.context?.serverReceipt?.id || null,
    originalOutcome:event.eventType, originalCategory:event.context?.category || "not_recorded",
    status:"pending", durableStatus:"pending", createdAt:new Date().toISOString(),
  };
  state.appeals.push(row); emit(); return { ok:true, appeal:row };
}

export function markAppealDurability(appealId, status) {
  const appeal = state.appeals.find((item) => item.id === appealId);
  if (!appeal) return { ok:false, error:"Appeal not found." };
  appeal.durableStatus = ["stored", "unavailable"].includes(status) ? status : "pending";
  emit();
  return { ok:true, appeal };
}

export function resolveAppeal(admin, appealId, payload = {}) {
  if (!isAdmin(admin)) return { ok:false, error:"Admin only." };
  const appeal = state.appeals.find((item) => item.id === appealId);
  if (!appeal || appeal.status !== "pending") return { ok:false, error:"Pending appeal not found." };
  const decision = payload.decision;
  if (!["upheld", "overturned", "corrected"].includes(decision)) return { ok:false, error:"Choose an adjudication outcome." };
  const notes = String(payload.notes || "").trim().slice(0, 600);
  if (notes.length < 8) return { ok:false, error:"Record a short reason for the adjudication." };
  const correctedCategory = decision === "corrected" ? String(payload.correctedCategory || "context_error").trim().slice(0, 80) : null;
  const now = new Date().toISOString();
  appeal.status = decision; appeal.resolvedAt = now; appeal.resolvedBy = admin.id;
  const adjudication = { id:uid("adj"), appealId:appeal.id, moderatorId:admin.id, decision, correctedCategory, notes, createdAt:now };
  state.adjudications.push(adjudication);
  state.moderationEvents.push({ id:uid("m"), userId:appeal.userId, contentType:"appeal", originalText:"[appeal adjudication]", eventType:`appeal_${decision}`, reason:notes, context:{ appealId:appeal.id, correctedCategory }, createdAt:now });
  if (["overturned", "corrected"].includes(decision)) {
    state.policyLearnings.push({
      id:uid("learn"), sourceType:"appeal", sourceId:appeal.id,
      label:`Appeal ${decision}: ${correctedCategory || appeal.originalCategory}`,
      expectedOutcome:decision === "overturned" ? "clean" : correctedCategory,
      evidence:"Human adjudication disagreed with the first decision; add a matched harmful/benign regression pair before changing policy.",
      status:"awaiting_regression", createdAt:now,
    });
  }
  emit(); return { ok:true, appeal, adjudication };
}

export function getHarassmentGraph() {
  const rank = { warning:1, review_required:2, block:3 };
  const grouped = new Map();
  state.moderationEvents.filter((item) => rank[item.eventType] && item.context?.targetUserId).forEach((item) => {
    const key = `${item.userId}>${item.context.targetUserId}`;
    const row = grouped.get(key) || { authorId:item.userId, targetId:item.context.targetUserId, interventions:0, posts:new Set(), severity:0, lastAt:item.createdAt };
    row.interventions += 1; row.severity = Math.max(row.severity, rank[item.eventType]);
    if (item.context.postId) row.posts.add(item.context.postId);
    if (new Date(item.createdAt) > new Date(row.lastAt)) row.lastAt = item.createdAt;
    grouped.set(key, row);
  });
  const edges = [...grouped.values()].map((row) => ({ ...row, threads:row.posts.size, posts:undefined, persistent:row.interventions >= 3 || row.posts.size >= 2 })).sort((a,b) => b.interventions - a.interventions);
  return { edges, persistentEdges:edges.filter((item) => item.persistent), generatedAt:new Date().toISOString() };
}

// ---- demo reset ------------------------------------------------------------
export function resetDemo() {
  state = buildSeed();
  // Reset presentation data without changing the server-authenticated identity.
  if (!serverAuthenticated) currentUserId = "u_observer";
  emit();
}
