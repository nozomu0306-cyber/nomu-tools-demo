# 04_install_docker.ps1
# Docker Desktop for Windows をインストールする
# Open WebUI を動かすのに必要

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Docker Desktop のインストールを確認します..." -ForegroundColor Cyan

# 既にインストール済みか
$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if ($dockerCmd) {
    try {
        $ver = docker --version
        Write-Host "Docker は既にインストール済みです: $ver" -ForegroundColor Green

        # Docker Desktop が動いているか確認
        try {
            docker info 2>&1 | Out-Null
            Write-Host "✓ Docker Desktop は起動中" -ForegroundColor Green
            exit 0
        } catch {
            Write-Host "Docker はインストール済みですが起動していません。Docker Desktop を起動してください..." -ForegroundColor Yellow
            Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
            Write-Host "起動待機中 (最大60秒)..." -ForegroundColor Cyan
            for ($i = 0; $i -lt 60; $i++) {
                Start-Sleep -Seconds 2
                try {
                    docker info 2>&1 | Out-Null
                    Write-Host "✓ Docker Desktop 起動完了" -ForegroundColor Green
                    exit 0
                } catch { }
            }
            Write-Host "✗ Docker Desktop の起動を確認できませんでした。手動で起動してから 05_start_openwebui.ps1 を実行してください。" -ForegroundColor Red
            exit 1
        }
    } catch { }
}

# winget でインストール
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetCmd) {
    Write-Host "winget で Docker Desktop をインストールします..." -ForegroundColor Cyan
    Write-Host "(約500MB、数分かかります)" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow
    Write-Host "⚠ 重要: Docker のインストーラが UAC プロンプト（管理者権限の確認）を出します。" -ForegroundColor Yellow
    Write-Host "  『このアプリがデバイスに変更を加えることを許可しますか？』→ 必ず『はい』を押してください。" -ForegroundColor Yellow
    Write-Host "  『いいえ』を押すとインストール失敗します。" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor Yellow

    winget install --id Docker.DockerDesktop --silent --accept-package-agreements --accept-source-agreements
    $wingetExit = $LASTEXITCODE

    # winget は非ゼロ終了コードを返しても例外を出さないので、$LASTEXITCODE で判定
    if ($wingetExit -ne 0) {
        Write-Host ""
        Write-Host "✗ winget インストール失敗 (exit code: $wingetExit)" -ForegroundColor Red
        if ($wingetExit -eq 4294967291) {
            Write-Host "  原因: UAC プロンプトで『いいえ』/キャンセルが押された可能性が高いです。" -ForegroundColor Yellow
        }
        Write-Host "  対処:" -ForegroundColor Yellow
        Write-Host "    1) このスクリプト (.\04_install_docker.ps1) を再実行"
        Write-Host "    2) UAC プロンプトで必ず『はい』を押す"
        Write-Host "    3) それでも駄目なら手動インストール:"
        Write-Host "       https://www.docker.com/products/docker-desktop/"
        exit 1
    }

    Write-Host "✓ Docker Desktop インストール完了" -ForegroundColor Green
} else {
    Write-Host "✗ winget が使えません。公式ページから Docker Desktop インストーラを手動でダウンロードしてください:" -ForegroundColor Red
    Write-Host "  https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "⚠ 重要: Docker Desktop 初回起動時の注意点" -ForegroundColor Yellow
Write-Host "  - WSL2 有効化のダイアログが出る場合あり → 指示通りに進める"
Write-Host "  - 『再起動が必要です』と出たら再起動"
Write-Host "  - 再起動後、Docker Desktop が自動起動するのを確認してから"
Write-Host "    PowerShell を再度開いて 05_start_openwebui.ps1 を実行"
Write-Host ""

# 起動を試みる
$dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (Test-Path $dockerDesktopExe) {
    Write-Host "Docker Desktop を起動します..." -ForegroundColor Cyan
    Start-Process $dockerDesktopExe
    Write-Host "起動待機中 (最大3分)..." -ForegroundColor Cyan

    $started = $false
    for ($i = 0; $i -lt 90; $i++) {
        Start-Sleep -Seconds 2
        try {
            docker info 2>&1 | Out-Null
            $started = $true
            break
        } catch { }
    }

    if ($started) {
        Write-Host "✓ Docker Desktop 起動完了" -ForegroundColor Green
    } else {
        Write-Host "⚠ Docker Desktop の起動確認タイムアウト。再起動が必要かもしれません。" -ForegroundColor Yellow
        Write-Host "  再起動後、手動で Docker Desktop を起動してから 05_start_openwebui.ps1 を実行してください。" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "STEP 4 完了。" -ForegroundColor Green
