# MODEL_GUIDE — どのモデルをいつ使うか

6 つのモデルの使い分け実践ガイド。

---

## 即席 早見表

| やりたいこと | モデル | 速度 |
|---|---|---|
| アニメ立ち絵・差分 | **Pony Diffusion V6 XL** | 20〜30秒 |
| 実写ポートレート・告知 | **Juggernaut XL v11** | 20〜30秒 |
| 実写ポートレート別解釈 | **RealVisXL V5.0** | 20〜30秒 |
| 実写 R-18 | **Big ASP v2** | 25〜35秒 |
| 構図ラフ・下書き | **SDXL Turbo** | 1〜3秒 |
| 勝負所・挿絵 | **FLUX.1-dev** | 60〜120秒 |
| 服装変更 (マスク方式) | **FLUX.1-Fill** | 60〜120秒 |
| テキスト指示で編集 | **FLUX.1-Kontext** | 60〜120秒 |

---

## 各モデルの詳細

### Pony Diffusion V6 XL
- **ジャンル:** アニメ系、イラスト、二次創作の標準
- **強み:** R-18 含めてタグ指定が効く、キャラ特徴の精度高い
- **特殊ルール:** `score_9, score_8_up, score_7_up` を必須プロンプトに
- **使い時:** ノベルゲーム立ち絵、アニメキャラ挿絵、二次創作
- **解像度:** 832×1216（縦）、1216×832（横）、1024×1024

### Juggernaut XL v11
- **ジャンル:** 実写・汎用
- **強み:** バランスが良い、プロンプトへの追従性が高い
- **使い時:** 実写ポートレート、告知画像、リアル系の小説挿絵
- **品質タグ:** `masterpiece, best quality, photorealistic, detailed skin, 8k`

### RealVisXL V5.0
- **ジャンル:** 実写ポートレート特化
- **強み:** Juggernaut より肌質・光源処理が繊細
- **使い時:** 「顔のアップ」「肌の質感重視」のシーン
- **違い:** Juggernaut は汎用、RealVis はポートレートに特化

### Big ASP v2
- **ジャンル:** 実写 R-18
- **強み:** 実写の成人向け描写、リアル系
- **使い時:** 実写 R-18 挿絵・差分
- **注意:** 年齢表現は必ず成人設定に

### SDXL Turbo
- **ジャンル:** 超高速下書き専用
- **強み:** 1〜3 秒で 1 枚、構図試行に最適
- **使い時:** 「このプロンプトでどんな構図になる？」の下見
- **特殊設定:** Steps=1, CFG=1
- **欠点:** 細部の精度は低い（本番には不向き）

### FLUX.1-dev Q4 GGUF
- **ジャンル:** 高品質汎用生成
- **強み:** 自然言語プロンプト、英語文字を画像に入れられる、手足の破綻が少ない
- **使い時:** 表紙、章扉、勝負所の挿絵、書籍デザイン
- **欠点:** 遅い (60〜120秒)、R-18 描写はやや弱め（abliterated版はない）
- **特殊設定:** Sampler=Euler, Schedule=Simple, Distilled CFG=3.5, CFG=1.0

### FLUX.1-Fill dev Q4 GGUF（最重要）
- **ジャンル:** Inpaint（マスク方式の部分修正）特化
- **強み:** 顔を同一に保ったまま服だけ変える・背景だけ変える
- **使い時:** ノベルゲームの衣装差分・背景差分の量産
- **運用:** 元画像 → Inpaint でマスク → FLUX.1-Fill でプロンプト指定

### FLUX.1-Kontext dev Q4 GGUF
- **ジャンル:** テキスト指示による画像編集（マスク不要）
- **強み:** 「change clothing to swimsuit」のような自然言語指示で変更
- **使い時:** マスク作業が面倒な時、全体の雰囲気を変えたい時
- **注意:** Forge の対応状況次第、動かなければ ComfyUI 経由で

---

## 用途別おすすめの組み合わせ

### ノベルゲーム立ち絵の量産

1. **Pony** で基本立ち絵（表情1つ）を確定 → 832×1216
2. Adetailer で顔を自動補正
3. 表情差分は img2img Inpaint で顔だけ塗って **Pony** で再生成（Denoise 0.55）
4. 衣装差分は Inpaint で体を塗って **FLUX.1-Fill** で再生成（Denoise 0.95）
5. 全パーツ揃ったら透過処理（rembg 拡張）

### 実写系告知画像

1. **Juggernaut** か **RealVis** でベース
2. **Adetailer** で顔補正
3. **Hires Fix** で x1.5 アップスケール
4. FLUX.1-dev に img2img で渡して質感を一段階上げる（時間あれば）

### R-18 差分

1. **Pony** or **Big ASP** でベース
2. 表情差分: 同じモデル + Inpaint
3. 衣装変更: **FLUX.1-Fill**（検閲弱め、Inpaint部分だけなら問題なく動く）

### 小説の挿絵（章扉、見開き）

1. プロンプト検証: **SDXL Turbo** で構図案 5 枚ラフ (5〜15秒)
2. 構図決定後: **FLUX.1-dev** で本番 (60〜120秒)
3. 必要なら Inpaint で細部調整

---

## VRAM 使用量の目安（RTX 5060 Ti 8GB）

| モデル | VRAM ピーク | 同時ロード |
|---|---|---|
| SDXL 系 (Juggernaut 等) | 6〜7GB | ギリOK |
| SDXL Turbo | 5GB | 余裕 |
| FLUX.1 Q4 GGUF + T5 | **7〜8GB + CPU オフロード** | ギリギリ |
| FLUX.1-Fill Q4 + T5 | 同上 | 同上 |
| FLUX.1-Kontext Q4 + T5 | 同上 | 同上 |

**Tips:**
- **モデル切替時は Forge が自動で VRAM を解放**するので、複数モデルを同時ロードすることはない
- FLUX 系は T5 を CPU で動かすのが前提（これが遅さの主因）
- 限界なら webui-user.bat の `--medvram-sdxl` を有効化

---

## よくある失敗と対処

### Pony で R-18 が出ない
→ プロンプトに `rating_explicit` を追加。`score_9` 類は必須。

### Juggernaut で顔が崩れる
→ **Adetailer を ON**、または Hires Fix を上げる (x1.8)

### FLUX で全然生成されない / エラー
→ ae.safetensors (VAE) と T5 エンコーダの配置を確認:
```
models/VAE/ae.safetensors
models/text_encoder/clip_l.safetensors
models/text_encoder/t5xxl_fp8_e4m3fn.safetensors
```

### 服だけ変えたかったのに全然違うキャラになる
→ Inpaint で **Masked content = original**、**Inpaint area = Only masked**、Denoise 0.95 推奨

### 生成が遅すぎる
→ SDXL Turbo (Steps=1) で試す。本番生成でなく構図確認ならこれで十分
