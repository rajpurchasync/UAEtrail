Write-Host "[3/5] Checking MongoDB connection (VERBOSE MODE)..." -ForegroundColor Cyan

if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No .env file found." -ForegroundColor Red
    exit 1
}

Write-Host "`n--- 1. Parsing .env File ---" -ForegroundColor Yellow
# 1. Parse and export .env variables to the current process
Get-Content ".env" | ForEach-Object {
    $line = $_.Trim()
    if (![string]::IsNullOrWhiteSpace($line) -and -not $line.StartsWith("#")) {
        $splitIndex = $line.IndexOf("=")
        if ($splitIndex -gt 0) {
            $key = $line.Substring(0, $splitIndex).Trim()
            $val = $line.Substring($splitIndex + 1).Trim().Trim('"', "'")
            [Environment]::SetEnvironmentVariable($key, $val, "Process")
            
            # Safely mask the password before printing to the console
            $displayVal = $val
            if ($key -match "MONGO" -and $val -match "://.*:.*@") {
                $displayVal = $val -replace "://([^:]+):([^@]+)@", "://`$1:***@"
            }
            Write-Host "Found Variable: $key = $displayVal" -ForegroundColor DarkGray
        }
    }
}

# 2. Determine which URI to use
$uriToCheck = [Environment]::GetEnvironmentVariable("MONGODB_URI", "Process")
if ([string]::IsNullOrWhiteSpace($uriToCheck)) {
    $uriToCheck = [Environment]::GetEnvironmentVariable("MONGODB_URI_TEST", "Process")
}

if ([string]::IsNullOrWhiteSpace($uriToCheck)) {
    Write-Host "❌ Error: Neither MONGODB_URI nor MONGODB_URI_TEST is set in .env" -ForegroundColor Red
    exit 1
}

# Mask URI for safe display
$maskedUri = $uriToCheck -replace "://([^:]+):([^@]+)@", "://`$1:***@"
Write-Host "`n--- 2. Execution Variables ---" -ForegroundColor Yellow
Write-Host "Target URI: $maskedUri" -ForegroundColor Magenta
Write-Host "Raw URI Length: $($uriToCheck.Length) characters" -ForegroundColor DarkGray

# If you accidentally have an inline comment in your .env like MONGODB_URI=... # comment
# This length check will make it obvious!

[Environment]::SetEnvironmentVariable("URI_TO_CHECK", $uriToCheck, "Process")

# IMPORTANT: Enable verbose native MongoDB driver logs
[Environment]::SetEnvironmentVariable("DEBUG", "mongodb:*", "Process")

# 3. Temporarily grab the native mongo driver
Write-Host "`n--- 3. Fetching MongoDB Driver ---" -ForegroundColor Yellow
npm install mongodb --no-save

# 4. Execute the handshake using the native driver
Write-Host "`n--- 4. Running Node.js Test Script ---" -ForegroundColor Yellow
$nodeScript = @"
import { MongoClient } from 'mongodb';

console.log('[node] Node.js process started.');
const uri = process.env.URI_TO_CHECK;

console.log('[node] Initializing MongoClient...');
const client = new MongoClient(uri, { 
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000 
});

// Listen for network level topology events
client.on('serverHeartbeatFailed', (event) => console.error('[mongo-event] Heartbeat failed:', event.failure));
client.on('topologyClosed', (event) => console.log('[mongo-event] Topology closed'));

console.log('[node] Attempting client.connect()...');
client.connect()
  .then(() => { 
    console.log('[mongo] ✅ Connected to MongoDB cluster successfully.'); 
    console.log('[node] Pinging admin database...');
    return client.db().admin().ping();
  })
  .then(() => {
    console.log('[mongo] ✅ Admin ping successful.');
    return client.close();
  })
  .then(() => {
    console.log('[node] Exiting (0).');
    process.exit(0);
  })
  .catch(err => { 
    console.error('\n❌ [mongo] CONNECTION FAILED!');
    console.error('--- ERROR DUMP ---');
    console.error('Name:', err.name);
    console.error('Message:', err.message);
    console.error('Code:', err.code);
    console.error('CodeName:', err.codeName);
    console.error('Stack Trace:');
    console.error(err.stack);
    console.error('------------------\n');
    process.exit(1); 
  });
"@

$nodeScript | node --input-type=module

# 5. Exit with the appropriate status code
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Script exited with error code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}