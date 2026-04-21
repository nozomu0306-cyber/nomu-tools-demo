# 02_pull_models.ps1
# 5つのベースモデルを Ollama に pull する
# 合計: 約62GB、ネット速度次第で数時間
# 途中で切れても `ollama pull` は再開可能

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$models = @(
    @{ name = "qwen2.5:14b-instruct-q4_K_M";              size = "約9GB";  purpose = "全年齢メイン (速い)" },
    @{ name = "huihui_ai/qwen2.5-abliterate:14b";         size = "約9GB";  purpose = "R-18メイン (速い、検閲解除)" },
    @{ name = "qwen2.5:7b-instruct-q4_K_M";               size = "約4.5GB"; purpose = "軽作業 (タイトル等)" },
    @{ name = "huihui_ai/qwen2.5-abliterate:32b";         size = "約20GB"; purpose = "R-18勝負回 (遅いが高品質)" },
    @{ name = "huihui_ai/qwq-abliterated:32b";            size = "約20GB"; purpose = "論理検証 (ミステリー/校正)" }
)

Write-Host ""
Write-Host "5つのモデルをダウンロードします (合計約62GB):" -ForegroundColor Cyan
foreach ($m in $models) {
    Write-Host ("  - {0,-50} {1,-10} {2}" -f $m.name, $m.size, $m.purpose)
}
Write-Host ""
Write-Host "※ 中断したらこのスクリプトを再実行すれば続きから再開されます。" -ForegroundColor Yellow
Write-Host ""

$failed = @()

for ($i = 0; $i -lt $models.Count; $i++) {
    $m = $models[$i]
    $idx = $i + 1
    Write-Host ""
    Write-Host "[$idx/$($models.Count)] Pulling $($m.name) ($($m.size)) ..." -ForegroundColor Green

    try {
        & ollama pull $m.name
        if ($LASTEXITCODE -ne 0) {
            throw "ollama pull が非ゼロ終了コードを返しました: $LASTEXITCODE"
        }
        Write-Host "  ✓ $($m.name) 完了" -ForegroundColor Green
    } catch {
        Write-Host "  ✗ $($m.name) 失敗: $_" -ForegroundColor Red
        $failed += $m.name
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "✓ 全モデルのダウンロード完了" -ForegroundColor Green
    Write-Host ""
    Write-Host "ダウンロード済みモデル一覧:" -ForegroundColor Cyan
    & ollama list
} else {
    Write-Host "⚠ 以下のモデルの取得に失敗しました:" -ForegroundColor Red
    foreach ($f in $failed) { Write-Host "    - $f" -ForegroundColor Red }
    Write-Host ""
    Write-Host "このスクリプトを再度実行すると、成功済みはスキップされ失敗分のみ再試行されます。" -ForegroundColor Yellow
    Write-Host "それでも失敗する場合:" -ForegroundColor Yellow
    Write-Host "  - Ollama library のモデル名が変わっている可能性 → https://ollama.com/library を確認"
    Write-Host "  - ネット速度が遅い → 時間をおいて再実行"
    Write-Host "  - ディスク容量不足 → 2TB の空きを確認"
    exit 1
}

Write-Host ""
Write-Host "STEP 2 完了。" -ForegroundColor Green
