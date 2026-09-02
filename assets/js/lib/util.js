// assets/js/lib/util.js — small shared helpers, no dependencies.

let _seq = 0;
export function uid(prefix = "id") {
  _seq += 1;
  return `${prefix}_${Date.now().toString(36)}${_seq.toString(36)}${Math.floor(
    Math.random() * 1e4
  ).toString(36)}`;
}

// Deterministic placeholder avatar as an inline SVG data URI.
// NOTE: intentionally abstract initials avatars — no real athlete images.
export function avatarDataUri(initials, hue = 174) {
  const bg = `hsl(${hue} 34% 92%)`;
  const fg = `hsl(${hue} 44% 30%)`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'>` +
    `<rect width='96' height='96' rx='48' fill='${bg}'/>` +
    `<text x='50%' y='50%' dy='.35em' text-anchor='middle' ` +
    `font-family='-apple-system,Segoe UI,Roboto,sans-serif' font-size='38' ` +
    `font-weight='600' fill='${fg}'>${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const secs = Math.max(1, Math.floor((Date.now() - then) / 1000));
  const table = [
    [60, "s"], [60, "m"], [24, "h"], [7, "d"], [4.35, "w"], [12, "mo"],
  ];
  let v = secs, unit = "s";
  for (const [step, label] of table) {
    if (v < step) { unit = label; break; }
    v = Math.floor(v / step); unit = label;
  }
  return `${v}${unit}`;
}

export function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function fmtCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 >= 100 ? 1 : 0).replace(/\.0$/, "") + "k";
  return String(n);
}

export function escapeHtml(s = "") {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
