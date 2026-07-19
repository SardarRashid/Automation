@echo off
echo ==============================================================
echo  BUILD AND DEPLOY: InventorySuit V2 (Salesman App ^& Job Portal)
echo ==============================================================
echo.

:: Add portable Node.js to PATH
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%

:: 1. Deploy Frontend (Inventory / Salesman)
echo --------------------------------------------------------------
echo  Deploying Frontend
echo --------------------------------------------------------------
cd /d "%~dp0frontend"

echo [1/4] Building the Frontend application with Vite...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend Build failed! Check the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] Deploying Frontend to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Frontend Deployment failed! Check your Firebase login status.
    pause
    exit /b %errorlevel%
)

:: 2. Deploy Job Portal
echo.
echo --------------------------------------------------------------
echo  Deploying Job Portal
echo --------------------------------------------------------------
cd /d "%~dp0Job-Portal"

echo [3/4] Building the Job Portal application with Vite...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Job Portal Build failed! Check the errors above.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/4] Deploying Job Portal to Firebase Hosting...
call firebase deploy --only hosting
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Job Portal Deployment failed! Check your Firebase login status.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================================
echo [SUCCESS] Both applications have been built and deployed!
echo ==============================================================
pause
