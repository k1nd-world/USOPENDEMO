import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.brand1";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import {
  getEventCommandSummary, updateEventControls, updateProtectedPerson,
  runSecurityRouteDrill, requestRestrictedEvidence, approveRestrictedEvidence,
  runEventReadiness,
} from "../serverPlatform.js?v=4.24.1.brand1";

const label = (value) => escapeHtml(String(value || "unknown").replaceAll("_", " "));
const when = (value) => value ? new Date(value).toLocaleString([], { dateStyle:"medium", timeStyle:"short" }) : "not started";

export function renderEventCommand(outlet) {
  if (!isAdmin(useCurrentUser())) {
    outlet.innerHTML = `<div class="card card-pad event-gate"><span class="eyebrow">Restricted command surface</span><h2>Authorised moderator session required</h2><p class="muted">Live-event intelligence, protected-person status and security-routing controls are not public.</p><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div>`;
    return;
  }
  outlet.innerHTML = `<div class="card card-pad event-gate"><span class="eyebrow">V4.19.0 · Universal Safety Intelligence + Event Command</span><h1>Opening the event command centre…</h1></div>`;
  hydrate(outlet);
}

async function hydrate(outlet) {
  try {
    const data = await getEventCommandSummary();
    if (outlet.isConnected) paint(outlet, data);
  } catch (error) {
    outlet.innerHTML = `<div class="card card-pad event-gate"><span class="eyebrow">Command held safe</span><h2>Event operations are unavailable</h2><p class="muted">${escapeHtml(error?.message || "The server command layer could not be reached.")}</p></div>`;
  }
}

function protectedCard(person) {
  return `<article class="protected-person level-${escapeHtml(person.monitoring_level)}"><div class="protected-avatar">${escapeHtml(person.display_label.split(" ").map((part) => part[0]).join("").slice(0,2))}</div><div class="protected-main"><div><span class="badge ${person.is_minor ? "badge-danger" : "badge-teal"}">${person.is_minor ? "minor protocol" : "protected athlete"}</span><b>${escapeHtml(person.display_label)}</b></div><p>${escapeHtml(person.role_label)} · ${person.interventions} interventions · ${person.open_incidents} open incidents</p><small>${escapeHtml(person.consent_basis)} · ${person.channels.map(escapeHtml).join(" · ")}</small><form data-protection-form data-user-id="${escapeHtml(person.user_id)}"><select name="level"><option value="standard" ${person.monitoring_level === "standard" ? "selected" : ""}>Standard</option><option value="heightened" ${person.monitoring_level === "heightened" ? "selected" : ""}>Heightened</option><option value="critical" ${person.monitoring_level === "critical" ? "selected" : ""}>Critical</option></select><input name="notes" minlength="12" required placeholder="Required protection-change note"><button class="btn btn-ghost btn-sm">Update</button></form></div></article>`;
}

function threatCard(item) {
  const activeSignals = Object.entries(item.signals || {}).filter(([,value]) => value === true).map(([key]) => label(key)).join(" · ");
  return `<article class="threat-card band-${escapeHtml(item.credibility_band)}"><div class="threat-score"><strong>${item.credibility_score}</strong><span>${label(item.credibility_band)}</span></div><div><b>${escapeHtml(item.recommended_action)}</b><p>${activeSignals || "No additional structured signals"}</p><small>${label(item.imminence)} · ${label(item.location_specificity)} · ${label(item.capability_signal)} · ${escapeHtml(item.version)}</small></div></article>`;
}

function timelineRow(item) {
  return `<article class="event-timeline-row severity-${escapeHtml(item.severity)}"><span class="event-timeline-dot"></span><div><div><b>${escapeHtml(item.title)}</b>${item.simulated ? `<span class="badge">simulated</span>` : `<span class="badge badge-teal">live demo record</span>`}</div><p>${Object.entries(item.detail || {}).slice(0,5).map(([key,value]) => `${label(key)}: ${escapeHtml(String(value))}`).join(" · ")}</p><small>${label(item.entry_type)} · ${escapeHtml(when(item.created_at))}</small></div></article>`;
}

function paint(outlet, data) {
  const { event, controls, stats, protectedPeople, threatAssessments, timeline, securityRoutes, deliveries, evidenceAccess, readiness, boundaries } = data;
  outlet.innerHTML = `<div class="event-command-wrap">
    <section class="event-command-hero"><div><span class="event-live-pill"><i></i> Active demo command</span><span class="eyebrow">V4.19.0 · Universal Safety Intelligence + Event Command</span><h1>Protect the whole tournament—not just one post.</h1><p>${escapeHtml(event.name)} connects authoritative K1ND reasoning to protected people, campaign patterns, threat credibility, safeguarding SLAs and security-routing drills.</p><div class="event-meta"><span>${escapeHtml(event.venue_label)}</span><span>${escapeHtml(event.timezone)}</span><span>${label(event.operating_mode)}</span></div></div><div class="command-scoreboard"><span><strong>${stats.protectedPeople}</strong>protected people</span><span><strong>${stats.openCritical}</strong>live critical records</span><span><strong>${stats.threatAssessments}</strong>threat assessments</span><span><strong>${stats.pendingRouteActions}</strong>route actions</span></div></section>

    <section class="event-boundary-banner"><b>Operational truth</b><span>${escapeHtml(boundaries.coverage)} ${escapeHtml(boundaries.delivery)}</span></section>

    <section class="event-command-grid"><div class="event-panel event-controls-panel"><div class="event-panel-head"><div><span class="eyebrow">Event Shield</span><h2>Live operating controls</h2></div><span class="badge badge-warn">${label(controls.mode)}</span></div><form data-event-controls><label>Mode<select name="mode"><option value="standard" ${controls.mode === "standard" ? "selected" : ""}>Standard</option><option value="heightened" ${controls.mode === "heightened" ? "selected" : ""}>Heightened</option><option value="lockdown_demo" ${controls.mode === "lockdown_demo" ? "selected" : ""}>Lockdown demo</option></select></label><label>Reply burst limit<input name="replyBurstLimit" type="number" min="1" max="30" value="${controls.reply_burst_limit}"></label><label class="event-check"><input name="slowMode" type="checkbox" ${controls.slow_mode ? "checked" : ""}> Slow mode</label><label class="event-check"><input name="newAccountFriction" type="checkbox" ${controls.new_account_friction ? "checked" : ""}> New-account friction</label><label class="event-check"><input name="highRiskLanguageReview" type="checkbox" ${controls.high_risk_language_review ? "checked" : ""}> High-risk language review</label><input class="wide" name="note" minlength="12" required placeholder="Required operational change note"><button class="btn btn-teal">Apply event controls</button></form><div class="quality-boundary">These controls govern the local K1ND demo only. Edge enforcement on external networks is not connected.</div></div>
      <div class="event-panel readiness-panel"><div class="event-panel-head"><div><span class="eyebrow">Command readiness</span><h2>Prove configuration, not outcomes.</h2></div><button class="btn btn-ghost" data-readiness-run>Run drill</button></div>${readiness ? `<div class="readiness-result"><strong>${readiness.passed}/${readiness.total}</strong><span>configuration checks</span></div><div class="readiness-checks">${readiness.results.map((item) => `<span class="${item.pass ? "pass" : "fail"}">${item.pass ? "✓" : "×"} ${escapeHtml(item.check)}</span>`).join("")}</div>` : `<div class="adm-empty">No V4.19.0 readiness drill has been recorded.</div>`}<div class="quality-boundary">${escapeHtml(boundaries.quality)}</div></div>
    </section>

    <section class="event-panel"><div class="event-panel-head"><div><span class="eyebrow">Protected-person monitoring</span><h2>Risk follows the target across the event.</h2><p>Enrolment is authorised and channel-specific; protection level changes are audited.</p></div><span class="adm-count">${protectedPeople.length} active</span></div><div class="protected-grid">${protectedPeople.map(protectedCard).join("")}</div></section>

    <section class="event-command-grid threat-timeline-grid"><div class="event-panel"><div class="event-panel-head"><div><span class="eyebrow">Threat credibility fusion</span><h2>Intent, access and imminence—not keywords alone.</h2></div><span class="adm-count">${threatAssessments.length} assessed</span></div><div class="threat-list">${threatAssessments.length ? threatAssessments.map(threatCard).join("") : `<div class="adm-empty">No live threat assessment yet. A server-confirmed threat will appear here without storing its raw text.</div>`}</div><div class="quality-boundary">No probability is claimed. The score is an explainable routing heuristic; trained safeguarding verification remains required.</div></div>
      <div class="event-panel"><div class="event-panel-head"><div><span class="eyebrow">Event timeline</span><h2>One sequence across safety systems.</h2></div><span class="adm-count">${timeline.length} records</span></div><div class="event-timeline">${timeline.map(timelineRow).join("")}</div></div>
    </section>

    <section class="event-panel security-network"><div class="event-panel-head"><div><span class="eyebrow">Security acknowledgement network</span><h2>Route, acknowledge, escalate, fall back.</h2><p>Every route advertises its real connector state. The drill buttons never contact an external organisation.</p></div><div class="security-drills"><button class="btn btn-teal btn-sm" data-route-drill="acknowledged">Simulate acknowledgement</button><button class="btn btn-ghost btn-sm" data-route-drill="timeout_fallback">Simulate no-ack fallback</button></div></div><div class="security-route-grid">${securityRoutes.map((route) => `<article><div><b>${escapeHtml(route.label)}</b><span class="badge ${route.connector_state === "live" ? "badge-ok" : "badge-warn"}">${label(route.connector_state)}</span></div><strong>${route.acknowledgement_minutes} min acknowledgement target</strong><p>${label(route.status)} · fallback: ${escapeHtml(route.fallback_label)}</p></article>`).join("")}</div><div class="delivery-ledger">${deliveries.length ? deliveries.map((item) => `<span><b>${label(item.state)}</b><small>${item.simulated ? "SIMULATED" : "LOCAL PACKET"} · fallback ${label(item.fallback_state)} · external sent: no</small></span>`).join("") : `<div class="adm-empty">No partner packets or route drills recorded.</div>`}</div></section>

    <section class="event-command-grid"><div class="event-panel evidence-vault"><div class="event-panel-head"><div><span class="eyebrow">Restricted evidence</span><h2>Two-person access by design.</h2></div><span class="badge badge-danger">vault required</span></div><form data-evidence-form><input name="incidentId" placeholder="Incident ID (optional in drill)"><select name="scope"><option value="metadata_only">Metadata only</option><option value="restricted_raw_evidence">Restricted raw evidence</option></select><textarea name="reason" minlength="20" required placeholder="Specific safeguarding reason and intended use"></textarea><button class="btn btn-teal">Request access</button></form><div class="access-ledger">${evidenceAccess.length ? evidenceAccess.map((item) => `<article><b>${label(item.scope)}</b><span>${label(item.status)}</span><small>requested by ${escapeHtml(item.requested_by)} · ${escapeHtml(when(item.created_at))}</small>${item.status === "pending_second_approver" ? `<button class="btn btn-ghost btn-sm" data-approve-access="${escapeHtml(item.access_id)}">Attempt second approval</button>` : ""}</article>`).join("") : `<div class="adm-empty">No evidence access requested.</div>`}</div><div class="quality-boundary">${escapeHtml(boundaries.evidence)}</div></div>
      <div class="event-panel integration-map"><div class="event-panel-head"><div><span class="eyebrow">Live integration map</span><h2>What is real, ready and missing.</h2></div></div><div class="integration-rows"><span><i class="active"></i><b>K1ND posts and comments</b><small>live local server traffic</small></span><span><i class="active"></i><b>Signed evidence and cases</b><small>active SQLite preview</small></span><span><i></i><b>Social-network ingestion</b><small>adapters not configured</small></span><span><i></i><b>WTA / ATP delivery</b><small>contract and endpoint required</small></span><span><i></i><b>Restricted evidence vault</b><small>KMS-backed service required</small></span><span><i></i><b>Representative field quality</b><small>not measured</small></span></div><div class="quality-boundary">${escapeHtml(boundaries.event)}</div></div>
    </section>
  </div>`;
  attach(outlet);
}

function attach(outlet) {
  outlet.querySelector("[data-event-controls]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true;
    try { await updateEventControls({ mode:form.elements.mode.value, replyBurstLimit:Number(form.elements.replyBurstLimit.value), slowMode:form.elements.slowMode.checked, newAccountFriction:form.elements.newAccountFriction.checked, highRiskLanguageReview:form.elements.highRiskLanguageReview.checked, note:form.elements.note.value }); toast("Event controls updated and audited"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Event controls were not changed"); button.disabled = false; }
  });
  outlet.querySelectorAll("[data-protection-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = form.querySelector("button"); button.disabled = true;
    try { await updateProtectedPerson({ userId:form.dataset.userId, level:form.elements.level.value, notes:form.elements.notes.value }); toast("Protection level updated"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Protection update failed"); button.disabled = false; }
  }));
  outlet.querySelectorAll("[data-route-drill]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { const result = await runSecurityRouteDrill({ scenario:button.dataset.routeDrill }); toast(`${result.state.replaceAll("_", " ")} · no external message sent`); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Routing drill failed"); button.disabled = false; }
  }));
  outlet.querySelector("[data-evidence-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true;
    try { const result = await requestRestrictedEvidence({ incidentId:form.elements.incidentId.value || null, scope:form.elements.scope.value, reason:form.elements.reason.value }); toast(`${result.status.replaceAll("_", " ")} · no raw evidence returned`); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Evidence request failed"); button.disabled = false; }
  });
  outlet.querySelectorAll("[data-approve-access]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await approveRestrictedEvidence({ accessId:button.dataset.approveAccess }); toast("Time-limited access approved"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "A different authorised approver is required"); button.disabled = false; }
  }));
  outlet.querySelector("[data-readiness-run]")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { const result = await runEventReadiness(); toast(`Event readiness: ${result.passed}/${result.total}`); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Readiness drill failed"); event.currentTarget.disabled = false; }
  });
}
