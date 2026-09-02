// assets/js/lib/moderationFlow.js
// The pre-publication gate. Both the comment composer and post composer route
// through here BEFORE anything is written to the public store.

import { moderateContent } from "../moderation.js?v=4.24.1.0";
import { logModerationEvent, submitForEnhancedReview, getBehaviourProfile } from "../store.js?v=4.24.1.0";
import { openModal } from "./modal.js";
import { sealSvg, toast } from "./ui.js";
import { escapeHtml } from "./util.js";
import { enforceOnServer, commitPublicationOnServer } from "../serverEvidence.js?v=4.24.1.0";


function auditTextForBlockedAttempt(text, category) {
  if (category === "slur" || category === "severe_abuse" || category === "racist_symbol" || category === "discriminatory") {
    return "[prohibited hate content withheld from routine dashboard display]";
  }
  if (category === "personal_contact" || category === "doxxing") {
    return "[personal contact or location information withheld from routine dashboard display]";
  }
  return text;
}

// submitWithModeration({
//   user, contentType, text, postId?, imageUrl?, imageAlt?, photoKey?, imageAnalysis?,
//   onPublish, onEditRequest?, onReviewSubmitted?
// })
//
// IMPORTANT: warning/review originals never call onPublish. A user must use a
// safer rewrite, edit the content, cancel, or submit it to enhanced moderation.
export async function submitWithModeration({
  user, contentType, text, postId, parentId, sport, imageUrl, imageAlt, photoKey, imageAnalysis, guardIncident,
  moderationContext,
  onPublish, onEditRequest, onReviewSubmitted,
}) {
  const trimmed = (text || "").trim();
  if (!trimmed) return;
  const publicationMetadata = contentType === "post"
    ? { sport:sport || "tennis", imageUrl, imageAlt, photoKey }
    : { postId, parentId:parentId || null };

  // TODO (production): replace this local rule engine with the trust-and-safety
  // API while preserving the { outcome, category, reason, rewriteSuggestion }
  // contract. Image analysis will likewise come from OCR + visual classifiers,
  // manipulation checks, known-harm hashes and caption/context assessment.
  let result = moderateContent(trimmed, moderationContext || {});
  let enforcement = null;

  const eventContext = () => {
    const assessment = result.analysis?.contextAssessment;
    const conversation = assessment ? {
      postId:postId || null,
      parentId:parentId || null,
      outcome:result.outcome,
      category:result.category,
      targetUserId:assessment.targetAudience?.profileId || moderationContext?.replyTarget?.id || moderationContext?.postAuthor?.id || null,
      targetRole:assessment.targetAudience?.role || "participant role unknown",
      targetIsAthlete:!!assessment.targetAudience?.athlete,
      targetIsU18:!!assessment.targetAudience?.under18,
      speechAct:assessment.speechAct,
      targetScope:assessment.targetScope,
      riskBand:assessment.riskBand,
      riskScore:assessment.riskScore,
      turnsConsidered:assessment.conversation?.historyTurns || 0,
      cumulativeSignals:assessment.conversation?.recentTargetedInterventions || 0,
    } : { postId:postId || null, parentId:parentId || null, outcome:result.outcome, category:result.category };
    conversation.sport = sport || publicationMetadata.sport || null;
    const withMedia = imageAnalysis ? {
      ...conversation,
      mediaOutcome:imageAnalysis.outcome,
      mediaCategory:imageAnalysis.category,
      ocrConfidence:imageAnalysis.ocr?.confidence || 0,
      mediaEvidenceHash:imageAnalysis.sha256 || null,
    } : conversation;
    return enforcement ? {
      ...withMedia,
      serverReceipt:{ id:enforcement.receiptId, signature:enforcement.signature, policyVersion:enforcement.policyVersion, durable:enforcement.durable, publicationId:enforcement.publicationId || null },
    } : withMedia;
  };

  // If the live guard stopped a prohibited completion and the untouched
  // fragment is now being submitted, it must not fall through as clean. This
  // preserves the intervention even for short stems that would be unsafe to
  // classify as abusive in every context on their own.
  if (result.outcome === "clean" && guardIncident) {
    result = {
      outcome: "warning",
      category: "stopped_prohibited_completion",
      reason: "A prohibited term was stopped before completion",
      rewriteSuggestion: undefined,
      rewrite: {
        status:"needs_author_point", preservedPoint:"None detected", removed:"Potential prohibited hateful language",
        rationale:"The stopped draft contains no clear sporting point. K1ND will not invent one; state the real point in your own words.",
      },
    };
  }

  // A text-clean post with media that needs investigation is still held. The
  // whole post moves together so an unsafe image can never ride through behind
  // a clean caption.
  if (imageAnalysis?.outcome === "block") {
    result = {
      outcome:"block",
      category:imageAnalysis.category || "media_safety",
      reason:imageAnalysis.reason || "Prohibited content was found in the image",
      rewrite:{ status:"media_block", preservedPoint:"None validated", removed:"Prohibited media evidence", rationale:"K1ND does not rewrite or reproduce prohibited content found inside an image." },
      analysis:result.analysis,
    };
  } else if (result.outcome !== "block" && imageAnalysis?.outcome === "review") {
    result = {
      outcome: "review",
      category: "image_context",
      reason: imageAnalysis.reason || "Image or embedded text requires enhanced moderation",
      rewriteSuggestion: result.rewriteSuggestion,
      rewrite: result.rewrite,
    };
  }

  // The browser decision is advisory. Publication proceeds only after the
  // independent server policy records a signed, durable enforcement receipt.
  try {
    enforcement = await enforceOnServer({
      userId:user.id, contentType, text:trimmed,
      clientDecision:{ outcome:result.outcome, category:result.category, reason:result.reason },
      mediaSha256:imageAnalysis?.sha256 || null, photoKey,
      context:eventContext(),
    });
    const priorOutcome = result.outcome;
    result = { ...result, outcome:enforcement.outcome, category:enforcement.category, reason:enforcement.reason, serverEnforcement:enforcement };
    if (enforcement.outcome === "block" && priorOutcome !== "block") {
      result = {
        ...result, rewriteSuggestion:undefined, safeDraftSuggestion:undefined,
        rewrite:{ status:"server_hard_block", preservedPoint:"None validated", removed:"Server-enforced prohibited content", rationale:"The independent server policy hard-blocked this original. K1ND will not create a bypass draft." },
      };
    }
  } catch (error) {
    result = {
      ...result, outcome:"review", category:"server_enforcement_unavailable",
      reason:"The server enforcement boundary is unavailable, so publication is held rather than trusted to the browser",
      rewriteSuggestion:undefined,
      rewrite:{ status:"server_required", suggestion:undefined, rationale:String(error?.message || error) },
    };
  }

  const enforceCandidate = async (candidate) => {
    try {
      const clientDecision = moderateContent(candidate, moderationContext || {});
      const receipt = await enforceOnServer({
        userId:user.id, contentType, text:candidate,
        clientDecision:{ outcome:clientDecision.outcome, category:clientDecision.category, reason:clientDecision.reason },
        mediaSha256:imageAnalysis?.sha256 || null, photoKey, context:eventContext(),
      });
      if (receipt.outcome !== "clean") { toast("The server did not clear that draft for publication"); return null; }
      const publication = await commitPublicationOnServer({
        userId:user.id, contentType, text:candidate,
        receiptId:receipt.receiptId, signature:receipt.signature,
        metadata:{ ...publicationMetadata, moderationStatus:"rewritten" },
      });
      return { ...receipt, publicationId:publication.publicationId, publicationAuthorized:publication.authorized, publicationRecord:publication.content };
    } catch (_) {
      toast("Server confirmation is required before publication"); return null;
    }
  };

  const serverProof = enforcement?.receiptId ? `<div class="server-receipt-proof">
    <span class="seal">${sealSvg(14)} Server-enforced</span>
    <div><b>Signed durable receipt</b><code>${escapeHtml(enforcement.receiptId.slice(0, 20))}…</code></div>
    <small>${escapeHtml(enforcement.policyVersion)} · ${enforcement.tamperDetected ? "browser/server mismatch overridden" : "browser decision independently verified"}</small>
  </div>` : `<div class="server-receipt-proof unavailable"><b>Publication boundary unavailable</b><small>No signed receipt was issued, so this content cannot enter the public feed.</small></div>`;

  if (result.outcome === "clean") {
    try {
      const publication = await commitPublicationOnServer({
        userId:user.id, contentType, text:trimmed,
        receiptId:enforcement.receiptId, signature:enforcement.signature,
        metadata:{ ...publicationMetadata, moderationStatus:"clean" },
      });
      enforcement = { ...enforcement, publicationId:publication.publicationId, publicationAuthorized:publication.authorized, publicationRecord:publication.content };
    } catch (error) {
      result = {
        ...result, outcome:"review", category:"publication_commit_unavailable",
        reason:"The signed moderation decision could not be committed to the server publication ledger, so the content is held",
        rewriteSuggestion:undefined,
        rewrite:{ status:"server_required", rationale:String(error?.message || error) },
      };
    }
  }

  if (result.outcome === "clean") {
    logModerationEvent(user.id, contentType, trimmed, "clean", result.reason, eventContext());
    if (imageAnalysis) {
      logModerationEvent(user.id, contentType, `[image:${photoKey || "uploaded"}]`, "image_scan_clean", imageAnalysis.reason, eventContext());
    }
    onPublish(trimmed, { status: "clean", intervention: result, conversationContext:moderationContext, serverReceipt:enforcement });
    return;
  }

  if (result.outcome === "block") {
    logModerationEvent(user.id, contentType, auditTextForBlockedAttempt(trimmed, result.category), "block", result.reason, eventContext());
    const safeDraft = result.safeDraftSuggestion || "";
    const safeDraftCard = safeDraft ? `<div class="mod-transform blocked-transform">
      <div class="mod-original"><span class="mod-mini-label">Original</span><p>Blocked — cannot be published</p></div>
      <div class="mod-arrow" aria-hidden="true">→</div>
      <div class="mod-rewrite"><span class="seal">${sealSvg(14)} Source-backed new draft</span><p>${escapeHtml(safeDraft)}</p>
        <div class="rewrite-proof"><span><b>Point kept</b>${escapeHtml(result.rewrite?.preservedPoint || "Source-backed non-abusive proposition")}</span><span><b>Removed</b>${escapeHtml(result.rewrite?.removed || "Prohibited material")}</span>${result.rewrite?.sourceBasis ? `<span><b>Source basis</b>${escapeHtml(result.rewrite.sourceBasis)}</span>` : ""}<span><b>Safety</b>Validated as a separate clean submission</span></div>
      </div></div>` : `<div class="no-rewrite-card"><span class="seal">${sealSvg(14)} No rewrite invented</span><b>No separable safe point was found.</b><p>${escapeHtml(result.rewrite?.rationale || "The author must write a new, non-prohibited post in their own words.")}</p></div>`;
    const mediaEvidence = imageAnalysis ? `<div class="modal-media-evidence"><span class="mini-kicker">Media evidence</span><div><b>${escapeHtml(imageAnalysis.ocr?.text ? (imageAnalysis.category === "slur" ? "[prohibited embedded text withheld]" : imageAnalysis.ocr.text) : "No readable embedded text")}</b><small>${imageAnalysis.ocr?.confidence ? `${Math.round(imageAnalysis.ocr.confidence * 100)}% OCR confidence · ` : ""}${escapeHtml(imageAnalysis.ocr?.engine || "evidence service")}</small></div><p>${escapeHtml(imageAnalysis.productionBoundary || "")}</p></div>` : "";
    openModal({
      tone: "block",
      title: "This cannot be posted on K1ND.",
      bodyHtml: `<p class="muted">Flagged as <strong>${escapeHtml(result.reason.toLowerCase())}</strong>.
        The original is blocked before publication and cannot be bypassed or sent live.</p>${serverProof}${mediaEvidence}${safeDraftCard}${safeDraft ? `<p class="muted mod-choice-copy">The clean draft is a separate composition based only on the recoverable point. It has passed K1ND's rules and can be used, edited or ignored.</p>` : ""}`,
      buttons: [
        ...(safeDraft ? [{ label:"Use validated new draft", class:"btn-teal", onClick:async () => {
          const draftCheck = moderateContent(safeDraft, moderationContext || {});
          if (draftCheck.outcome !== "clean") { toast("That new draft still needs editing"); return false; }
          const receipt = await enforceCandidate(safeDraft);
          if (!receipt) return false;
          logModerationEvent(user.id, contentType, safeDraft, "rewrite_accepted", "User accepted source-backed draft after original hard block", eventContext());
          onPublish(safeDraft, { status:"rewritten_after_block", intervention:result, conversationContext:moderationContext, serverReceipt:receipt });
          toast("Published the separately validated K1ND draft");
        } }] : []),
        { label:"Rewrite yourself", class:"btn-ghost", onClick:() => { if (onEditRequest) onEditRequest(); } },
        { label: "Understood", class: "btn-primary" },
      ],
    });
    return;
  }

  const initiallyReview = result.outcome === "review";
  logModerationEvent(
    user.id,
    contentType,
    trimmed,
    initiallyReview ? "review_required" : "warning",
    result.reason,
    eventContext()
  );

  const behaviour = getBehaviourProfile(user.id);
  // Repeated harmful attempts create progressively stronger friction. On the
  // third intervention in a reset demo session, borderline originals move to
  // mandatory enhanced review. Clean criticism is never penalised by this.
  const behaviourEscalated = !initiallyReview && behaviour.stage === "mandatory_review";
  const isReview = initiallyReview || behaviourEscalated;
  if (behaviourEscalated) {
    result = { ...result, category: "repeat_behaviour", reason: "Repeated harmful attempts triggered enhanced safeguards" };
  }

  const rewrite = result.rewriteSuggestion || "";
  const rewriteOptions = Array.isArray(result.rewrite?.options) && result.rewrite.options.length
    ? result.rewrite.options.filter((option) => option.validatedClean)
    : (rewrite ? [{ id:"direct", label:"Direct", suggestion:rewrite, stance:"Source-backed rewrite", validatedClean:true }] : []);
  const clauseProof = Array.isArray(result.rewrite?.clauses) ? `<div class="rewrite-clause-map"><span class="mini-kicker">Clause-level decision</span>${result.rewrite.clauses.map((clause) => `<div class="${escapeHtml(clause.role)}"><b>${escapeHtml(clause.role)}</b><span>${escapeHtml(clause.text)}</span><small>${escapeHtml(clause.reason)}</small></div>`).join("")}</div>` : "";
  const rewriteCard = rewrite ? `
    <div class="mod-transform">
      <div class="mod-original">
        <span class="mod-mini-label">Original</span>
        <p>${escapeHtml(trimmed)}</p>
      </div>
      <div class="mod-arrow" aria-hidden="true">→</div>
      <div class="mod-rewrite">
        <span class="seal">${sealSvg(14)} Source-backed rewrite</span>
        <p>${escapeHtml(rewrite)}</p>
        ${result.rewrite?.preservedPoint ? `<div class="rewrite-proof"><span><b>Point kept</b>${escapeHtml(result.rewrite.preservedPoint)}</span><span><b>Removed</b>${escapeHtml(result.rewrite.removed)}</span>${result.rewrite.sourceBasis ? `<span><b>Source basis</b>${escapeHtml(result.rewrite.sourceBasis)}</span>` : ""}${result.rewrite.evaluation?.score != null ? `<span><b>Meaning fidelity</b>${result.rewrite.evaluation.score}/100 · ${escapeHtml(result.rewrite.evaluation.status.replaceAll("_", " "))}</span>` : ""}</div>` : ""}
        ${rewriteOptions.length > 1 ? `<div class="rewrite-options"><span class="mini-kicker">Choose the voice—not a generic replacement</span>${rewriteOptions.map((option) => `<div><b>${escapeHtml(option.label)}</b><span>${escapeHtml(option.suggestion)}</span><small>${escapeHtml(option.stance)} · safety re-checked${option.evaluation?.score!=null?` · fidelity ${option.evaluation.score}/100`:""}</small></div>`).join("")}</div>` : ""}
        ${clauseProof}
      </div>
    </div>` : (["needs_author_point", "fidelity_not_proven"].includes(result.rewrite?.status) ? `<div class="no-rewrite-card"><span class="seal">${sealSvg(14)} No rewrite invented</span><b>${result.rewrite?.status === "fidelity_not_proven" ? "A safe-sounding replacement was rejected because its meaning was not proven." : "No genuine point was found to preserve."}</b><p>${escapeHtml(result.rewrite.rationale)}</p></div>` : "");

  const submitReview = () => {
    const res = submitForEnhancedReview(user, {
      contentType, text: trimmed, postId, parentId, imageUrl, imageAlt, photoKey,
      imageAnalysis, reason: result.reason, category: result.category,
      contextEvidence:eventContext(),
    });
    if (!res.ok) {
      toast(res.error || "Could not submit for review");
      return false;
    }
    toast("Sent to enhanced moderation — not published");
    if (onReviewSubmitted) onReviewSubmitted(res.review);
  };

  openModal({
    tone: isReview ? "review" : "warn",
    title: isReview ? "Enhanced moderation is required" : "This cannot be posted as written",
    bodyHtml: `
      <div class="mod-detection-head">
        <span class="mod-detection-chip">${isReview ? "HELD" : "INTERVENTION"}</span>
        <div><b>${escapeHtml(result.reason)}</b><span>${escapeHtml(result.category || "safety_check").replaceAll("_", " ")}</span></div>
      </div>
      <p>${isReview
        ? `This original will remain hidden unless a moderator approves it.`
        : `K1ND found wording that targets a person rather than the sporting point. The original cannot be published immediately.`}</p>
      ${behaviour.count ? `<div class="behaviour-friction ${behaviour.stage}"><b>${escapeHtml(behaviour.label)}</b><span>${escapeHtml(behaviour.message)} · ${behaviour.count} intervention${behaviour.count === 1 ? "" : "s"} this demo session.</span></div>` : ""}
      ${result.analysis?.contextAssessment ? `<div class="moderation-context-proof">
        <span class="mini-kicker">Conversation intelligence</span>
        <div><b>${escapeHtml(result.analysis.contextAssessment.targetAudience?.role || result.analysis.targetType)}</b><span>${escapeHtml(result.analysis.contextAssessment.targetScope)} · ${escapeHtml(result.analysis.contextAssessment.speechAct)}</span></div>
        <div><b>${escapeHtml(result.analysis.contextAssessment.riskBand)} · ${result.analysis.contextAssessment.riskScore}/100</b><span>${result.analysis.contextAssessment.conversation?.historyTurns || 0} recent turn${result.analysis.contextAssessment.conversation?.historyTurns === 1 ? "" : "s"} assessed</span></div>
      </div>` : ""}
      ${imageAnalysis ? `<div class="modal-media-evidence"><span class="mini-kicker">Media evidence</span><div><b>${escapeHtml(imageAnalysis.ocr?.text || "No readable embedded text")}</b><small>${imageAnalysis.ocr?.confidence ? `${Math.round(imageAnalysis.ocr.confidence * 100)}% OCR confidence · ` : ""}${escapeHtml(imageAnalysis.ocr?.engine || "evidence service")}</small></div><p>${escapeHtml(imageAnalysis.productionBoundary || "")}</p></div>` : ""}
      ${serverProof}
      ${rewriteCard}
      <p class="muted mod-choice-copy">${isReview && behaviourEscalated
        ? `Because this account has triggered repeated interventions, the original must go to enhanced moderation. Reset Demo Mode to clear the simulated behaviour history.`
        : rewrite ? `Use the source-backed rewrite, edit it yourself, cancel, or send the original to enhanced moderation.` : `State the real sporting or discussion point yourself, cancel, or send the original to enhanced moderation.`}</p>`,
    buttons: [
      ...((rewrite && !behaviourEscalated) ? rewriteOptions.slice(0,2).map((option, index) => ({
        label: rewriteOptions.length > 1 ? `Use ${option.label.toLowerCase()} rewrite` : "Use accurate rewrite", class: index === 0 ? "btn-teal" : "btn-ghost",
        onClick: async () => {
          const rewriteCheck = moderateContent(option.suggestion, moderationContext || {});
          if (rewriteCheck.outcome !== "clean") {
            toast("That rewrite still needs editing or review");
            return false;
          }
          const receipt = await enforceCandidate(option.suggestion);
          if (!receipt) return false;
          logModerationEvent(user.id, contentType, option.suggestion, "rewrite_accepted", `User accepted ${option.id} source-backed rewrite`, eventContext());
          onPublish(option.suggestion, { status: "rewritten", intervention: result, conversationContext:moderationContext, serverReceipt:receipt });
          toast(`Published the ${option.label.toLowerCase()} K1ND rewrite`);
        },
      })) : []),
      { label: "Rewrite yourself", class: "btn-ghost", onClick: () => { if (onEditRequest) onEditRequest(); } },
      { label: "Cancel", class: "btn-quiet" },
      { label: behaviourEscalated ? "Send to mandatory review" : "Send for enhanced moderation", class: "btn-primary", onClick: submitReview },
    ],
  });
}
