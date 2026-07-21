@echo off
echo ==============================================================
echo  DEPLOY: Firebase Realtime Database Rules
echo ==============================================================

:: Add portable Node.js to PATH
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%

cd /d "%~dp0"

echo Deploying Firebase Realtime Database Rules...
call firebase deploy --only database
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database Rules Deployment failed! Check your Firebase login status.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================================
echo [SUCCESS] Database Rules deployed!
echo ==============================================================
pause
