# 00_run_all.ps1
# Stable Diffusion + FLUX 一括セットアップ
# 使い方: 管理者 PowerShell で Set-ExecutionPolicy 後に実行

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " のむさん専用 Stable Diffusion + FLUX セットアップ" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "インストール先: C:\Users\nozom\AI\stable-diffusion-webui-forge" -ForegroundColor Yellow
Write-Host ""
Write-Host "実施する内容:" -ForegroundColor Yellow
Write-Host "  1) Git / Python 3.10 インストール"
Write-Host "  2) WebUI Forge を clone"
Write-Host "  3) webui-user.bat を RTX 5060 Ti 8GB 向けに最適化"
Write-Host "  4) 拡張機能 4 種 (ControlNet / Adetailer / Regional Prompter / Inpaint Anything) 設置"
Write-Host "  5) HuggingFace モデル DL 案内 (約19GB、別スクリプトで実施)"
Write-Host ""
Write-Host "※ Civitai モデル (約31GB) は手動DLです (05_civitai_manual_guide.md)" -ForegroundColor Yellow
Write-Host "※ Forge の初回起動で依存DL 10〜20分かかります" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "続行しますか？ (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "中止しました。" -ForegroundColor Red
    exit 0
}

function Invoke-Step {
    param([string]$Name, [string]$Script)
    Write-Host ""
    Write-Host "==============================" -ForegroundColor Green
    Write-Host " STEP: $Name" -ForegroundColor Green
    Write-Host "==============================" -ForegroundColor Green
    & (Join-Path $ScriptDir $Script)
    if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) {
        Write-Host "STEP「$Name」で失敗。個別スクリプトを再実行してください。" -ForegroundColor Red
        exit 1
    }
}

Invoke-Step -Name "1) Git / Python 3.10 インストール" -Script "01_install_prereqs.ps1"
Invoke-Step -Name "2) WebUI Forge clone"             -Script "02_clone_forge.ps1"
Invoke-Step -Name "3) webui-user.bat 最適化"         -Script "03_configure_forge.ps1"
Invoke-Step -Name "4) 拡張機能インストール"           -Script "06_install_extensions.ps1"

Write-Host ""
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host " コア部分のセットアップ完了" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "次にやること:" -ForegroundColor Yellow
Write-Host ""
Write-Host "▼ HuggingFace モデル (FLUX系 19GB) の DL:" -ForegroundColor Yellow
Write-Host "    .\04_download_hf_models.ps1"
Write-Host "    (HFアクセストークンが必要。スクリプトが案内します)"
Write-Host ""
Write-Host "▼ Civitai モデル (SDXL系 31GB) の DL:" -ForegroundColor Yellow
Write-Host "    setup\05_civitai_manual_guide.md を開いて手順通りに手動DL"
Write-Host ""
Write-Host "▼ モデル全部揃ったら Forge 初回起動:" -ForegroundColor Yellow
Write-Host "    cd C:\Users\nozom\AI\stable-diffusion-webui-forge"
Write-Host "    .\webui-user.bat"
Write-Host "    (初回は依存DL 10〜20分)"
Write-Host ""
