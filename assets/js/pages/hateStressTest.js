import { moderateContent, TEST_CASES } from "../moderation.js?v=4.24.1.0";
import { HATE_STRESS_CASES } from "../hateStressCases.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { runMediaEvidenceTests } from "../mediaIntelligence.js?v=4.24.1.0";

function runCases(cases) {
  return cases.map((test) => {
    const result = moderateContent(test.input, test.context || {});
    const rewriteOK = test.expectRewrite ? (result.rewriteSuggestion === test.expectRewrite || (result.rewrite?.suppressedCandidate === test.expectRewrite && result.rewrite?.evaluation?.suitable === false)) : true;
    const noRewriteOK = test.expectNoRewrite ? result.rewriteSuggestion === undefined : true;
    const safeDraftOK = test.expectSafeDraft ? result.safeDraftSuggestion === test.expectSafeDraft : true;
    const noSafeDraftOK = test.expectNoSafeDraft ? result.safeDraftSuggestion === undefined : true;
    const sourceBasisOK = test.expectSourceBasis ? String(result.rewrite?.sourceBasis || "").toLowerCase().includes(test.expectSourceBasis.toLowerCase()) : true;
    const safeDraftValidated = !result.safeDraftSuggestion || (result.rewrite?.status === "safe_new_draft" && result.rewrite?.validatedClean === true && moderateContent(result.safeDraftSuggestion, test.context || {}).outcome === "clean");
    const noBypass = test.expect !== "block" || (result.rewriteSuggestion === undefined && safeDraftValidated);
    const assessment=result.analysis?.contextAssessment;
    const targetRoleOK=test.expectTargetRole ? assessment?.targetAudience?.role===test.expectTargetRole : true;
    const targetScopeOK=test.expectTargetScope ? assessment?.targetScope===test.expectTargetScope : true;
    const pileOnOK=test.expectPileOn ? assessment?.conversation?.pileOn===true : true;
    const repeatedOK=test.expectRepeatedTargeting!=null ? assessment?.conversation?.repeatedAuthorInterventions===test.expectRepeatedTargeting : true;
    const speechActOK=test.expectSpeechAct ? assessment?.speechActId===test.expectSpeechAct : true;
    const rewriteOptionsOK=test.expectRewriteOptions ? (result.rewrite?.options?.length>=test.expectRewriteOptions || result.rewrite?.status==="fidelity_not_proven") : true;
    const clauseMapOK=test.expectClauseMap ? result.rewrite?.clauses?.length>=2 : true;
    const codeSwitchOK=test.expectCodeSwitch ? result.codeSwitch===true : true;
    const codedMeaningOK=test.expectCodedMeaning ? !!result.analysis?.codedMeaning : true;
    const crossThreadOK=test.expectCrossThread!=null ? assessment?.conversation?.crossThreadInterventions===test.expectCrossThread : true;
    const semantic=result.analysis?.semanticIntent;
    const semanticActOK=test.expectSemanticAct ? semantic?.summary?.dominantSpeechAct===test.expectSemanticAct : true;
    const mixedIntentOK=test.expectMixedIntent ? semantic?.summary?.mixedIntent===true : true;
    const severeFloorOK=test.expectSevereFloor ? semantic?.severeFloor?.locked===true : true;
    const fidelityOK=!result.rewrite?.suggestion || result.rewrite?.evaluation?.suitable===true;
    return { ...test, result, pass:result.outcome === test.expect && rewriteOK && noRewriteOK && safeDraftOK && noSafeDraftOK && sourceBasisOK && noBypass && targetRoleOK && targetScopeOK && pileOnOK && repeatedOK && speechActOK && rewriteOptionsOK && clauseMapOK && codeSwitchOK && codedMeaningOK && crossThreadOK && semanticActOK && mixedIntentOK && severeFloorOK && fidelityOK };
  });
}

function verdict(label, results) {
  const passed = results.filter((r) => r.pass).length;
  return `<div class="stress-verdict ${passed === results.length ? "pass" : "fail"}"><span>${passed === results.length ? "✓" : "!"}</span><div><b>${escapeHtml(label)}</b><strong>${passed}/${results.length}</strong><small>${passed === results.length ? "All checks passed" : `${results.length-passed} checks need attention`}</small></div></div>`;
}

function resultDetails(result) {
  const a=result.analysis;
  const c=a.contextAssessment;
  const draft=result.rewriteSuggestion || result.safeDraftSuggestion;
  const semantic=a.semanticIntent||{};
  const semanticSummary=semantic.summary||{};
  const draftCard=draft ? `<div class="stress-rewrite-proof"><span class="mini-kicker">${result.safeDraftSuggestion ? "Source-backed new draft · original stays blocked" : "Source-backed rewrite"}</span><b>${escapeHtml(draft)}</b>${result.rewrite?.sourceBasis ? `<small>Kept from the post: ${escapeHtml(result.rewrite.sourceBasis)}</small>` : ""}${result.rewrite?.evaluation?.score!=null?`<small>Meaning fidelity: ${result.rewrite.evaluation.score}/100 · ${escapeHtml(result.rewrite.evaluation.status.replaceAll("_"," "))}</small>`:""}${result.rewrite?.options?.length>1 ? `<div class="stress-option-list">${result.rewrite.options.map((option)=>`<span><b>${escapeHtml(option.label)}</b>${escapeHtml(option.suggestion)} · ${option.validatedClean?"validated":"candidate"}</span>`).join("")}</div>`:""}</div>` : "";
  const semanticProof=semantic.clauses?.length?`<div class="stress-semantic-proof"><span class="mini-kicker">Semantic intent proof · ${semanticSummary.clauseCount} clause${semanticSummary.clauseCount===1?"":"s"}</span><div>${semantic.clauses.map((clause)=>`<span class="${clause.harmful?"harmful":"safe"}"><b>Clause ${clause.ordinal}</b>${escapeHtml(clause.speechAct.label)} · ${escapeHtml(clause.target.basis)}</span>`).join("")}</div><small>${semantic.counterfactuals.map((item)=>`${escapeHtml(item.label)}: ${item.harmful?"harm remains":"no harm remains"}`).join(" · ")} · ${escapeHtml(semantic.severeFloor.reason)}</small></div>`:"";
  return `<div class="stress-live-result ${result.outcome}"><div><span class="badge">${escapeHtml(result.outcome)}</span><b>${escapeHtml(result.reason)}</b></div><dl><dt>Target</dt><dd>${escapeHtml(a.target)}</dd><dt>Mechanism</dt><dd>${escapeHtml(a.mechanism)}</dd>${c ? `<dt>Speech act</dt><dd>${escapeHtml(c.speechAct)}</dd><dt>Stance</dt><dd>${escapeHtml(c.stance)}</dd>${c.profanity?.present ? `<dt>Profanity function</dt><dd>${escapeHtml(c.profanity.label)} · ${c.profanity.abusive ? "abuse signal" : "not an abuse signal"}</dd>` : ""}<dt>Context risk</dt><dd>${escapeHtml(c.riskBand)} · ${c.riskScore}/100 · ${escapeHtml(c.stacking)}</dd><dt>Cross-thread memory</dt><dd>${c.conversation?.crossThreadInterventions||0} interventions${c.conversation?.postEventBurst?" · post-match burst":""}</dd>` : ""}<dt>Clause reasoning</dt><dd>${semanticSummary.harmfulClauses||0} harmful of ${semanticSummary.clauseCount||0} · ${escapeHtml(semanticSummary.dominantSpeechAct||"not resolved")}${semanticSummary.mixedIntent?" · mixed intent":""}</dd><dt>Why</dt><dd>${escapeHtml(a.policyRationale)}</dd><dt>Action</dt><dd>${escapeHtml(a.action)}</dd><dt>Scripts</dt><dd>${escapeHtml(a.languageCoverage.scripts.join(" + "))}</dd>${a.codedMeaning?`<dt>Coded meaning</dt><dd>${escapeHtml(a.codedMeaning.status)} · ${escapeHtml(a.codedMeaning.evidence||a.codedMeaning.ambiguity)}</dd>`:""}${a.confidenceProfile?`<dt>Confidence</dt><dd>policy ${escapeHtml(a.confidenceProfile.policy)} · language ${escapeHtml(a.confidenceProfile.language)} · target ${escapeHtml(a.confidenceProfile.target)} · rewrite ${escapeHtml(a.confidenceProfile.rewrite)}</dd>`:""}</dl>${semanticProof}${draftCard}</div>`;
}

const CHALLENGE_CONTEXTS = [
  ["Standalone", {}],
  ["Player reply", { isReply:true, replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true } }],
  ["Indirect reference", { lastReferencedParticipant:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true } }],
  ["Developing pile-on", { isReply:true, currentAuthorId:"fan-3", replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true }, priorTargetedInterventions:[{authorId:"fan-1",outcome:"warning"},{authorId:"fan-2",outcome:"warning"}] }],
  ["Cross-thread repeat", { isReply:true, eventWindow:"post_match", currentAuthorId:"fan-7", replyTarget:{ id:"athlete-1", handle:"maravolkov", role:"verified_adult", isAthlete:true }, behaviourHistory:[{authorId:"fan-7",targetId:"athlete-1",outcome:"warning"},{authorId:"fan-7",targetId:"athlete-1",outcome:"warning"},{authorId:"fan-7",targetId:"athlete-1",outcome:"review"}] }],
  ["U18 reply", { isReply:true, replyTarget:{ id:"junior-1", handle:"junior", role:"verified_u18", isU18:true } }],
];

function challengeMatrix(text) {
  return `<div class="challenge-matrix">${CHALLENGE_CONTEXTS.map(([label,context])=>{const r=moderateContent(text,context);const c=r.analysis?.contextAssessment;return `<div class="${escapeHtml(r.outcome)}"><span class="badge">${escapeHtml(r.outcome)}</span><b>${escapeHtml(label)}</b><small>${escapeHtml(c?.targetScope||r.analysis.targetType)} · ${escapeHtml(c?.riskBand||"base policy")}${c?.conversation?.crossThreadInterventions?` · ${c.conversation.crossThreadInterventions} prior`:""}</small></div>`;}).join("")}</div>`;
}

export function renderHateStressTest(outlet) {
  const canonical=runCases(TEST_CASES);
  const stress=runCases(HATE_STRESS_CASES);
  const media=runMediaEvidenceTests();
  const all=[...canonical,...stress,...media];
  const passed=all.filter((r)=>r.pass).length;
  const blockCases=all.filter((r)=>r.expect==="block");
  const safeCases=all.filter((r)=>r.expect==="clean");
  const groups=[...new Set(stress.map((r)=>r.group))];
  outlet.innerHTML=`<div class="stress-wrap">
    <section class="stress-hero">
      <div><span class="eyebrow">Global demo readiness · private presenter tool</span><h1>Hate Stress Test</h1><p>Adversarially tests 49-language functional policy, hard blocks, meaning-faithful rewrites, indirect and cross-thread context, embedded-image text, code-switching, transliteration evasion, ambiguity-aware review and neutral counterexamples without displaying prohibited fixture text.</p></div>
      <div class="readiness-score ${passed===all.length?"pass":"fail"}"><strong>${passed}/${all.length}</strong><span>${passed===all.length?"READY":"REVIEW REQUIRED"}</span><small>automated checks</small></div>
    </section>
    <div class="stress-verdicts">${verdict("Canonical moderation + rewrite fidelity",canonical)}${verdict("Adversarial hate suite",stress)}${verdict("Multimodal evidence",media)}${verdict("No-bypass hard blocks",blockCases)}${verdict("Neutral counterexamples",safeCases)}</div>
    <section class="demo-section stress-live"><div class="sec-head compact"><span class="eyebrow">Live red-team probe</span><h2>Try any wording, spelling or language.</h2><p>The explanation separates clauses, resolves their targets and speech acts, tests what remains without profanity or a person target, then shows the abuse mechanism, context risk and action.</p></div><textarea rows="4" data-stress-input placeholder="Enter a red-team message…"></textarea><div data-stress-result></div></section>
    <section class="demo-section context-challenge"><div class="sec-head compact"><span class="eyebrow">Context challenge console</span><h2>One message. Six simultaneous contexts.</h2><p>This makes target resolution and behaviour memory inspectable instead of hiding them behind a score.</p></div><textarea rows="3" data-context-challenge-input>That champion is useless.</textarea><div data-context-challenge-result>${challengeMatrix("That champion is useless.")}</div></section>
    <section class="demo-section"><div class="sec-head compact"><span class="eyebrow">Coverage matrix</span><h2>${stress.length} presenter-safe adversarial checks</h2><p>Raw hostile fixtures stay hidden. Each row reports only the policy function and expected outcome.</p></div>
      <div class="stress-filters"><button class="active" data-stress-filter="all">All</button>${groups.map((g)=>`<button data-stress-filter="${escapeHtml(g)}">${escapeHtml(g)}</button>`).join("")}</div>
      <div class="stress-case-grid">${stress.map((item)=>`<div class="stress-case ${item.pass?"pass":"fail"}" data-stress-group="${escapeHtml(item.group)}"><span>${item.pass?"✓":"!"}</span><div><b>${escapeHtml(item.label)}</b><small>${escapeHtml(item.group)} · expected ${escapeHtml(item.expect)} · got ${escapeHtml(item.result.outcome)}</small></div></div>`).join("")}</div>
    </section>
    <div class="stress-boundary"><b>Readiness boundary</b><p>Passing this suite proves the deterministic demo policies and fixtures behave as designed. It does not prove universal real-world hate detection; production still requires maintained multilingual models, native experts, monitoring, appeals and new adversarial tests.</p></div>
  </div>`;
  const input=outlet.querySelector("[data-stress-input]");
  const result=outlet.querySelector("[data-stress-result]");
  input.addEventListener("input",()=>{ result.innerHTML=input.value.trim()?resultDetails(moderateContent(input.value)):""; });
  const challengeInput=outlet.querySelector("[data-context-challenge-input]");
  const challengeResult=outlet.querySelector("[data-context-challenge-result]");
  challengeInput.addEventListener("input",()=>{challengeResult.innerHTML=challengeInput.value.trim()?challengeMatrix(challengeInput.value):"";});
  outlet.addEventListener("click",(event)=>{ const button=event.target.closest("[data-stress-filter]"); if(!button)return; outlet.querySelectorAll("[data-stress-filter]").forEach((b)=>b.classList.toggle("active",b===button)); outlet.querySelectorAll("[data-stress-group]").forEach((row)=>{row.hidden=button.dataset.stressFilter!=="all"&&row.dataset.stressGroup!==button.dataset.stressFilter;}); });
}
