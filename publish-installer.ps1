# Gera a pasta portátil E o instalador Windows.
# Uso: .\publish-installer.ps1
#
# Requisitos: .NET 9 SDK, Node.js 18+, Inno Setup 6
#   Inno Setup: https://jrsoftware.org/isinfo.php

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

Write-Host "Dev Task Manager - Build portátil + instalador" -ForegroundColor Cyan

# 1. Gerar pasta portátil
Write-Host "`n[1/2] Gerando pasta portátil..." -ForegroundColor Yellow
& "$root\publish-portable.ps1"

# 2. Compilar instalador com Inno Setup
Write-Host "`n[2/2] Compilando instalador..." -ForegroundColor Yellow

$isccPaths = @(
    "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
    "${env:ProgramFiles}\Inno Setup 6\ISCC.exe",
    "${env:LOCALAPPDATA}\Programs\Inno Setup 6\ISCC.exe",
    "ISCC.exe"
)

$iscc = $null
foreach ($p in $isccPaths) {
    if (Test-Path $p) {
        $iscc = $p
        break
    }
    if ($p -eq "ISCC.exe") {
        $iscc = (Get-Command $p -ErrorAction SilentlyContinue).Source
        if ($iscc) { break }
    }
}

if (-not $iscc) {
    Write-Host "ERRO: Inno Setup 6 não encontrado." -ForegroundColor Red
    Write-Host "Instale em: https://jrsoftware.org/isinfo.php" -ForegroundColor Yellow
    exit 1
}

$issFile = Join-Path $root "installer.iss"
Push-Location $root
try {
    & $iscc $issFile
    if ($LASTEXITCODE -ne 0) { throw "Compilação do instalador falhou" }
} finally {
    Pop-Location
}

$distDir = Join-Path $root "dist"
$installer = Get-ChildItem $distDir -Filter "*.exe" -ErrorAction SilentlyContinue | Select-Object -First 1

Write-Host "`nConcluído!" -ForegroundColor Green
Write-Host "  Pasta portátil: $root\publish\" -ForegroundColor Cyan
Write-Host "  Instalador:     $distDir\$($installer.Name)" -ForegroundColor Cyan
