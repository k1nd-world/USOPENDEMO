// assets/js/app.js — application shell & bootstrap.

import {
  useCurrentUser, subscribe, resetDemo, isServerAuthenticated,
  canPublish, isAdmin,
} from "./store.js?v=4.24.1.0";
import {
  startRouter, registerRoute, registerPatternRoute, setNotFound, setOutlet, render, current, navigate, onRouteChange,
} from "./lib/router.js";

// Stage 1 scaffold has been replaced by the real landing page.
import { renderLanding } from "./pages/landing.js?v=4.24.1.0";
import { renderFeed } from "./pages/feed.js?v=4.24.1.0";
import { renderCreate } from "./pages/create.js?v=4.24.1.0";
import { renderVerify } from "./pages/verify.js?v=4.24.1.0";
import { renderProfile } from "./pages/profile.js?v=4.24.1.0";
import { renderAthlete } from "./pages/athlete.js?v=4.24.1.0";
import { renderTrustDashboard } from "./pages/trustDashboard.js?v=4.24.1.0";
import { renderAdmin } from "./pages/admin.js?v=4.24.1.0";
import { renderPilotOps } from "./pages/pilotOps.js?v=4.24.1.0";
import { renderEventCommand } from "./pages/eventCommand.js?v=4.24.1.0";
import { renderSafetyIntelligence } from "./pages/safetyIntelligence.js?v=4.24.1.0";
import { renderEventSafetyTwin } from "./pages/eventSafetyTwin.js?v=4.24.1.0";
import { renderAbout } from "./pages/about.js?v=4.24.1.0";
import { renderPublicProfile } from "./pages/publicProfile.js?v=4.24.1.0";
import { renderDemoLab } from "./pages/demoLab.js?v=4.24.1.0";
import { renderHateStressTest } from "./pages/hateStressTest.js?v=4.24.1.0";
import { renderMediaLab } from "./pages/mediaLab.js?v=4.24.1.0";
import { renderAppeals } from "./pages/appeals.js?v=4.24.1.0";
import { renderSignIn } from "./pages/signIn.js?v=4.24.1.0";
import { renderLiveMatchRoom } from "./pages/liveMatchRoom.js?v=4.24.1.0";
import { renderAudienceArena, renderArenaAthlete, renderArenaControl } from "./pages/audienceArena.js?v=4.24.1.0";
import { renderTournamentOperations } from "./pages/tournamentOperations.js?v=4.24.1.0";
import { bootstrapServerPlatform, logoutServerSession } from "./serverPlatform.js?v=4.24.1.0";
import { getAudiencePreset, resetDemoPrefs, isPresenterLocked, setPresenterLocked } from "./lib/demoMode.js?v=4.24.1.0";
import { toast } from "./lib/ui.js";
import {
  isPublicExperience, enterPublicExperience, exitPublicExperience,
  isInternalPath, PUBLIC_EXPERIENCE_EVENT,
} from "./lib/publicExperience.js?v=4.24.1.0";

// Nav definition. `lockedFor` returns true when the tab should show a lock for
// the current user (Observers see Create locked, not hidden — spec rule).
const NAV = [
  { path: "/",                label: "Home" },
  { path: "/feed",            label: "Feed" },
  { path: "/match-room",      label: "Match Live" },
  { path: "/arena",           label: "Arena Live" },
  { path: "/demo-lab",        label: "Demo Lab", internal: true },
  { path: "/media-lab",       label: "Media Lab", internal: true },
  { path: "/hate-stress-test", label: "Stress Test", internal: true },
  { path: "/create",          label: "Create", lockedFor: (u) => !canPublish(u) },
  { path: "/verify",          label: "Verify" },
  { path: "/profile",         label: "Profile" },
  { path: "/appeals",         label: "Appeals" },
  { path: "/trust-dashboard", label: "Control Room", internal: true },
  { path: "/admin",           label: "Admin", adminOnly: true, internal: true },
  { path: "/pilot-ops",       label: "Pilot Ops", adminOnly: true, internal: true },
  { path: "/event-command",   label: "Event Command", adminOnly: true, internal: true },
  { path: "/tournament-operations", label: "Tournament Ops", adminOnly: true, internal: true },
  { path: "/safety-intelligence", label: "Safety Intel", adminOnly: true, internal: true },
  { path: "/athlete-shield", label: "Athlete Shield", adminOnly: true, internal: true },
  { path: "/arena-control", label: "Arena Control", adminOnly: true, internal: true },
  { path: "/about",           label: "About" },
];

function verifiedSealSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9L3.2 9.2l2.4-1.7 1-2.8 3-.1L12 2z" fill="var(--teal)"/>
    <path d="M8.4 12.2l2.3 2.3 4.6-4.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

function buildTopbar() {
  const user = useCurrentUser();
  const path = current();
  const preset = getAudiencePreset();
  const presenterLocked = isPresenterLocked();
  const publicMode = isPublicExperience();

  const presenterPaths = new Set(["/", "/feed", "/match-room", "/arena", "/arena-athlete", "/arena-control", "/demo-lab", "/media-lab", "/hate-stress-test", "/trust-dashboard", "/admin", "/pilot-ops", "/event-command", "/tournament-operations", "/safety-intelligence", "/athlete-shield"]);
  const navItems = NAV.filter((item) => {
    if (publicMode) {
      if (item.internal) return false;
      if (item.path === "/verify" && String(user.verificationStatus || "").startsWith("verified")) return false;
      return true;
    }
    return !presenterLocked || presenterPaths.has(item.path);
  });
  const nav = navItems.map((item) => {
    if (item.adminOnly && !isAdmin(user)) return "";
    const active = path === item.path ? "active" : "";
    const locked = item.lockedFor && item.lockedFor(user) ? "locked" : "";
    return `<a data-link href="${item.path}" class="${active} ${locked}">${item.label}</a>`;
  }).join("");

  const authenticated = isServerAuthenticated();
  const mobileNav = publicMode
    ? navItems.filter((item) => ["/", "/feed", "/arena", "/create", "/profile"].includes(item.path)).map((item) => `<a data-link href="${item.path}">${item.label}</a>`).join("")
    : `<a data-link href="/">Home</a><a data-link href="/feed">Feed</a><a data-link href="/demo-lab">Demo</a><a data-link href="/media-lab">Media</a><a data-link href="/trust-dashboard">Trust</a><a data-link href="/profile">Profile</a>`;

  return `
    <header class="topbar ${presenterLocked && !publicMode ? "presenter-locked" : ""} ${publicMode ? "public-experience" : ""}">
      <div class="topbar-inner">
        <a class="brand" data-link href="/">
          <span class="k">K1ND</span><span class="dot">.</span><span class="world">world</span>
        </a>
        <nav class="nav">${nav}</nav>
        <div class="topbar-spacer"></div>
        <div class="roleswitch ${presenterLocked && !publicMode ? "is-locked" : ""}">
          ${publicMode ? "" : `<a class="demo-preset-pill" data-link href="/demo-lab" title="Open Demo Lab">${preset.icon} ${preset.label}</a>`}
          ${presenterLocked && !publicMode ? `<span class="presenter-lock-pill">● Presenter lock</span><button id="exit-presenter" class="btn btn-quiet btn-sm">Exit</button>` : authenticated
            ? `${!publicMode && isAdmin(user) ? `<button id="enter-public-experience" class="btn btn-teal btn-sm">View as user</button>` : ""}<a class="session-identity" data-link href="/profile"><img class="avatar avatar-xs" src="${user.avatarUrl}" alt=""><span><b>${user.displayName}</b><small>${publicMode ? "Signed in" : user.role === "admin" ? "Moderator session" : "Signed session"}</small></span></a><button id="session-logout" class="btn btn-quiet btn-sm">Sign out</button>`
            : `<a class="btn btn-teal btn-sm" data-link href="/sign-in">Sign in</a>`}
        </div>
      </div>
    </header>
    <nav class="mobile-nav" aria-label="Mobile navigation">
      ${mobileNav}
    </nav>
    <main id="outlet" class="shell-main"></main>
  `;
}

function mountShell() {
  const root = document.getElementById("app");
  document.body.classList.toggle("public-experience-active", isPublicExperience());
  root.innerHTML = buildTopbar();

  document.getElementById("session-logout")?.addEventListener("click", async () => {
    try { await logoutServerSession(); navigate("/", true); }
    catch (error) { window.alert(error.message || "Could not sign out"); }
  });
  document.getElementById("reset-demo")?.addEventListener("click", () => {
    if (confirm("Reset all demo data and demo presets back to the starting state?")) { resetDemoPrefs(); resetDemo(); }
  });
  document.getElementById("exit-presenter")?.addEventListener("click", () => setPresenterLocked(false));
  document.getElementById("enter-public-experience")?.addEventListener("click", () => {
    enterPublicExperience();
    toast("User view active · press Shift + Escape to return to presenter tools");
  });
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
window.addEventListener(PUBLIC_EXPERIENCE_EVENT, () => {
  mountShell();
  setOutlet(document.getElementById("outlet"));
  if (isPublicExperience() && isInternalPath(current())) { navigate("/arena", true); return; }
  render();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && event.shiftKey && isPublicExperience()) {
    exitPublicExperience();
    toast("Presenter tools restored");
  }
});

// ---- routes ----------------------------------------------------------------
// Stage 1 only wired "/". Later stages register the rest.
registerRoute("/", renderLanding);
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
  if (isPublicExperience()) { navigate("/arena", true); return; }
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
      <p class="muted">You're on <code>${current()}</code>. That page does not exist in this MVP.</p>
      <div><a class="btn btn-ghost" data-link href="/">Back to Home</a></div>
    </div>`;
});

// ---- boot ------------------------------------------------------------------
// Keep the active nav tab in sync on navigation (the top bar itself only
// rebuilds on store changes, so plain link clicks need this).
function updateNavActive(path) {
  document.querySelectorAll(".nav a, .mobile-nav a").forEach((a) => {
    a.classList.toggle("active", a.getAttribute("href") === path);
  });
}
onRouteChange(updateNavActive);

async function boot() {
  document.getElementById("app").innerHTML = `<main class="shell-main"><div class="card card-pad"><b>Connecting to the K1ND safety platform…</b></div></main>`;
  try { await bootstrapServerPlatform(); }
  catch (error) { console.error("Platform bootstrap failed", error); }
  mountShell();
  startRouter(document.getElementById("outlet"));
}
boot();

export { verifiedSealSvg };
