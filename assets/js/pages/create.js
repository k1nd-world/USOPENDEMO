// assets/js/pages/create.js

import { useCurrentUser, canPublish, canComment, addPost } from "../store.js?v=4.24.1.0";
import { submitWithModeration } from "../lib/moderationFlow.js?v=4.24.1.0";
import { attachLiveSafetyGuard, getLiveGuardIncident } from "../lib/liveGuard.js?v=4.24.1.0";
import { toast, sealSvg } from "../lib/ui.js";
import { escapeHtml } from "../lib/util.js";
import { navigate } from "../lib/router.js";
import { DEMO_PHOTOS, PHOTO_KEYS, PHOTO_LABELS, PHOTO_ALTS, analysePhoto } from "../lib/photos.js";
import { analyseUploadedMedia } from "../mediaIntelligence.js?v=4.24.1.0";

let postDraft = "";
let postPhoto = null;
let postSport = "tennis";
let uploadedMedia = null;
const SPORTS = ["tennis", "football", "rugby", "cricket", "motorsport", "athletics", "basketball"];

export function renderCreate(outlet) {
  const user = useCurrentUser();

  let inner;
  if (canPublish(user)) inner = fullComposer(user);
  else if (canComment(user)) inner = inviteOnlyState();   // verified, not approved to post
  else inner = observerState();                            // observer / unverified

  outlet.innerHTML = `
    <div class="create-wrap">
      <div class="page-head"><div><span class="eyebrow">Compose</span><h1>Create a post</h1></div></div>
      ${inner}
    </div>`;

  if (canPublish(user)) attachComposer(outlet.querySelector(".create-wrap"), user);
  else attachSecondary(outlet.querySelector(".create-wrap"));
}

function attachSecondary(root) {
  if (!root) return;
  const req = root.querySelector("[data-request-access]");
  if (req) req.addEventListener("click", () => toast("Request noted — thanks!"));
}

function fullComposer(user) {
  return `
    <div class="composer-card composer">
      <div class="composer-id">
        <img class="avatar" src="${user.avatarUrl}" alt="">
        <div class="col">
          <div class="row gap-8"><b>${escapeHtml(user.displayName)}</b>
            <span class="seal">${sealSvg(13)} Verified</span>
            <span class="badge badge-teal" style="font-size:.68rem;padding:1px 7px">Trusted poster</span>
          </div>
          <span class="muted" style="font-size:.82rem">Posting to the K1ND sport feed</span>
        </div>
      </div>
      <div class="composer-meta-row"><label>Sport <select data-post-sport>${SPORTS.map((sp) => `<option value="${sp}" ${postSport === sp ? "selected" : ""}>${sp[0].toUpperCase()+sp.slice(1)}</option>`).join("")}</select></label><span class="badge badge-teal">Chronological feed</span></div>
      <textarea data-post-input placeholder="Share something about the match, athlete or moment…">${escapeHtml(postDraft)}</textarea>
      <div class="composer-photos">
        <span class="cp-label">${photoIcon()} Add a photo</span>
        <div class="cp-thumbs">
          ${PHOTO_KEYS.map((k) => `<button type="button" class="cp-thumb ${postPhoto === k ? "sel" : ""}" data-photo="${k}" title="${PHOTO_LABELS[k]}"><img src="${DEMO_PHOTOS[k]}" alt="${PHOTO_ALTS[k]}"></button>`).join("")}
        </div>
        <label class="composer-upload">${photoIcon()} Upload your own image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-photo-upload></label>
        <div class="composer-upload-preview" data-upload-preview></div>
        <span class="cp-safety">Uploaded images receive on-device OCR, Apple Vision classification, caption fusion and a durable server verdict before publication.</span>
      </div>
      <div class="composer-foot">
        <span class="hint">${sealSvg(13)} Think before you post. Every post is checked before it goes live</span>
        <button class="btn btn-teal" data-post-submit>Publish</button>
      </div>
    </div>`;
}

function photoIcon() {
  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.7" style="vertical-align:-2px"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="10" r="1.5"/><path d="M21 16l-5-5-9 8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function inviteOnlyState() {
  return `
    <div class="locked-state">
      <span class="lock-badge">🔒 Invite-only</span>
      <h2>You're verified — posting is next</h2>
      <p>You are verified. Posting access is currently invite-only for trusted launch users.
        You can already comment on any post in the feed.</p>
      <div class="row gap-12 wrap" style="margin-top:18px">
        <button class="btn btn-ghost" data-request-access>Request posting access</button>
        <a class="btn btn-teal" data-link href="/feed">Go to the feed</a>
      </div>
      <div class="locked-preview">Your post composer will appear here once posting is unlocked.</div>
    </div>`;
}

function observerState() {
  return `
    <div class="locked-state">
      <span class="lock-badge">🔒 Locked</span>
      <h2>Create is locked for observers</h2>
      <p>Observers can browse and like. Become verified to comment and unlock participation.</p>
      <div class="row gap-12 wrap" style="margin-top:18px">
        <a class="btn btn-teal" data-link href="/verify">Become verified</a>
        <a class="btn btn-ghost" data-link href="/feed">Back to the feed</a>
      </div>
      <div class="locked-preview">The post composer unlocks for trusted, verified members.</div>
    </div>`;
}

function attachComposer(root, user) {
  if (!root) return;
  const ta = root.querySelector("[data-post-input]");
  const btn = root.querySelector("[data-post-submit]");
  const sportSel = root.querySelector("[data-post-sport]");
  if (sportSel) sportSel.addEventListener("change", () => { postSport = sportSel.value; });
  if (ta) {
    attachLiveSafetyGuard(ta, {
      onSafeInput: (value) => { postDraft = value; },
    });
  }

  root.querySelectorAll("[data-photo]").forEach((th) => {
    th.addEventListener("click", () => {
      const k = th.dataset.photo;
      if (postPhoto === k) { postPhoto = null; th.classList.remove("sel"); }
      else {
        postPhoto = k;
        uploadedMedia = null;
        const input = root.querySelector("[data-photo-upload]");
        if (input) input.value = "";
        const preview = root.querySelector("[data-upload-preview]");
        if (preview) preview.innerHTML = "";
        root.querySelectorAll(".cp-thumb").forEach((x) => x.classList.remove("sel"));
        th.classList.add("sel");
      }
    });
  });

  const uploadInput = root.querySelector("[data-photo-upload]");
  const uploadPreview = root.querySelector("[data-upload-preview]");
  uploadInput?.addEventListener("change", async () => {
    const file = uploadInput.files?.[0];
    if (!file) { uploadedMedia = null; uploadPreview.innerHTML = ""; return; }
    if (file.size > 1.5 * 1024 * 1024) { toast("Choose an image smaller than 1.5 MB."); uploadInput.value = ""; return; }
    postPhoto = null;
    root.querySelectorAll(".cp-thumb").forEach((item) => item.classList.remove("sel"));
    const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
    uploadedMedia = { file, dataUrl, name:file.name };
    uploadPreview.innerHTML = `<img src="${dataUrl}" alt="Uploaded preview"><span><b>${escapeHtml(file.name)}</b><small>Ready for local evidence analysis</small></span>`;
  });

  if (btn) btn.addEventListener("click", async () => {
    const text = ta ? ta.value : postDraft;
    if (!text.trim() && !postPhoto && !uploadedMedia) { toast("Write something or add a photo first"); return; }
    const selectedPhoto = postPhoto;
    const caption = text.trim() || "📷";
    btn.disabled = true;
    btn.textContent = uploadedMedia ? "Checking image…" : "Publish";
    const selectedUpload = uploadedMedia;
    const imageAnalysis = selectedUpload ? await analyseUploadedMedia(selectedUpload.file, caption) : analysePhoto(selectedPhoto, caption);
    btn.disabled = false;
    btn.textContent = "Publish";
    await submitWithModeration({
      user, contentType: "post", text: caption, sport:postSport,
      imageUrl: selectedUpload?.dataUrl || (selectedPhoto ? DEMO_PHOTOS[selectedPhoto] : undefined),
      imageAlt: selectedUpload ? `User uploaded image: ${selectedUpload.name}` : (selectedPhoto ? PHOTO_ALTS[selectedPhoto] : undefined),
      photoKey: selectedPhoto,
      imageAnalysis,
      guardIncident: getLiveGuardIncident(ta),
      onPublish: (finalText, meta = {}) => {
        const saved = addPost(user, finalText, {
          sport: postSport,
          moderationStatus: meta.status || "clean",
          imageUrl: selectedUpload?.dataUrl || (selectedPhoto ? DEMO_PHOTOS[selectedPhoto] : undefined),
          imageAlt: selectedUpload ? `User uploaded image: ${selectedUpload.name}` : (selectedPhoto ? PHOTO_ALTS[selectedPhoto] : undefined),
          photoKey: selectedPhoto,
          imageAnalysis,
          intervention:meta.intervention,
          serverReceipt:meta.serverReceipt,
        });
        if (!saved.ok) { toast(saved.error || "The post was not published"); return; }
        postDraft = ""; postPhoto = null; postSport = "tennis"; uploadedMedia = null;
        toast("Posted to the feed");
        navigate("/feed");
      },
      onEditRequest: () => { if (ta) ta.focus(); },
      onReviewSubmitted: () => {
        postDraft = ""; postPhoto = null; postSport = "tennis"; uploadedMedia = null;
        navigate("/feed");
      },
    });
  });
}
