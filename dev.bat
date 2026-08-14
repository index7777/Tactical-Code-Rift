@echo off
cd /d "%~dp0"

echo ========================================
echo   Tactical Code: Rift - Dev Server
echo ========================================
echo.

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js 20 or newer.
  echo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo First launch: installing project packages...
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERROR] Package installation failed.
    pause
    exit /b 1
  )
)

echo Open: http://127.0.0.1:5173/
echo Press Ctrl+C in this window to stop the server.
echo.
call npm run dev -- --host 127.0.0.1

echo.
echo Server stopped.
pause
