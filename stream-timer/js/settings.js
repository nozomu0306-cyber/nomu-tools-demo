/**
 * 配信タイマー Pro - 設定画面ロジック
 */
(function () {
  const STORAGE_KEY = 'stream-timer-settings';
  const PRESET_KEY = 'stream-timer-presets';

  const defaults = {
    mode: 'countdown', hours: 0, minutes: 5, seconds: 0,
    format: 'MM:SS', separator: ':', fontFamily: 'Noto Sans JP',
    fontSize: 72, color: '#ffffff', bgColor: '#000000',
    transparent: true, finishText: '', finishColor: '#ffffff',
    finishSize: 0, finishEffect: 'blink', autoStart: true,
    glowEnabled: false, glowColor: '#00aaff',
    outlineEnabled: false, outlineColor: '#000000', outlineWidth: 2,
    gradientEnabled: false, gradColor1: '#ff6b6b', gradColor2: '#4ecdc4',
    shadowEnabled: false, shadowColor: '#000000', shadowX: 3, shadowY: 3, shadowBlur: 6,
    labelTop: '', labelBottom: '', labelSize: 20, labelColor: '#ffffff',
    progressEnabled: false, progressColor: '#00aaff', progressHeight: 4,
    progressPosition: 'bottom', progressGradient: false,
    progressGrad1: '#ff6b6b', progressGrad2: '#4ecdc4',
  };

  // ===== ビルトインテーマ =====
  const themes = [
    {
      name: 'ネオン',
      preview: { color: '#00ffff', glow: '#00aaff', font: 'Orbitron' },
      settings: {
        fontFamily: 'Orbitron', color: '#00ffff', transparent: true,
        glowEnabled: true, glowColor: '#00aaff',
        outlineEnabled: false, gradientEnabled: false, shadowEnabled: false,
      }
    },
    {
      name: 'ゲーミング',
      preview: { gradient: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff'], font: 'Rajdhani' },
      settings: {
        fontFamily: 'Rajdhani', transparent: true,
        gradientEnabled: true, gradColor1: '#ff6b6b', gradColor2: '#4d96ff',
        glowEnabled: true, glowColor: '#ff6b6b',
        outlineEnabled: false, shadowEnabled: false,
      }
    },
    {
      name: 'ミニマル',
      preview: { color: '#ffffff', font: 'Noto Sans JP' },
      settings: {
        fontFamily: 'Noto Sans JP', color: '#ffffff', transparent: true,
        glowEnabled: false, outlineEnabled: false,
        gradientEnabled: false, shadowEnabled: false,
      }
    },
    {
      name: 'レトロ',
      preview: { color: '#33ff33', font: 'DotGothic16' },
      settings: {
        fontFamily: 'DotGothic16', color: '#33ff33', transparent: true,
        glowEnabled: true, glowColor: '#33ff33',
        outlineEnabled: false, gradientEnabled: false, shadowEnabled: false,
      }
    },
    {
      name: 'パステル',
      preview: { gradient: ['#a8e6cf', '#dcedc1'], font: 'Kosugi Maru' },
      settings: {
        fontFamily: 'Kosugi Maru', transparent: true,
        gradientEnabled: true, gradColor1: '#a8e6cf', gradColor2: '#ffd3b6',
        glowEnabled: false, outlineEnabled: false, shadowEnabled: false,
      }
    },
  ];

  let settings = { ...defaults };
  const $ = (id) => document.getElementById(id);

  // ===== 要素マッピング =====
  const fieldMap = {
    mode: 'mode', hours: 'hours', minutes: 'minutes', seconds: 'seconds',
    format: 'format', separator: 'separator', fontFamily: 'font-family',
    fontSize: 'font-size', color: 'color', bgColor: 'bg-color',
    transparent: 'transparent', finishText: 'finish-text',
    finishColor: 'finish-color', finishSize: 'finish-size',
    finishEffect: 'finish-effect', autoStart: 'auto-start',
    glowEnabled: 'glow-enabled', glowColor: 'glow-color',
    outlineEnabled: 'outline-enabled', outlineColor: 'outline-color',
    outlineWidth: 'outline-width',
    gradientEnabled: 'gradient-enabled', gradColor1: 'grad-color1', gradColor2: 'grad-color2',
    shadowEnabled: 'shadow-enabled', shadowColor: 'shadow-color',
    shadowX: 'shadow-x', shadowY: 'shadow-y', shadowBlur: 'shadow-blur',
    labelTop: 'label-top', labelBottom: 'label-bottom',
    labelSize: 'label-size', labelColor: 'label-color',
    progressEnabled: 'progress-enabled', progressColor: 'progress-color',
    progressHeight: 'progress-height', progressPosition: 'progress-position',
    progressGradient: 'progress-gradient',
    progressGrad1: 'progress-grad1', progressGrad2: 'progress-grad2',
  };

  const checkboxFields = [
    'transparent', 'autoStart', 'glowEnabled', 'outlineEnabled',
    'gradientEnabled', 'shadowEnabled', 'progressEnabled', 'progressGradient',
  ];
  const numberFields = [
    'hours', 'minutes', 'seconds', 'fontSize', 'outlineWidth',
    'shadowX', 'shadowY', 'shadowBlur', 'labelSize', 'progressHeight', 'finishSize',
  ];

  // カラーペアのマッピング（colorInput ID → textInput ID）
  const colorPairs = [
    ['color', 'color-text'],
    ['bg-color', 'bg-color-text'],
    ['finish-color', 'finish-color-text'],
    ['glow-color', 'glow-color-text'],
    ['outline-color', 'outline-color-text'],
    ['grad-color1', 'grad-color1-text'],
    ['grad-color2', 'grad-color2-text'],
    ['shadow-color', 'shadow-color-text'],
    ['label-color', 'label-color-text'],
    ['progress-color', 'progress-color-text'],
    ['progress-grad1', 'progress-grad1-text'],
    ['progress-grad2', 'progress-grad2-text'],
  ];

  // ===== 設定の保存/読込 =====
  function loadSettings() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) settings = { ...defaults, ...JSON.parse(saved) };
    } catch (e) { settings = { ...defaults }; }
  }

  function saveSettings() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }

  // ===== 設定 ↔ UI =====
  function settingsToUI() {
    for (const [key, elId] of Object.entries(fieldMap)) {
      const el = $(elId);
      if (!el) continue;
      if (checkboxFields.includes(key)) {
        el.checked = settings[key];
      } else {
        el.value = settings[key];
      }
    }

    // カラーテキスト同期
    for (const [colorId, textId] of colorPairs) {
      const colorEl = $(colorId);
      const textEl = $(textId);
      if (colorEl && textEl) {
        textEl.value = colorEl.value;
      }
    }

    // 区切り文字
    if (![':', '.'].includes(settings.separator)) {
      $('separator').value = 'custom';
      $('separator-custom').style.display = 'inline-block';
      $('separator-custom').value = settings.separator;
    }

    // レンジ値表示
    $('font-size-value').textContent = `${settings.fontSize}px`;
    $('finish-size-value').textContent = settings.finishSize > 0 ? `${settings.finishSize}px` : '自動';
    $('label-size-value').textContent = `${settings.labelSize}px`;
    $('outline-width-value').textContent = `${settings.outlineWidth}px`;
    $('shadow-x-value').textContent = `${settings.shadowX}px`;
    $('shadow-y-value').textContent = `${settings.shadowY}px`;
    $('shadow-blur-value').textContent = `${settings.shadowBlur}px`;
    $('progress-height-value').textContent = `${settings.progressHeight}px`;

    // 条件付き表示
    updateConditionalUI();
  }

  function uiToSettings() {
    for (const [key, elId] of Object.entries(fieldMap)) {
      const el = $(elId);
      if (!el) continue;
      if (checkboxFields.includes(key)) {
        settings[key] = el.checked;
      } else if (numberFields.includes(key)) {
        settings[key] = parseFloat(el.value) || 0;
      } else {
        settings[key] = el.value;
      }
    }
    if ($('separator').value === 'custom') {
      settings.separator = $('separator-custom').value || ':';
    }
  }

  function updateConditionalUI() {
    $('countdown-settings').style.display = settings.mode === 'countdown' ? '' : 'none';
    $('bg-color-group').style.display = settings.transparent ? 'none' : '';
    $('separator-custom').style.display = $('separator').value === 'custom' ? 'inline-block' : 'none';
    $('glow-settings').style.display = settings.glowEnabled ? '' : 'none';
    $('outline-settings').style.display = settings.outlineEnabled ? '' : 'none';
    $('gradient-settings').style.display = settings.gradientEnabled ? '' : 'none';
    $('shadow-settings').style.display = settings.shadowEnabled ? '' : 'none';
    $('progress-settings').style.display = settings.progressEnabled ? '' : 'none';
    $('progress-grad-settings').style.display = settings.progressGradient ? '' : 'none';
  }

  // ===== プレビュー更新 =====
  function updatePreview() {
    const sep = settings.separator;
    const pad = (n) => String(n).padStart(2, '0');
    const h = settings.hours, m = settings.minutes, s = settings.seconds;
    let text;

    if (settings.mode === 'countdown') {
      switch (settings.format) {
        case 'HH:MM:SS': text = `${pad(h)}${sep}${pad(m)}${sep}${pad(s)}`; break;
        case 'SS': text = String(h * 3600 + m * 60 + s); break;
        default: text = `${pad(h * 60 + m)}${sep}${pad(s)}`;
      }
    } else {
      switch (settings.format) {
        case 'HH:MM:SS': text = `00${sep}00${sep}00`; break;
        case 'SS': text = '0'; break;
        default: text = `00${sep}00`;
      }
    }

    const preview = $('preview-timer');
    preview.textContent = text;
    preview.style.fontFamily = `'${settings.fontFamily}', sans-serif`;
    preview.style.fontSize = `${Math.min(settings.fontSize, 100)}px`;

    // テキストエフェクトのリセット
    preview.style.color = settings.color;
    preview.style.textShadow = '';
    preview.style.webkitTextStroke = '';
    preview.style.background = '';
    preview.style.webkitBackgroundClip = '';
    preview.style.webkitTextFillColor = '';
    preview.style.filter = '';

    // グラデーション
    if (settings.gradientEnabled) {
      preview.style.background = `linear-gradient(135deg, ${settings.gradColor1}, ${settings.gradColor2})`;
      preview.style.webkitBackgroundClip = 'text';
      preview.style.webkitTextFillColor = 'transparent';
      if (settings.glowEnabled) {
        preview.style.filter = `drop-shadow(0 0 10px ${settings.glowColor}) drop-shadow(0 0 20px ${settings.glowColor})`;
      }
    } else {
      // 通常カラー
      preview.style.color = settings.color;
      // グロー
      if (settings.glowEnabled) {
        preview.style.textShadow = `0 0 10px ${settings.glowColor}, 0 0 20px ${settings.glowColor}, 0 0 40px ${settings.glowColor}`;
      }
      // シャドウ（グローと排他ではない場合追加）
      if (settings.shadowEnabled && !settings.glowEnabled) {
        preview.style.textShadow = `${settings.shadowX}px ${settings.shadowY}px ${settings.shadowBlur}px ${settings.shadowColor}`;
      }
    }

    // アウトライン
    if (settings.outlineEnabled) {
      preview.style.webkitTextStroke = `${settings.outlineWidth}px ${settings.outlineColor}`;
    }

    // ラベル
    $('preview-label-top').textContent = settings.labelTop;
    $('preview-label-top').style.color = settings.labelColor;
    $('preview-label-top').style.fontSize = `${Math.min(settings.labelSize, 32)}px`;
    $('preview-label-bottom').textContent = settings.labelBottom;
    $('preview-label-bottom').style.color = settings.labelColor;
    $('preview-label-bottom').style.fontSize = `${Math.min(settings.labelSize, 32)}px`;

    // プレビュー背景
    const previewArea = $('preview-area');
    if (settings.transparent) {
      previewArea.classList.add('preview-checkerboard');
      previewArea.style.background = '';
    } else {
      previewArea.classList.remove('preview-checkerboard');
      previewArea.style.background = settings.bgColor;
    }

    // プログレスバー
    const pContainer = $('preview-progress-container');
    const pBar = $('preview-progress');
    if (settings.progressEnabled && settings.mode === 'countdown') {
      pContainer.classList.add('active');
      pContainer.style.height = `${settings.progressHeight}px`;
      if (settings.progressGradient) {
        pBar.style.background = `linear-gradient(90deg, ${settings.progressGrad1}, ${settings.progressGrad2})`;
      } else {
        pBar.style.background = settings.progressColor;
      }
    } else {
      pContainer.classList.remove('active');
    }

    // OBS URL更新
    updateObsUrl();
  }

  // ===== OBS URL生成 =====
  function updateObsUrl() {
    const mapping = {
      mode: 'm', hours: 'h', minutes: 'mi', seconds: 's',
      format: 'fmt', separator: 'sep', fontFamily: 'ff',
      fontSize: 'fs', color: 'c', bgColor: 'bg',
      transparent: 'tr', finishText: 'ft', finishColor: 'fc',
      finishSize: 'fz', finishEffect: 'fe', autoStart: 'as',
      glowEnabled: 'ge', glowColor: 'gc',
      outlineEnabled: 'oe', outlineColor: 'oc', outlineWidth: 'ow',
      gradientEnabled: 'gre', gradColor1: 'gr1', gradColor2: 'gr2',
      shadowEnabled: 'se', shadowColor: 'sc',
      shadowX: 'sx', shadowY: 'sy', shadowBlur: 'sb',
      labelTop: 'lt', labelBottom: 'lb', labelSize: 'ls', labelColor: 'lc',
      progressEnabled: 'pe', progressColor: 'pc',
      progressHeight: 'ph', progressPosition: 'pp',
      progressGradient: 'pg', progressGrad1: 'pg1', progressGrad2: 'pg2',
    };

    const params = new URLSearchParams();
    for (const [key, short] of Object.entries(mapping)) {
      const val = settings[key];
      const def = defaults[key];
      // デフォルト値と同じならスキップ（URL短縮）
      if (val === def) continue;
      if (typeof val === 'boolean') {
        params.set(short, val ? '1' : '0');
      } else {
        params.set(short, String(val));
      }
    }

    const base = window.location.href.replace(/settings\.html.*/, 'index.html');
    const url = params.toString() ? `${base}?${params.toString()}` : base;
    $('obs-url-output').textContent = url;
  }

  // ===== 変更ハンドラ =====
  function onChange() {
    uiToSettings();
    saveSettings();
    updateConditionalUI();
    updatePreview();
  }

  // ===== タブ切替 =====
  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        $(`tab-${btn.dataset.tab}`).classList.add('active');
      });
    });
  }

  // ===== テーマ =====
  function renderThemes() {
    const grid = $('theme-grid');
    grid.innerHTML = '';
    themes.forEach((theme, i) => {
      const card = document.createElement('div');
      card.className = 'theme-card';
      card.dataset.index = i;

      const previewDiv = document.createElement('div');
      previewDiv.className = 'theme-preview';
      previewDiv.textContent = '05:00';
      previewDiv.style.fontFamily = `'${theme.preview.font}', sans-serif`;

      if (theme.preview.gradient) {
        previewDiv.style.background = `linear-gradient(135deg, ${theme.preview.gradient[0]}, ${theme.preview.gradient[theme.preview.gradient.length - 1]})`;
        previewDiv.style.webkitBackgroundClip = 'text';
        previewDiv.style.webkitTextFillColor = 'transparent';
      } else {
        previewDiv.style.color = theme.preview.color;
      }

      if (theme.preview.glow) {
        if (theme.preview.gradient) {
          previewDiv.style.filter = `drop-shadow(0 0 8px ${theme.preview.glow})`;
        } else {
          previewDiv.style.textShadow = `0 0 10px ${theme.preview.glow}, 0 0 20px ${theme.preview.glow}`;
        }
      }

      const nameDiv = document.createElement('div');
      nameDiv.className = 'theme-name';
      nameDiv.textContent = theme.name;

      card.appendChild(previewDiv);
      card.appendChild(nameDiv);
      card.addEventListener('click', () => applyTheme(i));
      grid.appendChild(card);
    });
  }

  function applyTheme(index) {
    const theme = themes[index];
    Object.assign(settings, theme.settings);
    saveSettings();
    settingsToUI();
    updatePreview();
    // 選択表示
    document.querySelectorAll('.theme-card').forEach((c, i) => {
      c.classList.toggle('selected', i === index);
    });
  }

  // ===== プリセット =====
  function loadPresets() {
    try {
      const saved = localStorage.getItem(PRESET_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  }

  function savePreset() {
    const name = $('preset-name').value.trim();
    if (!name) return alert('プリセット名を入力してください');
    const presets = loadPresets();
    if (Object.keys(presets).length >= 5 && !presets[name]) {
      return alert('プリセットは5つまで保存できます');
    }
    presets[name] = { ...settings };
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
    renderPresetList();
    $('preset-name').value = '';
  }

  function loadPreset(name) {
    const presets = loadPresets();
    if (presets[name]) {
      settings = { ...defaults, ...presets[name] };
      saveSettings();
      settingsToUI();
      updatePreview();
    }
  }

  function deletePreset(name) {
    const presets = loadPresets();
    delete presets[name];
    localStorage.setItem(PRESET_KEY, JSON.stringify(presets));
    renderPresetList();
  }

  function renderPresetList() {
    const list = $('preset-list');
    list.innerHTML = '';
    for (const name of Object.keys(loadPresets())) {
      const item = document.createElement('div');
      item.className = 'preset-item';
      const btn = document.createElement('button');
      btn.className = 'preset-load';
      btn.textContent = name;
      btn.onclick = () => loadPreset(name);
      const del = document.createElement('button');
      del.className = 'preset-delete';
      del.textContent = '\u00d7';
      del.onclick = () => deletePreset(name);
      item.appendChild(btn);
      item.appendChild(del);
      list.appendChild(item);
    }
  }

  // ===== エクスポート/インポート =====
  function exportSettings() {
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stream-timer-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importSettings(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        settings = { ...defaults, ...imported };
        saveSettings();
        settingsToUI();
        updatePreview();
      } catch (err) {
        alert('設定ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }

  // ===== リセット =====
  function resetSettings() {
    if (!confirm('設定をデフォルトに戻しますか？')) return;
    settings = { ...defaults };
    saveSettings();
    settingsToUI();
    updatePreview();
  }

  // ===== カラーペア同期 =====
  function syncColorPairs() {
    for (const [colorId, textId] of colorPairs) {
      const colorEl = $(colorId);
      const textEl = $(textId);
      if (!colorEl || !textEl) continue;

      colorEl.addEventListener('input', () => { textEl.value = colorEl.value; onChange(); });
      textEl.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(textEl.value)) {
          colorEl.value = textEl.value;
          onChange();
        }
      });
    }
  }

  // ===== レンジ値表示 =====
  function syncRangeValues() {
    const ranges = [
      ['font-size', 'font-size-value', 'px'],
      ['outline-width', 'outline-width-value', 'px'],
      ['shadow-x', 'shadow-x-value', 'px'],
      ['shadow-y', 'shadow-y-value', 'px'],
      ['shadow-blur', 'shadow-blur-value', 'px'],
      ['label-size', 'label-size-value', 'px'],
      ['progress-height', 'progress-height-value', 'px'],
    ];
    for (const [rangeId, valueId, unit] of ranges) {
      const rangeEl = $(rangeId);
      const valueEl = $(valueId);
      if (!rangeEl || !valueEl) continue;
      rangeEl.addEventListener('input', () => {
        valueEl.textContent = `${rangeEl.value}${unit}`;
      });
    }
    // finishSize の特殊処理
    $('finish-size').addEventListener('input', () => {
      const v = parseInt($('finish-size').value, 10);
      $('finish-size-value').textContent = v > 0 ? `${v}px` : '自動';
    });
  }

  // ===== URL コピー =====
  function copyUrl() {
    const url = $('obs-url-output').textContent;
    navigator.clipboard.writeText(url).then(() => {
      const fb = $('copy-feedback');
      fb.classList.add('show');
      setTimeout(() => fb.classList.remove('show'), 2000);
    });
  }

  // ===== イベント登録 =====
  function bindEvents() {
    document.querySelectorAll('select, input[type="text"], input[type="number"], input[type="range"], input[type="checkbox"]').forEach((el) => {
      el.addEventListener('input', onChange);
      el.addEventListener('change', onChange);
    });

    $('preset-save').addEventListener('click', savePreset);
    $('reset-btn').addEventListener('click', resetSettings);
    $('copy-url-btn').addEventListener('click', copyUrl);
    $('export-btn').addEventListener('click', exportSettings);
    $('import-btn').addEventListener('click', () => $('import-file').click());
    $('import-file').addEventListener('change', (e) => {
      if (e.target.files[0]) importSettings(e.target.files[0]);
    });
  }

  // ===== 初期化 =====
  function init() {
    loadSettings();
    settingsToUI();
    updatePreview();
    initTabs();
    renderThemes();
    renderPresetList();
    syncColorPairs();
    syncRangeValues();
    bindEvents();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
