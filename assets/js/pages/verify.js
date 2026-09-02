// assets/js/pages/verify.js

import {
  useCurrentUser, getState, getProfile, isAdmin,
  simulateVerification, setVerificationStatus,
} from "../store.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";
import { sealSvg, toast } from "../lib/ui.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.0";

// Local wizard position (0..4 = steps; 5 = outcome chooser). Not persisted.
let wizardStep = 0;

const STEPS = [
  { key: "account", label: "Account" },
  { key: "email", label: "Email" },
  { key: "mobile", label: "Mobile" },
  { key: "selfie", label: "Selfie" },
  { key: "id", label: "ID check" },
];

export function renderVerify(outlet) { paint(outlet); }

function paint(outlet) {
  const user = useCurrentUser();
  const status = user.verificationStatus;
  const publicMode = isPublicExperience();
  let body;

  if (status === "verified_adult" || status === "verified_u18") {
    wizardStep = 0; body = verifiedPanel(user, publicMode);
  } else if (status === "rejected") {
    wizardStep = 0; body = rejectedPanel(publicMode);
  } else if (status === "pending") {
    wizardStep = 0; body = pendingPanel(publicMode);
  } else {
    body = publicMode ? publicVerificationStart() : wizardPanel(user); // unverified
  }

  outlet.innerHTML = `
    <div class="verify-wrap">
      <div class="page-head"><div><span class="eyebrow">Private verification. Public confidence.</span><h1>Get verified</h1></div></div>
      ${publicMode ? "" : `<div class="verify-demo-banner">${sealSvg(15)} Demo verification journey — no real identity documents or biometrics are processed in this browser preview.</div>`}
      <div class="verification-privacy-strip">
        <div><span class="mini-kicker">What the community sees</span><b>@${escapeHtml(user.handle || user.id)} · Verified</b><span>A public verification signal — never your passport, driving licence or selfie.</span></div>
        <div><span class="mini-kicker">What stays private</span><b>Verification provider + K1ND identity layer</b><span>${publicMode ? "Only the data and references required for identity assurance, policy and accountability are retained." : "Production architecture would retain only the data and references required for identity assurance, policy and accountability."}</span></div>
      </div>
      ${body}
      ${isAdmin(user) && !publicMode ? adminOverride() : ""}
    </div>`;

  attach(outlet.querySelector(".verify-wrap"), outlet);
}

function publicVerificationStart() {
  return `<div class="result-panel">
    <div class="big-seal">${sealSvg(64)}</div>
    <span class="status-pill">Identity verification</span>
    <h2>Verify once. Participate with confidence.</h2>
    <p class="status-line">K1ND uses a specialist identity partner to confirm there is a real person behind each participating account. Your identity documents are never shown on your public profile.</p>
    <div class="result-cta"><a class="btn btn-teal" data-link href="/feed">Return to the feed</a></div>
  </div>`;
}

// ---------- wizard ----------
function stepper() {
  return `<div class="stepper">${STEPS.map((s, i) => {
    const cls = i < wizardStep || wizardStep >= STEPS.length ? "done" : i === wizardStep ? "active" : "";
    const inner = (i < wizardStep || wizardStep >= STEPS.length) ? "✓" : String(i + 1);
    return `<div class="vstep ${cls}"><div class="num">${inner}</div><div class="lbl">${s.label}</div></div>`;
  }).join("")}</div>`;
}

function wizardPanel(user) {
  const step = wizardStep;
  let card;

  if (step === 0) {
    card = `
      <span class="step-eyebrow">Step 1 of 5</span>
      <h2>Create account / sign in</h2>
      <p class="step-desc">You're signed in as a demo user. In production this is your real K1ND account.</p>
      <div class="fake-field"><span>${escapeHtml(user.displayName)}</span><span class="tag">demo account</span></div>
      <div class="step-actions"><button class="btn btn-teal" data-next>Continue</button></div>`;
  } else if (step === 1) {
    card = `
      <span class="step-eyebrow">Step 2 of 5</span>
      <h2>Confirm email</h2>
      <p class="step-desc">We've sent a 6-digit code to your email (simulated).</p>
      <div class="fake-field"><span>demo@k1nd.world</span><span class="tag">placeholder</span></div>
      <div class="fake-field"><span>Code: 1 2 3 4 5 6</span><span class="tag">pre-filled</span></div>
      <div class="step-actions"><button class="btn btn-teal" data-next>Confirm email</button></div>`;
  } else if (step === 2) {
    card = `
      <span class="step-eyebrow">Step 3 of 5</span>
      <h2>Confirm mobile number</h2>
      <p class="step-desc">We've sent an SMS code to your phone (simulated).</p>
      <div class="fake-field"><span>+44 •••• ••8842</span><span class="tag">placeholder</span></div>
      <div class="fake-field"><span>Code: 0 4 9 1</span><span class="tag">pre-filled</span></div>
      <div class="step-actions"><button class="btn btn-teal" data-next>Confirm mobile</button></div>`;
  } else if (step === 3) {
    card = `
      <span class="step-eyebrow">Step 4 of 5</span>
      <h2>Selfie / human check</h2>
      <p class="step-desc">A quick liveness check confirms there's a real person behind the account (simulated).</p>
      <div class="selfie-sim">📷 &nbsp;Liveness capture (simulated)</div>
      <div class="step-actions"><button class="btn btn-teal" data-next>Capture selfie</button></div>`;
  } else if (step === 4) {
    card = `
      <span class="step-eyebrow">Step 5 of 5</span>
      <h2>ID + biometric provider</h2>
      <p class="step-desc">In the intended production flow, a specialist identity provider matches government ID to the liveness check and returns a verification decision.</p>
      <div class="provider-note">🔌 Integration seam — a production provider such as <b>Veriff / Sumsub / Persona</b> would run this step. Sensitive ID material would not be displayed on the public K1ND profile.</div>
      <div class="step-actions"><button class="btn btn-teal" data-next>Run ID check</button></div>`;
  } else {
    // outcome chooser (simulated result)
    card = `
      <span class="step-eyebrow">Result</span>
      <h2>Choose a simulated outcome</h2>
      <p class="step-desc">A real provider returns one of these automatically. For the demo, pick one to see each state.</p>
      <div class="outcome-grid">
        <button class="outcome-btn" data-outcome="verified_adult"><b>✓ Verified Adult</b><span>Full participation (18+)</span></button>
        <button class="outcome-btn" data-outcome="verified_u18"><b>✓ Verified U18</b><span>Restricted, youth-safe access</span></button>
        <button class="outcome-btn" data-outcome="pending"><b>⏳ Needs manual review</b><span>Sent to the admin queue</span></button>
        <button class="outcome-btn" data-outcome="rejected"><b>✕ Rejected</b><span>Could not verify identity</span></button>
      </div>`;
  }

  return `${stepper()}<div class="step-card">${card}</div>`;
}

// ---------- result panels ----------
function verifiedPanel(user, publicMode) {
  const u18 = user.verificationStatus === "verified_u18";
  return `
    <div class="result-panel">
      <div class="big-seal">${sealSvg(64)}</div>
      <span class="status-pill ok">${sealSvg(14)} ${u18 ? "Verified U18" : "Verified Adult"}</span>
      <h2>You're verified${u18 ? " (youth-safe)" : ""}</h2>
      <p class="status-line">
        ${u18
          ? `You have restricted, youth-safe access. You can comment; posting stays limited${publicMode ? "." : " and parental-safety controls are represented in the demo."}`
          : "There's now a real, verified identity behind your voice. You can comment, and posting opens by invitation to trusted members."}
      </p>
      <div class="result-cta">
        <a class="btn btn-teal" data-link href="/feed">Go to the feed</a>
        <a class="btn btn-ghost" data-link href="/profile">View profile</a>
        ${publicMode ? "" : `<button class="btn btn-quiet" data-reset>Reset (re-run demo)</button>`}
      </div>
    </div>`;
}

function pendingPanel(publicMode) {
  return `
    <div class="result-panel pending">
      <div class="big-seal">${sealSvg(64)}</div>
      <span class="status-pill warn">⏳ Needs manual review</span>
      <h2>Your verification is under review</h2>
      <p class="status-line">A moderator will review your submission. In the meantime you can browse and like, but not yet comment or post.</p>
      <div class="result-cta">
        <a class="btn btn-ghost" data-link href="/feed">Browse the feed</a>
        ${publicMode ? "" : `<button class="btn btn-quiet" data-reset>Reset (re-run demo)</button>`}
      </div>
    </div>`;
}

function rejectedPanel(publicMode) {
  return `
    <div class="result-panel rejected">
      <div class="big-seal">${sealSvg(64)}</div>
      <span class="status-pill bad">✕ Rejected</span>
      <h2>We couldn't verify your identity</h2>
      <p class="status-line">Your submission didn't pass the ${publicMode ? "identity checks" : "(simulated) checks"}. You can try again with clearer details.</p>
      <div class="result-cta">
        ${publicMode ? `<a class="btn btn-teal" data-link href="/appeals">Get help</a>` : `<button class="btn btn-teal" data-reset>Try again</button>`}
        <a class="btn btn-ghost" data-link href="/feed">Browse the feed</a>
      </div>
    </div>`;
}

// ---------- admin override ----------
function adminOverride() {
  const s = getState();
  const opts = s.profiles.map((p) => `<option value="${p.id}">${escapeHtml(p.displayName)} — ${p.verificationStatus}</option>`).join("");
  return `
    <div class="admin-flip">
      <div class="af-head">🛠 Admin override — manually set a user's status (demo)</div>
      <select data-admin-target>${opts}</select>
      <div class="af-btns">
        <button class="btn btn-ghost btn-sm" data-admin-status="verified_adult">Verified Adult</button>
        <button class="btn btn-ghost btn-sm" data-admin-status="verified_u18">Verified U18</button>
        <button class="btn btn-ghost btn-sm" data-admin-status="pending">Manual review</button>
        <button class="btn btn-ghost btn-sm" data-admin-status="rejected">Reject</button>
        <button class="btn btn-quiet btn-sm" data-admin-status="unverified">Unverify</button>
      </div>
    </div>`;
}

// ---------- handlers ----------
function attach(root, outlet) {
  if (!root) return;
  root.addEventListener("click", (e) => {
    const user = useCurrentUser();

    if (e.target.closest("[data-next]")) { wizardStep += 1; paint(outlet); return; }

    const outcomeBtn = e.target.closest("[data-outcome]");
    if (outcomeBtn) {
      const status = outcomeBtn.dataset.outcome;
      simulateVerification(user.id, status); // store update → global re-render → paint()
      toast(labelFor(status));
      return;
    }

    if (e.target.closest("[data-reset]")) {
      simulateVerification(user.id, "unverified");
      wizardStep = 0;
      return;
    }

    const adminBtn = e.target.closest("[data-admin-status]");
    if (adminBtn) {
      const target = root.querySelector("[data-admin-target]").value;
      const res = setVerificationStatus(user, target, adminBtn.dataset.status);
      toast(res.ok ? "Status updated" : (res.error || "Failed"));
      return;
    }
  });
}

function labelFor(status) {
  return {
    verified_adult: "Verified as an adult",
    verified_u18: "Verified as U18",
    pending: "Sent to manual review",
    rejected: "Verification rejected",
    unverified: "Reset to unverified",
  }[status] || "Updated";
}
