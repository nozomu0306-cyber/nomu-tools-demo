# WORKFLOW_GUIDE — 立ち絵・差分作成フロー

ノベルゲーム / 小説制作で頻用するワークフローを実際の手順で書く。

---

## ワークフロー A: ノベルゲーム立ち絵セットを作る

目標: 同一キャラの **表情 6 種 × 衣装 3 種 = 18 パターン** を作成。

### 準備

- Checkpoint: `ponyDiffusionV6XL`（アニメ調）or `juggernautXL_v11`（実写）
- 解像度: 832×1216（立ち絵縦長）
- Adetailer: ON（顔補正）

### ステップ 1: ベース立ち絵（1 枚）を確定

1. Forge の **txt2img** タブ
2. プロンプト例（Pony）:
   ```
   score_9, score_8_up, score_7_up,
   1girl, solo, full body, standing,
   long black hair, blue eyes,
   white sailor uniform, knee socks, loafers,
   neutral expression, slight smile,
   simple white background,
   masterpiece, best quality
   ```
3. ネガティブ: `score_4, score_5, score_6, multiple girls, cropped, bad anatomy`
4. Seed を固定する（気に入った結果が出たら **Seed を右側の ♻ マークで固定**）
5. Hires Fix: x1.5（832×1216 → 1248×1824）で生成

**OKなら「キャラ原本」として保存** → ファイル名例 `char01_base.png`

### ステップ 2: 表情差分を量産（同じ衣装、表情だけ変える）

1. **img2img** タブへ移動
2. 原本をドロップ
3. **Inpaint** タブを選択
4. **顔だけをブラシで塗る**（髪・肩・衣装は塗らない）
5. Denoising: **0.55〜0.65**
6. Inpaint area: **Only masked**
7. Masked content: **original**
8. Prompt を表情変更:

**表情バリエーション 6 種:**

| 表情 | プロンプト追加 |
|---|---|
| 通常 | `neutral expression, slight smile` |
| 笑顔 | `happy smile, closed eyes in joy` |
| 驚き | `surprised, wide eyes, mouth open` |
| 怒り | `angry, furrowed brows, sharp glare` |
| 悲しみ | `sad, tearful eyes, downturned mouth` |
| 照れ | `blushing, shy smile, looking away` |

各パターンを Seed を**同じまま**（固定のまま）で生成すれば顔の形はキープされる。

### ステップ 3: 衣装差分（FLUX.1-Fill で服だけ変える）

1. 表情「通常」のベース画像を img2img に
2. Inpaint タブで **体の服部分だけ**ブラシで塗る（顔・髪・靴は塗らない）
3. Checkpoint を **`flux1-fill-dev-Q4_K_S`** に切替
4. Denoising: **0.95**
5. Steps: 20
6. Sampling method: **Euler**
7. Schedule type: **Simple**
8. Distilled CFG Scale: **3.5**
9. CFG Scale: **1.0**
10. プロンプトを衣装指定:

**衣装バリエーション 3 種:**

| 衣装 | プロンプト |
|---|---|
| 制服 (原本) | - (そのまま) |
| 私服 | `wearing a casual gray hoodie and blue jeans` |
| 水着 | `wearing a white bikini swimsuit` |

→ 顔は変わらず、体だけ新衣装に。

### ステップ 4: 全 18 パターンを量産

1. 「衣装 3 種」 × 「表情 6 種」 = 18 パターン
2. ベース衣装 × 表情 6 種 → 衣装 A の 6 パターン完成
3. 衣装変更 → 新衣装ベース → 表情 6 種 → 衣装 B の 6 パターン
4. 以下同様

### ステップ 5: 透過背景化

拡張「ABG Extension」または `rembg` 拡張で背景除去:
1. 完成画像を img2img にドロップ
2. ABG Extension タブで Extract
3. PNG 透過で保存

---

## ワークフロー B: 小説挿絵を作る（章扉・見開き）

### ステップ 1: 構図をラフで試す（Turbo）

- Checkpoint: `sdxlTurbo`
- 解像度: 1024×1024 または 1216×832（ワイド）
- Steps: 1, CFG: 1
- プロンプトだけ決めて 5〜10 枚一気に生成（数秒）

気に入った構図が出たら **Seed をコピーして保存**

### ステップ 2: FLUX で本番生成

- Checkpoint: `flux1-dev-Q4_K_S`
- 解像度: 1216×832 か 1024×1024
- Steps: 20〜25
- Sampler: Euler, Schedule: Simple, Distilled CFG 3.5
- ステップ1と同じプロンプトをそのまま使用（FLUX は自然言語で OK）

60〜120 秒で本番仕様の 1 枚が完成。

### ステップ 3: 細部調整（必要なら）

- 顔崩れ → Adetailer を適用
- 服の一部 → FLUX.1-Fill で Inpaint
- 背景だけ → FLUX.1-Fill で背景を塗ってから再生成

---

## ワークフロー C: 表紙デザイン

### ステップ 1: 構図 & 雰囲気を試す

- Checkpoint: `flux1-dev-Q4_K_S`（FLUX は英語文字入れが効く）
- 解像度: 1216×832（縦長書籍表紙ならこの辺）
- プロンプト例:
```
A book cover design. Dark fantasy atmosphere.
A young woman in torn white dress stands at the edge of a burning city at dusk.
Title text "彼らが夢を見た理由" in elegant white serif font at the top center.
Cinematic lighting, painterly style, intricate details.
```

### ステップ 2: 日本語タイトル

FLUX は日本語の画像内文字がまだ不安定な場合がある。対策:

- **英語の仮タイトルで生成** → 後から **Photoshop / Affinity / Canva** で日本語タイトルを載せる
- これが最速で確実

### ステップ 3: 複数案から 1 枚を選ぶ

Batch count: 6〜10 枚 → 気に入った 1 枚を後から Upscale (x2) で仕上げ

---

## ワークフロー D: R-18 差分量産

### アニメ R-18（Pony）

1. Pony でベース全身絵を生成（`rating_explicit` 追加）
2. 表情差分: 顔 Inpaint（同じ Pony, Denoise 0.5）
3. シチュエーション差分: 背景を Inpaint で塗って Pony 再生成
4. 衣装変更: FLUX.1-Fill で体を Inpaint

### 実写 R-18（Big ASP v2）

1. Big ASP でベース
2. Adetailer ON 必須（顔の質感確保）
3. Hires Fix x1.5 推奨
4. 差分は上と同じ手順

### 二次創作 R-18

1. **character-analysis モード**（小説AI側）で原作キャラの外見を整理
2. その外見情報を画像プロンプトに落とし込む
3. Pony でベース生成
4. 年齢は必ず成人設定に明示（プロンプトで `adult, 20yo` 等）

---

## ワークフロー E: ControlNet でポーズ指定

**目的:** 「この構図・ポーズで描いて」を画像で指示

1. **ControlNet 拡張**の Preprocessor で元画像を線画化:
   - `openpose` → 棒人間ポーズ抽出
   - `canny` → エッジ抽出
   - `depth` → 深度マップ
2. Preprocessor で生成した前処理画像を ControlNet の入力に
3. Model を対応するものに（`control_v11p_sd15_openpose` 等）
4. 普通に txt2img で生成

**初回はモデルDLが必要**。ControlNet タブで **Model** プルダウン右の ↓ アイコンから DL 可。

---

## Tips 集

### 品質を底上げするチェックリスト

- [ ] Adetailer を ON（顔補正）
- [ ] Hires Fix x1.5 で最終レンダリング
- [ ] ネガティブプロンプトを書く
- [ ] Seed を固定する（気に入った傾向の再現）
- [ ] Sampler は **DPM++ 2M Karras** がバランス良い（SDXL系）、**Euler** は FLUX
- [ ] Steps 25〜30（SDXL）、20（FLUX）で十分

### 同じキャラを保つコツ

- **Seed を固定する**
- 同じプロンプト骨格を使い回す
- 外見タグ（髪色・目色・体型）を一字一句同じに
- 細部は LoRA を作れば完全固定可（後日）

### 速度を稼ぐ

- 構図試行は **Turbo** (Steps=1)
- Hires Fix は最終 1 枚だけ
- Batch count で一気に生成するより、1 枚ずつ Seed 固定でバリエーション振る方が効率的

### 破綻を減らす

- **手足・指** がおかしい → Adetailer に `hand_yolov8n.pt` を追加
- **顔が遠い** → 顔アップで Inpaint 再生成
- **全体崩れ** → Denoise を下げる、もしくは Prompt を減らす

---

## まとめ：典型的な 1 日のフロー

```
朝: SDXL Turbo で構図案出し (10分で 50 枚ラフ)
 ↓
昼: 本番生成 Pony / Juggernaut で 10 枚ほど (40分)
 ↓
午後: FLUX.1-Fill で衣装差分量産 (2時間で 18 パターン)
 ↓
夕方: 勝負所 1 枚を FLUX.1-dev で生成 (5分)
 ↓
夜: Photoshop で文字入れ・調整、完成
```
