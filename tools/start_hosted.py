"""Fail closed on missing hosted-demo configuration; never print secret values."""
import os
from pathlib import Path
import re
import sys

def validate_hosted_environment(env):
    pin = env.get("K1ND_DEMO_PIN", "").strip()
    if not re.fullmatch(r"[0-9]{4}", pin) or pin in {"2468","1357","3579","4680","8642"}:
        raise ValueError("Set K1ND_DEMO_PIN privately in Render to four digits different from the shipped offline PINs.")
    data_dir = env.get("K1ND_DATA_DIR", "").strip()
    if not data_dir or not Path(data_dir).is_absolute():
        raise ValueError("Set K1ND_DATA_DIR to the existing persistent disk mount path.")
    if env.get("K1ND_SECURE_COOKIES", "").lower() != "true":
        raise ValueError("Hosted startup requires K1ND_SECURE_COOKIES=true.")
    if env.get("K1ND_TRUST_PROXY_HEADERS", "").lower() != "true":
        raise ValueError("Hosted startup requires K1ND_TRUST_PROXY_HEADERS=true.")

if __name__ == "__main__":
    try:
        validate_hosted_environment(os.environ)
    except ValueError as error:
        sys.exit(str(error))
    root = Path(__file__).resolve().parents[1]
    os.chdir(root)
    os.execv(sys.executable, [sys.executable, str(root / "serve.py")])
