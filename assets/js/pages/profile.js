// assets/js/pages/profile.js

import {
  useCurrentUser, getState, canComment, canPublish, isAdmin, profilePath, updateProfile, isServerAuthenticated,
} from "../store.js?v=4.24.1.brand1";
import { escapeHtml, timeAgo, fmtDate } from "../lib/util.js";
import { sealSvg, authorBadges, toast } from "../lib/ui.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.brand1";

function userMetrics(userId, s) {
  const ev = s.moderationEvents.filter((m) => m.userId === userId);
  return {
    posts: s.posts.filter((p) => p.authorId === userId).length,
    comments: s.comments.filter((c) => c.authorId === userId).length,
    likesGiven: s.likes.filter((l) => l.userId === userId).length,
    clean: ev.filter((m) => m.eventType === "clean").length,
    warnings: ev.filter((m) => m.eventType === "warning").length,
    rewrites: ev.filter((m) => m.eventType === "rewrite_accepted").length,
    blocks: ev.filter((m) => m.eventType === "block").length,
    reportsMade: s.reports.filter((r) => r.reporterId === userId).length,
  };
}

function trustRing(score, size = 108) {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, score)) / 100);
  const cx = size / 2;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-label="Trust score ${score}">
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--line)" stroke-width="10"/>
    <circle cx="${cx}" cy="${cx}" r="${r}" fill="none" stroke="var(--teal)" stroke-width="10" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
      transform="rotate(-90 ${cx} ${cx})"/>
    <text x="50%" y="47%" text-anchor="middle" font-family="var(--font-mono)" font-size="${size * 0.26}" font-weight="700" fill="var(--ink)">${score}</text>
    <text x="50%" y="63%" text-anchor="middle" font-size="10" fill="var(--muted)">/ 100</text>
  </svg>`;
}

function statusPill(status) {
  const map = {
    verified_adult: ["ok", "Verified Adult"],
    verified_u18: ["warn", "Verified U18"],
    pending: ["warn", "Needs manual review"],
    rejected: ["bad", "Rejected"],
    unverified: ["", "Unverified"],
  };
  const [cls, label] = map[status] || ["", status];
  return `<span class="status-pill ${cls}">${cls === "ok" ? sealSvg(14) : ""} ${label}</span>`;
}

export function renderProfile(outlet) {
  if (!isServerAuthenticated()) {
    outlet.innerHTML = `<section class="product-access-card">
      <span class="eyebrow">Your account</span><h1>Profile</h1>
      <p>Sign in to edit your profile, see your activity and manage verification.</p>
      <a class="btn btn-teal" data-link href="/sign-in">Sign in</a>
    </section>`;
    return;
  }
  const user = useCurrentUser();
  const s = getState();
  const publicMode = isPublicExperience();
  const m = userMetrics(user.id, s);
  const lastV = [...s.verificationEvents].reverse().find((v) => v.userId === user.id);

  const myPosts = s.posts.filter((p) => p.authorId === user.id).map((p) => ({ type: "Post", text: p.content, at: p.createdAt }));
  const myComments = s.comments.filter((c) => c.authorId === user.id).map((c) => ({ type: "Comment", text: c.content, at: c.createdAt }));
  const activity = [...myPosts, ...myComments].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);

  outlet.innerHTML = `
    <div class="profile-wrap">
      <div class="page-head"><div><span class="eyebrow">Profile</span><h1 style="display:none">Profile</h1></div></div>

      <div class="profile-header">
        <img class="avatar avatar-lg" src="${user.avatarUrl}" alt="">
        <div class="who">
          <div class="row gap-8 wrap">${statusPill(user.verificationStatus)}</div>
          <h1>${escapeHtml(user.displayName)}</h1>
          <div class="row gap-8 wrap">
            ${publicMode ? "" : authorBadges(user)}
            ${publicMode ? "" : `<span class="badge">${escapeHtml(user.role)}</span>`}
            <span class="badge">member since ${fmtDate(user.createdAt)}</span>
          </div>
          ${publicMode ? "" : `<div class="profile-demo-note">🔒 Demo verification status — no real identity is stored.</div>`}
        </div>
        <div class="row gap-8 wrap">
          <a class="btn btn-ghost" data-link href="${profilePath(user)}">View public profile</a>
          <a class="btn btn-ghost" data-link href="/verify">Manage verification</a>
          <a class="btn btn-ghost" data-link href="/appeals">Appeal decisions</a>
        </div>
      </div>

      <div class="info-card profile-edit-card">
        <div class="profile-edit-head">
          <div>
            <div class="card-eyebrow">Public profile details</div>
            <p class="muted">These details appear on your public K1ND.world profile. Your handle and verification status remain fixed.</p>
          </div>
          <button class="btn btn-ghost btn-sm" type="button" data-profile-edit-toggle>Edit profile</button>
        </div>
        <form class="profile-edit-form" data-profile-edit-form hidden>
          <div class="form-grid two-col">
            <label class="field"><span>Display name</span><input name="displayName" maxlength="40" required value="${escapeHtml(user.displayName)}"></label>
            <label class="field"><span>Public handle</span><input value="@${escapeHtml(user.handle || user.id)}" disabled aria-label="Public handle"></label>
          </div>
          <label class="field"><span>Bio</span><textarea name="bio" maxlength="180" rows="3" placeholder="Tell the community about yourself">${escapeHtml(user.bio || "")}</textarea><small><span data-bio-count>${(user.bio || "").length}</span>/180</small></label>
          <div class="form-grid two-col">
            <label class="field"><span>Location</span><input name="location" maxlength="50" value="${escapeHtml(user.location || "")}"></label>
            <label class="field"><span>Favourite sport</span><input name="favouriteSport" maxlength="30" value="${escapeHtml(user.favouriteSport || "")}"></label>
          </div>
          <div class="profile-edit-actions">
            <span class="muted">Profile text is checked before it is saved.</span>
            <button class="btn btn-teal" type="submit">Save profile</button>
          </div>
        </form>
      </div>

      <div class="profile-grid ${publicMode ? "public-profile-mode" : ""}">
        <div class="info-card">
          <div class="card-eyebrow">${publicMode ? "Account access" : "Verification &amp; access"}</div>
          <div class="kvline"><span class="k">Status</span><span class="v">${prettyStatus(user.verificationStatus)}</span></div>
          ${publicMode ? "" : `<div class="kvline"><span class="k">Provider</span><span class="v">${lastV ? "Simulated" : "—"}</span></div>`}
          ${publicMode ? "" : `<div class="kvline"><span class="k">Reference</span><span class="v mono">${lastV ? escapeHtml(lastV.referenceId) : "—"}</span></div>`}
          <div class="kvline"><span class="k">Can comment</span><span class="v">${yn(canComment(user))}</span></div>
          <div class="kvline"><span class="k">Can publish posts</span><span class="v">${yn(canPublish(user))}</span></div>
          ${publicMode ? "" : `<div class="kvline"><span class="k">Admin access</span><span class="v">${yn(isAdmin(user))}</span></div>`}
        </div>

        ${publicMode ? "" : `<div class="info-card">
          <div class="card-eyebrow">Trust score</div>
          <div class="trust-block">
            ${trustRing(user.trustScore)}
            <div class="desc">Built from verified status and a clean participation history. Warnings and blocks lower it; constructive posting raises it.</div>
          </div>
        </div>`}
      </div>

      <div class="info-card" style="margin-top:16px">
        <div class="card-eyebrow">Participation metrics</div>
        <div class="metric-grid">
          <div class="metric accent"><b>${m.posts}</b><span>Posts published</span></div>
          <div class="metric accent"><b>${m.comments}</b><span>Comments made</span></div>
          <div class="metric"><b>${m.likesGiven}</b><span>Likes given</span></div>
          ${publicMode ? "" : `<div class="metric"><b>${m.clean}</b><span>Clean messages</span></div>`}
          ${publicMode ? "" : `<div class="metric warnc"><b>${m.warnings}</b><span>Warnings received</span></div>`}
          ${publicMode ? "" : `<div class="metric accent"><b>${m.rewrites}</b><span>Safer rewrites accepted</span></div>`}
          ${publicMode ? "" : `<div class="metric blockc"><b>${m.blocks}</b><span>Hard-blocked attempts</span></div>`}
          <div class="metric"><b>${m.reportsMade}</b><span>Reports made</span></div>
        </div>
      </div>

      <div class="info-card" style="margin-top:16px">
        <div class="card-eyebrow">Recent activity</div>
        <div class="activity-list">
          ${activity.length
            ? activity.map((a) => `
              <div class="activity-item">
                <div class="meta">${a.type} · ${timeAgo(a.at)} ago</div>
                <div class="txt">${escapeHtml(a.text)}</div>
              </div>`).join("")
            : `<div class="activity-empty">No posts or comments yet. ${canComment(user) ? "Join the conversation on the feed." : "Get verified to participate."}</div>`}
        </div>
      </div>
    </div>`;

  attachProfileEdit(outlet, user);
}

function attachProfileEdit(outlet, user) {
  const toggle = outlet.querySelector("[data-profile-edit-toggle]");
  const form = outlet.querySelector("[data-profile-edit-form]");
  if (!toggle || !form) return;

  toggle.addEventListener("click", () => {
    form.hidden = !form.hidden;
    toggle.textContent = form.hidden ? "Edit profile" : "Cancel editing";
    if (!form.hidden) form.querySelector('[name="displayName"]')?.focus();
  });

  const bio = form.querySelector('[name="bio"]');
  const count = form.querySelector("[data-bio-count]");
  bio?.addEventListener("input", () => { if (count) count.textContent = String(bio.value.length); });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const result = updateProfile(user.id, {
      displayName: data.get("displayName"),
      bio: data.get("bio"),
      location: data.get("location"),
      favouriteSport: data.get("favouriteSport"),
    });
    if (!result.ok) {
      toast(result.error || "Unable to save profile");
      return;
    }
    toast("Profile updated");
  });
}

function yn(v) { return v ? `<span class="badge badge-ok">yes</span>` : `<span class="badge">no</span>`; }
function prettyStatus(s) {
  return { verified_adult: "Verified Adult", verified_u18: "Verified U18", pending: "Needs manual review", rejected: "Rejected", unverified: "Unverified" }[s] || s;
}
