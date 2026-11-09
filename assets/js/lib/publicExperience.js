import { isAdmin, isServerAuthenticated, useCurrentUser } from "../store.js?v=4.24.1.brand1";

export const INTERNAL_PATHS = new Set([
  "/demo-lab", "/media-lab", "/hate-stress-test", "/trust-dashboard",
  "/admin", "/tournament-operations", "/pilot-ops", "/event-command", "/safety-intelligence", "/athlete-shield", "/athlete", "/arena-control",
]);

export function isModeratorSession() {
  return isServerAuthenticated() && isAdmin(useCurrentUser());
}

export function isPublicExperience() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const verificationWorkspace = path === "/verify" && new URLSearchParams(window.location.search).get("workspace") === "1";
  return !isModeratorSession() || !(INTERNAL_PATHS.has(path) || verificationWorkspace);
}
