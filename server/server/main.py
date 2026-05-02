"""FastAPI app — wires routers, lifespan, CORS, and `/healthz`."""
import os
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from . import proxy
from .config import settings
from .logging_setup import configure_json_logging
from .token_cache import cache


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_json_logging(settings.LOG_LEVEL)
    # Warm the cache so the first inbound request is a hit.
    await cache.get()
    await cache.start_refresher()
    try:
        yield
    finally:
        await cache.stop_refresher()
        await proxy.shutdown()


app = FastAPI(title="coolapk-web-server", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["X-Dark-Mode", "Content-Type"],
    allow_credentials=False,
)

# `/api/v6/{path:path}` and `/api/v6/feed/detail` come from api_router with /api prefix.
app.include_router(proxy.api_router, prefix="/api")
# `/img` lives at the root per spec §2.2 — NOT under /api.
app.include_router(proxy.image_router)


@app.get("/healthz")
async def healthz() -> dict:
    cur = cache._current
    token_age_s = int(time.time()) - cur.generated_ts if cur is not None else -1
    return {"ok": True, "token_age_s": token_age_s}


# Single-origin production mode: when STATIC_DIR points at a vite `dist/`,
# serve hashed assets directly and SPA-fallback every other GET to
# `index.html` so React Router can resolve client routes (`/feed/:id`,
# `/u/:uid`, `/settings`, ...). Registered AFTER the API + image + healthz
# routes so it never shadows them. Dev mode (empty STATIC_DIR) skips this.
if settings.STATIC_DIR:
    _static_dir = settings.STATIC_DIR
    _index_html = os.path.join(_static_dir, "index.html")
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.isdir(_assets_dir):
        app.mount(
            "/assets",
            StaticFiles(directory=_assets_dir),
            name="assets",
        )

    @app.get("/{full_path:path}")
    async def spa_fallback(full_path: str):
        # Real file under STATIC_DIR? Serve it (e.g. /favicon.ico, /robots.txt).
        # Otherwise fall back to index.html so client-side routing handles it.
        if full_path:
            candidate = os.path.normpath(os.path.join(_static_dir, full_path))
            # Defense in depth — make sure the resolved path stays inside the
            # static root (prevents `../../etc/passwd`-style traversal).
            if (
                candidate.startswith(os.path.abspath(_static_dir))
                and os.path.isfile(candidate)
            ):
                return FileResponse(candidate)
        if not os.path.isfile(_index_html):
            raise HTTPException(status_code=404, detail="static bundle missing")
        return FileResponse(_index_html)
