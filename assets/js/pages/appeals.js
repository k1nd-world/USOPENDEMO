import { useCurrentUser, getState, submitAppeal, markAppealDurability } from "../store.js?v=4.24.1.brand1";
import { escapeHtml, timeAgo } from "../lib/util.js";
import { toast } from "../lib/ui.js";
import { persistAppealOnServer } from "../serverEvidence.js?v=4.24.1.brand1";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.brand1";

const APPEALABLE = new Set(["warning", "block", "review_rejected", "review_required"]);

function statusCopy(status, publicMode = false) {
  return {
    pending:publicMode ? "A member of the safety team will review your context." : "A moderator will review the original context and policy evidence.",
    upheld:"The original moderation decision was upheld.",
    overturned:"The original decision was overturned and added to policy learning.",
    corrected:"The decision category was corrected and added to policy learning.",
  }[status] || status;
}

export function renderAppeals(outlet) {
  const user = useCurrentUser();
  const state = getState();
  const publicMode = isPublicExperience();
  const appeals = state.appeals.filter((item) => item.userId === user.id).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  const pendingFor = new Set(appeals.filter((item) => item.status === "pending").map((item) => item.moderationEventId));
  const events = state.moderationEvents.filter((item) => item.userId === user.id && APPEALABLE.has(item.eventType) && !pendingFor.has(item.id)).sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0,12);
  outlet.innerHTML = `<div class="appeals-wrap">
    <section class="appeals-hero"><div><span class="eyebrow">Accountability</span><h1>Appeal a moderation decision</h1><p>${publicMode ? "Tell our safety team what the first decision may have missed. Every appeal is reviewed by a person." : "Tell a moderator what the first decision missed. The original audit event stays intact; any correction creates a linked adjudication and regression-learning item."}</p></div><span class="appeal-rights-badge">Human review · recorded reasons</span></section>
    <div class="appeals-grid">
      <section class="info-card"><div class="card-eyebrow">Eligible decisions</div>${events.length ? `<form data-appeal-form><label class="field"><span>Decision</span><select name="eventId" required>${events.map((item) => `<option value="${item.id}">${escapeHtml(item.eventType.replaceAll("_"," "))} · ${escapeHtml(item.reason)} · ${timeAgo(item.createdAt)} ago</option>`).join("")}</select></label><label class="field"><span>What context should be reconsidered?</span><textarea name="statement" minlength="12" maxlength="600" rows="5" required placeholder="Explain the intended meaning, quoted context, target, language or other evidence the first decision may have missed."></textarea></label><button class="btn btn-teal" type="submit">Submit appeal</button></form>` : `<div class="adm-empty">There are no new eligible decisions on this account.</div>`}</section>
      <section class="info-card"><div class="card-eyebrow">My appeals</div><div class="appeal-history">${appeals.length ? appeals.map((item) => { const adjudication=state.adjudications.find((row)=>row.appealId===item.id); return `<article><div><span class="badge ${item.status==="pending"?"badge-review":item.status==="upheld"?"badge-warn":"badge-ok"}">${escapeHtml(item.status)}</span><small>${timeAgo(item.createdAt)} ago</small></div><p>“${escapeHtml(item.statement)}”</p><b>${escapeHtml(statusCopy(item.status, publicMode))}</b><small class="appeal-durable ${escapeHtml(item.durableStatus || "seeded")}">${publicMode ? "Appeal recorded" : item.durableStatus === "stored" ? "✓ Stored in the durable server ledger" : item.durableStatus === "unavailable" ? "Server ledger unavailable · retained locally for retry" : item.durableStatus === "pending" ? "Recording in server ledger…" : "Recorded appeal"}</small>${adjudication?`<small>${publicMode ? "Review" : "Moderator"} reason: ${escapeHtml(adjudication.notes)}</small>`:""}</article>`; }).join("") : `<div class="adm-empty">No appeals submitted yet.</div>`}</div></section>
    </div>
    <div class="appeal-boundary"><b>${publicMode ? "Your right to human review" : "Appeals are a safety control"}</b><span>${publicMode ? "A member of the safety team considers your context and records the reason for the final decision." : "They catch context errors, reveal language gaps and prevent the policy from learning directly from raw user submissions. Only adjudicated corrections enter the regression backlog."}</span></div>
  </div>`;
  outlet.querySelector("[data-appeal-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const result = submitAppeal(useCurrentUser(), data.get("eventId"), data.get("statement"));
    if (!result.ok) { toast(result.error); return; }
    try {
      await persistAppealOnServer({
        appealId:result.appeal.id, receiptId:result.appeal.receiptId,
        localEventId:result.appeal.moderationEventId, userId:result.appeal.userId,
        statement:result.appeal.statement,
      });
      markAppealDurability(result.appeal.id, "stored");
      toast(publicMode ? "Appeal submitted for human review" : "Appeal submitted and stored for human review");
    } catch (_) {
      markAppealDurability(result.appeal.id, "unavailable");
      toast(publicMode ? "Your appeal was saved; we'll retry secure delivery" : "Appeal retained locally; the durable server ledger is unavailable");
    }
  });
}
