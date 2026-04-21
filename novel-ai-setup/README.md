# のむさん専用 ローカル小説AIセットアップキット

Windows 11 で完全オフラインの小説執筆AIを立ち上げるための一式です。

## これは何？

- **Ollama + 5つのローカルLLM** を使って、PowerShell から `ollama run novel-general` みたいに打つだけで小説AIと対話できる環境を作る
- **18種類の執筆モード**（ジャンル別10 + 二次創作3 + 作業5）が使い分けられる
- **Open WebUI** を Docker で立てて、ブラウザから GUI で使える／オンライン検索もできる／自作小説を Knowledge 機能で読み込ませられる
- **全部ローカルで動く**（Open WebUI の Web検索機能以外は完全オフライン）

## 対象環境（のむさんのPC）

- Windows 11
- AMD Ryzen 7 5700X
- RAM 64GB
- NVIDIA RTX 5060 Ti (VRAM 8GB)
- ストレージ 2TB

## モデル構成（合計 約62GB）

| # | モデル | サイズ | 役割 |
|---|---|---|---|
| 1 | `qwen2.5:14b-instruct-q4_K_M` | 約9GB | 全年齢メイン（速い） |
| 2 | `huihui_ai/qwen2.5-abliterate:14b` | 約9GB | R-18メイン（速い、検閲解除） |
| 3 | `qwen2.5:7b-instruct-q4_K_M` | 約4.5GB | 軽作業（タイトル・あらすじ等） |
| 4 | `huihui_ai/qwen2.5-abliterate:32b` | 約20GB | R-18勝負回・高品質（遅い） |
| 5 | `huihui_ai/qwq-abliterated:32b` | 約20GB | ミステリー・群像・校正の論理検証用（遅い） |

---

## 最短セットアップ手順（コピペ3行）

**※ PowerShell を「管理者として実行」で開いてください。**

```powershell
cd $env:USERPROFILE\Desktop
git clone https://github.com/nozomu0306-cyber/nomu-tools-demo.git
cd nomu-tools-demo\novel-ai-setup\setup
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\00_run_all.ps1
```

これで

1. Ollama インストール
2. 5モデルをダウンロード（**60GB超・数時間かかる**）
3. 18モードを `ollama create` で登録
4. Docker Desktop インストール
5. Open WebUI 起動

まで自動で進みます。

**手動で段階的にやりたい場合は `docs/QUICKSTART.md` を読んでください。**

---

## セットアップ完了後の使い方

### PowerShell から使う

```powershell
ollama run novel-general
```

で即対話開始。例:

```
>>> 主人公が鏡を見て自分の顔を認識できない場面を500字で
```

### ブラウザ(Open WebUI)から使う

ブラウザで http://localhost:3000 を開く → 初回管理者アカウント作成 → モデル選択して会話開始。

オンライン検索ON機能、Knowledge（RAG）機能はここから使える。

### 18モード早見表

| 何を書く／したい | モード名 |
|---|---|
| 何を書くか決まってない | `novel-general` |
| 異世界・なろう系 | `novel-isekai` |
| R-18 現代ファンタジー（ベルゼブル系） | `novel-r18` |
| R-18 ジャンル不問 | `novel-r18-any` |
| Ren'Py ノベルゲーム | `novel-vn` |
| **ミステリー・サスペンス**（QwQで整合性検証） | `novel-mystery` |
| ダークファンタジー | `novel-dark` |
| **群像劇**（QwQ） | `novel-ensemble` |
| 現代ドラマ短編 | `novel-drama` |
| ギャルゲー・恋愛ADV | `novel-galge` |
| 二次創作（全年齢） | `fanfic-general` |
| 二次創作 R-18 | `fanfic-r18` |
| 原作キャラ考察 | `character-analysis` |
| **プロット設計**（QwQ） | `plot-design` |
| キャラクター設計 | `character-design` |
| **編集・校正**（QwQ） | `edit-polish` |
| タイトル・あらすじ生成（軽量7B） | `title-synopsis` |
| 描写強化 | `description-boost` |

詳細は `docs/MODE_GUIDE.md` を参照。

---

## ファイル一覧

```
novel-ai-setup/
├── README.md                    ← これ
├── setup/                       ← セットアップスクリプト
│   ├── 00_run_all.ps1           ← ぜんぶ一括
│   ├── 01_install_ollama.ps1
│   ├── 02_pull_models.ps1
│   ├── 03_build_modelfiles.ps1
│   ├── 04_install_docker.ps1
│   ├── 05_start_openwebui.ps1
│   └── openwebui-compose.yml
├── modelfiles/                  ← 18モードの定義ファイル
│   └── *.Modelfile
├── autohotkey/
│   └── novel-shortcut.ahk       ← Ctrl+Alt+N でAI起動
├── tools/
│   ├── epub-to-txt.ps1          ← EPUB→TXT変換（Knowledge用）
│   └── search-cli.ps1           ← CLI検索（おまけ）
└── docs/
    ├── QUICKSTART.md            ← 手動セットアップ手順
    ├── MODE_GUIDE.md            ← 18モードの詳細説明
    └── KNOWLEDGE_GUIDE.md       ← 自作小説の取り込み方
```

---

## トラブル時

- **ダウンロードが遅い／失敗する** → `02_pull_models.ps1` を再実行。Ollama は途中再開対応。
- **Ollama が動かない** → PowerShell で `ollama --version` を確認。サービス再起動は `Restart-Service Ollama`。
- **Docker が起動しない** → 再起動後に Docker Desktop を手動起動、WSL2 有効化の確認。
- **VRAM不足エラー** → 32Bモデルは GPU に載り切らず CPU オフロードで動くので遅いのは仕様。`qwen2.5:7b` や `:14b` で試す。
- **ファイアウォール警告** → 許可してください（Ollama は 11434ポート、Open WebUI は 3000ポート）。

エラーが出たら **エラー文のスクリーンショット** を Mac 側 Claude Code に貼れば相談できます。

---

## 次にやりたいこと（後回しにしたもの）

- **LoRA ファインチューニング**（のむ文体を直接学習させる）→ 必要になったら別途設計。まず Open WebUI の Knowledge で「#綻びを繕う者 の文体で続きを書いて」を試してから判断推奨。
- **Obsidian 連携** → Obsidian を使うようになったら追加。

---

作成: Claude (Mac側設計) / Claude Code (Linux側実装)
対象: のむさん
