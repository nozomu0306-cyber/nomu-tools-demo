# TROUBLESHOOTING — よくある詰まりと対処

---

## 起動系

### ❌ `webui-user.bat` をダブルクリックしても黒い画面が一瞬で消える
1. PowerShell で手動起動して原因メッセージを確認:
   ```powershell
   cd $env:USERPROFILE\AI\stable-diffusion-webui-forge
   .\webui-user.bat
   ```
2. Python が見つからないエラーなら `py -3.10` が動くか確認:
   ```powershell
   py -3.10 --version
   ```
   動かなければ `01_install_prereqs.ps1` を再実行。

### ❌ `RuntimeError: CUDA error: no kernel image is available for execution on the device`
**原因:** RTX 50 シリーズ (Blackwell / sm_120) に Forge デフォルトの PyTorch が未対応。

**対処:**
1. Forge を一旦閉じる
2. `webui-user.bat` を編集し、以下の行の先頭の `REM` を外す:
   ```
   set TORCH_COMMAND=pip install --pre torch torchvision --index-url https://download.pytorch.org/whl/nightly/cu128
   ```
3. Forge フォルダの `venv` を削除:
   ```powershell
   Remove-Item -Recurse -Force $env:USERPROFILE\AI\stable-diffusion-webui-forge\venv
   ```
4. `webui-user.bat` を再度起動 → venv が作り直され Nightly PyTorch が入る

### ❌ `ModuleNotFoundError: No module named 'xformers'`
対処: xformers を使わない設定なので無視してOK。`webui-user.bat` の COMMANDLINE_ARGS に `--opt-sdp-attention` があれば動く。

もし強制的に要求されるなら一度 venv を削除 → 再起動。

---

## VRAM / メモリ系

### ❌ `CUDA out of memory` エラー
**対処の順序:**

1. 解像度を下げる
   - SDXL: 1024×1024 → 832×1216 or 768×1152
   - FLUX: 1024×1024 → 768×768

2. `webui-user.bat` の `--medvram-sdxl` を有効化:
   ```
   set COMMANDLINE_ARGS=%COMMANDLINE_ARGS% --medvram-sdxl
   ```
   → Forge 再起動

3. Batch size を 1 に

4. Hires Fix を OFF にして試す（ピーク VRAM が減る）

5. それでも出るなら `--lowvram`（最終手段、激遅）

### ❌ FLUX で OOM しまくる
**対処:**
- T5 エンコーダは **CPU オフロード**が前提
- Forge の設定 → FLUX の各 Text Encoder Mode を **CPU** に変更
- それでも駄目なら T5 を `t5xxl_fp16.safetensors`（軽い版）に差し替え

### ❌ 生成途中で PC がフリーズ
- VRAM 不足で Windows ごと固まっているケース
- タスクマネージャーで GPU メモリ使用量を確認
- `--medvram-sdxl` を入れて再起動

---

## モデル・ファイル系

### ❌ Civitai のモデルが Forge に出てこない
- 保存先が `models\Stable-diffusion\` 直下か確認
- ファイル名末尾が `.safetensors` になっているか（`.safetensors.download` とかになっていない）
- Forge UI の Checkpoint プルダウン横の **🔄 更新アイコン**を押す

### ❌ FLUX モデルが Checkpoint プルダウンに出てこない
- FLUX.1-dev (main) → `models/Stable-diffusion/` に置く (これは SDXL と同じ場所)
- FLUX.1-Fill / Kontext → `models/diffusion_models/` に置く
- 更新後 Forge UI を一度 **Settings → Reload UI**

### ❌ HuggingFace DL で 401 / 403 エラー
- `huggingface_cli login` が成功したか確認
- 特に **FLUX.1-dev** は規約同意が必要:
  https://huggingface.co/black-forest-labs/FLUX.1-dev → Agree ボタン
- Access Token の権限が Read になっているか（Write 権限の Fine-grained は別の設定）

### ❌ `huggingface-cli login` でトークン貼り付けても反応がない
- 貼り付け時は画面に **何も表示されないのが仕様**
- 貼り付けたあと Enter を押す
- 次に "Add token as git credential? (Y/n)" → n で OK

---

## 拡張機能系

### ❌ ControlNet が効かない
- Preprocessor で前処理画像を生成しているか確認
- Model プルダウンで適切なモデルを選んでいるか
- ControlNet の **Enable** チェックボックスを入れたか
- **Control Type** が元画像の種類と合っているか（openpose / canny / depth 等）

### ❌ ControlNet モデルをどこから DL するか
- ControlNet タブ内の Model プルダウン右の ↓ アイコン から DL
- または手動で `extensions/sd-webui-controlnet/models/` に配置:
  https://huggingface.co/lllyasviel/sd_control_collection

### ❌ Adetailer で顔が変になる
- Denoising Strength を下げる (0.3 → 0.2)
- Adetailer の Prompt を空にすると元プロンプトを引き継ぐ
- Mask blur を上げると境界が馴染む

### ❌ Inpaint Anything の SAM モデル DL が失敗
- 初回は SAM のモデルを自動 DL する
- 失敗したら手動で配置: 
  `extensions/sd-webui-inpaint-anything/models/` に sam_vit_b / sam_vit_l / sam_vit_h を置く

---

## FLUX.1-Kontext 関連

### ❌ Kontext が Forge で動かない
2025 年時点で Forge の Kontext 対応は進行中。動かない場合:

**対処 A: Forge を最新版にする**
```powershell
cd $env:USERPROFILE\AI\stable-diffusion-webui-forge
git pull
```
→ 再起動

**対処 B: ComfyUI に切り替え**
1. 別途 ComfyUI をインストール:
   ```powershell
   cd $env:USERPROFILE\AI
   git clone https://github.com/comfyanonymous/ComfyUI
   cd ComfyUI
   # 依存インストールは公式 README 参照
   ```
2. Forge の `models/` フォルダをシンボリックリンクで共有:
   ```powershell
   cmd /c mklink /D "$env:USERPROFILE\AI\ComfyUI\models\diffusion_models" "$env:USERPROFILE\AI\stable-diffusion-webui-forge\models\diffusion_models"
   ```
3. ComfyUI で Kontext 用の Workflow テンプレートを使う

---

## ネットワーク系

### ❌ ブラウザで http://127.0.0.1:7860 にアクセスできない
- Forge の起動ログの最後に `Running on local URL: http://127.0.0.1:7860` が出ているか確認
- ポート 7860 が他のアプリに使われていないか:
  ```powershell
  netstat -ano | findstr :7860
  ```
- ファイアウォールで Python が許可されているか（初回起動時に確認ダイアログが出る）

### ❌ `huggingface_hub` DL が途中で止まる
- Ctrl+C で中断 → 同じコマンドを再実行（キャッシュ機構で続きから）
- 完全に止まるなら `~/.cache/huggingface/` を削除して再実行
- VPN・プロキシ経由だとタイムアウトしやすい

---

## 実運用の小ネタ

### 生成結果の保存先
- Forge デフォルト: `stable-diffusion-webui-forge/outputs/txt2img-images/YYYY-MM-DD/`
- Settings → Paths で変更可能

### Prompt を PNG から復元する
- Forge の PNG Info タブに画像をドロップ → 生成時のプロンプト・設定が表示される
- 「Send to txt2img」で即再現可能

### 大量生成時のディスク圧迫
- 1日数百枚生成するとすぐ数 GB になる
- 不要な試作はこまめに削除 or 別ドライブに退避

---

## それでも解決しない

1. **Forge のログ全文** をコピー
2. **エラーメッセージ** + 何をした直後か
3. **スクリーンショット**

を Mac 側 Claude Code に渡せば対応できます。

Forge 自体の GitHub Issues もある:
https://github.com/lllyasviel/stable-diffusion-webui-forge/issues
