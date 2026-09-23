@echo off
title SmritiSetu Launcher
echo Starting SmritiSetu Backend and Frontend Servers...
start "SmritiSetu Backend" cmd /c "%~dp0start_backend.bat"
start "SmritiSetu Frontend" cmd /c "%~dp0start_frontend.bat"
echo Both servers launched in separate windows!
echo Frontend: http://127.0.0.1:5173
echo Backend:  http://127.0.0.1:8000
