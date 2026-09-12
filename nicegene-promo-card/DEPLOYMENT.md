# Deployment Guide

Target platform: **Cloudflare Pages** (static hosting + serverless
Functions + KV storage, all in one free/low-cost account, no server to
patch or restart).

## 1. Push the code to GitHub

1. Create a new repository, e.g. `nicegene-promo-card`.
2. Push this project's files to it (the whole folder, as-is — no build
   step needed).

## 2. Create a Cloudflare Pages project

1. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. Select the `nicegene-promo-card` repository.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (project root)
4. Click **Save and Deploy**. Cloudflare will give you a URL like
   `nicegene-promo-card.pages.dev` — this already works as a static
   preview (demo-mode fallback) even before the next steps.

## 3. Create the KV namespace

1. Cloudflare dashboard → **Workers & Pages** → **KV** → **Create a
   namespace**, name it `PROMO_KV`.
2. Go back to your Pages project → **Settings** → **Functions** →
   **KV namespace bindings** → **Add binding**:
   - Variable name: `PROMO_KV`
   - KV namespace: the one you just created.
3. Redeploy (Settings changes apply on the next deploy — trigger one from
   **Deployments** → **Retry deployment**, or push any commit).

## 4. Set environment variables

Pages project → **Settings** → **Environment variables** → add for both
**Production** and **Preview**:

| Variable | Value |
| --- | --- |
| `MAKE_SHARED_SECRET` | A long random string you generate once (e.g. `openssl rand -hex 32`) |
| `MAKE_ACTIVITY_WEBHOOK_URL` | The Make.com webhook URL that receives activity events (see `MAKE_INTEGRATION.md`) |

Redeploy after saving.

## 5. Connect your domain (optional but recommended)

Pages project → **Custom domains** → add `promo.nicegene.com` (or
whichever subdomain you prefer) and follow Cloudflare's DNS instructions.
Until this is done, the `.pages.dev` URL works identically.

## 6. Point Make.com at the deployed app

In your Make.com scenario:
- The **HTTP module** that calls `create-token` should target
  `https://promo.nicegene.com/api/create-token` (or your `.pages.dev`
  URL) with the header `x-make-secret` set to the same value as
  `MAKE_SHARED_SECRET` above.
- Use the returned `promo_token` to build the confirmation-email link:
  `https://promo.nicegene.com/?token={{promo_token}}`.

Full request/response detail is in `MAKE_INTEGRATION.md`.

## 7. Update the event configuration

Edit `config/event.config.json` (see `CONFIGURATION.md`) for the specific
event, commit, and push — Cloudflare redeploys automatically on every push
to the connected branch.

## Rollbacks

Every deploy is kept in **Deployments**. If something goes wrong, click
**Rollback to this deployment** on any previous successful build — no
server access required.
