// assets/js/lib/liveGuard.js
// Live, pre-entry safety guard for post and comment composers.
// It stops a hard-block pattern on the keystroke/paste that would complete it,
// while submitWithModeration remains the final backstop before publication.

import { moderateContent } from "../moderation.js?v=4.24.1.brand1";

function blockedMessage(result) {
  const map = {
    slur: "Prohibited hateful language was stopped before it could be completed.",
    severe_abuse: "Severe targeted abusive language was stopped before it could be completed.",
    discriminatory: "Discriminatory abuse was stopped before it could be completed.",
    personal_contact: "A phone number or personal contact detail was stopped before it could be completed.",
    doxxing: "An address or sensitive location detail was stopped before it could be completed.",
    threat: "Threatening content was stopped before it could be completed.",
    harm: "Content wishing harm on a person was stopped before it could be completed.",
    racist_symbol: "A prohibited racist or dehumanising symbol was stopped before publication.",
    dehumanising_symbol: "A targeted dehumanising symbol was stopped before publication.",
    dehumanising: "Targeted dehumanising abuse was stopped before it could be completed.",
    hate_symbol: "A prohibited hate symbol or extremist expression was stopped before publication.",
    sexual_abuse: "Sexual harassment or intimate-image abuse was stopped before publication.",
  };
  return map[result.category] || "Prohibited content was stopped before publication.";
}

function ensureMessageBox(textarea) {
  let box = textarea.parentElement?.querySelector(`[data-live-guard-for="${textarea.dataset.guardId || ""}"]`);
  if (box) return box;
  const id = textarea.dataset.guardId || `guard-${Math.random().toString(36).slice(2, 9)}`;
  textarea.dataset.guardId = id;
  box = document.createElement("div");
  box.className = "live-guard";
  box.dataset.liveGuardFor = id;
  box.setAttribute("role", "status");
  box.setAttribute("aria-live", "assertive");
  textarea.insertAdjacentElement("afterend", box);
  return box;
}

function nextValue(textarea, event, insertedText) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  if (event.inputType?.startsWith("delete") || event.inputType?.startsWith("history")) return null;
  const text = insertedText ?? event.data;
  if (text == null) return null;
  return textarea.value.slice(0, start) + text + textarea.value.slice(end);
}

export function getLiveGuardIncident(textarea) {
  if (!textarea?.dataset?.liveGuardIncident) return null;
  try {
    const incident = JSON.parse(textarea.dataset.liveGuardIncident);
    // The incident only applies while the exact stopped fragment remains in
    // the composer. Once the person genuinely edits it, normal moderation
    // reassesses the new text from scratch.
    if (String(textarea.value || "").trim() !== String(incident.blockedValue || "").trim()) return null;
    return incident;
  } catch {
    return null;
  }
}

export function clearLiveGuardIncident(textarea) {
  if (textarea?.dataset) delete textarea.dataset.liveGuardIncident;
}

export function attachLiveSafetyGuard(textarea, { onSafeInput } = {}) {
  if (!textarea || textarea.dataset.liveGuardAttached === "true") return;
  textarea.dataset.liveGuardAttached = "true";

  const box = ensureMessageBox(textarea);
  let lastSafeValue = textarea.value || "";
  let hideTimer = null;

  function show(result) {
    clearTimeout(hideTimer);
    textarea.dataset.liveGuardIncident = JSON.stringify({
      category: result.category || "blocked_completion",
      reason: result.reason || "A prohibited pattern was stopped before completion",
      blockedValue: String(textarea.value || "").trim(),
      createdAt: new Date().toISOString(),
    });
    textarea.classList.add("guard-blocked");
    box.classList.add("show");
    box.innerHTML = `<span class="guard-shield" aria-hidden="true">🛡️</span><span><strong>Stopped before publication.</strong> ${blockedMessage(result)}</span>`;
    hideTimer = setTimeout(() => {
      textarea.classList.remove("guard-blocked");
      box.classList.remove("show");
    }, 4200);
  }

  function isHardBlocked(value) {
    const result = moderateContent(value);
    return result.outcome === "block" ? result : null;
  }

  // Stops the exact keystroke that would complete a prohibited pattern.
  textarea.addEventListener("beforeinput", (event) => {
    if (event.isComposing) return;
    const prospective = nextValue(textarea, event);
    if (prospective == null) return;
    const result = isHardBlocked(prospective);
    if (!result) return;
    event.preventDefault();
    show(result);
  });

  // Pasted or dragged content is assessed as a whole before it enters the box.
  textarea.addEventListener("paste", (event) => {
    const pasted = event.clipboardData?.getData("text/plain");
    if (pasted == null) return;
    const prospective = nextValue(textarea, event, pasted);
    const result = prospective == null ? null : isHardBlocked(prospective);
    if (!result) return;
    event.preventDefault();
    show(result);
  });
  textarea.addEventListener("drop", (event) => {
    const dropped = event.dataTransfer?.getData("text/plain");
    if (dropped == null) return;
    const prospective = nextValue(textarea, event, dropped);
    const result = prospective == null ? null : isHardBlocked(prospective);
    if (!result) return;
    event.preventDefault();
    show(result);
  });

  // Fallback for autofill, speech input, unsupported beforeinput behaviour and
  // direct DOM value changes followed by an input event.
  textarea.addEventListener("input", () => {
    const result = isHardBlocked(textarea.value);
    if (result) {
      textarea.value = lastSafeValue;
      textarea.setSelectionRange(lastSafeValue.length, lastSafeValue.length);
      show(result);
      if (onSafeInput) onSafeInput(lastSafeValue);
      return;
    }
    lastSafeValue = textarea.value;
    if (onSafeInput) onSafeInput(lastSafeValue);
  });

  // Never allow an unsafe pre-existing draft to survive a render.
  const initialResult = isHardBlocked(lastSafeValue);
  if (initialResult) {
    lastSafeValue = "";
    textarea.value = "";
    show(initialResult);
    if (onSafeInput) onSafeInput("");
  }
}
