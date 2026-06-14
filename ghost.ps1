#Requires -Version 5.1
<#
.SYNOPSIS
    GHOST PROTOCOL — Windows PowerShell Launcher
.DESCRIPTION
    Native PowerShell wrapper that calls the bash-based ghost-protocol.sh
    via MSYS2/Git-Bash. Supports all flags: --electron, --status, --help.
.EXAMPLE
    .\ghost.ps1 protocol --electron
    .\ghost.ps1 --status
    .\ghost.ps1 --help
#>

[CmdletBinding()]
param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

# ── Config ────────────────────────────────────────────────────────────────────
$GHOST_SCRIPT = "C:\Users\decio\Documents\Business Projects\05_Web_Devs\Mission_Control_Hermes\ghost-protocol.sh"
$BASH_CMD     = "bash"

# ── Cyberpunk palette ─────────────────────────────────────────────────────────
$ESC = [char]27
$C_RESET   = "${ESC}[0m"
$C_DIM     = "${ESC}[2m"
$C_BOLD    = "${ESC}[1m"
$C_GREEN   = "${ESC}[38;5;82m"
$C_CYAN    = "${ESC}[38;5;51m"
$C_MAGENTA = "${ESC}[38;5;201m"
$C_YELLOW  = "${ESC}[38;5;220m"
$C_RED     = "${ESC}[38;5;196m"
$C_ORANGE  = "${ESC}[38;5;208m"

function Write-GhostInfo  { param([string]$Message) Write-Host "${C_CYAN}[INFO]${C_RESET}  $Message" }
function Write-GhostOK    { param([string]$Message) Write-Host "${C_GREEN}[OK]${C_RESET}    $Message" }
function Write-GhostWarn  { param([string]$Message) Write-Host "${C_YELLOW}[WARN]${C_RESET}  $Message" }
function Write-GhostErr   { param([string]$Message) Write-Host "${C_RED}[ERR]${C_RESET}   $Message" }
function Write-GhostSys   { param([string]$Message) Write-Host "${C_MAGENTA}[SYS]${C_RESET}   $Message" }

function Show-Banner {
    Write-Host "${C_CYAN}${C_BOLD}"
    Write-Host '   ╔═══════════════════════════════════════════════════════════════╗'
    Write-Host '   ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║'
    Write-Host '   ║   ▓       ▓     ▓     ▓       ▓     ▓       ▓   ║'
    Write-Host '   ║   ▓  ▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓   ║'
    Write-Host '   ║   ▓  ▓  ▓  ▓  ▓  ▓  ▓       ▓  ▓  ▓  ▓     ▓   ║'
    Write-Host '   ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║'
    Write-Host '   ║                                                               ║'
    Write-Host '   ║        G H O S T   P R O T O C O L   v 1 . 0 . 0             ║'
    Write-Host '   ╚═══════════════════════════════════════════════════════════════╝'
    Write-Host "${C_RESET}"
}

function Show-Help {
    Write-Host "Usage: ghost.ps1 protocol [--electron] [--status] [--help]"
    Write-Host ""
    Write-Host "  (no args)   Launch bridge + Vite dev server (browser mode)"
    Write-Host "  --electron  Launch bridge + Electron desktop mode"
    Write-Host "  --status    Show bridge and frontend port status, then exit"
    Write-Host "  --help      Show this help"
}

function Invoke-Protocol {
    param([string[]]$PassArgs)

    if (-not (Test-Path $GHOST_SCRIPT)) {
        Write-GhostErr "ghost-protocol.sh not found at: $GHOST_SCRIPT"
        exit 1
    }

    Show-Banner
    Write-GhostSys "GHOST PROTOCOL INITIATED [PowerShell Wrapper]"
    Write-Host ""
    Write-GhostInfo "Handing off to bash launcher..."
    Write-Host ""

    # Build a single bash-safe argument string (quote the path for spaces)
    $bashArgs = $PassArgs | ForEach-Object { '"$_"' } | Join-String -Separator ' '
    $bashCommand = "bash `"$GHOST_SCRIPT`" $bashArgs"

    & $BASH_CMD -c $bashCommand
    exit $LASTEXITCODE
}

function Invoke-Status {
    if (-not (Test-Path $GHOST_SCRIPT)) {
        Write-GhostErr "ghost-protocol.sh not found at: $GHOST_SCRIPT"
        exit 1
    }
    Write-GhostSys "GHOST PROTOCOL STATUS SCAN [PowerShell Wrapper]"
    & $BASH_CMD -c "bash `"$GHOST_SCRIPT`" --status"
    exit $LASTEXITCODE
}

# ── Main ───────────────────────────────────────────────────────────────────────
if ($Arguments.Count -eq 0) {
    Write-GhostErr "No command specified"
    Write-Host ""
    Show-Help
    exit 1
}

$cmd = $Arguments[0]
$rest = $Arguments[1..($Arguments.Count-1)]

switch -Regex ($cmd) {
    '^protocol$' {
        Invoke-Protocol -PassArgs $rest
    }
    '^--status$' {
        Invoke-Status
    }
    '^--help$' {
        Show-Help
        exit 0
    }
    '^-h$' {
        Show-Help
        exit 0
    }
    default {
        Write-GhostErr "Unknown command: $cmd"
        Write-Host "Run 'ghost.ps1 --help' for usage."
        exit 1
    }
}
