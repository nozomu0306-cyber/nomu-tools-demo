# 00_run_all.ps1
# のむさん専用 ローカル小説AI セットアップ - 一括実行スクリプト
#
# 使い方:
#   PowerShellを「管理者として実行」で開き、このスクリプトがあるフォルダで:
#     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
#     .\00_run_all.ps1
#
# 途中で止まったら、個別スクリプトを手動で再実行できます。

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " のむさん専用 ローカル小説AI セットアップ" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "実施する内容:" -ForegroundColor Yellow
Write-Host "  1) Ollama for Windows をインストール"
Write-Host "  2) 5モデル(約62GB)をダウンロード ※数時間かかります"
Write-Host "  3) 18モードを ollama create で登録"
Write-Host "  4) Docker Desktop をインストール"
Write-Host "  5) Open WebUI を起動 (http://localhost:3000)"
Write-Host ""
Write-Host "所要時間の目安: ネット速度にもよるが 2〜6時間" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "続行しますか？ (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "中止しました。" -ForegroundColor Red
    exit 0
}

function Invoke-Step {
    param(
        [string]$Name,
        [string]$Script
    )
    Write-Host ""
    Write-Host "==============================" -ForegroundColor Green
    Write-Host " STEP: $Name" -ForegroundColor Green
    Write-Host "==============================" -ForegroundColor Green
    & (Join-Path $ScriptDir $Script)
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "STEP「$Name」で失敗しました。ログを確認して個別スクリプトを再実行してください。" -ForegroundColor Red
        exit 1
    }
}

Invoke-Step -Name "1) Ollama インストール"       -Script "01_install_ollama.ps1"
Invoke-Step -Name "2) モデルダウンロード"         -Script "02_pull_models.ps1"
Invoke-Step -Name "3) 18モード登録"               -Script "03_build_modelfiles.ps1"
Invoke-Step -Name "4) Docker Desktop インストール" -Script "04_install_docker.ps1"
Invoke-Step -Name "5) Open WebUI 起動"            -Script "05_start_openwebui.ps1"

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " セットアップ完了！" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "▼ PowerShell から使う場合:" -ForegroundColor Yellow
Write-Host "    ollama run novel-general"
Write-Host ""
Write-Host "▼ ブラウザから使う場合:" -ForegroundColor Yellow
Write-Host "    http://localhost:3000 を開く"
Write-Host "    (初回は管理者アカウント作成)"
Write-Host ""
Write-Host "▼ 動作確認:" -ForegroundColor Yellow
Write-Host "    ollama run novel-general"
Write-Host "    >>> 主人公が鏡を見て自分の顔を認識できない場面を500字で"
Write-Host ""
Write-Host "詳しい使い方は docs/MODE_GUIDE.md、docs/KNOWLEDGE_GUIDE.md を参照。" -ForegroundColor Yellow
Write-Host ""
