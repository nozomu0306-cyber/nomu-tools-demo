# 動作確認用プロンプト集

セットアップ完了後、Forge (http://127.0.0.1:7860) で下記 5 種を実行して動作確認。

---

## 1. アニメR-18（Pony Diffusion V6 XL）

Pony 系は特殊タグ `score_X` が必須。

**Checkpoint:** `ponyDiffusionV6XL`

**プロンプト:**
```
score_9, score_8_up, score_7_up, 1girl, kimono, traditional japanese garden, masterpiece, best quality
```

**ネガティブ:**
```
score_4, score_5, score_6, low quality, worst quality, blurry, bad anatomy, deformed
```

**設定:**
- 解像度: 832×1216
- Steps: 25
- Sampler: **Euler a** または **DPM++ 2M Karras**
- CFG: 7
- Hires Fix: OFF（まず生成確認、次に ON で 1248×1824 アップスケール）

**合格基準:** 20〜30 秒で和服の女性キャラが生成されれば OK。

---

## 2. 実写ポートレート（Juggernaut XL）

**Checkpoint:** `juggernautXL_v11`

**プロンプト:**
```
a beautiful japanese woman, 25 years old, nurse uniform, hospital lighting, photorealistic, detailed skin, 8k, RAW photo, professional photography
```

**ネガティブ:**
```
cartoon, anime, 3d render, low quality, blurry, bad anatomy, extra fingers, deformed
```

**設定:**
- 解像度: 832×1216
- Steps: 30
- Sampler: **DPM++ 2M Karras**
- CFG: 5.5
- Hires Fix: ON (x1.5, R-ESRGAN 4x+, Denoise 0.4)

**合格基準:** 自然な肌質と立体感のあるポートレートが出れば OK。

---

## 3. 高速下書き（SDXL Turbo）

**Checkpoint:** `sdxlTurbo`

**プロンプト:**
```
cinematic cyberpunk city street at night, neon lights, rain, detailed
```

**ネガティブ:** (Turbo では空欄でOK、CFG 低いため効きにくい)

**設定:**
- 解像度: 1024×1024
- **Steps: 1** ← 重要
- **CFG: 1** ← 重要
- Sampler: **Euler**
- Hires Fix: OFF

**合格基準:** 1〜3 秒で 1 枚生成されれば OK。構図のラフ案出しに最適。

---

## 4. 実写R-18（Big ASP v2）

成人向けなのでプロンプトは用途に応じて調整。以下は無難な例。

**Checkpoint:** `bigASPv2`

**プロンプト:**
```
rating_explicit, photorealistic, score_9, woman, 25yo, bedroom scene, soft lighting, detailed skin
```

**ネガティブ:**
```
score_4, score_5, anime, 3d, low quality, blurry, deformed
```

**設定:**
- 解像度: 832×1216
- Steps: 30
- Sampler: DPM++ 2M Karras
- CFG: 6

---

## 5. FLUX.1-dev による高品質生成（勝負所）

**Checkpoint:** `flux1-dev-Q4_K_S`

**設定が SDXL と違う:**
- **Sampling method:** Euler
- **Schedule type:** Simple
- **Distilled CFG Scale:** 3.5（通常のCFGではなく）
- **CFG Scale:** 1.0
- **Steps:** 20
- 解像度: 1024×1024
- **VAE:** `ae.safetensors`
- **Text encoders:** `clip_l.safetensors` + `t5xxl_fp8_e4m3fn.safetensors`

**プロンプト (自然言語でOK、FLUX は日本語もある程度理解する):**
```
A young Japanese woman in a red kimono standing in a traditional garden at sunset. Warm cinematic lighting, detailed fabric texture, cherry blossoms falling. Portrait composition.
```

**ネガティブ:** (FLUX は基本ネガティブ未使用でもOK)

**合格基準:** 60〜120 秒で 1 枚生成されれば OK。SDXL より待ち時間は長いが質感は一段上。

---

## 6. FLUX.1-Fill による服装変更（最重要テスト）

**手順:**
1. テスト 1〜2 で生成した画像を用意
2. Forge の **img2img** タブ → **Inpaint**
3. 画像をアップロード
4. 体の服部分だけブラシで塗る（顔・髪・背景は塗らない）
5. Checkpoint を `flux1-fill-dev-Q4_K_S` に変更

**プロンプト:**
```
wearing a casual white t-shirt and blue jeans
```

**設定:**
- Inpaint area: **Only masked**
- Masked content: **original**
- Denoising strength: **0.95** (Fill モデルは高め推奨)
- Sampling method: Euler
- Steps: 20
- Distilled CFG: 3.5
- CFG: 1.0

**合格基準:** 顔は元のまま、服だけが Tシャツ+ジーンズに変わる。

---

## 7. FLUX.1-Kontext によるテキスト指示編集（マスク無し）

**注意:** Kontext は Forge 本体での完全対応が進行中です。Forge で動かない場合は ComfyUI に切り替えてください（`docs/TROUBLESHOOTING.md` 参照）。

**Forge で動く場合:**
1. 元画像を img2img タブにアップロード
2. Checkpoint: `flux1-kontext-dev-Q4_K_S`
3. プロンプト:
```
change clothing to a white swimsuit, keep face and hair identical
```
4. Denoising: 0.9〜0.95
5. Steps: 20

**合格基準:** マスクを塗らずにプロンプト指示だけで服が変わる。

---

## テスト結果の見方

すべて成功なら:
- SDXL 系モデル 4 種 (1, 2, 3, 4) が 20〜30 秒で生成
- FLUX 系 (5, 6, 7) が 60〜120 秒で生成
- ControlNet・Adetailer・Inpaint Anything の UI が表示されている

失敗パターンと対処は `docs/TROUBLESHOOTING.md` を参照。
