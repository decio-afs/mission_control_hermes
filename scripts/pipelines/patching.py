"""
patching.py — Backend pipeline: apply known patches and verify repo health.
Single-pass mode: runs once, writes JSON status to .hermes/data/, logs to .hermes/logs/.
Windows-compatible, stdlib only.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / ".hermes" / "data"
LOGS_DIR = REPO_ROOT / ".hermes" / "logs"
OUT_FILE = DATA_DIR / "patching.json"
LOG_FILE = LOGS_DIR / "patching.log"

DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

PATCHES_DIR = REPO_ROOT / "scripts" / "patches"
PATCHES_PY = REPO_ROOT / "scripts" / "hermes_patches.py"

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
# Patch logic
# ---------------------------------------------------------------------------

def apply_hermes_patches() -> dict:
    log("apply: hermes_patches.py")
    if not PATCHES_PY.exists():
        return {"name": "hermes_patches", "ok": True, "applied": False, "reason": "file not found"}
    r = run_cmd([sys.executable, str(PATCHES_PY), "--apply"], timeout=120)
    applied = r["ok"]
    return {"name": "hermes_patches", "ok": applied, "applied": applied, "details": r["stdout"][:500] if applied else r["stderr"][:500]}


def list_patch_files() -> list[dict]:
    log("scan: patch files")
    if not PATCHES_DIR.exists():
        return []
    patches = []
    for p in sorted(PATCHES_DIR.iterdir()):
        if p.is_file() and p.suffix in (".py", ".patch", ".diff"):
            patches.append({"file": str(p.relative_to(REPO_ROOT)), "size": p.stat().st_size})
    return patches


def verify_npm_build() -> dict:
    log("verify: npm run build")
    # If node_modules is missing, build cannot succeed.
    tsc_bin = REPO_ROOT / "node_modules" / ".bin" / "tsc"
    if not tsc_bin.exists():
        return {"name": "npm_build", "ok": False, "details": "node_modules missing — run npm install"}
    r = run_cmd(["npm", "run", "build"], timeout=180)
    detail = r["stdout"][:300] if r["ok"] else (r["stderr"][:300] or r["stdout"][:300])
    return {"name": "npm_build", "ok": r["ok"], "details": detail}


def verify_python_syntax() -> dict:
    log("verify: python syntax")
    py_files = list(REPO_ROOT.rglob("*.py"))
    bad = []
    for f in py_files:
        # skip venvs
        if "node_modules" in str(f) or "__pycache__" in str(f) or ".venv" in str(f):
            continue
        r = run_cmd([sys.executable, "-m", "py_compile", str(f)], timeout=30)
        if not r["ok"]:
            bad.append(str(f.relative_to(REPO_ROOT)))
    return {"name": "python_syntax", "ok": not bad, "bad_files": bad[:10]}


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    log("=== patching start ===")
    started = datetime.now(timezone.utc).isoformat()

    patch_result = apply_hermes_patches()
    patch_files = list_patch_files()
    build_result = verify_npm_build()
    syntax_result = verify_python_syntax()

    all_ok = patch_result["ok"] and build_result["ok"] and syntax_result["ok"]

    payload = {
        "pipeline": "patching",
        "version": 1,
        "started": started,
        "finished": datetime.now(timezone.utc).isoformat(),
        "all_ok": all_ok,
        "patch_result": patch_result,
        "patch_files": patch_files,
        "build_result": build_result,
        "syntax_result": syntax_result,
    }
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    log(f"=== patching done (all_ok={all_ok}) ===")
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
