@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
set "REPO_URL=https://github.com/index7777/Tactical-Code-Rift.git"
cd /d "%~dp0" || goto :failed
if /I "%~1"=="--help" goto :help
where git >nul 2>nul || goto :no_git
if not exist ".git" goto :not_repo
for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "ORIGIN=%%R"
if not defined ORIGIN goto :no_origin
if /I not "!ORIGIN!"=="%REPO_URL%" goto :wrong_origin
for /f "delims=" %%B in ('git branch --show-current 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH goto :detached
for /f "delims=" %%S in ('git status --porcelain') do set "DIRTY=1"
if defined DIRTY goto :dirty
echo [INFO] Fetching origin...
git fetch origin --prune || goto :network_error
git rev-parse --verify "refs/remotes/origin/!BRANCH!" >nul 2>nul || goto :no_remote_branch
echo [INFO] Updating !BRANCH! with fast-forward only...
git merge --ff-only "origin/!BRANCH!" || goto :diverged
echo [OK] !BRANCH! is synchronized with origin/!BRANCH!.
goto :end
:help
echo Usage: sync-download.bat
echo Fetches and fast-forwards the current branch. The working tree must be clean.
goto :end
:no_git
echo [ERROR] Git for Windows was not found.
goto :failed
:not_repo
echo [ERROR] This folder is not a Git repository.
goto :failed
:no_origin
echo [ERROR] Remote origin is not configured.
goto :failed
:wrong_origin
echo [ERROR] origin does not match %REPO_URL%.
echo [ERROR] Actual: !ORIGIN!
goto :failed
:detached
echo [ERROR] Detached HEAD is not supported.
goto :failed
:dirty
echo [STOP] The working tree has uncommitted changes. Upload or commit first.
git status --short
goto :failed
:network_error
echo [ERROR] Could not fetch from GitHub.
goto :failed
:no_remote_branch
echo [STOP] origin/!BRANCH! does not exist. Upload this branch first.
goto :failed
:diverged
echo [STOP] The histories cannot be fast-forwarded safely. Resolve them manually.
goto :failed
:failed
exit /b 1
:end
endlocal
exit /b 0
