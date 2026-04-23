# 07_download_civitai_models.ps1
# Civitai API Key を使って 5 モデル (約31GB) を自動 DL
#
# 事前準備:
#   1) Civitai にログイン (https://civitai.com)
#   2) Account settings → API Keys → "+ Add API Key"
#      名前は何でも (例: nomu-sd-setup) → Generate
#   3) 表示された Key をコピー (※ 会話には貼らない)
#   4) NSFW モデル (Pony, Big ASP) を DL するなら、Account settings で
#      "Show mature content" を ON にしておく
#
# 使い方:
#   $env:CIVITAI_TOKEN = "あなたのAPI Key"
#   .\07_download_civitai_models.ps1

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ForgeDir = "$env:USERPROFILE\AI\stable-diffusion-webui-forge"
$DestDir  = Join-Path $ForgeDir "models\Stable-diffusion"

if (-not (Test-Path $ForgeDir)) {
    Write-Host "✗ Forge が見つかりません。先に 02_clone_forge.ps1 を実行してください。" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $DestDir)) {
    New-Item -ItemType Directory -Path $DestDir -Force | Out-Null
}

# curl.exe (Windows 10+ 標準) を使う - 速くて Bearer 認証も progress bar も対応
$curlExe = "$env:WINDIR\System32\curl.exe"
if (-not (Test-Path $curlExe)) {
    Write-Host "✗ curl.exe が見つかりません。Windows 10/11 の標準コマンドのはず。" -ForegroundColor Red
    exit 1
}

# Civitai API Token
if (-not [string]::IsNullOrWhiteSpace($env:CIVITAI_TOKEN)) {
    $existing = $env:CIVITAI_TOKEN.Trim()
    $existingFmt = "$($existing.Substring(0,[Math]::Min(5,$existing.Length)))...$($existing.Substring([Math]::Max(0,$existing.Length-4)))"
    Write-Host ""
    Write-Host "環境変数 CIVITAI_TOKEN を検出: $existingFmt (長さ $($existing.Length) 文字)" -ForegroundColor Yellow
    $useExisting = Read-Host "このトークンを使いますか？ (Y/n)"
    if ($useExisting -eq "n" -or $useExisting -eq "N") {
        Write-Host "古いトークンを破棄します。PowerShell を閉じて再度開いてから:" -ForegroundColor Yellow
        Write-Host "  Remove-Item Env:\CIVITAI_TOKEN" -ForegroundColor Cyan
        Write-Host "  `$env:CIVITAI_TOKEN = `"新しいKey`"" -ForegroundColor Cyan
        Write-Host "  .\07_download_civitai_models.ps1" -ForegroundColor Cyan
        exit 0
    }
    $Token = $existing
} else {
    Write-Host ""
    Write-Host "=== Civitai API Key を入力 ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1) https://civitai.com にログイン" -ForegroundColor Yellow
    Write-Host "2) 右上アイコン → Account settings → API Keys" -ForegroundColor Yellow
    Write-Host "3) + Add API Key → 名前付けて Generate → コピー" -ForegroundColor Yellow
    Write-Host "4) Account settings の Show mature content を ON (R-18 モデル DL に必要)" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host "API Key を貼り付け (Ctrl+V or 右クリック)"
    Clear-Host
    Write-Host "API Key を受領しました。" -ForegroundColor Cyan
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "✗ Token が空です" -ForegroundColor Red
    exit 1
}
$Token = $Token.Trim()

# モデル一覧
# id          : Civitai のモデル ID (URL の /models/<id> 部分)
# rename      : DL 後のリネーム後ファイル名
# versionMatch: バージョン名の部分一致 (なければ最新)
# nsfw        : R-18 モデルかどうか (アカウント側 NSFW=ON 要)
$models = @(
    @{ id = 133005; rename = "juggernautXL_v11.safetensors";  versionMatch = "v11"; nsfw = $false; label = "Juggernaut XL v11" },
    @{ id = 139562; rename = "realvisxlV5.safetensors";       versionMatch = "V5";  nsfw = $false; label = "RealVisXL V5.0" },
    @{ id = 257749; rename = "ponyDiffusionV6XL.safetensors"; versionMatch = "V6";  nsfw = $true;  label = "Pony Diffusion V6 XL" },
    @{ id = 958009; rename = "bigASPv2.safetensors";          versionMatch = "v2";  nsfw = $true;  label = "Big ASP v2" }
    # SDXL Turbo (Civitai 215317) は 404 のためここでは扱わない。
    # 公式 stabilityai/sdxl-turbo か別の Civitai モデルから手動 DL して
    # models/Stable-diffusion/sdxlTurbo.safetensors として配置すること。
)

$failed = @()

for ($i = 0; $i -lt $models.Count; $i++) {
    $m   = $models[$i]
    $idx = $i + 1
    $targetPath = Join-Path $DestDir $m.rename

    Write-Host ""
    Write-Host "[$idx/$($models.Count)] $($m.label)" -ForegroundColor Green

    if (Test-Path $targetPath) {
        $sizeMB = [math]::Round((Get-Item $targetPath).Length / 1MB, 1)
        Write-Host "  ✓ 既に存在 ($sizeMB MB)、スキップ: $($m.rename)" -ForegroundColor Yellow
        continue
    }

    # 1) Model 情報 API から最新の安全テンソル URL を取得
    $apiUrl = "https://civitai.com/api/v1/models/$($m.id)"
    try {
        $modelInfo = Invoke-RestMethod -Uri $apiUrl -Headers @{ "Authorization" = "Bearer $Token" } -TimeoutSec 30
    } catch {
        Write-Host "  ✗ Civitai API 失敗: $_" -ForegroundColor Red
        $failed += $m.label
        continue
    }

    # 2) バージョン選択
    $version = $null
    if ($m.versionMatch) {
        $version = $modelInfo.modelVersions | Where-Object { $_.name -like "*$($m.versionMatch)*" } | Select-Object -First 1
    }
    if (-not $version) {
        $version = $modelInfo.modelVersions | Select-Object -First 1
    }
    Write-Host "  Version: $($version.name)" -ForegroundColor Cyan

    # 3) ファイル選択 (.safetensors の中で一番大きいもの = メインモデル)
    $file = $version.files |
        Where-Object { $_.name -match "\.safetensors$" } |
        Sort-Object -Property sizeKB -Descending |
        Select-Object -First 1

    if (-not $file) {
        Write-Host "  ✗ .safetensors ファイルが見つかりません" -ForegroundColor Red
        $failed += $m.label
        continue
    }

    $sizeGB = [math]::Round($file.sizeKB / 1024 / 1024, 2)
    Write-Host "  Source: $($file.name) ($sizeGB GB)" -ForegroundColor Cyan
    Write-Host "  Saving as: $($m.rename)" -ForegroundColor Cyan

    # 4) curl で DL (Bearer 認証 + 自動リダイレクト追従 + 進捗バー + 失敗時HTTPエラー)
    $dlUrl = $file.downloadUrl

    Write-Host "  DL中... (中断したいときは Ctrl+C)" -ForegroundColor Yellow

    & $curlExe -L --fail `
        -H "Authorization: Bearer $Token" `
        --progress-bar `
        -o $targetPath `
        $dlUrl

    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  ✗ DL 失敗 (curl exit $LASTEXITCODE)" -ForegroundColor Red
        if (Test-Path $targetPath) { Remove-Item $targetPath -Force -ErrorAction SilentlyContinue }
        $failed += $m.label
        if ($m.nsfw) {
            Write-Host "    NSFW モデルなので Civitai アカウント設定で 'Show mature content' を ON にしてください。" -ForegroundColor Yellow
        }
        continue
    }

    # サイズ確認
    if (Test-Path $targetPath) {
        $actualMB = [math]::Round((Get-Item $targetPath).Length / 1MB, 1)
        if ($actualMB -lt 100) {
            Write-Host "  ⚠ ファイルが異常に小さい ($actualMB MB)。ログイン HTML が DL された可能性。" -ForegroundColor Red
            Remove-Item $targetPath -Force -ErrorAction SilentlyContinue
            $failed += $m.label
            continue
        }
        Write-Host "  ✓ 完了: $actualMB MB → $targetPath" -ForegroundColor Green
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "✓ 全 Civitai モデル DL 完了" -ForegroundColor Green
    Write-Host ""
    Write-Host "次:" -ForegroundColor Cyan
    Write-Host "  cd `$env:USERPROFILE\AI\stable-diffusion-webui-forge"
    Write-Host "  .\webui-user.bat       # 初回起動 (依存DLで 10〜20 分)"
} else {
    Write-Host "⚠ 以下に失敗:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    Write-Host "原因として多い:" -ForegroundColor Yellow
    Write-Host "  - Civitai API Key の権限不足: 再発行する"
    Write-Host "  - NSFW=ON 未設定: Account settings で Show mature content を ON"
    Write-Host "  - ネット切断: 同じスクリプトを再実行 (DL済はスキップ)"
}
