# 01_install_prereqs.ps1
# Git と Python 3.10 をインストール
# Python 3.11+ は Forge で動作不良の可能性があるため 3.10 固定

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$InstallRoot = "$env:USERPROFILE\AI"

# インストール先フォルダ作成
if (-not (Test-Path $InstallRoot)) {
    Write-Host "インストール先フォルダ作成: $InstallRoot" -ForegroundColor Cyan
    New-Item -ItemType Directory -Path $InstallRoot -Force | Out-Null
}

# Git チェック
Write-Host "Git の確認..." -ForegroundColor Cyan
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
    $gitVer = (git --version) 2>&1
    Write-Host "  ✓ Git 既にインストール済み: $gitVer" -ForegroundColor Green
} else {
    Write-Host "  Git をインストールします..." -ForegroundColor Cyan
    winget install --id Git.Git -e --source winget --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Git インストール失敗" -ForegroundColor Red
        exit 1
    }
    # PATH 反映
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    Write-Host "  ✓ Git インストール完了" -ForegroundColor Green
}

# Python 3.10 チェック
Write-Host ""
Write-Host "Python 3.10 の確認..." -ForegroundColor Cyan

# py launcher で 3.10 が使えるか確認
$hasPy310 = $false
try {
    $pyVer = (py -3.10 --version) 2>&1
    if ($pyVer -match "Python 3\.10\.") {
        Write-Host "  ✓ Python 3.10 既にインストール済み: $pyVer" -ForegroundColor Green
        $hasPy310 = $true
    }
} catch { }

if (-not $hasPy310) {
    Write-Host "  Python 3.10 をインストールします..." -ForegroundColor Cyan
    winget install --id Python.Python.3.10 -e --source winget --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Python 3.10 インストール失敗" -ForegroundColor Red
        exit 1
    }
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

    # 確認
    try {
        $pyVer = (py -3.10 --version) 2>&1
        Write-Host "  ✓ Python 3.10 インストール完了: $pyVer" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Python 3.10 は入りましたが PATH 反映に再起動が必要かもしれません。" -ForegroundColor Yellow
        Write-Host "  PC を再起動してから続きのスクリプトを実行してください。" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "STEP 1 完了。" -ForegroundColor Green
