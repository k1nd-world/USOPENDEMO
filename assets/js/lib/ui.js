// assets/js/lib/ui.js — small shared UI helpers (icons, badges, toast).

export function sealSvg(size = 14) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" aria-hidden="true" style="vertical-align:-2px">
    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9L3.2 9.2l2.4-1.7 1-2.8 3-.1L12 2z" fill="var(--teal)"/>
    <path d="M8.4 12.2l2.3 2.3 4.6-4.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

export function heartIcon(filled) {
  return `<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"
    fill="${filled ? "var(--teal)" : "none"}" stroke="${filled ? "var(--teal)" : "currentColor"}" stroke-width="1.7">
    <path d="M12 20s-7-4.5-9.2-8.2C1.1 8.6 2.6 5.5 5.7 5.5c1.9 0 3.1 1.1 3.9 2.2.8-1.1 2-2.2 3.9-2.2 3.1 0 4.6 3.1 2.9 6.3C19 15.5 12 20 12 20z"/>
  </svg>`;
}

export function commentIcon() {
  return `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
    <path d="M4 5h16v11H9l-4 3v-3H4z" stroke-linejoin="round"/>
  </svg>`;
}

export function flagIcon() {
  return `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
    <path d="M5 3v18M5 4h11l-2 3 2 3H5" stroke-linejoin="round" stroke-linecap="round"/>
  </svg>`;
}

// Verified/role badges shown next to an author name.
export function authorBadges(profile, { hideRole = false } = {}) {
  let out = "";
  if (profile.verificationStatus === "verified_adult" || profile.verificationStatus === "verified_u18" || profile.role === "admin") {
    out += `<span class="seal" title="Verified identity">${sealSvg(13)}</span>`;
  }
  if (profile.isAthlete) out += `<span class="badge badge-teal" style="padding:1px 7px;font-size:.68rem">Athlete</span>`;
  if (profile.verificationStatus === "verified_u18") out += `<span class="badge badge-warn" style="padding:1px 7px;font-size:.68rem">U18</span>`;
  if (profile.role === "admin" && !hideRole) out += `<span class="badge" style="padding:1px 7px;font-size:.68rem">Moderator</span>`;
  return out;
}

let toastTimer = null;
export function toast(message) {
  let el = document.getElementById("k1nd-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "k1nd-toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}
