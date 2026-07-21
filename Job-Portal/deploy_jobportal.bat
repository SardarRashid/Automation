@echo off
set PATH=D:\AntiGravity\Latest_Active_Apps\node-extracted\node-v20.14.0-win-x64;%PATH%
call npm run build
call firebase deploy --only hosting
