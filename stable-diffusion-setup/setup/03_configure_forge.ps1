# 03_configure_forge.ps1
# webui-user.bat.template を Forge フォルダにコピー配置

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ForgeDir  = "$env:USERPROFILE\AI\stable-diffusion-webui-forge"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Template  = Join-Path $ScriptDir "webui-user.bat.template"
$Target    = Join-Path $ForgeDir "webui-user.bat"

if (-not (Test-Path $ForgeDir)) {
    Write-Host "✗ Forge フォルダが見つかりません: $ForgeDir" -ForegroundColor Red
    Write-Host "  先に 02_clone_forge.ps1 を実行してください。" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $Template)) {
    Write-Host "✗ テンプレートが見つかりません: $Template" -ForegroundColor Red
    exit 1
}

# 既存 webui-user.bat があれば退避
if (Test-Path $Target) {
    $backup = "$Target.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $Target $backup
    Write-Host "既存の webui-user.bat を退避: $backup" -ForegroundColor Yellow
}

# テンプレート配置
Copy-Item $Template $Target -Force
Write-Host "✓ webui-user.bat を配置: $Target" -ForegroundColor Green

Write-Host ""
Write-Host "適用内容:" -ForegroundColor Cyan
Write-Host "  - Python 3.10 ランチャー指定 (PYTHON=py -3.10)"
Write-Host "  - --opt-sdp-attention (xformers 代替、RTX 50 系で安定)"
Write-Host "  - --cuda-malloc (VRAM 断片化対策)"
Write-Host "  - --disable-nan-check"
Write-Host "  - --api (Open WebUI から呼べるよう API 公開)"
Write-Host ""
Write-Host "※ 起動して CUDA エラーが出たら webui-user.bat の TORCH_COMMAND 行を" -ForegroundColor Yellow
Write-Host "  コメント解除すると CUDA 12.8 Nightly PyTorch に切替わります。" -ForegroundColor Yellow
Write-Host ""
Write-Host "STEP 3 完了。" -ForegroundColor Green
