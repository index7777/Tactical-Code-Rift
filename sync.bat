@echo off
setlocal EnableExtensions
chcp 65001 >nul
cd /d "%~dp0" || exit /b 1
if /I "%~1"=="download" goto :download
if /I "%~1"=="upload" goto :upload
if /I "%~1"=="status" goto :status
if /I "%~1"=="--help" goto :help
echo Tactical Code Rift Sync
echo.
echo   1. Show status
echo   2. Download current branch
echo   3. Review and upload current branch
echo   4. Exit
set "CHOICE="
set /p "CHOICE=Choose 1-4: "
if "%CHOICE%"=="1" goto :status
if "%CHOICE%"=="2" goto :download
if "%CHOICE%"=="3" goto :upload
exit /b 0
:status
git branch --show-current
git status --short
goto :end
:download
call "%~dp0sync-download.bat"
goto :result
:upload
call "%~dp0sync-upload.bat" "%~2"
goto :result
:help
echo Usage: sync.bat [status^|download^|upload] [source-label]
goto :end
:result
set "RESULT=%ERRORLEVEL%"
if not "%RESULT%"=="0" exit /b %RESULT%
:end
endlocal
exit /b 0
