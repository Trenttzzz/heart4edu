<#  cleanup-heart4edu-net.ps1
    Heart4Edu – cleanup PortProxy + Firewall on Windows

    Default removes:
      - PortProxy: 15173->5173, 18000->8000, 18080->8080
      - Firewall rules:
          "Heart4Edu Port 5173 (Private)"
          "Heart4Edu Port 8000 (Private)"
          "Heart4Edu Port 8080 (Private)"
          "Heart4Edu PortProxy 15173->5173 (Private)"
          "Heart4Edu PortProxy 18000->8000 (Private)"
          "Heart4Edu PortProxy 18080->8080 (Private)"
      - mDNS rule (UDP 5353) is KEPT by default (use -RemoveMDNS to delete)

    Usage examples:
      .\cleanup-heart4edu-net.ps1
      .\cleanup-heart4edu-net.ps1 -EnableVM
      .\cleanup-heart4edu-net.ps1 -RemoveMDNS   # also delete mDNS firewall rule
#>

[CmdletBinding()]
param(
  [int]$BackendPort   = 8000,
  [int]$FrontendPort  = 5173,
  [int]$NginxPort     = 8080,

  [int]$PP_Backend    = 18000,
  [int]$PP_Frontend   = 15173,
  [int]$PP_Nginx      = 18080,

  [switch]$EnableVM   = $false,

  # DEFAULT: keep mDNS firewall rule
  [switch]$KeepMDNS   = $true,

  # Convenience: if you pass -RemoveMDNS, it overrides KeepMDNS
  [switch]$RemoveMDNS = $false
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

function Remove-PortProxy {
  param([int]$ListenPort,[string]$ListenAddress="0.0.0.0")
  try {
    netsh interface portproxy delete v4tov4 listenaddress=$ListenAddress listenport=$ListenPort | Out-Null
    Write-Host "PortProxy removed: ${ListenAddress}:${ListenPort}" -ForegroundColor Magenta
  } catch {
    Write-Host "PortProxy not found: ${ListenAddress}:${ListenPort}" -ForegroundColor DarkGray
  }
}

function Remove-FirewallRuleByName {
  param([string]$Name)
  $rule = Get-NetFirewallRule -DisplayName $Name -ErrorAction SilentlyContinue
  if ($rule) {
    $rule | Remove-NetFirewallRule
    Write-Host "Firewall rule removed: $Name" -ForegroundColor Cyan
  } else {
    Write-Host "Firewall rule not found: $Name" -ForegroundColor DarkGray
  }
}

Write-Host "`n=== Removing PortProxy mappings ===" -ForegroundColor White
Remove-PortProxy -ListenPort $PP_Backend
Remove-PortProxy -ListenPort $PP_Frontend
Remove-PortProxy -ListenPort $PP_Nginx

Write-Host "`nCurrent PortProxy table (after removal):" -ForegroundColor Gray
netsh interface portproxy show v4tov4

Write-Host "`n=== Removing Firewall rules (Private) ===" -ForegroundColor White
Remove-FirewallRuleByName ("Heart4Edu Port {0} (Private)" -f $BackendPort)
Remove-FirewallRuleByName ("Heart4Edu Port {0} (Private)" -f $FrontendPort)
Remove-FirewallRuleByName ("Heart4Edu Port {0} (Private)" -f $NginxPort)

Remove-FirewallRuleByName ("Heart4Edu PortProxy {0}->{1} (Private)" -f $PP_Backend,$BackendPort)
Remove-FirewallRuleByName ("Heart4Edu PortProxy {0}->{1} (Private)" -f $PP_Frontend,$FrontendPort)
Remove-FirewallRuleByName ("Heart4Edu PortProxy {0}->{1} (Private)" -f $PP_Nginx,$NginxPort)

# mDNS rule handling
$reallyRemoveMDNS = ($RemoveMDNS.IsPresent) -or (-not $KeepMDNS.IsPresent)
if ($reallyRemoveMDNS) {
  Remove-FirewallRuleByName "Heart4Edu mDNS 5353 (Private)"
} else {
  Write-Host "Keeping mDNS firewall rule (UDP 5353) as requested." -ForegroundColor Yellow
}

if ($EnableVM) {
  Write-Host "`nRe-enabling VMware VMnet adapters..." -ForegroundColor Yellow
  Get-NetAdapter -Name "VMware Network Adapter VMnet1","VMware Network Adapter VMnet8" -ErrorAction SilentlyContinue |
    Where-Object {$_.Status -eq 'Disabled'} |
    Enable-NetAdapter -Confirm:$false -ErrorAction SilentlyContinue
}

Write-Host "`nCleanup complete." -ForegroundColor Green
Write-Host "Tip: verify with:" -ForegroundColor Gray
Write-Host "  netsh interface portproxy show v4tov4"