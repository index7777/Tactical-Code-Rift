@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "REPO_URL=https://github.com/index7777/Tactical-Code-Rift.git"
set "DEST=%~1"
if /I "%DEST%"=="--help" goto :help
if "%DEST%"=="" set "DEST=%USERPROFILE%\Documents\Tactical-Code-Rift"

where git >nul 2>nul || goto :no_git
if exist "%DEST%\.git" goto :already_repo
if exist "%DEST%" (
  for /f "delims=" %%F in ('dir /b /a "%DEST%" 2^>nul') do set "NOT_EMPTY=1"
  if defined NOT_EMPTY goto :not_empty
) else (
  mkdir "%DEST%" || goto :failed
)

echo [INFO] 首次下載到：%DEST%
git clone "%REPO_URL%" "%DEST%" || goto :clone_error

echo.
echo [OK] 首次下載完成。
echo 之後請在該資料夾執行 sync-download.bat 或 sync-upload.bat B。
goto :end

:help
echo 用法：sync-first-clone.bat [目的資料夾]
echo 範例：sync-first-clone.bat D:\Tactical-Code-Rift
echo 未指定時：%%USERPROFILE%%\Documents\Tactical-Code-Rift
goto :end
:no_git
echo [ERROR] 找不到 Git。請先安裝 Git for Windows。
goto :failed
:already_repo
echo [STOP] 目的地已經是 Git Repository，不需要再次 clone。
goto :failed
:not_empty
echo [STOP] 目的資料夾不是空的：%DEST%
echo 為避免覆蓋檔案，請選擇新的空資料夾。
goto :failed
:clone_error
echo [ERROR] Clone 失敗。請確認 A 地已完成首次上傳及 GitHub 存取權限。
goto :failed
:failed
exit /b 1
:end
endlocal
exit /b 0