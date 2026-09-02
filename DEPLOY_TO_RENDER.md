# Deploy K1ND V4.24.1 on Render

This is the full-function hosted demonstration. The website, authenticated API, moderation authority and SQLite evidence store run together as one same-origin Python web service. Do not upload this pack to Netlify as a static site.

## Before you begin

- Use a private GitHub, GitLab or Bitbucket repository. The repository contains demonstration policy and credentials logic and should not be public.
- Choose a paid Render web-service plan. This pack declares one small web-service instance and a 1 GB persistent disk. A free service cannot preserve the SQLite database across restarts.
- Choose a private four-digit demonstration PIN. The Blueprint asks for `K1ND_DEMO_PIN`; this PIN applies to all five demonstration roles and is not displayed by the website.

## Deploy

1. Extract the ZIP.
2. Create a new private repository and upload the **contents** of `K1ND_FUNCTIONAL_SOCIAL_MVP_V4_24_1`, so `render.yaml` is at the repository root.
3. In Render, choose **New → Blueprint**.
4. Connect the private repository.
5. When Render asks for `K1ND_DEMO_PIN`, enter exactly four digits. Do not use `8642` for a public deployment.
6. Review the Blueprint. It should show one Python web service in Frankfurt and one 1 GB disk mounted at `/opt/render/project/src/data`.
7. Select **Deploy Blueprint**.
8. Wait for the health check at `/api/health` to pass.
9. Open the supplied `onrender.com` address, choose a role, and enter the private PIN.
10. Sign in as Jordan Blake and open `/tournament-operations` to run Event preflight.

## Expected checks

- `/api/health` returns HTTP 200 and version `4.24.1`.
- Login returns a `Secure`, `HttpOnly`, `SameSite=Strict` session cookie over HTTPS.
- Event preflight reports all required checks ready.
- Audience QR codes use the public Render address and render on Linux.
- The database and signing key remain under the attached persistent `data` disk.
- WTA, ATP, venue-security and emergency connectors remain explicitly not configured; authorisation cannot claim an external message was sent.

## Updating the deployment

Push the complete new version to the connected private repository. Render redeploys from the commit. Do not delete or replace the persistent disk during an ordinary update.

## Important boundary

This is a publicly reachable, full-function pilot demonstration—not production tournament infrastructure. Before any real participant or player data is used, replace demo PIN authentication, SQLite and the single-instance server with managed identity, a managed database, encrypted restricted evidence storage, monitored infrastructure and reviewed operational integrations.
