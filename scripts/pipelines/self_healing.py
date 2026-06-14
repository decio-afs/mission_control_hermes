"""
self_healing.py — Backend pipeline: self-healing diagnostics & repair runner.
Single-pass mode: runs once, writes JSON status to .hermes/data/, logs to .hermes/logs/.
Windows-compatible, stdlib only.
"""
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / ".hermes" / "data"
LOGS_DIR = REPO_ROOT / ".hermes" / "logs"
OUT_FILE = DATA_DIR / "self_healing.json"
LOG_FILE = LOGS_DIR / "self_healing.log"

DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def log(msg: str) -> None:
    ts = datetime.now(timezone.utc).isoformat()
    line = f"[{ts}] {msg}"
    print(line)
    with LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(line + "\n")


def run_cmd(cmd: list[str], timeout: int = 60) -> dict:
    """Run a subprocess and return structured result."""
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            encoding="utf-8",
            errors="replace",
            creationflags=CREATE_NO_WINDOW,
            stdin=subprocess.DEVNULL,
            cwd=str(REPO_ROOT),
        )
    except subprocess.TimeoutExpired:
        return {"ok": False, "error": f"timed out after {timeout}s", "stdout": "", "stderr": ""}
    except FileNotFoundError as e:
        return {"ok": False, "error": str(e), "stdout": "", "stderr": ""}
    return {
        "ok": result.returncode == 0,
        "returncode": result.returncode,
        "stdout": result.stdout.strip(),
        "stderr": result.stderr.strip(),
    }


# ---------------------------------------------------------------------------
# Checks
# ---------------------------------------------------------------------------

def check_node_modules() -> dict:
    log("check: node_modules exists")
    nm = REPO_ROOT / "node_modules"
    ok = nm.exists() and (nm / ".package-lock.json").exists() or (nm / "fastapi").exists()
    if not ok:
        log("  -> missing node_modules, running npm ci")
        r = run_cmd(["npm", "ci"], timeout=180)
        ok = r["ok"]
    return {"name": "node_modules", "ok": ok, "fix_attempted": not ok}


def check_git_status() -> dict:
    log("check: git status")
    r = run_cmd(["git", "status", "--porcelain"])
    dirty = bool(r["stdout"].strip())
    return {"name": "git_status", "ok": not dirty, "dirty": dirty, "details": r["stdout"][:500]}


def check_bridge_log() -> dict:
    log("check: bridge log readability")
    candidates = [REPO_ROOT / "bridge.log", REPO_ROOT / ".hermes" / "bridge.log"]
    ok = False
    size = 0
    for c in candidates:
        if c.exists():
            try:
                size = c.stat().st_size
                ok = True
                break
            except OSError:
                pass
    return {"name": "bridge_log", "ok": ok, "size_bytes": size}


def check_python_deps() -> dict:
    log("check: python deps")
    r = run_cmd([sys.executable, "-m", "pip", "list", "--format=json"], timeout=60)
    ok = r["ok"]
    missing = []
    if ok:
        try:
            installed = {pkg["name"].lower() for pkg in json.loads(r["stdout"])}
            for req in ("fastapi", "uvicorn", "pydantic"):
                if req not in installed:
                    missing.append(req)
        except json.JSONDecodeError:
            missing.append("parse error")
    else:
        missing.append("pip list failed")
    return {"name": "python_deps", "ok": ok and not missing, "missing": missing}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    log("=== self_healing start ===")
    started = datetime.now(timezone.utc).isoformat()
    checks = [
        check_node_modules(),
        check_git_status(),
        check_bridge_log(),
        check_python_deps(),
    ]
    all_ok = all(c["ok"] for c in checks)
    payload = {
        "pipeline": "self_healing",
        "version": 1,
        "started": started,
        "finished": datetime.now(timezone.utc).isoformat(),
        "all_ok": all_ok,
        "checks": checks,
    }
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    log(f"=== self_healing done (all_ok={all_ok}) ===")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
