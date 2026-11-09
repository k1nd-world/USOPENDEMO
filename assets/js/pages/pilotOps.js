import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.brand1";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import {
  getPilotIntelligence, getSafeguardingSummary, getPilotEvaluationSummary,
  getLearningSummary, getModelStatus, updateSafeguardingIncident,
  authorizePartnerNotification, runPilotEvaluation, createLearningCandidate,
  advanceLearningCandidate,
} from "../serverPlatform.js?v=4.24.1.brand1";

const label = (value) => escapeHtml(String(value || "unknown").replaceAll("_", " "));
const short = (value) => escapeHtml(String(value || "").slice(0, 22));
const date = (value) => value ? new Date(value).toLocaleString([], { dateStyle:"medium", timeStyle:"short" }) : "not recorded";

export function renderPilotOps(outlet) {
  if (!isAdmin(useCurrentUser())) {
    outlet.innerHTML = `<div class="card card-pad pilot-gate"><span class="eyebrow">Restricted operations</span><h2>Moderator session required</h2><p class="muted">Safeguarding incidents, partner disclosures and adaptive-policy controls are visible only to authorised moderators.</p><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div>`;
    return;
  }
    outlet.innerHTML = `<section class="pilot-loading card card-pad"><span class="eyebrow">K1ND Pilot Operations · V4.19.0</span><h1>Loading governed safety operations…</h1><p class="muted">Connecting universal safety reasoning, campaign intelligence, safeguarding, evaluation and adaptive-policy controls.</p></section>`;
  hydrate(outlet);
}

async function hydrate(outlet) {
  try {
    const [intelligence, safeguarding, evaluation, learning, models] = await Promise.all([
      getPilotIntelligence(), getSafeguardingSummary(), getPilotEvaluationSummary(), getLearningSummary(), getModelStatus(),
    ]);
    if (!outlet.isConnected) return;
    paint(outlet, { intelligence, safeguarding, evaluation, learning, models });
  } catch (error) {
    outlet.innerHTML = `<div class="card card-pad pilot-gate"><span class="eyebrow">Operations held safe</span><h2>Pilot operations are unavailable</h2><p class="muted">${escapeHtml(error?.message || "The governed operations service could not be reached.")}</p></div>`;
  }
}

function providerCard(provider) {
  const active = ["active", "configured"].includes(provider.status);
  return `<article class="pilot-provider ${active ? "is-active" : "is-boundary"}"><div><span class="pilot-status-dot"></span><b>${escapeHtml(provider.label)}</b></div><strong>${label(provider.status)}</strong><small>${label(provider.authority)}</small></article>`;
}

function incidentCard(item) {
  const notification = item.partnerNotification;
  const overdue = item.status !== "closed" && new Date(item.sla_due_at).getTime() < Date.now();
  return `<article class="pilot-incident priority-${escapeHtml(item.priority)}">
    <div class="pilot-incident-head"><div><span class="badge ${item.priority === "critical" ? "badge-danger" : item.priority === "high" ? "badge-warn" : "badge-review"}">${label(item.priority)}</span><b>${label(item.incident_type)}</b></div><span class="pilot-sla ${overdue ? "is-overdue" : ""}">${overdue ? "SLA overdue" : `SLA ${escapeHtml(date(item.sla_due_at))}`}</span></div>
    <p>${escapeHtml(item.response_plan)}</p><small>${short(item.incident_id)}… · case ${short(item.case_id)}… · ${label(item.status)}</small>
    ${notification ? `<div class="partner-packet"><span class="mini-kicker">Prepared partner-safety packet</span><b>${escapeHtml(notification.destination_label)}</b><p>Status: <strong>${label(notification.status)}</strong></p><small>Structured receipt and evidence digest only. No prohibited text is exposed here.</small>
      ${notification.status === "pending_human_authorization" ? `<form data-partner-form data-notification-id="${escapeHtml(notification.notification_id)}"><input name="notes" minlength="12" required placeholder="Disclosure basis and verification note"><button class="btn btn-teal btn-sm">Authorise packet</button></form>` : `<div class="quality-boundary">Approved locally, but not sent: no external connector is configured.</div>`}
    </div>` : ""}
    <form class="pilot-incident-form" data-incident-form data-incident-id="${escapeHtml(item.incident_id)}"><select name="status"><option value="open" ${item.status === "open" ? "selected" : ""}>Open</option><option value="triaged" ${item.status === "triaged" ? "selected" : ""}>Triaged</option><option value="partner_review" ${item.status === "partner_review" ? "selected" : ""}>Partner review</option><option value="contained" ${item.status === "contained" ? "selected" : ""}>Contained</option><option value="closed" ${item.status === "closed" ? "selected" : ""}>Closed</option></select><input name="notes" minlength="12" required value="${escapeHtml(item.resolution_notes || "")}" placeholder="Safeguarding action note"><button class="btn btn-ghost btn-sm">Save incident</button></form>
  </article>`;
}

function candidateCard(item) {
  const next = item.status === "native_review" ? "regression_ready" : item.status === "regression_ready" ? "shadow" : item.status === "shadow" ? "approved_for_next_release" : null;
  return `<article class="learning-candidate"><div><b>${escapeHtml(item.title)}</b><span class="badge badge-review">${label(item.status)}</span></div><p>${escapeHtml(item.rationale)}</p><small>${escapeHtml(item.language)} · ${label(item.harm_type)} · created by ${escapeHtml(item.created_by)}</small>${next ? `<button class="btn btn-ghost btn-sm" data-learning-advance data-candidate-id="${escapeHtml(item.candidate_id)}" data-next-status="${next}">Move to ${label(next)}</button>` : ""}</article>`;
}

function paint(outlet, data) {
  const { intelligence, safeguarding, evaluation, learning, models } = data;
  const calibration = evaluation.curatedCalibration?.metrics;
  const openCritical = safeguarding.incidents.filter((item) => item.priority === "critical" && item.status !== "closed").length;
  const liveSignals = intelligence.signals.length;
  outlet.innerHTML = `<div class="pilot-ops-wrap">
    <section class="pilot-hero"><div><span class="eyebrow">V4.19.0 · Universal Safety Intelligence Engine</span><h1>Safety operations that explain, escalate and learn safely.</h1><p>K1ND links each server-owned decision to specialist harm routing, campaign patterns, safeguarding response, calibrated evaluation and a governed next-release learning path.</p></div><div class="pilot-hero-metrics"><span><strong>${openCritical}</strong>open critical incidents</span><span><strong>${liveSignals}</strong>live campaign signals</span><span><strong>${calibration ? `${calibration.exact}/${calibration.total}` : "—"}</strong>curated calibration</span></div></section>

    <section class="pilot-callout"><div><span class="eyebrow">Real-world threat escalation</span><h2>Automatic detection. Human-authorised disclosure.</h2><p>A credible threat creates a 15-minute critical incident and prepares a WTA/ATP/tournament-security packet. K1ND does not silently contact an external body: an authorised moderator verifies the threat and disclosure basis first.</p></div><span class="badge badge-warn">external delivery not configured</span></section>

    <section class="pilot-section"><div class="pilot-section-head"><div><span class="eyebrow">Explainable ensemble</span><h2>Every signal has a named authority.</h2></div><span class="badge badge-teal">${escapeHtml(models.version)}</span></div><div class="pilot-provider-grid">${models.providers.map(providerCard).join("")}</div><div class="quality-boundary">${escapeHtml(models.decisionRule)} · field probability remains blank until representative pilot calibration.</div></section>

    <section class="pilot-section"><div class="pilot-section-head"><div><span class="eyebrow">Coordinated abuse</span><h2>Cross-thread targeting becomes visible.</h2></div><span class="adm-count">${intelligence.edges.length} live relationship${intelligence.edges.length === 1 ? "" : "s"}</span></div>
      <div class="campaign-grid">${intelligence.edges.length ? intelligence.edges.map((edge) => `<article><b>${escapeHtml(edge.subjectUserId)} → ${escapeHtml(edge.targetUserId)}</b><strong>${edge.interventions} intervention${edge.interventions === 1 ? "" : "s"}</strong><small>${edge.threads} linked thread${edge.threads === 1 ? "" : "s"} · ${label(edge.highestPriority)}</small></article>`).join("") : `<div class="adm-empty">No live linked targeting yet. Moderated demo activity will appear here.</div>`}</div>
      <div class="scenario-strip">${intelligence.scenarios.map((scenario) => `<article><span class="badge">simulated</span><b>${escapeHtml(scenario.label)}</b><p>${escapeHtml(scenario.evidence)}</p><small>${escapeHtml(scenario.action)}</small></article>`).join("")}</div><div class="quality-boundary">${escapeHtml(intelligence.boundary)}</div>
    </section>

    <section class="pilot-section"><div class="pilot-section-head"><div><span class="eyebrow">Safeguarding command</span><h2>Priority, SLA, ownership and partner route.</h2></div><span class="adm-count">${safeguarding.incidents.length} incident${safeguarding.incidents.length === 1 ? "" : "s"}</span></div>
      <div class="incident-list">${safeguarding.incidents.length ? safeguarding.incidents.map(incidentCard).join("") : `<div class="adm-empty">No safeguarding incidents are open. A validated threat demo will create one automatically.</div>`}</div>
      <div class="partner-route-grid">${safeguarding.partnerRoutes.map((route) => `<article><b>${escapeHtml(route.route)}</b><span>${label(route.status)}</span><small>${escapeHtml(route.delivery)}</small></article>`).join("")}</div><div class="quality-boundary"><b>Evidence vault: ${label(safeguarding.evidenceVault.status)}</b> · ${escapeHtml(safeguarding.evidenceVault.requirement)}</div>
    </section>

    <section class="pilot-section"><div class="pilot-section-head"><div><span class="eyebrow">Measured quality</span><h2>Regression, calibration and field evidence stay separate.</h2></div><button class="btn btn-teal" data-run-evaluation>Run governed calibration</button></div>
      <div class="calibration-grid"><article><b>Deterministic regression</b><strong>${evaluation.deterministicRegression.passed}/${evaluation.deterministicRegression.total}</strong><small>${escapeHtml(evaluation.deterministicRegression.status)}</small></article><article><b>Curated calibration</b><strong>${calibration ? `${calibration.exact}/${calibration.total}` : "Not run"}</strong><small>${calibration ? `precision ${(calibration.precision * 100).toFixed(0)}% · recall ${(calibration.recall * 100).toFixed(0)}% · false-positive rate ${(calibration.falsePositiveRate * 100).toFixed(0)}%` : "Run the protected 20-case suite"}</small></article><article><b>Representative pilot</b><strong>Not measured</strong><small>Precision, recall and false-positive rate intentionally remain blank.</small></article></div><div class="quality-boundary">${escapeHtml(evaluation.boundary)}</div>
    </section>

    <section class="pilot-section"><div class="pilot-section-head"><div><span class="eyebrow">Governed adaptive safety</span><h2>Learning cannot edit live policy.</h2></div><span class="badge badge-review">next-release only</span></div>
      <form class="learning-intake" data-learning-form><input name="title" minlength="6" required placeholder="Candidate label (no raw prohibited term)"><input name="language" required placeholder="Language or community"><select name="harmType"><option value="policy_gap">Policy gap</option><option value="emerging_abuse">Emerging abuse</option><option value="context_error">Context error</option><option value="evasion">Evasion pattern</option></select><textarea name="rationale" minlength="20" required placeholder="Evidence rationale, meaning and context—do not paste prohibited user content"></textarea><button class="btn btn-teal">Create review candidate</button></form>
      <div class="learning-list">${learning.candidates.length ? learning.candidates.map(candidateCard).join("") : `<div class="adm-empty">No governed learning candidates yet.</div>`}</div>
      <div class="deployment-strip">${learning.deployments.map((item) => `<article><b>${escapeHtml(item.version)}</b><span>${label(item.mode)} · ${label(item.status)}</span><small>automatic promotion ${item.metrics.automaticPromotion === false ? "disabled" : "not applicable"}</small></article>`).join("")}</div><div class="quality-boundary">${learning.guardrails.map(escapeHtml).join(" · ")}</div>
    </section>
  </div>`;
  attach(outlet);
}

function attach(outlet) {
  outlet.querySelector("[data-run-evaluation]")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { const result = await runPilotEvaluation(); toast(`Calibration complete: ${result.exact}/${result.total}`); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Calibration failed"); event.currentTarget.disabled = false; }
  });
  outlet.querySelectorAll("[data-incident-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = form.querySelector("button"); button.disabled = true;
    try { await updateSafeguardingIncident({ incidentId:form.dataset.incidentId, status:form.elements.status.value, notes:form.elements.notes.value }); toast("Safeguarding incident updated"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Incident update failed"); button.disabled = false; }
  }));
  outlet.querySelectorAll("[data-partner-form]").forEach((form) => form.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = form.querySelector("button"); button.disabled = true;
    try { const result = await authorizePartnerNotification({ notificationId:form.dataset.notificationId, notes:form.elements.notes.value }); toast(result.delivery); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Authorization failed"); button.disabled = false; }
  }));
  outlet.querySelector("[data-learning-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); const button = form.querySelector("button"); button.disabled = true;
    try { await createLearningCandidate({ title:data.get("title"), language:data.get("language"), harmType:data.get("harmType"), rationale:data.get("rationale"), sourceType:"moderator_evidence" }); toast("Candidate saved for native review"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Candidate could not be saved"); button.disabled = false; }
  });
  outlet.querySelectorAll("[data-learning-advance]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    try { await advanceLearningCandidate({ candidateId:button.dataset.candidateId, nextStatus:button.dataset.nextStatus }); toast(`Candidate moved to ${button.dataset.nextStatus.replaceAll("_", " ")}`); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Governed transition failed"); button.disabled = false; }
  }));
}
