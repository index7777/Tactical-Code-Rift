@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
set "REPO_URL=https://github.com/index7777/Tactical-Code-Rift.git"
set "SITE=%~1"
if /I "%SITE%"=="--help" goto :help
if "%SITE%"=="" set "SITE=local"
cd /d "%~dp0" || goto :failed
where git >nul 2>nul || goto :no_git
if not exist ".git" goto :not_repo
for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "ORIGIN=%%R"
if not defined ORIGIN goto :no_origin
if /I not "!ORIGIN!"=="%REPO_URL%" goto :wrong_origin
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH goto :detached
echo [INFO] Fetching origin before upload...
git fetch origin --prune || goto :network_error
git rev-parse --verify "refs/remotes/origin/!BRANCH!" >nul 2>nul
if errorlevel 1 goto :preview
for /f "tokens=1,2" %%A in ('git rev-list --left-right --count "HEAD...origin/!BRANCH!" 2^>nul') do (set "AHEAD=%%A"& set "BEHIND=%%B")
if defined BEHIND if not "!BEHIND!"=="0" goto :behind
:preview
echo.
echo [REVIEW] Current branch: !BRANCH!
echo [REVIEW] Tracked and untracked files that will be included:
echo ----------------------------------------------------------------
git status --short
echo ----------------------------------------------------------------
for /f "delims=" %%S in ('git status --porcelain') do set "HAS_CHANGES=1"
if not defined HAS_CHANGES goto :push_existing
set "CONFIRM="
set /p "CONFIRM=Type YES to stage all files shown above: "
if /I not "!CONFIRM!"=="YES" goto :cancelled_before_stage
git add -A || goto :failed
echo [REVIEW] Staged changes:
git status --short
set "CONFIRM_COMMIT="
set /p "CONFIRM_COMMIT=Type COMMIT to create the sync commit: "
if /I not "!CONFIRM_COMMIT!"=="COMMIT" goto :unstage_cancel
for /f %%D in ('powershell -NoProfile -Command "Get-Date -Format yyyy-MM-dd_HHmm"') do set "STAMP=%%D"
git commit -m "sync(!SITE!): !STAMP!" || goto :commit_error
:push_existing
git rev-parse --verify HEAD >nul 2>nul || goto :nothing_to_push
echo [INFO] Ready to push !BRANCH! to origin/!BRANCH!.
set "CONFIRM_PUSH="
set /p "CONFIRM_PUSH=Type PUSH to continue: "
if /I not "!CONFIRM_PUSH!"=="PUSH" goto :push_cancelled
git push -u origin "!BRANCH!" || goto :push_error
echo [OK] !BRANCH! was uploaded successfully. Source: !SITE!
goto :end
:help
echo Usage: sync-upload.bat [source-label]
echo Reviews, stages, commits, and pushes the current branch.
goto :end
:no_git
echo [ERROR] Git for Windows was not found.
goto :failed
:not_repo
echo [ERROR] This folder is not a Git repository. Use sync-first-clone.bat first.
goto :failed
:no_origin
echo [ERROR] Remote origin is not configured.
goto :failed
:wrong_origin
echo [ERROR] origin does not match %REPO_URL%. Actual: !ORIGIN!
goto :failed
:detached
echo [ERROR] Detached HEAD is not supported.
goto :failed
:network_error
echo [ERROR] Could not fetch from GitHub.
goto :failed
:behind
echo [STOP] origin/!BRANCH! is !BEHIND! commit(s) ahead. Download first.
goto :failed
:cancelled_before_stage
echo [CANCELLED] No commit or push was performed.
goto :failed
:push_cancelled
echo [CANCELLED] Nothing was pushed. Any commit created above remains local.
goto :failed
:unstage_cancel
git reset >nul 2>nul
echo [CANCELLED] Staging was reverted. Working files were not changed.
goto :failed
:commit_error
echo [ERROR] Commit failed. Check git user.name and user.email.
goto :failed
:nothing_to_push
echo [STOP] There is no commit to push.
goto :failed
:push_error
echo [ERROR] Push failed. Check authentication and branch permissions.
goto :failed
:failed
exit /b 1
:end
endlocal
exit /b 0
