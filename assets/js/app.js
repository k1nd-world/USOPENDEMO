// assets/js/app.js — application shell & bootstrap.

import {
  useCurrentUser, subscribe, isServerAuthenticated,
} from "./store.js?v=4.24.1.brand1";
import {
  startRouter, registerRoute, registerPatternRoute, setNotFound, setOutlet, render, current, navigate, onRouteChange,
} from "./lib/router.js";

import { renderFeed } from "./pages/feed.js?v=4.24.1.brand1";
import { renderCreate } from "./pages/create.js?v=4.24.1.brand1";
import { renderVerify } from "./pages/verify.js?v=4.24.1.brand1";
import { renderProfile } from "./pages/profile.js?v=4.24.1.brand1";
import { renderAthlete } from "./pages/athlete.js?v=4.24.1.brand1";
import { renderTrustDashboard } from "./pages/trustDashboard.js?v=4.24.1.brand1";
import { renderAdmin } from "./pages/admin.js?v=4.24.1.brand1";
import { renderPilotOps } from "./pages/pilotOps.js?v=4.24.1.brand1";
import { renderEventCommand } from "./pages/eventCommand.js?v=4.24.1.brand1";
import { renderSafetyIntelligence } from "./pages/safetyIntelligence.js?v=4.24.1.brand1";
import { renderEventSafetyTwin } from "./pages/eventSafetyTwin.js?v=4.24.1.brand1";
import { renderAbout } from "./pages/about.js?v=4.24.1.brand1";
import { renderPublicProfile } from "./pages/publicProfile.js?v=4.24.1.brand1";
import { renderDemoLab } from "./pages/demoLab.js?v=4.24.1.brand1";
import { renderHateStressTest } from "./pages/hateStressTest.js?v=4.24.1.brand1";
import { renderMediaLab } from "./pages/mediaLab.js?v=4.24.1.brand1";
import { renderAppeals } from "./pages/appeals.js?v=4.24.1.brand1";
import { renderSignIn } from "./pages/signIn.js?v=4.24.1.brand1";
import { renderLiveMatchRoom } from "./pages/liveMatchRoom.js?v=4.24.1.brand1";
import { renderAudienceArena, renderArenaAthlete, renderArenaControl, closeMatchdayView } from "./pages/audienceArena.js?v=4.24.1.brand1";
import { renderTournamentOperations } from "./pages/tournamentOperations.js?v=4.24.1.brand1";
import { bootstrapServerPlatform, logoutServerSession } from "./serverPlatform.js?v=4.24.1.brand1";
import { getAudiencePreset, isPresenterLocked, setPresenterLocked } from "./lib/demoMode.js?v=4.24.1.brand1";
import { escapeHtml } from "./lib/util.js";
import {
  isPublicExperience, isModeratorSession,
} from "./lib/publicExperience.js?v=4.24.1.brand1";

const PRODUCT_NAV = [
  { path: "/feed", label: "Feed", icon: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/>' },
  { path: "/arena", label: "Matchday", icon: '<path d="M8 4h8v7a4 4 0 0 1-8 0V4ZM8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 3v5m-4 0h8"/>' },
  { path: "/create", label: "Create", icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v8m-4-4h8"/>' },
  { path: "/profile", label: "Profile", icon: '<circle cx="12" cy="8" r="3"/><path d="M5 20v-1a7 7 0 0 1 14 0v1"/>' },
];

const WORKSPACE_NAV = [
  ["/admin", "Review"], ["/trust-dashboard", "Trust"], ["/tournament-operations", "Tournament"],
  ["/demo-lab", "Demo Lab"], ["/media-lab", "Media Lab"], ["/hate-stress-test", "Stress Test"],
  ["/pilot-ops", "Pilot Ops"], ["/event-command", "Event"], ["/safety-intelligence", "Safety"],
  ["/athlete-shield", "Athlete Shield"], ["/arena-control", "Arena Control"],
  ["/verify?workspace=1", "Verification"],
];

function navCurrent(path) {
  if (path === "/") return "/feed";
  if (path === "/match-room") return "/arena";
  if (path === "/verify" || path === "/appeals" || path.startsWith("/user/")) return "/profile";
  return path;
}

function productLink(item, mobile = false) {
  const icon = mobile ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + item.icon + '</svg>' : "";
  return '<a data-link href="' + item.path + '">' + icon + '<span>' + item.label + '</span></a>';
}

function verifiedSealSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9L3.2 9.2l2.4-1.7 1-2.8 3-.1L12 2z" fill="var(--teal)"/>
    <path d="M8.4 12.2l2.3 2.3 4.6-4.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function buildTopbar() {
  const user = useCurrentUser();
  const authenticated = isServerAuthenticated();
  const moderator = isModeratorSession();
  const preset = moderator ? getAudiencePreset() : null;
  const presenterLocked = moderator && isPresenterLocked();
  const userLabel = escapeHtml(user.displayName || "");
  const userAvatar = escapeHtml(user.avatarUrl || "");

  return `
    <a class="product-skip-link" href="#outlet">Skip to content</a>
    <header class="topbar product-topbar">
      <div class="topbar-inner">
        <a class="brand product-brand" data-link href="/" aria-label="K1ND.world home"><span aria-hidden="true" class="product-brand-image"></span></a>
        <nav class="nav product-nav" aria-label="Main navigation">${PRODUCT_NAV.map((item) => productLink(item)).join("")}</nav>
        <div class="topbar-spacer"></div>
        <div class="roleswitch product-account">
          ${moderator ? '<a class="btn btn-quiet btn-sm workspace-enter" data-link href="/admin">Moderation workspace</a><a class="btn btn-quiet btn-sm workspace-exit" data-link href="/feed">Back to app</a>' : ""}
          ${authenticated
            ? `<a class="session-identity" data-link href="/profile" aria-label="Profile for ${userLabel}"><img class="avatar avatar-xs" src="${userAvatar}" alt=""><span><b>${userLabel}</b></span></a><button id="session-logout" class="btn btn-quiet btn-sm" type="button">Sign out</button>`
            : '<a class="btn product-sign-in btn-sm" data-link href="/sign-in">Sign in</a>'}
        </div>
      </div>
      ${moderator ? `<div class="product-workspace-bar" hidden><nav class="nav" aria-label="Moderation workspace">${WORKSPACE_NAV.map(([path, label]) => productLink({ path, label })).join("")}</nav><a class="demo-preset-pill" data-link href="/demo-lab">${preset.icon} ${preset.label}</a>${presenterLocked ? '<button id="exit-presenter" class="btn btn-quiet btn-sm" type="button">Exit presenter lock</button>' : ""}</div>` : ""}
    </header>
    <nav class="mobile-nav product-mobile-nav" aria-label="Mobile navigation">${PRODUCT_NAV.map((item) => productLink(item, true)).join("")}</nav>
    <main id="outlet" class="shell-main" tabindex="-1"></main>
  `;
}

function mountShell() {
  const root = document.getElementById("app");
  root.innerHTML = buildTopbar();

  document.getElementById("session-logout")?.addEventListener("click", async () => {
    try { await logoutServerSession(); navigate("/", true); }
    catch (error) { window.alert(error.message || "Could not sign out"); }
  });
  document.getElementById("exit-presenter")?.addEventListener("click", () => setPresenterLocked(false));
}

// Re-render the shell chrome whenever the store changes (role, data, etc.).
subscribe(() => {
  mountShell();
  // Point the router at the freshly-built outlet and re-render the route.
  setOutlet(document.getElementById("outlet"));
  render();
});
window.addEventListener("k1nd:demo-prefs", () => {
  mountShell();
  setOutlet(document.getElementById("outlet"));
  render();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && event.shiftKey && isModeratorSession()) {
    navigate(isPublicExperience() ? "/admin" : "/feed");
  }
});

// ---- routes ----------------------------------------------------------------
// Stage 1 only wired "/". Later stages register the rest.
registerRoute("/", renderFeed);
registerRoute("/feed", renderFeed);
registerRoute("/match-room", renderLiveMatchRoom);
registerRoute("/arena", renderAudienceArena);
registerRoute("/arena-athlete", renderArenaAthlete);
registerRoute("/create", renderCreate);
registerRoute("/verify", renderVerify);
registerRoute("/profile", renderProfile);
registerRoute("/appeals", renderAppeals);
registerPatternRoute("/user/:id", renderPublicProfile);
const presenterOnly = (handler) => (outlet, params) => {
  if (!isModeratorSession()) {
    outlet.innerHTML = '<section class="product-access-card"><span class="eyebrow">Account access</span><h1>Moderation workspace</h1><p>This workspace is available to signed-in moderators.</p><a class="btn btn-teal" data-link href="/feed">Back to the feed</a></section>';
    return;
  }
  // The existing server permission checks still govern every protected request.
  handler(outlet, params);
};
registerRoute("/trust-dashboard", presenterOnly(renderTrustDashboard));
registerRoute("/admin", presenterOnly(renderAdmin));
registerRoute("/pilot-ops", presenterOnly(renderPilotOps));
registerRoute("/event-command", presenterOnly(renderEventCommand));
registerRoute("/tournament-operations", presenterOnly(renderTournamentOperations));
registerRoute("/safety-intelligence", presenterOnly(renderSafetyIntelligence));
registerRoute("/athlete-shield", presenterOnly(renderEventSafetyTwin));
registerRoute("/arena-control", presenterOnly(renderArenaControl));
registerRoute("/athlete", presenterOnly(renderAthlete));
registerRoute("/about", renderAbout);
registerRoute("/demo-lab", presenterOnly(renderDemoLab));
registerRoute("/media-lab", presenterOnly(renderMediaLab));
registerRoute("/hate-stress-test", presenterOnly(renderHateStressTest));
registerRoute("/sign-in", renderSignIn);
setNotFound((outlet) => {
  outlet.innerHTML = `
    <div class="card card-pad stack">
      <span class="eyebrow">Not built yet</span>
      <h2>Page not found</h2>
      <p class="muted">That page is unavailable.</p>
      <div><a class="btn btn-ghost" data-link href="/">Back to Home</a></div>
    </div>`;
});

// ---- boot ------------------------------------------------------------------
// Keep the active nav tab in sync on navigation (the top bar itself only
// rebuilds on store changes, so plain link clicks need this).
function updateNavActive(path) {
  if (path !== "/arena") closeMatchdayView();
  const publicMode = isPublicExperience();
  document.body.classList.toggle("public-experience-active", publicMode);
  const workspace = document.querySelector(".product-workspace-bar");
  if (workspace) workspace.hidden = publicMode;
  document.querySelectorAll(".nav a, .mobile-nav a").forEach((a) => {
    const active = a.getAttribute("href") === navCurrent(path);
    a.classList.toggle("active", active);
    if (active) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}
onRouteChange(updateNavActive);

async function boot() {
  document.getElementById("app").innerHTML = `<main class="shell-main"><div class="card card-pad"><b>Opening K1ND.world…</b></div></main>`;
  try { await bootstrapServerPlatform(); }
  catch (error) { console.error("Platform bootstrap failed", error); }
  mountShell();
  startRouter(document.getElementById("outlet"));
}
boot();

export { verifiedSealSvg };
