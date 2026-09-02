// assets/js/pages/about.js

import { sealSvg } from "../lib/ui.js";
import { isPublicExperience } from "../lib/publicExperience.js?v=4.24.1.0";

export function renderAbout(outlet) {
  const publicMode = isPublicExperience();
  outlet.innerHTML = `
    <div class="about-wrap">
      <div class="page-head"><div><span class="eyebrow">Accountability by design</span><h1>Sport, without the abuse</h1></div></div>

      <section class="about-lead">
        <p>K1ND exists because the platforms where fans and athletes meet were built to
        maximise noise, not protect people. One difficult performance can become a wall of
        anonymous abuse aimed at a single athlete. We think that's a design choice — and
        a fixable one.</p>
        <p>Our answer is simple to say and hard to fake: <strong>a real, verified person
        behind every voice, and harmful content stopped before it's published.</strong></p>
      </section>

      <section>
        <div class="sec-head"><span class="eyebrow">How it works</span><h2>Three layers reduce harm before content reaches the feed</h2></div>
        <div class="pillars" style="margin-top:24px">
          <div class="pillar"><div class="num">01</div><h3>Accountable participation</h3>
            <p>Observers browse and like. Only verified members can comment, and posting opens by invitation to trusted members first.</p></div>
          <div class="pillar"><div class="num">02</div><h3>Intervention before publication</h3>
            <p>Borderline originals cannot bypass the check. They must be edited, safely rewritten, or held privately for enhanced moderation.</p></div>
          <div class="pillar"><div class="num">03</div><h3>Block or hold higher-risk content</h3>
            <p>Slurs, threats, address-sharing, phone numbers and racist symbols are hard-blocked and never published. When the same draft also contains a separable legitimate point, K1ND may offer that point as a separately validated new draft; the prohibited original never bypasses the block.</p></div>
        </div>
      </section>

      <section>
        <div class="sec-head"><span class="eyebrow">Prevention before publication</span><h2>One check, a proportionate response</h2>
          <p>${publicMode
            ? "Posts, comments, images and memes are assessed <em>before</em> they become visible."
            : "In the production K1ND architecture, posts, comments, images and memes are assessed <em>before</em> they become visible. This MVP fully demonstrates the text-intervention path; identity verification and production image analysis are represented as integration workflows."}
          The goal isn't to censor rivalry or strong opinion — it's to tell the difference between heat and harm.</p></div>
        <div class="ladder">
          <div class="rung ok"><b>Allow</b><span>Normal debate, criticism, humour</span></div>
          <div class="rung warn"><b>Warn &amp; rewrite</b><span>Lower-risk aggression — edit or use a genuinely safer version</span></div>
          <div class="rung block"><b>Block</b><span>Slurs, threats, wishing harm, doxxing, hate</span></div>
          <div class="rung review"><b>Enhanced moderation</b><span>Pile-ons, gambling attacks, allegations, satire and ambiguous context — hidden while pending</span></div>
        </div>
        <p class="muted" style="font-size:.86rem;margin-top:14px">Every outcome is logged — warnings, accepted rewrites, blocked attempts, reports and appeals — creating an accountability trail without exposing private moderation details to other users.</p>
      </section>

      <section>
        <div class="sec-head"><span class="eyebrow">What we believe</span><h2>Our principles</h2></div>
        <ul class="principles">
          <li><span class="pk">${sealSvg(16)}</span><div><b>Strong opinions without personal abuse.</b> We protect debate, not politeness. Disagreeing loudly is welcome; targeting a person is not.</div></li>
          <li><span class="pk">${sealSvg(16)}</span><div><b>Prevention before publication.</b> AI-assisted checks intervene while the user can still reconsider, edit or choose a safer version.</div></li>
          <li><span class="pk">${sealSvg(16)}</span><div><b>Private verification. Public confidence.</b> In production, identity is checked privately, creating accountability without displaying legal identity to everyone.</div></li>
          <li><span class="pk">${sealSvg(16)}</span><div><b>Safe for the young.</b> Age-aware verification and youth-safety controls are built in, not bolted on.</div></li>
          <li><span class="pk">${sealSvg(16)}</span><div><b>Brand-safe by default.</b> No gambling advertising, anywhere on the platform.</div></li>
        </ul>
      </section>

      <section>
        <div class="founder-note">
          <div class="founder-note-label">A note from the founder</div>
          <div class="founder-note-grid">
            <h2>Why I am building K1ND</h2>
            <div class="founder-note-copy">
              <p>K1ND began with a simple question: why do we accept behaviour towards athletes online that would never be tolerated in a stadium, workplace or school?</p>
              <p>As a father of three, I do not believe the next generation should have to choose between taking part online and protecting their wellbeing. Players should not be expected to become their own moderation department after a difficult match.</p>
              <p>This is not about removing criticism, rivalry or emotion from sport. It is about redesigning participation so there is accountability behind every voice, intervention before publication, and a clear safeguarding response when risk escalates.</p>
              <p class="founder-signoff"><strong>Nimesh Chandarana</strong><span>Founder, K1ND.world</span></p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div class="closing">
          <div><h2>Real identity behind every voice.</h2><p>${publicMode ? "Join the conversation and experience sport without personal abuse." : "Explore the demo and see how it fits together."}</p></div>
          <div class="row gap-12 wrap">
            ${publicMode
              ? `<a class="btn btn-teal" data-link href="/feed">Explore the feed</a><a class="btn btn-ghost" data-link href="/profile" style="background:#fff">View my profile</a>`
              : `<a class="btn btn-teal" data-link href="/demo-lab">Try Demo Lab</a><a class="btn btn-ghost" data-link href="/trust-dashboard" style="background:#fff">Open Control Room</a>`}
          </div>
        </div>
      </section>
    </div>`;
}
