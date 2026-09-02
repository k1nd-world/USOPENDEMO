import { hydrateServerIdentity, hydrateServerPlatform } from "./store.js?v=4.24.1.0";

let session = { authenticated:false, user:null, csrfToken:null, expiresAt:null };

export function getServerSession() { return session; }
export function getCsrfToken() { return session.csrfToken || ""; }

export async function serverRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.method && options.method !== "GET" && session.csrfToken && path !== "/api/auth/login") {
    headers.set("X-K1ND-CSRF", session.csrfToken);
  }
  let response;
  try {
    response = await fetch(path, { credentials:"same-origin", ...options, headers });
  } catch (error) {
    throw new Error("The K1ND application service is unavailable. Open the hosted web-service address, not a static-file or Netlify upload.");
  }
  const payload = await response.json().catch(() => ({}));
  if (response.status === 404 && path.startsWith("/api/")) {
    throw new Error("This address is serving only the website files. K1ND requires its hosted application service for sign-in and moderation.");
  }
  if (!response.ok || !payload.ok) throw new Error(payload.error || `Server request failed (${response.status})`);
  return payload;
}

export async function bootstrapServerPlatform() {
  const payload = await serverRequest("/api/platform/bootstrap");
  session = payload.session || session;
  hydrateServerPlatform(payload);
  hydrateServerIdentity(session.authenticated ? session.user : null);
  return payload;
}

export async function loginServerSession(userId, pin) {
  const payload = await serverRequest("/api/auth/login", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ userId, pin }),
  });
  session = { authenticated:true, user:payload.user, csrfToken:payload.csrfToken, expiresAt:payload.expiresAt };
  hydrateServerIdentity(payload.user);
  return payload;
}

export async function logoutServerSession() {
  const payload = await serverRequest("/api/auth/logout", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
  session = { authenticated:false, user:null, csrfToken:null, expiresAt:null };
  hydrateServerIdentity(null);
  return payload;
}

export function getModerationCases() { return serverRequest("/api/cases"); }
export function getEvaluationSummary() { return serverRequest("/api/evaluations/summary"); }
export function updateModerationCase(payload) {
  return serverRequest("/api/cases/update", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}

export function getPilotIntelligence() { return serverRequest("/api/intelligence/summary"); }
export function getSafeguardingSummary() { return serverRequest("/api/safeguarding/summary"); }
export function getPilotEvaluationSummary() { return serverRequest("/api/pilot-evaluations/summary"); }
export function getLearningSummary() { return serverRequest("/api/learning/summary"); }
export function getModelStatus() { return serverRequest("/api/models/status"); }
export function updateSafeguardingIncident(payload) {
  return serverRequest("/api/incidents/update", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function authorizePartnerNotification(payload) {
  return serverRequest("/api/partner-notifications/authorize", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function runPilotEvaluation() {
  return serverRequest("/api/pilot-evaluations/run", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
}
export function createLearningCandidate(payload) {
  return serverRequest("/api/learning/candidates", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function advanceLearningCandidate(payload) {
  return serverRequest("/api/learning/advance", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}

export function getEventCommandSummary() { return serverRequest("/api/event-command/summary"); }
export function updateEventControls(payload) {
  return serverRequest("/api/event-command/controls", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function updateProtectedPerson(payload) {
  return serverRequest("/api/event-command/protection", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function runSecurityRouteDrill(payload) {
  return serverRequest("/api/event-command/delivery-drill", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function requestRestrictedEvidence(payload) {
  return serverRequest("/api/event-command/evidence-access", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function approveRestrictedEvidence(payload) {
  return serverRequest("/api/event-command/evidence-approve", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function runEventReadiness() {
  return serverRequest("/api/event-command/readiness-run", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
}

export function getSafetyIntelligenceSummary() { return serverRequest("/api/safety-intelligence/summary"); }
export function inspectSafetyIntelligence(payload) {
  return serverRequest("/api/safety-intelligence/inspect", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function runSafetyAdversarialGate() {
  return serverRequest("/api/safety-intelligence/adversarial-run", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
}

export function getEventSafetyTwinSummary() { return serverRequest("/api/event-safety-twin/summary"); }
export function runEventSafetyTwin(scenario="match_point_surge") {
  return serverRequest("/api/event-safety-twin/run", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ scenario }) });
}
export function resetEventSafetyTwin() {
  return serverRequest("/api/event-safety-twin/reset", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
}
export function updateEventSafetyTwinControls(payload) {
  return serverRequest("/api/event-safety-twin/controls", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function authorizeEventSafetyTwinPacket(packetId) {
  return serverRequest("/api/event-safety-twin/escalation-authorize", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ packetId }) });
}

export function getLiveMatchRoom() { return serverRequest("/api/live-match-room/summary"); }
export function sendLiveMatchMessage(text, sourceKind="fan_message") {
  return serverRequest("/api/live-match-room/message", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ text, sourceKind }) });
}
export function updateLiveMatchPreferences(payload) {
  return serverRequest("/api/live-match-room/preferences", { method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload) });
}
export function resetLiveMatchRoom() {
  return serverRequest("/api/live-match-room/reset", { method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}" });
}
