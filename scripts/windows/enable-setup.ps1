<#  setup-heart4edu-net.ps1
    Heart4Edu – Windows network helper for local Docker + mDNS + ESP32
    - Auto elevate
    - PortProxy: 15173->5173, 18000->8000, 18080->8080
    - Firewall Private rules
    - Restart Bonjour (if present)
    - Optional: disable VMware VMnet adapters (avoid mDNS confusion)
#>

[CmdletBinding()]
param(
  [int]$BackendPort   = 8000,
  [int]$FrontendPort  = 5173,
  [int]$NginxPort     = 8080,

  [int]$PP_Backend    = 18000,
  [int]$PP_Frontend   = 15173,
  [int]$PP_Nginx      = 18080,

  [switch]$OpenMDNS   = $true,     # open UDP 5353 on Private
  [switch]$DisableVM  = $false     # disable VMware VMnet1/8 to keep mDNS clean
)

# --- Self-elevate (UAC) ---
$curr = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $curr.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Host "Requesting Administrator privileges..." -ForegroundColor Yellow
  $args = @("-NoProfile","-ExecutionPolicy","Bypass","-File","`"$PSCommandPath`"")
  Start-Process -FilePath "powershell.exe" -ArgumentList $args -Verb RunAs
  exit
}

Write-Host "Running as Administrator." -ForegroundColor Green

# --- Helper functions ---
function Ensure-FirewallRule {
  param([string]$Name,[int]$Port,[string]$Protocol="TCP")
  $rule = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
  if (-not $rule) {
    New-NetFirewallRule -DisplayName $Name -Direction Inbound -Profile Private -Action Allow -Protocol $Protocol -LocalPort $Port | Out-Null
    Write-Host "Firewall (Private) allowed: $Name" -ForegroundColor Cyan
  } else {
    Set-NetFirewallRule -DisplayName $Name -Profile Private -Enabled True | Out-Null
    Write-Host "Firewall rule already present: $Name" -ForegroundColor DarkCyan
  }
}

function Add-PortProxy {
  param([int]$ListenPort,[int]$ConnectPort,[string]$ListenAddress="0.0.0.0",[string]$ConnectAddress="127.0.0.1")
  # remove if exists (idempotent)
  try { netsh interface portproxy delete v4tov4 listenaddress=$ListenAddress listenport=$ListenPort | Out-Null } catch {}
  # add fresh
  netsh interface portproxy add v4tov4 listenport=$ListenPort listenaddress=$ListenAddress connectport=$ConnectPort connectaddress=$ConnectAddress | Out-Null
  Write-Host "PortProxy: ${ListenAddress}:${ListenPort}  ->  ${ConnectAddress}:${ConnectPort}" -ForegroundColor Magenta
}

# --- Ensure IP Helper service (needed for portproxy) ---
Write-Host "Ensuring 'IP Helper' service is running..." -NoNewline
Set-Service iphlpsvc -StartupType Automatic
Start-Service iphlpsvc
Write-Host " OK" -ForegroundColor Green

# --- Optional: Disable VMware VMnet adapters (avoid mDNS returning VMnet IPs) ---
if ($DisableVM) {
  Write-Host "Disabling VMware VMnet adapters..." -ForegroundColor Yellow
  Get-NetAdapter -Name "VMware Network Adapter VMnet1","VMware Network Adapter VMnet8" -ErrorAction SilentlyContinue |
    Where-Object {$_.Status -ne 'Disabled'} |
    Disable-NetAdapter -Confirm:$false -ErrorAction SilentlyContinue
}

# --- Create PortProxy mappings ---
Add-PortProxy -ListenPort $PP_Backend  -ConnectPort $BackendPort   # 18000 -> 8000
Add-PortProxy -ListenPort $PP_Frontend -ConnectPort $FrontendPort  # 15173 -> 5173
Add-PortProxy -ListenPort $PP_Nginx    -ConnectPort $NginxPort     # 18080 -> 8080 (optional use)

Write-Host "`nCurrent PortProxy table:" -ForegroundColor Gray
netsh interface portproxy show v4tov4

# --- Firewall rules (Private) ---
Ensure-FirewallRule "Heart4Edu Port $BackendPort (Private)"                  $BackendPort   'TCP'
Ensure-FirewallRule "Heart4Edu Port $FrontendPort (Private)"                 $FrontendPort  'TCP'
Ensure-FirewallRule "Heart4Edu Port $NginxPort (Private)"                    $NginxPort     'TCP'

Ensure-FirewallRule "Heart4Edu PortProxy $PP_Backend->$BackendPort (Private)"    $PP_Backend   'TCP'
Ensure-FirewallRule "Heart4Edu PortProxy $PP_Frontend->$FrontendPort (Private)"  $PP_Frontend  'TCP'
Ensure-FirewallRule "Heart4Edu PortProxy $PP_Nginx->$NginxPort (Private)"        $PP_Nginx     'TCP'

if ($OpenMDNS) {
  Ensure-FirewallRule "Heart4Edu mDNS 5353 (Private)" 5353 'UDP'
}

# --- Restart Bonjour Service if present (refresh mDNS) ---
$bj = Get-Service "Bonjour Service" -ErrorAction SilentlyContinue
if ($bj) {
  try { Restart-Service "Bonjour Service" -ErrorAction Stop; Write-Host "Bonjour restarted." -ForegroundColor Green }
  catch { Write-Host "Bonjour found but could not restart: $_" -ForegroundColor Yellow }
} else {
  Write-Host "Bonjour service not found. If using Windows + mDNS, install Bonjour Print Services." -ForegroundColor Yellow
}

# --- Show quick info & test hints ---
$hostLower = $env:COMPUTERNAME.ToLower()
$lan = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } | Select-Object -First 1
$lanIp = $lan.IPv4Address.IPAddress

Write-Host "`n=== Summary ===" -ForegroundColor White
Write-Host (" Hostname (mDNS):  {0}.local" -f $hostLower)
Write-Host (" LAN IPv4:         {0}" -f ($lanIp))
Write-Host (" FE via proxy:     http://{0}.local:{1}/" -f $hostLower,$PP_Frontend)
Write-Host (" BE via proxy:     http://{0}.local:{1}/health" -f $hostLower,$PP_Backend)
Write-Host (" (Optional nginx)  http://{0}.local:{1}/" -f $hostLower,$PP_Nginx)

Write-Host "`nTry tests (in PowerShell):" -ForegroundColor White
Write-Host ("  curl http://localhost:{0}/health" -f $BackendPort)
Write-Host ("  curl http://{0}.local:{1}/health" -f $hostLower,$PP_Backend)
Write-Host ("  curl http://{0}.local:{1}/" -f $hostLower,$PP_Frontend)

Write-Host "`nDone." -ForegroundColor Green
