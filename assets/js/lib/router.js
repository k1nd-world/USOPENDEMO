// assets/js/lib/router.js — dependency-free history router with dynamic routes.
// Exact routes remain the default. Pattern routes such as /user/:id allow
// every profile to have a genuine shareable URL in the static MVP.

const routes = new Map();
const patternRoutes = [];
let notFound = null;
let outlet = null;
let onChange = null;

export function registerRoute(path, handler) { routes.set(path, handler); }

export function registerPatternRoute(pattern, handler) {
  const names = [];
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/:([A-Za-z0-9_]+)/g, (_match, name) => {
      names.push(name);
      return "([^/]+)";
    });
  patternRoutes.push({ pattern, regex: new RegExp(`^${escaped}$`), names, handler });
}

export function setNotFound(handler) { notFound = handler; }
export function onRouteChange(fn) { onChange = fn; }
export function setOutlet(el) { outlet = el; }

export function navigate(path, replace = false) {
  if (path === current()) { render(); return; }
  if (replace) history.replaceState({}, "", path);
  else history.pushState({}, "", path);
  render();
}

export function current() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function resolve(path) {
  const exact = routes.get(path);
  if (exact) return { handler: exact, params: {} };
  for (const route of patternRoutes) {
    const match = path.match(route.regex);
    if (!match) continue;
    const params = {};
    route.names.forEach((name, index) => {
      try { params[name] = decodeURIComponent(match[index + 1]); }
      catch (_) { params[name] = match[index + 1]; }
    });
    return { handler: route.handler, params };
  }
  return { handler: notFound, params: {} };
}

let lastRenderedPath = null;
export function render() {
  if (!outlet) return;
  const path = current();
  const { handler, params } = resolve(path);
  outlet.innerHTML = "";
  if (handler) handler(outlet, params);
  if (onChange) onChange(path);
  if (path !== lastRenderedPath) { window.scrollTo(0, 0); lastRenderedPath = path; }
}

// Intercept clicks on internal links marked with data-link.
function interceptLinks() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[data-link]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http") || a.target === "_blank") return;
    e.preventDefault();
    navigate(href);
  });
}

let started = false;
export function startRouter(outletEl) {
  outlet = outletEl;
  if (!started) {
    window.addEventListener("popstate", render);
    interceptLinks();
    started = true;
  }
  render();
}
