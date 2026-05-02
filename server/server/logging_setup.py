"""Structured JSON logging for the proxy.

Emits one JSON object per log record to stdout. Helpers:
- `log_request(...)` for the AC-shaped per-request line.
- `log_rotation(reason)` for `{"event":"rotation","reason":...}`.
"""
import json
import logging
import sys
from datetime import datetime, timezone


_RESERVED = {
    "name", "msg", "args", "levelname", "levelno", "pathname", "filename",
    "module", "exc_info", "exc_text", "stack_info", "lineno", "funcName",
    "created", "msecs", "relativeCreated", "thread", "threadName",
    "processName", "process", "message", "asctime", "taskName",
}


class _JsonFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        ts = datetime.fromtimestamp(record.created, tz=timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%S.%f"
        )[:-3] + "Z"
        payload = {
            "ts": ts,
            "level": record.levelname,
            "msg": record.getMessage(),
        }
        # Merge any "extra=" kwargs the caller passed.
        for key, value in record.__dict__.items():
            if key in _RESERVED or key.startswith("_"):
                continue
            payload[key] = value
        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_json_logging(level: str = "INFO") -> None:
    """Install a stdout JSON StreamHandler on the root logger.

    Idempotent: replaces any prior handlers we installed so re-init in tests
    doesn't accumulate duplicate output.
    """
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))
    # Clear existing handlers so re-configuration doesn't double-emit.
    for h in list(root.handlers):
        root.removeHandler(h)
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(_JsonFormatter())
    root.addHandler(handler)


def log_request(
    method: str,
    path: str,
    upstream_status: int,
    ms: int,
    tok_fp: str,
    cache: str,
) -> None:
    logging.getLogger("proxy").info(
        "request",
        extra={
            "method": method,
            "path": path,
            "upstream_status": upstream_status,
            "ms": ms,
            "tok_fp": tok_fp,
            "cache": cache,
        },
    )


def log_rotation(reason: str) -> None:
    logging.getLogger("proxy").info(
        "rotation",
        extra={"event": "rotation", "reason": reason},
    )
