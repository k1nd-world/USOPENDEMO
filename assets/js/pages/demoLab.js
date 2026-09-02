import { moderateContent } from "../moderation.js?v=4.24.1.0";
import { useCurrentUser, resetDemo, getBehaviourProfile, seedBehaviourEscalation, getState, recordRedTeamCase } from "../store.js?v=4.24.1.0";
import { AUDIENCE_PRESETS, getAudiencePreset, setAudiencePreset, resetDemoPrefs, isPresenterLocked, setPresenterLocked } from "../lib/demoMode.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { sealSvg, toast } from "../lib/ui.js";
import { navigate } from "../lib/router.js";

let labText = "";
let selectedImageScenario = "clean";
let selectedConversationScenario = "standalone";

const CONVERSATION_SCENARIOS = {
  standalone:{ label:"Standalone message", detail:"Lexical + pragmatic context only", context:{} },
  athlete:{ label:"Reply to a player", detail:"Mara Volkov · verified professional athlete", context:{
    isReply:true,
    parentText:"The messages after the match meant more than you know.",
    replyTarget:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true, isU18:false },
    postAuthor:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true, isU18:false },
    athleteTarget:true,
    conversationHistory:[{ text:"That second set was a real battle.", authorId:"u_fan", outcome:"clean" }, { text:"The return changed the match.", authorId:"u_coach", outcome:"clean" }],
  } },
  pileon:{ label:"Developing pile-on", detail:"Two accounts already targeted the same player", context:{
    isReply:true,
    parentText:"Recovery day. Back to work tomorrow.",
    replyTarget:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true, isU18:false },
    postAuthor:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true, isU18:false },
    athleteTarget:true,
    currentAuthorId:"u_adult",
    conversationHistory:[{ text:"Tough result today.", authorId:"u_fan", outcome:"clean" }, { text:"The tactics did not work.", authorId:"u_coach", outcome:"clean" }],
    priorTargetedInterventions:[{ authorId:"u_fan", outcome:"warning" }, { authorId:"u_coach", outcome:"warning" }],
  } },
  u18:{ label:"Reply to U18 player", detail:"Additional minor-safety safeguard", context:{
    isReply:true,
    parentText:"Learning a lot from every match.",
    replyTarget:{ id:"u_u18", handle:"noahk", role:"verified_u18", isAthlete:false, isU18:true },
    postAuthor:{ id:"u_u18", handle:"noahk", role:"verified_u18", isAthlete:false, isU18:true },
    conversationHistory:[{ text:"Keep learning and enjoying it.", authorId:"u_adult", outcome:"clean" }],
  } },
  indirect:{ label:"Indirect player reference", detail:"“That champion” resolves to Mara from the thread", context:{
    lastReferencedParticipant:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true },
    participantAliases:[{ term:"Mara", profile:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true } }],
  } },
  crossThread:{ label:"Cross-thread repeat targeting", detail:"Three earlier interventions against the same player", context:{
    isReply:true, eventWindow:"post_match", currentAuthorId:"u_adult",
    replyTarget:{ id:"u_athlete", handle:"maravolkov", role:"verified_adult", isAthlete:true },
    behaviourHistory:[
      { authorId:"u_adult", targetId:"u_athlete", outcome:"warning" },
      { authorId:"u_adult", targetId:"u_athlete", outcome:"warning" },
      { authorId:"u_adult", targetId:"u_athlete", outcome:"review" },
    ],
  } },
};

function labContext() {
  return CONVERSATION_SCENARIOS[selectedConversationScenario]?.context || {};
}

const BREAK_EXAMPLES = [
  ["Personal abuse", "You were useless today, never play again."],
  ["Accurate rewrite", "Your first serve kept landing short, you useless clown."],
  ["Body abuse", "You useless fat cow, you bottled it again. Fuck off."],
  ["Hard block", "I’m going to hurt you after the final."],
  ["Blocked + real point", "Your second serve kept landing short. I’m going to hurt you."],
  ["Serious allegation", "That player is a cheat and she's doping."],
  ["Allowed criticism", "That was an awful performance. She lost confidence in the second set."],
  ["Sporting hyperbole", "I'm going to destroy you in the final."],
  ["Counterspeech", "Don’t call her an idiot."],
  ["Reported abuse", "He called me an idiot after the match."],
  ["Idea, not person", "Your argument is stupid."],
  ["Residual attack", "Don’t call her an idiot, you moron."],
  ["Code-switched insult", "Your return position was too deep, you are mumu."],
  ["Coded ambiguity", "That immigrant is not our kind."],
  ["Indirect target", "That champion is pathetic."],
];

const IMAGE_SCENARIOS = {
  clean: {
    label: "Clean sports photo", icon: "📷", tone: "ok", decision: "ALLOW",
    reason: "No abusive text, known-harm signal or unsafe context detected.",
    ocr: "No harmful embedded text detected", manipulation: "No manipulation concern", context: "Caption + image context consistent",
  },
  meme: {
    label: "Abusive meme", icon: "▧", tone: "block", decision: "BLOCK",
    reason: "Hateful / dehumanising embedded text detected by the simulated OCR + safety layer.",
    ocr: "Prohibited abusive text detected", manipulation: "Standard image", context: "Targets a named athlete",
  },
  manipulated: {
    label: "Manipulated athlete image", icon: "◩", tone: "review", decision: "ENHANCED REVIEW",
    reason: "Possible synthetic or materially altered media requires additional context before publication.",
    ocr: "No harmful embedded text", manipulation: "Manipulation signal detected", context: "Potential reputational harm",
  },
  threat: {
    label: "Threatening graphic", icon: "⚠", tone: "block", decision: "BLOCK",
    reason: "Threatening visual / embedded text combination is not permitted to publish.",
    ocr: "Threatening wording detected", manipulation: "Not material to decision", context: "Directed at a person",
  },
};

export function renderDemoLab(outlet) { paint(outlet); }

function resultCard(text) {
  if (!text.trim()) return `<div class="lab-result empty"><span>Type anything above and K1ND will classify it here.</span></div>`;
  const r = moderateContent(text, labContext());
  const map = {
    clean: ["ALLOW", "ok", "Publish immediately"],
    warning: ["INTERVENE", "warn", "Rewrite · edit · cancel · review"],
    review: ["ENHANCED REVIEW", "review", "Hidden until moderator decision"],
    block: ["HARD BLOCK", "block", "Cannot publish or bypass"],
  };
  const [label, tone, nextDefault] = map[r.outcome] || map.clean;
  const next = r.safeDraftSuggestion ? "Original blocked · separately validated new draft available" : nextDefault;
  const a = r.analysis;
  const c = a.contextAssessment;
  const offeredDraft = r.rewriteSuggestion || r.safeDraftSuggestion;
  const rewriteOptions = Array.isArray(r.rewrite?.options) && r.rewrite.options.length > 1 ? `<div class="rewrite-options"><span class="mini-kicker">Validated rewrite choices</span>${r.rewrite.options.map((option) => `<div><b>${escapeHtml(option.label)}</b><span>${escapeHtml(option.suggestion)}</span><small>${escapeHtml(option.stance)} · ${option.validatedClean ? "passed safety re-check" : "candidate"}</small></div>`).join("")}</div>` : "";
  const clauseMap = Array.isArray(r.rewrite?.clauses) ? `<div class="rewrite-clause-map"><span class="mini-kicker">Clause-level decision</span>${r.rewrite.clauses.map((clause) => `<div class="${escapeHtml(clause.role)}"><b>${escapeHtml(clause.role)}</b><span>${escapeHtml(clause.text)}</span><small>${escapeHtml(clause.reason)}</small></div>`).join("")}</div>` : "";
  const rewriteCard = offeredDraft ? `<div class="lab-rewrite ${r.safeDraftSuggestion ? "safe-new-draft" : ""}">
      <span class="seal">${sealSvg(14)} ${r.safeDraftSuggestion ? "Source-backed new draft · original remains blocked" : "Source-backed rewrite"}</span><p>${escapeHtml(offeredDraft)}</p>
      ${r.rewrite?.preservedPoint ? `<div class="rewrite-proof"><span><b>Point kept</b>${escapeHtml(r.rewrite.preservedPoint)}</span><span><b>Removed</b>${escapeHtml(r.rewrite.removed)}</span>${r.rewrite.sourceBasis ? `<span><b>Source basis</b>${escapeHtml(r.rewrite.sourceBasis)}</span>` : ""}${r.rewrite.fidelity ? `<span><b>Fidelity</b>${escapeHtml(r.rewrite.fidelity)}</span>` : ""}</div>` : ""}
      ${rewriteOptions}${clauseMap}
    </div>` : (["warning","review","block"].includes(r.outcome) && ["needs_author_point","blocked_no_safe_draft"].includes(r.rewrite?.status) ? `<div class="lab-rewrite lab-rewrite-guidance"><span class="seal">${sealSvg(14)} No rewrite invented</span><p>${escapeHtml(r.rewrite.rationale)}</p></div>` : "");
  return `<div class="lab-result ${tone}">
    <div class="lab-verdict"><span class="lab-status">${label}</span><b>${escapeHtml(r.reason)}</b></div>
    <div class="lab-result-grid">
      <div><span class="mini-kicker">Category</span><strong>${escapeHtml((r.category || "clean").replaceAll("_", " "))}</strong></div>
      <div><span class="mini-kicker">What happens next</span><strong>${next}</strong></div>
    </div>
    ${rewriteCard}
    <div class="abuse-intelligence">
      <div class="ai-head"><span class="seal">${sealSvg(14)} Abuse intelligence</span><span class="badge">${escapeHtml(a.confidence)} confidence</span></div>
      <div class="ai-grid">
        <div><span class="mini-kicker">Target</span><strong>${escapeHtml(a.target)}</strong><small>${escapeHtml(a.targetType)}</small></div>
        <div><span class="mini-kicker">Language function</span><strong>${escapeHtml(a.mechanism)}</strong><small>${escapeHtml(a.contextualReading)}</small></div>
      </div>
      <div class="ai-explanation"><b>What is the abuse element?</b><p>${escapeHtml(a.abuseElement)}</p></div>
      <div class="ai-explanation"><b>Why this decision?</b><p>${escapeHtml(a.policyRationale)}</p></div>
      <div class="ai-signals"><span class="mini-kicker">Evidence signals</span>${a.signals.map((signal) => `<span>${escapeHtml(signal)}</span>`).join("")}</div>
      ${a.codedMeaning ? `<div class="ai-explanation"><b>Coded-meaning assessment</b><p>${escapeHtml(a.codedMeaning.status)} · ${escapeHtml(a.codedMeaning.evidence || a.codedMeaning.ambiguity)}</p><small>${escapeHtml(a.codedMeaning.ambiguity)}</small></div>` : ""}
      ${a.confidenceProfile ? `<div class="confidence-profile"><span class="mini-kicker">Inspectable confidence</span><div><b>Policy</b><span>${escapeHtml(a.confidenceProfile.policy)}</span></div><div><b>Language</b><span>${escapeHtml(a.confidenceProfile.language)}</span></div><div><b>Target</b><span>${escapeHtml(a.confidenceProfile.target)}</span></div><div><b>Rewrite</b><span>${escapeHtml(a.confidenceProfile.rewrite)}</span></div><div><b>Uncertainty</b><span>${escapeHtml(a.confidenceProfile.uncertainty)}</span></div></div>` : ""}
      ${c ? `<div class="context-assessment">
        <div class="context-head"><div><span class="mini-kicker">Context assessment</span><b>${escapeHtml(c.speechAct)}</b></div><span class="context-risk ${escapeHtml(c.riskBand)}">${escapeHtml(c.riskBand)} · ${c.riskScore}/100</span></div>
        <div class="context-grid">
          <div><span>Stance</span><b>${escapeHtml(c.stance)}</b></div>
          <div><span>Target scope</span><b>${escapeHtml(c.targetScope)} · ${escapeHtml(c.targetExplicitness)}</b></div>
          <div><span>Abuse stacking</span><b>${escapeHtml(c.stacking)}</b></div>
          <div><span>Protected framing</span><b>${c.protectedFraming ? "Yes — context changes the speech act" : "No automatic exemption"}</b></div>
          <div><span>Participant role</span><b>${escapeHtml(c.targetAudience?.role || "unknown")}</b></div>
          <div><span>Thread targeting</span><b>${c.conversation?.recentTargetedInterventions || 0} recent intervention${c.conversation?.recentTargetedInterventions === 1 ? "" : "s"}</b></div>
          <div><span>Cross-thread memory</span><b>${c.conversation?.crossThreadInterventions || 0} intervention${c.conversation?.crossThreadInterventions === 1 ? "" : "s"}${c.conversation?.postEventBurst ? " · post-match burst" : ""}</b></div>
        </div>
        <p>${escapeHtml(c.explanation)}</p>
        ${c.modifiers.length ? `<div class="context-modifiers">${c.modifiers.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      </div>` : ""}
      <div class="language-coverage">
        <div><span class="mini-kicker">Language and script</span><b>${escapeHtml(a.languageCoverage.scripts.join(" + "))}</b><small>${escapeHtml(a.languageCoverage.demoCoverage)}</small></div>
        <div><span class="mini-kicker">Policy packs consulted</span><b>${escapeHtml(a.languageCoverage.packs.join(" · "))}</b><small>${escapeHtml(a.languageCoverage.productionRoute)}</small></div>
      </div>
    </div>
    <div class="red-team-capture"><div><span class="mini-kicker">Live red-team recorder</span><b>Keep this decision as a regression candidate</b><small>Hard-blocked wording is withheld; policy evidence and expected outcome are retained.</small></div><button class="btn btn-ghost btn-sm" data-record-probe>Record test</button></div>
  </div>`;
}

function imageWorkflow() {
  const s = IMAGE_SCENARIOS[selectedImageScenario];
  return `<div class="image-lab-stage">
    <div class="image-scenario-preview ${s.tone}">
      ${selectedImageScenario === "clean" ? `<img src="/assets/images/player-action.jpg" alt="Clean sports action example">` : `<div class="synthetic-preview"><span>${s.icon}</span><b>${escapeHtml(s.label)}</b><small>Controlled demo representation</small></div>`}
      <span class="scenario-badge">${escapeHtml(s.label)}</span>
    </div>
    <div class="image-pipeline">
      ${pipelineStep("1", "Source integrity", selectedImageScenario === "manipulated" ? "Signal" : "Pass")}
      ${pipelineStep("2", "Visual classifiers", selectedImageScenario === "threat" ? "Flag" : "Pass")}
      ${pipelineStep("3", "OCR / embedded text", s.ocr)}
      ${pipelineStep("4", "Caption + context", s.context)}
      ${pipelineStep("5", "Synthetic / manipulation", s.manipulation)}
      <div class="pipeline-decision ${s.tone}"><span>Decision</span><b>${s.decision}</b><p>${escapeHtml(s.reason)}</p></div>
    </div>
  </div>`;
}

function pipelineStep(n, title, value) {
  return `<div class="pipeline-step"><span class="pipeline-num">${n}</span><div><b>${title}</b><span>${escapeHtml(value)}</span></div></div>`;
}

function paint(outlet) {
  const audience = getAudiencePreset();
  const user = useCurrentUser();
  const behaviour = getBehaviourProfile(user.id);
  const redTeamCount = getState().redTeamCases.length;
  const presenterLocked = isPresenterLocked();
  if (!labText) labText = audience.demoPrompt;

  outlet.innerHTML = `<div class="demo-lab-wrap">
    <section class="demo-command-hero">
      <div>
        <span class="eyebrow">Universal safety intelligence · v4.19.0</span>
        <h1>Don't take our word for it.<br><span class="accent">See the product reason.</span></h1>
        <p>This is now a connected global product flow: accountable participation, indirect and cross-thread target context, functional policy across 49 languages, clause-faithful rewrite choices, ambiguity-aware review and pre-publication enforcement.</p>
      </div>
      <div class="demo-command-card">
        <span class="mini-kicker">Current audience preset</span>
        <div class="preset-current"><span>${audience.icon}</span><div><b>${audience.label}</b><small>${audience.headline}</small></div></div>
        <div class="demo-command-actions">
          <button class="btn btn-teal" data-guide>Start 5-minute guided demo</button>
          <a class="btn btn-ghost" data-link href="/hate-stress-test">Open Hate Stress Test</a>
          <button class="btn btn-ghost" data-full-reset>Reset everything</button>
        </div>
        <div class="presenter-readiness"><span>US Open presenter mode</span><b>${presenterLocked ? "Locked — role switching and reset controls are hidden" : "Ready — lock the interface before presenting"} · ${redTeamCount} live probe${redTeamCount === 1 ? "" : "s"} recorded</b><button class="btn ${presenterLocked ? "btn-quiet" : "btn-teal"} btn-sm" data-presenter-lock>${presenterLocked ? "Exit presenter lock" : "Enter presenter lock"}</button></div>
      </div>
    </section>

    <section class="demo-section">
      <div class="sec-head compact"><span class="eyebrow">Audience presets</span><h2>Same product. Different proof points.</h2><p>Preset changes the examples and emphasis, not the core platform.</p></div>
      <div class="preset-grid">${Object.values(AUDIENCE_PRESETS).map((p) => `<button class="preset-card ${p.key === audience.key ? "active" : ""}" data-preset="${p.key}"><span class="preset-icon">${p.icon}</span><b>${p.label}</b><small>${p.headline}</small></button>`).join("")}</div>
      <div class="preset-focus">${audience.focus.map((x) => `<span>${sealSvg(13)} ${escapeHtml(x)}</span>`).join("")}</div>
    </section>

    <section class="demo-section break-lab">
      <div class="sec-head compact"><span class="eyebrow">Live adversarial test</span><h2>Type what you wouldn't want an athlete, child or fan to receive.</h2><p>Change the conversation setting to show how the same words can produce a different risk decision. Strong sporting criticism remains allowed.</p><div class="presenter-shield"><span>Shield active</span><b>Known evasion intervenes · uncertain targeted obfuscation is held · hard safety cannot be bypassed</b></div></div>
      <div class="conversation-scenarios" role="group" aria-label="Conversation context">
        ${Object.entries(CONVERSATION_SCENARIOS).map(([key, scenario]) => `<button class="${key === selectedConversationScenario ? "active" : ""}" data-conversation-scenario="${key}"><b>${escapeHtml(scenario.label)}</b><small>${escapeHtml(scenario.detail)}</small></button>`).join("")}
      </div>
      <div class="break-grid">
        <div class="break-input-card">
          <label for="break-input">Your test message</label>
          <textarea id="break-input" data-break-input rows="5" spellcheck="false">${escapeHtml(labText)}</textarea>
          <div class="break-examples">${BREAK_EXAMPLES.map(([label, value]) => `<button data-break-example="${escapeHtml(value).replaceAll('"','&quot;')}">${escapeHtml(label)}</button>`).join("")}</div>
        </div>
        <div data-break-result>${resultCard(labText)}</div>
      </div>
    </section>

    <section class="demo-section behaviour-lab">
      <div class="sec-head compact"><span class="eyebrow">Behaviour changes over time</span><h2>Moderation becomes smarter about repeated harmful behaviour.</h2><p>Clean criticism remains available. Repeated harmful attempts create stronger friction in the current demo session.</p></div>
      <div class="behaviour-grid">
        <div class="behaviour-stage-card ${behaviour.stage}">
          <span class="mini-kicker">Current account · ${escapeHtml(user.displayName)}</span>
          <div class="behaviour-big">${behaviour.count}</div><b>${escapeHtml(behaviour.label)}</b><p>${escapeHtml(behaviour.message)}</p>
        </div>
        <div class="behaviour-ladder">
          ${behaviourRung("1st", "Safety nudge", "Rewrite / edit / cancel / review", behaviour.count >= 1)}
          ${behaviourRung("2nd", "Reflection friction", "Stronger explanation before posting", behaviour.count >= 2)}
          ${behaviourRung("3rd+", "Enhanced safeguard", "Borderline originals held for review", behaviour.count >= 3)}
        </div>
        <div class="behaviour-actions">
          <button class="btn btn-teal" data-seed-behaviour>Load repeat-behaviour scenario</button>
          <a class="btn btn-ghost" data-link href="/feed">Test it in the live feed</a>
          <small>Loads two demo warning events. The next harmful attempt becomes the third intervention.</small>
        </div>
      </div>
    </section>

    <section class="demo-section">
      <div class="sec-head compact"><span class="eyebrow">Image abuse · provider ensemble</span><h2>Text is only one part of the safety problem.</h2><p>V4.19.0 analyses uploaded pixels with on-device OCR, Apple Vision classification and server-side evidence fusion, while showing exactly which specialist providers are active, ready or not configured.</p><div style="margin-top:14px"><a class="btn btn-teal" data-link href="/media-lab">Open live Media Evidence Lab</a></div></div>
      <div class="image-scenario-tabs">${Object.entries(IMAGE_SCENARIOS).map(([key, s]) => `<button class="${key === selectedImageScenario ? "active" : ""}" data-image-scenario="${key}">${s.icon} ${escapeHtml(s.label)}</button>`).join("")}</div>
      ${imageWorkflow()}
    </section>

    <section class="demo-section guided-story">
      <div class="sec-head compact"><span class="eyebrow">The five-minute story</span><h2>One sequence tells the whole K1ND proposition.</h2></div>
      <div class="story-steps product-story">
        ${storyStep("01", "Try accurate rewrite", "Show the author's actual sporting point retained word-for-word", "Choose Accurate rewrite above.")}
        ${storyStep("02", "Switch to player reply", "Show athlete-aware target resolution", "Choose Reply to a player.")}
        ${storyStep("03", "Switch to pile-on", "Show cumulative harassment held for review", "Choose Developing pile-on.")}
        ${storyStep("04", "Record the probe", "Turn an audience challenge into a regression candidate", "Use Record test beneath the decision.")}
        ${storyStep("05", "Try blocked + real point", "Keep the original blocked while offering only the separately validated sporting sentence", `<a data-link href="/hate-stress-test">Open stress test</a> · use the Blocked + real point sample.`)}
        ${storyStep("06", "Analyse embedded image text", "Run clean, warning and threat PNGs through real local OCR", `<a data-link href="/media-lab">Open Media Lab</a>`)}
        ${storyStep("07", "Adjudicate an appeal", "Show the human correction loop and regression learning", `<a data-link href="/appeals">Open Appeals</a> · <a data-link href="/admin">Open Admin</a>`)}
        ${storyStep("08", "Open product operations", "Show 259 active rules, language quality and persistent-targeting graph", `<a data-link href="/feed">Open feed</a> · <a data-link href="/admin">Open Admin</a>`)}
      </div>
    </section>
  </div>`;

  attach(outlet, outlet);
}

function behaviourRung(n, title, desc, active) {
  return `<div class="behaviour-rung ${active ? "active" : ""}"><span>${n}</span><div><b>${title}</b><small>${desc}</small></div></div>`;
}
function storyStep(n, title, result, action) {
  return `<div class="story-step"><span class="story-num">${n}</span><div><b>${title}</b><p>${result}</p><small>${action}</small></div></div>`;
}

function attach(root, outlet) {
  const ta = root.querySelector("[data-break-input]");
  const result = root.querySelector("[data-break-result]");
  if (ta) ta.addEventListener("input", () => { labText = ta.value; result.innerHTML = resultCard(labText); });

  root.addEventListener("click", (e) => {
    const preset = e.target.closest("[data-preset]");
    if (preset) { setAudiencePreset(preset.dataset.preset); const selected = AUDIENCE_PRESETS[preset.dataset.preset]; const pill = document.querySelector(".demo-preset-pill"); if (pill) pill.textContent = `${selected.icon} ${selected.label}`; labText = selected.demoPrompt; paint(outlet); return; }
    const ex = e.target.closest("[data-break-example]");
    if (ex) { labText = ex.dataset.breakExample; paint(outlet); root.querySelector("[data-break-input]")?.focus(); return; }
    const img = e.target.closest("[data-image-scenario]");
    if (img) { selectedImageScenario = img.dataset.imageScenario; paint(outlet); return; }
    const conversation = e.target.closest("[data-conversation-scenario]");
    if (conversation) { selectedConversationScenario = conversation.dataset.conversationScenario; paint(outlet); return; }
    if (e.target.closest("[data-record-probe]")) {
      const decision = moderateContent(labText, labContext());
      const recorded = recordRedTeamCase(useCurrentUser(), labText, decision, selectedConversationScenario);
      toast(recorded.ok ? "Added to the live red-team log" : (recorded.error || "Could not record this test"));
      return;
    }
    if (e.target.closest("[data-presenter-lock]")) { setPresenterLocked(!isPresenterLocked()); return; }
    if (e.target.closest("[data-seed-behaviour]")) { seedBehaviourEscalation(useCurrentUser().id, 2); toast("Repeat-behaviour scenario loaded"); return; }
    if (e.target.closest("[data-role-observer]")) { navigate("/sign-in"); return; }
    if (e.target.closest("[data-guide]")) { resetDemo(); toast("Guided demo reset — choose a signed demo account"); navigate("/sign-in"); return; }
    if (e.target.closest("[data-full-reset]")) { resetDemoPrefs(); resetDemo(); labText = ""; selectedImageScenario = "clean"; selectedConversationScenario = "standalone"; toast("Demo restored to a clean starting state"); navigate("/demo-lab", true); }
  });
}
