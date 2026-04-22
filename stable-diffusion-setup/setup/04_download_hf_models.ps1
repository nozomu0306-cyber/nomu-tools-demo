# 04_download_hf_models.ps1
# HuggingFace から FLUX 系モデル一式 (約19GB) を DL
#
# 事前準備:
#   1) HuggingFace アカウント (済)
#   2) https://huggingface.co/black-forest-labs/FLUX.1-dev で
#      "Agree and access repository" を押してライセンス同意 (FLUX VAE 用)
#   3) https://huggingface.co/settings/tokens で Access Token (Read) を発行
#   4) このスクリプト実行中に入力を求められる

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ForgeDir = "$env:USERPROFILE\AI\stable-diffusion-webui-forge"
$ModelsDir = Join-Path $ForgeDir "models"

if (-not (Test-Path $ForgeDir)) {
    Write-Host "✗ Forge が見つかりません。先に 02_clone_forge.ps1 を実行してください。" -ForegroundColor Red
    exit 1
}

# 配置先
$FluxMainDir  = Join-Path $ModelsDir "Stable-diffusion"    # FLUX.1-dev main はここ (Forge 仕様)
$FluxDiffDir  = Join-Path $ModelsDir "diffusion_models"    # Fill / Kontext
$TextEncDir   = Join-Path $ModelsDir "text_encoder"
$VaeDir       = Join-Path $ModelsDir "VAE"

foreach ($d in @($FluxMainDir, $FluxDiffDir, $TextEncDir, $VaeDir)) {
    if (-not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# huggingface_hub をインストール
Write-Host "huggingface_hub (Python package) をインストール..." -ForegroundColor Cyan
py -3.10 -m pip install --upgrade huggingface_hub
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ pip install huggingface_hub 失敗。" -ForegroundColor Red
    exit 1
}

# ログイン確認
Write-Host ""
Write-Host "=== HuggingFace ログイン ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "次のページで Access Token を発行して下さい (Read 権限で OK):" -ForegroundColor Yellow
Write-Host "  https://huggingface.co/settings/tokens" -ForegroundColor Cyan
Write-Host ""
Write-Host "さらに FLUX.1-dev の規約同意が必要です。ブラウザで以下を開いて" -ForegroundColor Yellow
Write-Host "  https://huggingface.co/black-forest-labs/FLUX.1-dev" -ForegroundColor Cyan
Write-Host "  『Agree and access repository』ボタンを押してください。" -ForegroundColor Yellow
Write-Host ""
$readyConfirm = Read-Host "上記 2 つを済ませたら Enter (未着手なら N で中止)"
if ($readyConfirm -eq "N" -or $readyConfirm -eq "n") {
    Write-Host "中止しました。準備ができたら再実行してください。" -ForegroundColor Red
    exit 0
}

# huggingface-cli login → 新仕様では huggingface_hub.login() を直接呼ぶ形に統一
# + 環境変数 HF_TOKEN をこのプロセスに設定（子プロセスの py -c も継承する）
Write-Host ""
Write-Host "Access Token を入力してください (入力中は伏字 * で表示されます):" -ForegroundColor Cyan
$secToken = Read-Host -AsSecureString
$BSTR     = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secToken)
$Token    = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR) | Out-Null

if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "✗ トークンが空です。" -ForegroundColor Red
    exit 1
}

# 環境変数経由で認証 (huggingface_hub は HF_TOKEN を自動参照)
$env:HF_TOKEN = $Token

# 動作確認 (whoami)
Write-Host ""
Write-Host "ログイン確認中..." -ForegroundColor Cyan
$whoami = py -3.10 -c "from huggingface_hub import HfApi; print(HfApi().whoami()['name'])" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ ログイン失敗。トークンが無効か、HFアカウントに問題があります。" -ForegroundColor Red
    Write-Host "  出力: $whoami" -ForegroundColor Red
    Write-Host "  対処:" -ForegroundColor Yellow
    Write-Host "    1) https://huggingface.co/settings/tokens でトークンを再発行"
    Write-Host "    2) Read 権限で発行されているか確認"
    Write-Host "    3) このスクリプトを再実行"
    exit 1
}
Write-Host "✓ ログイン成功: $whoami" -ForegroundColor Green

# ダウンロードするファイルの一覧
# repo_id, filename, local_dir の三つ組
$downloads = @(
    @{ repo="city96/FLUX.1-dev-gguf";         file="flux1-dev-Q4_K_S.gguf";     dest=$FluxMainDir; label="FLUX.1-dev Q4 (約6.8GB)" },
    @{ repo="city96/FLUX.1-Fill-dev-gguf";    file="flux1-fill-dev-Q4_K_S.gguf"; dest=$FluxDiffDir; label="FLUX.1-Fill Q4 (約6.8GB)" },
    @{ repo="city96/FLUX.1-Kontext-dev-gguf"; file="flux1-kontext-dev-Q4_K_S.gguf"; dest=$FluxDiffDir; label="FLUX.1-Kontext Q4 (約7GB)" },
    @{ repo="comfyanonymous/flux_text_encoders"; file="clip_l.safetensors";      dest=$TextEncDir; label="CLIP-L (約246MB)" },
    @{ repo="comfyanonymous/flux_text_encoders"; file="t5xxl_fp8_e4m3fn.safetensors"; dest=$TextEncDir; label="T5XXL fp8 (約4.9GB)" },
    @{ repo="black-forest-labs/FLUX.1-dev";    file="ae.safetensors";            dest=$VaeDir;      label="FLUX VAE (約335MB)" }
)

$failed = @()

for ($i = 0; $i -lt $downloads.Count; $i++) {
    $d   = $downloads[$i]
    $idx = $i + 1
    $targetFile = Join-Path $d.dest $d.file

    Write-Host ""
    Write-Host "[$idx/$($downloads.Count)] $($d.label)" -ForegroundColor Green

    if (Test-Path $targetFile) {
        Write-Host "  ✓ 既に存在、スキップ: $targetFile" -ForegroundColor Yellow
        continue
    }

    $pyArgs = @(
        "-3.10",
        "-c",
        "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='$($d.repo)', filename='$($d.file)', local_dir=r'$($d.dest)')"
    )

    & py @pyArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ DL 失敗: $($d.repo) / $($d.file)" -ForegroundColor Red
        $failed += "$($d.repo) / $($d.file)"
    } else {
        Write-Host "  ✓ 完了: $targetFile" -ForegroundColor Green
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "✓ 全 HuggingFace モデル DL 完了" -ForegroundColor Green
} else {
    Write-Host "⚠ 以下の DL に失敗しました:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    Write-Host "原因として多い:" -ForegroundColor Yellow
    Write-Host "  - FLUX.1-dev の規約同意が未完了 → https://huggingface.co/black-forest-labs/FLUX.1-dev"
    Write-Host "  - Access Token の権限不足 → Read 権限で再発行"
    Write-Host "  - ネット不安定 → 再実行で再開"
    exit 1
}

Write-Host ""
Write-Host "次: Civitai モデル (5 ファイル・約31GB) を手動で DL してください。" -ForegroundColor Yellow
Write-Host "手順は setup\05_civitai_manual_guide.md を参照。" -ForegroundColor Yellow
