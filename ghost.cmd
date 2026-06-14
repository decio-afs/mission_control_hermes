@echo off
REM ╔══════════════════════════════════════════════════════════════════════════════╗
REM ║  GHOST PROTOCOL — Windows Launcher (CMD / PowerShell)                         ║
REM ║  Usage: ghost.cmd protocol [--electron] [--status] [--help]              ║
REM ╚══════════════════════════════════════════════════════════════════════════════╝
setlocal EnableDelayedExpansion

REM ── Detect shell ───────────────────────────────────────────────────────────────
set "PS_DETECT="
for /f "delims=" %%a in ('echo %PSMODULEPATH%') do set "PS_DETECT=%%a"

REM ── Config ───────────────────────────────────────────────────────────────────
set "GHOST_SCRIPT=C:\Users\decio\Documents\Business Projects\05_Web_Devs\Mission_Control_Hermes\ghost-protocol.sh"
set "BASH_CMD=bash"

REM ── Cyberpunk palette (CMD-safe) ─────────────────────────────────────────────
set "C_RESET="
set "C_DIM="
set "C_BOLD="
set "C_GREEN="
set "C_CYAN="
set "C_MAGENTA="
set "C_YELLOW="
set "C_RED="
set "C_ORANGE="

REM Try to enable ANSI colors via registry / VT processing
for /f "tokens=3" %%a in ('reg query "HKCU\Console" /v VirtualTerminalLevel 2^>nul ^| findstr VirtualTerminalLevel') do (
    if "%%a"=="0x1" (
        set "C_RESET= 0m"
        set "C_DIM= 2m"
        set "C_BOLD= 1m"
        set "C_GREEN= 38;5;82m"
        set "C_CYAN= 38;5;51m"
        set "C_MAGENTA= 38;5;201m"
        set "C_YELLOW= 38;5;220m"
        set "C_RED= 38;5;196m"
        set "C_ORANGE= 38;5;208m"
    )
)

REM Fallback: assume ANSI support in Windows Terminal / modern PowerShell
if defined WT_SESSION (
    set "C_RESET= 0m"
    set "C_DIM= 2m"
    set "C_BOLD= 1m"
    set "C_GREEN= 38;5;82m"
    set "C_CYAN= 38;5;51m"
    set "C_MAGENTA= 38;5;201m"
    set "C_YELLOW= 38;5;220m"
    set "C_RED= 38;5;196m"
    set "C_ORANGE= 38;5;208m"
)

REM ── Helpers ──────────────────────────────────────────────────────────────────
:log_info
    echo [%C_CYAN%INFO%C_RESET%]  %~1
    goto :eof

:log_ok
    echo [%C_GREEN%OK%C_RESET%]    %~1
    goto :eof

:log_warn
    echo [%C_YELLOW%WARN%C_RESET%]  %~1
    goto :eof

:log_err
    echo [%C_RED%ERR%C_RESET%]   %~1
    goto :eof

:log_sys
    echo [%C_MAGENTA%SYS%C_RESET%]   %~1
    goto :eof

REM ── Banner ───────────────────────────────────────────────────────────────────
:print_banner
    echo %C_CYAN%%C_BOLD%
    echo    ╔═══════════════════════════════════════════════════════════════╗
    echo    ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║
    echo    ║   ▓       ▓     ▓     ▓       ▓     ▓       ▓   ║
    echo    ║   ▓  ▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓  ▓  ▓▓▓  ▓  ▓▓▓▓▓   ║
    echo    ║   ▓  ▓  ▓  ▓  ▓  ▓  ▓       ▓  ▓  ▓  ▓     ▓   ║
    echo    ║   ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓  ▓▓▓▓▓▓▓   ║
    echo    ║                                                               ║
    echo    ║        G H O S T   P R O T O C O L   v 1 . 0 . 0             ║
    echo    ╚═══════════════════════════════════════════════════════════════╝
    echo %C_RESET%
    goto :eof

REM ── Argument builder ───────────────────────────────────────────────────────────
:build_args
    set "ALL_ARGS="
    :arg_loop
    if "%~1"=="" goto :eof
    if defined ALL_ARGS (
        set "ALL_ARGS=!ALL_ARGS! %~1"
    ) else (
        set "ALL_ARGS=%~1"
    )
    shift
    goto :arg_loop

REM ── Main entry ───────────────────────────────────────────────────────────────
:main
    if "%~1"=="" (
        call :log_err "No command specified"
        echo.
        echo Usage: ghost.cmd protocol [--electron] [--status] [--help]
        echo.
        echo   protocol    Launch Mission Control (bridge + frontend)
        echo   --electron  Launch in Electron desktop mode
        echo   --status    Check bridge/frontend status without launching
        echo   --help      Show this help
        exit /b 1
    )

    set "CMD_ARG=%~1"

    if /I "%CMD_ARG%"=="protocol" (
        shift
        call :build_args %*

        if not exist "%GHOST_SCRIPT%" (
            call :log_err "ghost-protocol.sh not found at: %GHOST_SCRIPT%"
            exit /b 1
        )

        call :print_banner
        call :log_sys "GHOST PROTOCOL INITIATED [Windows Wrapper]"
        echo.
        call :log_info "Handing off to bash launcher..."
        echo.

        REM Quote the path for bash -c so spaces survive
        %BASH_CMD% -c "bash \"%GHOST_SCRIPT%\" %ALL_ARGS%"
        exit /b %ERRORLEVEL%
    )

    if /I "%CMD_ARG%"=="--status" (
        if not exist "%GHOST_SCRIPT%" (
            call :log_err "ghost-protocol.sh not found at: %GHOST_SCRIPT%"
            exit /b 1
        )
        call :log_sys "GHOST PROTOCOL STATUS SCAN [Windows Wrapper]"
        %BASH_CMD% -c "bash \"%GHOST_SCRIPT%\" --status"
        exit /b %ERRORLEVEL%
    )

    if /I "%CMD_ARG%"=="--help" (
        echo Usage: ghost.cmd protocol [--electron] [--status] [--help]
        echo.
        echo   (no args)   Launch bridge + Vite dev server (browser mode)
        echo   --electron  Launch bridge + Electron desktop mode
        echo   --status    Show bridge and frontend port status, then exit
        echo   --help      Show this help
        exit /b 0
    )

    if /I "%CMD_ARG%"=="-h" (
        echo Usage: ghost.cmd protocol [--electron] [--status] [--help]
        echo.
        echo   (no args)   Launch bridge + Vite dev server (browser mode)
        echo   --electron  Launch bridge + Electron desktop mode
        echo   --status    Show bridge and frontend port status, then exit
        echo   --help      Show this help
        exit /b 0
    )

    call :log_err "Unknown command: %CMD_ARG%"
    echo Run 'ghost.cmd --help' for usage.
    exit /b 1

call :main %*
endlocal
