# 02_clone_forge.ps1
# WebUI Forge を C:\Users\nozom\AI\ に clone する

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$InstallRoot = "$env:USERPROFILE\AI"
$ForgeDir    = Join-Path $InstallRoot "stable-diffusion-webui-forge"

if (-not (Test-Path $InstallRoot)) {
    New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
}

if (Test-Path $ForgeDir) {
    Write-Host "✓ Forge は既に存在します: $ForgeDir" -ForegroundColor Yellow
    Write-Host "  更新するには: cd `"$ForgeDir`"; git pull" -ForegroundColor Yellow
    exit 0
}

Write-Host "WebUI Forge を clone します..." -ForegroundColor Cyan
Write-Host "  DL先: $ForgeDir" -ForegroundColor Cyan
Write-Host "  (約1GB、数分かかります)" -ForegroundColor Yellow

Push-Location $InstallRoot
try {
    git clone https://github.com/lllyasviel/stable-diffusion-webui-forge
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ clone 失敗" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}

# models フォルダ構造を確認 (Forge は最初から作るがdiffusion_modelsが無い場合に備え)
$requiredDirs = @(
    "$ForgeDir\models\Stable-diffusion",
    "$ForgeDir\models\diffusion_models",
    "$ForgeDir\models\text_encoder",
    "$ForgeDir\models\VAE",
    "$ForgeDir\models\Lora"
)
foreach ($d in $requiredDirs) {
    if (-not (Test-Path $d)) {
        New-Item -ItemType Directory -Path $d -Force | Out-Null
        Write-Host "  ✓ 作成: $d" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "✓ Forge clone 完了: $ForgeDir" -ForegroundColor Green
Write-Host ""
Write-Host "STEP 2 完了。" -ForegroundColor Green
