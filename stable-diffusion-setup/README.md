# のむさん専用 Stable Diffusion + FLUX セットアップキット

Windows 11 (RTX 5060 Ti 8GB) でノベルゲーム立ち絵・差分・小説挿絵・R-18 を生成するための環境構築キット。

## インストール場所
```
C:\Users\nozom\AI\
  └ stable-diffusion-webui-forge\   ← 本体
      ├ models\                     ← モデルファイル (約50GB)
      └ extensions\                 ← 拡張機能
```

## 落とすモデル（合計 約50GB）

### Civitai 系（R-18含む・手動DLが必要、5モデル・約31GB）
| # | 名前 | 用途 |
|---|---|---|
| 1 | **Juggernaut XL v11** | 実写・汎用主力 |
| 2 | **RealVisXL V5.0** | 実写ポートレート |
| 3 | **Pony Diffusion V6 XL** | アニメR-18定番 |
| 4 | **Big ASP v2** | 実写R-18 |
| 5 | **SDXL Turbo** | 超高速下書き |

### HuggingFace 系（スクリプト自動DL、6ファイル・約19GB）
| # | 名前 | 用途 |
|---|---|---|
| 6 | FLUX.1 dev Q4 GGUF | 勝負所・新規生成 |
| 7 | FLUX.1 Fill dev Q4 GGUF | 部分修正（服装変更の本命） |
| 8 | FLUX.1 Kontext dev Q4 GGUF | テキスト指示で編集 |
| 9 | CLIP-L | FLUX のテキストエンコーダ |
| 10 | T5XXL fp8 | FLUX のテキストエンコーダ |
| 11 | FLUX VAE (ae.safetensors) | FLUX のVAE |

## 最短セットアップ（3フェーズ・1〜2時間 + モデルDL 数時間）

**PowerShell を「管理者として実行」で開く:**

```powershell
cd $env:USERPROFILE
git clone -b claude/github-app-setup-fDv2u https://github.com/nozomu0306-cyber/nomu-tools-demo.git
cd nomu-tools-demo\stable-diffusion-setup\setup
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force
.\00_run_all.ps1
```

> 既に小説AIで clone 済みなら `cd $env:USERPROFILE\nomu-tools-demo; git pull` でOK。

### フェーズ1: 自動セットアップ（`00_run_all.ps1`）
1. Git / Python 3.10 インストール
2. WebUI Forge を `C:\Users\nozom\AI\` に clone
3. webui-user.bat を RTX 5060 Ti 向けに最適化して配置
4. 拡張機能 4 種を自動インストール
5. Forge 初回起動（依存DL、10〜20分）

### フェーズ2: HuggingFace モデル DL（`04_download_hf_models.ps1`）
1. HF CLI でログイン（アクセストークン要）
2. FLUX 系 6 ファイル自動 DL（約 19GB）

### フェーズ3: Civitai モデル DL（手動）
`setup/05_civitai_manual_guide.md` に従ってブラウザで 5 モデル DL → 所定フォルダへコピー。

---

## セットアップ完了後

- WebUI Forge 起動: **http://127.0.0.1:7860**
- AutoHotKey のショートカット: **Ctrl+Alt+I**（起動）
- モード選びは **`docs/MODEL_GUIDE.md`** を参照
- 立ち絵作成・差分作成の手順は **`docs/WORKFLOW_GUIDE.md`** を参照

---

## 重要：RTX 5060 Ti 8GB VRAM の性能感

| 用途 | 所要時間目安 |
|---|---|
| SDXL 系 (Juggernaut / Pony / Big ASP) 832×1216 | 20〜30秒/枚 |
| SDXL Turbo 1024×1024（ステップ1） | 1〜3秒/枚 |
| **FLUX.1-dev / Fill / Kontext Q4** 1024×1024 | **60〜120秒/枚** |

**運用方針:** 日常の立ち絵・差分量産は SDXL 系を主力に、FLUX は勝負所（服装変更・テキスト編集）だけで使う。

---

## トラブル時

**`docs/TROUBLESHOOTING.md`** を参照。よくあるやつ:

- **CUDA out of memory**: 解像度を下げる、`--medvram-sdxl` を有効化
- **RTX 50シリーズで起動しない**: PyTorch のバージョンを CUDA 12.8 対応版に上げる（スクリプトで対応）
- **FLUX.1-Kontext が Forge で動かない**: ComfyUI 側に切替（`docs/TROUBLESHOOTING.md` 参照）

---

## ファイル一覧

```
stable-diffusion-setup/
├── README.md                    ← これ
├── setup/
│   ├── 00_run_all.ps1           ← 一括実行
│   ├── 01_install_prereqs.ps1   ← Git/Python 3.10
│   ├── 02_clone_forge.ps1       ← Forge を clone
│   ├── 03_configure_forge.ps1   ← webui-user.bat 配置
│   ├── 04_download_hf_models.ps1← HuggingFace DL
│   ├── 05_civitai_manual_guide.md← Civitai 手動手順
│   ├── 06_install_extensions.ps1← 拡張機能 4 種
│   └── webui-user.bat.template  ← 最適化済 bat
├── prompts/
│   ├── test_prompts.md          ← 動作確認用 5 種
│   └── preset_templates.md      ← 立ち絵・差分用プリセット
├── autohotkey/
│   └── sd-shortcut.ahk          ← Ctrl+Alt+I で起動
└── docs/
    ├── QUICKSTART.md
    ├── MODEL_GUIDE.md           ← モデル使い分け
    ├── WORKFLOW_GUIDE.md        ← 立ち絵・差分作成フロー
    └── TROUBLESHOOTING.md
```
