import { getState } from "../store.js?v=4.24.1.0";
import { getAudiencePreset, getDemoPrefs, setMetricView } from "../lib/demoMode.js?v=4.24.1.0";
import { sealSvg } from "../lib/ui.js";

function liveMetrics(s) {
  const ev = s.moderationEvents || [];
  const started = new Date(s.demoMeta?.startedAt || 0).getTime();
  const session = ev.filter((m) => new Date(m.createdAt).getTime() >= started);
  const count = (type, source = ev) => source.filter((m) => m.eventType === type).length;
  const prevented = ev.filter((m) => ["warning", "review_required", "block", "review_submitted"].includes(m.eventType)).length;
  const sessionPrevented = session.filter((m) => ["warning", "review_required", "block"].includes(m.eventType)).length;
  const rewrites = count("rewrite_accepted");
  const sessionRewrites = count("rewrite_accepted", session);
  const clean = count("clean");
  const verified = s.profiles.filter((p) => ["verified_adult", "verified_u18"].includes(p.verificationStatus) || p.role === "admin").length;
  const pending = s.reviewQueue.filter((r) => r.status === "pending").length;
  const blocks = count("block");
  const reviewRequired = count("review_required");
  const rewriteRate = prevented ? Math.round((rewrites / Math.max(1, prevented)) * 100) : 0;
  return { prevented, sessionPrevented, rewrites, sessionRewrites, clean, verified, pending, blocks, reviewRequired, rewriteRate };
}

const SCENARIO = {
  prevented: 2481,
  rewrites: 1811,
  rewriteRate: 73,
  pending: 18,
  blocks: 412,
  clean: 38642,
  verifiedRate: 100,
  zeroSlurs: 100,
};

function sparkBars() {
  const values = [42, 61, 48, 76, 55, 83, 68, 92, 72, 88, 64, 97, 81, 90];
  return `<div class="spark-bars" aria-label="Illustrative 14-day prevention trend">${values.map((v, i) => `<span style="height:${v}%" title="Day ${i+1}: ${v}"></span>`).join("")}</div>`;
}

function stat(value, label, sub, tone="teal") {
  return `<div class="control-stat ${tone}"><div class="control-stat-value">${value}</div><b>${label}</b><span>${sub}</span></div>`;
}

function livePanel(m) {
  return `<div class="control-kpis">
    ${stat(m.sessionPrevented, "Interventions this session", "Warnings, holds and blocks since the last reset", "warn")}
    ${stat(m.sessionRewrites, "Safer rewrites accepted", "User chose constructive participation", "teal")}
    ${stat(m.pending, "Items held for review", "Not visible in the public feed", "review")}
    ${stat(m.verified, "Verified demo identities", "Accountable participation layer", "teal")}
  </div>
  <div class="control-live-empty ${m.sessionPrevented ? "has-data" : ""}">
    <div><span class="live-dot"></span><b>Live demo telemetry</b></div>
    <p>${m.sessionPrevented ? `This reset session has already generated ${m.sessionPrevented} safety intervention${m.sessionPrevented === 1 ? "" : "s"}. Keep testing the feed or Demo Lab and these figures will move.` : `The live session is clean. Use Demo Lab or post a test comment to watch this dashboard change in real time.`}</p>
    <a class="btn btn-teal btn-sm" data-link href="/demo-lab">Open Demo Lab</a>
  </div>`;
}

function scenarioPanel() {
  return `<div class="scenario-disclaimer"><span>Illustrative scale scenario</span><p>These figures demonstrate how K1ND metrics could be presented at deployment scale. They are <strong>not live platform claims or partner data</strong>.</p></div>
  <div class="control-kpis scenario">
    ${stat(SCENARIO.prevented.toLocaleString("en-GB"), "Harmful attempts prevented", "Before reaching the public feed", "warn")}
    ${stat(`${SCENARIO.rewriteRate}%`, "Converted to safer participation", `${SCENARIO.rewrites.toLocaleString("en-GB")} constructive rewrites`, "teal")}
    ${stat(SCENARIO.pending, "Enhanced reviews", "Ambiguous / high-risk originals held", "review")}
    ${stat("0", "Prohibited slurs published", "Hard-block policy in this scenario", "teal")}
  </div>
  <div class="control-grid-two">
    <div class="control-panel">
      <div class="control-panel-head"><div><span class="mini-kicker">14-day view</span><h3>Pre-publication prevention</h3></div><span class="badge badge-teal">Illustrative</span></div>
      ${sparkBars()}
      <div class="spark-caption"><span>Harm prevented before publication</span><b>↑ behaviour improving</b></div>
    </div>
    <div class="control-panel">
      <div class="control-panel-head"><div><span class="mini-kicker">Core outcome</span><h3>Don't silence the fan. Change the behaviour.</h3></div></div>
      <div class="conversion-visual"><div class="conversion-ring"><span>73%</span><small>rewritten</small></div><div class="conversion-copy"><b>Opinion preserved</b><p>Users are given a route back into constructive participation instead of a simple delete-and-punish loop.</p></div></div>
    </div>
  </div>`;
}

export function renderTrustDashboard(outlet) {
  const s = getState();
  const m = liveMetrics(s);
  const prefs = getDemoPrefs();
  const preset = getAudiencePreset();
  const view = prefs.metricView === "live" ? "live" : "scenario";

  outlet.innerHTML = `<div class="control-room">
    <section class="control-hero">
      <div><span class="eyebrow">Trust &amp; safety control room</span><h1>Measure prevention, not just takedowns.</h1><p>K1ND's strongest metric is what never reaches the public feed — and how often a harmful impulse becomes a publishable sporting opinion.</p></div>
      <div class="control-audience"><span>${preset.icon}</span><div><small>Audience focus</small><b>${preset.label}</b><p>${preset.headline}</p></div></div>
    </section>

    <div class="metric-toggle" role="group" aria-label="Metric view">
      <button class="${view === "scenario" ? "active" : ""}" data-metric-view="scenario">Illustrative scale scenario</button>
      <button class="${view === "live" ? "active" : ""}" data-metric-view="live">Live demo session</button>
    </div>
    <div data-metric-panel>${view === "live" ? livePanel(m) : scenarioPanel()}</div>

    <div class="control-grid-three">
      <div class="control-panel compact-panel"><span class="mini-kicker">Accountability</span><b>${sealSvg(16)} Verified voices</b><p>Observers can browse and like. Publishing participation requires an accountable identity state.</p></div>
      <div class="control-panel compact-panel"><span class="mini-kicker">Prevention</span><b>◎ Intervene before harm</b><p>Warning originals have no direct publish-anyway route. Users rewrite, edit, cancel or enter review.</p></div>
      <div class="control-panel compact-panel"><span class="mini-kicker">Commercial safety</span><b>⊘ No gambling advertising</b><p>K1ND's intended environment is designed to be safer for athletes, younger audiences and brand partners.</p></div>
    </div>

    <div class="control-panel architecture-panel">
      <div class="control-panel-head"><div><span class="mini-kicker">Defence in depth</span><h3>The publication path</h3></div><span class="model-tag">Product architecture</span></div>
      <div class="architecture-flow">
        <span>Verified participant</span><i>→</i><span>Live input guard</span><i>→</i><span>Full safety classification</span><i>→</i><span>Rewrite / hold / block</span><i>→</i><span>Public store gate</span><i>→</i><span>Trust Trail</span>
      </div>
      <p>V4.20.0 adds a deterministic Event Safety Twin and Athlete Shield to the server-owned reasoning path: a simulated multilingual stream, protected inbox, campaign graph, incident replay, Moderator Copilot recommendations and human-authorised local threat packet. A live pilot still requires managed infrastructure, contracted security routes, real identity-provider integration, specialist providers and independent safeguarding evaluation.</p>
    </div>

    <div class="control-panel live-baseline">
      <div class="control-panel-head"><div><span class="mini-kicker">Bundled demo baseline</span><h3>Current seeded safety activity</h3></div><a data-link href="/admin">Open moderation queue →</a></div>
      <div class="baseline-grid">
        <div><b>${m.prevented}</b><span>Total seeded interventions</span></div>
        <div><b>${m.rewrites}</b><span>Accepted safer rewrites</span></div>
        <div><b>${m.blocks}</b><span>Hard blocks</span></div>
        <div><b>${m.reviewRequired}</b><span>Enhanced-review triggers</span></div>
        <div><b>${m.clean}</b><span>Clean messages allowed</span></div>
      </div>
    </div>
  </div>`;

  outlet.querySelectorAll("[data-metric-view]").forEach((btn) => btn.addEventListener("click", () => {
    setMetricView(btn.dataset.metricView);
    renderTrustDashboard(outlet);
  }));
}
