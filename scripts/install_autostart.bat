@echo off
REM Registers POC Watchdog to start automatically when you log in to Windows.
REM Run this file by double-clicking it (or "Run as administrator" for best results).

setlocal
set TASK_NAME=POC_Watchdog
set SCRIPT_DIR=%~dp0..
set PYTHON_EXE=python

schtasks /create /tn "%TASK_NAME%" /tr "\"%PYTHON_EXE%\" \"%SCRIPT_DIR%\watchdog.py\"" /sc onlogon /rl highest /f

echo.
echo ================================================================
echo POC Watchdog registered to start automatically when you log in to Windows.
echo.
echo To enable full "Retry on failure" (if the Watchdog itself is closed):
echo   1. Open "Task Scheduler" from the Start menu
echo   2. Find the task named "%TASK_NAME%"
echo   3. Properties ^> Settings tab
echo   4. Enable: "If the task fails, restart every: 1 minute"
echo   5. Set: "Attempt to restart up to: 999 times"
echo ================================================================
pause
