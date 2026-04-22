# Civitai モデル 手動ダウンロード手順

Civitai は API DL に認証トークンが絡んで面倒なので、**ブラウザで手動 DL** が最速です。

合計 5 モデル、約 31GB。

---

## 事前準備

1. **Civitai にログイン**: https://civitai.com
2. 右上アイコン → **Account settings** → **Show mature content を ON**
   - これをしないと R-18 モデル（Pony / Big ASP）が表示されません

---

## 保存先

すべて **`C:\Users\nozom\AI\stable-diffusion-webui-forge\models\Stable-diffusion\`** に保存。

保存後、**ファイル名を以下の通りにリネーム**してください（わかりやすくするため）。

---

## 1. Juggernaut XL v11（約6GB、実写・汎用主力）

- URL: https://civitai.com/models/133005
- 開いたら右上の **Download** ボタン（青）を押す
- バージョン選択で **v11** を確認（最新のはず）
- DL 完了後、ファイル名を **`juggernautXL_v11.safetensors`** にリネーム

---

## 2. RealVisXL V5.0（約6GB、実写ポートレート）

- URL: https://civitai.com/models/139562
- バージョン: **V5.0 (Bakedvae)** 推奨
- ファイル名: **`realvisxlV5.safetensors`** にリネーム

---

## 3. Pony Diffusion V6 XL（約6GB、アニメR-18定番）

- URL: https://civitai.com/models/257749
- バージョン: **V6 (start with this one)**
- ファイル名: **`ponyDiffusionV6XL.safetensors`** にリネーム

---

## 4. Big ASP v2（約6GB、実写R-18）

- URL: https://civitai.com/models/958009
- バージョン: **v2.0**
- ファイル名: **`bigASPv2.safetensors`** にリネーム

---

## 5. SDXL Turbo（約7GB、超高速下書き）

- URL: https://civitai.com/models/215317
- バージョン: 標準（1.0）
- ファイル名: **`sdxlTurbo.safetensors`** にリネーム

---

## 確認

すべて保存・リネームしたら PowerShell で:

```powershell
ls C:\Users\nozom\AI\stable-diffusion-webui-forge\models\Stable-diffusion\*.safetensors
```

5 ファイル分が出てくれば成功:
```
juggernautXL_v11.safetensors
realvisxlV5.safetensors
ponyDiffusionV6XL.safetensors
bigASPv2.safetensors
sdxlTurbo.safetensors
```

---

## トラブル

### DL が途中で止まる
- ブラウザの DL 再開機能を使う
- もしくは Civitai は小さな DL リトライで繋がりやすいので時間帯を変えて再挑戦
- どうしても切れるなら Chrome の拡張 **Free Download Manager** を使うと安定

### 「このモデルは見つかりません」と出る
- Civitai アカウントで **Show mature content** が ON になっていない可能性
- Account settings → Mature content → ON

### Hash が違うと言われる
- DL が途中で切れたまま保存された可能性。もう一度 DL

---

## 全モデル揃ったら次

Forge を起動:

```powershell
cd $env:USERPROFILE\AI\stable-diffusion-webui-forge
.\webui-user.bat
```

初回起動は依存 DL で 10〜20 分かかります。完了するとブラウザで http://127.0.0.1:7860 が自動で開きます。

その後、左上の Checkpoint プルダウンで今 DL した 5 モデルが選べるようになります。

動作確認は `prompts/test_prompts.md` を参照。
