# 03_build_modelfiles.ps1
# modelfiles/ 配下の *.Modelfile を全て `ollama create` で登録する
# ファイル名(拡張子除く) = モデル名になる
#
# 例: modelfiles/novel-general.Modelfile → `ollama run novel-general`

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ModelfileDir = Join-Path (Split-Path -Parent $ScriptDir) "modelfiles"

if (-not (Test-Path $ModelfileDir)) {
    Write-Host "✗ $ModelfileDir が見つかりません。" -ForegroundColor Red
    exit 1
}

$files = Get-ChildItem -Path $ModelfileDir -Filter "*.Modelfile" | Sort-Object Name

if ($files.Count -eq 0) {
    Write-Host "✗ Modelfile が1つもありません。" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "$($files.Count) 個のモードを登録します..." -ForegroundColor Cyan
Write-Host ""

$failed = @()

foreach ($f in $files) {
    $modelName = [System.IO.Path]::GetFileNameWithoutExtension($f.Name)
    Write-Host "[$modelName] 登録中..." -ForegroundColor Green
    try {
        & ollama create $modelName -f $f.FullName
        if ($LASTEXITCODE -ne 0) {
            throw "ollama create が失敗: exit $LASTEXITCODE"
        }
        Write-Host "  ✓ $modelName 登録完了" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $modelName 失敗: $_" -ForegroundColor Red
        $failed += $modelName
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "✓ 全モード登録完了" -ForegroundColor Green
    Write-Host ""
    Write-Host "登録されたモード (ollama list 抜粋):" -ForegroundColor Cyan
    & ollama list | Select-String -Pattern "novel-|fanfic-|character-|plot-|edit-|title-|description-"
} else {
    Write-Host "⚠ 以下のモード登録に失敗しました:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    Write-Host "原因として考えられるもの:" -ForegroundColor Yellow
    Write-Host "  - 該当する FROM モデルがまだダウンロードされていない → 02_pull_models.ps1 を再実行"
    Write-Host "  - Modelfile の書式エラー → docs/QUICKSTART.md の『手動セットアップ』を参照"
    exit 1
}

Write-Host ""
Write-Host "動作確認するなら:" -ForegroundColor Cyan
Write-Host "  ollama run novel-general"
Write-Host "  >>> 主人公が鏡を見て自分の顔を認識できない場面を500字で"
Write-Host ""
Write-Host "STEP 3 完了。" -ForegroundColor Green
