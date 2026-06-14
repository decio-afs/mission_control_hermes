"""
bug_hunter.py — Backend pipeline: scan for issues and create kanban tasks.
Single-pass mode: runs once, writes JSON status to .hermes/data/, logs to .hermes/logs/.
Windows-compatible, stdlib + requests (for kanban task creation).
"""
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
CREATE_NO_WINDOW = 0x08000000 if os.name == "nt" else 0
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
DATA_DIR = REPO_ROOT / ".hermes" / "data"
LOGS_DIR = REPO_ROOT / ".hermes" / "logs"
OUT_FILE = DATA_DIR / "bug_hunter.json"
LOG_FILE = LOGS_DIR / "bug_hunter.log"

DATA_DIR.mkdir(parents=True, exist_ok=True)
LOGS_DIR.mkdir(parents=True, exist_ok=True)

KANBAN_API = os.environ.get("KANBAN_API", "http://127.0.0.1:8767/api/kanban/tasks")

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


def create_kanban_task(title: str, body: str, priority: int = 2) -> dict:
    """Best-effort POST to the bridge kanban endpoint."""
    try:
        import requests
    except ImportError:
        log("requests not installed; skipping kanban task creation")
        return {"ok": False, "error": "requests not installed"}
    try:
        resp = requests.post(
            KANBAN_API,
            json={"title": title, "body": body, "priority": priority, "triage": True},
            timeout=30,
        )
        return {"ok": resp.status_code in (200, 201), "status": resp.status_code, "text": resp.text[:500]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ---------------------------------------------------------------------------
# Scanners
# ---------------------------------------------------------------------------

def scan_lint_errors() -> list[dict]:
    log("scan: lint / type errors")
    r = run_cmd(["npm", "run", "lint", "--if-present"], timeout=120)
    if not r["ok"]:
        r = run_cmd(["npx", "eslint", ".", "--format", "json"], timeout=120)
    issues: list[dict] = []
    if r["ok"] and r["stdout"]:
        try:
            data = json.loads(r["stdout"])
            if isinstance(data, list):
                for f in data:
                    for m in f.get("messages", []):
                        if m.get("severity", 0) >= 2:
                            issues.append({
                                "file": f.get("filePath", ""),
                                "line": m.get("line"),
                                "message": m.get("message"),
                                "rule": m.get("ruleId"),
                            })
        except json.JSONDecodeError:
            pass
    else:
        # Fallback: grep for ERROR / error in stderr
        for line in (r["stderr"] or "").splitlines()[:20]:
            if "error" in line.lower():
                issues.append({"message": line, "source": "lint_stderr"})
    log(f"  -> found {len(issues)} lint issues")
    return issues


def scan_python_tracebacks() -> list[dict]:
    log("scan: python tracebacks in bridge log")
    candidates = [REPO_ROOT / "bridge.log", REPO_ROOT / ".hermes" / "bridge.log"]
    text = ""
    for c in candidates:
        if c.exists():
            try:
                text = c.read_text(encoding="utf-8", errors="replace")
                break
            except OSError:
                pass
    issues: list[dict] = []
    # Find Traceback blocks
    for m in re.finditer(r"Traceback \(most recent call last\):.*?(?=\n\n|\Z)", text, re.DOTALL):
        block = m.group(0)
        first_line = block.splitlines()[-1] if block.splitlines() else ""
        issues.append({
            "message": first_line,
            "traceback_preview": block[:500],
            "source": "bridge.log",
        })
    log(f"  -> found {len(issues)} tracebacks")
    return issues


def scan_git_conflicts() -> list[dict]:
    log("scan: git merge conflicts")
    r = run_cmd(["git", "diff", "--check"], timeout=60)
    issues: list[dict] = []
    if r["stdout"]:
        for line in r["stdout"].splitlines()[:50]:
            issues.append({"message": line, "source": "git diff --check"})
    # Also grep for conflict markers
    r2 = run_cmd(["git", "grep", "-n", "<<<<<<< HEAD"], timeout=60)
    if r2["ok"] and r2["stdout"]:
        for line in r2["stdout"].splitlines()[:50]:
            issues.append({"message": line, "source": "conflict marker"})
    log(f"  -> found {len(issues)} conflict issues")
    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    log("=== bug_hunter start ===")
    started = datetime.now(timezone.utc).isoformat()

    lint_issues = scan_lint_errors()
    py_issues = scan_python_tracebacks()
    conflict_issues = scan_git_conflicts()

    all_issues = lint_issues + py_issues + conflict_issues
    created_tasks: list[dict] = []

    for issue in all_issues[:5]:  # cap task creation
        title = issue.get("message", "")[:80] or "untitled issue"
        body = issue.get("traceback_preview", json.dumps(issue, indent=2))
        task = create_kanban_task(title, body)
        created_tasks.append({"title": title, "task_ok": task["ok"]})
        time.sleep(0.2)

    payload = {
        "pipeline": "bug_hunter",
        "version": 1,
        "started": started,
        "finished": datetime.now(timezone.utc).isoformat(),
        "issue_counts": {
            "lint": len(lint_issues),
            "python_tracebacks": len(py_issues),
            "conflicts": len(conflict_issues),
            "total": len(all_issues),
        },
        "issues": all_issues[:20],  # cap output size
        "tasks_created": created_tasks,
    }
    with OUT_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    log(f"=== bug_hunter done (total_issues={len(all_issues)}) ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
