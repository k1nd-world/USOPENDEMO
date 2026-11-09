// assets/js/pages/admin.js

import {
  useCurrentUser, getState, getProfile, isAdmin,
  updateReportStatus, setModerationStatus, setVerificationStatus,
  resolveEnhancedReview, submitLanguageCandidate, resolveLanguageCandidate, resolveRedTeamCase, resolvePolicyLearning,
  resolveAppeal, getHarassmentGraph,
} from "../store.js?v=4.24.1.brand1";
import { escapeHtml, timeAgo, fmtDate } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { current, navigate } from "../lib/router.js";
import { EMERGING_LANGUAGE_RULES, EMERGING_LANGUAGE_VERSION } from "../emergingLanguage.js?v=4.24.1.brand1";
import { MULTILINGUAL_ABUSE_RULES, MULTILINGUAL_PACK_VERSION } from "../multilingualAbuse.js?v=4.24.1.brand1";
import { LANGUAGE_POLICY_ARCHITECTURE } from "../languageCoverage.js?v=4.24.1.brand1";
import { POLISH_ABUSE_RULES, POLISH_PACK_VERSION } from "../polishAbuse.js?v=4.24.1.brand1";
import { GLOBAL_RACIAL_SLUR_RULES, GLOBAL_RACIAL_PACK_VERSION } from "../globalRacialSlurs.js?v=4.24.1.brand1";
import { AUSTRALIAN_ABUSE_RULES, AUSTRALIAN_PACK_VERSION } from "../australianAbuse.js?v=4.24.1.brand1";
import { CZECH_BALTIC_ABUSE_RULES, CZECH_BALTIC_PACK_VERSION } from "../czechBalticAbuse.js?v=4.24.1.brand1";
import { CONTEXT_ENGINE_VERSION } from "../contextIntelligence.js?v=4.24.1.brand1";
import { UNCERTAINTY_GUARD_VERSION } from "../uncertaintyGuard.js?v=4.24.1.brand1";
import { WESTERN_EUROPEAN_ABUSE_RULES, WESTERN_EUROPEAN_PACK_VERSION } from "../westernEuropeanAbuse.js?v=4.24.1.brand1";
import { PRIORITY_GLOBAL_ABUSE_RULES, PRIORITY_GLOBAL_PACK_VERSION } from "../priorityGlobalAbuse.js?v=4.24.1.brand1";
import { NEXT_WAVE_ABUSE_RULES, NEXT_WAVE_PACK_VERSION } from "../nextWaveAbuse.js?v=4.24.1.brand1";
import { V412_LANGUAGE_RULES, V412_LANGUAGE_PACK_VERSION } from "../v412LanguageWave.js?v=4.24.1.brand1";
import { V412_SIGNAL_RULES, V412_SIGNAL_PACK_VERSION } from "../v412ContextSignals.js?v=4.24.1.brand1";
import { getLanguageQualitySnapshot } from "../languageQuality.js?v=4.24.1.brand1";
import { getServerEvidenceSummary, getServerHealth, persistAdjudicationOnServer } from "../serverEvidence.js?v=4.24.1.brand1";
import { getModerationCases, getEvaluationSummary, updateModerationCase } from "../serverPlatform.js?v=4.24.1.brand1";

export function renderAdmin(outlet) {
  const user = useCurrentUser();
  if (!isAdmin(user)) {
    outlet.innerHTML = `
      <div class="card card-pad stack" style="max-width:520px;margin:48px auto;text-align:center">
        <span class="eyebrow" style="color:var(--warn)">Restricted</span>
        <h2>Moderators only</h2>
        <p class="muted">The admin dashboard is limited to accounts with the moderator role. Redirecting you home…</p>
        <div><a class="btn btn-ghost" data-link href="/">Go home now</a></div>
      </div>`;
    setTimeout(() => { if (!isAdmin(useCurrentUser()) && current() === "/admin") navigate("/", true); }, 900);
    return;
  }
  paint(outlet);
  hydrateServerEvidence(outlet);
}

async function hydrateServerEvidence(outlet) {
  const panel = outlet.querySelector("[data-server-evidence-panel]");
  const casesPanel = outlet.querySelector("[data-case-workspace]");
  const evaluationPanel = outlet.querySelector("[data-evaluation-readiness]");
  if (!panel) return;
  try {
    const [summary, health, caseData, evaluation] = await Promise.all([getServerEvidenceSummary(), getServerHealth(), getModerationCases(), getEvaluationSummary()]);
    if (!panel.isConnected) return;
    const outcomes = ["clean", "warning", "review", "block"].map((name) => `<span><b>${summary.outcomes?.[name] || 0}</b>${name}</span>`).join("");
    const recent = summary.recent?.length ? summary.recent.map((item) => `<div class="server-receipt-row">
      <div><span class="badge ${item.final_outcome === "block" ? "badge-danger" : item.final_outcome === "review" ? "badge-review" : item.final_outcome === "warning" ? "badge-warn" : "badge-ok"}">${escapeHtml(item.final_outcome)}</span><b>${escapeHtml(item.category.replaceAll("_", " "))}</b></div>
      <p>${escapeHtml(item.text_preview)}</p>
      <small>${escapeHtml(item.receipt_id.slice(0, 22))}… · signature ${escapeHtml(item.signature.slice(0, 12))}… · ${timeAgo(item.created_at)} ago</small>
    </div>`).join("") : `<div class="adm-empty compact">The durable ledger is ready. Its first signed decision will appear here.</div>`;
    panel.innerHTML = `<div class="adm-head"><div><span class="eyebrow">Server-authoritative enforcement</span><h3>Signed evidence ledger</h3><p class="adm-intro">The browser verdict is advisory. The independent server policy decides again, signs the result and stores it in SQLite before publication.</p></div><span class="badge badge-teal">${escapeHtml(health.policyVersion)} · ${health.rules} rules</span></div>
      <div class="server-evidence-overview"><div><strong>${summary.totals.decisions}</strong><span>signed decisions</span></div><div><strong>${summary.totals.publications}</strong><span>authorized publications</span></div><div><strong>${summary.totals.mediaEvidence}</strong><span>media records</span></div><div><strong>${summary.totals.appeals}</strong><span>durable appeals</span></div><div><strong>${summary.totals.adjudications}</strong><span>adjudications</span></div></div>
      <div class="server-outcomes">${outcomes}</div>
      <div class="server-receipt-list">${recent}</div>
      <div class="quality-boundary">Local database: ${escapeHtml(summary.database)} · ${health.executablePatterns} executable patterns · receipts use an HMAC signature. Moderator access is authorized by the signed server session.</div>`;
    if (casesPanel) {
      const cases = caseData.cases || [];
      casesPanel.innerHTML = `<div class="adm-head"><div><span class="eyebrow">Production moderation operations</span><h3>Authenticated case workspace</h3><p class="adm-intro">Every non-clean server decision becomes a prioritised case without exposing prohibited content.</p></div><span class="adm-count">${cases.filter((item) => item.status !== "resolved").length} active</span></div>
        <div class="case-workspace-list">${cases.length ? cases.map((item) => `<article class="case-row priority-${item.priority}">
          <div><span class="badge ${item.priority === "critical" ? "badge-danger" : item.priority === "high" ? "badge-warn" : "badge-review"}">${escapeHtml(item.priority)}</span><b>${escapeHtml(item.harm_type.replaceAll("_", " "))}</b><small>${escapeHtml(item.case_id.slice(0,18))}… · subject ${escapeHtml(item.subject_user_id)} · ${timeAgo(item.created_at)} ago</small></div>
          <p>${escapeHtml(item.escalation)}${item.target_user_id ? ` · target ${escapeHtml(item.target_user_id)}` : ""}</p>
          <form data-case-form data-case-id="${item.case_id}"><select name="status"><option value="open" ${item.status === "open" ? "selected" : ""}>Open</option><option value="in_review" ${item.status === "in_review" ? "selected" : ""}>In review</option><option value="escalated" ${item.status === "escalated" ? "selected" : ""}>Escalated</option><option value="resolved" ${item.status === "resolved" ? "selected" : ""}>Resolved</option></select><input name="notes" minlength="8" required placeholder="Required moderator note" value="${escapeHtml(item.notes || "")}"><button class="btn btn-ghost btn-sm" type="submit">Save case</button></form>
        </article>`).join("") : `<div class="adm-empty">No server moderation cases yet.</div>`}</div>`;
      casesPanel.querySelectorAll("[data-case-form]").forEach((form) => form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const button = form.querySelector("button"); button.disabled = true;
        try { await updateModerationCase({ caseId:form.dataset.caseId, status:form.elements.status.value, notes:form.elements.notes.value }); toast("Case updated in the server workspace"); }
        catch (error) { toast(error.message || "Case update failed"); }
        finally { button.disabled = false; }
      }));
    }
    if (evaluationPanel) {
      const regression = evaluation.deterministicRegression;
      evaluationPanel.innerHTML = `<div class="adm-head"><div><span class="eyebrow">Measured safety quality</span><h3>Evaluation and provider readiness</h3><p class="adm-intro">Verified claims are separated from integration readiness and metrics that have not yet been measured.</p></div><span class="badge badge-teal">${regression.passed}/${regression.total} regression checks</span></div>
        <div class="evaluation-grid"><div><b>Deterministic policy suite</b><strong>${regression.passed}/${regression.total}</strong><small>${escapeHtml(regression.status)}</small></div><div><b>Representative labelled pilot</b><strong>Not measured</strong><small>Precision, recall and false-positive rate remain blank until a representative pilot exists.</small></div><div><b>Contextual intelligence</b><strong>${escapeHtml(evaluation.contextAdapter.status)}</strong><small>${escapeHtml(evaluation.contextAdapter.mode)} · external model ${escapeHtml(evaluation.contextAdapter.externalModel)}</small></div></div>
        <div class="provider-readiness">${evaluation.visualProviders.map((item) => `<span><b>${escapeHtml(item.provider)}</b><small>${escapeHtml(item.status)}</small></span>`).join("")}</div>
        <div class="quality-boundary">Active deployment ${escapeHtml(evaluation.deployment.active)} · rollback reference ${escapeHtml(evaluation.deployment.rollbackReference)} · no unmeasured quality claim is presented as fact.</div>`;
    }
  } catch (error) {
    panel.innerHTML = `<div class="adm-head"><div><span class="eyebrow">Server-authoritative enforcement</span><h3>Evidence ledger unavailable</h3><p class="adm-intro">The app will hold new publications rather than trust a browser-only decision.</p></div><span class="badge badge-danger">fail closed</span></div><div class="quality-boundary">${escapeHtml(error?.message || "Could not reach the server evidence service")}</div>`;
  }
}

function paint(outlet) {
  const s = getState();
  const openReports = s.reports.filter((r) => r.status === "open");
  const enhanced = s.reviewQueue.filter((r) => r.status === "pending").sort(byNewest);
  const blocks = s.moderationEvents.filter((m) => m.eventType === "block").sort(byNewest).slice(0, 12);
  const outcomes = s.moderationEvents
    .filter((m) => ["warning", "review_required", "review_submitted", "rewrite_accepted", "review_approved", "review_rejected"].includes(m.eventType))
    .sort(byNewest).slice(0, 16);
  const verificationQueue = s.profiles.filter((p) => p.verificationStatus === "pending");
  const languageCandidates = [...s.languageCandidates].sort(byNewest);
  const redTeamCases = [...s.redTeamCases].sort(byNewest);
  const policyLearnings = [...s.policyLearnings].sort(byNewest);
  const pendingRedTeam = redTeamCases.filter((item) => item.status === "captured");
  const pendingLearnings = policyLearnings.filter((item) => item.status === "awaiting_regression");
  const pendingAppeals = s.appeals.filter((item) => item.status === "pending").sort(byNewest);
  const harassmentGraph = getHarassmentGraph();
  const languageQuality = getLanguageQualitySnapshot();

  const totalBlocks = s.moderationEvents.filter((m) => m.eventType === "block").length;
  const totalWarnings = s.moderationEvents.filter((m) => m.eventType === "warning").length;

  outlet.innerHTML = `
    <div class="admin-wrap">
      <div class="page-head">
        <div><span class="eyebrow">Moderation</span><h1>Admin dashboard</h1></div>
        <div class="row gap-8 wrap">
          <a class="btn btn-teal btn-sm" data-link href="/hate-stress-test">Hate Stress Test</a>
          <a class="btn btn-ghost btn-sm" href="/demo-rehearsal.html" target="_blank" rel="noopener">Demo rehearsal</a>
          <span class="badge badge-teal">Moderator access</span>
        </div>
      </div>

      <div class="admin-summary">
        <div class="as alert"><b>${enhanced.length}</b><span>Enhanced review</span></div>
        <div class="as alert"><b>${openReports.length}</b><span>Open reports</span></div>
        <div class="as alert"><b>${totalBlocks}</b><span>Hard blocks</span></div>
        <div class="as warn"><b>${totalWarnings}</b><span>Warnings shown</span></div>
        <div class="as"><b>${pendingRedTeam.length}</b><span>Red-team probes</span></div>
        <div class="as"><b>${languageCandidates.filter((item) => item.status === "native_review_required").length}</b><span>Language candidates</span></div>
        <div class="as"><b>${pendingLearnings.length}</b><span>Learning queue</span></div>
        <div class="as"><b>${pendingAppeals.length}</b><span>Pending appeals</span></div>
        <div class="as"><b>${s.profiles.filter((p) => p.role !== "observer").length}</b><span>Verified members</span></div>
      </div>

      <div class="adm-section server-evidence-section" data-server-evidence-panel>
        <div class="adm-head"><div><span class="eyebrow">Server-authoritative enforcement</span><h3>Loading signed evidence ledger…</h3></div><span class="badge badge-review">checking</span></div>
      </div>

      <div class="adm-section case-workspace" data-case-workspace><div class="adm-head"><div><h3>Loading authenticated case workspace…</h3></div><span class="badge badge-review">checking</span></div></div>

      <div class="adm-section evaluation-readiness" data-evaluation-readiness><div class="adm-head"><div><h3>Loading evaluation readiness…</h3></div><span class="badge badge-review">checking</span></div></div>

      <div class="adm-section intelligence-section">
        <div class="adm-head"><div><span class="eyebrow">Persistent harm intelligence</span><h3>Cross-thread harassment graph</h3><p class="adm-intro">Links repeated interventions by author and target without displaying prohibited text.</p></div><span class="adm-count">${harassmentGraph.persistentEdges.length} persistent pattern${harassmentGraph.persistentEdges.length===1?"":"s"}</span></div>
        <div class="harassment-graph">${harassmentGraph.edges.length ? harassmentGraph.edges.map((edge) => `<div class="graph-edge ${edge.persistent?"persistent":""}"><div><b>${escapeHtml(getProfile(edge.authorId)?.displayName || edge.authorId)}</b><span>→</span><b>${escapeHtml(getProfile(edge.targetId)?.displayName || edge.targetId)}</b></div><small>${edge.interventions} interventions · ${edge.threads} thread${edge.threads===1?"":"s"} · severity ${edge.severity}/3</small><span class="badge ${edge.persistent?"badge-danger":"badge-warn"}">${edge.persistent?"persistent targeting":"watch"}</span></div>`).join("") : `<div class="adm-empty">No linked targeting patterns yet.</div>`}</div>
      </div>

      <div class="adm-section language-quality-section">
        <div class="adm-head"><div><span class="eyebrow">Quality, not just quantity</span><h3>Language evidence dashboard</h3><p class="adm-intro">${languageQuality.groups} functional language groups · ${languageQuality.rules} rules and contextual signals.</p></div><span class="badge badge-review">pilot metrics not yet measured</span></div>
        <div class="language-quality-table">${languageQuality.packs.map((pack) => `<div><b>${escapeHtml(pack.label)}</b><span>${pack.groups} group${pack.groups===1?"":"s"} · ${pack.rules} rules</span><small>${escapeHtml(pack.evidence)}</small><em>${escapeHtml(pack.regressionStatus)}</em></div>`).join("")}</div>
        <div class="quality-boundary">${escapeHtml(languageQuality.measurementBoundary)}</div>
      </div>

      <div class="adm-section appeals-admin-section">
        <div class="adm-head"><div><span class="eyebrow">Human correction loop</span><h3>Appeals and adjudication</h3><p class="adm-intro">Every decision records a reason. Corrections enter the regression backlog rather than silently changing live policy.</p></div><span class="adm-count">${pendingAppeals.length} pending</span></div>
        ${pendingAppeals.length ? pendingAppeals.map(appealReviewItem).join("") : `<div class="adm-empty">The appeals queue is clear.</div>`}
      </div>

      <div class="adm-section product-ops-section">
        <div class="adm-head">
          <div><span class="eyebrow">Product operations</span><h3>Safety operations workspace</h3><p class="adm-intro">Capture new language responsibly and convert live audience challenges into versioned regression evidence.</p></div>
          <span class="badge badge-teal">v4.19.0 universal safety intelligence</span>
        </div>
        <div class="product-ops-grid">
          <div class="ops-panel">
            <div class="ops-panel-head"><div><b>Language candidate intake</b><small>Candidate only · never activates a live block rule automatically</small></div><span class="badge badge-review">native review</span></div>
            <form data-language-candidate-form class="language-candidate-form">
              <label>Language or dialect<input name="language" required maxlength="60" placeholder="e.g. Brazilian Portuguese"></label>
              <label>Term or phrase<input name="term" required maxlength="120" placeholder="Enter the candidate wording"></label>
              <label class="wide">Meaning and abuse function<textarea name="meaning" required maxlength="240" rows="2" placeholder="What does it mean, who is targeted, and what makes it abusive?"></textarea></label>
              <label class="wide">Targeted example<textarea name="example" required maxlength="280" rows="2" placeholder="Give a contextual example for native review"></textarea></label>
              <label>Proposed action<select name="proposedAction"><option value="review">Hold for review</option><option value="warning">Intervene</option><option value="block">Hard block candidate</option></select></label>
              <button class="btn btn-teal btn-sm" type="submit">Submit candidate</button>
            </form>
            <div class="candidate-list">${languageCandidates.length ? languageCandidates.map(languageCandidateItem).join("") : `<div class="adm-empty compact">No candidate terms awaiting review.</div>`}</div>
          </div>
          <div class="ops-panel">
            <div class="ops-panel-head"><div><b>Live red-team recorder</b><small>Audience probes captured from Demo Lab</small></div><a data-link href="/demo-lab">Open live test</a></div>
            <div class="red-team-list">${redTeamCases.length ? redTeamCases.map(redTeamItem).join("") : `<div class="adm-empty compact">No live probes recorded yet. Record one from Demo Lab.</div>`}</div>
          </div>
          <div class="ops-panel learning-panel">
            <div class="ops-panel-head"><div><b>Governed policy learning loop</b><small>Native review or live probe → regression fixtures → versioned next-pack approval</small></div><span class="badge badge-teal">human-gated learning</span></div>
            <div class="learning-stages"><span><b>${languageCandidates.filter((item) => item.status === "native_review_required").length}</b> native review</span><span><b>${pendingLearnings.length}</b> regression</span><span><b>${policyLearnings.filter((item) => item.status === "approved_for_next_pack").length}</b> next pack</span></div>
            <div class="candidate-list learning-list">${policyLearnings.length ? policyLearnings.map(policyLearningItem).join("") : `<div class="adm-empty compact">Validated language candidates and promoted red-team probes will appear here.</div>`}</div>
          </div>
        </div>
      </div>

      <div class="adm-section lexicon-section">
        <div class="adm-head">
          <div><h3>Context and multilingual language policy</h3><p class="adm-intro">Reviewed language evaluated by target, speech act, stance, conversation and abuse stacking—not keyword alone.</p></div>
          <span class="adm-count">${EMERGING_LANGUAGE_RULES.length + MULTILINGUAL_ABUSE_RULES.length + POLISH_ABUSE_RULES.length + AUSTRALIAN_ABUSE_RULES.length + CZECH_BALTIC_ABUSE_RULES.length + WESTERN_EUROPEAN_ABUSE_RULES.length + PRIORITY_GLOBAL_ABUSE_RULES.length + NEXT_WAVE_ABUSE_RULES.length + V412_LANGUAGE_RULES.length + V412_SIGNAL_RULES.length + GLOBAL_RACIAL_SLUR_RULES.length} rules · ${CONTEXT_ENGINE_VERSION} · ${UNCERTAINTY_GUARD_VERSION}</span>
        </div>
        <div class="policy-console-bar">
          <label><span>Search active policy</span><input data-policy-search type="search" placeholder="Language, mechanism, rule or safe context…"></label>
          <label><span>Policy pack</span><select data-policy-pack><option value="all">All active packs</option><option value="emerging">Emerging language</option><option value="south-asian">South Asian</option><option value="polish">Polish</option><option value="australian">Australian</option><option value="czech-baltic">Czech + Baltic</option><option value="western-european">Western European</option><option value="priority-global">Priority global wave</option><option value="next-wave">Next language wave</option><option value="v412-wave">V4.12 language wave</option><option value="v412-context">Cross-context intelligence</option><option value="racial">Global racial policy</option></select></label>
          <div><span class="mini-kicker">Deployment state</span><b>Active rules are versioned and locked</b><small>New candidates require native review + tests</small></div>
        </div>
        <div class="lexicon-principles">
          <span><b>1 · Identify target</b> Person, group, sporting action or idea</span>
          <span><b>2 · Interpret function</b> Criticism, ridicule, exclusion, threat or harm</span>
          <span><b>3 · Explain evidence</b> Wording, address, context and counterexample</span>
          <span><b>4 · Proportionate action</b> Allow, intervene, review or block</span>
        </div>
        <div class="language-architecture">
          <div class="lexicon-subhead"><div><b>Pragmatic context engine</b><span>Determines what the wording is doing before applying proportional policy · ${CONTEXT_ENGINE_VERSION}</span></div><span class="badge badge-teal">active</span></div>
          <div class="language-architecture-flow">
            <div><span>01</span><b>Resolve the target</b><small>Direct address, participant aliases, indirect references, identity group, reply participant, sporting object or argument.</small></div>
            <div><span>02</span><b>Classify the speech act</b><small>Attack, criticism, allegation, command, counterspeech, quotation, report or analysis.</small></div>
            <div><span>03</span><b>Read stance and framing</b><small>Distinguish authorial abuse from condemnation, self-reference, education and attributed wording.</small></div>
            <div><span>04</span><b>Check residual abuse</b><small>Protected wording cannot hide a fresh attack added outside the quoted or opposing frame.</small></div>
            <div><span>05</span><b>Measure behaviour</b><small>Combine stacking, cross-thread interventions, severity escalation and post-match bursts without suppressing clean criticism.</small></div>
            <div><span>06</span><b>Keep hard safety fixed</b><small>Threats, doxxing and high-confidence hate are decided again on the server and cannot be bypassed by changing browser state.</small></div>
          </div>
        </div>
        <div class="language-architecture">
          <div class="lexicon-subhead"><div><b>MVP Presenter Shield</b><span>Fail-safe uncertainty and evasion guard · ${UNCERTAINTY_GUARD_VERSION}</span></div><span class="badge badge-review">active fail-safe</span></div>
          <div class="language-architecture-flow">
            <div><span>01</span><b>Normalise compatibility text</b><small>Fullwidth, circled, mathematical, accented and common substituted characters are evaluated consistently.</small></div>
            <div><span>02</span><b>Detect separator attacks</b><small>Spacing, punctuation, underscores, slashes, line breaks, emoji and combining marks cannot split reviewed terms safely.</small></div>
            <div><span>03</span><b>Expose invisible controls</b><small>Zero-width, variation, bidirectional and isolation controls are recorded as evidence.</small></div>
            <div><span>04</span><b>Identify mixed-script targeting</b><small>Latin/Cyrillic or Latin/Greek target manipulation is not silently treated as ordinary text.</small></div>
            <div><span>05</span><b>Fail safely under uncertainty</b><small>Known abuse intervenes; unknown targeted obfuscation is held for review without inventing a label.</small></div>
            <div><span>06</span><b>Protect legitimate examples</b><small>Research, spelling exercises, variables and script comparisons remain publishable.</small></div>
          </div>
        </div>
        <div class="language-architecture">
          <div class="lexicon-subhead"><div><b>All-language production architecture</b><span>Coverage is an ensemble, not a universal keyword blacklist.</span></div><span class="badge badge-review">production integration</span></div>
          <div class="language-architecture-flow">${LANGUAGE_POLICY_ARCHITECTURE.map((item, index) => `<div><span>${String(index + 1).padStart(2,"0")}</span><b>${escapeHtml(item.layer)}</b><small>${escapeHtml(item.purpose)}</small></div>`).join("")}</div>
        </div>
        <div class="lexicon-table">
          ${EMERGING_LANGUAGE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="emerging">
            <div><b>${escapeHtml(rule.term)}</b><small>${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${escapeHtml(rule.outcome)}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>South Asian and code-mixed policy pack</b><span>Romanised, Devanagari, Gujarati and Urdu forms · ${MULTILINGUAL_PACK_VERSION}</span></div><span class="badge badge-teal">${MULTILINGUAL_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${MULTILINGUAL_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="south-asian">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)}</small></div>
            <span class="badge ${rule.targetedOutcome === "block" ? "badge-danger" : "badge-warn"}">${escapeHtml(rule.targetedOutcome)} if targeted</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Polish profanity and targeted-abuse pack</b><span>Diacritics, common phonetic spellings and target-sensitive meaning · ${POLISH_PACK_VERSION}</span></div><span class="badge badge-teal">${POLISH_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${POLISH_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="polish">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${escapeHtml(rule.outcome)}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Australian English abuse pack</b><span>Target-sensitive slang, literal counterexamples and contemporary usage · ${AUSTRALIAN_PACK_VERSION}</span></div><span class="badge badge-teal">${AUSTRALIAN_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${AUSTRALIAN_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="australian">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.id)}</small></div>
            <span class="badge badge-warn">intervene if targeted</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Czech and Baltic-region abuse pack</b><span>Czech (West Slavic), Lithuanian + Latvian (Baltic), Estonian (Finnic) · ${CZECH_BALTIC_PACK_VERSION}</span></div><span class="badge badge-teal">${CZECH_BALTIC_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${CZECH_BALTIC_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="czech-baltic">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${rule.outcome === "block" ? "hard block" : "intervene"}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Western European targeted-abuse pack</b><span>Spanish, French, German, Italian, Portuguese and Dutch · ${WESTERN_EUROPEAN_PACK_VERSION}</span></div><span class="badge badge-teal">${WESTERN_EUROPEAN_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${WESTERN_EUROPEAN_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="western-european">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)} · ${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${rule.outcome === "block" ? "hard block if targeted" : "intervene if targeted"}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Priority global functional-abuse pack</b><span>Arabic, Russian, Ukrainian, Mandarin, Japanese, Korean, Turkish, Greek, Romanian, Hungarian, Slovak, Serbian, Croatian and Bosnian · ${PRIORITY_GLOBAL_PACK_VERSION}</span></div><span class="badge badge-teal">${PRIORITY_GLOBAL_ABUSE_RULES.length} reviewed rules</span></div>
        <div class="lexicon-table">
          ${PRIORITY_GLOBAL_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="priority-global">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)} · ${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${rule.outcome === "block" ? "hard block" : "intervene"}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Next-wave functional-abuse pack</b><span>Bengali, Persian, Hebrew, Indonesian, Malay, Vietnamese, Thai, Tagalog, Swahili and Amharic · ${NEXT_WAVE_PACK_VERSION}</span></div><span class="badge badge-teal">${NEXT_WAVE_ABUSE_RULES.length} research-backed demo rules</span></div>
        <div class="lexicon-table">
          ${NEXT_WAVE_ABUSE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="next-wave">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)} · ${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : "badge-warn"}">${rule.outcome === "block" ? "hard block" : "intervene"}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>V4.12 cross-script language wave</b><span>Tamil, Telugu, Kannada, Malayalam, Marathi, Nepali, Hausa, Yorùbá, Igbo and Nigerian Pidgin · ${V412_LANGUAGE_PACK_VERSION}</span></div><span class="badge badge-teal">${V412_LANGUAGE_RULES.length} functional rules</span></div>
        <div class="lexicon-table">
          ${V412_LANGUAGE_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="v412-wave">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.language)} · ${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "block" ? "badge-danger" : rule.outcome === "review" ? "badge-review" : "badge-warn"}">${rule.outcome === "block" ? "hard block" : escapeHtml(rule.outcome)}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>Cross-context and coded-meaning signals</b><span>Code-switching, transliteration evasion and ambiguity-aware dog-whistle review · ${V412_SIGNAL_PACK_VERSION}</span></div><span class="badge badge-review">${V412_SIGNAL_RULES.length} contextual signals</span></div>
        <div class="lexicon-table">
          ${V412_SIGNAL_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="v412-context">
            <div><b>${escapeHtml(rule.displayTerm)}</b><small>${escapeHtml(rule.id)}</small></div>
            <span class="badge ${rule.outcome === "review" ? "badge-review" : "badge-warn"}">${escapeHtml(rule.outcome)}</span>
            <div><b>${escapeHtml(rule.mechanism.replaceAll("_", " "))}</b><small>${escapeHtml(rule.rationale)}</small></div>
            <div><span class="mini-kicker">Allowed context</span><small>“${escapeHtml(rule.safeExample)}”</small></div>
          </div>`).join("")}
        </div>
        <div class="lexicon-subhead"><div><b>High-confidence global racial-slur pack</b><span>Exact slur forms and transliterations only; ambiguous colour/demonym words excluded · ${GLOBAL_RACIAL_PACK_VERSION}</span></div><span class="badge badge-danger">${GLOBAL_RACIAL_SLUR_RULES.length} hard-block rules</span></div>
        <div class="lexicon-table racial-policy-table">
          ${GLOBAL_RACIAL_SLUR_RULES.map((rule) => `<div class="lexicon-row" data-policy-row data-policy-pack="racial">
            <div><b>${escapeHtml(rule.label)}</b><small>${escapeHtml(rule.id)}</small></div>
            <span class="badge badge-danger">hard block</span>
            <div><b>${escapeHtml(rule.language)}</b><small>Identity-based racial abuse · original has no bypass; any clean draft is separately validated</small></div>
            <div><span class="mini-kicker">Coverage</span><small>${rule.forms.length} reviewed form${rule.forms.length === 1 ? "" : "s"}; raw term hidden in Admin presentation.</small></div>
          </div>`).join("")}
        </div>
      </div>

      <div class="adm-section enhanced-section">
        <div class="adm-head">
          <div><h3>Enhanced moderation queue</h3><p class="adm-intro">Borderline originals stay invisible until a moderator approves them.</p></div>
          <span class="adm-count">${enhanced.length} pending</span>
        </div>
        ${enhanced.length ? enhanced.map(enhancedItem).join("") : `<div class="adm-empty">The enhanced moderation queue is clear.</div>`}
      </div>

      <div class="adm-section">
        <div class="adm-head"><h3>Open reports</h3><span class="adm-count">${openReports.length} open</span></div>
        ${openReports.length ? openReports.map((r) => reportItem(r, s)).join("") : `<div class="adm-empty">No open reports. 🎉</div>`}
      </div>

      <div class="adm-section">
        <div class="adm-head"><h3>Hard-blocked attempts</h3><span class="adm-count">${totalBlocks} total</span></div>
        <div class="log-list">${blocks.length ? blocks.map((m) => logRow(m, "block")).join("") : `<div class="adm-empty">No blocked attempts logged.</div>`}</div>
      </div>

      <div class="adm-section">
        <div class="adm-head"><h3>Pre-publication decisions</h3><span class="adm-count">${outcomes.length} recent</span></div>
        <div class="log-list">${outcomes.length ? outcomes.map((m) => logRow(m, "outcome")).join("") : `<div class="adm-empty">No moderation activity logged.</div>`}</div>
      </div>

      <div class="adm-section">
        <div class="adm-head"><h3>Verification review queue</h3><span class="adm-count">${verificationQueue.length} pending</span></div>
        ${verificationQueue.length ? verificationQueue.map(vqItem).join("") : `<div class="adm-empty">The verification queue is clear.</div>`}
      </div>
    </div>`;

  attach(outlet.querySelector(".admin-wrap"));
}

function byNewest(a, b) { return new Date(b.createdAt) - new Date(a.createdAt); }

function appealReviewItem(item) {
  const author = getProfile(item.userId);
  const event = getState().moderationEvents.find((row) => row.id === item.moderationEventId);
  return `<div class="appeal-review-item" data-appeal-row="${item.id}"><div class="review-item-head"><div><span class="badge badge-review">appeal pending</span><strong>${escapeHtml(author?.displayName || item.userId)}</strong><span class="muted">· ${timeAgo(item.createdAt)} ago</span></div><span class="review-reason">${escapeHtml(event?.reason || item.originalCategory)}</span></div><div class="reported-content">“${escapeHtml(item.statement)}”</div><label class="field"><span>Adjudication reason</span><textarea rows="2" maxlength="600" data-appeal-notes placeholder="Record why the first decision was right or wrong."></textarea></label><label class="field compact-field"><span>Corrected category</span><select data-appeal-category><option value="context_error">Context error</option><option value="quotation_or_report">Quotation or report</option><option value="language_ambiguity">Language ambiguity</option><option value="target_resolution">Target resolution</option><option value="policy_gap">Policy gap</option></select></label><div class="report-actions"><button class="btn btn-ghost btn-sm" data-appeal-decision="upheld">Uphold</button><button class="btn btn-teal btn-sm" data-appeal-decision="overturned">Overturn</button><button class="btn btn-primary btn-sm" data-appeal-decision="corrected">Correct category</button></div></div>`;
}

function languageCandidateItem(item) {
  const pending = item.status === "native_review_required";
  return `<div class="ops-item">
    <div class="ops-item-head"><div><b>${escapeHtml(item.term)}</b><small>${escapeHtml(item.language)} · ${timeAgo(item.createdAt)} ago</small></div><span class="badge ${pending ? "badge-review" : item.status === "validated_for_test" ? "badge-ok" : "badge-danger"}">${escapeHtml(item.status.replaceAll("_", " "))}</span></div>
    <p>${escapeHtml(item.meaning)}</p>
    <div class="ops-example">“${escapeHtml(item.example)}”</div>
    <small>Proposed: ${escapeHtml(item.proposedAction)} · activation still requires native review and regression tests</small>
    ${pending ? `<div class="ops-actions"><button class="btn btn-teal btn-sm" data-language-candidate="${item.id}" data-candidate-decision="validated_for_test">Validate for test</button><button class="btn btn-quiet btn-sm" data-language-candidate="${item.id}" data-candidate-decision="declined">Decline</button></div>` : ""}
  </div>`;
}

function redTeamItem(item) {
  const pending = item.status === "captured";
  return `<div class="ops-item">
    <div class="ops-item-head"><div><b>${escapeHtml(item.expectedOutcome.toUpperCase())} · ${escapeHtml((item.category || "policy").replaceAll("_", " "))}</b><small>${escapeHtml(item.scenario)} · ${timeAgo(item.createdAt)} ago</small></div><span class="context-risk ${escapeHtml(item.riskBand)}">${escapeHtml(item.riskBand)}${item.riskScore === null ? "" : ` · ${item.riskScore}`}</span></div>
    <div class="ops-example ${item.contentWithheld ? "withheld" : ""}">“${escapeHtml(item.displayText)}”</div>
    <p>${escapeHtml(item.reason)} · ${escapeHtml(item.targetRole)}</p>
    ${pending ? `<div class="ops-actions"><button class="btn btn-teal btn-sm" data-red-team-case="${item.id}" data-red-team-decision="promoted_to_regression">Promote to regression</button><button class="btn btn-quiet btn-sm" data-red-team-case="${item.id}" data-red-team-decision="dismissed">Dismiss</button></div>` : `<small>${escapeHtml(item.status.replaceAll("_", " "))}</small>`}
  </div>`;
}

function policyLearningItem(item) {
  const pending = item.status === "awaiting_regression";
  const badge = item.status === "approved_for_next_pack" ? "badge-ok" : item.status === "rejected" ? "badge-danger" : "badge-review";
  return `<div class="ops-item">
    <div class="ops-item-head"><div><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.sourceType.replaceAll("_", " "))} · ${timeAgo(item.createdAt)} ago</small></div><span class="badge ${badge}">${escapeHtml(item.status.replaceAll("_", " "))}</span></div>
    <p>${escapeHtml(item.evidence)}</p>
    <small>Expected outcome: ${escapeHtml(item.expectedOutcome)} · never activates a browser rule directly</small>
    ${pending ? `<div class="ops-actions"><button class="btn btn-teal btn-sm" data-policy-learning="${item.id}" data-learning-decision="approved_for_next_pack">Regression passed</button><button class="btn btn-quiet btn-sm" data-policy-learning="${item.id}" data-learning-decision="needs_more_evidence">Needs evidence</button><button class="btn btn-quiet btn-sm" data-policy-learning="${item.id}" data-learning-decision="rejected">Reject</button></div>` : ""}
  </div>`;
}

function enhancedItem(item) {
  const author = getProfile(item.userId);
  return `
    <div class="review-item">
      <div class="review-item-head">
        <div>
          <span class="badge badge-review">held from publication</span>
          <strong>${escapeHtml(author?.displayName || item.userId)}</strong>
          <span class="muted">· ${escapeHtml(item.contentType)} · ${timeAgo(item.createdAt)} ago</span>
        </div>
        <span class="review-reason">${escapeHtml(item.reason)}</span>
      </div>
      <div class="review-body">
        ${item.imageUrl ? `<img class="review-thumb" src="${item.imageUrl}" alt="${escapeHtml(item.imageAlt || "Image awaiting moderation")}">` : ""}
        <div class="reported-content review-content">“${escapeHtml(item.text)}”</div>
      </div>
      ${item.contextEvidence ? `<div class="review-context-evidence"><span>Target: ${escapeHtml(item.contextEvidence.targetRole || "participant")}</span><span>Scope: ${escapeHtml(item.contextEvidence.targetScope || "conversation")}</span><span>Risk: ${escapeHtml(item.contextEvidence.riskBand || "unknown")}${item.contextEvidence.riskScore == null ? "" : ` · ${item.contextEvidence.riskScore}/100`}</span><span>Thread: ${Number(item.contextEvidence.turnsConsidered || 0)} turns assessed</span></div>` : ""}
      ${item.imageAnalysis ? `<div class="review-checks">Image checks: ${escapeHtml((item.imageAnalysis.checks || []).join(" · "))}</div>` : ""}
      <div class="report-actions">
        <button class="btn btn-teal btn-sm" data-enhanced-review="${item.id}" data-decision="approved">Approve &amp; publish</button>
        <button class="btn btn-danger btn-sm" data-enhanced-review="${item.id}" data-decision="rejected">Decline</button>
        <span class="muted review-note">No public visibility while pending</span>
      </div>
    </div>`;
}

function reportContent(r, s) {
  if (r.targetType === "comment") return s.comments.find((x) => x.id === r.targetId)?.content ?? null;
  if (r.targetType === "post") return s.posts.find((x) => x.id === r.targetId)?.content ?? null;
  return null;
}

function reportItem(r, s) {
  const reporter = getProfile(r.reporterId);
  const content = reportContent(r, s);
  return `
    <div class="report-item">
      <div class="report-top">
        <span class="who">${escapeHtml(reporter ? reporter.displayName : "Unknown")}</span>
        <span class="muted" style="font-size:.84rem">reported a ${escapeHtml(r.targetType)}</span>
        <span class="badge">${escapeHtml(r.status)}</span>
        <span class="muted" style="font-size:.78rem;margin-left:auto">${timeAgo(r.createdAt)} ago</span>
      </div>
      ${content !== null ? `<div class="reported-content">“${escapeHtml(content)}”</div>` : `<div class="reported-content missing">Content no longer available.</div>`}
      <div class="report-reason"><span class="rr-label">Reason:</span> ${escapeHtml(r.reason)}</div>
      <div class="report-actions">
        <button class="btn btn-ghost btn-sm" data-report="${r.id}" data-act="reviewed">Mark reviewed</button>
        <button class="btn btn-danger btn-sm" data-report="${r.id}" data-act="remove" data-target-type="${r.targetType}" data-target-id="${r.targetId}">Remove content</button>
        <button class="btn btn-danger btn-sm" data-report="${r.id}" data-act="suspend">Suspend user</button>
        <button class="btn btn-quiet btn-sm" data-report="${r.id}" data-act="dismiss">Dismiss</button>
      </div>
    </div>`;
}

function logRow(m, kind) {
  const u = getProfile(m.userId);
  const map = {
    warning: `<span class="badge badge-warn">warning shown</span>`,
    review_required: `<span class="badge badge-review">review required</span>`,
    review_submitted: `<span class="badge badge-review">queued privately</span>`,
    rewrite_accepted: `<span class="badge badge-ok">safer rewrite used</span>`,
    review_approved: `<span class="badge badge-ok">approved by moderator</span>`,
    review_rejected: `<span class="badge badge-danger">declined by moderator</span>`,
  };
  const sideBadge = kind === "block" ? `<span class="badge badge-danger">blocked</span>` : (map[m.eventType] || "");
  return `
    <div class="log-row">
      <div class="log-main">
        <div class="log-text">“${escapeHtml(m.originalText)}”</div>
        <div class="log-meta">${escapeHtml(u ? u.displayName : m.userId)} · ${escapeHtml(m.reason)} · ${fmtDate(m.createdAt)}</div>
      </div>
      <div class="log-side">${sideBadge}</div>
    </div>`;
}

function vqItem(p) {
  return `
    <div class="vq-item">
      <img class="avatar avatar-sm" src="${p.avatarUrl}" alt="">
      <div class="vq-who"><div style="font-weight:600">${escapeHtml(p.displayName)}</div><div class="muted" style="font-size:.78rem">Submitted ${timeAgo(p.createdAt)} ago · status: ${escapeHtml(p.verificationStatus)}</div></div>
      <div class="vq-actions">
        <button class="btn btn-teal btn-sm" data-verify="${p.id}" data-status="verified_adult">Approve adult</button>
        <button class="btn btn-ghost btn-sm" data-verify="${p.id}" data-status="verified_u18">Approve U18</button>
        <button class="btn btn-danger btn-sm" data-verify="${p.id}" data-status="rejected">Reject</button>
        <button class="btn btn-quiet btn-sm" data-verify="${p.id}" data-status="pending">Keep in review</button>
      </div>
    </div>`;
}

function attach(root) {
  if (!root) return;
  const applyPolicyFilter = () => {
    const query = String(root.querySelector("[data-policy-search]")?.value || "").trim().toLowerCase();
    const pack = root.querySelector("[data-policy-pack]")?.value || "all";
    root.querySelectorAll("[data-policy-row]").forEach((row) => {
      const packMatch = pack === "all" || row.dataset.policyPack === pack;
      const searchMatch = !query || row.textContent.toLowerCase().includes(query);
      row.hidden = !(packMatch && searchMatch);
    });
  };
  root.querySelector("[data-policy-search]")?.addEventListener("input", applyPolicyFilter);
  root.querySelector("[data-policy-pack]")?.addEventListener("change", applyPolicyFilter);

  root.querySelector("[data-language-candidate-form]")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const res = submitLanguageCandidate(useCurrentUser(), {
      language:data.get("language"), term:data.get("term"), meaning:data.get("meaning"),
      example:data.get("example"), proposedAction:data.get("proposedAction"),
    });
    toast(res.ok ? "Candidate saved for native-language review" : (res.error || "Could not save candidate"));
  });

  root.addEventListener("click", async (e) => {
    const admin = useCurrentUser();

    const candidate = e.target.closest("[data-language-candidate]");
    if (candidate) {
      const res = resolveLanguageCandidate(admin, candidate.dataset.languageCandidate, candidate.dataset.candidateDecision);
      toast(res.ok ? "Language candidate updated" : (res.error || "Could not update candidate"));
      return;
    }

    const redTeam = e.target.closest("[data-red-team-case]");
    if (redTeam) {
      const res = resolveRedTeamCase(admin, redTeam.dataset.redTeamCase, redTeam.dataset.redTeamDecision);
      toast(res.ok ? (redTeam.dataset.redTeamDecision === "promoted_to_regression" ? "Promoted to the regression backlog" : "Red-team case dismissed") : (res.error || "Could not update case"));
      return;
    }

    const learning = e.target.closest("[data-policy-learning]");
    if (learning) {
      const res = resolvePolicyLearning(admin, learning.dataset.policyLearning, learning.dataset.learningDecision);
      toast(res.ok ? (learning.dataset.learningDecision === "approved_for_next_pack" ? "Regression evidence approved for the next versioned pack" : "Learning item updated") : (res.error || "Could not update learning item"));
      return;
    }

    const enhanced = e.target.closest("[data-enhanced-review]");
    if (enhanced) {
      const res = resolveEnhancedReview(admin, enhanced.dataset.enhancedReview, enhanced.dataset.decision);
      toast(res.ok ? (enhanced.dataset.decision === "approved" ? "Approved and published" : "Content declined") : (res.error || "Failed"));
      return;
    }

    const appealDecision = e.target.closest("[data-appeal-decision]");
    if (appealDecision) {
      const row = appealDecision.closest("[data-appeal-row]");
      const payload = {
        appealId:row.dataset.appealRow, moderatorId:admin.id,
        decision:appealDecision.dataset.appealDecision,
        notes:row.querySelector("[data-appeal-notes]").value,
        correctedCategory:row.querySelector("[data-appeal-category]").value,
      };
      appealDecision.disabled = true;
      try {
        await persistAdjudicationOnServer(payload);
        const res = resolveAppeal(admin, payload.appealId, payload);
        toast(res.ok ? "Appeal adjudicated in both audit ledgers" : res.error);
      } catch (error) {
        appealDecision.disabled = false;
        toast(error?.message || "The durable adjudication was not recorded");
      }
      return;
    }

    const rep = e.target.closest("[data-report]");
    if (rep) {
      const id = rep.dataset.report;
      const act = rep.dataset.act;
      if (act === "reviewed") { updateReportStatus(admin, id, "reviewed"); toast("Report marked reviewed"); }
      else if (act === "dismiss") { updateReportStatus(admin, id, "dismissed"); toast("Report dismissed"); }
      else if (act === "remove") {
        setModerationStatus(admin, rep.dataset.targetType, rep.dataset.targetId, "removed");
        updateReportStatus(admin, id, "reviewed");
        toast("Content removed & report closed");
      } else if (act === "suspend") {
        updateReportStatus(admin, id, "reviewed");
        toast("User suspended (demo)");
      }
      return;
    }

    const vq = e.target.closest("[data-verify]");
    if (vq) {
      const res = setVerificationStatus(admin, vq.dataset.verify, vq.dataset.status);
      toast(res.ok ? "Verification updated" : (res.error || "Failed"));
    }
  });
}
