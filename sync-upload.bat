@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul

set "REPO_URL=https://github.com/index7777/Tactical-Code-Rift.git"
set "REPO_DIR=%~dp0"
set "SITE=%~1"
if /I "%SITE%"=="--help" goto :help
if "%SITE%"=="" set "SITE=local"

cd /d "%REPO_DIR%" || goto :cd_error
where git >nul 2>nul || goto :no_git

if not exist ".git" (
  echo [INFO] 尚未初始化 Git，正在建立 main 分支...
  git init -b main || goto :failed
)

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "ORIGIN=%%R"
if not defined ORIGIN (
  git remote add origin "%REPO_URL%" || goto :failed
) else if /I not "!ORIGIN!"=="%REPO_URL%" (
  echo [ERROR] origin 指向其他位置：!ORIGIN!
  echo 預期位置：%REPO_URL%
  echo 為避免推錯 Repository，已停止。
  goto :failed
)

for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH (
  git switch -c main 2>nul || git checkout -b main || goto :failed
  set "BRANCH=main"
)

if /I not "!BRANCH!"=="main" (
  echo [ERROR] 目前位於 !BRANCH!，同步腳本只允許 main 分支。
  goto :failed
)

echo [INFO] 檢查 GitHub 是否有較新的內容...
git fetch origin --prune || goto :network_error

if exist ".git\refs\remotes\origin\main" goto :check_remote
for /f "delims=" %%H in ('git rev-parse --verify refs/remotes/origin/main 2^>nul') do set "REMOTE_HEAD=%%H"
if not defined REMOTE_HEAD goto :prepare_commit

:check_remote
for /f "tokens=1,2" %%A in ('git rev-list --left-right --count HEAD...origin/main 2^>nul') do (
  set "AHEAD=%%A"
  set "BEHIND=%%B"
)
if defined BEHIND if not "!BEHIND!"=="0" (
  echo [STOP] GitHub 比本機新 !BEHIND! 個提交。
  echo 請先執行 sync-download.bat，確認內容後再上傳。
  goto :failed
)

:prepare_commit
git add -A || goto :failed
for /f "delims=" %%S in ('git status --porcelain') do set "HAS_CHANGES=1"
if defined HAS_CHANGES (
  for /f "tokens=1-3 delims=/ " %%a in ("%date%") do set "DATESTAMP=%%a-%%b-%%c"
  for /f "tokens=1-2 delims=:., " %%a in ("%time%") do set "TIMESTAMP=%%a%%b"
  git commit -m "sync(!SITE!): !DATESTAMP! !TIMESTAMP!" || goto :commit_error
) else (
  echo [INFO] 沒有未提交的檔案變更。
)

git rev-parse --verify HEAD >nul 2>nul || goto :nothing_to_push
echo [INFO] 上傳 main 到 GitHub...
git push -u origin main || goto :push_error

echo.
echo [OK] 上傳完成。位置標記：!SITE!
goto :end

:help
echo 用法：sync-upload.bat [位置標記]
echo 範例：sync-upload.bat A
echo       sync-upload.bat B
echo.
echo 功能：加入所有變更、建立同步提交並推送 main。
echo 安全：若 GitHub 較新、遠端錯誤或分支不是 main，腳本會停止。
goto :end

:no_git
echo [ERROR] 找不到 Git。請先安裝 Git for Windows。
goto :failed
:cd_error
echo [ERROR] 無法進入腳本所在資料夾。
goto :failed
:network_error
echo [ERROR] 無法連線 GitHub。請檢查網路與登入狀態。
goto :failed
:commit_error
echo [ERROR] 無法建立提交。請檢查 git user.name 與 user.email。
goto :failed
:nothing_to_push
echo [STOP] 目前沒有可上傳的提交。
goto :failed
:push_error
echo [ERROR] 推送失敗。首次使用時可能需要完成 GitHub 登入。
goto :failed
:failed
exit /b 1
:end
endlocal
exit /b 0