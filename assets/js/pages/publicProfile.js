// assets/js/pages/publicProfile.js — shareable public profiles for every user.

import {
  useCurrentUser, getState, getProfile, getProfileByHandle, profilePath, isFollowing, getFollowerCount,
  getFollowingCount, getFollowers, getFollowing, toggleFollow,
  addLike, removeLike,
} from "../store.js?v=4.24.1.0";
import { escapeHtml, timeAgo, fmtDate, fmtCount } from "../lib/util.js";
import { authorBadges, heartIcon, commentIcon, toast } from "../lib/ui.js";
import { render as renderRoute } from "../lib/router.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.0";

const activeTabs = new Map();

export function renderPublicProfile(outlet, params = {}) {
  const profileKey = params.id;
  const state = getState();
  const profile = getProfile(profileKey) || getProfileByHandle(profileKey);
  const viewer = useCurrentUser();
  const publicMode = isPublicExperience();

  if (!profile) {
    outlet.innerHTML = `
      <div class="card card-pad stack profile-not-found">
        <span class="eyebrow">Profile unavailable</span>
        <h1>We couldn't find that user</h1>
        <p class="muted">The profile may have been removed or the link may be incorrect.</p>
        <div><a class="btn btn-teal" data-link href="/feed">Return to the feed</a></div>
      </div>`;
    return;
  }

  const posts = state.posts
    .filter((post) => post.authorId === profile.id && post.moderationStatus !== "removed")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const replies = state.comments
    .filter((comment) => comment.authorId === profile.id && comment.moderationStatus !== "removed")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const tab = activeTabs.get(profile.id) || "posts";
  const ownProfile = viewer.id === profile.id;

  outlet.innerHTML = `
    <div class="public-profile-wrap" data-profile-id="${escapeHtml(profile.id)}">
      <div class="public-profile-cover ${profile.isAthlete ? "athlete-cover-variant" : ""}"></div>
      <section class="public-profile-header">
        <img class="avatar public-profile-avatar" src="${profile.avatarUrl}" alt="${escapeHtml(profile.displayName)}">
        <div class="public-profile-actions">
          ${ownProfile
            ? `<a class="btn btn-ghost" data-link href="/profile">Manage my profile</a>`
            : followButton(viewer, profile)}
        </div>
        <div class="public-profile-name-row">
          <h1>${escapeHtml(profile.displayName)}</h1>
          ${authorBadges(profile, { hideRole: publicMode })}
        </div>
        <div class="public-profile-handle">@${escapeHtml(profile.handle || profile.id)}</div>
        <p class="public-profile-bio">${escapeHtml(profile.bio || "K1ND community member.")}</p>
        <div class="public-profile-meta">
          ${profile.location ? `<span>⌖ ${escapeHtml(profile.location)}</span>` : ""}
          ${profile.favouriteSport ? `<span>◉ ${escapeHtml(profile.favouriteSport)}</span>` : ""}
          <span>Joined ${fmtDate(profile.createdAt)}</span>
          ${profile.isAthlete && !publicMode ? `<span class="fictional-tag">Fictional demo athlete</span>` : ""}
        </div>
        <div class="public-profile-counts">
          <button class="count-link" data-profile-tab="followers"><b data-follower-count>${fmtCount(getFollowerCount(profile.id))}</b> followers</button>
          <button class="count-link" data-profile-tab="following"><b>${fmtCount(getFollowingCount(profile.id))}</b> following</button>
          <span><b>${posts.length}</b> posts</span>
        </div>
      </section>

      <nav class="profile-tabs" aria-label="Profile sections">
        ${tabButton("posts", "Posts", posts.length, tab)}
        ${tabButton("replies", "Replies", replies.length, tab)}
        ${tabButton("about", "About", null, tab)}
      </nav>

      <section class="public-profile-content" data-profile-content>
        ${renderTab(tab, profile, viewer, state, posts, replies, publicMode)}
      </section>
    </div>`;

  attachProfileHandlers(outlet.querySelector(".public-profile-wrap"), profile, viewer);
}

function tabButton(id, label, count, active) {
  return `<button class="profile-tab ${active === id ? "active" : ""}" data-profile-tab="${id}">
    ${label}${count == null ? "" : ` <span>${count}</span>`}
  </button>`;
}

function followButton(viewer, profile) {
  const following = isFollowing(viewer.id, profile.id);
  return following
    ? `<button class="btn btn-ghost btn-follow-on" data-follow-user="${profile.id}">
         <span class="lbl-following">Following ✓</span><span class="lbl-unfollow">Unfollow</span>
       </button>`
    : `<button class="btn btn-teal" data-follow-user="${profile.id}">Follow</button>`;
}

function renderTab(tab, profile, viewer, state, posts, replies, publicMode) {
  if (tab === "replies") return renderReplies(replies, state);
  if (tab === "about") return renderAbout(profile, state, publicMode);
  if (tab === "followers") return renderPeopleList("Followers", getFollowers(profile.id), publicMode);
  if (tab === "following") return renderPeopleList("Following", getFollowing(profile.id), publicMode);
  return renderPosts(posts, viewer, state);
}

function renderPosts(posts, viewer, state) {
  if (!posts.length) return emptyState("No posts yet", "This user hasn't published a post.");
  return `<div class="profile-post-list">${posts.map((post) => {
    const liked = state.likes.some((like) => like.userId === viewer.id && like.postId === post.id);
    const likeCount = state.likes.filter((like) => like.postId === post.id).length;
    const commentCount = state.comments.filter((comment) => comment.postId === post.id && comment.moderationStatus !== "removed").length;
    return `<article class="post profile-post">
      <div class="post-time">${timeAgo(post.createdAt)} ago · ${escapeHtml(post.sport || "sport")}</div>
      <div class="post-body">${escapeHtml(post.content)}</div>
      ${post.imageUrl ? `<div class="post-image"><img src="${post.imageUrl}" alt="${escapeHtml(post.imageAlt || "Post image")}" loading="lazy"></div>` : ""}
      <div class="post-actions">
        <button class="act ${liked ? "act-on" : ""}" data-profile-like="${post.id}" aria-pressed="${liked}">${heartIcon(liked)} <span>${likeCount}</span></button>
        <a class="act" data-link href="/feed">${commentIcon()} <span>${commentCount}</span></a>
      </div>
    </article>`;
  }).join("")}</div>`;
}

function renderReplies(replies, state) {
  if (!replies.length) return emptyState("No replies yet", "This user hasn't joined a public conversation.");
  return `<div class="profile-reply-list">${replies.map((reply) => {
    const post = state.posts.find((item) => item.id === reply.postId);
    const postAuthor = post ? getProfile(post.authorId) : null;
    return `<article class="profile-reply-card">
      <div class="post-time">Replying on ${postAuthor ? `<a data-link href="${profilePath(postAuthor)}">${escapeHtml(postAuthor.displayName)}</a>` : "a post"} · ${timeAgo(reply.createdAt)} ago</div>
      <div class="profile-reply-text">${escapeHtml(reply.content)}</div>
      ${post ? `<div class="quoted-post">${escapeHtml(post.content)}</div>` : ""}
      <a class="text-link" data-link href="/feed">View conversation →</a>
    </article>`;
  }).join("")}</div>`;
}

function renderAbout(profile, state, publicMode) {
  const authoredComments = state.comments.filter((comment) => comment.authorId === profile.id && comment.moderationStatus !== "removed").length;
  const likesReceived = state.posts
    .filter((post) => post.authorId === profile.id)
    .reduce((total, post) => total + state.likes.filter((like) => like.postId === post.id).length, 0);
  return `<div class="profile-about-grid">
    <div class="info-card">
      <div class="card-eyebrow">About</div>
      <p>${escapeHtml(profile.bio || "K1ND community member.")}</p>
      <div class="kvline"><span class="k">Public handle</span><span class="v">@${escapeHtml(profile.handle || profile.id)}</span></div>
      <div class="kvline"><span class="k">Favourite sport</span><span class="v">${escapeHtml(profile.favouriteSport || "Sport")}</span></div>
      <div class="kvline"><span class="k">Location</span><span class="v">${escapeHtml(profile.location || "Not shared")}</span></div>
    </div>
    <div class="info-card">
      <div class="card-eyebrow">Community activity</div>
      <div class="metric-grid compact-metrics">
        <div class="metric accent"><b>${state.posts.filter((post) => post.authorId === profile.id && post.moderationStatus !== "removed").length}</b><span>Posts</span></div>
        <div class="metric"><b>${authoredComments}</b><span>Replies</span></div>
        <div class="metric accent"><b>${likesReceived}</b><span>Likes received</span></div>
        <div class="metric"><b>${publicMode ? fmtCount(getFollowerCount(profile.id)) : profile.trustScore || 0}</b><span>${publicMode ? "Followers" : "Trust score"}</span></div>
      </div>
    </div>
  </div>`;
}

function renderPeopleList(title, people, publicMode) {
  return `<div class="people-panel">
    <div class="card-eyebrow">${title}</div>
    ${people.length ? people.map((person) => `
      <a class="person-row" data-link href="${profilePath(person)}">
        <img class="avatar" src="${person.avatarUrl}" alt="">
        <span class="person-copy"><b>${escapeHtml(person.displayName)}</b><small>@${escapeHtml(person.handle || person.id)}</small></span>
        <span class="person-badges">${authorBadges(person, { hideRole: publicMode })}</span>
      </a>`).join("") : `<div class="activity-empty">No ${title.toLowerCase()} to show yet.</div>`}
  </div>`;
}

function emptyState(title, text) {
  return `<div class="activity-empty profile-empty"><b>${title}</b><span>${text}</span></div>`;
}

function attachProfileHandlers(root, profile, viewer) {
  if (!root) return;
  root.addEventListener("click", (event) => {
    const follow = event.target.closest("[data-follow-user]");
    if (follow) {
      const result = toggleFollow(viewer.id, follow.dataset.followUser);
      if (!result.ok) toast(result.error || "Unable to follow this user");
      else toast(result.following ? `Following ${profile.displayName}` : `Unfollowed ${profile.displayName}`);
      return;
    }

    const like = event.target.closest("[data-profile-like]");
    if (like) {
      const postId = like.dataset.profileLike;
      const state = getState();
      const liked = state.likes.some((item) => item.userId === viewer.id && item.postId === postId);
      liked ? removeLike(viewer.id, postId) : addLike(viewer.id, postId);
      return;
    }

    const tab = event.target.closest("[data-profile-tab]");
    if (tab) {
      activeTabs.set(profile.id, tab.dataset.profileTab);
      renderRoute();
    }
  });
}
