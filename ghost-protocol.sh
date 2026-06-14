#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  GHOST PROTOCOL — Mission Control Hermes Launcher                             ║
# ║  One command to bring the bridge online and launch the frontend.             ║
# ║  Usage: ghost protocol [--electron] [--status] [--help]                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -euo pipefail

# ── Config ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="${SCRIPT_DIR}"
BRIDGE_PORT=8767
FRONTEND_PORT=3001
BRIDGE_PID_FILE="${REPO_ROOT}/.ghost-bridge.pid"
BRIDGE_LOG="${REPO_ROOT}/bridge.log"
HEALTH_URL="http://localhost:${BRIDGE_PORT}/api/ping"
MAX_HEALTH_WAIT=30

# ── Cyberpunk palette ──────────────────────────────────────────────────────────
C_RESET='\033[0m'
C_DIM='\033[2m'
C_BOLD='\033[1m'
C_GREEN='\033[38;5;82m'
C_CYAN='\033[38;5;51m'
C_MAGENTA='\033[38;5;201m'
C_YELLOW='\033[38;5;220m'
C_RED='\033[38;5;196m'
C_ORANGE='\033[38;5;208m'

print_banner() {
    echo -e "${C_CYAN}${C_BOLD}"
    echo '   ╔═══════════════════════════════════════════════════════════════╗'
    echo '   ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║'
    echo '   ║   ▓       ▓     ▓     ▓       ▓     ▓       ▓   ║'
    echo '   ║   ▓  ▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓   ║'
    echo '   ║   ▓  ▓  ▓  ▓  ▓  ▓  ▓       ▓  ▓  ▓  ▓     ▓   ║'
    echo '   ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║'
    echo '   ║                                                               ║'
    echo '   ║        G H O S T   P R O T O C O L   v 1 . 0 . 0             ║'
    echo '   ╚═══════════════════════════════════════════════════════════════╝'
    echo -e "${C_RESET}"
}

log_info()  { echo -e "${C_CYAN}[INFO]${C_RESET}  $1"; }
log_ok()    { echo -e "${C_GREEN}[OK]${C_RESET}    $1"; }
log_warn()  { echo -e "${C_YELLOW}[WARN]${C_RESET}  $1"; }
log_err()   { echo -e "${C_RED}[ERR]${C_RESET}   $1"; }
log_sys()   { echo -e "${C_MAGENTA}[SYS]${C_RESET}   $1"; }

# ── Helpers ──────────────────────────────────────────────────────────────────

bridge_running() {
    curl -sf "${HEALTH_URL}" > /dev/null 2>&1
}

frontend_port_occupied() {
    # Try to connect to the frontend dev port; if something answers, it's occupied.
    # Using bash built-in /dev/tcp where available; fallback to curl.
    if (echo > /dev/tcp/localhost/${FRONTEND_PORT}) 2>/dev/null; then
        return 0
    fi
    return 1
}

get_bridge_pid() {
    if [[ -f "${BRIDGE_PID_FILE}" ]]; then
        cat "${BRIDGE_PID_FILE}" 2>/dev/null || true
    fi
}

save_bridge_pid() {
    echo "$1" > "${BRIDGE_PID_FILE}"
}

clear_bridge_pid() {
    rm -f "${BRIDGE_PID_FILE}"
}

# ── Status check ───────────────────────────────────────────────────────────────

cmd_status() {
    echo ""
    log_sys "GHOST PROTOCOL STATUS SCAN"
    echo ""
    local bridge_state="${C_RED}OFFLINE${C_RESET}"
    local bridge_pid=""
    local bridge_uptime=""
    if bridge_running; then
        bridge_state="${C_GREEN}ONLINE${C_RESET}"
        bridge_pid=$(get_bridge_pid)
        bridge_uptime=$(curl -sf "${HEALTH_URL}" 2>/dev/null | sed -n 's/.*"uptime_seconds":\([0-9]*\).*/\1/p')
    fi
    echo -e "  Bridge   : ${bridge_state}  (port ${BRIDGE_PORT})"
    [[ -n "${bridge_pid}" ]] && echo -e "  PID      : ${C_DIM}${bridge_pid}${C_RESET}"
    [[ -n "${bridge_uptime}" ]] && echo -e "  Uptime   : ${bridge_uptime}s"

    local frontend_state="${C_RED}OFFLINE${C_RESET}"
    if frontend_port_occupied; then
        frontend_state="${C_GREEN}OCCUPIED${C_RESET}"
    fi
    echo -e "  Frontend : ${frontend_state} (port ${FRONTEND_PORT})"
    echo ""
}

# ── Bridge launcher ────────────────────────────────────────────────────────────

launch_bridge() {
    if bridge_running; then
        log_ok "BRIDGE ALREADY ONLINE — reusing existing instance"
        local existing_pid
        existing_pid=$(get_bridge_pid)
        [[ -n "${existing_pid}" ]] && log_info "Bridge PID: ${existing_pid}"
        return 0
    fi

    log_info "INITIATING BRIDGE SEQUENCE ..."
    cd "${REPO_ROOT}"

    # Start the bridge in background, redirect output to log
    nohup python mission-control-bridge.py >> "${BRIDGE_LOG}" 2>&1 &
    local bridge_pid=$!
    save_bridge_pid "${bridge_pid}"

    log_info "Bridge spawned  PID ${bridge_pid}  →  ${BRIDGE_LOG}"

    # Poll health until ready or timeout
    local waited=0
    while ! bridge_running; do
        if [[ ${waited} -ge ${MAX_HEALTH_WAIT} ]]; then
            log_err "BRIDGE HEALTH CHECK TIMEOUT — aborting"
            clear_bridge_pid
            return 1
        fi
        sleep 1
        ((waited++))
        echo -ne "${C_DIM}  ... polling health (${waited}/${MAX_HEALTH_WAIT})${C_RESET}\r"
    done
    echo -e "                                                            \r"
    log_ok "BRIDGE ONLINE  port ${BRIDGE_PORT}  PID ${bridge_pid}"
}

# ── Frontend launcher ──────────────────────────────────────────────────────────

launch_frontend() {
    local mode="$1"   # "dev" or "electron"

    if frontend_port_occupied; then
        log_warn "FRONTEND PORT ${FRONTEND_PORT} ALREADY OCCUPIED — another dev server may be running"
        log_warn "Continuing anyway; Vite will attempt to bind or use an alternative port"
    fi

    cd "${REPO_ROOT}"

    if [[ "${mode}" == "electron" ]]; then
        log_info "BOOTING ELECTRON SHELL ..."
        log_ok "FRONTEND LIVE — Desktop mode (Electron)"
        npm run desktop:dev
    else
        log_info "BOOTING VITE DEV SERVER ..."
        log_ok "FRONTEND LIVE — Browser mode (http://localhost:${FRONTEND_PORT})"
        npm run dev
    fi
}

# ── Cleanup ────────────────────────────────────────────────────────────────────

cleanup_bridge() {
    local bridge_pid
    bridge_pid=$(get_bridge_pid)
    if [[ -n "${bridge_pid}" ]] && kill -0 "${bridge_pid}" 2>/dev/null; then
        log_sys "TERMINATING BRIDGE  PID ${bridge_pid}"
        kill "${bridge_pid}" 2>/dev/null || true
        wait "${bridge_pid}" 2>/dev/null || true
    fi
    clear_bridge_pid
    log_ok "GHOST PROTOCOL TERMINATED — all systems offline"
}

# ── Main ───────────────────────────────────────────────────────────────────────

main() {
    local mode="dev"

    # Parse args
    for arg in "$@"; do
        case "${arg}" in
            --electron)
                mode="electron"
                ;;
            --status)
                cmd_status
                exit 0
                ;;
            --help|-h)
                echo "Usage: ghost protocol [--electron] [--status] [--help]"
                echo ""
                echo "  (no args)   Launch bridge + Vite dev server (browser mode)"
                echo "  --electron  Launch bridge + Electron desktop mode"
                echo "  --status    Show bridge and frontend port status, then exit"
                echo "  --help      Show this help"
                exit 0
                ;;
        esac
    done

    print_banner
    log_sys "GHOST PROTOCOL INITIATED"
    echo ""

    # Ensure we are in the repo root
    cd "${REPO_ROOT}"

    # Launch bridge
    if ! launch_bridge; then
        log_err "BRIDGE LAUNCH FAILED — aborting"
        exit 1
    fi

    echo ""

    # Trap to kill bridge when frontend exits (only if we started it)
    trap cleanup_bridge EXIT INT TERM

    # Launch frontend (blocking)
    launch_frontend "${mode}"
}

main "$@"
