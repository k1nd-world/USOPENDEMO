const KEY = "k1nd-public-experience-v423";
export const PUBLIC_EXPERIENCE_EVENT = "k1nd:public-experience";

export const INTERNAL_PATHS = new Set([
  "/demo-lab", "/media-lab", "/hate-stress-test", "/trust-dashboard",
  "/admin", "/pilot-ops", "/event-command", "/safety-intelligence", "/athlete-shield", "/athlete", "/arena-control",
]);

export function isPublicExperience() {
  try { return sessionStorage.getItem(KEY) === "active"; }
  catch (_) { return false; }
}

export function enterPublicExperience() {
  try { sessionStorage.setItem(KEY, "active"); }
  catch (_) {}
  window.dispatchEvent(new CustomEvent(PUBLIC_EXPERIENCE_EVENT, { detail:{ active:true } }));
}

export function exitPublicExperience() {
  try { sessionStorage.removeItem(KEY); }
  catch (_) {}
  window.dispatchEvent(new CustomEvent(PUBLIC_EXPERIENCE_EVENT, { detail:{ active:false } }));
}

export function isInternalPath(path) {
  return INTERNAL_PATHS.has(String(path || ""));
}
