@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "CANVAS_PORT=8080"
for /f %%P in ('node -p "require('./settings.json').port"') do set "CANVAS_PORT=%%P"

where node >nul 2>&1
if errorlevel 1 (
  echo [AI Canvas] Node.js was not found.
  echo Install Node.js 18 or newer from https://nodejs.org/ and run start.bat again.
  pause
  exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
  echo [AI Canvas] npm was not found. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [AI Canvas] First run: installing dependencies...
  call npm install
  if errorlevel 1 (
    echo [AI Canvas] npm install failed.
    pause
    exit /b 1
  )
)

echo [AI Canvas] Building web app...
call npm run build
if errorlevel 1 (
  echo [AI Canvas] Build failed.
  pause
  exit /b 1
)

echo [AI Canvas] Starting local server at http://localhost:%CANVAS_PORT%
start "AI Canvas Server" cmd /k "cd /d %~dp0 && npm run server"
timeout /t 2 /nobreak >nul
start "" http://localhost:%CANVAS_PORT%
echo [AI Canvas] Browser opened. Close the server window to stop the app.
endlocal
