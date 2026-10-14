Write-Host "🔍 Inspecting .env for MongoDB configuration..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No .env file found." -ForegroundColor Red
    exit 1
}

# 1. Read .env and find a valid MongoDB URI if MONGODB_URI is missing
$envContent = Get-Content ".env"
$hasMongoUri = $false
$foundUri = ""

foreach ($line in $envContent) {
    if ($line -match "^\s*MONGODB_URI\s*=") {
        $hasMongoUri = $true
    }
    if ($line -match "^\s*(MONGODB_URI|MONGODB_URI_TEST)\s*=\s*(.+)") {
        $foundUri = $Matches[2].Trim().Trim('"', "'")
    }
}

# 2. If MONGODB_URI isn't explicitly defined, inject it temporarily for Docker Compose
if (-not $hasMongoUri -and -not [string]::IsNullOrEmpty($foundUri)) {
    Write-Host "⚙️ MONGODB_URI not found explicitly; mapping from detected database URI..." -ForegroundColor Yellow
    # Temporarily append or set environment variable for the current PowerShell session
    $env:MONGODB_URI = $foundUri
}

Write-Host "🧹 Tearing down existing Docker containers, networks, and volumes..." -ForegroundColor Cyan
docker compose down --volumes --remove-orphans

Write-Host "🗑️ Pruning dangling build caches and unused system data..." -ForegroundColor Cyan
docker system prune -f --volumes

Write-Host "🏗️ Rebuilding containers with no cache..." -ForegroundColor Cyan
docker compose build --no-cache

Write-Host "🚀 Starting fresh environment..." -ForegroundColor Cyan
docker compose up -d

Write-Host "✨ Clean build complete!" -ForegroundColor Green