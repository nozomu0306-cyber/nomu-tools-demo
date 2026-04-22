# ノベルゲーム向け プリセットテンプレート

立ち絵・差分作成・挿絵制作の頻用パターンをまとめたプロンプト集。

---

## A. 立ち絵（全身・透過前提）

### アニメ調立ち絵（Pony）

**Checkpoint:** `ponyDiffusionV6XL`

**プロンプト骨格:**
```
score_9, score_8_up, score_7_up,
1girl, solo, full body, standing,
[キャラ特徴: hair, eyes, clothes],
simple background, white background,
masterpiece, best quality, detailed face
```

**ネガティブ:**
```
score_4, score_5, score_6,
multiple girls, cropped, upper body only,
complex background, busy scene,
low quality, bad anatomy
```

**設定:**
- 解像度: **768×1152** か **832×1216** （立ち絵は縦長）
- Steps: 30
- Sampler: DPM++ 2M Karras
- CFG: 7
- Hires Fix: ON (x1.5)
- **Adetailer: ON** (顔補正)

**透過背景にする:** 拡張「ABG Extension」か後処理 `rembg` で背景除去

---

### 実写調立ち絵（Juggernaut）

**Checkpoint:** `juggernautXL_v11`

**プロンプト骨格:**
```
a full-body photograph of a [年齢]-year-old [性別],
wearing [服装], standing pose,
[髪型], [目の色],
plain white background, studio lighting,
photorealistic, detailed skin, 8k
```

**設定:**
- 解像度: 768×1152
- Steps: 30, CFG 5.5
- Hires Fix: ON
- Adetailer: ON

---

## B. 表情差分（同一キャラの表情だけ変える）

**ベース立ち絵ができたら:**

1. Forge の **img2img** タブ
2. 元立ち絵をアップロード
3. Inpaint で **顔だけ** 塗る
4. プロンプトを表情だけ変える:

**差分パターン例:**
- `smiling, happy expression, eyes closed in laughter`
- `sad, tearful eyes, biting lower lip`
- `angry, furrowed brows, sharp gaze`
- `blushing, shy smile, looking away`
- `surprised, wide eyes, mouth slightly open`

**設定:**
- Denoising: **0.5〜0.65** (高いと顔が別人になる)
- Mask mode: Inpaint masked
- Masked content: original

---

## C. 衣装差分（FLUX.1-Fill、本命）

**用途:** 同じキャラの服だけ着替えさせる（制服/私服/水着 等）

**手順:**
1. img2img → Inpaint
2. Checkpoint を `flux1-fill-dev-Q4_K_S` に切替
3. 体の服部分を塗る（顔・手・靴は塗らない）
4. プロンプト:

**衣装差分プリセット:**
- `wearing a school uniform with pleated skirt`
- `wearing a white summer dress with floral pattern`
- `wearing casual clothes: gray hoodie and black jeans`
- `wearing a red kimono with gold obi`
- `wearing a black bikini swimsuit`
- `wearing business attire: white blouse and black skirt`

**設定:**
- Denoising: **0.95**
- Steps: 20
- Distilled CFG: 3.5
- CFG: 1.0
- Sampler: Euler

---

## D. 背景差分（同じ構図で場所だけ変える）

**Inpaint で背景だけ塗る** → FLUX.1-Fill または Pony で再生成:

**背景プロンプト例:**
- `classroom interior, afternoon light through windows`
- `traditional japanese garden with cherry blossoms`
- `cyberpunk city street at night, neon signs`
- `cozy cafe interior, warm lighting`
- `rainy alleyway, wet asphalt, umbrella`

**設定:**
- Denoising: 0.75
- キャラ部分を塗り残すのでキャラ指定のプロンプトは入れない

---

## E. R-18 アニメ差分（Pony R-18）

**Checkpoint:** `ponyDiffusionV6XL`

**プロンプト骨格:**
```
score_9, score_8_up,
rating_explicit,
1girl, solo, [シチュエーション],
[キャラ特徴],
masterpiece, best quality
```

**ネガティブ:**
```
score_4, score_5, score_6,
low quality, bad anatomy, deformed,
loli, child, young (※ 未成年除外を明示)
```

**設定:**
- 解像度: 832×1216 または 1024×1024
- Steps: 30
- CFG: 7
- Adetailer: ON

**R-18 タグで使える強度段階:**
- `rating_safe` (全年齢)
- `rating_questionable` (きわどい)
- `rating_explicit` (成人向け)

---

## F. R-18 実写（Big ASP v2）

**Checkpoint:** `bigASPv2`

**プロンプト骨格:**
```
photorealistic, score_9, rating_explicit,
[キャラ性別・年齢], [ポーズ],
[シチュエーション・照明],
detailed skin, 8k
```

**ネガティブ:**
```
score_4, cartoon, anime, 3d render,
low quality, blurry, deformed,
young, teen, loli
```

**設定:**
- 解像度: 832×1216
- Steps: 35
- CFG: 6
- Adetailer: ON

---

## G. 挿絵（小説用・FLUX 勝負）

長編小説の見開きイラスト、表紙、章扉などには FLUX が最適（時間かかるが質感◎）:

**Checkpoint:** `flux1-dev-Q4_K_S`

**プロンプト (自然言語):**
```
A dramatic illustration for a fantasy novel.
A young woman in a torn white dress stands at the edge of a cliff at dawn,
looking down at a burning city below. Cinematic wide composition,
painterly style, intricate details, atmospheric lighting.
```

**設定:**
- 解像度: 1024×1024 か 1216×832 (ワイド)
- Steps: 20〜25
- Sampler: Euler
- Schedule: Simple
- Distilled CFG: 3.5

---

## H. 表紙・告知画像（ワイド）

**タイトル文字を入れたい場合:**
FLUX.1-dev は英語の短文なら画像に入れられる:

**プロンプト:**
```
A book cover design. Dark atmosphere,
a shadowy figure standing under a blood moon.
Title text "[タイトル名]" in elegant serif font at the top.
Author name at the bottom.
```

**設定:**
- 解像度: 1216×832 または 1536×1024
- FLUX で生成後、Photoshop / Affinity で文字を整える方が確実

---

## 汎用：品質タグ辞書

| モデル | 品質タグ |
|---|---|
| Pony 系 | `score_9, score_8_up, score_7_up` |
| SDXL 汎用 | `masterpiece, best quality, highly detailed, 8k` |
| 実写系 | `photorealistic, RAW photo, detailed skin, professional photography, 8k` |
| アニメ系 | `anime style, clean lineart, vibrant colors, detailed face` |
| 古典風 | `ukiyo-e style, traditional japanese painting, ink and color on silk` |

---

## 汎用：ネガティブプロンプト辞書

| 状況 | ネガティブ |
|---|---|
| アニメ全般 | `low quality, worst quality, blurry, bad anatomy, deformed, extra fingers, missing limbs` |
| 実写全般 | `cartoon, anime, 3d render, illustration, painting, low quality, blurry` |
| R-18 で未成年除外 | `loli, child, young, teen, shota` |
| 手指の崩れ対策 | `bad hands, mutated hands, extra fingers, fewer fingers, fused fingers` |
| 顔崩れ対策 | `deformed face, ugly, asymmetric eyes, cross-eyed` |
