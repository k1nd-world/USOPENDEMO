import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import {
  getSafetyIntelligenceSummary, inspectSafetyIntelligence, runSafetyAdversarialGate,
} from "../serverPlatform.js?v=4.24.1.0";

const label = (value) => escapeHtml(String(value || "unknown").replaceAll("_", " "));
const sentence = (value) => escapeHtml(String(value || "Not available."));
const when = (value) => value ? new Date(value).toLocaleString([], { dateStyle:"medium", timeStyle:"short" }) : "not run";

export function renderSafetyIntelligence(outlet) {
  if (!isAdmin(useCurrentUser())) {
    outlet.innerHTML = `<div class="card card-pad safety-gate"><span class="eyebrow">Restricted safety system</span><h2>Authorised moderator session required</h2><p class="muted">The policy graph, adversarial release gate and live reasoning inspector are not public surfaces.</p><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div>`;
    return;
  }
  outlet.innerHTML = `<div class="card card-pad safety-gate"><span class="eyebrow">V4.19.0 · Semantic Context & Intent</span><h1>Connecting to the server authority…</h1></div>`;
  hydrate(outlet);
}

async function hydrate(outlet) {
  try {
    const data = await getSafetyIntelligenceSummary();
    if (outlet.isConnected) paint(outlet, data);
  } catch (error) {
    outlet.innerHTML = `<div class="card card-pad safety-gate"><span class="eyebrow">System held safe</span><h2>Safety Intelligence is unavailable</h2><p class="muted">${sentence(error?.message || "The server reasoning layer could not be reached.")}</p></div>`;
  }
}

function pipelineCard(item, index) {
  return `<article class="safety-stage"><span>${String(index + 1).padStart(2, "0")}</span><div><b>${sentence(item.label)}</b><p>${sentence(item.purpose)}</p></div></article>`;
}

function policyCard(item) {
  return `<article class="policy-family severity-${label(item.severity)}"><div class="policy-family-head"><span class="badge ${item.severity === "critical" ? "badge-danger" : item.severity === "high" ? "badge-warn" : "badge-teal"}">${label(item.severity)}</span><b>${sentence(item.label)}</b></div><p>${sentence(item.harmCategory)}</p><dl><div><dt>Default</dt><dd>${label(item.defaultAction)}</dd></div><div><dt>Route</dt><dd>${label(item.specialistRoute)}</dd></div><div><dt>Provenance</dt><dd>${sentence(item.provenance)}</dd></div><div><dt>Context guard</dt><dd>${sentence(item.contextSafeguard)}</dd></div></dl></article>`;
}

function routeCard(route) {
  return `<article class="specialist-route priority-${label(route.priority)}"><div><span class="route-node"></span><b>${sentence(route.label)}</b><span class="badge">${label(route.priority)}</span></div><p>${sentence(route.nextStep)}</p><small>${sentence(route.boundary)}</small><em>${label(route.externalDelivery)}</em></article>`;
}

function gateMarkup(gate) {
  const release = gate?.releaseGate || {};
  const passed = release.status === "passed";
  return `<div class="adversarial-gate ${passed ? "gate-pass" : "gate-pending"}"><div class="gate-orb">${passed ? "✓" : "○"}</div><div class="gate-summary"><span class="eyebrow">Generated evasion release gate</span><h2>${passed ? "Release gate passed" : "Release gate requires a run"}</h2><p>${sentence(release.rule || gate?.boundary)}</p><small>${sentence(gate?.boundary)} · raw fixtures returned: no</small></div><div class="gate-metrics"><span><strong>${Number(gate?.generated || 0)}</strong>generated</span><span><strong>${Number(gate?.severeMisses || 0)}</strong>severe misses</span><span><strong>${Number(gate?.falsePositives || 0)}</strong>control regressions</span><span><strong>${gate?.createdAt ? sentence(when(gate.createdAt)) : "not run"}</strong>latest run</span></div><button class="btn btn-teal" data-run-adversarial>${passed ? "Run again" : "Run protected gate"}</button></div>`;
}

function analysisMarkup(analysis) {
  const decision = analysis.decision || {};
  const reasoning = analysis.reasoning || {};
  const target = reasoning.target || {};
  const risk = reasoning.contextRisk || {};
  const route = analysis.specialistRouting || {};
  const profanity = reasoning.profanity || {};
  const semantic = reasoning.semanticIntent || {};
  const semanticSummary = semantic.summary || {};
  const clauseCards = (semantic.clauses || []).map((clause) => `<article class="semantic-clause ${clause.harmful ? "is-harmful" : "is-safe"}"><div><span>Clause ${Number(clause.ordinal || 0)}</span><b>${clause.harmful ? "Intervention signal" : "Context retained"}</b></div><strong>${sentence(clause.speechAct?.label)}</strong><small>${sentence(clause.target?.basis)} · ${sentence(clause.stance)}${clause.profanity?.present ? ` · profanity: ${sentence(clause.profanity.function)}` : ""}</small></article>`).join("");
  const counterfactualCards = (semantic.counterfactuals || []).map((item) => `<article><span>${sentence(item.label)}</span><b>${item.harmful ? "Harm remains" : "No harmful intent remains"}</b><small>${sentence(item.conclusion)}</small></article>`).join("");
  return `<div class="reasoning-result outcome-${label(decision.outcome)}">
    <div class="reasoning-result-head"><span class="decision-pill">${label(decision.outcome)}</span><div><span class="eyebrow">Server-owned decision</span><h2>${sentence(decision.action)}</h2><p>${sentence(decision.reason)}</p></div><div class="risk-dial"><strong>${Number(risk.score || 0)}</strong><span>${label(risk.band)} context risk</span></div></div>
    <div class="reason-grid"><article><span>Target</span><b>${sentence(target.class)}</b><small>${sentence(target.role || target.basis)}</small></article><article><span>Speech act</span><b>${sentence(reasoning.speechAct)}</b><small>${sentence(reasoning.stance)}</small></article><article><span>Abuse mechanism</span><b>${sentence(reasoning.mechanism)}</b><small>${label(decision.policyFamily)}${decision.policyFamily !== decision.category ? ` · ${label(decision.category)}` : ""}</small></article>${profanity.present ? `<article><span>Profanity function</span><b>${sentence(profanity.function)}</b><small>${profanity.abuseSignal ? "Targeted abuse signal" : "No abuse signal"} · ${sentence(profanity.rationale)}</small></article>` : ""}<article><span>Specialist route</span><b>${sentence(route.label)}</b><small>${sentence(route.nextStep)}</small></article><article><span>Language / script</span><b>${(reasoning.language?.scripts || []).map(label).join(" · ")}</b><small>${(reasoning.language?.signals || []).map(sentence).join(" · ")}</small></article><article><span>Cross-thread context</span><b>${Number(risk.priorTargetedInterventions || 0)} prior interventions</b><small>${(risk.signals || []).map(sentence).join(" · ") || "No contextual escalation signal"}${route.additionalRoutes?.length ? ` · additional route: ${route.additionalRoutes.map(label).join(" · ")}` : ""}</small></article></div>
    <section class="semantic-proof"><div class="semantic-proof-head"><div><span class="eyebrow">Clause-level semantic proof</span><h3>${Number(semanticSummary.clauseCount || 0)} clause${semanticSummary.clauseCount === 1 ? "" : "s"} · ${Number(semanticSummary.harmfulClauses || 0)} harmful</h3></div><span class="badge ${semantic.severeFloor?.locked ? "badge-danger" : "badge-teal"}">${semantic.severeFloor?.locked ? "severe floor locked" : semantic.disagreement?.present ? "policy disagreement resolved" : "policy agrees"}</span></div><div class="semantic-clause-grid">${clauseCards}</div><div class="counterfactual-grid">${counterfactualCards}</div><p class="semantic-boundary">${sentence(semantic.severeFloor?.reason)} ${sentence(semantic.confidence)}. Submitted wording is not returned in this response.</p></section>
    <div class="reasoning-trail">${(analysis.pipeline || []).map((stage, index) => `<span class="complete"><i>${index + 1}</i>${sentence(stage.label)}</span>`).join("")}</div><div class="reasoning-boundary"><b>Decision boundary</b><span>${sentence(route.boundary)} ${sentence(analysis.boundaries?.coverage)}</span></div></div>`;
}

function paint(outlet, data) {
  const graph = data.policyGraph || {};
  const gate = data.adversarialGate || {};
  const coverage = data.languageCoverage || {};
  outlet.innerHTML = `<div class="safety-intelligence-wrap">
    <section class="safety-hero"><div><span class="safety-live-pill"><i></i> Server authority active</span><span class="eyebrow">V4.19.0 · Semantic Context & Intent Engine</span><h1>One decision. Ten explainable stages.</h1><p>Every post is separated into clauses, resolved by target and speech act, checked against counterfactuals, then passed through the non-downgradable severe-harm floor, context, specialist routing and action.</p><div class="safety-authority-row"><span><b>SERVER</b>final enforcement authority</span><span><b>BROWSER</b>early intervention + evidence signal</span><span><b>POLICY</b>cannot auto-learn into production</span></div></div><aside><strong>${Number(graph.families?.length || 0)}</strong><span>governed harm families</span><strong>${Number(coverage.functionalGroupsInherited || 0)}</strong><span>functional language groups inherited</span><small>${sentence(coverage.boundary)}</small></aside></section>

    <section class="safety-pipeline">${(data.pipeline || []).map(pipelineCard).join("")}</section>

    <section class="safety-panel reasoning-inspector"><div class="safety-panel-head"><div><span class="eyebrow">Live reasoning inspector</span><h2>See what the language is doing—and whether it is harmful.</h2><p>The submitted wording is analysed in memory and is not returned in the response.</p></div><span class="badge badge-teal">${label(data.authority?.decision)}</span></div><form data-safety-inspect><textarea name="text" minlength="1" maxlength="5000" required placeholder="Type any wording, spelling or language to inspect…"></textarea><div class="inspector-context"><label><input name="athlete" type="checkbox"> Target is a verified athlete</label><label><input name="u18" type="checkbox"> Target is under 18</label><label>Prior interventions<select name="prior"><option value="0">None</option><option value="1">1 prior</option><option value="2">2 prior</option><option value="4">4 prior</option></select></label><button class="btn btn-teal">Analyse server reasoning</button></div></form><div data-reasoning-result class="reasoning-empty"><span>◎</span><b>Awaiting a probe</b><p>Results will show clauses, targets, speech acts, profanity function, counterfactuals, abuse mechanism, severe-floor state, context risk and specialist route.</p></div></section>

    <section class="safety-panel" data-adversarial-panel>${gateMarkup(gate)}<div class="mutation-strip">${(gate.mutationFamilies || []).map((item) => `<span>${sentence(item)}</span>`).join("")}</div>${gate.families?.length ? `<div class="family-gate-grid">${gate.families.map((item) => `<article><b>${label(item.id)}</b><strong>${item.passed}/${item.generated}</strong><span>${item.severeMisses} severe misses</span></article>`).join("")}</div>` : ""}</section>

    <section class="safety-panel"><div class="safety-panel-head"><div><span class="eyebrow">Governed policy graph</span><h2>A harm model, not a public banned-word list.</h2><p>Each family carries an action, specialist route, provenance, native-review requirement and false-positive boundary.</p></div><span class="badge">${sentence(graph.version)}</span></div><div class="policy-family-grid">${(graph.families || []).map(policyCard).join("")}</div><div class="governance-rail"><span><b>1 · Native review</b>language and cultural meaning</span><span><b>2 · Regression</b>severe and neutral controls</span><span><b>3 · Shadow</b>measured without live power</span><span><b>4 · Human promotion</b>audited release decision</span></div></section>

    <section class="safety-panel"><div class="safety-panel-head"><div><span class="eyebrow">Specialist harm routing</span><h2>Different risks receive different responses.</h2><p>Self-harm language is not treated as an attacker threat; privacy, hate, sexual harm, violence and child safeguarding have separate routes.</p></div></div><div class="specialist-route-grid">${(data.specialistRoutes || []).map(routeCard).join("")}</div></section>

    <section class="safety-boundary"><b>Operational truth</b><span>Broad deterministic demo coverage is active. No claim of universal language quality, human replacement, clinical assessment, threat credibility or external WTA/ATP delivery is made without representative evidence and configured services.</span></section>
  </div>`;
  attach(outlet);
}

function attach(outlet) {
  outlet.querySelector("[data-safety-inspect]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector("button");
    const result = outlet.querySelector("[data-reasoning-result]");
    button.disabled = true;
    result.innerHTML = `<span class="reasoning-spinner">◌</span><b>Running the ten-stage server path…</b>`;
    try {
      const u18 = form.elements.u18.checked;
      const athlete = form.elements.athlete.checked;
      const payload = await inspectSafetyIntelligence({
        text: form.elements.text.value,
        context: {
          targetUserId: u18 ? "u_u18" : (athlete ? "u_athlete" : null),
          targetRole: u18 ? "under-18 participant" : (athlete ? "professional athlete" : null),
          targetIsU18: u18, targetIsAthlete: athlete,
          cumulativeSignals: Number(form.elements.prior.value), turnsConsidered: Number(form.elements.prior.value) ? 7 : 1,
        },
      });
      result.className = "";
      result.innerHTML = analysisMarkup(payload.analysis);
    } catch (error) {
      result.className = "reasoning-empty";
      result.innerHTML = `<span>!</span><b>Analysis held safe</b><p>${sentence(error?.message || "The reasoning request failed.")}</p>`;
    } finally { button.disabled = false; }
  });

  outlet.querySelector("[data-run-adversarial]")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try {
      const result = await runSafetyAdversarialGate();
      const gate = result.adversarialGate;
      toast(`Release gate ${gate.releaseGate.status}: ${gate.severeMisses} severe misses`);
      await hydrate(outlet);
    } catch (error) {
      toast(error?.message || "The protected adversarial gate could not run");
      event.currentTarget.disabled = false;
    }
  });
}
