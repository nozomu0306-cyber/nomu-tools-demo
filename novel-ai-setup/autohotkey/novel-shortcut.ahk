; ======================================================================
;  のむさん専用 小説AI ショートカット (AutoHotKey v2)
; ======================================================================
;
;  インストール:
;    1) https://www.autohotkey.com/ から AutoHotkey v2 をインストール
;    2) このファイル (novel-shortcut.ahk) をダブルクリックで常駐開始
;    3) タスクトレイに緑のHアイコンが出れば稼働中
;    4) スタートアップ登録（自動起動）したい場合:
;         Win+R → shell:startup  でフォルダを開き、このファイルのショートカットを放り込む
;
;  キー割り当て:
;    Ctrl+Alt+N   → novel-general 起動 (既定)
;    Ctrl+Alt+R   → novel-r18 (ベルゼブル系)
;    Ctrl+Alt+A   → novel-r18-any (R-18万能)
;    Ctrl+Alt+M   → novel-mystery (QwQ)
;    Ctrl+Alt+P   → plot-design (プロット設計)
;    Ctrl+Alt+E   → edit-polish (編集校正)
;    Ctrl+Alt+T   → title-synopsis (タイトル生成)
;    Ctrl+Alt+W   → Open WebUI をブラウザで開く (http://localhost:3000)
;    Ctrl+Alt+O   → ollama list (インストール済モード一覧)
;
;  好きにカスタマイズ可能。末尾の割り当て部を書き換えてください。
; ======================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force

RunOllamaMode(ModeName) {
    ; 新しい PowerShell を開き ollama run <mode> を即実行
    Run 'powershell.exe -NoExit -Command "ollama run ' ModeName '"'
}

OpenOpenWebUI() {
    Run "http://localhost:3000"
}

ShowOllamaList() {
    Run 'powershell.exe -NoExit -Command "ollama list"'
}

; --- キー割り当て -----------------------------------------------------

^!n::RunOllamaMode("novel-general")
^!r::RunOllamaMode("novel-r18")
^!a::RunOllamaMode("novel-r18-any")
^!m::RunOllamaMode("novel-mystery")
^!p::RunOllamaMode("plot-design")
^!e::RunOllamaMode("edit-polish")
^!t::RunOllamaMode("title-synopsis")
^!w::OpenOpenWebUI()
^!o::ShowOllamaList()

; --- 起動通知 ---------------------------------------------------------
TrayTip "Novel AI Shortcuts", "Ctrl+Alt+N で novel-general を起動します", 3
