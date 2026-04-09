# Mission Control Enhancement Scheduler
# This script creates a Windows scheduled task to remind you every 3 hours
# to enhance Mission Control

$TaskName = "MissionControl_Enhancement"
$TaskDescription = "Automated reminder to enhance Mission Control every 3 hours"

# Remove existing task if exists
$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($existingTask) {
    Write-Host "Removing existing task..."
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
}

# Create the action - opens terminal and shows notification
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument @"
-WindowStyle Hidden -Command "
Add-Type -AssemblyName System.Windows.Forms;
`$result = [System.Windows.Forms.MessageBox]::Show(
    'Time to enhance Mission Control!`n`nClick OK to open terminal.', 
    'Enhancement Cycle - 3 Hours', 
    'OKCancel', 
    'Info'
);
if (`$result -eq 'OK') {
    Start-Process 'cmd.exe' -ArgumentList '/k echo Run: kimi -p \"Enhance Mission Control based on ENHANCEMENT_GOALS.md\"'
}"
"@

# Create trigger - every 3 hours starting at 9 AM
$Trigger = New-ScheduledTaskTrigger -Once -At "09:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)

# Create additional triggers for different start times
$Triggers = @(
    $Trigger,
    (New-ScheduledTaskTrigger -Once -At "12:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "15:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "18:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "21:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "00:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "03:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365)),
    (New-ScheduledTaskTrigger -Once -At "06:00" -RepetitionInterval (New-TimeSpan -Hours 3) -RepetitionDuration (New-TimeSpan -Days 365))
)

# Settings
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Register task
Register-ScheduledTask -TaskName $TaskName -Action $Action -Trigger $Triggers -Settings $Settings -Description $TaskDescription

Write-Host "✅ Enhancement scheduler created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Schedule:" -ForegroundColor Cyan
Write-Host "  09:00 - Code Quality" -ForegroundColor Gray
Write-Host "  12:00 - Performance" -ForegroundColor Gray
Write-Host "  15:00 - UI/UX" -ForegroundColor Gray
Write-Host "  18:00 - Testing" -ForegroundColor Gray
Write-Host "  21:00 - Documentation" -ForegroundColor Gray
Write-Host "  00:00 - Code Quality" -ForegroundColor Gray
Write-Host "  03:00 - Performance" -ForegroundColor Gray
Write-Host "  06:00 - UI/UX" -ForegroundColor Gray
Write-Host ""
Write-Host "To remove: schtasks /Delete /TN $TaskName /F" -ForegroundColor Yellow
