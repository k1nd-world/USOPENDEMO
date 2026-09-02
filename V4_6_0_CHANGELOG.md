# K1ND.world MVP v4.6.0

## Universal demo build

- Removed organisation-specific demo references across the package.
- Renamed the private rehearsal page to `/demo-rehearsal.html`.
- Replaced the organisation-specific presentation runbook with `DEMO_RUNBOOK.md`.
- Updated the Admin dashboard shortcut to **Demo rehearsal**.
- Kept the demo sports-first and suitable for athletes, clubs, leagues, federations, governing bodies, safeguarding teams, brands, investors and policy audiences.

## Adversarial moderation hardening

- Expanded canonical moderation fixtures from **62 to 112**.
- Added intervention coverage for common direct abuse: `you suck`, `worthless`, `scum`, `disgusting`, `nobody wants you here`, family taunts, mental-strength attacks and body/appearance abuse.
- Added semantic phrase-level rewrites for `piece of shit`, family-directed humiliation and `choke artist` rather than deletion-based fragments.
- Added enhanced-review rules for serious unverified criminal, safeguarding and doping allegations.
- Expanded integrity-allegation detection for claims that referees, umpires, judges or officials were paid or bribed.
- Added narrow competitive-sport context handling for `destroy you in the final` while preserving hard blocks for actual violence.
- Added clean controls to protect legitimate criticism, results language and sporting metaphors from over-moderation.

## Reliability

- **112/112** canonical moderation fixtures pass.
- All JavaScript modules pass syntax validation.
- No organisation-specific references remain in the active package.
- All active module cache keys use `v=4.6.0`.
