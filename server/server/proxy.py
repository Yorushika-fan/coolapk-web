"""Proxy routes — `/api/v6/*` and `/img`.

Two routers exposed:
- `api_router` — mounted at `/api` in main.py for `/v6/{path:path}` + feed/detail POST.
- `image_router` — mounted at root for `/img` (spec §2.2 lives at root, not `/api/img`).

The 1004-rotation hook lives in `_forward`: parse JSON, force-rotate on 1004, retry once.
"""
import json
import time
import urllib.parse
from typing import Optional, Tuple

import httpx
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse

from .config import settings
from .coolapk_token import (
    API_VERSION,
    APP_CHANNEL,
    APP_MODE,
    APP_VERSION_CODE as _ALGO_VC,
    APP_VERSION_NAME,
    SDK_INT,
    SDK_LOCALE,
    USER_AGENT,
)
from .logging_setup import log_request
from .token_cache import cache


# ---------------------------------------------------------------------------
# Module-level invariant: the version_code we feed into gen_x_app_token MUST
# match the X-App-Code header we send upstream. If someone bumps .env without
# bumping the algo constant, the upstream bcrypt hash diverges silently.
# Caught here at import time.
# ---------------------------------------------------------------------------
assert settings.APP_VERSION_CODE == int(_ALGO_VC), (
    "X-App-Code header version must equal token-input version_code "
    f"(env={settings.APP_VERSION_CODE}, algo={_ALGO_VC}); "
    "otherwise server bcrypt hash diverges"
)


# ---------------------------------------------------------------------------
# httpx client singleton
# ---------------------------------------------------------------------------
client = httpx.AsyncClient(
    timeout=httpx.Timeout(
        connect=settings.HTTPX_TIMEOUT_CONNECT,
        read=settings.HTTPX_TIMEOUT_READ,
        write=settings.HTTPX_TIMEOUT_TOTAL,
        pool=settings.HTTPX_TIMEOUT_TOTAL,
    ),
    limits=httpx.Limits(
        max_connections=settings.HTTPX_MAX_CONNECTIONS,
        max_keepalive_connections=settings.HTTPX_MAX_KEEPALIVE,
    ),
)


api_router = APIRouter()
image_router = APIRouter()


_ALLOWED_PREFIXES = ("feed/", "user/", "main/", "search", "topic/", "page/")
_ALLOWED_IMAGE_HOST_SUFFIX = ".coolapk.com"


# ---------------------------------------------------------------------------
# Header builder
# ---------------------------------------------------------------------------
def _build_headers(token: str, device: str, dark_mode: str) -> dict:
    return {
        "User-Agent": USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        "X-Sdk-Int": str(SDK_INT),
        "X-Sdk-Locale": SDK_LOCALE,
        "X-App-Id": "com.coolapk.market",
        "X-App-Token": token,
        "X-App-Version": APP_VERSION_NAME,
        "X-App-Code": str(settings.APP_VERSION_CODE),
        "X-Api-Version": API_VERSION,
        "X-App-Device": device,
        "X-Dark-Mode": dark_mode,
        "X-App-Channel": APP_CHANNEL,
        "X-App-Mode": APP_MODE,
        "X-App-Supported": str(settings.APP_VERSION_CODE),
        "Accept-Encoding": "gzip",
    }


# ---------------------------------------------------------------------------
# One upstream call with the current cached token.
# ---------------------------------------------------------------------------
async def _do_one_call(
    method: str,
    url: str,
    body_form: Optional[bytes],
    dark_mode: str,
) -> Tuple[bytes, int, str, str]:
    """Single upstream request; returns (body_bytes, status, content_type, tok_fp)."""
    cached, _state = await cache.get()
    headers = _build_headers(cached.token, cached.device, dark_mode)
    if method == "POST":
        headers["Content-Type"] = "application/x-www-form-urlencoded"
        resp = await client.post(url, headers=headers, content=body_form or b"")
    else:
        resp = await client.get(url, headers=headers)
    ctype = resp.headers.get("content-type", "application/octet-stream")
    return resp.content, resp.status_code, ctype, cached.token[:6]


def _safe_json(body: bytes) -> Optional[dict]:
    try:
        parsed = json.loads(body)
        return parsed if isinstance(parsed, dict) else None
    except (ValueError, json.JSONDecodeError):
        return None


# ---------------------------------------------------------------------------
# Forward orchestrator with 1004 retry.
# ---------------------------------------------------------------------------
async def _forward(
    method: str,
    url: str,
    upstream_path: str,
    body_form: Optional[bytes],
    request: Request,
) -> Response:
    dark_mode = request.headers.get("X-Dark-Mode", "0")
    t0 = time.monotonic()

    # Cache state for the log line — was the *first* call a hit/miss?
    _, cache_state = await cache.get()

    body, status, ctype, tok_fp = await _do_one_call(method, url, body_form, dark_mode)

    parsed = _safe_json(body)
    if parsed is not None and parsed.get("status") == 1004:
        # Token rejected — rotate and try once more.
        await cache.force_rotate("status_1004")
        cache_state = "refresh"
        body, status, ctype, tok_fp = await _do_one_call(
            method, url, body_form, dark_mode
        )
        parsed_retry = _safe_json(body)
        if parsed_retry is not None and parsed_retry.get("status") == 1004:
            ms = int((time.monotonic() - t0) * 1000)
            log_request(method, upstream_path, 502, ms, tok_fp, cache_state)
            return JSONResponse(
                {"error": "token_rejected", "original_status": 1004},
                status_code=502,
            )

    ms = int((time.monotonic() - t0) * 1000)
    log_request(method, upstream_path, status, ms, tok_fp, cache_state)
    return Response(content=body, status_code=status, media_type=ctype)


# ---------------------------------------------------------------------------
# Path validation for /v6/{path:path}
# ---------------------------------------------------------------------------
def _path_allowed(path: str) -> bool:
    if ".." in path:
        return False
    # `search` matches both `/v6/search` and `/v6/searchTag` via prefix on the
    # first segment.
    return any(path == p or path.startswith(p) for p in _ALLOWED_PREFIXES)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
def _ios_mode_enabled() -> bool:
    return bool(settings.IOS_X_APP_TOKEN and settings.IOS_X_APP_DEVICE)


# iOS X-App-Token format (per Coolapk reverse-engineering notes):
#   <32-hex sig>{smid}0x<hex_ts>
# Empirically the 32-hex prefix is a signature that includes the trailing
# ts: rewriting just the ts at request time is rejected as 1004 (signature
# mismatch), so we have to forward the captured token verbatim and let it
# go stale daily. The signature secret is not derivable from public data —
# it's a constant baked into the iCoolMarket binary, which we don't have
# decrypted access to. Operator must re-capture on expiry.


def _build_ios_headers() -> dict:
    h = {
        "User-Agent": settings.IOS_USER_AGENT,
        "X-Requested-With": "XMLHttpRequest",
        "X-App-Id": "com.coolapk.app",
        "X-App-Token": settings.IOS_X_APP_TOKEN,
        "X-App-Device": settings.IOS_X_APP_DEVICE,
        "X-App-Version": settings.IOS_X_APP_VERSION,
        "X-App-Code": settings.IOS_X_APP_CODE,
        "X-Sdk-Int": settings.IOS_X_SDK_INT,
        "X-Sdk-Locale": settings.IOS_X_SDK_LOCALE,
        "X-Api-Version": "16",
        "Accept-Encoding": "gzip",
    }
    if settings.IOS_COOKIE:
        h["Cookie"] = settings.IOS_COOKIE
    return h


async def _forward_ios(method: str, upstream_path: str, qs: str) -> Response:
    """Manually-credentialed iOS-route passthrough. No token cache, no 1004
    rotation — the caller supplies a working token and refreshes via .env when
    it expires. Used for endpoints gated by NetEase NIS."""
    url = f"{settings.IOS_UPSTREAM_BASE}{upstream_path}"
    if qs:
        url = f"{url}?{qs}"
    headers = _build_ios_headers()
    t0 = time.monotonic()
    if method == "POST":
        resp = await client.post(url, headers=headers, content=b"")
    else:
        resp = await client.get(url, headers=headers)
    ms = int((time.monotonic() - t0) * 1000)
    tok_fp = settings.IOS_X_APP_TOKEN[:6]
    log_request(method, upstream_path, resp.status_code, ms, tok_fp, "ios")
    return Response(
        content=resp.content,
        status_code=resp.status_code,
        media_type=resp.headers.get("content-type", "application/octet-stream"),
    )


@api_router.post("/v6/feed/detail")
async def feed_detail(request: Request) -> Response:
    if _ios_mode_enabled():
        # iOS path bypasses NetEase NIS captcha. Forward `id` from form body
        # to the upstream querystring per the iOS app's actual call shape.
        body = await request.body()
        form = urllib.parse.parse_qs(body.decode("utf-8", errors="replace"))
        feed_id = (form.get("id") or [""])[0]
        page_qs_inbound = request.url.query
        # Compose: id=... + fromApi (mimics the real iOS request) + any
        # extra qs the client supplied (like `&fromApi=...`).
        params = {"id": feed_id} if feed_id else {}
        merged_qs = urllib.parse.urlencode(params)
        if page_qs_inbound:
            merged_qs = f"{merged_qs}&{page_qs_inbound}" if merged_qs else page_qs_inbound
        return await _forward_ios("POST", "/v6/feed/detail", merged_qs)

    # Fallback: Android path (currently captcha-blocked, but kept so the route
    # still responds with the upstream {status:-1,message:"需要验证码"} envelope
    # rather than 502).
    body = await request.body()
    url = f"{settings.UPSTREAM_BASE}/v6/feed/detail"
    return await _forward("POST", url, "/v6/feed/detail", body, request)


@api_router.get("/v6/{path:path}")
async def forward_get(path: str, request: Request) -> Response:
    if not _path_allowed(path):
        return JSONResponse({"error": "forbidden_path"}, status_code=400)
    qs = request.url.query
    upstream_path = f"/v6/{path}"
    url = f"{settings.UPSTREAM_BASE}{upstream_path}"
    if qs:
        url = f"{url}?{qs}"
    return await _forward("GET", url, upstream_path, None, request)


@image_router.get("/img")
async def image_passthrough(request: Request) -> Response:
    u = request.query_params.get("u", "")
    if not u:
        return JSONResponse({"error": "bad_host"}, status_code=400)
    parsed = urllib.parse.urlparse(u)
    host = (parsed.hostname or "").lower()
    if parsed.scheme not in ("https", "http") or not host.endswith(_ALLOWED_IMAGE_HOST_SUFFIX):
        return JSONResponse({"error": "bad_host"}, status_code=400)

    headers = {
        "Referer": "https://www.coolapk.com/",
        "User-Agent": USER_AGENT,
    }

    # Stream the upstream image. We lazily yield chunks so large images don't
    # buffer in memory.
    async def _iter_body():
        async with client.stream("GET", u, headers=headers) as upstream:
            async for chunk in upstream.aiter_bytes():
                yield chunk

    # We need the upstream content-type before we start streaming. httpx's
    # streaming context manager doesn't expose headers without consuming, so
    # do a lightweight HEAD for ctype, then stream the GET body.
    try:
        head = await client.head(u, headers=headers)
        ctype = head.headers.get("content-type", "image/jpeg")
    except httpx.HTTPError:
        ctype = "image/jpeg"

    return StreamingResponse(
        _iter_body(),
        media_type=ctype,
        headers={"Cache-Control": "public, max-age=86400"},
    )


# ---------------------------------------------------------------------------
# Lifespan helpers (used by main.py).
# ---------------------------------------------------------------------------
async def startup() -> None:
    # Nothing to do here — the AsyncClient is module-level and ready.
    return None


async def shutdown() -> None:
    await client.aclose()
