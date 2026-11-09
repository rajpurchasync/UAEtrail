# Opens Windows so phones on the same LAN can reach Vite (5175).
# Run once: Right-click PowerShell -> Run as administrator, then:
#   cd <repo>; npm run dev:phone-access

$ErrorActionPreference = 'Stop'
$port = 5175
$ruleName = 'UAE Trail Vite Dev 5175'

Write-Host '[dev:phone-access] Setting Wi-Fi to Private (allows LAN sharing)...'
try {
  Get-NetConnectionProfile -ErrorAction SilentlyContinue |
    Where-Object { $_.IPv4Connectivity -ne 'Disconnected' } |
    ForEach-Object { Set-NetConnectionProfile -InterfaceIndex $_.InterfaceIndex -NetworkCategory Private }
} catch {
  Write-Host "[dev:phone-access] Could not set Private profile: $_"
}

$existing = netsh advfirewall firewall show rule name="$ruleName" 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "[dev:phone-access] Adding firewall allow for TCP $port..."
  netsh advfirewall firewall add rule name="$ruleName" dir=in action=allow protocol=TCP localport=$port profile=any
  if ($LASTEXITCODE -ne 0) {
    Write-Host '[dev:phone-access] Firewall rule failed. Re-run this script as Administrator.'
    exit 1
  }
} else {
  Write-Host "[dev:phone-access] Firewall rule already present: $ruleName"
}

$wifi = Get-NetConnectionProfile | Where-Object { $_.IPv4Connectivity -ne 'Disconnected' } | Select-Object -First 1
if ($wifi -and $wifi.Name -match 'free|guest|hotel|airport|public') {
  Write-Host ''
  Write-Host '[dev:phone-access] GUEST WI-FI DETECTED — phones often cannot reach your PC on this network.'
  Write-Host '  Use Windows Mobile Hotspot instead:'
  Write-Host '    Settings -> Network & internet -> Mobile hotspot -> On'
  Write-Host '    Connect your phone to THAT hotspot, then use the new IP Vite prints (often 192.168.137.x).'
  Write-Host ''
  Start-Process 'ms-settings:network-mobilehotspot'
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias 'Wi-Fi' -ErrorAction SilentlyContinue |
  Where-Object { $_.IPAddress -notlike '169.254*' } |
  Select-Object -First 1).IPAddress
if ($ip) {
  Write-Host "[dev:phone-access] On phone browser open: http://${ip}:$port/"
} else {
  Write-Host "[dev:phone-access] Start npm run dev:local and use the Network URL from the terminal."
}
Write-Host '[dev:phone-access] Done.'
