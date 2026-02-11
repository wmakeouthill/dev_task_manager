# Inicia o Dev Task Manager: backend (WebApi), frontend (React) e janela desktop (WPF + WebView2).
# Tudo com hot reload: API (dotnet watch), frontend (Vite HMR), Desktop (dotnet watch reinicia o app).
# Uso: .\start-app.ps1
# Requer: .NET 9 SDK, Node.js 18+, Windows (para WPF).

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Dev Task Manager - Iniciando com hot reload (frontend, backend, desktop)..." -ForegroundColor Cyan

# 0. Liberar portas 5011 (API) e 5173 (Vite) se estiverem em uso (ex.: execução anterior)
foreach ($port in @(5173, 5011)) {
    $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($conn) {
        $processIds = $conn.OwningProcess | Sort-Object -Unique
        foreach ($processId in $processIds) {
            Write-Host "Liberando porta ${port} (encerrando processo PID $processId)..." -ForegroundColor DarkGray
            Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 1
    }
}

# 1. Frontend (React + Vite) primeiro – npm run dev com HMR; cmd.exe para garantir PATH e pasta correta
Write-Host "Iniciando frontend (React + Vite HMR)..." -ForegroundColor Yellow
$frontendDir = Join-Path $root "frontend"
$frontendProcess = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", "cd /d `"$frontendDir`" && npm run dev" -WorkingDirectory $root -PassThru -WindowStyle Normal

# 2. Backend (API) com dotnet watch = hot reload ao editar C#
Write-Host "Iniciando backend (WebApi) com dotnet watch..." -ForegroundColor Yellow
$apiProcess = Start-Process -FilePath "dotnet" -ArgumentList "watch", "run", "--project", "$root\src\WebApi" -WorkingDirectory $root -PassThru -WindowStyle Normal

# 3. Aguardar o frontend (Vite) responder em localhost:5173 antes de abrir o Desktop
Write-Host "Aguardando frontend em http://localhost:5173 ..." -ForegroundColor Gray
$frontendUrl = "http://localhost:5173"
$maxWaitSeconds = 60
$waited = 0
$frontendReady = $false
while ($waited -lt $maxWaitSeconds) {
    try {
        $null = Invoke-WebRequest -Uri $frontendUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        $frontendReady = $true
        Write-Host "Frontend pronto em ${waited}s." -ForegroundColor Green
        break
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "  ... ${waited}s" -ForegroundColor DarkGray
    }
}
if (-not $frontendReady) {
    Write-Warning "Frontend não respondeu em ${maxWaitSeconds}s. Verifique a janela do frontend (npm run dev). Abrindo Desktop mesmo assim..."
}

# 4. Desktop (WPF + WebView2) com dotnet watch - reinicia o app ao editar C#/XAML
Write-Host "Abrindo janela desktop (WPF + WebView2) com dotnet watch..." -ForegroundColor Green
Push-Location $root
try {
    & dotnet watch run --project "$root\src\Desktop"
} finally {
    Pop-Location
}

# 5. Ao fechar o app desktop, encerrar backend e frontend
Write-Host "Encerrando backend e frontend..." -ForegroundColor Gray
Stop-Process -Id $apiProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
# npm pode ter deixado processo node (Vite) ativo; tenta encerrar processos node do frontend
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.Path -like "*$root*" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Encerrado." -ForegroundColor Cyan
