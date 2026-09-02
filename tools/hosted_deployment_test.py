#!/usr/bin/env python3
import argparse
import json
import os
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


class HostedProbe:
    def __init__(self, base, pin):
        self.base = base.rstrip("/")
        self.pin = pin
        self.cookie = ""
        self.csrf = ""
        self.passed = 0

    def request(self, path, method="GET", payload=None, headers=None):
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request_headers = {
            "X-Forwarded-Proto": "https",
            "X-Forwarded-For": "203.0.113.42",
            **(headers or {}),
        }
        if body is not None:
            request_headers["Content-Type"] = "application/json"
        if self.cookie:
            request_headers["Cookie"] = self.cookie
        request = Request(self.base + path, data=body, method=method, headers=request_headers)
        try:
            response = urlopen(request, timeout=20)
        except HTTPError as error:
            response = error
        raw = response.read()
        return response.status, response.headers, raw

    def check(self, condition, label):
        if not condition:
            raise AssertionError(label)
        self.passed += 1
        print(f"PASS {self.passed:02d} {label}")

    @staticmethod
    def json(raw):
        return json.loads(raw.decode("utf-8"))

    def run(self):
        status, headers, raw = self.request("/api/health")
        health = self.json(raw)
        self.check(status == 200 and health.get("version") == "4.24.1", "hosted health and version")
        self.check(headers.get("Strict-Transport-Security", "").startswith("max-age="), "HTTPS transport header")
        self.check(headers.get("X-Frame-Options") == "DENY", "frame embedding denied")

        status, _, _ = self.request("/assets/server/platform_store.py")
        self.check(status == 404, "server source remains private")

        status, _, raw = self.request("/assets/js/pages/signIn.js?v=4.24.1.0")
        sign_in_source = raw.decode("utf-8")
        self.check(status == 200 and "8642" not in sign_in_source and 'pin:"' not in sign_in_source, "public sign-in bundle contains no PIN")

        status, _, _ = self.request("/api/auth/login", "POST", {"userId": "u_admin", "pin": "8642"})
        self.check(status == 403, "offline moderator PIN rejected in hosted mode")

        status, headers, raw = self.request("/api/auth/login", "POST", {"userId": "u_admin", "pin": self.pin})
        login = self.json(raw)
        set_cookie = headers.get("Set-Cookie", "")
        self.check(status == 200 and login.get("authenticated") is True, "private hosted PIN signs in")
        self.check(all(flag in set_cookie for flag in ("Secure", "HttpOnly", "SameSite=Strict")), "hosted session cookie is protected")
        self.cookie = set_cookie.split(";", 1)[0]
        self.csrf = login["csrfToken"]

        status, _, raw = self.request("/api/auth/session")
        self.check(status == 200 and self.json(raw).get("authenticated") is True, "hosted session round trip")

        status, _, raw = self.request(
            "/api/tournament-operations/preflight", "POST", {}, {"X-K1ND-CSRF": self.csrf}
        )
        preflight = self.json(raw).get("preflight", {})
        self.check(status == 200 and preflight.get("launchReady") is True, "tournament preflight ready")

        qr_target = quote("https://k1nd.example/arena?code=K1ND23", safe="")
        status, headers, raw = self.request(f"/api/audience-arena/qr.png?url={qr_target}")
        self.check(status == 200 and headers.get_content_type() == "image/png" and raw.startswith(b"\x89PNG"), "cross-platform audience QR")

        print(f"Hosted deployment checks passed: {self.passed}/{self.passed}")


def main():
    parser = argparse.ArgumentParser(description="Verify the K1ND hosted deployment boundary.")
    parser.add_argument("--base", default="http://127.0.0.1:8000")
    parser.add_argument("--pin", default=os.environ.get("K1ND_DEMO_PIN", ""))
    args = parser.parse_args()
    if not args.pin:
        raise SystemExit("Provide --pin or K1ND_DEMO_PIN.")
    HostedProbe(args.base, args.pin).run()


if __name__ == "__main__":
    try:
        main()
    except (AssertionError, OSError, ValueError, KeyError, json.JSONDecodeError) as error:
        print(f"FAIL {error}", file=sys.stderr)
        raise SystemExit(1)
