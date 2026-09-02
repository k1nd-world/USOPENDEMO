# K1ND.world V4.24.1 changelog

## Hosted Tournament Operations Deployment

V4.24.1 was built from an exact copy of the preserved V4.24.0 Tournament Operations Mode. V4.24.0 remains unchanged.

### Added

- A Render Blueprint for a same-origin Python web service in the Frankfurt region.
- A declared 1 GB persistent disk for the SQLite evidence store and receipt-signing secret.
- A configurable `K1ND_DATA_DIR` so hosted state lives only under the persistent mount.
- A private `K1ND_DEMO_PIN` setting shared by the five demonstration roles.
- Cross-platform hosted QR generation through the pinned `qrcode` package, while retaining the local macOS renderer.
- A plain-English Render deployment guide and repository safety rules.
- Actionable client guidance when someone mistakenly uses static-only hosting.

### Security changes

- Public sign-in no longer displays or embeds demonstration PINs.
- HTTPS deployments issue `Secure`, `HttpOnly`, `SameSite=Strict` session cookies.
- HTTPS responses add HSTS, frame denial and a restrictive browser permissions policy.
- Hosted proxy addresses can be resolved explicitly for per-client sign-in throttling.
- The hosted PIN must contain exactly four digits and is re-applied safely when the persistent service starts.
- Runtime databases, signing keys and Python caches are excluded from repository uploads and release archives.

### Retained

- The V4.24.0 four-court Tournament Operations experience.
- The authoritative server moderation path and severe-harm floor.
- Role-separated fan, athlete and presenter payloads.
- Human-owned incident and escalation decisions with no fictional external delivery.
- The full canonical, adversarial, multimodal and authenticated server test suites.

### Verification

- 11/11 hosted deployment checks.
- 122/122 authenticated server contracts.
- 882/882 browser moderation readiness: 600 canonical, 262 adversarial and 20 multimodal checks.
- 367/367 expected no-bypass hard blocks and 200/200 neutral/contextual controls.
- Browser sign-in confirmed with no PIN exposed and no console errors.

### Boundary

This is a full-function hosted pilot demonstration. It is not production tournament infrastructure. Real deployment still requires managed identity, a managed database, encrypted restricted evidence storage, operational monitoring, contracted partner integrations and independent assurance.
