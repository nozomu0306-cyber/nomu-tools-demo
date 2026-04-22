# QUICKSTART — SD セットアップ手順

段階的 / 手動でやりたい時の手順書。全自動は `setup/00_run_all.ps1` で OK。

## 前提

- Windows 11
- 管理者 PowerShell
- `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force` を各セッションで

---

## STEP 1: 前提ツール

```powershell
.\01_install_prereqs.ps1
```

- Git と Python 3.10 を winget で入れる
- `C:\Users\nozom\AI\` フォルダを作成

**手動でやるなら:**
```powershell
winget install --id Git.Git -e
winget install --id Python.Python.3.10 -e
```

確認: `py -3.10 --version` で `Python 3.10.x` が出れば OK

---

## STEP 2: Forge を clone

```powershell
.\02_clone_forge.ps1
```

**手動でやるなら:**
```powershell
cd $env:USERPROFILE\AI
git clone https://github.com/lllyasviel/stable-diffusion-webui-forge
```

---

## STEP 3: webui-user.bat を最適化

```powershell
.\03_configure_forge.ps1
```

`setup/webui-user.bat.template` を Forge フォルダにコピーする。

**中身:**
- Python 3.10 ランチャー (`py -3.10`)
- `--opt-sdp-attention --cuda-malloc --disable-nan-check --api`
- （必要時）PyTorch Nightly CUDA 12.8 への切替オプション
- （必要時）`--medvram-sdxl` 切替オプション

**手動でやるなら:** `setup/webui-user.bat.template` をコピペして `stable-diffusion-webui-forge/webui-user.bat` に保存。

---

## STEP 4: 拡張機能インストール

```powershell
.\06_install_extensions.ps1
```

以下 4 種を `extensions/` に git clone:
- sd-webui-controlnet
- adetailer
- sd-webui-regional-prompter
- sd-webui-inpaint-anything

**手動でやるなら:**
```powershell
cd $env:USERPROFILE\AI\stable-diffusion-webui-forge\extensions
git clone https://github.com/Mikubill/sd-webui-controlnet.git
git clone https://github.com/Bing-su/adetailer.git
git clone https://github.com/hako-mikan/sd-webui-regional-prompter.git
git clone https://github.com/Uminosachi/sd-webui-inpaint-anything.git
```

---

## STEP 5: HuggingFace モデル DL（約19GB）

### 事前準備（1 回だけ）

1. https://huggingface.co/settings/tokens で **Access Token (Read)** を発行
2. https://huggingface.co/black-forest-labs/FLUX.1-dev を開いて **Agree and access repository** を押す

### 実行

```powershell
.\04_download_hf_models.ps1
```

Token 入力を求められる。貼り付け時は画面に何も出ないのが仕様（Linux 流）。

**手動でやるなら:**
```powershell
py -3.10 -m pip install --upgrade huggingface_hub
# トークンを環境変数にセット (このセッション限定)
$env:HF_TOKEN = "hf_xxxxxxxxxxxxx"   # ← 自分のトークンに置き換え
# 動作確認
py -3.10 -c "from huggingface_hub import HfApi; print(HfApi().whoami()['name'])"

$forge = "$env:USERPROFILE\AI\stable-diffusion-webui-forge\models"

# FLUX.1-dev
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='city96/FLUX.1-dev-gguf', filename='flux1-dev-Q4_K_S.gguf', local_dir=r'$forge\Stable-diffusion')"

# FLUX.1-Fill
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='city96/FLUX.1-Fill-dev-gguf', filename='flux1-fill-dev-Q4_K_S.gguf', local_dir=r'$forge\diffusion_models')"

# FLUX.1-Kontext
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='city96/FLUX.1-Kontext-dev-gguf', filename='flux1-kontext-dev-Q4_K_S.gguf', local_dir=r'$forge\diffusion_models')"

# CLIP-L
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='comfyanonymous/flux_text_encoders', filename='clip_l.safetensors', local_dir=r'$forge\text_encoder')"

# T5XXL fp8
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='comfyanonymous/flux_text_encoders', filename='t5xxl_fp8_e4m3fn.safetensors', local_dir=r'$forge\text_encoder')"

# FLUX VAE
py -3.10 -c "from huggingface_hub import hf_hub_download; hf_hub_download(repo_id='black-forest-labs/FLUX.1-dev', filename='ae.safetensors', local_dir=r'$forge\VAE')"
```

途中で切れても同じコマンドで再開できます（huggingface_hub はキャッシュ対応）。

---

## STEP 6: Civitai モデル 手動 DL（約31GB）

`setup/05_civitai_manual_guide.md` に沿ってブラウザで DL:
- Juggernaut XL v11
- RealVisXL V5.0
- Pony Diffusion V6 XL
- Big ASP v2
- SDXL Turbo

保存先: `C:\Users\nozom\AI\stable-diffusion-webui-forge\models\Stable-diffusion\`

---

## STEP 7: Forge 初回起動

```powershell
cd $env:USERPROFILE\AI\stable-diffusion-webui-forge
.\webui-user.bat
```

初回は依存パッケージ DL 10〜20 分。完了するとブラウザで http://127.0.0.1:7860 が開く。

---

## STEP 8: 動作確認

`prompts/test_prompts.md` の 5〜7 種のテストを実行。全部通れば完了。

---

## STEP 9（オプション）: AutoHotKey ショートカット

1. https://www.autohotkey.com/ から **AutoHotkey v2** を DL・インストール
2. `autohotkey/sd-shortcut.ahk` をダブルクリック
3. `Ctrl+Alt+I` で Forge を起動できる

---

## 完了後の使い方

- **起動**: `.\webui-user.bat` または `Ctrl+Alt+I`
- **モデル切替**: UI 左上の Checkpoint プルダウン
- **モデル選びの指針**: `docs/MODEL_GUIDE.md`
- **立ち絵・差分作成の手順**: `docs/WORKFLOW_GUIDE.md`
- **プリセット**: `prompts/preset_templates.md`
- **エラー対処**: `docs/TROUBLESHOOTING.md`
