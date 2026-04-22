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

# HuggingFace 認証
# - 既に $env:HF_TOKEN がセット済みならそれを使う (環境変数経由が一番確実)
# - そうでなければ Read-Host で受け取る (通常の Read-Host は Ctrl+V 貼り付け可)
# - SecureString は古い PowerShell で貼り付け不可のため使わない

if (-not [string]::IsNullOrWhiteSpace($env:HF_TOKEN)) {
    Write-Host ""
    Write-Host "✓ 環境変数 HF_TOKEN を検出、それを使用します。" -ForegroundColor Green
    $Token = $env:HF_TOKEN
} else {
    Write-Host ""
    Write-Host "Access Token を入力してください。" -ForegroundColor Cyan
    Write-Host "  - PowerShell 上で Ctrl+V でも 右クリック でも貼り付け可能" -ForegroundColor Yellow
    Write-Host "  - うまく貼れない場合は一度キャンセル (Ctrl+C) して、" -ForegroundColor Yellow
    Write-Host "    『\$env:HF_TOKEN = `"hf_xxxxx...`"』を実行してから本スクリプトを再実行" -ForegroundColor Yellow
    Write-Host ""
    $Token = Read-Host "Token"
    Clear-Host  # 画面からトークン表示を消す
    Write-Host "Access Token を受領しました。" -ForegroundColor Cyan
}

if ([string]::IsNullOrWhiteSpace($Token)) {
    Write-Host "✗ トークンが空です。" -ForegroundColor Red
    exit 1
}

$Token = $Token.Trim()

# サニティチェック: HF トークンは hf_ で始まる長さ 30+ の文字列
if (-not $Token.StartsWith("hf_")) {
    Write-Host "⚠ トークンが 'hf_' で始まっていません (現在: '$($Token.Substring(0,[Math]::Min(3,$Token.Length)))...')" -ForegroundColor Yellow
    Write-Host "  HuggingFace のトークンは 'hf_xxxxx...' 形式です。コピー漏れの可能性。" -ForegroundColor Yellow
    $cont = Read-Host "それでも続けますか？ (y/N)"
    if ($cont -ne "y") { exit 1 }
}
if ($Token.Length -lt 20) {
    Write-Host "⚠ トークンが短すぎます ($($Token.Length) 文字)。コピー漏れの可能性が高いです。" -ForegroundColor Yellow
    Write-Host "  HuggingFace のトークンは通常 30〜40 文字です。" -ForegroundColor Yellow
    $cont = Read-Host "それでも続けますか？ (y/N)"
    if ($cont -ne "y") { exit 1 }
}
Write-Host "  トークン長: $($Token.Length) 文字 / 形式: $($Token.Substring(0,3))...$($Token.Substring($Token.Length-4))" -ForegroundColor Cyan

# 環境変数経由で認証 (両方の名前を設定 → huggingface_hub のバージョン互換性確保)
$env:HF_TOKEN = $Token
$env:HUGGING_FACE_HUB_TOKEN = $Token

# 動作確認: 一時 .py ファイルを作成して詳細エラーを取りやすくする
Write-Host ""
Write-Host "ログイン確認中..." -ForegroundColor Cyan

$pyTmp = [System.IO.Path]::GetTempFileName() + ".py"
@"
import os, sys, traceback
try:
    from huggingface_hub import login, HfApi
    token = os.environ.get('HF_TOKEN', '').strip()
    if not token:
        print('ERROR_EMPTY_TOKEN', file=sys.stderr); sys.exit(2)
    login(token=token, add_to_git_credential=False)
    name = HfApi().whoami().get('name', '?')
    print(name)
except Exception:
    traceback.print_exc()
    sys.exit(1)
"@ | Out-File -FilePath $pyTmp -Encoding UTF8 -Force

# 一時的に ErrorActionPreference を緩める (huggingface_hub の Note メッセージで止まらないように)
$prevPref = $ErrorActionPreference
$ErrorActionPreference = "Continue"
$whoami = & py -3.10 $pyTmp 2>&1 | Out-String
$pyExit = $LASTEXITCODE
$ErrorActionPreference = $prevPref
Remove-Item $pyTmp -Force -ErrorAction SilentlyContinue

if ($pyExit -ne 0) {
    Write-Host "✗ ログイン失敗 (exit $pyExit)" -ForegroundColor Red
    Write-Host "  --- Python エラー全文 ---" -ForegroundColor Yellow
    Write-Host $whoami -ForegroundColor Red
    Write-Host "  ------------------------" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  考えられる原因:" -ForegroundColor Yellow
    Write-Host "    a) トークンが無効: https://huggingface.co/settings/tokens で再発行"
    Write-Host "    b) 貼り付け漏れ・改行混入: 上記の『トークン長』が 30+ 文字あるか確認"
    Write-Host "    c) Read 権限不足: Classic Token の Read で発行する"
    Write-Host "    d) ネット接続: huggingface.co に接続できるか確認"
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

    # huggingface_hub が stderr に Note を吐くので ErrorActionPreference を一時緩和
    $prevPref = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    & py @pyArgs
    $dlExit = $LASTEXITCODE
    $ErrorActionPreference = $prevPref

    if ($dlExit -ne 0) {
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
