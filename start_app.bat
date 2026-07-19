@echo off
set "PATH=%PATH%;D:\AntiGravity\InventorySuitAndroid\node-extracted\node-v20.14.0-win-x64"

echo Starting Backend...
start "Inventory Backend" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload"

echo Starting Frontend...
start "Inventory Frontend" cmd /k "cd frontend && npm run dev -- --force --open"

echo Inventory Suite Web App is starting! Close this window.
