# Expose the Brand API publicly (HTTPS) for Vercel

Your Staff UI already lives at something like `https://wix.keepingitcutesalonandspa.com`.  
Vercel’s **`PI_BASE_URL`** must reach **`https://…/brand/metrics`** etc. on the **same Pi** where **`kic-brand-api`** listens on **`127.0.0.1:4001`**.

**Prefer no router port forwarding?** Your domain is on Cloudflare — use a **Cloudflare Tunnel** instead → **[cloudflare-tunnel-brand-api.md](cloudflare-tunnel-brand-api.md)**.

---

I can’t log into your DNS, router, or Pi from here — **you** run these steps once. This guide uses **[Caddy](https://caddyserver.com/)** (automatic HTTPS, minimal config) **when you forward 80/443** to the Pi. Alternative: nginx + Certbot at the end.

---

## 1. Pick a hostname

Example: **`brand.keepingitcutesalonandspa.com`** (any unused subdomain is fine).

Later you will set on Vercel:

```env
PI_BASE_URL=https://brand.keepingitcutesalonandspa.com
```

(No trailing slash. The Pi Brand API uses header **`x-api-key`** and env **`INTERNAL_API_KEY`** or **`PI_API_KEY`** — same value as Vercel `PI_API_KEY`.)

---

## 2. DNS — Cloudflare (your zone is already on Cloudflare)

In **Cloudflare Dashboard** → your zone **`keepingitcutesalonandspa.com`** → **DNS** → **Records**:

| Type | Name (subdomain) | IPv4 address | Proxy status |
|------|------------------|--------------|----------------|
| **A** | `brand` | Your salon **WAN/public** IPv4 | See below |

(or **AAAA** if you use IPv6-only; most home setups use **A** + IPv4.)

**Find public IP** (Pi or any machine on the salon LAN):

```bash
curl -sS https://ifconfig.me
```

Wait until DNS propagates (often minutes). Check:

```bash
nslookup brand.keepingitcutesalonandspa.com
```

### Proxy: orange cloud vs gray cloud

| Mode | What it means | Good for Pi + Caddy |
|------|----------------|---------------------|
| **DNS only** (gray cloud) | Hostname resolves **directly** to your home IP. | **Simplest:** browser hits your router → Pi; Caddy gets **Let’s Encrypt** on the Pi; fewer Cloudflare settings to tune. |
| **Proxied** (orange cloud) | Traffic goes **Cloudflare → your home IP**. Hides origin IP, DDoS protection, optional WAF. | Works too, but set **SSL/TLS** correctly (next). You still forward **80** and **443** on the router to the Pi. |

**Recommendation for a first setup:** use **DNS only (gray)** on the `brand` **A** record until HTTPS works end-to-end; then you can switch **Proxied** on if you want.

### If you use **Proxied** (orange cloud)

Go to **SSL/TLS** → **Overview**:

- **Full (strict)** is best **if** Caddy on the Pi has a **valid** certificate for `brand.keepingitcutesalonandspa.com` (Caddy/Let’s Encrypt does this automatically once port 80/443 and DNS are right).
- Avoid **Flexible** long-term (it talks to your origin over **HTTP** only and is easy to misconfigure).

Optional: **SSL/TLS** → **Edge Certificates** → enable **Always Use HTTPS**.

**Don’t** enable random **Rules** that block API paths unless you test `/brand/*` afterward.

### Cloudflare Tunnel (optional, advanced)

If you **don’t** want to open ports 80/443 on the router, you can use a **Cloudflare Tunnel** to the Pi instead of an **A** record + port forward. That’s a different guide (tunnel daemon on Pi, no public inbound ports). Say if you want that variant documented.

---

## 3. Router: forward HTTPS (and HTTP for redirects)

On your router/firewall:

- **TCP 443** → Pi’s **LAN IP** (e.g. `192.168.1.x`)
- **TCP 80** → same Pi (Caddy uses this for Let’s Encrypt HTTP-01)

Do **not** need to expose **4001** to the internet if Caddy runs on the Pi and proxies to `127.0.0.1:4001`.

---

## 4. Pi: install Caddy

On Debian/Ubuntu/Raspberry Pi OS:

```bash
sudo apt update
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

(If you already use another method to install Caddy, keep using that.)

---

## 5. Pi: Caddyfile for the Brand API

Replace the hostname if you chose something other than `brand.keepingitcutesalonandspa.com`.

```bash
sudo tee /etc/caddy/Caddyfile >/dev/null <<'EOF'
# Staff / other sites can stay on their own server blocks — add this block.

brand.keepingitcutesalonandspa.com {
	encode gzip
	reverse_proxy 127.0.0.1:4001
}
EOF
```

**If `wix.keepingitcutesalonandspa.com` is already on this same Pi** with another Caddy/nginx config, put this **extra** `brand.… { … }` block in the **same** `Caddyfile` you already use (merge files carefully).

Reload:

```bash
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
sudo systemctl status caddy --no-pager
```

Firewall (if you use `ufw`):

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw status
```

---

## 6. Confirm Brand API is listening locally

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "x-api-key: YOUR_KEY_OR_x-brand-api-key_AS_YOUR_SERVER_EXPECTS" \
  http://127.0.0.1:4001/brand/metrics
```

Use the **exact** header name your `server/brand/server.js` checks.

---

## 7. Confirm from the public internet

From **cellular** (not Wi‑Fi) or [https://reqbin.com](https://reqbin.com):

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -H "x-api-key: YOUR_KEY" \
  https://brand.keepingitcutesalonandspa.com/brand/metrics
```

Expect **200** and JSON. If **502**, Caddy is up but **kic-brand-api** is down or not on 4001. If **connection timeout**, DNS or port **443** forward is wrong.

---

## 8. Vercel

Project → Settings → Environment Variables:

| Name | Value |
|------|--------|
| `PI_BASE_URL` | `https://brand.keepingitcutesalonandspa.com` |
| `PI_API_KEY` | Same secret the Brand API expects in the header |

Redeploy the app.

---

## 9. Security notes

- Keep **`WIX_…`** secrets only on the Pi `.env` for **kic-brand-api** — not on Vercel.
- Prefer **strong random** `PI_API_KEY`; only Vercel and your Pi need it.
- If you want to **restrict by IP** (optional), Caddy supports `remote_ip` matchers; Vercel egress IPs change, so this is usually **not** worth it unless you use a fixed egress proxy.

---

## Alternative: nginx + Certbot

If you already use nginx for `wix.…`:

1. New `server_name brand.keepingitcutesalonandspa.com;`
2. `location / { proxy_pass http://127.0.0.1:4001; proxy_http_version 1.1; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; proxy_set_header X-Forwarded-For $remote_addr; }`
3. `certbot --nginx -d brand.keepingitcutesalonandspa.com`

---

## Quick reference

| Role | URL / port |
|------|-------------|
| Staff API (Docker, Pi) | `http://127.0.0.1:4000` |
| Brand API (systemd, Pi) | `http://127.0.0.1:4001` |
| Public Brand API (after this guide) | `https://brand.keepingitcutesalonandspa.com` → Caddy → `4001` |
| Staff UI (existing) | e.g. `https://wix.keepingitcutesalonandspa.com/ui/...` |

See also [pi-deploy.md](pi-deploy.md) for systemd and local smoke tests.
