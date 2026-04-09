# Mission Control Enhancement Scheduler Setup

## Goal
Get **me (Kimi)** to enhance Mission Control automatically every 3 hours (with your approval).

---

## Option 1: Windows Background Daemon (Recommended)

### Step 1: Start the daemon
```bash
# Double-click or run:
enhancement-daemon.bat
```

This will:
- Run continuously in background
- Beep and open terminal every 3 hours
- Show you exactly what to run

### Step 2: When notified, run:
```bash
kimi -p "Enhance Mission Control [FOCUS] based on ENHANCEMENT_GOALS.md"
```

---

## Option 2: PowerShell Scheduled Task

### Step 1: Run setup script
```powershell
# As Administrator:
powershell -ExecutionPolicy Bypass -File setup-enhancement-scheduler.ps1
```

### Step 2: You'll get Windows notifications every 3 hours

---

## Option 3: GitHub Issues + Notifications

### Step 1: The workflow is already in `.github/workflows/schedule-kimi-enhancement.yml`

### Step 2: Enable GitHub notifications
- Go to GitHub → Settings → Notifications
- Enable email or mobile push notifications
- You'll get notified when new enhancement issues are created

### Step 3: When you get the notification:
1. Open the issue
2. See the specific focus area
3. Run the kimi command shown in the issue

---

## Option 4: Manual Trigger (Always Available)

Check what focus is current and run manually:

```bash
# See current focus
node run-enhancement.js

# Or force a specific focus
node run-enhancement.js code-quality
node run-enhancement.js performance
node run-enhancement.js ui-ux
node run-enhancement.js testing
node run-enhancement.js documentation
```

---

## Schedule Reference

| Time | Focus Area | Kimi Command |
|------|------------|--------------|
| 00:00 | Code Quality | `kimi -p "Enhance Mission Control Code Quality..."` |
| 03:00 | Performance | `kimi -p "Enhance Mission Control Performance..."` |
| 06:00 | UI/UX | `kimi -p "Enhance Mission Control UI/UX..."` |
| 09:00 | Testing | `kimi -p "Enhance Mission Control Testing..."` |
| 12:00 | Documentation | `kimi -p "Enhance Mission Control Documentation..."` |
| 15:00 | Code Quality | `kimi -p "Enhance Mission Control Code Quality..."` |
| 18:00 | Performance | `kimi -p "Enhance Mission Control Performance..."` |
| 21:00 | UI/UX | `kimi -p "Enhance Mission Control UI/UX..."` |

---

## Files Created

| File | Purpose |
|------|---------|
| `ENHANCEMENT_GOALS.md` | Defines what enhancements to make |
| `.github/workflows/schedule-kimi-enhancement.yml` | Creates GitHub issues every 3h |
| `setup-enhancement-scheduler.ps1` | Windows scheduled task setup |
| `enhancement-daemon.bat` | Background notification daemon |
| `run-enhancement.js` | CLI tool to check/run enhancements |
| `ENHANCEMENT_SCHEDULER_SETUP.md` | This file |

---

## Quick Start (Choose One)

### For immediate start:
```bash
# Double-click this file (keeps running):
enhancement-daemon.bat
```

### For system integration:
```powershell
# Run as Administrator:
powershell -ExecutionPolicy Bypass -File setup-enhancement-scheduler.ps1
```

### For GitHub notifications only:
```bash
# Just commit and push, GitHub Actions handles the rest
git add .
git commit -m "Add enhancement scheduler"
git push
```

---

## How It Works

1. **Scheduler** (daemon/task/action) detects it's time for enhancement
2. **Notifier** alerts you via popup/notification/issue
3. **You** run the kimi command (or use `--auto` flag)
4. **I** analyze the codebase based on `ENHANCEMENT_GOALS.md`
5. **I** make the enhancements
6. **You** review and commit

---

## Customization

### Change the interval:
Edit any scheduler file and modify the timing:
- `.bat`: Change `10800` (seconds) to your preferred interval
- `.ps1`: Modify the `-RepetitionInterval` parameter
- `.yml`: Change `0 */3 * * *` to your preferred cron

### Add new enhancement types:
Edit `ENHANCEMENT_GOALS.md` and add new sections.

### Auto-run without manual invocation:
Add `--auto` flag to the batch file or PowerShell script.

---

## Troubleshooting

### Windows blocks the script
Right-click → Properties → Unblock

### No notifications appearing
Check Windows notification settings

### GitHub Actions not running
- Check Actions tab for errors
- Ensure workflow is enabled
- Check cron syntax

### Want to pause?
- Batch file: Close the window
- Scheduled task: `schtasks /End /TN MissionControl_Enhancement`
- GitHub Actions: Disable in repo settings

---

## Next Steps

1. **Choose your preferred method** (I recommend the daemon for simplicity)
2. **Start the scheduler**
3. **Wait for first notification** (or run `node run-enhancement.js` to test)
4. **When notified, invoke me** with the enhancement focus
5. **Review my work** and commit

---

*Ready to start? Double-click `enhancement-daemon.bat` now!*
