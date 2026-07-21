@echo off
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%
cd /d "D:\AntiGravity\Latest_Active_Apps\InventorySuit_V2_Development\frontend"
npx tsc -p tsconfig.app.json --noEmit
