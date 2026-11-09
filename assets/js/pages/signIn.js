import { useCurrentUser, isServerAuthenticated } from "../store.js?v=4.24.1.brand1";
import { loginServerSession } from "../serverPlatform.js?v=4.24.1.brand1";
import { navigate } from "../lib/router.js";
import { escapeHtml } from "../lib/util.js";
import { toast } from "../lib/ui.js";

const PREVIEW_ACCOUNTS = [
  { id:"u_adult", name:"Priya Anand" },
  { id:"u_u18", name:"Noah Kim" },
  { id:"u_trusted", name:"Elena Duarte" },
  { id:"u_fan", name:"Amira Hassan" },
  { id:"u_admin", name:"Jordan Blake" },
];

export function renderSignIn(outlet) {
  if (isServerAuthenticated()) {
    const user = useCurrentUser();
    outlet.innerHTML = `<section class="auth-shell"><div class="auth-card card card-pad stack">
      <span class="eyebrow">Your account</span><h1>Signed in as ${escapeHtml(user.displayName)}</h1>
      <p class="muted">Pick up where you left off.</p>
      <div><a class="btn btn-teal" data-link href="/feed">Continue to feed</a></div>
    </div></section>`;
    return;
  }
  outlet.innerHTML = `<section class="auth-shell product-auth">
    <div class="auth-intro"><span class="eyebrow">Your account</span><h1>Sign in</h1>
      <p>Use the preview account and PIN you were given.</p>
    </div>
    <form class="auth-card card card-pad stack" data-auth-form>
      <label>Account<select name="userId" required>
        ${PREVIEW_ACCOUNTS.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join("")}
      </select></label>
      <label>PIN<input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" autocomplete="current-password" required placeholder="4-digit PIN"></label>
      <button class="btn btn-teal" type="submit">Sign in</button>
      <p class="form-error" data-auth-error role="alert" hidden></p>
    </form>
    <p class="product-auth-note">This is a product preview. Use the supplied account details.</p>
  </section>`;
  const form = outlet.querySelector("[data-auth-form]");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = form.querySelector("button[type=submit]");
    const error = form.querySelector("[data-auth-error]");
    submit.disabled = true; submit.textContent = "Signing in…"; error.hidden = true;
    try {
      await loginServerSession(form.elements.userId.value, form.elements.pin.value);
      toast("Signed in");
      navigate("/feed");
    } catch (problem) {
      error.textContent = problem.message || "Sign-in failed"; error.hidden = false;
    } finally {
      submit.disabled = false; submit.textContent = "Sign in";
    }
  });
}
