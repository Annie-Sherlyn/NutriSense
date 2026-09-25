param(
    [int]$Port = 8000
)

$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$appRoot = Split-Path -Parent $PSScriptRoot
$logPath = Join-Path $appRoot "backend.log"
$errorLogPath = Join-Path $appRoot "backend.error.log"

$listener = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
    try {
        $health = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/food/health" -UseBasicParsing -TimeoutSec 3
        if ($health.StatusCode -eq 200) {
            Write-Host "NutriSense backend is already running on port $Port."
            exit 0
        }
    } catch {
        $process = Get-Process -Id $listener[0].OwningProcess -ErrorAction SilentlyContinue
        if (-not $process) {
            throw "Port $Port is still reserved by a terminated process (PID $($listener[0].OwningProcess)). Close the old terminal or restart Windows, then retry."
        }
        throw "Port $Port is occupied by $($process.ProcessName) (PID $($listener[0].OwningProcess)). Stop it or choose another port."
    }
}

$python = Get-Command python -ErrorAction Stop
$arguments = @("-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "$Port")
Start-Process -FilePath $python.Source `
    -ArgumentList $arguments `
    -WorkingDirectory $projectRoot `
    -RedirectStandardOutput $logPath `
    -RedirectStandardError $errorLogPath `
    -WindowStyle Hidden

Write-Host "NutriSense backend started in the background on http://127.0.0.1:$Port"
Write-Host "Logs: $logPath"