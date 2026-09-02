import { analyseMediaUrl, analyseUploadedMedia, runMediaEvidenceTests } from "../mediaIntelligence.js?v=4.24.1.0";
import { escapeHtml } from "../lib/util.js";

const CHALLENGES = [
  { id:"clean", label:"Sporting criticism", expected:"clean", caption:"Match analysis card", src:"/assets/images/media-challenges/clean-text.png" },
  { id:"warning", label:"Personal attack", expected:"warning", caption:"What do you think?", src:"/assets/images/media-challenges/warning-text.png" },
  { id:"threat", label:"Targeted threat", expected:"block", caption:"Message for the player", src:"/assets/images/media-challenges/threat-text.png" },
];

function resultCard(result, expected = null) {
  const ocr = result.ocr || {};
  const confidence = ocr.confidence ? `${Math.round(ocr.confidence * 100)}%` : "not available";
  const match = expected ? result.outcome === expected : null;
  const visual = result.visualClassifier || {};
  const topVisual = (visual.classifications || []).slice(0,3).map((item) => `${item.label} ${Math.round(item.confidence * 100)}%`).join(" · ") || visual.reason || "No classification evidence";
  return `<article class="media-result ${escapeHtml(result.outcome)}">
    <div class="media-result-head"><span class="badge">${escapeHtml(result.outcome)}</span><div><b>${escapeHtml(result.reason)}</b>${expected ? `<small>${match ? "✓ Expected outcome" : `Expected ${escapeHtml(expected)}`}</small>` : ""}</div></div>
    <div class="media-evidence-grid">
      <div><span>Caption</span><b>${escapeHtml(result.captionDecision?.outcome || "not checked")}</b><small>${escapeHtml(result.captionDecision?.reason || "")}</small></div>
      <div><span>Embedded text</span><b>${escapeHtml(result.embeddedTextDecision?.outcome || "not checked")}</b><small>${escapeHtml(result.embeddedTextDecision?.reason || "")}</small></div>
      <div><span>Combined meaning</span><b>${escapeHtml(result.fusedDecision?.outcome || "not checked")}</b><small>${escapeHtml(result.fusedDecision?.reason || "")}</small></div>
      <div><span>OCR confidence</span><b>${confidence}</b><small>${escapeHtml(ocr.engine || "unavailable")}</small></div>
      <div><span>Visual classifier</span><b>${escapeHtml(visual.status || "unavailable")}</b><small>${escapeHtml(topVisual)}</small></div>
      <div><span>Server media verdict</span><b>${escapeHtml(result.serverMediaDecision?.outcome || "not supplied")}</b><small>${escapeHtml(result.serverMediaDecision?.reason || "")}</small></div>
    </div>
    <div class="ocr-transcript"><span class="mini-kicker">Text read from image</span><p>${ocr.text ? escapeHtml(ocr.text) : "No readable text detected"}</p></div>
    <div class="media-boundary"><b>Coverage boundary</b><span>${escapeHtml(result.productionBoundary || "")}</span></div>
  </article>`;
}

export function renderMediaLab(outlet) {
  const unit = runMediaEvidenceTests();
  const passed = unit.filter((test) => test.pass).length;
  outlet.innerHTML = `<div class="media-lab-wrap">
    <section class="media-lab-hero">
      <div><span class="eyebrow">V4.19.0 · Visual safety ensemble</span><h1>See what the image says—and what it shows.</h1><p>K1ND runs on-device OCR and Apple Vision classification, assesses caption and image evidence separately, and reports the readiness of known-harm, specialist-symbol and forensic provider hooks. Uploads are deleted immediately after analysis; evidence hashes and decisions persist.</p></div>
      <div class="media-readiness"><strong>${passed}/${unit.length}</strong><span>evidence checks passing</span><small>deterministic fixture suite</small></div>
    </section>
    <section class="demo-section"><div class="sec-head compact"><span class="eyebrow">Live on-device OCR + visual classification</span><h2>Run a safe, intervention or block challenge.</h2><p>Each card is an actual PNG. The result comes from Apple Vision evidence and the independent server policy used by the composer.</p></div>
      <div class="media-challenge-grid">${CHALLENGES.map((item) => `<button data-media-challenge="${item.id}"><img src="${item.src}" alt="${escapeHtml(item.label)} challenge card"><span><b>${escapeHtml(item.label)}</b><small>Expected: ${escapeHtml(item.expected)}</small></span></button>`).join("")}</div>
      <div class="media-run-actions"><button class="btn btn-teal" data-run-all-media>Run all three</button><label class="btn btn-ghost media-upload-label">Analyse your image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-media-upload></label></div>
      <div data-media-status class="media-status">Choose a challenge or upload an image.</div>
      <div data-media-results class="media-results"></div>
    </section>
    <section class="media-coverage-note"><div><span class="eyebrow">Honest production boundary</span><h2>OCR and general visual classification are active.</h2></div><p>This build can stop abuse hidden in readable image text and route visual safety concepts into enforcement. A production release still needs a dedicated identity-hate and symbol model, known-harm hashing, forensic manipulation analysis and specialist review. When any required analysis is unavailable, K1ND holds the upload instead of guessing safe.</p></section>
  </div>`;

  const results = outlet.querySelector("[data-media-results]");
  const status = outlet.querySelector("[data-media-status]");
  const run = async (item) => {
    status.textContent = `Reading ${item.label.toLowerCase()}…`;
    const result = await analyseMediaUrl(item.src, item.caption);
    results.innerHTML = resultCard(result, item.expected);
    status.textContent = `Analysis complete · ${result.outcome.toUpperCase()}`;
  };
  outlet.querySelectorAll("[data-media-challenge]").forEach((button) => button.addEventListener("click", () => run(CHALLENGES.find((item) => item.id === button.dataset.mediaChallenge))));
  outlet.querySelector("[data-run-all-media]").addEventListener("click", async () => {
    results.innerHTML = "";
    for (const item of CHALLENGES) {
      status.textContent = `Reading ${item.label.toLowerCase()}…`;
      const result = await analyseMediaUrl(item.src, item.caption);
      results.insertAdjacentHTML("beforeend", resultCard(result, item.expected));
    }
    status.textContent = "All three images analysed locally.";
  });
  outlet.querySelector("[data-media-upload]").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) { status.textContent = "Choose an image smaller than 8 MB."; return; }
    status.textContent = `Reading ${file.name} locally…`;
    const result = await analyseUploadedMedia(file, "User-supplied image challenge");
    results.innerHTML = resultCard(result);
    status.textContent = `Analysis complete · ${result.outcome.toUpperCase()}`;
  });
}
