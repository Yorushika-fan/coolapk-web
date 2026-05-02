<div align="center">

# coolapk-web

**A clean, login-free web reader for [Coolapk](https://www.coolapk.com).**
_Browse the timeline, dive into topics, follow users — all from your browser, no account needed._

[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Python 3.12+](https://img.shields.io/badge/python-3.12+-3776ab.svg?logo=python&logoColor=white)](https://www.python.org/)
[![React 19](https://img.shields.io/badge/react-19-61dafb.svg?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-8-646cff.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/fastapi-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/docker-multi--stage-2496ed.svg?logo=docker&logoColor=white)](#quick-start)

[Quick Start](#quick-start) ·
[Features](#features) ·
[Configuration](#configuration) ·
[Development](#development)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Yorushika-fan/coolapk-web)

</div>

---

## Highlights

- 🚀 **One container, one command.** `docker compose up -d --build` and you have a fully functional Coolapk reader running on `:8000`.
- 🪶 **No account, no install, no tracking.** Pure read-only client; nothing leaves your server.
- 🎨 **Built for long reading.** Native-feeling typography, calm dark mode, dense list-friendly card layouts inspired by 即刻 / Threads.
- 🧰 **Local power-user controls.** Hide topics or users you don't care about with exact / fuzzy / regex filters; toggle which side-nav entries you see.
- 📱 **Responsive.** Phone, tablet, ultrawide — same UI, same speed.

## Features

| | |
|---|---|
| **🏠 Home & Channels** | Timeline plus four curated sections: 数码 (Digital), 热闻 (News), 值得看 (Worth-Reading), 活动 (Events). |
| **🧵 Post Detail** | Full body with three comment views — **All / Hot / Latest** — plus inline reply threads and a lightbox image gallery. |
| **👤 User Profile** | Profile header, posts and replies tabs, infinite scroll. |
| **#️⃣ Topics** | Tagged-content aggregation; topic-to-topic links navigate inside the SPA. |
| **🔍 Search** | Three search modes: posts, users, tags. |
| **🖼️ Smart Image Grid** | Adaptive layouts (1 / 2 / 1+2 / 4 / 9 with overflow badge), pinch-to-zoom lightbox on detail pages. |
| **🌗 Dark Mode** | Auto-detected from system, manual override stored locally. Tuned for contrast and reading endurance. |
| **⚙️ Local Settings** | <ul><li>**Content filters**: by tag / user / content, with exact / fuzzy / regex matching</li><li>**Side-nav visibility**: hide channels you don't use</li><li>All preferences live in your browser's `localStorage` — never leave your device</li></ul> |

## Quick Start

### Option A — One-click deploy on Render

The fastest path to a live URL. Render builds the Docker image for you and gives you a free `*.onrender.com` subdomain.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Yorushika-fan/coolapk-web)

1. Click the button — Render reads `render.yaml` and shows a deploy form.
2. (Optional) Paste your `IOS_X_APP_TOKEN` / `IOS_X_APP_DEVICE` / `IOS_COOKIE` if you want post-detail to work; leave blank otherwise.
3. Click **Apply** and wait ~3 minutes for the first build.

> **Heads up:** Render's free tier puts the service to sleep after 15 minutes of inactivity, so the first request after a quiet period takes ~30 seconds while it spins back up. Upgrade to **Starter** ($7/mo) to keep it always-on.

### Option B — Self-host with Docker

> **Prerequisites:** Docker + Docker Compose. Tested on Ubuntu 22.04, Debian 12, macOS 14.

```bash
# 1. Clone
git clone https://github.com/Yorushika-fan/coolapk-web.git
cd coolapk-web

# 2. Configure (see Configuration section below; the iOS-mode creds are
#    optional — leave them blank to start, you can fill in later)
cp server/.env.example .env

# 3. Launch
docker compose up -d --build

# 4. Verify
curl http://localhost:8000/healthz
# → {"ok":true,"token_age_s":2}
```

Open **<http://localhost:8000>** (or `http://<your-server-ip>:8000`) in your browser. That's it.

To change the published port, edit `.env`:

```bash
echo "PORT=8080" >> .env
docker compose up -d
```

To put it behind a domain with HTTPS, front it with [Caddy](https://caddyserver.com/) or nginx and proxy to `127.0.0.1:8000`.

## Screenshots

> _Help wanted — submit a PR with your screenshots!_

| Light | Dark |
| :---: | :---: |
| _home-light.png_ | _home-dark.png_ |
| _detail-light.png_ | _settings-dark.png_ |

## Architecture

```
┌──────────────────┐         ┌──────────────────────────┐         ┌─────────────────────┐
│   Browser (SPA)  │ ──────► │   FastAPI (this repo)    │ ──────► │   Coolapk public    │
│                  │  /api/* │                          │ headers │   API endpoints     │
│  React 19 +      │         │  • request authentication│         │                     │
│  Vite + Router   │         │  • caching + retry       │         │                     │
│  Tailwind +      │         │  • image hot-link bypass │         │                     │
│  shadcn/ui       │  /img   │  • SPA static fallback   │         │                     │
└──────────────────┘         └──────────────────────────┘         └─────────────────────┘
```

Single Python process serves both the API proxy and the bundled SPA, so there's no CORS to wrangle and no separate web server to keep alive.

## Configuration

All configuration lives in a single `.env` at the project root. Copy `server/.env.example` and edit:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8000` | Host port to publish |
| `LOG_LEVEL` | `INFO` | `DEBUG` / `INFO` / `WARNING` / `ERROR` |
| `IOS_X_APP_TOKEN` | _empty_ | **Optional.** Enables full post-detail view (otherwise post detail returns a captcha). See below. |
| `IOS_X_APP_DEVICE` | _empty_ | iOS device fingerprint header — captured together with the token |
| `IOS_COOKIE` | _empty_ | iOS session cookie — captured together with the token |
| `TOKEN_HARD_TTL_S` | `240` | How long a generated request token stays valid |
| `TOKEN_REFRESH_AFTER_S` | `180` | Background refresh window before the hard TTL expires |

### About `IOS_*` credentials

Some endpoints (notably **post detail**) are gated behind a captcha that only the official iOS app passes. To unlock them you can paste the headers from a real iOS request into your `.env`:

1. On a real iPhone, install the official **酷安** app (App Store ID 1117194091) and sign in.
2. Open any post in the iOS app while running [Charles](https://www.charlesproxy.com/) or [mitmproxy](https://mitmproxy.org/) on your computer.
3. Find the request to `/v6/feed/detail` and copy three headers:
   ```env
   IOS_X_APP_TOKEN=<X-App-Token>
   IOS_X_APP_DEVICE=<X-App-Device>
   IOS_COOKIE=<full Cookie header>
   ```
4. `docker compose restart`

These credentials are short-lived (typically ~24 hours). When post detail starts returning "需要验证码" again, repeat the capture. **Without these values everything else still works** — you just won't see post bodies on the dedicated detail page (the list-card snippet still loads).

## Routes

### Frontend (React Router v7)

| Path | Page |
| --- | --- |
| `/` | Home timeline |
| `/feed/:id` | Post detail (with reply tabs) |
| `/u/:uid` | User profile |
| `/t/:tag` | Topic page |
| `/p/:slug` | Channel hub |
| `/search?q=&type=feed\|user\|tag` | Search |
| `/settings` | Local filters + nav visibility |

### Backend (FastAPI)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v6/{path:path}` | Generic upstream proxy |
| `POST` | `/api/v6/feed/detail` | Post detail (uses iOS-mode when configured) |
| `GET` | `/img?url=…` | Image proxy (hot-link bypass) |
| `GET` | `/healthz` | Health check |
| `GET` | `/{path}` | SPA static fallback |

## Development

> **Prerequisites:** Node 20+, [pnpm](https://pnpm.io/) 9+, Python 3.12+.

```bash
# ── Backend (terminal 1) ───────────────────────────────────
cd server
python -m venv .venv && source .venv/bin/activate
pip install -e .
cp .env.example .env
uvicorn server.main:app --reload --port 8000

# ── Frontend (terminal 2) ──────────────────────────────────
cd client
pnpm install
pnpm dev
# Open http://localhost:5173 — Vite proxies /api and /img to :8000
```

### Type-checking & build

```bash
cd client
pnpm exec tsc --noEmit   # Type-check
pnpm build               # Production bundle to client/dist/
pnpm lint                # ESLint
pnpm format              # Prettier
```

### Running tests

```bash
cd server
.venv/bin/pytest
```

## Tech Stack

**Frontend** &nbsp;&middot;&nbsp; React 19 &middot; Vite 8 &middot; TypeScript &middot; Tailwind CSS v4 &middot; React Router v7 &middot; Zustand 5 (with `persist`) &middot; shadcn/ui &middot; DOMPurify &middot; lucide-react

**Backend** &nbsp;&middot;&nbsp; FastAPI &middot; uvicorn &middot; httpx &middot; bcrypt &middot; pydantic-settings

**Deployment** &nbsp;&middot;&nbsp; Docker (multi-stage build) &middot; Docker Compose &middot; Health-check probe

## Project Status

This is a hobby project. Issues and PRs are welcome — especially:

- 🐛 Bug reports with reproducible steps
- 📸 Screenshots to fill in the gallery above
- 🎨 UI/UX polish
- 🌍 Internationalization (the UI is currently bilingual zh-CN/en mix)
- 📱 Mobile gesture improvements

## What's intentionally **not** in scope

To keep the threat surface small and the user model simple, the following will not be added:

- ❌ Login / posting / commenting / liking / following
- ❌ Push notifications / message inbox
- ❌ App store / app downloads
- ❌ Anything that requires writing to upstream

If you need any of these, please use the official Coolapk app.

## Disclaimer

This project is for personal use and technical study. It is **not affiliated with, endorsed by, or sponsored by 酷安网络科技 (Coolapk)**. All content served belongs to its respective creators and to Coolapk. Use of this project implies acceptance of any risks related to Coolapk's Terms of Service. Please do not use this project for commercial redistribution, mass scraping, or any activity that violates the source service's terms.

## License

[MIT](./LICENSE) © Yorushika
