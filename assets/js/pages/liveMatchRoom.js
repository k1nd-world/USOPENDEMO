import { useCurrentUser, isAdmin } from "../store.js?v=4.24.1.brand1";
import {
  getLiveMatchRoom, sendLiveMatchMessage, updateLiveMatchPreferences, resetLiveMatchRoom,
} from "../serverPlatform.js?v=4.24.1.brand1";
import { moderateContent } from "../moderation.js?v=4.24.1.brand1";
import { refineRewrite } from "../intentRewrite.js?v=4.24.1.brand1";
import { escapeHtml, timeAgo } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.brand1";

let room = null;
let lastDecision = null;
let lastRewrite = null;
let fanDraft = "";
let viewMode = "split";
let pollTimer = null;

const PRESETS = [
  ["Pure passion", "Fuck what a great shot"],
  ["Strong criticism", "That second serve was fucking awful today"],
  ["Mixed attack", "Your first serve kept landing short, you useless clown."],
  ["Bare insult", "You are an idiot."],
  ["Credible threat", "I will hurt you outside the stadium after the match."],
];

export async function renderLiveMatchRoom(outlet) {
  const requested = new URLSearchParams(window.location.search).get("view");
  if (["fan", "athlete", "split"].includes(requested)) viewMode = requested;
  clearTimeout(pollTimer);
  if (!room) {
    outlet.innerHTML = `<div class="match-room-loading"><span class="live-dot"></span><b>Opening K1ND.world Centre Court…</b><small>Connecting the fan composer to the protected athlete inbox.</small></div>`;
    try {
      room = (await getLiveMatchRoom()).room;
    } catch (error) {
      outlet.innerHTML = `<div class="card card-pad stack"><span class="eyebrow">Live Match Room</span><h1>Sign in to enter Centre Court</h1><p class="muted">${escapeHtml(error.message || "The Match Room is unavailable.")}</p><div><a class="btn btn-teal" data-link href="/sign-in">Sign in</a></div></div>`;
      return;
    }
  }
  paint(outlet);
}

function paint(outlet) {
  const user = useCurrentUser();
  const publicMode = isPublicExperience();
  const e = room.event;
  const c = room.counters;
  const crowd = room.crowd;
  outlet.innerHTML = `
    <div class="match-room-wrap view-${viewMode}">
      <section class="match-live-hero">
        <div class="match-live-copy">
          <div class="match-live-kicker"><span class="live-dot"></span> LIVE · ${escapeHtml(e.round)} · ${escapeHtml(e.court)}</div>
          <h1>One conversation.<br><em>Two completely different experiences.</em></h1>
          <p>Write as a fan and watch what reaches the athlete. Every decision comes from the active K1ND.world server; hostile originals never appear in Mara's inbox.</p>
          <div class="match-view-switch" role="group" aria-label="Match Room view">
            ${viewButton("split", "Split view")}${viewButton("fan", "Fan view")}${viewButton("athlete", "Athlete view")}
          </div>
        </div>
        <div class="match-score-card">
          <span>CENTRE COURT</span>
          <div><b>${escapeHtml(e.score.player)}</b><strong>${escapeHtml(e.score.sets)}</strong></div>
          <div><b>${escapeHtml(e.score.opponent)}</b><strong>4–6 2–3</strong></div>
          <small>● ${escapeHtml(e.score.server)} serving</small>
        </div>
      </section>

      <section class="match-proof-strip">
        <span><b>${c.received}</b> received</span>
        <span class="proof-delivered"><b>${c.delivered}</b> reached Mara</span>
        <span class="proof-protected"><b>${c.withheld}</b> withheld</span>
        <span><b>${crowd.score}/100</b> crowd pressure</span>
        <span><b>0</b> hostile originals shown</span>
      </section>

      <section class="match-stage">
        <div class="fan-lane">
          <div class="lane-title"><span>01</span><div><b>Fan experience</b><small>Passion stays. Personal abuse pauses here.</small></div></div>
          <form class="match-composer" data-match-form>
            <div class="composer-person"><span>${escapeHtml(initials(user.displayName))}</span><div><b>${escapeHtml(user.displayName)}</b><small>Verified participant</small></div></div>
            <textarea name="message" maxlength="700" rows="4" required placeholder="React to the match…">${escapeHtml(fanDraft)}</textarea>
            <div class="match-preset-row">${PRESETS.map(([label, text]) => `<button type="button" data-match-preset="${escapeHtml(text)}">${escapeHtml(label)}</button>`).join("")}</div>
            <div class="composer-submit-row"><span><i></i> Context-aware check active</span><button class="btn btn-teal" type="submit">Send to the room</button></div>
          </form>
          ${renderFanDecision()}
          <div class="fan-room-history">
            <div class="mini-kicker">Recent room activity</div>
            ${room.messages.slice(-5).reverse().map(renderFanHistory).join("")}
          </div>
        </div>

        <div class="decision-spine" aria-label="K1ND.world decision path">
          <span>K1</span><b>UNDERSTANDS</b><i>→</i><small>target</small><small>speech act</small><small>context</small><small>harm</small><em>server decision</em>
        </div>

        <div class="athlete-lane">
          <div class="lane-title athlete-title"><span>02</span><div><b>Athlete experience</b><small>The protected result—not the raw abuse.</small></div></div>
          <div class="athlete-room-card">
            <div class="athlete-room-head">
              <img src="/assets/images/player-action.jpg" alt="Mara Volkov competing">
              <div><span class="shield-live-pill">K1ND.world SHIELD LIVE</span><h2>${escapeHtml(room.athlete.displayName)}</h2><small>${escapeHtml(room.athlete.handle)} · verified athlete</small></div>
            </div>
            <div class="athlete-wellbeing"><span>✓</span><div><b>Your protected inbox is ready</b><small>${escapeHtml(room.shieldDigest.wellbeingCopy)}</small></div></div>
            <div class="protected-inbox">
              ${room.athleteInbox.slice().reverse().map(renderAthleteMessage).join("") || `<div class="match-empty">Safe messages will appear here.</div>`}
            </div>
          </div>
          <div class="shield-digest-card">
            <div><span class="mini-kicker">Shield digest</span><h3>${escapeHtml(room.shieldDigest.headline)}</h3></div>
            <strong>${c.withheld}</strong>
            <div class="digest-tags">${room.shieldDigest.categories.map((item) => `<span>${escapeHtml(pretty(item.category))} <b>${item.count}</b></span>`).join("") || `<span>No hostile signals</span>`}</div>
            <small>Raw hostile wording is never displayed in this view.</small>
          </div>
        </div>
      </section>

      <section class="match-lower-grid">
        <div class="crowd-radar-card">
          <div class="card-eyebrow">Live conversation radar</div>
          <div class="crowd-radar-head"><div><h2>${escapeHtml(crowd.status)}</h2><p>${escapeHtml(crowd.meaning)}</p></div><strong>${crowd.score}</strong></div>
          <div class="crowd-radar-track"><i style="width:${crowd.score}%"></i></div>
          <div class="crowd-radar-facts"><span><b>${crowd.window}</b> recent messages</span><span><b>${crowd.harmfulSignals}</b> harm signals</span><span><b>${escapeHtml(crowd.friction)}</b> active friction</span><span><b>${crowd.replyDelaySeconds}s</b> reflection delay</span></div>
        </div>
        <form class="athlete-preferences-card" data-shield-form>
          <div><span class="card-eyebrow">Mara's personal shield</span><h2>Her boundaries. Her experience.</h2><p>These controls shape delivery and wellbeing presentation; they never silently sanction another account.</p></div>
          <label>Protection level<select name="shieldLevel">${options(["balanced","heightened","maximum"], room.preferences.shieldLevel)}</select></label>
          <label>Shield digest<select name="digestMode">${options(["live","quiet","post_match"], room.preferences.digestMode)}</select></label>
          <label>Who can reply<select name="repliesMode">${options(["all_verified","following_only","mentions_only"], room.preferences.repliesMode)}</select></label>
          <button class="btn btn-ghost" type="submit">Save shield preferences</button>
        </form>
      </section>

      <section class="match-story-rail">
        <article><span>1</span><b>Fan speaks naturally</b><p>Strong emotion and criticism remain welcome.</p></article>
        <article><span>2</span><b>K1ND.world reads the act</b><p>Target, intent, context and abuse mechanism are separated.</p></article>
        <article><span>3</span><b>Athlete gets protection</b><p>Safe content arrives; hostility becomes private metadata.</p></article>
        <article><span>4</span><b>Humans keep authority</b><p>Review, safeguarding and account decisions are never autonomous.</p></article>
      </section>

      <div class="match-room-actions">
        <a class="btn btn-ghost" href="/match-room?view=athlete" target="_blank" rel="noopener">Open athlete screen ↗</a>
        <button class="btn btn-ghost" type="button" data-match-refresh>Refresh live room</button>
        ${isAdmin(user) && !publicMode ? `<button class="btn btn-quiet" type="button" data-match-reset>Reset match story</button>` : ""}
      </div>
      <div class="match-boundary"><b>Live product proof, honest limits</b><span>${escapeHtml(room.boundaries.simulation)} ${escapeHtml(room.boundaries.operations)}</span></div>
    </div>`;

  attach(outlet);
  if (viewMode === "athlete") scheduleAthleteRefresh(outlet);
}

function viewButton(mode, label) {
  return `<button class="${viewMode === mode ? "active" : ""}" type="button" data-match-view="${mode}">${label}</button>`;
}

function renderFanDecision() {
  if (!lastDecision) return `<div class="match-decision-empty"><span>↗</span><div><b>Try any message</b><small>The decision and athlete delivery result will appear here.</small></div></div>`;
  const d = lastDecision;
  const rewrite = ["warning", "review"].includes(d.outcome) && lastRewrite?.suggestion
    ? `<div class="match-rewrite-offer"><span>POINT KEPT</span><p>${escapeHtml(lastRewrite.preservedPoint || "The sporting point")}</p><blockquote>${escapeHtml(lastRewrite.suggestion)}</blockquote><button class="btn btn-teal btn-sm" type="button" data-send-rewrite>Send safer version</button></div>`
    : d.outcome !== "clean"
      ? `<div class="match-no-rewrite"><b>No generic rewrite invented</b><span>${escapeHtml(lastRewrite?.rationale || "State the real sporting point in your own words.")}</span></div>`
      : "";
  return `<div class="match-decision outcome-${escapeHtml(d.outcome)}">
    <div class="match-decision-head"><span>${d.deliveredToAthlete ? "DELIVERED" : "WITHHELD"}</span><div><b>${escapeHtml(d.intervention)}</b><small>${escapeHtml(pretty(d.category))} · evidence ${escapeHtml(d.evidenceDigest)}</small></div></div>
    <div class="match-why-grid"><span><small>Target</small><b>${escapeHtml(d.target)}</b></span><span><small>Speech act</small><b>${escapeHtml(d.speechAct)}</b></span><span><small>Mechanism</small><b>${escapeHtml(d.mechanism)}</b></span><span><small>Profanity</small><b>${escapeHtml(d.profanityFunction)}</b></span></div>
    ${rewrite}
  </div>`;
}

function renderFanHistory(item) {
  return `<article class="fan-history outcome-${escapeHtml(item.outcome)}"><span>${item.deliveredToAthlete ? "✓" : "⊘"}</span><div><b>${escapeHtml(item.authorDisplay)}</b><p>${escapeHtml(item.safePreview)}</p><small>${escapeHtml(item.deliveredToAthlete ? "Delivered" : pretty(item.category))} · ${timeAgo(item.createdAt)} ago</small></div></article>`;
}

function renderAthleteMessage(item) {
  return `<article><span>${escapeHtml(initials(item.authorDisplay))}</span><div><b>${escapeHtml(item.authorDisplay)}</b><p>${escapeHtml(item.safePreview)}</p><small>${timeAgo(item.createdAt)} ago · verified fan</small></div></article>`;
}

function attach(outlet) {
  outlet.querySelectorAll("[data-match-view]").forEach((button) => button.addEventListener("click", () => {
    viewMode = button.dataset.matchView;
    paint(outlet);
  }));
  outlet.querySelectorAll("[data-match-preset]").forEach((button) => button.addEventListener("click", () => {
    const textarea = outlet.querySelector('[name="message"]');
    textarea.value = button.dataset.matchPreset;
    fanDraft = textarea.value;
    textarea.focus();
  }));
  outlet.querySelector('[name="message"]')?.addEventListener("input", (event) => { fanDraft = event.target.value; });
  outlet.querySelector("[data-match-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = event.currentTarget.querySelector('button[type="submit"]');
    const text = String(new FormData(event.currentTarget).get("message") || "").trim();
    if (!text) return;
    button.disabled = true; button.textContent = "K1ND.world is reading the moment…";
    try {
      const clientDecision = moderateContent(text, { targetUserId:"u_athlete", targetIsAthlete:true, turnsConsidered:10, postMatchWindow:true });
      lastRewrite = clientDecision.rewrite || refineRewrite(text, clientDecision);
      const result = await sendLiveMatchMessage(text);
      room = result.room;
      lastDecision = result.fanDecision;
      if (lastDecision.outcome === "clean") fanDraft = "";
      paint(outlet);
    } catch (error) {
      toast(error.message || "The message could not be checked");
      button.disabled = false; button.textContent = "Send to the room";
    }
  });
  outlet.querySelector("[data-send-rewrite]")?.addEventListener("click", async () => {
    if (!lastRewrite?.suggestion) return;
    try {
      const result = await sendLiveMatchMessage(lastRewrite.suggestion, "accepted_rewrite");
      room = result.room; lastDecision = result.fanDecision; fanDraft = ""; lastRewrite = null;
      toast(result.fanDecision.deliveredToAthlete ? "Safer version delivered to Mara" : "The new draft needs another check");
      paint(outlet);
    } catch (error) { toast(error.message || "The safer version could not be sent"); }
  });
  outlet.querySelector("[data-shield-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    try {
      room = (await updateLiveMatchPreferences({ shieldLevel:form.get("shieldLevel"), digestMode:form.get("digestMode"), repliesMode:form.get("repliesMode") })).room;
      toast("Mara's shield preferences saved"); paint(outlet);
    } catch (error) { toast(error.message || "Shield preferences could not be saved"); }
  });
  outlet.querySelector("[data-match-refresh]")?.addEventListener("click", refreshRoom.bind(null, outlet));
  outlet.querySelector("[data-match-reset]")?.addEventListener("click", async () => {
    try { room = (await resetLiveMatchRoom()).room; lastDecision = null; lastRewrite = null; fanDraft = ""; toast("Match story reset"); paint(outlet); }
    catch (error) { toast(error.message || "The Match Room could not be reset"); }
  });
}

async function refreshRoom(outlet) {
  try { room = (await getLiveMatchRoom()).room; paint(outlet); }
  catch (error) { toast(error.message || "Live refresh unavailable"); }
}

function scheduleAthleteRefresh(outlet) {
  clearTimeout(pollTimer);
  pollTimer = setTimeout(async () => {
    if (!document.body.contains(outlet) || viewMode !== "athlete") return;
    try { room = (await getLiveMatchRoom()).room; paint(outlet); }
    catch (_) { scheduleAthleteRefresh(outlet); }
  }, 1800);
}

function options(values, active) {
  return values.map((value) => `<option value="${value}" ${value === active ? "selected" : ""}>${escapeHtml(pretty(value))}</option>`).join("");
}

function pretty(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase()); }
function initials(value) { return String(value || "K1").split(/\s+/).slice(0, 2).map((item) => item[0]).join("").toUpperCase(); }
