"""Pure-python smoke tests for the vendored token + device builders.

No FastAPI, no network. Run with `python -m unittest tests.test_token -v`
from the `webapp/server` directory.
"""
import unittest

from server.coolapk_token import gen_x_app_token
from server.device import make_x_app_device


class TestGenToken(unittest.TestCase):
    def test_gen_token_shape(self) -> None:
        result = gen_x_app_token("TESTDEV", 2512091, 1700000000)
        self.assertTrue(result.startswith("v3"), f"missing v3 prefix: {result!r}")
        self.assertGreater(len(result), 60, f"token too short: {len(result)}")
        self.assertNotIn("\n", result)
        self.assertNotIn("\r", result)
        self.assertNotIn(" ", result)


class TestMakeDevice(unittest.TestCase):
    def test_make_device(self) -> None:
        result = make_x_app_device(
            "TESTSEED",
            "Xiaomi",
            "Xiaomi",
            "M2102J2SC",
            "RKQ1.200826.002",
            "00000000-0000-0000-0000-000000000000",
        )
        self.assertNotIn("=", result)
        self.assertNotIn("\r", result)
        self.assertNotIn("\n", result)
        self.assertGreater(len(result), 80, f"device too short: {len(result)}")


if __name__ == "__main__":
    unittest.main()
