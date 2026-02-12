# Empacota o Dev Task Manager como aplicação portátil para Windows 10/11.
# Uso: .\publish-portable.ps1
# Saída: pasta publish/ com DevTaskManager.Desktop.exe (launcher), WebApi e SPA.
#
# Requisitos: .NET 9 SDK, Node.js 18+

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$publishDir = Join-Path $root "publish"

Write-Host "Dev Task Manager - Build portátil para Windows 10/11" -ForegroundColor Cyan

# 0. Instalar dependências do frontend se necessário
Write-Host "`n[0/5] Verificando frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $root "frontend"
if (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-Host "  Executando npm install..." -ForegroundColor Gray
    Push-Location $frontendDir
    npm install
    Pop-Location
}

# 1. Build do frontend (React)
Write-Host "`n[1/5] Buildando frontend..." -ForegroundColor Yellow
$frontendDir = Join-Path $root "frontend"
Push-Location $frontendDir
try {
    npm run build
    if (-not (Test-Path "dist")) {
        throw "Pasta dist não foi criada"
    }
} finally {
    Pop-Location
}

# 2. Criar wwwroot na WebApi com o SPA
Write-Host "`n[2/5] Copiando SPA para WebApi wwwroot..." -ForegroundColor Yellow
$wwwroot = Join-Path $root "src\WebApi\wwwroot"
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }
New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
Copy-Item -Path (Join-Path $frontendDir "dist\*") -Destination $wwwroot -Recurse -Force

# 3. Publicar WebApi (self-contained, single-file, win-x64)
Write-Host "`n[3/5] Publicando WebApi..." -ForegroundColor Yellow
if (Test-Path $publishDir) { Remove-Item $publishDir -Recurse -Force }
New-Item -ItemType Directory -Path $publishDir -Force | Out-Null

$webApiArgs = @(
    "publish",
    (Join-Path $root "src\WebApi\DevTaskManager.WebApi.csproj"),
    "-c", "Release",
    "-o", $publishDir,
    "-r", "win-x64",
    "--self-contained", "true",
    "-p:PublishSingleFile=true",
    "-p:IncludeNativeLibrariesForSelfExtract=true"
)
& dotnet $webApiArgs
if ($LASTEXITCODE -ne 0) { throw "Publish WebApi falhou" }

# 4. Publicar Desktop na mesma pasta (inclui DevTaskManager.Desktop.exe)
Write-Host "`n[4/5] Publicando Desktop..." -ForegroundColor Yellow
$desktopArgs = @(
    "publish",
    (Join-Path $root "src\Desktop\DevTaskManager.Desktop.csproj"),
    "-c", "Release",
    "-o", $publishDir,
    "-r", "win-x64",
    "--self-contained", "true",
    "-p:PublishSingleFile=true",
    "-p:IncludeNativeLibrariesForSelfExtract=true",
    "-p:WebView2LoaderPreference=Static"
)
& dotnet $desktopArgs
if ($LASTEXITCODE -ne 0) { throw "Publish Desktop falhou" }

# 5. Copiar arquivos de configuração
Write-Host "`n[5/5] Copiando configurações..." -ForegroundColor Yellow
$webApiDir = Join-Path $root "src\WebApi"
Copy-Item (Join-Path $webApiDir "appsettings.json") -Destination $publishDir -Force -ErrorAction SilentlyContinue
Copy-Item (Join-Path $webApiDir "appsettings.Development.json") -Destination $publishDir -Force -ErrorAction SilentlyContinue
if (Test-Path (Join-Path $webApiDir ".env.example")) {
    Copy-Item (Join-Path $webApiDir ".env.example") -Destination (Join-Path $publishDir ".env.example") -Force
}

# Remover wwwroot temporário do src (não versionar)
if (Test-Path $wwwroot) { Remove-Item $wwwroot -Recurse -Force }

Write-Host "`nConcluído! Aplicação em: $publishDir" -ForegroundColor Green
Write-Host "Execute: DevTaskManager.Desktop.exe" -ForegroundColor Cyan
Write-Host "`nCompatibilidade: Windows 10 1809+ e Windows 11 (x64)" -ForegroundColor Gray
Write-Host "WebView2: Baixe em https://developer.microsoft.com/microsoft-edge/webview2/ se necessário" -ForegroundColor Gray
