# Salon dashboard routes on the Pi (`/brand/metrics`, etc.)

The Next.js portal calls:

- `GET /brand/metrics`
- `GET /brand/top-services`
- `GET /brand/low-stock-products`

`GET /brand/metrics` includes **`salon_ops_available`** (`true` when `fetchOpsSummary()` succeeded, `false` when the Pi fell back to zeros so the portal can tell “Wix unreachable” from “real zeros”).

If your Pi returns **404** on those paths, wire them in **`routes_brand.js`**.

## Files (in repo under `server/brand/`)

| File | Role |
|------|------|
| `wix_staff_client.js` | `fetchOpsSummary()` → `WIX_STAFF_API_BASE_URL` + `/internal/ops/summary` with `Bearer WIX_STAFF_API_TOKEN` |
| `salon_dashboard_routes.js` | Registers the three `GET` routes and maps JSON fields |

## One-time edit on the Pi

After `git pull`, open **`server/brand/routes_brand.js`**:

1. Near the top with other `require` lines, add:

   ```js
   const { registerSalonDashboardRoutes } = require("./salon_dashboard_routes");
   ```

2. **Immediately after** `router.use(requireInternalApiKey);`, add:

   ```js
   registerSalonDashboardRoutes(router);
   ```

3. Restart:

   ```bash
   sudo systemctl restart kic-brand-api
   ```

## Env on the Pi (already expected)

```env
WIX_STAFF_API_BASE_URL=http://127.0.0.1:4000
WIX_STAFF_API_TOKEN=...
INTERNAL_API_KEY=...   # or PI_API_KEY — clients send x-api-key
```

## If data is empty or wrong

The summary JSON shape may use different property names. Inspect:

```bash
curl -sS -H "Authorization: Bearer $WIX_STAFF_API_TOKEN" http://127.0.0.1:4000/internal/ops/summary
```

Then adjust **`mapMetrics` / `mapTopServices` / `mapLowStock`** in `wix_staff_client.js` to match your real keys.

## Requires Node 18+

`fetch` is used globally (Node 18+). On older Node, add `node-fetch` or upgrade Node on the Pi.
