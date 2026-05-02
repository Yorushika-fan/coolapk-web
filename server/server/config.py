"""Pydantic settings — single source of truth for env-driven config.

Loads `.env` if present, falling back to `.env.example` defaults so executors
don't need to copy the example file just to import the module.
"""
from typing import List
from typing_extensions import Annotated

from pydantic import field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Load .env.example first (defaults), then .env to override.
        # In pydantic-settings, files later in the tuple win.
        env_file=(".env.example", ".env"),
        extra="ignore",
    )

    # Token / app identity
    APP_VERSION_NAME: str = "15.9.1"
    APP_VERSION_CODE: int = 2512091
    SDK_INT: int = 35
    SDK_LOCALE: str = "zh-CN"

    # Device fingerprint inputs
    DEVICE_SEED: str = "ABCDEFGH1234567890ABCDEFGH1234567890"
    DEVICE_MANUFACTURER: str = "Xiaomi"
    DEVICE_BRAND: str = "Xiaomi"
    DEVICE_MODEL: str = "M2102J2SC"
    DEVICE_DISPLAY: str = "RKQ1.200826.002"
    DEVICE_OAID: str = "00000000-0000-0000-0000-000000000000"

    # Upstream + CORS
    UPSTREAM_BASE: str = "https://api2.coolapk.com"
    # Annotated with NoDecode so pydantic-settings doesn't try to JSON-parse the
    # comma-separated env string before our validator runs.
    CORS_ORIGINS: Annotated[List[str], NoDecode] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Token cache timing
    TOKEN_HARD_TTL_S: int = 240
    TOKEN_REFRESH_AFTER_S: int = 180

    # httpx tuning
    HTTPX_TIMEOUT_CONNECT: int = 8
    HTTPX_TIMEOUT_READ: int = 8
    HTTPX_TIMEOUT_TOTAL: int = 10
    HTTPX_MAX_CONNECTIONS: int = 20
    HTTPX_MAX_KEEPALIVE: int = 10

    # ---------------------------------------------------------------------
    # iOS-mode passthrough (optional, for endpoints behind NetEase NIS gates).
    # When IOS_X_APP_TOKEN is non-empty, /feed/detail switches to iOS host +
    # iOS headers + supplied Cookie. Other paths stay on Android. Token is
    # short-lived; user must re-paste from a fresh proxy capture when it
    # expires.
    # ---------------------------------------------------------------------
    IOS_UPSTREAM_BASE: str = "https://api.coolapk.com"
    IOS_X_APP_TOKEN: str = ""
    IOS_X_APP_DEVICE: str = ""
    IOS_X_APP_VERSION: str = "16.1"
    IOS_X_APP_CODE: str = "2603231"
    IOS_X_SDK_INT: str = "26.3.1"
    IOS_X_SDK_LOCALE: str = "zh-CN"
    IOS_USER_AGENT: str = (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 "
        "(#Build; Apple; iPhone18,3; iPhone 17; iOS_26.3.1) "
        "+iCoolMarket/16.1-2603231"
    )
    IOS_COOKIE: str = ""  # uid=...;username=...;token=...

    # Logging
    LOG_LEVEL: str = "INFO"

    # Static frontend bundle. Set to a directory containing the built
    # client (vite `dist/` — has `index.html` + `assets/`) to serve the
    # SPA from this same FastAPI process. Empty (default) means no static
    # serving; `vite dev` is expected to handle the frontend in dev mode.
    # The Docker image populates this to `/app/static`.
    STATIC_DIR: str = ""

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _split_csv(cls, v):
        # pydantic-settings v2 doesn't auto-split CSV strings into List[str].
        # Accept both a comma-separated string (from .env) and an already-parsed list.
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        return v


settings = Settings()
