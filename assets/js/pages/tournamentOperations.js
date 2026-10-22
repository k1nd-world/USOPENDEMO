import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import {
  authorizeTournamentEscalation, getTournamentMatchReport, getTournamentOperations,
  launchTournamentDemo, resetTournamentDemo, runTournamentPreflight,
  updateTournamentAthletePhase, updateTournamentIncident,
} from "../tournamentPlatform.js?v=4.24.1.0";

let operations = null;
let preflight = null;
let activeReport = null;
let poll = null;

const pretty = (value) => String(value || "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase());
const initial = (value) => String(value || "K").split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
const percent = (value, total) => total ? Math.round(value * 100 / total) : 0;
const time = (value) => value ? new Date(value).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }) : "not launched";

export function renderTournamentOperations(outlet) {
  clearTimeout(poll);
  if (!isAdmin(useCurrentUser())) {
    outlet.innerHTML = `<div class="card card-pad event-gate"><span class="eyebrow">Tournament Operations</span><h2>Authorised presenter session required</h2><p class="muted">Multi-court safety intelligence, incidents and escalation controls are restricted.</p><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div>`;
    return;
  }
  outlet.innerHTML = `<div class="tournament-loading"><span></span><b>Building the tournament picture…</b><small>Joining four isolated court rooms to one governed command layer.</small></div>`;
  hydrate(outlet);
}

async function hydrate(outlet, quiet=false) {
  try {
    const payload = await getTournamentOperations();
    if (!outlet.isConnected) return;
    operations = payload.operations;
    paint(outlet);
    schedule(outlet);
  } catch (error) {
    if (!quiet) outlet.innerHTML = `<div class="card card-pad event-gate"><span class="eyebrow">Operations held safe</span><h2>Tournament command is unavailable</h2><p class="muted">${escapeHtml(error.message)}</p></div>`;
  }
}

function paint(outlet) {
  const t = operations.tournament;
  const totals = operations.totals;
  const comparison = operations.exposureComparison;
  outlet.innerHTML = `<div class="tournament-ops">
    <section class="tournament-hero">
      <div class="tournament-hero-copy"><div class="tournament-status"><i></i>${t.status === "active_demo" ? "FOUR COURTS LIVE" : "READY FOR EVENT LAUNCH"}<span>MVP v10/2026</span></div><span class="eyebrow">Tournament Operations Mode</span><h1>Protect the whole event.<br><em>See every decision.</em></h1><p>One live operating picture connects audience rooms, protected athlete screens, incident response and human-authorised security routing.</p><div class="tournament-actions"><button class="btn btn-teal" data-tour-launch>${t.status === "active_demo" ? "Relaunch clean event" : "Launch MVP v10/2026"}</button><button class="btn btn-ghost" data-tour-preflight>Run event preflight</button><button class="btn btn-quiet" data-tour-reset>Recover demo</button></div><small class="tournament-independent">Independent K1ND demonstration · no tournament or governing-body endorsement claimed</small></div>
      <div class="tournament-command-card"><span>EVENT COMMAND</span><b>${escapeHtml(t.name)}</b><div><strong>${totals.courts}</strong><small>courts</small><strong>${totals.received}</strong><small>decisions</small><strong>${totals.criticalIncidents}</strong><small>critical</small></div><footer><i></i> Local decision authority active <em>${escapeHtml(time(t.launchedAt))}</em></footer></div>
    </section>

    ${preflight ? preflightPanel() : ""}

    <section class="tour-story"><span>${operations.storyFlow.map((step, index) => `<b><i>${index + 1}</i>${escapeHtml(step)}</b>`).join("<em>→</em>")}</span><small>One explainable chain from participation to event intelligence</small></section>

    <section class="tour-section"><div class="tour-section-head"><div><span class="eyebrow">Live venue map</span><h2>Four courts. Four separate safety boundaries.</h2><p>Each match has its own room code, athlete view, controls, pressure signal and incident count.</p></div><div class="tour-live-key"><i></i> Active local demo</div></div><div class="court-grid">${operations.courts.map(courtCard).join("")}</div></section>

    <section class="tour-comparison">
      <div class="comparison-copy"><span class="eyebrow">Same-traffic counterfactual</span><h2>Show what the athlete did—and did not—have to receive.</h2><p>This replays the identical local message set through both views. It is demonstration evidence, not a production effectiveness or wellbeing claim.</p><div class="comparison-legend"><span><i class="unsafe"></i>Direct exposure without a gate</span><span><i class="safe"></i>Protected delivery with K1ND</span></div></div>
      <div class="exposure-columns"><article class="exposure-off"><span>K1ND OFF</span><strong>${comparison.withoutK1NDDirectExposure}</strong><b>messages reach the athlete unfiltered</b><div style="--fill:100%"></div><small>hypothetical direct exposure</small></article><article class="exposure-on"><span>K1ND ON</span><strong>${comparison.withK1NDAthleteDelivery}</strong><b>safe messages reach the athlete</b><div style="--fill:${percent(comparison.withK1NDAthleteDelivery, comparison.messagesReceived)}%"></div><small>${comparison.interceptedBeforeAthlete} intercepted before delivery</small></article></div>
    </section>

    <section class="tour-section incident-section"><div class="tour-section-head"><div><span class="eyebrow">Human-owned incident desk</span><h2>From signal to accountable action.</h2><p>Raw hostile wording stays out. Every change needs a reason; no connector sends automatically.</p></div><div class="incident-count"><strong>${totals.openIncidents}</strong> open <span>${totals.externalMessagesSent} sent externally</span></div></div><div class="incident-desk">${operations.incidentDesk.length ? operations.incidentDesk.map(incidentCard).join("") : `<div class="tour-empty"><b>No active incidents</b><p>Launch the event rehearsal to create redacted, structured incident evidence.</p></div>`}</div></section>

    <section class="tour-section"><div class="tour-section-head"><div><span class="eyebrow">Athlete continuity</span><h2>The shield follows the person—not the court.</h2><p>Protection remains explicit through pre-match, live play and recovery, with a named safety lead.</p></div></div><div class="continuity-grid">${operations.athleteContinuity.map(continuityCard).join("")}</div></section>

    <section class="tour-bottom-grid"><div class="tour-report-panel"><span class="eyebrow">Post-match protection report</span><h2>${activeReport ? escapeHtml(activeReport.athlete) : "One click from live operations to evidence"}</h2>${activeReport ? reportView(activeReport) : `<p>Select “Protection report” on any court to generate a privacy-safe summary of what was delivered, withheld and escalated.</p><div class="report-placeholder"><span>01</span><b>Conversation health</b><span>02</span><b>Intervention reasons</b><span>03</span><b>Incident disposition</b></div>`}</div><div class="tour-route-panel"><span class="eyebrow">Security acknowledgement network</span><h2>Prepared for connection. Honest about what is not live.</h2>${operations.routes.map(route => `<article><div><b>${escapeHtml(route.label)}</b><span>${escapeHtml(pretty(route.state))}</span></div><small>Human authorisation required · external sent: no</small></article>`).join("")}<p>${escapeHtml(operations.boundaries.external)}</p></div></section>

    <footer class="tournament-boundary"><b>Built for a compelling demo; bounded like a real safety product.</b><span>${escapeHtml(operations.boundaries.traffic)} ${escapeHtml(operations.boundaries.privacy)} ${escapeHtml(operations.boundaries.partnership)}</span></footer>
  </div>`;
  attach(outlet);
}

function courtCard(court) {
  const received = court.counters.received;
  const delivered = court.counters.delivered;
  const withheld = court.counters.withheld;
  return `<article class="court-card court-${escapeHtml(court.accent)}"><header><span><i></i>${escapeHtml(court.court)}</span><em>${escapeHtml(pretty(court.matchStatus))}</em></header><div class="court-score"><div><span>${escapeHtml(initial(court.athlete))}</span><b>${escapeHtml(court.athlete)}</b><strong>${escapeHtml(court.score)}</strong></div><small>${escapeHtml(court.round)} · vs ${escapeHtml(court.opponent)}</small></div><div class="court-shield"><span><b>${escapeHtml(pretty(court.protectionLevel))}</b> athlete shield</span><span><b>${court.crowd.score}/100</b> crowd pressure</span></div><div class="court-meter"><i style="--safe:${percent(delivered, received)}%;--held:${percent(withheld, received)}%"></i></div><div class="court-stats"><span><b>${received}</b> received</span><span><b>${delivered}</b> delivered</span><span><b>${withheld}</b> withheld</span><span><b>${court.incidentCount}</b> incidents</span></div><div class="court-code"><small>ROOM</small><b>${escapeHtml(court.roomCode)}</b><img src="/api/audience-arena/qr.png?url=${encodeURIComponent(`${window.location.origin}${court.joinPath}`)}" alt="QR code for ${escapeHtml(court.court)}"></div><footer><a class="btn btn-teal btn-sm" href="${escapeHtml(court.joinPath)}" target="_blank" rel="noopener">Fan view ↗</a><a class="btn btn-ghost btn-sm" href="${escapeHtml(court.athletePath)}" target="_blank" rel="noopener">Athlete ↗</a><a class="btn btn-ghost btn-sm" href="${escapeHtml(court.controlPath)}" target="_blank" rel="noopener">Control ↗</a><button class="btn btn-quiet btn-sm" data-tour-report="${escapeHtml(court.arenaId)}">Protection report</button></footer></article>`;
}

function incidentCard(item) {
  const canPrepare = !["escalation_prepared", "authorised_not_sent", "resolved"].includes(item.status);
  const canAuthorize = item.status === "escalation_prepared";
  return `<article class="incident-card severity-${escapeHtml(item.severity)}"><div class="incident-rail"><span>${escapeHtml(item.severity)}</span><i></i></div><div class="incident-main"><header><div><small>${escapeHtml(item.target_label)} · ${escapeHtml(pretty(item.category))}</small><b>${escapeHtml(item.incident_id.slice(-8).toUpperCase())}</b></div><span>${escapeHtml(pretty(item.status))}</span></header><p><b>Evidence ${escapeHtml(item.evidence_digest)}</b> · hostile original excluded · ${escapeHtml(pretty(item.route_state))}</p><form data-incident-form="${escapeHtml(item.incident_id)}"><input name="note" minlength="12" required placeholder="Required human decision note"><div><button class="btn btn-ghost btn-sm" name="action" value="acknowledge">Acknowledge</button><button class="btn btn-ghost btn-sm" name="action" value="investigate">Investigate</button>${canPrepare ? `<button class="btn btn-teal btn-sm" name="action" value="prepare_escalation">Prepare escalation</button>` : ""}${canAuthorize ? `<button class="btn btn-danger btn-sm" name="authorize" value="yes">Human authorise · no send</button>` : ""}<button class="btn btn-quiet btn-sm" name="action" value="resolve">Resolve</button></div></form></div></article>`;
}

function continuityCard(item) {
  return `<article><div class="continuity-avatar">${escapeHtml(initial(item.athlete))}</div><div><span>${item.shieldActive ? "SHIELD ACTIVE" : "OFF DUTY"}</span><b>${escapeHtml(item.athlete)}</b><small>${escapeHtml(item.court)} · ${escapeHtml(item.assignedLead)}</small></div><form data-phase-form="${escapeHtml(item.arenaId)}"><select name="phase"><option value="pre_match" ${item.phase === "pre_match" ? "selected" : ""}>Pre-match</option><option value="live" ${item.phase === "live" ? "selected" : ""}>Live</option><option value="recovery" ${item.phase === "recovery" ? "selected" : ""}>Recovery</option><option value="off_duty" ${item.phase === "off_duty" ? "selected" : ""}>Off duty</option></select><button class="btn btn-ghost btn-sm">Move protection</button></form></article>`;
}

function preflightPanel() {
  return `<section class="preflight-panel"><header><div><span class="eyebrow">Event preflight</span><h2>${preflight.launchReady ? "Ready to present" : "A required check needs attention"}</h2></div><strong>${preflight.requiredReady}/${preflight.requiredTotal}</strong></header><div>${preflight.checks.map(item => `<span class="check-${escapeHtml(item.status)}"><i>${item.status === "ready" ? "✓" : item.status === "warning" ? "!" : "○"}</i><b>${escapeHtml(item.label)}</b><small>${escapeHtml(pretty(item.status))}</small></span>`).join("")}</div><footer>Partner connectors are deliberately disclosed as not configured and do not block the local demonstration.</footer></section>`;
}

function reportView(report) {
  const c = report.conversation;
  return `<div class="report-summary"><div><strong>${c.received}</strong><span>received</span><strong>${c.delivered}</strong><span>delivered</span><strong>${c.withheld}</strong><span>withheld</span><strong>${c.deliveryRate}%</strong><span>safe delivery</span></div><section><b>${escapeHtml(report.match.court)} · ${escapeHtml(report.match.round)}</b><p>${report.interventionCategories.map(item => `${escapeHtml(pretty(item.category))} ${item.count}`).join(" · ") || "No interventions"}</p><small>${report.incidents.length} incident records · hostile originals included: no · external messages sent: 0</small></section></div>`;
}

function attach(outlet) {
  outlet.querySelector("[data-tour-launch]")?.addEventListener("click", async event => {
    event.currentTarget.disabled = true; event.currentTarget.textContent = "Launching four courts…";
    try { operations = (await launchTournamentDemo()).operations; activeReport = null; toast("Tournament demo live across four protected courts"); paint(outlet); }
    catch (error) { toast(error.message); event.currentTarget.disabled = false; }
  });
  outlet.querySelector("[data-tour-preflight]")?.addEventListener("click", async event => {
    event.currentTarget.disabled = true;
    try { preflight = (await runTournamentPreflight()).preflight; toast(preflight.launchReady ? "All required event checks passed" : "Preflight needs attention"); await hydrate(outlet, true); }
    catch (error) { toast(error.message); event.currentTarget.disabled = false; }
  });
  outlet.querySelector("[data-tour-reset]")?.addEventListener("click", async event => {
    if (!window.confirm("Recover all four courts to the empty, deterministic demo baseline?")) return;
    event.currentTarget.disabled = true;
    try { operations = (await resetTournamentDemo()).operations; preflight = null; activeReport = null; toast("Demo recovered to a clean starting point"); paint(outlet); }
    catch (error) { toast(error.message); event.currentTarget.disabled = false; }
  });
  outlet.querySelectorAll("[data-tour-report]").forEach(button => button.addEventListener("click", async () => {
    button.disabled = true;
    try { activeReport = (await getTournamentMatchReport(button.dataset.tourReport)).report; paint(outlet); document.querySelector(".tour-report-panel")?.scrollIntoView({ behavior:"smooth", block:"center" }); }
    catch (error) { toast(error.message); button.disabled = false; }
  }));
  outlet.querySelectorAll("[data-incident-form]").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault(); const submitter = event.submitter; const data = new FormData(form); const note = data.get("note");
    try {
      if (submitter?.name === "authorize") await authorizeTournamentEscalation({ incidentId:form.dataset.incidentForm, note });
      else await updateTournamentIncident({ incidentId:form.dataset.incidentForm, action:submitter?.value, note });
      toast(submitter?.name === "authorize" ? "Authorised locally · connector not configured · nothing sent" : "Incident action recorded"); await hydrate(outlet, true);
    } catch (error) { toast(error.message); }
  }));
  outlet.querySelectorAll("[data-phase-form]").forEach(form => form.addEventListener("submit", async event => {
    event.preventDefault(); const phase = new FormData(form).get("phase");
    try { await updateTournamentAthletePhase({ arenaId:form.dataset.phaseForm, phase }); toast("Athlete protection phase moved and audited"); await hydrate(outlet, true); }
    catch (error) { toast(error.message); }
  }));
}

function schedule(outlet) {
  clearTimeout(poll);
  poll = setTimeout(() => { if (outlet.isConnected) hydrate(outlet, true); }, 4000);
}
