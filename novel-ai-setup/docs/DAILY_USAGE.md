# DAILY_USAGE — 日常の起動・操作ガイド

セットアップが終わった後の「毎日どう使うか」をまとめた実運用マニュアル。

---

## そもそも自動で動くもの／動かないもの

| 機能 | Windows 起動時 | 説明 |
|---|---|---|
| **Ollama 本体** | ✅ 自動起動 | サービスとして常駐、何もしなくても使える |
| **Docker Desktop** | △ 設定次第 | 既定では自動、変更していれば手動 |
| **Open WebUI** | ✅ Docker が起動していれば自動 | `restart: always` なのでDocker起動と同時に立ち上がる |
| **AutoHotKey ショートカット** | ❌ 手動 | スタートアップに登録すれば自動化可能（下記） |

**結論: PCを起動したら、基本的には何もしなくても使えます。**
Docker Desktop のクジラ🐳アイコンが緑になっているのを確認するだけ。

---

## 毎日の使い方（典型パターン）

### パターンA: ブラウザで書く（推奨、GUI派）

1. ブラウザで **http://localhost:3000** を開く
2. 左上プルダウンで使いたいモード（`novel-general` / `novel-r18` など）を選択
3. 左サイドバーの **New Chat** で新規会話
4. 過去の会話は左に履歴として残る（検索可）

**ブックマーク推奨:** `http://localhost:3000` をブラウザのお気に入りに入れておく

### パターンB: PowerShell で書く（CLI派、軽量）

```powershell
ollama run novel-general
```

でいきなり対話開始。終了は `/bye` または `Ctrl+D`。

→ Open WebUI を介さないので Docker 起動していなくても動く
→ でも会話履歴は残らない（一問一答）

### パターンC: AutoHotKey ショートカット（任意）

事前に `novel-shortcut.ahk` をダブルクリックで常駐させておくと:

| キー | 効果 |
|---|---|
| **Ctrl+Alt+N** | `novel-general` 起動 |
| **Ctrl+Alt+R** | `novel-r18` 起動 |
| **Ctrl+Alt+A** | `novel-r18-any` 起動 |
| **Ctrl+Alt+M** | `novel-mystery` (QwQ) 起動 |
| **Ctrl+Alt+P** | `plot-design` (QwQ) 起動 |
| **Ctrl+Alt+E** | `edit-polish` (QwQ) 起動 |
| **Ctrl+Alt+T** | `title-synopsis` 起動 |
| **Ctrl+Alt+W** | Open WebUI をブラウザで開く |
| **Ctrl+Alt+O** | `ollama list` で登録済モード確認 |

**Windows 起動時に自動化したい場合:**
1. `Win+R` → `shell:startup` で開いたフォルダに `novel-shortcut.ahk` のショートカットを置く
2. 以降、PC起動時に自動常駐

---

## Windows を再起動した後に確認すること

通常は全部自動復旧しますが、うまくいかない場合の確認順:

### 1. Docker Desktop が起動しているか
タスクトレイ（画面右下）のクジラ🐳アイコンを確認。

- **緑色のクジラ**: OK
- **灰色 / 点滅**: 起動中、1-2分待つ
- **アイコンが無い**: 手動起動が必要 →
  ```powershell
  Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
  ```

### 2. Open WebUI が応答するか
ブラウザで http://localhost:3000 を開いて反応するか確認。
反応しなければ:
```powershell
docker ps
```
で `open-webui` が動いているか確認。動いていなければ:
```powershell
docker start open-webui
```

### 3. Ollama が動いているか
```powershell
ollama list
```
でモデル一覧が出れば OK。出なければサービス再起動:
```powershell
Restart-Service Ollama -ErrorAction SilentlyContinue
# それでも駄目なら手動起動
Start-Process "ollama" -ArgumentList "serve" -WindowStyle Hidden
```

---

## 終了・一時停止の仕方

### 執筆終わり（PCは動かしたまま）
何もしなくて OK。Open WebUI は常駐のまま、リソースはほぼ食わない（GPU はモデル推論時以外アイドル）。

### 一時的にリソースを解放したい
```powershell
# Open WebUI だけ止める
docker stop open-webui

# Ollama のモデルメモリを解放（GPU VRAM を空ける）
ollama stop qwen2.5:14b-instruct-q4_K_M
ollama stop huihui_ai/qwen2.5-abliterate:14b
# ...など
```
再開は次に `ollama run` / Open WebUI 使用時に自動ロード。

### PC シャットダウン前
全部そのままで OK。Windows が勝手に後片付けします。

---

## 書いた小説の保存場所

**Open WebUI の会話履歴:**
- Docker ボリューム `open-webui` に保存（`C:\ProgramData\docker\volumes\open-webui\_data` あたり）
- ブラウザからログインすれば過去会話が左サイドバーに全部残る
- **重要: ログイン中のアカウントでしか見えない**ので、アカウント情報は忘れないこと

**外部に書き出したい場合:**
- Open WebUI の各会話の **右上メニュー → Export** で Markdown / JSON 出力可
- それを自分の原稿フォルダ（例: `C:\Users\nozom\Documents\小説\`）に保存

**バックアップ（重要な原稿は必ず）:**
```powershell
# 会話データを丸ごとバックアップ
docker run --rm -v open-webui:/data -v ${PWD}:/backup alpine tar czf /backup/openwebui-backup-$(Get-Date -Format "yyyyMMdd").tar.gz -C /data .
```
をたまに実行すれば、カレントディレクトリに `.tar.gz` で保存されます。

---

## モードの切り替え方

### ブラウザ (Open WebUI)
左上の **モデルプルダウン** をクリック → 使いたいモードを選択 → 会話を続ける
（会話途中で切り替えると、次の返答からそのモードになる）

### PowerShell
`/bye` で一度終了 → 新しく `ollama run <モード名>` で起動

### AutoHotKey
該当キーを押すだけ（新しい PowerShell ウィンドウで開く）

---

## Knowledge（自作小説の読み込み）の運用

一度アップロードしたナレッジは永続的に保存されます。日常運用では:

1. 原稿ファイル（`~\Documents\小説\○○.txt` など）を更新したら、Open WebUI の **Workspace → Knowledge** で該当ナレッジを開く
2. 古いファイルを削除して新しいものをアップロード（置き換え）
3. インデックス再構築が数秒〜数分走る

会話で使う時は `#ナレッジ名` と打つだけ:
```
#綻びを繕う者 第3章の続きを書いて
```

詳しくは `KNOWLEDGE_GUIDE.md` 参照。

---

## Web検索の ON / OFF

**毎回の会話ごとに ON / OFF 切り替え可能:**
- Open WebUI の入力欄の上（または下）にある **🌐 Web検索** アイコンをクリック
- ON にすると、AI が質問内容から自動で検索して回答に反映
- OFF（既定）では純粋にローカルモデルのみで回答

**使い分けの目安:**
- 原作情報を調べる二次創作準備 → **ON**（`character-analysis` モード推奨）
- 自作小説の続きを書く → **OFF**（ローカルだけで十分）
- R-18 系は **OFF** 推奨（検索結果に影響されて書きにくくなる可能性）

---

## よくある「あれ、動かない？」と対処

### ブラウザで http://localhost:3000 が開かない
1. Docker Desktop のクジラが緑か確認
2. `docker ps` で `open-webui` が動いているか確認
3. 動いていなければ `docker start open-webui`
4. それでも駄目なら再起動:
   ```powershell
   cd $env:USERPROFILE\nomu-tools-demo\novel-ai-setup\setup
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
   .\05_start_openwebui.ps1
   ```

### Open WebUI にモデル一覧が出てこない / 接続エラー
Ollama と Open WebUI の通信が切れている。Docker コンテナを再起動:
```powershell
docker restart open-webui
```

### 返答が異常に遅い（1分以上無反応）
32B モデル（`novel-mystery`/`novel-ensemble`/`plot-design`/`edit-polish` / R-18 勝負回用）は CPU オフロードで動くため遅いのは仕様。1000字で数分〜15分。
→ 急ぐ時は 14B 系モード（`novel-general`/`novel-r18`/`novel-r18-any`）に切り替え。

### 文字化けする（PowerShell 上）
```powershell
chcp 65001
```
で UTF-8 に切り替え。その PowerShell 内で有効。

### Windows Update 後、動かなくなった
WSL / Docker 周りがよく壊れます。優先順位:
1. `wsl --update`
2. Docker Desktop を 1 回終了して再起動
3. PC 再起動

---

## メンテナンス（月1くらい推奨）

### Ollama モデルの更新
新バージョンが出ていれば:
```powershell
ollama pull qwen2.5:14b-instruct-q4_K_M  # 更新があれば差分DL、なければスキップ
```

### Docker イメージの更新
```powershell
cd $env:USERPROFILE\nomu-tools-demo\novel-ai-setup\setup
docker compose -f openwebui-compose.yml pull
docker compose -f openwebui-compose.yml up -d
```

### ディスク使用量チェック
```powershell
# Ollama モデルサイズ
ollama list

# Docker 使用量
docker system df
```

不要なら:
```powershell
# 使わないモデルを削除
ollama rm <モデル名>

# Docker の古いイメージをクリーンアップ
docker system prune -a
```

---

## Modelfile をカスタマイズしたくなったら

例: `novel-r18` のシステムプロンプトを自分好みに:

```powershell
# 編集
notepad $env:USERPROFILE\nomu-tools-demo\novel-ai-setup\modelfiles\novel-r18.Modelfile

# 再登録
cd $env:USERPROFILE\nomu-tools-demo\novel-ai-setup\modelfiles
ollama create novel-r18 -f novel-r18.Modelfile
```

即反映されます。

---

## 困った時の相談

Mac 側 Claude Code に下記を伝えれば対応できます:
- 起きている症状（「Open WebUI が開かない」等）
- PowerShell のエラー文 or スクリーンショット
- 直前に変えたこと（あれば）

---

## まとめ: 最短ルーティーン

```
1. PC 起動
2. タスクトレイのクジラ🐳が緑になるのを確認
3. ブラウザで http://localhost:3000
4. モード選択して書く
5. 終わったら PC シャットダウン、何もしなくてOK
```

これで日々動きます。
