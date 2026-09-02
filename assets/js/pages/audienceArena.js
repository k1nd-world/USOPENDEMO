import { isAdmin, useCurrentUser } from "../store.js?v=4.24.1.0";
import { moderateContent } from "../moderation.js?v=4.24.1.0";
import { refineRewrite } from "../intentRewrite.js?v=4.24.1.0";
import {
  audienceArenaEventsUrl, getArenaPublicPreview, getArenaSessionState,
  getAudienceArenaSummary, hydrateArenaSession, joinAudienceArena,
  leaveAudienceArena, resetAudienceArena, runAudienceArenaRehearsal,
  sendAudienceArenaMessage, updateAudienceArenaControls,
} from "../arenaPlatform.js?v=4.24.1.0";
import { escapeHtml, timeAgo } from "../lib/util.js";
import { toast } from "../lib/ui.js";

let fanArena = null;
let fanDecision = null;
let fanRewrite = null;
let fanDraft = "";
let fanSource = null;
let fanPoll = null;
let fanConnection = "connecting";
let athleteArena = null;
let athleteSource = null;
let athletePoll = null;
let athleteConnection = "connecting";
let controlArena = null;
let controlSource = null;
let controlPoll = null;
let controlConnection = "connecting";

const FAN_PRESETS = [
  ["Pure passion", "Fuck what a great shot"],
  ["Sporting criticism", "That second serve was too predictable today."],
  ["Mixed attack", "Your first serve kept landing short, you useless clown."],
  ["Credible threat", "I will hurt you outside the stadium after the match."],
];

function stopFanLive() { if (fanSource) fanSource.close(); fanSource = null; clearTimeout(fanPoll); }
function stopAthleteLive() { if (athleteSource) athleteSource.close(); athleteSource = null; clearTimeout(athletePoll); }
function stopControlLive() { if (controlSource) controlSource.close(); controlSource = null; clearTimeout(controlPoll); }

export async function renderAudienceArena(outlet) {
  stopAthleteLive(); stopControlLive(); stopFanLive();
  outlet.innerHTML = loading("Opening the Live Audience Arena…", "Checking the room and your temporary event pass.");
  let preview;
  try {
    const requestedCode = new URLSearchParams(window.location.search).get("room") || "";
    preview = (await getArenaPublicPreview(requestedCode)).arena;
    await hydrateArenaSession();
    if (getArenaSessionState().authenticated) fanArena = (await getAudienceArenaSummary("fan")).arena;
  } catch (error) {
    outlet.innerHTML = errorCard("Arena connection unavailable", error.message);
    return;
  }
  if (!getArenaSessionState().authenticated || !fanArena) {
    paintJoin(outlet, preview);
    return;
  }
  paintFan(outlet);
  connectFan(outlet);
}

function paintJoin(outlet, preview) {
  const code = new URLSearchParams(window.location.search).get("room") || "";
  outlet.innerHTML = `
    <div class="arena-wrap arena-join-wrap">
      <section class="arena-join-hero">
        <div><span class="arena-live-pill"><i></i> ${escapeHtml(preview.status)} · local venue mode</span>
          <h1>Join ${escapeHtml(preview.event.court)}.<br><em>Your voice, protected in real time.</em></h1>
          <p>Use the room code from the presenter. Your temporary event pass lasts only for this demonstration and does not create a permanent social account.</p>
          <div class="arena-proof-row"><span>✓ Server-owned decisions</span><span>✓ No external service required</span><span>✓ Hostile originals stay away from ${escapeHtml(preview.event.score.player)}</span></div>
        </div>
        <form class="arena-join-card" data-arena-join>
          <span class="mini-kicker">Temporary event pass</span><h2>Enter the Arena</h2>
          <label>Display name<input name="displayName" maxlength="30" autocomplete="nickname" placeholder="Your first name" required></label>
          <label>Room code<input name="roomCode" value="${escapeHtml(code)}" maxlength="12" autocomplete="off" placeholder="K1ND••" required></label>
          <button class="btn btn-teal" type="submit">Join live audience</button>
          <small>${preview.activeParticipants} audience participants connected · room ${escapeHtml(preview.status)}</small>
        </form>
      </section>
      <section class="arena-join-story"><article><b>1 · Speak naturally</b><p>Passion and strong sporting criticism remain welcome.</p></article><article><b>2 · See the reason</b><p>K1ND explains target, speech act, abuse mechanism and delivery action.</p></article><article><b>3 · Repair the point</b><p>Mixed abuse can keep its real sporting observation without a generic rewrite.</p></article><article><b>4 · Protect the player</b><p>Only allowed content enters the athlete stream.</p></article></section>
      <div class="arena-boundary"><b>Offline-safe demonstration</b><span>All interface assets and moderation logic used here are local. Multiple devices require a trusted local network explicitly enabled by the presenter.</span></div>
    </div>`;
  outlet.querySelector("[data-arena-join]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = event.currentTarget.querySelector("button");
    const form = new FormData(event.currentTarget); button.disabled = true; button.textContent = "Issuing temporary pass…";
    try {
      const result = await joinAudienceArena(form.get("displayName"), form.get("roomCode"));
      fanArena = result.arena; fanDecision = null; fanDraft = "";
      paintFan(outlet); connectFan(outlet);
    } catch (error) {
      toast(error.message || "The event pass could not be issued"); button.disabled = false; button.textContent = "Join live audience";
    }
  });
}

function paintFan(outlet) {
  const session = getArenaSessionState();
  const c = fanArena.counters; const crowd = fanArena.crowd;
  const athlete = fanArena.event.score.player;
  outlet.innerHTML = `
    <div class="arena-wrap arena-fan-wrap">
      <section class="arena-fan-hero">
        <div><span class="arena-live-pill"><i></i> LIVE · ${escapeHtml(fanArena.event.court)} · ${connectionLabel(fanConnection)}</span>
          <h1>The crowd is live.<br><em>The harm isn't.</em></h1>
          <p>Every reaction is checked by the active K1ND server before ${escapeHtml(athlete)}'s separate screen can receive it.</p></div>
        ${scoreCard(fanArena.event)}
      </section>
      <section class="arena-proof-strip"><span><b>${c.participants}</b> joined</span><span><b>${c.received}</b> received</span><span class="good"><b>${c.delivered}</b> reached ${escapeHtml(athlete)}</span><span class="protected"><b>${c.withheld}</b> protected</span><span><b>${fanArena.latency.latestMs ?? "—"}ms</b> latest local decision</span></section>
      <section class="arena-fan-grid">
        <div class="arena-compose-card">
          <div class="arena-person-row"><span>${escapeHtml(initials(session.displayName))}</span><div><b>${escapeHtml(session.displayName)}</b><small>${escapeHtml(session.badge)} · temporary</small></div><button type="button" data-arena-leave>Leave</button></div>
          <form data-arena-message><textarea name="message" rows="5" maxlength="700" placeholder="React to the match…" required>${escapeHtml(fanDraft)}</textarea>
            <div class="arena-preset-row">${FAN_PRESETS.map(([label,text]) => `<button type="button" data-arena-preset="${escapeHtml(text)}">${escapeHtml(label)}</button>`).join("")}</div>
            <div class="arena-submit-row"><span><i></i> Room ${escapeHtml(fanArena.state.status)} · ${escapeHtml(pretty(fanArena.state.shieldLevel))} shield</span><button class="btn btn-teal" type="submit">Send live reaction</button></div>
          </form>
          ${renderFanDecision()}
        </div>
        <aside class="arena-pulse-card"><span class="mini-kicker">Live delivery pulse</span><h2>${escapeHtml(pretty(crowd.status))}</h2><p>${escapeHtml(crowd.meaning)}</p><div class="arena-pressure"><i style="width:${crowd.score}%"></i></div>
          <div class="arena-pulse-facts"><span><b>${crowd.score}/100</b> pressure</span><span><b>${crowd.harmfulSignals}</b> harm signals</span><span><b>${escapeHtml(pretty(crowd.friction))}</b> friction</span><span><b>${crowd.replyDelaySeconds}s</b> delay</span></div>
          <div class="arena-offline-ready"><b>● Venue-local mode ready</b><small>SSE live updates with automatic timed fallback. No cloud service is required.</small></div>
        </aside>
      </section>
      <section class="arena-stream"><div><span class="mini-kicker">Audience room</span><h2>What the conversation becomes</h2></div><div class="arena-stream-list">${fanArena.roomStream.slice().reverse().map(streamItem).join("") || `<div class="match-empty">Be the first live reaction.</div>`}</div></section>
      <div class="arena-boundary"><b>Temporary participation, permanent boundary</b><span>${escapeHtml(fanArena.boundaries.privacy)} ${escapeHtml(fanArena.boundaries.operations)}</span></div>
    </div>`;
  attachFan(outlet);
}

function renderFanDecision() {
  if (!fanDecision) return `<div class="arena-decision-empty"><span>↗</span><div><b>Your server decision will appear here</b><small>The fan explanation and athlete delivery happen from one authoritative result.</small></div></div>`;
  const d = fanDecision;
  const rewrite = ["warning","review"].includes(d.outcome) && fanRewrite?.suggestion
    ? `<div class="arena-rewrite"><span>YOUR POINT KEPT</span><p>${escapeHtml(fanRewrite.preservedPoint || "The sporting observation")}</p><blockquote>${escapeHtml(fanRewrite.suggestion)}</blockquote><button class="btn btn-teal btn-sm" type="button" data-arena-rewrite>Send safer version</button></div>`
    : d.outcome !== "clean" ? `<div class="match-no-rewrite"><b>No generic rewrite invented</b><span>${escapeHtml(fanRewrite?.rationale || "State a real sporting point in your own words.")}</span></div>` : "";
  return `<div class="arena-decision outcome-${escapeHtml(d.outcome)}"><div class="arena-decision-head"><span>${d.deliveredToAthlete ? "DELIVERED LIVE" : "KEPT FROM ATHLETE"}</span><b>${escapeHtml(d.intervention)}</b><small>${escapeHtml(pretty(d.category))} · ${d.latencyMs}ms local decision · evidence ${escapeHtml(d.evidenceDigest)}</small></div>
    <div class="arena-why"><span><small>Target</small><b>${escapeHtml(d.target)}</b></span><span><small>Speech act</small><b>${escapeHtml(d.speechAct)}</b></span><span><small>Mechanism</small><b>${escapeHtml(d.mechanism)}</b></span><span><small>Profanity function</small><b>${escapeHtml(d.profanityFunction)}</b></span></div>${rewrite}</div>`;
}

function attachFan(outlet) {
  outlet.querySelectorAll("[data-arena-preset]").forEach((button) => button.addEventListener("click", () => {
    const box = outlet.querySelector('[name="message"]'); box.value = button.dataset.arenaPreset; fanDraft = box.value; box.focus();
  }));
  outlet.querySelector('[name="message"]')?.addEventListener("input", (event) => { fanDraft = event.target.value; });
  outlet.querySelector("[data-arena-message]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const button = event.currentTarget.querySelector('button[type="submit"]');
    const text = String(new FormData(event.currentTarget).get("message") || "").trim(); if (!text) return;
    button.disabled = true; button.textContent = "K1ND is reading the moment…";
    try {
      const client = moderateContent(text, { targetUserId:"u_athlete", targetIsAthlete:true, turnsConsidered:12, postMatchWindow:true });
      fanRewrite = client.rewrite || refineRewrite(text, client);
      const result = await sendAudienceArenaMessage(text); fanArena = result.arena; fanDecision = result.fanDecision;
      if (fanDecision.outcome === "clean") fanDraft = ""; paintFan(outlet);
    } catch (error) {
      toast(error.retryAfter ? `${error.message} Try again in ${error.retryAfter}s.` : error.message); button.disabled = false; button.textContent = "Send live reaction";
    }
  });
  outlet.querySelector("[data-arena-rewrite]")?.addEventListener("click", async () => {
    if (!fanRewrite?.suggestion) return;
    try {
      const result = await sendAudienceArenaMessage(fanRewrite.suggestion, "accepted_rewrite");
      fanArena = result.arena; fanDecision = result.fanDecision; fanRewrite = null; fanDraft = ""; paintFan(outlet);
      toast(result.fanDecision.deliveredToAthlete ? `Your safer version reached ${fanArena.event.score.player}` : "The new draft needs another check");
    } catch (error) { toast(error.message); }
  });
  outlet.querySelector("[data-arena-leave]")?.addEventListener("click", async () => {
    try { await leaveAudienceArena(); fanArena = null; fanDecision = null; fanRewrite = null; stopFanLive(); renderAudienceArena(outlet); }
    catch (error) { toast(error.message); }
  });
}

function connectFan(outlet) {
  scheduleFanPoll(outlet);
  if (fanSource || !window.EventSource) { fanConnection = "timed fallback"; return; }
  fanConnection = "live stream + fallback";
  fanSource = new EventSource(audienceArenaEventsUrl("fan", "", fanArena.revision));
  paintFan(outlet);
  fanSource.addEventListener("arena", (event) => {
    if (!document.body.contains(outlet)) return stopFanLive();
    try { fanArena = JSON.parse(event.data).arena; fanConnection = "live stream + fallback"; paintFan(outlet); }
    catch (_) {}
  });
  fanSource.onerror = () => { if (fanSource) fanSource.close(); fanSource = null; fanConnection = "timed fallback"; };
}

function scheduleFanPoll(outlet) {
  clearTimeout(fanPoll); fanPoll = setTimeout(async () => {
    if (!document.body.contains(outlet)) return stopFanLive();
    try { const next = (await getAudienceArenaSummary("fan")).arena; if (next.revision !== fanArena.revision) { fanArena = next; paintFan(outlet); } }
    catch (_) {}
    scheduleFanPoll(outlet);
  }, 1250);
}

export async function renderArenaAthlete(outlet) {
  stopFanLive(); stopControlLive(); stopAthleteLive();
  const code = new URLSearchParams(window.location.search).get("room") || "";
  if (!code) return paintAthleteGate(outlet);
  outlet.innerHTML = loading("Opening the protected live screen…", "Requesting the athlete-only payload.");
  try { athleteArena = (await getAudienceArenaSummary("athlete", code)).arena; }
  catch (error) { return paintAthleteGate(outlet, error.message); }
  paintAthlete(outlet, code); connectAthlete(outlet, code);
}

function paintAthleteGate(outlet, message="Enter the active room code to open the protected athlete screen.") {
  outlet.innerHTML = `<div class="arena-athlete-gate"><section><span class="arena-live-pill">K1ND ATHLETE SCREEN</span><h1>Protected live stream</h1><p>${escapeHtml(message)}</p><form data-athlete-code><input name="room" placeholder="Room code" required><button class="btn btn-teal">Open protected screen</button></form></section></div>`;
  outlet.querySelector("[data-athlete-code]")?.addEventListener("submit", (event) => {
    event.preventDefault(); const code = String(new FormData(event.currentTarget).get("room") || "").trim().toUpperCase();
    history.replaceState({}, "", `/arena-athlete?room=${encodeURIComponent(code)}`); renderArenaAthlete(outlet);
  });
}

function paintAthlete(outlet, code) {
  const c = athleteArena.counters;
  const athlete = athleteArena.athlete;
  outlet.innerHTML = `<div class="arena-athlete-screen">
    <header class="arena-athlete-head"><div><span class="arena-live-pill"><i></i> LIVE PROTECTED STREAM · ${connectionLabel(athleteConnection)}</span><h1>${escapeHtml(athlete.displayName)}</h1><p>${escapeHtml(athlete.handle)} · ${escapeHtml(athleteArena.event.court)} · personal shield ${escapeHtml(athleteArena.state.shieldLevel)}</p></div><div class="athlete-score"><span><b>${escapeHtml(athleteArena.event.score.sets)}</b><small>vs ${escapeHtml(athleteArena.event.score.opponent)}</small></span><span><b>LIVE</b><small>${escapeHtml(athleteArena.event.court)}</small></span></div></header>
    <section class="athlete-screen-proof"><span><b>${c.delivered}</b> live messages</span><span><b>${c.withheld}</b> kept away</span><span><b>0</b> hostile originals shown</span><span><b>${athleteArena.latency.latestMs ?? "—"}ms</b> latest local decision</span></section>
    <section class="arena-athlete-main"><div class="athlete-live-inbox"><div><span class="mini-kicker">Live audience</span><h2>What ${escapeHtml(athlete.displayName)} receives</h2></div><div class="athlete-live-list">${athleteArena.athleteInbox.slice().reverse().map(athleteItem).join("") || `<div class="athlete-live-empty"><b>Your stream is ready</b><p>Allowed live reactions will arrive here without exposing intercepted originals.</p></div>`}</div></div>
      <aside class="athlete-live-aside"><div class="athlete-shield-orb">K1</div><span class="mini-kicker">Personal shield digest</span><h2>${escapeHtml(athleteArena.shieldDigest.headline)}</h2><p>${escapeHtml(athleteArena.shieldDigest.wellbeingCopy)}</p><div class="digest-tags">${athleteArena.shieldDigest.categories.map(item => `<span>${escapeHtml(pretty(item.category))} <b>${item.count}</b></span>`).join("") || `<span>Healthy conversation</span>`}</div><small>Raw hostile wording is never included in this role's server payload.</small></aside>
    </section>
    <footer class="arena-athlete-footer"><b>Passion reaches you. Personal abuse doesn't.</b><span>${escapeHtml(athleteArena.boundaries.operations)}</span></footer>
  </div>`;
}

function connectAthlete(outlet, code) {
  scheduleAthletePoll(outlet, code);
  if (athleteSource || !window.EventSource) { athleteConnection = "timed fallback"; return; }
  athleteConnection = "live stream + fallback";
  athleteSource = new EventSource(audienceArenaEventsUrl("athlete", code, athleteArena.revision));
  paintAthlete(outlet, code);
  athleteSource.addEventListener("arena", (event) => { if (!document.body.contains(outlet)) return stopAthleteLive(); try { athleteArena = JSON.parse(event.data).arena; athleteConnection = "live stream + fallback"; paintAthlete(outlet, code); } catch (_) {} });
  athleteSource.onerror = () => { if (athleteSource) athleteSource.close(); athleteSource = null; athleteConnection = "timed fallback"; };
}

function scheduleAthletePoll(outlet, code) { clearTimeout(athletePoll); athletePoll = setTimeout(async () => { if (!document.body.contains(outlet)) return stopAthleteLive(); try { const next = (await getAudienceArenaSummary("athlete", code)).arena; if (next.revision !== athleteArena.revision) { athleteArena = next; paintAthlete(outlet, code); } } catch (_) {} scheduleAthletePoll(outlet, code); }, 900); }

export async function renderArenaControl(outlet) {
  stopFanLive(); stopAthleteLive(); stopControlLive();
  if (!isAdmin(useCurrentUser())) { outlet.innerHTML = errorCard("Moderator session required", "Sign in as Jordan Blake to operate the Arena."); return; }
  outlet.innerHTML = loading("Opening Arena Control…", "Connecting the QR handoff, live ledger and protected athlete stream.");
  const code = new URLSearchParams(window.location.search).get("room") || "";
  try { controlArena = (await getAudienceArenaSummary("presenter", code)).arena; }
  catch (error) { outlet.innerHTML = errorCard("Arena Control unavailable", error.message); return; }
  paintControl(outlet); connectControl(outlet, code);
}

function paintControl(outlet) {
  const c = controlArena.counters; const joinUrl = `${window.location.origin}${controlArena.joinPath}`;
  outlet.innerHTML = `<div class="arena-wrap arena-control-wrap">
    <section class="arena-control-hero"><div><span class="arena-live-pill"><i></i> LIVE AUDIENCE ARENA · ${connectionLabel(controlConnection)}</span><h1>Turn the room into the demonstration.</h1><p>Audience phones, the athlete screen and this command view receive separate server-owned payloads from one decision stream.</p></div>${scoreCard(controlArena.event)}</section>
    <section class="arena-control-grid">
      <div class="arena-qr-card"><div><span class="mini-kicker">Audience handoff</span><h2>Scan. Join. React.</h2><p>For phones, use a trusted local network and replace the loopback host with the presenter's explicitly enabled LAN address.</p></div><img src="/api/audience-arena/qr.png?url=${encodeURIComponent(joinUrl)}" alt="QR code for the local Arena join link"><div class="arena-code"><small>ROOM CODE</small><b>${escapeHtml(controlArena.roomCode)}</b></div><input data-arena-join-url value="${escapeHtml(joinUrl)}" aria-label="Audience join URL"><div class="button-row"><button class="btn btn-ghost btn-sm" data-copy-join>Copy join link</button><button class="btn btn-ghost btn-sm" data-update-qr>Update QR</button></div></div>
      <div class="arena-control-stats"><span><b>${c.participants}</b> joined</span><span><b>${c.received}</b> received</span><span class="good"><b>${c.delivered}</b> delivered</span><span class="protected"><b>${c.withheld}</b> withheld</span><span><b>${controlArena.crowd.score}/100</b> pressure</span><span><b>${controlArena.latency.averageMs ?? "—"}ms</b> local average</span></div>
      <form class="arena-controls-card" data-arena-controls><span class="mini-kicker">Human-owned room controls</span><h2>Protection without autonomous sanctions</h2><label>Room status<select name="status">${options(["open","paused"], controlArena.state.status)}</select></label><label>Shield level<select name="shieldLevel">${options(["balanced","heightened","maximum"], controlArena.state.shieldLevel)}</select></label><label>Digest<select name="digestMode">${options(["live","quiet","post_match"], controlArena.state.digestMode)}</select></label><label>Who reaches the athlete<select name="repliesMode">${options(["all_verified","following_only","mentions_only"], controlArena.state.repliesMode)}</select></label><label class="arena-check"><input type="checkbox" name="slowMode" ${controlArena.state.slowMode ? "checked" : ""}> Reflection slow mode</label><button class="btn btn-teal" type="submit">Apply audited controls</button></form>
    </section>
    <section class="arena-control-actions"><button class="btn btn-teal" data-arena-rehearsal>Run offline rehearsal</button><button class="btn btn-ghost" data-arena-reset>Reset empty room</button><a class="btn btn-ghost" href="/arena-athlete?room=${encodeURIComponent(controlArena.roomCode)}" target="_blank" rel="noopener">Open athlete screen ↗</a><a class="btn btn-ghost" href="${escapeHtml(controlArena.joinPath)}" target="_blank" rel="noopener">Open fan join ↗</a></section>
    <section class="arena-command-columns"><div><span class="mini-kicker">Decision ledger</span><h2>Safe text or redacted metadata only</h2><div class="arena-ledger">${controlArena.messageLedger.slice().reverse().map(ledgerItem).join("") || `<div class="match-empty">The live ledger is empty.</div>`}</div></div><div><span class="mini-kicker">Audience passes</span><h2>Temporary and rate-limited</h2><div class="arena-participants">${controlArena.participants.map(participantItem).join("") || `<div class="match-empty">No audience members joined.</div>`}</div></div><div><span class="mini-kicker">Audited replay</span><h2>What changed, in order</h2><div class="arena-timeline">${controlArena.timeline.map(timelineItem).join("") || `<div class="match-empty">No Arena events yet.</div>`}</div></div></section>
    <div class="arena-boundary"><b>Live product proof, honest limits</b><span>${escapeHtml(controlArena.boundaries.simulation)} ${escapeHtml(controlArena.boundaries.latency)} ${escapeHtml(controlArena.boundaries.operations)}</span></div>
  </div>`;
  attachControl(outlet);
}

function attachControl(outlet) {
  outlet.querySelector("[data-arena-controls]")?.addEventListener("submit", async (event) => { event.preventDefault(); const f = new FormData(event.currentTarget); try { controlArena = (await updateAudienceArenaControls({ arenaId:controlArena.event.id, status:f.get("status"), shieldLevel:f.get("shieldLevel"), digestMode:f.get("digestMode"), repliesMode:f.get("repliesMode"), slowMode:f.get("slowMode") === "on" })).arena; toast("Arena controls applied and audited"); paintControl(outlet); } catch (error) { toast(error.message); } });
  outlet.querySelector("[data-arena-rehearsal]")?.addEventListener("click", async () => { try { controlArena = (await runAudienceArenaRehearsal({ arenaId:controlArena.event.id })).arena; toast("Offline rehearsal processed through the active server engine"); paintControl(outlet); } catch (error) { toast(error.message); } });
  outlet.querySelector("[data-arena-reset]")?.addEventListener("click", async () => { try { controlArena = (await resetAudienceArena({ arenaId:controlArena.event.id })).arena; toast("Arena reset to an empty room"); paintControl(outlet); } catch (error) { toast(error.message); } });
  outlet.querySelector("[data-copy-join]")?.addEventListener("click", async () => { const value = outlet.querySelector("[data-arena-join-url]").value; try { await navigator.clipboard.writeText(value); toast("Audience join link copied"); } catch (_) { toast("Select and copy the displayed join link"); } });
  outlet.querySelector("[data-update-qr]")?.addEventListener("click", () => { const value = outlet.querySelector("[data-arena-join-url]").value; const image = outlet.querySelector(".arena-qr-card img"); image.src = `/api/audience-arena/qr.png?url=${encodeURIComponent(value)}&t=${Date.now()}`; toast("QR now uses the displayed local join address"); });
}

function connectControl(outlet, code="") {
  scheduleControlPoll(outlet, code);
  if (controlSource || !window.EventSource) { controlConnection = "timed fallback"; return; }
  controlConnection = "live stream + fallback"; controlSource = new EventSource(audienceArenaEventsUrl("presenter", code, controlArena.revision));
  paintControl(outlet);
  controlSource.addEventListener("arena", (event) => { if (!document.body.contains(outlet)) return stopControlLive(); try { controlArena = JSON.parse(event.data).arena; controlConnection = "live stream + fallback"; paintControl(outlet); } catch (_) {} });
  controlSource.onerror = () => { if (controlSource) controlSource.close(); controlSource = null; controlConnection = "timed fallback"; };
}

function scheduleControlPoll(outlet, code="") { clearTimeout(controlPoll); controlPoll = setTimeout(async () => { if (!document.body.contains(outlet)) return stopControlLive(); try { const next = (await getAudienceArenaSummary("presenter", code)).arena; if (next.revision !== controlArena.revision) { controlArena = next; paintControl(outlet); } } catch (_) {} scheduleControlPoll(outlet, code); }, 1200); }

function scoreCard(event) { return `<div class="arena-score-card"><span>${escapeHtml(event.court.toUpperCase())}</span><div><b>${escapeHtml(event.score.player)}</b><strong>${escapeHtml(event.score.sets)}</strong></div><div><b>${escapeHtml(event.score.opponent)}</b><strong>LIVE</strong></div><small>● ${escapeHtml(event.round)}</small></div>`; }
function streamItem(item) { return `<article class="arena-stream-item outcome-${escapeHtml(item.outcome)}"><span>${item.deliveredToAthlete ? "✓" : "⊘"}</span><div><b>${escapeHtml(item.displayName)}</b><p>${escapeHtml(item.safePreview)}</p><small>${item.deliveredToAthlete ? "Reached athlete" : pretty(item.category)} · ${item.latencyMs}ms · ${timeAgo(item.createdAt)} ago</small></div></article>`; }
function athleteItem(item) { return `<article><span>${escapeHtml(initials(item.displayName))}</span><div><b>${escapeHtml(item.displayName)}</b><p>${escapeHtml(item.safePreview)}</p><small>event verified · ${item.latencyMs}ms · ${timeAgo(item.createdAt)} ago</small></div></article>`; }
function ledgerItem(item) { return `<article class="outcome-${escapeHtml(item.outcome)}"><span>${item.deliveredToAthlete ? "✓" : "⊘"}</span><div><b>${escapeHtml(item.displayName)} · ${escapeHtml(pretty(item.outcome))}</b><p>${escapeHtml(item.safePreview)}</p><small>${escapeHtml(pretty(item.category))} · ${item.latencyMs}ms · digest ${escapeHtml(item.evidenceDigest)}</small></div></article>`; }
function participantItem(item) { return `<article><span>${escapeHtml(initials(item.display_name))}</span><div><b>${escapeHtml(item.display_name)}</b><small>${escapeHtml(item.badge)} · ${item.clean_messages} delivered · ${item.interventions} interventions</small></div><em>${escapeHtml(item.status)}</em></article>`; }
function timelineItem(item) { return `<article><i></i><div><b>${escapeHtml(item.actor_label)}</b><p>${escapeHtml(item.detail)}</p><small>${escapeHtml(pretty(item.event_type))} · ${timeAgo(item.created_at)} ago</small></div></article>`; }
function loading(title, detail) { return `<div class="match-room-loading"><span class="live-dot"></span><b>${escapeHtml(title)}</b><small>${escapeHtml(detail)}</small></div>`; }
function errorCard(title, detail) { return `<div class="card card-pad stack"><span class="eyebrow">Live Audience Arena</span><h1>${escapeHtml(title)}</h1><p class="muted">${escapeHtml(detail || "Try again.")}</p><div><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div></div>`; }
function options(values, active) { return values.map(value => `<option value="${value}" ${value === active ? "selected" : ""}>${escapeHtml(pretty(value))}</option>`).join(""); }
function pretty(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, char => char.toUpperCase()); }
function initials(value) { return String(value || "K1").split(/\s+/).slice(0,2).map(item => item[0]).join("").toUpperCase(); }
function connectionLabel(value) { return value === "live stream + fallback" ? "dual live sync" : value === "live stream" ? "real-time link" : value === "timed fallback" ? "offline-safe fallback" : "connecting"; }
