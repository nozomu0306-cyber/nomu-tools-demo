; ======================================================================
;  のむさん専用 Stable Diffusion ショートカット (AutoHotKey v2)
; ======================================================================
;
;  インストール:
;    1) https://www.autohotkey.com/ から AutoHotkey v2 をインストール
;    2) このファイル (sd-shortcut.ahk) をダブルクリックで常駐
;    3) スタートアップに登録する場合:
;         Win+R → shell:startup でフォルダを開き、このファイルのショートカットを置く
;
;  キー:
;    Ctrl+Alt+I   → WebUI Forge をバックグラウンド起動してブラウザで開く
;    Ctrl+Alt+B   → ブラウザだけ http://127.0.0.1:7860 に (既に起動済み時)
;    Ctrl+Alt+S   → Forge の Stable-diffusion フォルダをエクスプローラで開く
;    Ctrl+Alt+L   → Forge の Lora フォルダをエクスプローラで開く
; ======================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force

ForgeDir := A_UserDir "\AI\stable-diffusion-webui-forge"

StartForge() {
    forgeBat := A_UserDir "\AI\stable-diffusion-webui-forge\webui-user.bat"
    if !FileExist(forgeBat) {
        MsgBox "Forge が見つかりません:`n" forgeBat "`nセットアップが完了していない可能性があります。"
        return
    }
    ; バックグラウンドで起動
    Run '"' forgeBat '"', A_UserDir "\AI\stable-diffusion-webui-forge", "Min"
    TrayTip "WebUI Forge 起動中", "起動には 30〜60 秒かかります。完了するとブラウザが自動で開きます。", 3
}

OpenBrowser() {
    Run "http://127.0.0.1:7860"
}

OpenStableDiffusionDir() {
    dir := A_UserDir "\AI\stable-diffusion-webui-forge\models\Stable-diffusion"
    if DirExist(dir) {
        Run dir
    } else {
        MsgBox "フォルダが見つかりません:`n" dir
    }
}

OpenLoraDir() {
    dir := A_UserDir "\AI\stable-diffusion-webui-forge\models\Lora"
    if DirExist(dir) {
        Run dir
    } else {
        MsgBox "フォルダが見つかりません:`n" dir
    }
}

^!i::StartForge()
^!b::OpenBrowser()
^!s::OpenStableDiffusionDir()
^!l::OpenLoraDir()

TrayTip "SD Shortcuts 常駐開始", "Ctrl+Alt+I で Forge 起動", 3
