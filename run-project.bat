@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

set "NODE_MIN_VERSION=20.19.0"
set "NODE_BOOTSTRAP_VERSION=20.19.0"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" (
  set "NODE_ARCH=arm64"
) else (
  set "NODE_ARCH=x64"
)
set "NODE_INSTALL_ROOT=%LOCALAPPDATA%\uaetrail-tools"
set "NODE_INSTALL_DIR=%NODE_INSTALL_ROOT%\node-v%NODE_BOOTSTRAP_VERSION%-win-%NODE_ARCH%"
set "NODE_EXE=%NODE_INSTALL_DIR%\node.exe"

call :ensure_node

echo [1/6] Checking prerequisites...
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js %NODE_MIN_VERSION% or newer not found after bootstrap.
  exit /b 1
)
for /f "delims=" %%V in ('node --version') do set "NODE_ACTIVE_VERSION=%%V"
call :is_version_ge "!NODE_ACTIVE_VERSION!" "%NODE_MIN_VERSION%"
if errorlevel 1 (
  echo Node.js %NODE_MIN_VERSION% or newer is required ^(current: !NODE_ACTIVE_VERSION!^).
  exit /b 1
)

echo [2/6] Ensuring required environment defaults...
if "%JWT_ACCESS_SECRET%"=="" set "JWT_ACCESS_SECRET=dev-access-secret-dev-access-secret"
if "%JWT_REFRESH_SECRET%"=="" set "JWT_REFRESH_SECRET=dev-refresh-secret-dev-refresh-secret"
if "%S3_ACCESS_KEY_ID%"=="" set "S3_ACCESS_KEY_ID=minioadmin"
if "%S3_SECRET_ACCESS_KEY%"=="" set "S3_SECRET_ACCESS_KEY=minioadmin"
if "%APP_BASE_URL%"=="" set "APP_BASE_URL=http://localhost"
if "%APP_BASE_URLS%"=="" set "APP_BASE_URLS=http://localhost,http://localhost:5175"
if "%API_BASE_URL%"=="" set "API_BASE_URL=http://localhost:4000"
if "%VITE_API_BASE_URL%"=="" set "VITE_API_BASE_URL=/api/v1"
if "%FRONTEND_PORT%"=="" set "FRONTEND_PORT=5175"

set "RUNTIME_ENV_FILE=%TEMP%\uaetrail-runtime-env.txt"
if exist "%RUNTIME_ENV_FILE%" del "%RUNTIME_ENV_FILE%" >nul 2>nul

echo [3/6] Verifying host versions and workspace dependencies...
node scripts\run-project-preflight.mjs
if errorlevel 1 exit /b %errorlevel%

echo [4/6] Resolving runtime environment...
node scripts\resolve-runtime-env.mjs > "%RUNTIME_ENV_FILE%"
if errorlevel 1 (
  if exist "%RUNTIME_ENV_FILE%" del "%RUNTIME_ENV_FILE%" >nul 2>nul
  exit /b 1
)

for /f "usebackq tokens=1,* delims==" %%A in ("%RUNTIME_ENV_FILE%") do set "%%A=%%B"
if exist "%RUNTIME_ENV_FILE%" del "%RUNTIME_ENV_FILE%" >nul 2>nul

echo Using %MONGODB_URI_SOURCE% for RUN_ENV=%RUN_ENV%.

echo [5/6] Checking Docker engine status...
docker info >nul 2>nul
if errorlevel 1 (
  echo Docker is not ready yet. The preflight will attempt install/start if possible.
)

echo [6/6] Starting project stack...
node scripts\run-project.mjs %*
exit /b %errorlevel%

:ensure_node
if exist "%NODE_EXE%" (
  for /f "delims=" %%V in ('"%NODE_EXE%" --version') do set "NODE_EXE_VERSION=%%V"
  call :is_version_ge "!NODE_EXE_VERSION!" "%NODE_MIN_VERSION%"
  if not errorlevel 1 (
    set "PATH=%NODE_INSTALL_DIR%;%PATH%"
    exit /b 0
  )
)

where node >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%V in ('node --version') do set "NODE_CURRENT_VERSION=%%V"
  call :is_version_ge "!NODE_CURRENT_VERSION!" "%NODE_MIN_VERSION%"
  if not errorlevel 1 (
    exit /b 0
  )
)

echo Downloading Node.js %NODE_BOOTSTRAP_VERSION%...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $version='%NODE_BOOTSTRAP_VERSION%'; $arch='%NODE_ARCH%'; $root=$env:LOCALAPPDATA + '\uaetrail-tools'; $installDir=Join-Path $root ('node-v' + $version + '-win-' + $arch); $package='node-v' + $version + '-win-' + $arch + '.zip'; $url='https://nodejs.org/dist/v' + $version + '/' + $package; New-Item -ItemType Directory -Force -Path $root | Out-Null; $archive=Join-Path $env:TEMP $package; Invoke-WebRequest -Uri $url -OutFile $archive; if (Test-Path $installDir) { Remove-Item -Recurse -Force $installDir }; Expand-Archive -Path $archive -DestinationPath $root -Force; Move-Item -Force (Join-Path $root ('node-v' + $version + '-win-' + $arch)) $installDir; Remove-Item $archive -Force;"
if errorlevel 1 exit /b 1

set "PATH=%NODE_INSTALL_DIR%;%PATH%"
exit /b 0

:is_version_ge
setlocal
set "LEFT=%~1"
set "RIGHT=%~2"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$l='%LEFT%'.TrimStart('v','V').Split('-')[0]; $r='%RIGHT%'.TrimStart('v','V').Split('-')[0]; try { $lv=[version]$l; $rv=[version]$r; if ($lv -ge $rv) { exit 0 } else { exit 1 } } catch { exit 1 }"
set "RESULT=%ERRORLEVEL%"
endlocal & exit /b %RESULT%