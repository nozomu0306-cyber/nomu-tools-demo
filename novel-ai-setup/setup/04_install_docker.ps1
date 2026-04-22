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

# 前回のインストール失敗で残った壊れたフォルダをチェック
$leftoverData = "C:\ProgramData\DockerDesktop"
if (Test-Path $leftoverData) {
    Write-Host "⚠ 前回のインストール試行で残った $leftoverData を検出しました。" -ForegroundColor Yellow
    Write-Host "  これが残っているとインストールが失敗するのでクリーンアップします..." -ForegroundColor Yellow
    try {
        Get-Service *docker* -ErrorAction SilentlyContinue | Stop-Service -Force -ErrorAction SilentlyContinue
        Remove-Item -Path $leftoverData -Recurse -Force -ErrorAction Stop
        Write-Host "  ✓ クリーンアップ完了" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ 削除失敗: $_" -ForegroundColor Red
        Write-Host "    対処: 一度 Windows を再起動してからこのスクリプトを再実行してください。" -ForegroundColor Yellow
        exit 1
    }
}
$leftoverProg = "C:\Program Files\Docker"
if (Test-Path $leftoverProg) {
    Write-Host "⚠ $leftoverProg も残っているのでクリーンアップします..." -ForegroundColor Yellow
    Remove-Item -Path $leftoverProg -Recurse -Force -ErrorAction SilentlyContinue
}

# 公式インストーラを直接ダウンロードして管理者権限で実行
# (winget は内部インストーラの失敗を exit 0 で隠すので使わない)
$installerUrl  = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$installerPath = Join-Path $env:TEMP "DockerDesktopInstaller.exe"

Write-Host ""
Write-Host "Docker Desktop 公式インストーラをダウンロードします..." -ForegroundColor Cyan
Write-Host "(約600MB、数分かかります)" -ForegroundColor Yellow

try {
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
    Write-Host "  ✓ ダウンロード完了" -ForegroundColor Green
} catch {
    Write-Host "✗ ダウンロード失敗: $_" -ForegroundColor Red
    Write-Host "  ネット接続を確認して再実行してください。" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "⚠ 重要: この後 UAC プロンプト（管理者権限の確認）が出ます。" -ForegroundColor Yellow
Write-Host "  『このアプリがデバイスに変更を加えることを許可しますか？』→ 必ず『はい』を押してください。" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow

try {
    $proc = Start-Process -FilePath $installerPath `
        -ArgumentList "install", "--accept-license", "--backend=wsl-2" `
        -Wait -PassThru -Verb RunAs
    $installerExit = $proc.ExitCode
} catch {
    Write-Host "✗ インストーラ起動失敗: $_" -ForegroundColor Red
    exit 1
}

if ($installerExit -ne 0) {
    Write-Host ""
    Write-Host "✗ Docker インストーラ失敗 (exit code: $installerExit)" -ForegroundColor Red
    Write-Host "  対処:" -ForegroundColor Yellow
    Write-Host "    - UAC プロンプトで『はい』を押したか確認"
    Write-Host "    - 一度 Windows を再起動してから再実行"
    Write-Host "    - インストーラを直接手動実行: $installerPath"
    exit 1
}

# 実ファイルで成功確認
$dockerDesktopExe = "C:\Program Files\Docker\Docker\Docker Desktop.exe"
if (-not (Test-Path $dockerDesktopExe)) {
    Write-Host "✗ Docker Desktop の実行ファイルが見つかりません。インストールが完了していない可能性があります。" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker Desktop インストール完了" -ForegroundColor Green

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
