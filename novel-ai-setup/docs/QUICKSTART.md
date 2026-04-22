# QUICKSTART — 手動セットアップ手順

`setup/00_run_all.ps1` で全自動セットアップができますが、**段階的にやりたい／途中で失敗した時の個別実行** 用にここに手動手順をまとめています。

## 前提条件

- Windows 11
- インターネット接続（ダウンロード合計 約 63GB）
- ストレージ空き 80GB 以上
- PowerShell を「**管理者として実行**」で開くこと
- 実行ポリシー設定（**PowerShell ウィンドウを開き直すたびに、毎回一度打つ**）:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
  ```
  > `-Scope Process` はそのウィンドウ限定なので、新しいウィンドウでは再度この 1 行が必要。
  > 毎回打ちたくない場合は、ユーザー単位で一度だけ緩める:
  > ```powershell
  > Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
  > ```
  > `RemoteSigned` ならローカル .ps1 は実行可 / ネット DL スクリプトは署名要求で比較的安全。

---

## STEP 1 — Ollama をインストール

```powershell
cd <このリポジトリ>\novel-ai-setup\setup
.\01_install_ollama.ps1
```

**このスクリプトの中身:**
1. winget が使えれば `winget install Ollama.Ollama`
2. 使えなければ https://ollama.com/download/OllamaSetup.exe を自動DL→実行
3. `ollama --version` と `localhost:11434` 応答確認

**手動でやる場合:**
- https://ollama.com/download/windows からインストーラDL
- ダブルクリックで実行
- インストール後、PowerShell を開き直して `ollama --version` が通れば OK

**ファイアウォール警告が出たら「許可」してください** (11434 ポート)

---

## STEP 2 — 5モデルをダウンロード（合計 約62GB）

```powershell
.\02_pull_models.ps1
```

**落とすモデル:**
| モデル | サイズ |
|---|---|
| `qwen2.5:14b-instruct-q4_K_M` | 約9GB |
| `huihui_ai/qwen2.5-abliterate:14b` | 約9GB |
| `qwen2.5:7b-instruct-q4_K_M` | 約4.5GB |
| `huihui_ai/qwen2.5-abliterate:32b` | 約20GB |
| `huihui_ai/qwq-abliterated:32b` | 約20GB |

**手動でやる場合 (1つずつ):**
```powershell
ollama pull qwen2.5:14b-instruct-q4_K_M
ollama pull huihui_ai/qwen2.5-abliterate:14b
ollama pull qwen2.5:7b-instruct-q4_K_M
ollama pull huihui_ai/qwen2.5-abliterate:32b
ollama pull huihui_ai/qwq-abliterated:32b
```

途中で切れても同じコマンドを再実行すれば再開されます。

**確認:**
```powershell
ollama list
```

---

## STEP 3 — 18モードを登録

```powershell
.\03_build_modelfiles.ps1
```

このスクリプトは `../modelfiles/*.Modelfile` を全て `ollama create` で登録します。

**手動でやる場合 (1つずつ):**
```powershell
cd <リポジトリ>\novel-ai-setup
ollama create novel-general -f modelfiles/novel-general.Modelfile
ollama create novel-isekai  -f modelfiles/novel-isekai.Modelfile
# ...（18個）
```

**確認:**
```powershell
ollama list | Select-String -Pattern "novel-|fanfic-|character-|plot-|edit-|title-|description-"
```

---

## STEP 4 — 動作確認

```powershell
ollama run novel-general
```

プロンプトが `>>>` に変わったら以下を入力:
```
主人公が鏡を見て自分の顔を認識できない場面を500字で
```

→ 日本語の小説らしい文章が出てくれば成功。
→ 終了は `/bye` または Ctrl+D

---

## STEP 5 — Docker Desktop インストール

```powershell
.\04_install_docker.ps1
```

**手動でやる場合:**
- https://www.docker.com/products/docker-desktop/ からインストーラDL
- インストール時「WSL2 を使う」にチェック
- **再起動が必要になることがあります**
- 再起動後、Docker Desktop を起動して「クジラ」アイコンがタスクトレイに出れば OK

---

## STEP 6 — Open WebUI を起動

```powershell
.\05_start_openwebui.ps1
```

**手動でやる場合:**
```powershell
cd <リポジトリ>\novel-ai-setup\setup
docker compose -f openwebui-compose.yml up -d
```

→ ブラウザで http://localhost:3000

**初回手順:**
1. **管理者アカウント作成** — メール／パスワード（ローカル限定なのでどんな内容でも可）
2. **設定 → 管理者パネル → 設定 → Web検索 → 有効化**
   - 検索エンジン: **DuckDuckGo**（APIキー不要）を推奨
   - または Brave Search（API キー取得で高精度、毎月無料枠あり）
3. **モデル選択** — 左上プルダウンから `novel-general` や他のモードを選択
4. **Knowledge (RAG) 機能** — 左サイドバー → Workspace → Knowledge → 新規作成 → TXT/PDF 等アップロード
5. 会話時に `#ナレッジベース名` と入力すれば参照される

詳しくは `KNOWLEDGE_GUIDE.md` を参照。

---

## STEP 7（オプション）— AutoHotKey でショートカット

1. https://www.autohotkey.com/ から **AutoHotkey v2** をインストール
2. `autohotkey/novel-shortcut.ahk` をダブルクリック → タスクトレイに緑の H アイコン
3. これで `Ctrl+Alt+N` → novel-general が即起動

常時有効にしたい場合:
- `Win+R` → `shell:startup` → 開いたフォルダに `novel-shortcut.ahk` のショートカットを置く

---

## トラブルシューティング

### `ollama` コマンドが見つからない
```powershell
# PATH が反映されていないだけの可能性。PowerShell を閉じて開き直す。
# それでも駄目なら:
Get-ChildItem "C:\Program Files\Ollama" -Filter ollama.exe
# 見つかれば:
$env:Path += ";C:\Program Files\Ollama"
```

### `ollama pull` が途中で止まる
- ネットワーク不安定の可能性。同じコマンドを再実行すれば続きから。
- 完全に失敗するなら、一旦 `ollama rm <モデル名>` で削除して再 pull。

### Docker Desktop が起動しない
- WSL2 が有効になっているか確認: PowerShell で `wsl --status`
- 有効でなければ: `wsl --install` → 再起動
- BIOS で仮想化 (VT-x / AMD-V) が有効か確認

### Open WebUI に Ollama のモデルが出てこない
```powershell
# ホストの Ollama に Docker コンテナから繋がっているか確認
docker exec open-webui curl http://host.docker.internal:11434/api/tags
```
返ってこなければファイアウォールで 11434 を許可。

### VRAM 不足エラー
- 32B モデルは 8GB VRAM に乗り切らず CPU オフロードで動くので遅いのは仕様
- 速度優先なら `novel-r18`（14B）を使う、じっくり書くなら `novel-r18` の FROM を 32B に変更して再ビルド

---

## アンインストール手順

```powershell
# モデル削除
ollama rm novel-general
# ...
# 一括削除:
ollama list | Select-String -Pattern "novel-|fanfic-|character-|plot-|edit-|title-|description-" | ForEach-Object {
    $name = ($_ -split '\s+')[0]
    ollama rm $name
}

# ベースモデル削除（容量回復したい場合）
ollama rm qwen2.5:14b-instruct-q4_K_M
ollama rm huihui_ai/qwen2.5-abliterate:14b
ollama rm qwen2.5:7b-instruct-q4_K_M
ollama rm huihui_ai/qwen2.5-abliterate:32b
ollama rm huihui_ai/qwq-abliterated:32b

# Open WebUI 停止
docker compose -f .\setup\openwebui-compose.yml down
# データも削除する場合
docker volume rm open-webui
```
