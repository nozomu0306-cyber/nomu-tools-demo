# 05_start_openwebui.ps1
# Open WebUI を Docker で起動する
# 起動後、ブラウザで http://localhost:3000 を開けばOK
# 初回は管理者アカウント作成、Ollamaのモデルは自動検出される

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposePath = Join-Path $ScriptDir "openwebui-compose.yml"

if (-not (Test-Path $ComposePath)) {
    Write-Host "✗ openwebui-compose.yml が見つかりません: $ComposePath" -ForegroundColor Red
    exit 1
}

# Docker が動いているか確認
Write-Host "Docker Desktop の状態を確認..." -ForegroundColor Cyan
try {
    docker info 2>&1 | Out-Null
    Write-Host "✓ Docker 稼働中" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Desktop が起動していません。起動してからこのスクリプトを再実行してください。" -ForegroundColor Red
    exit 1
}

# 既存コンテナがあれば停止
Write-Host "既存の Open WebUI コンテナを確認..." -ForegroundColor Cyan
$existing = docker ps -a --filter "name=open-webui" --format "{{.Names}}" 2>$null
if ($existing) {
    Write-Host "既存コンテナを再起動します..." -ForegroundColor Yellow
    docker compose -f $ComposePath down 2>&1 | Out-Null
}

# 起動
Write-Host "Open WebUI を起動します..." -ForegroundColor Cyan
docker compose -f $ComposePath up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Open WebUI の起動に失敗しました。" -ForegroundColor Red
    exit 1
}

# ヘルスチェック
Write-Host "起動確認中 (最大60秒)..." -ForegroundColor Cyan
$ok = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Seconds 2
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
        if ($resp.StatusCode -eq 200) {
            $ok = $true
            break
        }
    } catch { }
}

Write-Host ""
if ($ok) {
    Write-Host "✓ Open WebUI 起動完了" -ForegroundColor Green
    Write-Host ""
    Write-Host "ブラウザで以下を開いてください:" -ForegroundColor Yellow
    Write-Host "  http://localhost:3000" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "初回手順:" -ForegroundColor Yellow
    Write-Host "  1) 管理者アカウント作成 (メール/パスワードはローカルだけに保存される)"
    Write-Host "  2) 左下の設定アイコン → 管理者パネル → 設定 → Web検索 → 有効化"
    Write-Host "     → 検索エンジン: duckduckgo (APIキー不要) を推奨"
    Write-Host "  3) Ollama のモデルは自動検出される。チャット画面の左上プルダウンから選択"
    Write-Host ""
    # ブラウザを開く
    Start-Process "http://localhost:3000"
} else {
    Write-Host "⚠ Open WebUI の応答が確認できません。" -ForegroundColor Yellow
    Write-Host "   docker logs open-webui でログを確認してください。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "停止したいとき:  docker compose -f `"$ComposePath`" down" -ForegroundColor Gray
Write-Host "再起動:          docker compose -f `"$ComposePath`" restart" -ForegroundColor Gray
Write-Host "ログ確認:        docker logs -f open-webui" -ForegroundColor Gray
Write-Host ""
Write-Host "STEP 5 完了。" -ForegroundColor Green
