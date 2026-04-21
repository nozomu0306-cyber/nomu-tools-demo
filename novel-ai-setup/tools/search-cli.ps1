# tools/search-cli.ps1
# DuckDuckGo 検索→結果を Ollama のモデルに流す軽量スクリプト（おまけ）
#
# Open WebUI を使えば GUI で同じことができるので、基本は Open WebUI 推奨。
# このスクリプトは CLI 派 or Docker 起動したくない時用。
#
# 使い方:
#   .\search-cli.ps1 -Query "○○（アニメ名）の××（キャラ名）の性格"
#   .\search-cli.ps1 -Query "..." -Model character-analysis
#
# 依存:
#   - PowerShell 7+ 推奨（5.1でも動くはず）
#   - Ollama が稼働中 (localhost:11434)

param(
    [Parameter(Mandatory = $true)]
    [string]$Query,

    [string]$Model = "character-analysis",

    [int]$Results = 5
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "[1/3] DuckDuckGo で検索中: $Query" -ForegroundColor Cyan

# DuckDuckGo HTML スクレイピング（API無しでも使える）
$ddgUrl = "https://html.duckduckgo.com/html/?q=" + [System.Uri]::EscapeDataString($Query)
$headers = @{ "User-Agent" = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }

try {
    $resp = Invoke-WebRequest -Uri $ddgUrl -Headers $headers -UseBasicParsing
} catch {
    Write-Host "✗ 検索に失敗しました: $_" -ForegroundColor Red
    exit 1
}

# 検索結果のタイトル＋スニペットを抽出
$html = $resp.Content

$titleMatches   = [regex]::Matches($html, '<a class="result__a"[^>]*>([^<]+)</a>')
$snippetMatches = [regex]::Matches($html, '<a class="result__snippet"[^>]*>(.+?)</a>', "Singleline")

$items = @()
for ($i = 0; $i -lt [Math]::Min($titleMatches.Count, $Results); $i++) {
    $title = $titleMatches[$i].Groups[1].Value
    $snippet = if ($i -lt $snippetMatches.Count) { $snippetMatches[$i].Groups[1].Value } else { "" }
    # HTML タグとエンティティ除去
    $snippet = [regex]::Replace($snippet, "<[^>]+>", "")
    Add-Type -AssemblyName System.Web
    $title   = [System.Web.HttpUtility]::HtmlDecode($title).Trim()
    $snippet = [System.Web.HttpUtility]::HtmlDecode($snippet).Trim()

    $items += [PSCustomObject]@{ Title = $title; Snippet = $snippet }
}

if ($items.Count -eq 0) {
    Write-Host "✗ 検索結果が取れませんでした。DuckDuckGo の HTML 構造が変わった可能性があります。" -ForegroundColor Red
    exit 1
}

Write-Host "  $($items.Count) 件取得" -ForegroundColor Green

# 検索結果を整形
$context = "【検索結果（DuckDuckGo）】`n`n"
for ($i = 0; $i -lt $items.Count; $i++) {
    $context += "## 結果 $($i+1)：$($items[$i].Title)`n$($items[$i].Snippet)`n`n"
}

Write-Host ""
Write-Host "[2/3] Ollama ($Model) に流し込み中..." -ForegroundColor Cyan

# ユーザープロンプト
$userPrompt = @"
以下は「$Query」についての検索結果です。
これを踏まえて、ユーザーの質問に答えてください。

$context

【質問】
$Query
"@

# Ollama chat API
$body = @{
    model  = $Model
    stream = $false
    messages = @(
        @{ role = "user"; content = $userPrompt }
    )
} | ConvertTo-Json -Depth 10

try {
    $ollamaResp = Invoke-RestMethod -Uri "http://localhost:11434/api/chat" `
        -Method Post -Body $body -ContentType "application/json" -TimeoutSec 300
} catch {
    Write-Host "✗ Ollama への送信失敗。ollama が起動しているか、モデル ($Model) が登録済みか確認してください。" -ForegroundColor Red
    Write-Host "エラー: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[3/3] === 回答 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host $ollamaResp.message.content
Write-Host ""
Write-Host "======================" -ForegroundColor Cyan
