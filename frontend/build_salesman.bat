@echo off
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%
cd /d "D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend"
echo Building Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)
echo Deploying Frontend...
call npx firebase deploy --only hosting:automation-suit-salesman
