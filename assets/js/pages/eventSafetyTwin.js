import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import {
  getEventSafetyTwinSummary, runEventSafetyTwin, resetEventSafetyTwin,
  updateEventSafetyTwinControls, authorizeEventSafetyTwinPacket,
} from "../serverPlatform.js?v=4.24.1.0";

const label = (value) => escapeHtml(String(value || "unknown").replaceAll("_", " "));
const clock = (value) => value ? new Date(value).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" }) : "—";

export function renderEventSafetyTwin(outlet) {
  if (!isAdmin(useCurrentUser())) {
    outlet.innerHTML = `<div class="card card-pad twin-gate"><span class="eyebrow">Restricted event surface</span><h2>Authorised moderator session required</h2><p class="muted">The Athlete Shield contains simulated incident intelligence and operational controls.</p><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div>`;
    return;
  }
  outlet.innerHTML = `<div class="card card-pad twin-gate"><span class="eyebrow">V4.20.0 · Live Athlete Shield</span><h1>Preparing the Event Safety Twin…</h1></div>`;
  hydrate(outlet);
}

async function hydrate(outlet, animate=false) {
  try {
    const data = await getEventSafetyTwinSummary();
    if (!outlet.isConnected) return;
    paint(outlet, data);
    if (animate && data.run) animateStream(outlet);
  } catch (error) {
    outlet.innerHTML = `<div class="card card-pad twin-gate"><span class="eyebrow">Athlete Shield held safe</span><h2>The event simulator is unavailable</h2><p class="muted">${escapeHtml(error?.message || "The local server could not be reached.")}</p></div>`;
  }
}

function counterCard(value, title, detail, tone="") {
  return `<article class="twin-counter ${tone}"><strong>${Number(value || 0)}</strong><b>${escapeHtml(title)}</b><span>${escapeHtml(detail)}</span></article>`;
}

function streamRow(item, index) {
  const state = item.delivered_to_athlete ? "delivered" : `outcome-${escapeHtml(item.outcome)}`;
  return `<article class="twin-stream-row ${state}" data-stream-row style="--stream-delay:${index * 85}ms"><div class="stream-state"><i></i><b>${item.delivered_to_athlete ? "DELIVERED" : label(item.outcome)}</b></div><div class="stream-body"><p>${escapeHtml(item.safe_preview)}</p><span>${escapeHtml(item.language)} · ${escapeHtml(item.script)} · ${label(item.channel)} · ${label(item.thread_label)}</span></div><div class="stream-reason"><b>${label(item.mechanism)}</b><small>${label(item.speech_act)} · target: ${label(item.target_class)}</small></div></article>`;
}

function inboxCard(item) {
  return `<article><div class="twin-inbox-avatar">${escapeHtml(item.author_alias.slice(-2).toUpperCase())}</div><div><b>${escapeHtml(item.author_alias)}</b><p>${escapeHtml(item.safe_preview)}</p><small>${escapeHtml(item.language)} · delivered</small></div></article>`;
}

function graphSvg(graph) {
  const sources = graph.nodes.filter((node) => node.kind === "source");
  const positions = [[82,58],[82,142],[318,58],[318,142],[82,100],[318,100]];
  const nodeSvg = sources.map((node, index) => {
    const [x,y] = positions[index] || [80 + index * 48, 100];
    return `<g><line x1="${x}" y1="${y}" x2="200" y2="100"></line><circle cx="${x}" cy="${y}" r="25"></circle><text x="${x}" y="${y + 4}" text-anchor="middle">${escapeHtml(node.label.replace("cluster-", ""))}</text></g>`;
  }).join("");
  return `<svg class="twin-graph-svg" viewBox="0 0 400 200" role="img" aria-label="Coordinated account cluster linked to one protected athlete">${nodeSvg}<g class="target"><circle cx="200" cy="100" r="38"></circle><text x="200" y="96" text-anchor="middle">PROTECTED</text><text x="200" y="111" text-anchor="middle">ATHLETE</text></g></svg>`;
}

function replayItem(item) {
  return `<article class="twin-replay-row replay-${escapeHtml(item.outcome)}"><span>${clock(item.at)}</span><i></i><div><b>${escapeHtml(item.title)}</b><small>${escapeHtml(item.detail)}</small></div></article>`;
}

function emptyState(data) {
  return `<div class="twin-wrap">
    ${hero(data, null)}
    <section class="twin-launch"><div><span class="eyebrow">Ready to demonstrate</span><h2>Turn 24 messages into one visible protection story.</h2><p>The deterministic burst includes praise, strong criticism, contextual profanity, multilingual personal attacks, a campaign candidate, simulated image OCR, privacy exposure, self-harm encouragement and a venue-specific threat.</p><div class="twin-boundary"><b>What is real</b><span>The current K1ND server makes every moderation decision. The event, accounts, traffic and media signal are clearly simulated.</span></div></div><div class="twin-launch-console"><span>SIMULATED EVENT INPUT</span><strong>24</strong><b>messages · 15 language variants · 4 scripts</b><select data-twin-scenario><option value="match_point_surge">Match-point surge</option><option value="post_match_pile_on">Post-match pile-on</option><option value="threat_and_campaign">Threat + campaign</option></select><button class="btn btn-teal" data-twin-run>Run live protection demo</button></div></section>
    ${controlsPanel(data.controls)}
  </div>`;
}

function hero(data, run) {
  const counters = run?.counters;
  return `<section class="twin-hero"><div><span class="twin-sim-pill"><i></i> SIMULATED EVENT · REAL K1ND DECISIONS</span><span class="eyebrow">V4.20.0 · Live Athlete Shield & Event Safety Twin</span><h1>Show the abuse the athlete <em>never has to see.</em></h1><p>One live story connects meaning-aware moderation, multilingual targeting, campaign detection, athlete protection and human-authorised safeguarding.</p><div class="twin-hero-actions">${run ? `<button class="btn btn-light" data-twin-run>Replay protection burst</button><button class="btn btn-dark-ghost" data-twin-reset>Reset twin</button>` : ""}<a class="btn btn-dark-ghost" data-link href="/event-command">Open Event Command</a></div></div><aside><div><span>ATHLETE SHIELD</span><strong>${escapeHtml(data.event.target)}</strong><b>${run ? `${counters.protected} hostile messages withheld` : "Ready for event traffic"}</b></div><div class="shield-orb"><span>K1</span><small>PROTECTED</small></div></aside></section>`;
}

function controlsPanel(controls) {
  return `<section class="twin-panel twin-controls"><div class="twin-panel-head"><div><span class="eyebrow">Event controls</span><h2>Human-set protection posture</h2></div><span class="badge badge-warn">${label(controls.mode)}</span></div><form data-twin-controls><label>Protection mode<select name="mode"><option value="standard" ${controls.mode === "standard" ? "selected" : ""}>Standard</option><option value="heightened" ${controls.mode === "heightened" ? "selected" : ""}>Heightened</option><option value="lockdown_demo" ${controls.mode === "lockdown_demo" ? "selected" : ""}>Lockdown demo</option></select></label><label>Reply burst limit<input type="number" name="replyBurstLimit" min="1" max="30" value="${Number(controls.replyBurstLimit)}"></label><label class="twin-check"><input type="checkbox" name="slowMode" ${controls.slowMode ? "checked" : ""}> Slow mode</label><label class="twin-check"><input type="checkbox" name="newAccountFriction" ${controls.newAccountFriction ? "checked" : ""}> New-account friction</label><label class="twin-check"><input type="checkbox" name="enhancedLanguageReview" ${controls.enhancedLanguageReview ? "checked" : ""}> Enhanced language review</label><button class="btn btn-ghost">Apply audited controls</button></form><p class="twin-footnote">Controls affect this local simulation only. K1ND never changes emergency or external-network controls autonomously.</p></section>`;
}

function paint(outlet, data) {
  const run = data.run;
  if (!run) {
    outlet.innerHTML = emptyState(data);
    attach(outlet);
    return;
  }
  const c = run.counters;
  const delivered = run.messages.filter((item) => item.delivered_to_athlete);
  const withheld = run.messages.filter((item) => !item.delivered_to_athlete);
  const graph = run.attackGraph;
  const packet = run.escalation;
  outlet.innerHTML = `<div class="twin-wrap">
    ${hero(data, run)}
    <section class="twin-score-strip">${counterCard(c.received,"received","raw simulated stream")}${counterCard(c.delivered,"delivered","athlete can see","good")}${counterCard(c.protected,"withheld","athlete never sees","danger")}${counterCard(c.languages,"languages","in one event burst","purple")}${counterCard(c.blocked,"hard blocks","severe floor retained","danger")}</section>

    <section class="twin-panel twin-live-panel"><div class="twin-panel-head"><div><span class="eyebrow"><i class="pulse-dot"></i> Live decision stream</span><h2>Every message explained as it arrives.</h2><p>Allowed content remains readable. Intercepted content is replaced with its safety reason and evidence digest.</p></div><div class="twin-stream-progress"><b data-visible-count>${run.messages.length}</b><span>/ ${run.messages.length} processed</span></div></div><div class="twin-stream">${run.messages.map(streamRow).join("")}</div></section>

    <section class="twin-before-after"><div class="twin-panel twin-raw-inbox"><div class="twin-panel-head"><div><span class="eyebrow">Without Athlete Shield</span><h2>Raw exposure</h2></div><strong>${c.received}</strong></div><div class="raw-stack">${run.messages.slice(0,12).map((item) => `<span class="${item.delivered_to_athlete ? "safe" : "hostile"}">${item.delivered_to_athlete ? "support / sporting opinion" : label(item.category)}</span>`).join("")}</div><p class="twin-footnote">A counterfactual count only. Harmful text is not shown.</p></div><div class="twin-transform-arrow"><span>→</span><b>K1ND</b><small>meaning + target + context</small></div><div class="twin-panel twin-protected-inbox"><div class="twin-panel-head"><div><span class="eyebrow">With Athlete Shield</span><h2>Protected inbox</h2></div><strong>${c.delivered}</strong></div><div class="twin-inbox-list">${delivered.map(inboxCard).join("")}</div><div class="shield-summary"><b>${c.protected} hostile messages withheld</b><span>Criticism and emotional sporting language preserved.</span></div></div></section>

    <section class="twin-two-col"><div class="twin-panel twin-graph-panel"><div class="twin-panel-head"><div><span class="eyebrow">Coordinated attack graph</span><h2>From isolated posts to one campaign candidate.</h2></div><span class="badge badge-danger">${label(graph.status)}</span></div>${graphSvg(graph)}<div class="graph-signals"><span><strong>${graph.signals.accounts}</strong>accounts</span><span><strong>${graph.signals.interventions}</strong>interventions</span><span><strong>${graph.signals.threads}</strong>threads</span><span><strong>${graph.signals.languages}</strong>languages</span></div><div class="graph-verdict"><strong>${graph.coordinationScore}/100</strong><span>coordination routing score</span><small>${escapeHtml(graph.scoreMeaning)} · human verification required</small></div></div>
      <div class="twin-panel twin-fusion-panel"><div class="twin-panel-head"><div><span class="eyebrow">Multimodal incident fusion</span><h2>One target, every surface.</h2></div><span class="badge">SIMULATED OCR</span></div><div class="fusion-stack"><article><i>TXT</i><div><b>Multilingual replies</b><span>${withheld.filter((item) => item.channel !== "image_ocr").length} withheld across text surfaces</span></div></article><article><i>IMG</i><div><b>Screenshot text signal</b><span>${withheld.some((item) => item.media_signal) ? "OCR evidence joined to the same target graph" : "No media signal"}</span></div></article><article><i>CTX</i><div><b>Cross-thread context</b><span>${graph.signals.threads} threads resolved to one protected person</span></div></article></div><div class="fusion-result"><span>FUSED INCIDENT</span><b>campaign candidate + athlete target + severe event</b><small>Raw hostile content remains restricted.</small></div></div></section>

    <section class="twin-two-col"><div class="twin-panel twin-copilot"><div class="twin-panel-head"><div><span class="eyebrow">Moderator Copilot</span><h2>What should the human do next?</h2></div><span class="badge badge-teal">recommendation only</span></div><div class="copilot-list">${run.copilot.recommendations.map((item, index) => `<article class="priority-${escapeHtml(item.priority)}"><span>0${index + 1}</span><div><b>${escapeHtml(item.title)}</b><p>${escapeHtml(item.reason)}</p><small>${escapeHtml(item.suggestedAction)}</small></div><em>not auto-applied</em></article>`).join("")}</div><div class="twin-boundary"><b>Human authority</b><span>No emergency decision, account action or external delivery is performed automatically.</span></div></div>
      <div class="twin-panel twin-packet"><div class="twin-panel-head"><div><span class="eyebrow">Safeguarding escalation packet</span><h2>Ready for human review—not auto-send.</h2></div><span class="badge ${packet.state === "pending_human_authorization" ? "badge-danger" : "badge-warn"}">${label(packet.state)}</span></div><div class="packet-route"><span>DESTINATION</span><b>${escapeHtml(packet.destination)}</b><small>connector: ${label(packet.connectorState)} · external sent: no</small></div><div class="packet-signals">${packet.signals.map((signal) => `<span>✓ ${escapeHtml(signal)}</span>`).join("")}</div><div class="packet-checks"><b>Human must verify</b>${packet.requiredHumanChecks.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>${packet.state === "pending_human_authorization" ? `<button class="btn btn-teal" data-packet-authorize="${escapeHtml(packet.packetId)}">Authorise local packet</button>` : `<div class="packet-approved"><b>Human authorised</b><span>Packet remains local. No external message was sent.</span></div>`}<p class="twin-footnote">This action records approval in the local demo only; WTA/ATP connectivity is not configured.</p></div></section>

    <section class="twin-two-col replay-controls"><div class="twin-panel"><div class="twin-panel-head"><div><span class="eyebrow">Incident replay</span><h2>Reconstruct the protection sequence.</h2></div><span class="adm-count">${run.timeline.length} events</span></div><div class="twin-replay">${run.timeline.map(replayItem).join("")}</div></div>${controlsPanel(data.controls)}</section>

    <section class="twin-truth"><b>Demo truth</b><span>${escapeHtml(data.boundaries.simulation)} ${escapeHtml(data.boundaries.delivery)}</span></section>
  </div>`;
  attach(outlet);
}

function animateStream(outlet) {
  const rows = [...outlet.querySelectorAll("[data-stream-row]")];
  const count = outlet.querySelector("[data-visible-count]");
  rows.forEach((row) => row.classList.add("stream-pending"));
  if (count) count.textContent = "0";
  rows.forEach((row, index) => window.setTimeout(() => {
    if (!row.isConnected) return;
    row.classList.remove("stream-pending");
    row.classList.add("stream-arrived");
    if (count) count.textContent = String(index + 1);
  }, 90 * index));
}

function attach(outlet) {
  outlet.querySelectorAll("[data-twin-run]").forEach((button) => button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Running live protection…";
    const scenario = outlet.querySelector("[data-twin-scenario]")?.value || "match_point_surge";
    try { await runEventSafetyTwin(scenario); toast("Athlete Shield processed the simulated event burst"); await hydrate(outlet, true); }
    catch (error) { toast(error?.message || "The Event Safety Twin could not run"); button.disabled = false; }
  }));
  outlet.querySelector("[data-twin-reset]")?.addEventListener("click", async (event) => {
    event.currentTarget.disabled = true;
    try { await resetEventSafetyTwin(); toast("Event Safety Twin reset"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "The Event Safety Twin could not reset"); event.currentTarget.disabled = false; }
  });
  outlet.querySelector("[data-twin-controls]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = event.currentTarget; const button = form.querySelector("button"); button.disabled = true;
    try { await updateEventSafetyTwinControls({ mode:form.elements.mode.value, replyBurstLimit:Number(form.elements.replyBurstLimit.value), slowMode:form.elements.slowMode.checked, newAccountFriction:form.elements.newAccountFriction.checked, enhancedLanguageReview:form.elements.enhancedLanguageReview.checked }); toast("Event controls updated and audited"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "Event controls were not changed"); button.disabled = false; }
  });
  outlet.querySelector("[data-packet-authorize]")?.addEventListener("click", async (event) => {
    const button = event.currentTarget; button.disabled = true;
    try { await authorizeEventSafetyTwinPacket(button.dataset.packetAuthorize); toast("Local packet authorised · no external message sent"); await hydrate(outlet); }
    catch (error) { toast(error?.message || "The packet was not authorised"); button.disabled = false; }
  });
}
