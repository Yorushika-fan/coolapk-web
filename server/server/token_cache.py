"""Async token cache with hard-TTL gate, background refresher, and 1004-rotation hook.

`gen_x_app_token` is CPU-bound (md5 + bcrypt cost-10) — we run it inside
the asyncio.Lock; on modern hardware that's ~80-150ms which is acceptable
for the warm-up + every ~3 min refresh.
"""
import asyncio
import time
from dataclasses import dataclass
from typing import Literal, Optional, Tuple

from .config import settings
from .coolapk_token import APP_VERSION_CODE, gen_x_app_token
from .device import X_APP_DEVICE
from .logging_setup import log_rotation


CacheState = Literal["hit", "miss", "refresh"]


@dataclass
class CachedToken:
    token: str
    device: str
    generated_ts: int
    version_code: int


class TokenCache:
    HARD_TTL_S: int = settings.TOKEN_HARD_TTL_S
    REFRESH_AFTER_S: int = settings.TOKEN_REFRESH_AFTER_S
    FORCE_ROTATE_COOLDOWN_S: int = 2

    def __init__(self) -> None:
        self._lock: asyncio.Lock = asyncio.Lock()
        self._current: Optional[CachedToken] = None
        self._last_rotate_ts: int = 0
        self._refresh_task: Optional[asyncio.Task] = None

    async def get(self) -> Tuple[CachedToken, CacheState]:
        """Return (cached_token, cache_state).

        Fast path returns current if within HARD_TTL_S.
        Otherwise acquires the lock, double-checks, and regenerates.
        """
        now = int(time.time())
        cur = self._current
        if cur is not None and now - cur.generated_ts < self.HARD_TTL_S:
            return cur, "hit"

        async with self._lock:
            now = int(time.time())
            cur = self._current
            if cur is not None and now - cur.generated_ts < self.HARD_TTL_S:
                # Another caller regenerated while we waited.
                return cur, "refresh"
            await self._regen_locked()
            assert self._current is not None
            return self._current, "miss"

    async def force_rotate(self, reason: str = "status_1004") -> CachedToken:
        """Force a regeneration with a 2s cooldown to prevent thundering herd."""
        now = int(time.time())
        if (
            self._current is not None
            and now - self._last_rotate_ts < self.FORCE_ROTATE_COOLDOWN_S
        ):
            return self._current

        async with self._lock:
            now = int(time.time())
            if (
                self._current is not None
                and now - self._last_rotate_ts < self.FORCE_ROTATE_COOLDOWN_S
            ):
                return self._current
            await self._regen_locked()
            log_rotation(reason)
            assert self._current is not None
            return self._current

    async def _regen_locked(self) -> None:
        """Regenerate the token. Caller must hold self._lock."""
        ts = int(time.time())
        # Use APP_VERSION_CODE imported from server.coolapk_token — single
        # source of truth for token-input version.
        token = gen_x_app_token(X_APP_DEVICE, APP_VERSION_CODE, ts)
        self._current = CachedToken(
            token=token,
            device=X_APP_DEVICE,
            generated_ts=ts,
            version_code=APP_VERSION_CODE,
        )
        self._last_rotate_ts = ts

    async def _refresh_loop(self) -> None:
        try:
            while True:
                await asyncio.sleep(self.REFRESH_AFTER_S)
                async with self._lock:
                    await self._regen_locked()
                log_rotation("ttl")
        except asyncio.CancelledError:
            return

    async def start_refresher(self) -> None:
        if self._refresh_task is None or self._refresh_task.done():
            self._refresh_task = asyncio.create_task(self._refresh_loop())

    async def stop_refresher(self) -> None:
        task = self._refresh_task
        if task is None:
            return
        task.cancel()
        try:
            await asyncio.wait_for(task, 1.0)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pass
        self._refresh_task = None


cache = TokenCache()
