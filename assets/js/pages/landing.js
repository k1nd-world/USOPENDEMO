// assets/js/pages/landing.js — the public front door (route "/").

import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.0";

export function renderLanding(outlet) {
  const publicMode = isPublicExperience();
  outlet.innerHTML = `
  <div class="landing">

    <!-- HERO -->
    <section class="hero">
      <div class="hero-copy">
        <div class="brand-kicker">F<span class="one">1</span>ND your K<span class="one">1</span>ND<span class="kick-dot">.</span></div>
        <h1>Passion stays.<br><span class="accent">Abuse doesn't.</span></h1>
        <p class="hero-sub">
          K1ND.world is a verified-first social platform for sport. It intervenes
          <em>before harmful content is published</em>, while keeping ordinary criticism,
          emotion and passionate debate intact.
        </p>
        <div class="hero-cta">
          ${publicMode ? `<a class="btn btn-teal" data-link href="/arena">Join the live arena</a><a class="btn btn-ghost" data-link href="/feed">Explore the feed</a>` : `<a class="btn btn-teal" data-link href="/tournament-operations">Open Tournament Operations</a><a class="btn btn-ghost" data-link href="/arena-control">Open one live court</a>`}
        </div>
        ${publicMode ? "" : `<span class="hero-fine"><span class="dotk"></span> Demo verification status — no real ID checks run in this preview.</span>`}
      </div>

      <!-- signature visual: tennis + the pre-post moderation moment -->
      <div class="hero-visual" aria-label="Tennis community protected before publication">
        <img class="hero-court" src="/assets/images/player-action.jpg" alt="Tennis player competing on court">
        <div class="hero-scorecard" aria-hidden="true">
          <span class="live-dot"></span><b>LIVE COMMUNITY</b><span>14.8K verified fans</span>
        </div>
        <div class="check-card" aria-label="Example of the pre-post safety check">
          <div class="check-head"><span class="scan-dot"></span> Pre-post safety check</div>
          <div class="check-draft">"Your first serve kept landing short, you useless clown."</div>
          <div class="check-verdict"><span class="q">Pause.</span> Keep it about the performance.</div>
          <p class="check-body">Express the sporting opinion without attacking the person.</p>
          <div class="check-rewrite">
            <span class="seal">${sealSvg()} Source-backed rewrite</span>
            <p>"Your first serve kept landing short."</p>
          </div>
          <div class="check-actions-preview"><span>Rewrite</span><span>Edit</span><span>Cancel</span><span>Review</span></div>
        </div>
      </div>
    </section>

    <section class="trust-strip" aria-label="K1ND product principles">
      <div><strong>Verified-first</strong><span>Private verification. Public confidence.</span></div>
      <div><strong>Accountability by design</strong><span>Real identity behind every participating voice.</span></div>
      <div><strong>Prevention before publication</strong><span>AI-assisted checks intervene before harm goes live.</span></div>
    </section>

    <!-- PROBLEM -->
    <section>
      <div class="sec-head">
        <span class="eyebrow">The problem</span>
        <h2>Open platforms are designed for scale, not accountability</h2>
        <p>After a difficult match, criticism can turn into targeted abuse within seconds.
          By the time conventional moderation removes it, the player has already seen it
          and safeguarding teams are dealing with the consequences.</p>
      </div>
    </section>

    <!-- MODEL -->
    <section>
      <div class="sec-head">
        <span class="eyebrow">How K1ND works</span>
        <h2>Safety is built into participation, not added after the damage is done</h2>
        <p>Three connected layers reduce harmful content before it reaches the public feed.</p>
      </div>
      <div class="pillars">
        <div class="pillar">
          <div class="num">01</div>
          <h3>Accountable participation</h3>
          <p>Anyone can browse. Commenting and publishing are reserved for verified members,
            so the platform knows there is a real person behind each participating account.</p>
        </div>
        <div class="pillar">
          <div class="num">02</div>
          <h3>Intervention before publication</h3>
          <p>When language becomes personal or aggressive, K1ND keeps the author's identifiable proposition and critical tone, removes the abusive span, and shows what was retained. If no real point exists, it refuses to invent one.</p>
        </div>
        <div class="pillar">
          <div class="num">03</div>
          <h3>Block or hold higher-risk content</h3>
          <p>Slurs, threats, doxxing and prohibited symbols are blocked. Ambiguous but serious
            cases remain hidden until an authorised moderator makes a decision.</p>
        </div>
      </div>
    </section>

    <!-- WHY SPORT -->
    <section>
      <div class="split">
        <div class="sec-head">
          <span class="eyebrow">A safer place for sport</span>
          <h2>Sport needs passion. It does not need personal abuse.</h2>
          <p>Athletes compete under intense public scrutiny, and a difficult result can trigger abuse within seconds. K1ND is designed
            to preserve the energy of sporting conversation while reducing the personal harm
            that too often follows high-emotion moments.</p>
        </div>
        <ul class="split-list">
          <li><span class="tick">✓</span><span>High-emotion, high-visibility moments every single match.</span></li>
          <li><span class="tick">✓</span><span>Named individuals, not teams, absorb the impact personally.</span></li>
          <li><span class="tick">✓</span><span>Global fan passion worth protecting, not suppressing.</span></li>
          <li><span class="tick">✓</span><span>A clear, measurable before/after story for safety.</span></li>
        </ul>
      </div>
    </section>

    <!-- AUDIENCE -->
    <section>
      <div class="sec-head">
        <span class="eyebrow">Who it's for</span>
        <h2>Built for the whole sporting community</h2>
      </div>
      <div class="audience">
        <div class="aud"><div class="k">🏅</div><h4>Athletes</h4><p>A place to hear from real fans without a wall of abuse after every result.</p></div>
        <div class="aud"><div class="k">📣</div><h4>Fans</h4><p>Passionate debate that stays about the sport — your voice isn't buried by trolls.</p></div>
        <div class="aud"><div class="k">🤝</div><h4>Brands</h4><p>A brand-safe environment with verified audiences and no gambling advertising, anywhere.</p></div>
        <div class="aud"><div class="k">🛡️</div><h4>Parents &amp; policy</h4><p>Age-aware verification and youth-safety controls built in from the start.</p></div>
      </div>
    </section>

    <!-- CLOSING -->
    <section>
      <div class="closing">
        <div>
          <h2>Strong opinions without personal abuse.</h2>
          <p>See how verification, pre-publication intervention and enhanced moderation create a safer place for sport.</p>
        </div>
        <div class="row gap-12 wrap">
          ${publicMode ? `<a class="btn btn-teal" data-link href="/arena">Join Centre Court live</a><a class="btn btn-ghost" data-link href="/about" style="background:#fff">Learn more</a>` : `<a class="btn btn-teal" data-link href="/tournament-operations">Launch the full event</a><a class="btn btn-ghost" data-link href="/arena-athlete?room=K1ND23" style="background:#fff">Open Athlete Screen</a>`}
        </div>
      </div>
    </section>

    <footer class="site-footer">
      <span><strong>F1ND your K1ND.</strong>${publicMode ? " — Passion stays. Abuse doesn't." : " — MVP v10/2026. Demo data only."}</span>
      <span>No gambling advertising.${publicMode ? "" : " Fictional profiles with rights-safe, public-domain tennis photography."}</span>
    </footer>
  </div>
  `;
}

function sealSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 2l2.4 1.8 3 .1 1 2.8 2.4 1.7-.9 2.9.9 2.9-2.4 1.7-1 2.8-3 .1L12 22l-2.4-1.8-3-.1-1-2.8L3.2 15l.9-2.9L3.2 9.2l2.4-1.7 1-2.8 3-.1L12 2z" fill="var(--teal)"/>
    <path d="M8.4 12.2l2.3 2.3 4.6-4.8" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
