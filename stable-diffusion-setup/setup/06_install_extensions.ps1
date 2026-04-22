# 06_install_extensions.ps1
# Forge の extensions/ に必須拡張 4 種を git clone で設置

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ForgeDir = "$env:USERPROFILE\AI\stable-diffusion-webui-forge"
$ExtDir   = Join-Path $ForgeDir "extensions"

if (-not (Test-Path $ForgeDir)) {
    Write-Host "✗ Forge が見つかりません。先に 02_clone_forge.ps1 を実行してください。" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $ExtDir)) {
    New-Item -ItemType Directory -Path $ExtDir -Force | Out-Null
}

$extensions = @(
    @{ url = "https://github.com/Mikubill/sd-webui-controlnet.git";             name = "sd-webui-controlnet";          purpose = "ポーズ・構図指定" },
    @{ url = "https://github.com/Bing-su/adetailer.git";                         name = "adetailer";                    purpose = "顔の自動補正" },
    @{ url = "https://github.com/hako-mikan/sd-webui-regional-prompter.git";    name = "sd-webui-regional-prompter";   purpose = "領域別プロンプト" },
    @{ url = "https://github.com/Uminosachi/sd-webui-inpaint-anything.git";      name = "sd-webui-inpaint-anything";    purpose = "マスク自動生成" }
)

Write-Host ""
Write-Host "$($extensions.Count) 個の拡張機能をインストールします..." -ForegroundColor Cyan
Write-Host ""

$failed = @()

foreach ($e in $extensions) {
    $targetDir = Join-Path $ExtDir $e.name
    Write-Host "● $($e.name) — $($e.purpose)" -ForegroundColor Green

    if (Test-Path $targetDir) {
        Write-Host "  ✓ 既に存在、git pull で更新します..." -ForegroundColor Yellow
        Push-Location $targetDir
        try {
            git pull
            if ($LASTEXITCODE -ne 0) { Write-Host "  ⚠ pull 失敗" -ForegroundColor Yellow }
        } finally { Pop-Location }
    } else {
        Push-Location $ExtDir
        try {
            git clone $e.url
            if ($LASTEXITCODE -ne 0) {
                Write-Host "  ✗ clone 失敗: $($e.url)" -ForegroundColor Red
                $failed += $e.name
            } else {
                Write-Host "  ✓ clone 完了: $targetDir" -ForegroundColor Green
            }
        } finally { Pop-Location }
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "✓ 全拡張機能のインストール完了" -ForegroundColor Green
    Write-Host ""
    Write-Host "これら拡張機能は Forge 次回起動時に自動で組み込まれ、依存パッケージも DL されます。" -ForegroundColor Cyan
    Write-Host "初回起動は時間がかかります (特に ControlNet と Inpaint Anything)。" -ForegroundColor Yellow
} else {
    Write-Host "⚠ 以下の拡張が失敗しました:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host "  再実行すれば失敗分のみ再試行されます。" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "STEP 4 完了。" -ForegroundColor Green
