# Environment Variables

None of these are ever written into source code — they're set in the
Cloudflare Pages dashboard (**Settings → Environment variables**) and read
server-side only, inside `/functions/api/*`.

| Variable | Purpose | Where to get it | Where to enter it |
| --- | --- | --- | --- |
| `MAKE_SHARED_SECRET` | Proves that a `create-token` request really came from your Make scenario, not a random client. | Generate once yourself, e.g. `openssl rand -hex 32`, or any password generator producing 40+ random characters. | Cloudflare Pages → Settings → Environment variables (Production + Preview). Paste the same value into the `x-make-secret` header of the Make HTTP module. |
| `MAKE_ACTIVITY_WEBHOOK_URL` | Where the app forwards `PROMO_PAGE_OPENED` / `CARD_GENERATED` / etc. events. | Create a "Custom webhook" trigger in a Make scenario — Make shows you the URL once the webhook module is added. | Cloudflare Pages → Settings → Environment variables. |

**Binding (not an env var, but configured the same screen area):**

| Binding | Purpose | Where to set it |
| --- | --- | --- |
| `PROMO_KV` | Cloudflare KV namespace storing token → participant lookups and activity counters. | Cloudflare Pages → Settings → Functions → KV namespace bindings. See `DEPLOYMENT.md` step 3. |

No database password, API key, or credential of any kind is ever present
in `index.html`, `css/`, or `js/` — those files are served as-is to every
visitor's browser, so nothing secret can live there.
