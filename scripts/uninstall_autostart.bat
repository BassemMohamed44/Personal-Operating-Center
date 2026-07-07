@echo off
REM Removes the POC Watchdog auto-start task.
schtasks /delete /tn "POC_Watchdog" /f
echo POC Watchdog auto-start removed.
pause
