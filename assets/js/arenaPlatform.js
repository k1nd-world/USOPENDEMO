import { serverRequest } from "./serverPlatform.js?v=4.24.1.0";

let arenaSession = { authenticated:false, participantId:null, displayName:null, csrfToken:null };

export function getArenaSessionState() { return arenaSession; }

async function arenaRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (options.method && options.method !== "GET" && arenaSession.csrfToken && path !== "/api/audience-arena/join") {
    headers.set("X-K1ND-ARENA-CSRF", arenaSession.csrfToken);
  }
  const response = await fetch(path, { credentials:"same-origin", ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.ok) {
    const error = new Error(payload.error || `Arena request failed (${response.status})`);
    error.status = response.status;
    error.retryAfter = payload.retryAfter || Number(response.headers.get("Retry-After") || 0);
    throw error;
  }
  return payload;
}

export async function getArenaPublicPreview(code="") {
  const params = code ? `?${new URLSearchParams({ code })}` : "";
  return arenaRequest(`/api/audience-arena/public${params}`);
}

export async function hydrateArenaSession() {
  const payload = await arenaRequest("/api/audience-arena/session");
  arenaSession = payload.authenticated && payload.session
    ? payload.session
    : { authenticated:false, participantId:null, displayName:null, csrfToken:null };
  return payload;
}

export async function joinAudienceArena(displayName, roomCode) {
  const payload = await arenaRequest("/api/audience-arena/join", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ displayName, roomCode }),
  });
  arenaSession = payload.session;
  return payload;
}

export async function leaveAudienceArena() {
  const payload = await arenaRequest("/api/audience-arena/leave", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:"{}",
  });
  arenaSession = { authenticated:false, participantId:null, displayName:null, csrfToken:null };
  return payload;
}

export function sendAudienceArenaMessage(text, sourceKind="fan_message") {
  return arenaRequest("/api/audience-arena/message", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ text, sourceKind }),
  });
}

export function getAudienceArenaSummary(view="fan", code="") {
  const params = new URLSearchParams({ view });
  if (code) params.set("code", code);
  return arenaRequest(`/api/audience-arena/summary?${params}`);
}

export function audienceArenaEventsUrl(view="fan", code="", since=0) {
  const params = new URLSearchParams({ view, since:String(since || 0) });
  if (code) params.set("code", code);
  return `/api/audience-arena/events?${params}`;
}

export function updateAudienceArenaControls(payload) {
  return serverRequest("/api/audience-arena/controls", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}

export function resetAudienceArena(payload={}) {
  return serverRequest("/api/audience-arena/reset", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}

export function runAudienceArenaRehearsal(payload={}) {
  return serverRequest("/api/audience-arena/rehearsal", {
    method:"POST", headers:{ "Content-Type":"application/json" }, body:JSON.stringify(payload),
  });
}
