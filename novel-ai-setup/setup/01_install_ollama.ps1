# 01_install_ollama.ps1
# Ollama for Windows をインストールする
#
# - winget が使える → winget で Ollama.Ollama をインストール
# - 使えない → 公式インストーラを直接DL
# - 最後に `ollama --version` で動作確認

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "Ollama のインストールを確認します..." -ForegroundColor Cyan

# 既にインストールされているかチェック
$ollamaCmd = Get-Command ollama -ErrorAction SilentlyContinue
if ($ollamaCmd) {
    $version = (ollama --version) 2>&1
    Write-Host "Ollama は既にインストール済みです: $version" -ForegroundColor Green
    exit 0
}

# winget でインストール試行
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue
if ($wingetCmd) {
    Write-Host "winget でインストールします..." -ForegroundColor Cyan
    try {
        winget install --id Ollama.Ollama --silent --accept-package-agreements --accept-source-agreements
        Write-Host "winget インストール完了" -ForegroundColor Green
    } catch {
        Write-Host "winget インストールに失敗。公式インストーラにフォールバックします..." -ForegroundColor Yellow
        $useInstaller = $true
    }
} else {
    $useInstaller = $true
}

if ($useInstaller) {
    $installerUrl = "https://ollama.com/download/OllamaSetup.exe"
    $installerPath = Join-Path $env:TEMP "OllamaSetup.exe"

    Write-Host "公式インストーラをダウンロード: $installerUrl" -ForegroundColor Cyan
    Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

    Write-Host "インストーラを起動します。ダイアログが出たら進めてください..." -ForegroundColor Cyan
    Start-Process -FilePath $installerPath -Wait
    Remove-Item $installerPath -Force -ErrorAction SilentlyContinue
}

# PATH 反映のため環境変数を再読み込み
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 動作確認
Write-Host ""
Write-Host "動作確認します..." -ForegroundColor Cyan
try {
    $version = (ollama --version) 2>&1
    Write-Host "✓ Ollama インストール成功: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ Ollama が PATH 上で見つかりません。PowerShell を一度閉じて再度開いてから 01_install_ollama.ps1 を再実行してください。" -ForegroundColor Red
    exit 1
}

# サービスが動いているか確認
Write-Host "Ollama サービスを確認..." -ForegroundColor Cyan
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:11434/api/tags" -UseBasicParsing -TimeoutSec 5
    if ($resp.StatusCode -eq 200) {
        Write-Host "✓ Ollama サービスは稼働中 (port 11434)" -ForegroundColor Green
    }
} catch {
    Write-Host "Ollama サービスが応答しません。手動で起動を試みます..." -ForegroundColor Yellow
    Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Host "起動しました。ファイアウォール警告が出たら『許可』を選んでください。" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "STEP 1 完了。" -ForegroundColor Green
