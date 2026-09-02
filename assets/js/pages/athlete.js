// assets/js/pages/athlete.js

import {
  useCurrentUser, getState, getProfile, addLike, removeLike,
  isFollowing, getFollowerCount, toggleFollow, profilePath,
} from "../store.js?v=4.24.1.0";
import { escapeHtml, timeAgo, fmtCount } from "../lib/util.js";
import { sealSvg, heartIcon, commentIcon, authorBadges, toast } from "../lib/ui.js";

const ATHLETE_ID = "u_athlete";

export function renderAthlete(outlet) {
  const user = useCurrentUser();
  const s = getState();
  const a = getProfile(ATHLETE_ID);
  if (!a) { outlet.innerHTML = `<p class="muted">Athlete not found.</p>`; return; }

  const posts = s.posts
    .filter((p) => p.authorId === ATHLETE_ID)
    .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt));

  // Platform-wide protection stats (the shield around athletes).
  const blocks = s.moderationEvents.filter((m) => m.eventType === "block").length;
  const warnings = s.moderationEvents.filter((m) => m.eventType === "warning").length;
  const rewrites = s.moderationEvents.filter((m) => m.eventType === "rewrite_accepted").length;

  outlet.innerHTML = `
    <div class="athlete-wrap">
      <div class="athlete-cover"></div>
      <div class="athlete-head">
        <img class="avatar avatar-lg" src="${a.avatarUrl}" alt="">
        <div class="row gap-8 wrap" style="margin-top:8px">
          <span class="fictional-tag">Fictional demo athlete</span>
        </div>
        <h1>${escapeHtml(a.displayName)}</h1>
        <div class="row gap-8 wrap">
          ${authorBadges(a)}
          <span class="badge badge-teal">${sealSvg(12)} Verified identity</span>
        </div>
        <p class="athlete-bio">
          Left-handed baseline grinder chasing a first Slam. Known for marathon three-setters and
          a ferocious return. <em>A fictional athlete created for the K1ND demo — not a real person.</em>
        </p>
        <div class="athlete-stats">
          <div class="s"><b data-follower-count>${getFollowerCount(ATHLETE_ID).toLocaleString("en-US")}</b><span>Followers</span></div>
          <div class="s"><b>#7</b><span>Career-high rank*</span></div>
          <div class="s"><b>12</b><span>Titles*</span></div>
          <div class="s"><b>68%</b><span>Win rate*</span></div>
        </div>
        <div class="athlete-actions">
          ${followButton(user)}
          <a class="btn btn-ghost" data-link href="${profilePath(a)}">Open full profile</a>
          <a class="btn btn-ghost" data-link href="/feed">See the feed</a>
        </div>
        <p class="profile-demo-note" style="margin-top:10px">* Fictional statistics for demonstration only.</p>
      </div>

      <div class="protect-panel">
        <div class="ph">${sealSvg(18)} Protected by K1ND</div>
        <p class="muted" style="margin-top:6px;font-size:.9rem">Athletes take abuse alone and in real time. On K1ND, harmful messages are stopped before they ever reach a player.</p>
        <div class="pstats">
          <div class="s"><b>${blocks}</b><span>Abusive messages hard-blocked</span></div>
          <div class="s"><b>${warnings}</b><span>Warnings shown pre-post</span></div>
          <div class="s"><b>${rewrites}</b><span>Rewritten into safer messages</span></div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-eyebrow">Posts from ${escapeHtml(a.displayName)}</div>
        <div class="feed" style="margin-top:8px">
          ${posts.map((p) => athletePost(p, user, s)).join("") || `<div class="activity-empty">No posts yet.</div>`}
        </div>
      </div>
    </div>`;

  attach(outlet.querySelector(".athlete-wrap"), user);
}

function athletePost(p, user, s) {
  const liked = s.likes.some((l) => l.userId === user.id && l.postId === p.id);
  const likeCount = s.likes.filter((l) => l.postId === p.id).length;
  const commentCount = s.comments.filter((c) => c.postId === p.id).length;
  return `
    <article class="post" style="margin-bottom:12px">
      <div class="post-body" style="margin-top:0">${escapeHtml(p.content)}</div>
      <div class="post-actions">
        <button class="act ${liked ? "act-on" : ""}" data-like="${p.id}">${heartIcon(liked)} <span>${likeCount}</span></button>
        <span class="act act-static">${commentIcon()} <span>${commentCount}</span></span>
        <span class="post-time" style="margin-left:auto">${timeAgo(p.createdAt)} ago</span>
      </div>
    </article>`;
}

function followButton(user) {
  const following = isFollowing(user.id, ATHLETE_ID);
  return following
    ? `<button class="btn btn-ghost btn-follow-on" data-follow>
         <span class="lbl-following">Following ✓</span><span class="lbl-unfollow">Unfollow</span>
       </button>`
    : `<button class="btn btn-teal" data-follow>Follow</button>`;
}

function attach(root, user) {
  if (!root) return;
  root.addEventListener("click", (e) => {
    const likeBtn = e.target.closest("[data-like]");
    if (likeBtn) {
      const id = likeBtn.dataset.like;
      const s = getState();
      const liked = s.likes.some((l) => l.userId === user.id && l.postId === id);
      liked ? removeLike(user.id, id) : addLike(user.id, id);
      return;
    }
    if (e.target.closest("[data-follow]")) {
      const res = toggleFollow(user.id, ATHLETE_ID); // emits → re-render updates button + count
      toast(res.following ? `Following ${getProfile(ATHLETE_ID).displayName}` : "Unfollowed");
    }
  });
}
