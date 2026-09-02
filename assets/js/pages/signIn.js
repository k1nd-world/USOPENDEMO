import { useCurrentUser, isServerAuthenticated } from "../store.js?v=4.24.1.0";
import { loginServerSession } from "../serverPlatform.js?v=4.24.1.0";
import { navigate } from "../lib/router.js";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";

const DEMO_ACCOUNTS = [
  { id:"u_adult", name:"Priya Anand", access:"Verified adult · comments" },
  { id:"u_u18", name:"Noah Kim", access:"Verified U18 · comments" },
  { id:"u_trusted", name:"Elena Duarte", access:"Trusted poster · posts + comments" },
  { id:"u_fan", name:"Amira Hassan", access:"Verified participant · posts + comments" },
  { id:"u_admin", name:"Jordan Blake", access:"Moderator · case workspace" },
];

export function renderSignIn(outlet) {
  if (isServerAuthenticated()) {
    const user = useCurrentUser();
    outlet.innerHTML = `<section class="auth-shell"><div class="auth-card card card-pad stack">
      <span class="eyebrow">Authenticated session</span><h1>Signed in as ${escapeHtml(user.displayName)}</h1>
      <p class="muted">Your permissions are being enforced by the V4.24.1 server session.</p>
      <div><a class="btn btn-teal" data-link href="/feed">Continue to feed</a></div>
    </div></section>`;
    return;
  }
  outlet.innerHTML = `<section class="auth-shell">
    <div class="auth-intro"><span class="eyebrow">V4.24.1 Hosted Tournament Operations</span><h1>Choose a governed demo account</h1>
      <p>These demonstration accounts use real server sessions and enforced permissions. Enter the private four-digit PIN provided by the K1ND presenter.</p>
    </div>
    <div class="auth-grid">
      <form class="auth-card card card-pad stack" data-auth-form>
        <label>Demo account<select name="userId" required>${DEMO_ACCOUNTS.map((a) => `<option value="${a.id}">${escapeHtml(a.name)} — ${escapeHtml(a.access)}</option>`).join("")}</select></label>
        <label>Demo PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="off" required placeholder="4-digit PIN"></label>
        <button class="btn btn-teal" type="submit">Start signed session</button>
        <p class="form-error" data-auth-error hidden></p>
      </form>
      <div class="auth-credentials card card-pad"><span class="mini-kicker">Available demonstration roles</span>
        ${DEMO_ACCOUNTS.map((a) => `<button type="button" data-account="${a.id}"><span><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.access)}</small></span><code>Select</code></button>`).join("")}
      </div>
    </div>
    <div class="auth-security-strip"><span><b>HttpOnly cookie</b> Browser scripts cannot read the session token</span><span><b>CSRF bound</b> State changes require the session safety token</span><span><b>Server permissions</b> Role and identity are never trusted from the request body</span></div>
  </section>`;
  const form = outlet.querySelector("[data-auth-form]");
  outlet.querySelectorAll("[data-account]").forEach((button) => button.addEventListener("click", () => {
    form.elements.userId.value = button.dataset.account;
    form.elements.pin.focus();
  }));
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const error = form.querySelector("[data-auth-error]");
    submit.disabled = true; submit.textContent = "Starting secure session…"; error.hidden = true;
    try {
      await loginServerSession(form.elements.userId.value, form.elements.pin.value);
      toast("Signed session started");
      navigate(form.elements.userId.value === "u_admin" ? "/admin" : "/feed");
    } catch (problem) {
      error.textContent = problem.message || "Sign-in failed"; error.hidden = false;
    } finally {
      submit.disabled = false; submit.textContent = "Start signed session";
    }
  });
}
