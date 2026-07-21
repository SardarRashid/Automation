@echo off
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%

echo =======================================================
echo          CLOUDFLARE WORKER DEPLOYMENT SCRIPT
echo =======================================================
echo.
echo Step 1: Logging into Cloudflare (if not already logged in)...
call npx wrangler login

echo.
echo Step 2: Setting up Gemini API Key Secret...
echo Please paste your GEMINI_API_KEY when prompted.
call npx wrangler secret put GEMINI_API_KEY

echo.
echo Step 3: Deploying Worker to Cloudflare...
call npx wrangler deploy

echo.
echo =======================================================
echo Deployment complete! 
echo Please copy the URL of your deployed worker (e.g., https://job-portal-worker.YOUR_SUBDOMAIN.workers.dev)
echo and add it to D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\Job-Portal\.env.production like this:
echo VITE_WORKER_URL=https://your-worker-url.workers.dev
echo =======================================================
pause
