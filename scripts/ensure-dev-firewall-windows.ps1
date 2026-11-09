# Allow phones on the same Wi-Fi to reach Vite (port 5175). Requires Administrator once.
$ruleName = 'UAE Trail Vite Dev 5175'
$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "[dev:firewall] Rule already exists: $ruleName"
  exit 0
}

Write-Host "[dev:firewall] Adding inbound allow for TCP 5175 (all network profiles)..."
netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=5175 profile=any
if ($LASTEXITCODE -ne 0) {
  Write-Host '[dev:firewall] Failed - re-run PowerShell as Administrator.'
  exit 1
}
Write-Host '[dev:firewall] OK - retry opening your Wi-Fi URL from the dev terminal on your phone.'
