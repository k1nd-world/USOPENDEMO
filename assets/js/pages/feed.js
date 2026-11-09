// assets/js/pages/feed.js

import {
  useCurrentUser, getState, getProfile, canComment, canPublish, isServerAuthenticated,
  addLike, removeLike, addComment, addReport, logModerationEvent,
  isFollowing, toggleFollow, getFollowerCount, profilePath, toggleRepost, getConversationEnvelope,
} from "../store.js?v=4.24.1.brand1";
import { timeAgo, escapeHtml } from "../lib/util.js";
import { heartIcon, commentIcon, flagIcon, authorBadges, toast } from "../lib/ui.js";
import { submitWithModeration } from "../lib/moderationFlow.js?v=4.24.1.brand1";
import { attachLiveSafetyGuard, getLiveGuardIncident } from "../lib/liveGuard.js?v=4.24.1.brand1";
import { openModal } from "../lib/modal.js";
import { openTrustTrail } from "../lib/trustTrail.js?v=4.24.1.brand1";
import { render as renderRoute } from "../lib/router.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.brand1";

// In-progress comment text, preserved across store-driven re-renders.
const commentDrafts = {};
const replyTargets = {};
let feedMode = "all";

export function renderFeed(outlet) {
  const user = useCurrentUser();
  const s = getState();
  const publicMode = isPublicExperience();
  const followedIds = new Set(s.follows.filter((follow) => follow.followerId === user.id).map((follow) => follow.targetId));
  const allPosts = [...s.posts].filter((p) => p.moderationStatus !== "removed").sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const posts = feedMode === "following"
    ? allPosts.filter((post) => post.authorId === user.id || followedIds.has(post.authorId))
    : allPosts;

  const signedIn = isServerAuthenticated();
  outlet.innerHTML = `
    <div class="feed-wrap ${publicMode ? "product-feed" : ""}">
      <section class="product-timeline" aria-labelledby="feed-title">
        <div class="page-head feed-page-head">
          <div><span class="eyebrow">Your community</span><h1 id="feed-title">Feed</h1>
            ${publicMode ? '<p class="feed-intro">Follow the people and sport you care about.</p>' : ""}
          </div>
          ${canPublish(user) ? '<a class="btn btn-teal feed-create" data-link href="/create">New post</a>' : ""}
        </div>
        <div class="feed-filter" role="group" aria-label="Feed filter">
          <button class="feed-filter-btn ${feedMode === "all" ? "active" : ""}" data-action="feed-mode" data-mode="all" aria-pressed="${feedMode === "all"}">Community</button>
          <button class="feed-filter-btn ${feedMode === "following" ? "active" : ""}" data-action="feed-mode" data-mode="following" aria-pressed="${feedMode === "following"}">Following</button>
        </div>
        ${!canComment(user) ? observerBanner(signedIn) : ""}
        <div class="feed">${posts.length ? posts.map((p) => renderPost(p, user, s, publicMode)).join("") : followingEmpty()}</div>
      </section>
      ${publicMode ? feedSidebar(signedIn) : ""}
    </div>`;

  attachHandlers(outlet.querySelector(".feed-wrap"), user);
}

function feedSidebar(signedIn) {
  return `
    <aside class="product-feed-aside" aria-label="Around K1ND.world">
      <section class="product-match-card">
        <div class="product-match-visual" role="presentation"></div>
        <div class="product-match-copy">
          <span class="eyebrow">Tennis</span>
          <h2>Matchday</h2>
          <p>Follow a match together and join the conversation from Centre Court.</p>
          <a class="btn btn-teal btn-sm" data-link href="/arena">Open Matchday <span aria-hidden="true">↗</span></a>
        </div>
      </section>
      <section class="product-participation">
        <span class="eyebrow">Community standards</span>
        <h2>Keep it about the sport</h2>
        <p>Posts and comments are checked before they appear.</p>
        <a href="https://k1nd.world/community-standards.html">Read the standards <span aria-hidden="true">↗</span></a>
      </section>
      <div class="product-feed-footer">
        <span>Product preview with fictional profiles and match data.</span>
        ${signedIn ? "" : '<a data-link href="/sign-in">Sign in</a>'}
        <a href="https://k1nd.world/privacy.html">Privacy</a>
        <a data-link href="/about">About K1ND.world</a>
      </div>
    </aside>`;
}

function observerBanner(signedIn) {
  return `<div class="observer-banner product-join-banner">
    <span><b>${signedIn ? "Join the conversation" : "You’re browsing as a guest"}</b><small>${signedIn ? "Verify your profile to comment." : "Sign in with a preview account. Profiles are fictional."}</small></span>
    <a class="btn btn-primary btn-sm" data-link href="${signedIn ? "/verify" : "/sign-in"}">${signedIn ? "Verify" : "Sign in"}</a>
  </div>`;
}

function followingEmpty() {
  return `<div class="activity-empty feed-empty">
    <b>Your following feed is ready</b>
    <span>Follow players, coaches and trusted voices from the community feed to build it.</span>
    <button class="btn btn-teal btn-sm" data-action="feed-mode" data-mode="all">Discover people</button>
  </div>`;
}

function renderPost(p, user, s, publicMode) {
  const a = getProfile(p.authorId) || { displayName: "Unknown", avatarUrl: "" };
  const liked = s.likes.some((l) => l.userId === user.id && l.postId === p.id);
  const likeCount = s.likes.filter((l) => l.postId === p.id).length;
  const reposted = s.reposts.some((r) => r.userId === user.id && r.postId === p.id);
  const repostCount = s.reposts.filter((r) => r.postId === p.id).length;
  const comments = s.comments
    .filter((c) => c.postId === p.id && c.moderationStatus !== "removed")
    .sort((x, y) => new Date(x.createdAt) - new Date(y.createdAt));

  return `
    <article class="post">
      <header class="post-head">
        <a class="avatar-link" data-link href="${profilePath(a)}" aria-label="View ${escapeHtml(a.displayName)}'s profile">
          <img class="avatar" src="${a.avatarUrl}" alt="">
        </a>
        <div class="col post-author-block">
          <div class="row gap-8 post-author-row">
            <a class="post-author user-link" data-link href="${profilePath(a)}">${escapeHtml(a.displayName)}</a>
            ${authorBadges(a, { hideRole: publicMode })}
            ${miniFollowButton(user, a)}
          </div>
          <span class="post-time">@${escapeHtml(a.handle || a.id)} · ${timeAgo(p.createdAt)} ago · ${escapeHtml(p.sport)}</span>
        </div>
        <div class="topbar-spacer"></div>
        ${publicMode ? "" : `<button class="trust-icon-btn" data-action="trust" data-type="post" data-id="${p.id}" title="Open K1ND.world Trust Trail">🛡</button>`}
        <button class="icon-btn" data-action="report" data-type="post" data-id="${p.id}" title="Report post">${flagIcon()}</button>
      </header>

      <div class="post-body">${escapeHtml(p.content)}</div>
      ${p.imageUrl ? `<div class="post-image"><img src="${p.imageUrl}" alt="${escapeHtml(p.imageAlt || "Tennis post image")}" loading="lazy"></div>` : ""}

      <div class="post-actions">
        <button class="act ${liked ? "act-on" : ""}" data-action="like" data-id="${p.id}" aria-pressed="${liked}">
          ${heartIcon(liked)} <span>${likeCount}</span>
        </button>
        <span class="act act-static">${commentIcon()} <span>${comments.length}</span></span>
        <button class="act ${reposted ? "act-on" : ""}" data-action="repost" data-id="${p.id}" aria-pressed="${reposted}">${repeatIcon()} <span>${repostCount}</span></button>
      </div>

      <div class="comments">
        ${comments.filter((c) => !c.parentId).map((c) => renderComment(c, comments.filter((r) => r.parentId === c.id), user, publicMode)).join("")}
        ${commentComposer(p, user, publicMode)}
      </div>
    </article>`;
}

function miniFollowButton(viewer, author) {
  if (!author?.id || viewer.id === author.id) return "";
  const following = isFollowing(viewer.id, author.id);
  const count = getFollowerCount(author.id);
  return `<button class="mini-follow ${following ? "is-following" : ""}" data-action="follow" data-user="${author.id}" title="${count.toLocaleString("en-GB")} followers" aria-pressed="${following}">
    ${following ? "Following" : "Follow"}
  </button>`;
}

function renderComment(c, replies = [], user, publicMode) {
  const a = getProfile(c.authorId) || { displayName: "Unknown", avatarUrl: "" };
  return `
    <div class="comment-thread">
      <div class="comment">
        <a class="avatar-link" data-link href="${profilePath(a)}" aria-label="View ${escapeHtml(a.displayName)}'s profile">
          <img class="avatar avatar-sm" src="${a.avatarUrl}" alt="">
        </a>
        <div class="body">
          <div class="c-top">
            <a class="c-name user-link" data-link href="${profilePath(a)}">${escapeHtml(a.displayName)}</a>
            ${authorBadges(a, { hideRole: publicMode })}
            <span class="c-time">· ${timeAgo(c.createdAt)} ago</span>
          </div>
          <div class="c-text">${escapeHtml(c.content)}</div>
          ${canComment(user) ? `<button class="reply-action" data-action="reply" data-id="${c.id}" data-post="${c.postId}" data-author="${c.authorId}">Reply</button>` : ""}
        </div>
        ${publicMode ? "" : `<button class="trust-icon-btn" data-action="trust" data-type="comment" data-id="${c.id}" title="Open K1ND.world Trust Trail">🛡</button>`}
        <button class="icon-btn" data-action="report" data-type="comment" data-id="${c.id}" title="Report comment">${flagIcon()}</button>
      </div>
      ${replies.length ? `<div class="comment-replies">${replies.map((r) => renderReply(r, user, publicMode)).join("")}</div>` : ""}
    </div>`;
}

function renderReply(c, user, publicMode) {
  const a = getProfile(c.authorId) || { displayName: "Unknown", avatarUrl: "" };
  return `<div class="comment reply-comment">
    <a class="avatar-link" data-link href="${profilePath(a)}"><img class="avatar avatar-sm" src="${a.avatarUrl}" alt=""></a>
    <div class="body"><div class="c-top"><a class="c-name user-link" data-link href="${profilePath(a)}">${escapeHtml(a.displayName)}</a>${authorBadges(a, { hideRole: publicMode })}<span class="c-time">· ${timeAgo(c.createdAt)} ago</span></div><div class="c-text">${escapeHtml(c.content)}</div></div>
    ${publicMode ? "" : `<button class="trust-icon-btn" data-action="trust" data-type="comment" data-id="${c.id}" title="Open K1ND.world Trust Trail">🛡</button>`}
  </div>`;
}

function repeatIcon() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5M19 7v4M5 17v-4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function commentComposer(p, user, publicMode) {
  if (!canComment(user)) {
    return `<div class="locked-note">🔒
      <span><a data-link href="${isServerAuthenticated() ? "/verify" : "/sign-in"}">${isServerAuthenticated() ? "Verify" : "Sign in"}</a> to comment.</span>
    </div>`;
  }
  const draft = escapeHtml(commentDrafts[p.id] || "");
  const replyTo = replyTargets[p.id] ? getProfile(replyTargets[p.id].authorId) : null;
  const envelope = getConversationEnvelope({ postId:p.id, parentId:replyTargets[p.id]?.commentId, currentAuthorId:user.id });
  const contextLabel = replyTo?.isAthlete
    ? `Athlete reply · ${envelope.conversationHistory.length} recent turns assessed`
    : replyTo
      ? `Reply context · ${envelope.conversationHistory.length} recent turns assessed`
      : `Post + conversation context · ${envelope.conversationHistory.length} recent turns assessed`;
  return `
    ${replyTo ? `<div class="replying-banner"><span>Replying to <b>@${escapeHtml(replyTo.handle || replyTo.id)}</b>${replyTo.isAthlete ? `<em>Player protection active</em>` : ""}</span><button data-action="reply-cancel" data-id="${p.id}" aria-label="Cancel reply">×</button></div>` : ""}
    <div class="comment-composer">
      <img class="avatar avatar-sm" src="${user.avatarUrl}" alt="">
      <div class="cc-input">
        <textarea data-comment-input data-id="${p.id}" rows="1" aria-label="Write a comment" placeholder="Add a comment…">${draft}</textarea>
        <div class="cc-row">
          <span class="cc-hint">${publicMode ? "Checked before it appears" : `🛡 ${escapeHtml(contextLabel)}`}</span>
          <button class="btn btn-teal btn-sm" data-action="comment" data-id="${p.id}">Comment</button>
        </div>
      </div>
    </div>`;
}

function autoGrow(ta) { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; }

function attachHandlers(root, user) {
  if (!root) return;

  // Preserve drafts, auto-grow and stop hard-block content on the keystroke
  // that would complete it. The submit gate still re-checks everything.
  root.querySelectorAll("[data-comment-input]").forEach((ta) => {
    attachLiveSafetyGuard(ta, {
      onSafeInput: (value) => {
        commentDrafts[ta.dataset.id] = value;
        autoGrow(ta);
      },
    });
    if (ta.value) autoGrow(ta);
  });

  root.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const { action, id, type } = btn.dataset;

    if (action === "feed-mode") {
      feedMode = btn.dataset.mode === "following" ? "following" : "all";
      renderRoute();
    } else if (action === "follow") {
      const target = getProfile(btn.dataset.user);
      const result = toggleFollow(user.id, btn.dataset.user);
      if (!result.ok) toast(result.error || "Unable to follow this user");
      else toast(result.following ? `Following ${target?.displayName || "user"}` : `Unfollowed ${target?.displayName || "user"}`);
    } else if (action === "like") {
      const s = getState();
      const liked = s.likes.some((l) => l.userId === user.id && l.postId === id);
      liked ? removeLike(user.id, id) : addLike(user.id, id);
    } else if (action === "repost") {
      const res = toggleRepost(user, id);
      if (!res.ok) toast(res.error || "Unable to repost");
      else toast(res.reposted ? "Reposted to your verified network" : "Repost removed");
    } else if (action === "reply") {
      replyTargets[btn.dataset.post] = { commentId: id, authorId: btn.dataset.author };
      renderRoute();
      requestAnimationFrame(() => document.querySelector(`[data-comment-input][data-id="${btn.dataset.post}"]`)?.focus());
    } else if (action === "reply-cancel") {
      delete replyTargets[id];
      renderRoute();
    } else if (action === "comment") {
      submitComment(user, id, root);
    } else if (action === "trust") {
      const state = getState();
      const item = type === "post" ? state.posts.find((x) => x.id === id) : state.comments.find((x) => x.id === id);
      if (item) openTrustTrail(item, type);
    } else if (action === "report") {
      openReport(user, type, id);
    }
  });
}

async function submitComment(user, postId, root) {
  const ta = root.querySelector(`[data-comment-input][data-id="${postId}"]`);
  const text = ta ? ta.value : commentDrafts[postId] || "";
  if (!text.trim()) return;

  const pendingParentId = replyTargets[postId]?.commentId || null;
  const moderationContext = getConversationEnvelope({ postId, parentId:pendingParentId, currentAuthorId:user.id });
  await submitWithModeration({
    user, contentType: "comment", text, postId, parentId: pendingParentId,
    moderationContext,
    guardIncident: getLiveGuardIncident(ta),
    onPublish: (finalText, meta = {}) => {
      commentDrafts[postId] = "";
      const parentId = pendingParentId;
      delete replyTargets[postId];
      const saved = addComment(user, postId, finalText, meta.status || "clean", parentId, {
        intervention:meta.intervention,
        conversationContext:meta.conversationContext || moderationContext,
        serverReceipt:meta.serverReceipt,
      }); // emits → feed re-renders
      if (!saved.ok) toast(saved.error || "The comment was not published");
    },
    onReviewSubmitted: () => {
      commentDrafts[postId] = "";
      delete replyTargets[postId];
    },
    onEditRequest: () => {
      const t = root.querySelector(`[data-comment-input][data-id="${postId}"]`);
      if (t) { t.focus(); const v = t.value; t.value = ""; t.value = v; }
    },
  });
}

const REPORT_REASONS = [
  ["Personal abuse", "btn-ghost"],
  ["Hate or discrimination", "btn-ghost"],
  ["Threat or safety concern", "btn-ghost"],
  ["Spam or off-topic", "btn-ghost"],
];

function openReport(user, targetType, targetId) {
  openModal({
    title: `Report this ${targetType}`,
    bodyHtml: `<p class="muted">Tell us what’s wrong. Reports are saved in this preview.</p>`,
    buttons: [
      ...REPORT_REASONS.map(([reason, cls]) => ({
        label: reason, class: cls,
        onClick: () => {
          addReport(user, targetType, targetId, reason);
          logModerationEvent(user.id, targetType, "(reported content)", "report", reason);
          toast("Report saved in this preview");
        },
      })),
      { label: "Cancel", class: "btn-quiet" },
    ],
  });
}
