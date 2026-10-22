# K1ND MVP v10/2026 — black / white / fluorescent yellow

Separate local colour edition, 22 October 2026. Base application version remains 4.24.1.

## Run locally

Double-click START_OFFLINE_DEMO.command and keep its Terminal window open. Open http://127.0.0.1:8137/sign-in (or the homepage at http://127.0.0.1:8137/). Close that Terminal window to stop this copy. Python 3 is required; the original README_FIRST.md covers the existing demo accounts and features. This copy uses port 8137 to avoid the original launcher's port 8035. A fresh local data directory and signing key are created by the unchanged application on first launch. No previous user data or keys are included.

## Source and design provenance

Selected USOPENDEMO 2 from the provided August 28 outputs. USOPENDEMO, USOPENDEMO 2 and USOPENDEMO 3 identify as v4.24.1 and their UI source hashes match. All 65 UI/version/readme files checked against USOPENDEMO_GITHUB_RENDER_READY.zip match. The number suffixes do not identify newer software versions.

The accessible Create Investor Data Room chat confirms black, white and yellow as its design. Exact tokens were obtained from the existing local investor deployment package's public/access-ui.css: ink #101110, fluorescent yellow #EFFF00, paper #F5F5F0, line #D9DBD2, muted #5C6257 and white #FFFFFF. Only design source was inspected; no investor documents were copied.

## Changes

Black header, yellow selected navigation and primary accent buttons, white surfaces on warm paper, yellow hero and event highlights, neutralized teal decorative backgrounds, form borders and hover/focus treatments. Legacy teal variable names remain compatibility aliases so the original JavaScript stays unchanged. Verification marks use a dark tick for legibility. Red errors, amber warnings and purple review states remain distinct; existing success states remain available.

Only the stylesheet, HTML theme/favicon/cache metadata, and launcher's label/port differ from source. All JavaScript, Python, policies and application content are unchanged. Existing layouts and interactions remain intact. No deployment or external configuration changes were made.

## Verification

Desktop 1440×1000 and mobile 390×844 visual checks covered the landing page and authenticated tournament overview; mobile feed and sign-in were also checked. No horizontal page overflow was found on landing, feed or tournament at 390px. The existing seeded moderator login succeeded in the isolated localhost test after explicit user authorization. This was a theme check, not a fresh moderation engine certification; historical test claims in the original UI/docs were not rerun.

See THEME_VERIFICATION.json for source comparisons and calculated contrast ratios. Screenshots are provided alongside the ZIP. QA sessions, keys and databases are excluded from this package. Original versions and the independent moderation-engine work were untouched.

## MVP rename

Product label changed to MVP v10/2026 in the browser title, landing footer, sign-in heading, presenter labels, tournament badge, launch button, event name and local launcher. The underlying application remains v4.24.1. Historical source documentation and internal deterministic identifiers retain their original references. Previous outputs remain intact.
