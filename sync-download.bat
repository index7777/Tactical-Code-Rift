@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "REPO_URL=https://github.com/index7777/Tactical-Code-Rift.git"
set "REPO_DIR=%~dp0"
if /I "%~1"=="--help" goto :help

cd /d "%REPO_DIR%" || goto :cd_error
where git >nul 2>nul || goto :no_git
if not exist ".git" goto :not_repo

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "ORIGIN=%%R"
if not defined ORIGIN goto :no_origin
if /I not "!ORIGIN!"=="%REPO_URL%" (
  echo [ERROR] origin 指向其他位置：!ORIGIN!
  echo 預期位置：%REPO_URL%
  goto :failed
)

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "BRANCH=%%B"
if /I not "!BRANCH!"=="main" (
  echo [ERROR] 目前分支是 !BRANCH!，同步腳本只允許 main。
  goto :failed
)

for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY (
  echo [STOP] 本機有尚未提交的變更，為避免覆蓋已停止。
  echo 請先執行 sync-upload.bat，或自行整理／提交變更。
  git status --short
  goto :failed
)

echo [INFO] 從 GitHub 取得最新狀態...
git fetch origin --prune || goto :network_error
git rev-parse --verify refs/remotes/origin/main >nul 2>nul || goto :remote_empty

echo [INFO] 執行 fast-forward 安全更新...
git merge --ff-only origin/main || goto :diverged

echo.
echo [OK] 下載完成，本機已同步到 origin/main。
goto :end

:help
echo 用法：sync-download.bat
echo.
echo 功能：從 GitHub 安全更新 main。
echo 安全：有未提交變更或分支分歧時停止，不覆蓋本機檔案。
goto :end
:no_git
echo [ERROR] 找不到 Git。請先安裝 Git for Windows。
goto :failed
:cd_error
echo [ERROR] 無法進入腳本所在資料夾。
goto :failed
:not_repo
echo [ERROR] 這個資料夾尚未初始化。首次上傳請執行 sync-upload.bat A。
echo B 地首次下載請使用 sync-first-clone.bat。
goto :failed
:no_origin
echo [ERROR] 找不到 origin 遠端設定。
goto :failed
:network_error
echo [ERROR] 無法連線 GitHub。請檢查網路與登入狀態。
goto :failed
:remote_empty
echo [STOP] GitHub 的 main 尚不存在，請先在 A 地完成首次上傳。
goto :failed
:diverged
echo [STOP] 本機與 GitHub 已分歧，無法 fast-forward。
echo 請人工檢查 git status 與 git log，腳本不會自動 merge 或覆蓋。
goto :failed
:failed
exit /b 1
:end
endlocal
exit /b 0