import { getProfile } from "../store.js?v=4.24.1.0";
import { openModal } from "./modal.js";
import { escapeHtml } from "./util.js";
import { sealSvg } from "./ui.js";

function trailStep(icon, title, text, tone = "ok") {
  return `<div class="trust-step ${tone}"><div class="trust-step-icon">${icon}</div><div><b>${title}</b><span>${text}</span></div></div>`;
}

export function openTrustTrail(item, kind = "content") {
  const author = getProfile(item?.authorId);
  const verified = author && (author.verificationStatus === "verified_adult" || author.verificationStatus === "verified_u18" || author.role === "admin");
  const status = item?.moderationStatus || "clean";
  const intervention = ["rewritten", "approved_after_review"].includes(status);
  const context = item?.moderationEvidence;

  const steps = [
    trailStep(sealSvg(16), verified ? "Verified human" : "Observer identity", verified
      ? "A private verification status sits behind this public account. ID documents are not shown to other users."
      : "Observers can browse and like but cannot publish comments."),
    trailStep("◎", "Pre-publication safety check", "Text was checked before it could enter the public feed."),
  ];

  if (status === "rewritten") {
    steps.push(trailStep("↻", "Intervention accepted", "The original wording triggered friction and a safer rewrite was published instead.", "warn"));
  } else if (status === "approved_after_review") {
    steps.push(trailStep("◫", "Enhanced moderation decision", "The original remained hidden until an authorised moderator approved publication.", "warn"));
  } else {
    steps.push(trailStep("✓", "No harmful wording detected", "The opinion passed the pre-publication gate without intervention."));
  }

  if (context) {
    steps.push(trailStep("◎", "Conversation-aware decision", `${escapeHtml(context.targetRole || "Participant")} · ${escapeHtml(context.targetScope || "conversation target")} · ${Number(context.turnsConsidered || 0)} recent turn${Number(context.turnsConsidered || 0) === 1 ? "" : "s"} assessed · ${escapeHtml(context.riskBand || "low")} risk.`, context.riskBand === "high" || context.riskBand === "critical" ? "warn" : "ok"));
  }

  if (context?.serverReceipt?.id) {
    steps.push(trailStep(sealSvg(16), "Signed server receipt", `${escapeHtml(context.serverReceipt.policyVersion || "server policy")} · receipt ${escapeHtml(context.serverReceipt.id.slice(0, 20))}… · ${context.serverReceipt.publicationId ? `publication ${escapeHtml(context.serverReceipt.publicationId.slice(0, 18))}… authorized` : context.serverReceipt.durable ? "stored in the durable evidence ledger" : "durability unconfirmed"}.`));
  }

  steps.push(trailStep("●", "Published with accountability", "The public sees the account and verification seal; the accountability layer remains private."));

  openModal({
    title: "K1ND Trust Trail",
    bodyHtml: `
      <div class="trust-trail-head">
        <span class="seal">${sealSvg(14)} Accountability by design</span>
        <p>This is the audit story for this ${escapeHtml(kind)}. It shows why the content was allowed to become visible.</p>
      </div>
      <div class="trust-trail">${steps.join("")}</div>
      <div class="trust-privacy-split">
        <div><span class="mini-kicker">Public</span><b>@${escapeHtml(author?.handle || "account")} · Verified</b><p>Display identity, content and public trust signals.</p></div>
        <div><span class="mini-kicker">Private</span><b>Verification reference + moderation trail</b><p>Production architecture keeps sensitive verification data away from the public profile.</p></div>
      </div>
      ${intervention ? `<div class="trust-callout">The important point: the user was not silenced. Harmful wording was changed or reviewed before publication.</div>` : ""}
    `,
    buttons: [{ label: "Close", class: "btn-teal" }],
  });
}
