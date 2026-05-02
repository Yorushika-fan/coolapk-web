# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — build the React/Vite client into static assets.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS web
WORKDIR /web

# pnpm via corepack — lockfile in client/pnpm-lock.yaml drives a deterministic
# install. Cached separately from source so iterating on `.tsx` files doesn't
# rebust the dep layer.
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

COPY client/package.json client/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY client/ ./
RUN pnpm build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — Python runtime that serves both the API and the bundled SPA.
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS app
WORKDIR /app

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    STATIC_DIR=/app/static

# Runtime deps — versions tracked loose to follow security patches; pinned
# against the same minimums as `server/pyproject.toml`.
RUN pip install --no-cache-dir \
      "fastapi>=0.115" \
      "uvicorn[standard]>=0.30" \
      "httpx>=0.27" \
      "bcrypt>=4.2" \
      "pydantic-settings>=2.5" \
      "python-dotenv>=1.0"

COPY server/server ./server
COPY --from=web /web/dist ./static

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD python -c "import urllib.request,sys; \
    r=urllib.request.urlopen('http://127.0.0.1:8000/healthz', timeout=3); \
    sys.exit(0 if r.status==200 else 1)" || exit 1

CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]
