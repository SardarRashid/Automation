@echo off
echo ==============================================================
echo  DEPLOY: Python Backend to Render (via GitHub)
echo ==============================================================
echo.

:: Add portable Node.js (for git access via PATH)
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%

cd /d "%~dp0"

echo [1/3] Staging backend changes...
git add backend/main.py
if %errorlevel% neq 0 (
    echo [ERROR] git add failed.
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Committing backend changes...
git commit -m "Update backend: add admin create-user, set-password, disable-user endpoints"
if %errorlevel% neq 0 (
    echo [WARN] Nothing to commit (already up to date).
)

echo.
echo [3/3] Pushing to GitHub (Render will auto-deploy)...
git push origin main
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Git push failed! Check your credentials or network.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================================
echo [SUCCESS] Backend pushed to GitHub!
echo Render will automatically redeploy in ~2-3 minutes.
echo Monitor at: https://dashboard.render.com
echo ==============================================================
pause
