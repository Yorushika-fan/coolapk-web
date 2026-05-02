"""X-App-Device fingerprint builder.

Reproduces the Java side (jadx_out C7104.m22483):
    raw  = f"{seed}; ; ; ; {manufacturer}; {brand}; {model}; {display}; {oaid}".encode()
    b64  = base64.encodebytes(raw)        # line-wrapped
    rev  = b64[::-1]
    out  = rev.replace("\\r\\n","").replace("\\n","").replace("\\r","").replace("=","")

Module-level X_APP_DEVICE is computed once from settings at import.
Do NOT import from coolapk_token.algo — the device builder lives here with
explicit parameters; algo no longer carries a no-arg version.
"""
import base64

from .config import settings


def make_x_app_device(
    seed: str,
    manufacturer: str,
    brand: str,
    model: str,
    display: str,
    oaid: str,
) -> str:
    raw = f"{seed}; ; ; ; {manufacturer}; {brand}; {model}; {display}; {oaid}".encode()
    b64 = base64.encodebytes(raw).decode()  # line-wrapped (every 76 chars)
    rev = b64[::-1]
    return (
        rev.replace("\r\n", "")
        .replace("\n", "")
        .replace("\r", "")
        .replace("=", "")
    )


X_APP_DEVICE = make_x_app_device(
    settings.DEVICE_SEED,
    settings.DEVICE_MANUFACTURER,
    settings.DEVICE_BRAND,
    settings.DEVICE_MODEL,
    settings.DEVICE_DISPLAY,
    settings.DEVICE_OAID,
)
