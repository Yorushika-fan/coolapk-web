"""Vendored Coolapk X-App-Token algorithm (15.9.1 cost-10).

Source: /tmp/coolapk_token.py — verified against unidbg byte-for-byte and
end-to-end against api2.coolapk.com. See <root>/CLAUDE.md for derivation.

The no-arg `make_x_app_device` from the source was removed here; device
fingerprint lives in `server.device` with explicit parameters.
"""
import base64
import hashlib
import pathlib

import bcrypt as _bcrypt

_BCRYPT_ALPHABET = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"


def _normalize_bcrypt_salt22(salt22: str) -> str:
    """OpenWall bcrypt only consumes 16 bytes (=128 bits) from the 22-char salt; the 4 unused
    low bits of the 22nd char are silently dropped. The python `bcrypt` module is strict and
    rejects salts whose padding bits are nonzero, so zero them ourselves — the resulting hash
    is identical to what crypt_blowfish (Coolapk's native bcrypt) computes."""
    last = salt22[-1]
    idx = _BCRYPT_ALPHABET.index(last)
    return salt22[:-1] + _BCRYPT_ALPHABET[idx & 0b110000]


XOR_BLOB_PATH = pathlib.Path(__file__).parent / "xor_blob.bin"
PKG = "com.coolapk.market"

# Default device profile (overridden in webapp via server.device with env values).
SHUZILM_ID = "ABCDEFGH1234567890ABCDEFGH1234567890"
MANUFACTURER = "Xiaomi"
BRAND = "Xiaomi"
MODEL = "M2102J2SC"
DISPLAY = "RKQ1.200826.002"
OAID = "00000000-0000-0000-0000-000000000000"

# WORKING reference (15.9.1) — server still validates this version.
APP_VERSION_NAME = "15.9.1"
APP_VERSION_CODE = 2512091
USER_AGENT = (
    f"Dalvik/2.1.0 (Linux; U; Android 15; Pixel 8 Build/AP2A.240805.005) "
    f"(#Build; google; Pixel 8; AP2A.240805.005; 15) "
    f"+CoolMarket/{APP_VERSION_NAME}-{APP_VERSION_CODE}-universal"
)
API_VERSION = "15"
APP_CHANNEL = "coolapk"
APP_MODE = "universal"
SDK_INT = 35
SDK_LOCALE = "zh-CN"


def gen_x_app_token(device_id: str, version_code: int, ts: int, debug: bool = False) -> str:
    xor_blob = open(str(XOR_BLOB_PATH), "rb").read()  # 930 bytes

    offset = ((ts + version_code) % 100) * 4 + 128
    salt_window = xor_blob[offset:offset + 128]
    salt_blob = base64.b64decode(salt_window)

    md5_dev = hashlib.md5(device_id.encode()).hexdigest()
    big_chain = (
        PKG.encode()
        + b"&" + salt_blob
        + b"&" + md5_dev.encode()
        + b"&" + str(ts).encode()
        + b"&" + str(version_code).encode()
    )

    md5_2 = hashlib.md5(base64.b64encode(big_chain)).hexdigest().encode()
    md5_3 = hashlib.md5(big_chain).hexdigest()

    payload_b64 = base64.b64encode(f"{ts:x}/{md5_3}".encode()).rstrip(b"=").decode()
    setting_22 = _normalize_bcrypt_salt22(payload_b64[:22].replace("+", "."))
    salt_full = ("$2b$10$" + setting_22).encode()
    bcrypt_out = _bcrypt.hashpw(md5_2, salt_full)
    bcrypt_out = b"$2y$" + bcrypt_out[4:]
    if debug:
        # debug-guarded only — never fires in production import
        import sys
        sys.stderr.write(f"  offset={offset}\n  md5_3={md5_3}\n")
    return "v3" + base64.b64encode(bcrypt_out).decode()
