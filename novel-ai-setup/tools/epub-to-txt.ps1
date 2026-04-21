# tools/epub-to-txt.ps1
# EPUB を Open WebUI の Knowledge 機能に入れる前に UTF-8 TXT に変換する。
# 複数ファイル対応。フォルダ指定で一括処理可能。
#
# 使い方:
#   .\epub-to-txt.ps1 -Path "C:\Users\nomu\Desktop\原作A.epub"
#   .\epub-to-txt.ps1 -Path "C:\Users\nomu\Desktop\小説フォルダ"
#
# 出力先:
#   元 EPUB と同じフォルダに "<元ファイル名>.txt" として保存
#
# 仕組み:
#   EPUB は実体 ZIP なので、中の *.xhtml / *.html を抽出し、
#   HTML タグを除去してプレーンテキスト化する。

param(
    [Parameter(Mandatory = $true)]
    [string]$Path
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

function Convert-EpubToTxt {
    param([string]$EpubPath)

    if (-not (Test-Path $EpubPath)) {
        Write-Host "✗ ファイルが見つかりません: $EpubPath" -ForegroundColor Red
        return
    }

    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($EpubPath)
    $dir      = Split-Path -Parent $EpubPath
    $outPath  = Join-Path $dir ($baseName + ".txt")

    Write-Host "変換中: $baseName" -ForegroundColor Cyan

    # 一時展開先
    $tmpDir = Join-Path $env:TEMP ("epub_" + [Guid]::NewGuid().ToString())
    New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null

    try {
        # EPUB は ZIP なので解凍
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($EpubPath, $tmpDir)

        # xhtml / html を章順になるよう並べる（ファイル名でソート）
        $contentFiles = Get-ChildItem -Path $tmpDir -Recurse -Include *.xhtml, *.html | Sort-Object FullName

        $allText = New-Object System.Text.StringBuilder

        foreach ($f in $contentFiles) {
            $raw = Get-Content -Path $f.FullName -Raw -Encoding UTF8
            # <script> / <style> 除去
            $raw = [regex]::Replace($raw, "<script[^>]*>[\s\S]*?</script>", "", "IgnoreCase")
            $raw = [regex]::Replace($raw, "<style[^>]*>[\s\S]*?</style>", "", "IgnoreCase")
            # タグ除去
            $text = [regex]::Replace($raw, "<[^>]+>", "")
            # HTML エンティティをデコード
            Add-Type -AssemblyName System.Web
            $text = [System.Web.HttpUtility]::HtmlDecode($text)
            # 連続改行を圧縮
            $text = [regex]::Replace($text, "(\r?\n){3,}", "`r`n`r`n")
            $text = $text.Trim()

            if ($text.Length -gt 0) {
                [void]$allText.AppendLine($text)
                [void]$allText.AppendLine()
            }
        }

        # UTF-8 (BOMなし) で保存
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($outPath, $allText.ToString(), $utf8NoBom)

        Write-Host "  ✓ 完了: $outPath" -ForegroundColor Green
    } finally {
        # 後片付け
        if (Test-Path $tmpDir) {
            Remove-Item -Recurse -Force $tmpDir
        }
    }
}

# メイン
$item = Get-Item $Path
if ($item.PSIsContainer) {
    # フォルダ指定 → 中の *.epub を全部変換
    $epubs = Get-ChildItem -Path $item.FullName -Filter "*.epub"
    if ($epubs.Count -eq 0) {
        Write-Host "フォルダに EPUB が見つかりません: $($item.FullName)" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "$($epubs.Count) 個の EPUB を変換します..." -ForegroundColor Cyan
    foreach ($e in $epubs) {
        Convert-EpubToTxt -EpubPath $e.FullName
    }
} else {
    Convert-EpubToTxt -EpubPath $item.FullName
}

Write-Host ""
Write-Host "完了。生成された .txt を Open WebUI の Knowledge にアップロードしてください。" -ForegroundColor Green
