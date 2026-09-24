@echo off
title SmritiSetu Express GeoIP Server
cd /d "%~dp0server"
echo Installing Express server dependencies if needed...
call npm install
echo Starting Express GeoIP & TTS Server on http://127.0.0.1:5001 ...
node src/index.js
pause
