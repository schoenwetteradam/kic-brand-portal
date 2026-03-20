# Pi deployment cheatsheet (salon)

Reference layout for a typical production Pi. Adjust paths if yours differ.

## Wix staff backend (Docker + systemd)

| Item | Value |
|------|--------|
| **Unit** | `wix-staff-backend.service` |
| **Behavior** | `Type=oneshot` + `RemainAfterExit=yes` → runs `docker compose up -d` |
| **Working directory** | `/mnt/ssd/projects/wix-staff-backend` |
| **API on host** | **port `4000`** (`wix_staff_api` → `4000:4000`) |

**Note:** `active (exited)` is normal for a oneshot unit after Compose has started the containers.

### After code / image changes

```bash
cd /mnt/ssd/projects/wix-staff-backend
git pull --rebase origin main   # if you use git here
sudo docker compose pull && sudo docker compose up -d --build
sudo systemctl restart wix-staff-backend
```

Re-running the unit alone re-executes its `ExecStart` (compose up) in that directory:

```bash
sudo systemctl restart wix-staff-backend
```

## Brand API (`kic-brand-api`)

| Item | Value |
|------|--------|
| **Unit** | `kic-brand-api.service` |
| **WorkingDirectory** | `/opt/kic-brand-portal` |
| **Env file** | `/opt/kic-brand-portal/.env` |
| **Process** | `node /opt/kic-brand-portal/server/brand/server.js` |
| **Listen port** | **4001** (typical) |

### Bridge env (on the Pi `.env`)

Point at the **staff** API on the host, **not** port 3000 unless you run a separate listener there:

```env
WIX_STAFF_API_BASE_URL=http://127.0.0.1:4000
WIX_STAFF_API_TOKEN=<same secret as `/internal/*` on the staff API (e.g. Bearer / webhook token)>
```

Then:

```bash
sudo systemctl restart kic-brand-api
sudo systemctl status kic-brand-api --no-pager
journalctl -u kic-brand-api -n 50 --no-pager
```

## Context: other apps

- **`/home/admin/wix-staff-app`** — separate Express app (often **:3000**). Not the same as the Docker stack under `/mnt/ssd/projects/wix-staff-backend`.
- **`wixstaff-orders-catchup.service`** — if failed, inspect:  
  `journalctl -u wixstaff-orders-catchup -n 80 --no-pager`

## One-line reminder

| Stack | Command | Where / port |
|-------|---------|----------------|
| Wix staff (Docker) | `sudo systemctl restart wix-staff-backend` | `/mnt/ssd/projects/wix-staff-backend` → **:4000** |
| Brand API | `sudo systemctl restart kic-brand-api` | `/opt/kic-brand-portal` → **:4001** |

## Smoke tests (on the Pi)

Replace tokens and ports if needed.

```bash
curl -sS -H "Authorization: Bearer YOUR_WIX_STAFF_TOKEN" \
  http://127.0.0.1:4000/internal/ops/summary

curl -sS -H "x-api-key: YOUR_PI_BRAND_API_KEY" http://127.0.0.1:4001/brand/metrics
curl -sS -H "x-api-key: YOUR_PI_BRAND_API_KEY" http://127.0.0.1:4001/brand/top-services
curl -sS -H "x-api-key: YOUR_PI_BRAND_API_KEY" http://127.0.0.1:4001/brand/low-stock-products
```

## Vercel / Next.js

The hosted portal only needs `PI_BASE_URL` (public **HTTPS** URL that reverse-proxies to **:4001**) and `PI_API_KEY`. See root `.env.example`.

**Public URL for Vercel (`PI_BASE_URL`):**

- **Cloudflare Tunnel** (no open ports on router): [cloudflare-tunnel-brand-api.md](cloudflare-tunnel-brand-api.md)
- **Caddy + port forward** on the Pi: [brand-api-public-url.md](brand-api-public-url.md)

**404 on `/brand/metrics`?** Add salon dashboard routes after pulling: [salon-pi-brand-routes.md](salon-pi-brand-routes.md)
