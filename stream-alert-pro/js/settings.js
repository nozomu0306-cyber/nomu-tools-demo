/*  Stream Alert Pro - Settings Controller */

(function () {
  'use strict';

  // ── DOM helpers ──
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── Default layer factories ──
  function defaultTextLayer() {
    return {
      type: 'text', visible: true,
      content: '{user}さん、ありがとう！',
      font: 'Noto Sans JP', fontSize: 48, color: '#ffffff',
      x: 50, y: 50,
      animation: 'zoom-in', animDuration: 500,
      glow: true, glowColor: '#00aaff', glowSize: 15,
      outline: false, outlineColor: '#000000', outlineW: 2,
      gradient: false, gradColor1: '#ff6ec7', gradColor2: '#7873f5',
    };
  }

  function defaultEmojiLayer() {
    return {
      type: 'emoji', visible: true,
      emoji: '\u2764\uFE0F', size: 64,
      x: 50, y: 30,
      animation: 'bounce', animDuration: 600,
    };
  }

  function defaultShapeLayer() {
    return {
      type: 'shape', visible: true,
      shape: 'star', size: 80, color: '#ffdd00',
      x: 50, y: 50,
      animation: 'zoom-in', animDuration: 400,
      stroke: false, strokeColor: '#ffffff', strokeW: 2,
      glow: false, glowColor: '#ffdd00', glowSize: 10,
    };
  }

  function defaultParticleLayer() {
    return {
      type: 'particle', visible: true,
      particleType: 'confetti', count: 40, speed: 3, gravity: 1,
      colors: ['#ff6ec7', '#7873f5', '#00aaff', '#ffdd00', '#00ff88'],
      burst: true,
    };
  }

  function defaultLayers(alertType) {
    switch (alertType) {
      case 'follow':
        return [
          { ...defaultTextLayer(), content: '{user}さんがフォロー！' },
          { ...defaultParticleLayer(), particleType: 'sparkle', count: 20 },
        ];
      case 'subscribe':
        return [
          { ...defaultTextLayer(), content: '{user}さんがサブスク！', glowColor: '#ff6ec7' },
          { ...defaultEmojiLayer(), emoji: '\u2B50' },
          { ...defaultParticleLayer(), particleType: 'confetti', count: 50 },
        ];
      case 'donation':
        return [
          { ...defaultTextLayer(), content: '{user}さんから{amount}円！', glowColor: '#ffdd00' },
          { ...defaultShapeLayer(), shape: 'heart', color: '#ff4444' },
          { ...defaultParticleLayer(), particleType: 'confetti', count: 60 },
        ];
      case 'raid':
        return [
          { ...defaultTextLayer(), content: '{user}さんが{viewers}人でレイド！', fontSize: 56 },
          { ...defaultParticleLayer(), particleType: 'firework', count: 80, burst: true },
        ];
      case 'custom1':
      case 'custom2':
        return [
          { ...defaultTextLayer(), content: 'カスタムアラート' },
        ];
      default:
        return [{ ...defaultTextLayer() }];
    }
  }

  // ── Default state ──
  function defaultState() {
    return {
      theme: 'neon',
      font: 'Noto Sans JP',
      position: 'top-center',
      queueGap: 2000,
      maxQueue: 20,
      activeAlertType: 'follow',
      activeLayerIndex: 0,
      alertTypes: {
        follow:    { enabled: true,  duration: 4000, priority: 0, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('follow') },
        subscribe: { enabled: true,  duration: 5000, priority: 1, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('subscribe') },
        donation:  { enabled: true,  duration: 5000, priority: 2, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('donation') },
        raid:      { enabled: true,  duration: 6000, priority: 3, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('raid') },
        custom1:   { enabled: false, duration: 4000, priority: 4, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('custom1') },
        custom2:   { enabled: false, duration: 4000, priority: 5, soundId: null, soundTime: 0, soundVolume: 0.8, layers: defaultLayers('custom2') },
      },
    };
  }

  // ── State management ──
  let state = loadState();

  function loadState() {
    try {
      const s = localStorage.getItem('sap-state');
      if (!s) return defaultState();
      const parsed = JSON.parse(s);
      const def = defaultState();
      // Deep merge alertTypes
      for (const key of Object.keys(def.alertTypes)) {
        if (!parsed.alertTypes || !parsed.alertTypes[key]) {
          if (!parsed.alertTypes) parsed.alertTypes = {};
          parsed.alertTypes[key] = def.alertTypes[key];
        } else {
          parsed.alertTypes[key] = { ...def.alertTypes[key], ...parsed.alertTypes[key] };
        }
      }
      return { ...def, ...parsed, alertTypes: parsed.alertTypes || def.alertTypes };
    } catch { return defaultState(); }
  }

  function saveState() {
    localStorage.setItem('sap-state', JSON.stringify(state));
  }

  // ── Helpers ──
  function currentAlertConfig() {
    return state.alertTypes[state.activeAlertType];
  }

  function currentLayer() {
    const cfg = currentAlertConfig();
    if (!cfg || !cfg.layers || !cfg.layers[state.activeLayerIndex]) return null;
    return cfg.layers[state.activeLayerIndex];
  }

  // ── Theme definitions ──
  const THEMES = {
    neon: {
      colors: { text: '#ffffff', glow: '#00aaff', particle: '#00aaff', bg: '#0a0a2e' },
      label: 'Neon',
    },
    gaming: {
      colors: { text: '#ffffff', glow: '#ff6ec7', particle: '#ff6ec7', bg: '#0d0d0d' },
      label: 'Gaming',
    },
    minimal: {
      colors: { text: '#ffffff', glow: 'none', particle: 'none', bg: '#1a1a1a' },
      label: 'Minimal',
    },
    pastel: {
      colors: { text: '#5d4037', glow: '#ce93d8', particle: '#ce93d8', bg: '#fce4ec' },
      label: 'Pastel',
    },
    retro: {
      colors: { text: '#00ff41', glow: '#00ff41', particle: '#00ff41', bg: '#001100' },
      label: 'Retro',
    },
  };

  // ── Template definitions ──
  const TEMPLATES = {
    'gaming-explosion': {
      label: 'Gaming Explosion', icon: '\uD83D\uDD25',
      desc: 'ボールドテキスト、ズームイン、紙吹雪バースト',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 64, color: '#ff4444', glow: true, glowColor: '#ff6600', glowSize: 25, gradient: true, gradColor1: '#ff4444', gradColor2: '#ff8800', animation: 'zoom-in', animDuration: 300 },
        { ...defaultParticleLayer(), particleType: 'confetti', count: 80, speed: 5, burst: true, colors: ['#ff4444', '#ff6600', '#ffaa00', '#ff2200'] },
      ],
    },
    'kawaii-hearts': {
      label: 'Kawaii Hearts', icon: '\uD83D\uDC96',
      desc: 'パステルカラー、ハートパーティクル、バウンス',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 44, color: '#ff69b4', glow: true, glowColor: '#ffb6c1', glowSize: 15, animation: 'bounce', animDuration: 500 },
        { ...defaultEmojiLayer(), emoji: '\uD83D\uDC96', size: 48, animation: 'bounce' },
        { ...defaultParticleLayer(), particleType: 'heart', count: 30, speed: 2, gravity: 0.5, burst: false, colors: ['#ff69b4', '#ffb6c1', '#ff1493', '#ff91a4'] },
      ],
    },
    'minimal-fade': {
      label: 'Minimal Fade', icon: '\u2728',
      desc: 'シンプルフェードイン・アウト、白テキスト',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 36, color: '#ffffff', glow: false, outline: false, gradient: false, animation: 'fade-in', animDuration: 800 },
      ],
    },
    'vtuber-emoji': {
      label: 'VTuber Emoji', icon: '\uD83C\uDF89',
      desc: '絵文字レイン、カラフルテキスト、バウンス',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 48, color: '#ffdd00', glow: true, glowColor: '#ff6ec7', glowSize: 20, gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5', animation: 'bounce', animDuration: 400 },
        { ...defaultEmojiLayer(), emoji: '\uD83C\uDF89', size: 56, animation: 'bounce' },
        { ...defaultParticleLayer(), particleType: 'emoji', count: 25, speed: 2, burst: false, colors: ['#ff6ec7', '#7873f5', '#00aaff', '#ffdd00'] },
      ],
    },
    'cyber-neon': {
      label: 'Cyber Neon', icon: '\uD83D\uDDA5\uFE0F',
      desc: 'ネオングロー、スパークル、スライド',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 52, color: '#00ffff', glow: true, glowColor: '#00ffff', glowSize: 30, outline: true, outlineColor: '#001133', outlineW: 2, animation: 'slide-left', animDuration: 400 },
        { ...defaultParticleLayer(), particleType: 'sparkle', count: 35, speed: 2, burst: false, colors: ['#00ffff', '#00aaff', '#0088ff', '#ffffff'] },
      ],
    },
    'retro-pixel': {
      label: 'Retro Pixel', icon: '\uD83D\uDC7E',
      desc: 'DotGothic16フォント、スターパーティクル',
      layers: [
        { ...defaultTextLayer(), content: '{user}', font: 'DotGothic16', fontSize: 44, color: '#00ff41', glow: true, glowColor: '#00ff41', glowSize: 12, animation: 'zoom-in', animDuration: 300 },
        { ...defaultParticleLayer(), particleType: 'star', count: 20, speed: 1.5, burst: false, colors: ['#00ff41', '#00cc33', '#00ff88'] },
      ],
    },
    'elegant-gold': {
      label: 'Elegant Gold', icon: '\uD83D\uDC51',
      desc: 'ゴールドグラデーション、スパークル、スライドアップ',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 50, color: '#ffd700', glow: true, glowColor: '#ffd700', glowSize: 18, gradient: true, gradColor1: '#ffd700', gradColor2: '#ffaa00', animation: 'slide-up', animDuration: 500 },
        { ...defaultParticleLayer(), particleType: 'sparkle', count: 25, speed: 1.5, burst: false, colors: ['#ffd700', '#ffaa00', '#fff4cc', '#ffffff'] },
      ],
    },
    'party-confetti': {
      label: 'Party Confetti', icon: '\uD83C\uDF8A',
      desc: '紙吹雪バースト、レインボー、バウンス',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 52, color: '#ffffff', glow: true, glowColor: '#ff6ec7', glowSize: 20, gradient: true, gradColor1: '#ff6ec7', gradColor2: '#ffdd00', animation: 'bounce', animDuration: 400 },
        { ...defaultParticleLayer(), particleType: 'confetti', count: 100, speed: 4, burst: true, colors: ['#ff0000', '#ff8800', '#ffdd00', '#00ff88', '#00aaff', '#7873f5', '#ff6ec7'] },
      ],
    },
    'sakura': {
      label: 'Sakura', icon: '\uD83C\uDF38',
      desc: 'ピンクパステル、ハート、フロートアニメーション',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 44, color: '#d4748a', glow: true, glowColor: '#ffb7c5', glowSize: 15, animation: 'fade-in', animDuration: 600 },
        { ...defaultParticleLayer(), particleType: 'heart', count: 25, speed: 1.5, gravity: 0.3, burst: false, colors: ['#ffb7c5', '#ff91a4', '#ffc0cb', '#ffd1dc'] },
      ],
    },
    'thunder': {
      label: 'Thunder', icon: '\u26A1',
      desc: 'ボールドシェイク、フラッシュ、花火バースト',
      layers: [
        { ...defaultTextLayer(), content: '{user}', fontSize: 60, color: '#ffffff', glow: true, glowColor: '#ffdd00', glowSize: 30, outline: true, outlineColor: '#333333', outlineW: 3, animation: 'shake', animDuration: 300 },
        { ...defaultShapeLayer(), shape: 'circle', size: 200, color: '#ffffff', glow: true, glowColor: '#ffdd00', glowSize: 50, animation: 'flash', animDuration: 150 },
        { ...defaultParticleLayer(), particleType: 'firework', count: 60, speed: 5, burst: true, colors: ['#ffdd00', '#ffffff', '#ffaa00', '#ff8800'] },
      ],
    },
  };

  // ── Common emoji list ──
  const COMMON_EMOJIS = [
    '\u2764\uFE0F', '\uD83D\uDC96', '\uD83D\uDD25', '\u2B50', '\uD83C\uDF1F', '\uD83C\uDF89', '\uD83C\uDF8A',
    '\uD83D\uDC4D', '\uD83D\uDE0D', '\uD83D\uDE02', '\uD83E\uDD73', '\uD83D\uDE0E', '\uD83E\uDD29', '\uD83D\uDE4F',
    '\uD83C\uDF38', '\uD83C\uDF3B', '\uD83C\uDF3A', '\uD83C\uDF39', '\uD83D\uDC8E', '\uD83D\uDC51', '\uD83C\uDFC6',
    '\uD83D\uDE80', '\uD83C\uDF08', '\uD83C\uDF1E', '\uD83C\uDF19', '\u2728', '\uD83D\uDCAB', '\uD83D\uDCA5',
    '\uD83C\uDFB5', '\uD83C\uDFB6', '\uD83D\uDC7E', '\uD83C\uDFAE', '\uD83D\uDCAF', '\uD83D\uDD14', '\uD83C\uDF40',
  ];

  // ── Variable tokens for text layers ──
  const VARIABLES = {
    follow:    ['{user}'],
    subscribe: ['{user}', '{months}', '{tier}'],
    donation:  ['{user}', '{amount}', '{message}'],
    raid:      ['{user}', '{viewers}'],
    custom1:   ['{user}', '{message}'],
    custom2:   ['{user}', '{message}'],
  };

  // ── Font list ──
  const FONTS = [
    'Noto Sans JP', 'M PLUS Rounded 1c', 'Kosugi Maru', 'DotGothic16',
    'Sawarabi Gothic', 'Zen Maru Gothic', 'Kiwi Maru', 'Hachi Maru Pop',
    'Potta One', 'Yusei Magic', 'RocknRoll One', 'Reggae One',
    'Train One', 'Dela Gothic One',
  ];

  // ── Position options ──
  const POSITIONS = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'middle-center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
  ];

  // ── Render: Alert Type Grid ──
  function renderAlertTypeGrid() {
    const container = $('alert-type-grid');
    if (!container) return;
    const labels = {
      follow: '\uD83D\uDC64 フォロー', subscribe: '\u2B50 サブスク',
      donation: '\uD83D\uDCB0 ドネーション', raid: '\u2694\uFE0F レイド',
      custom1: '\uD83D\uDD27 カスタム1', custom2: '\uD83D\uDD27 カスタム2',
    };
    container.innerHTML = '';
    for (const [type, label] of Object.entries(labels)) {
      const btn = document.createElement('button');
      btn.className = 'alert-type-btn' + (type === state.activeAlertType ? ' active' : '');
      btn.dataset.type = type;
      const cfg = state.alertTypes[type];
      btn.innerHTML = '<span class="alert-type-label">' + label + '</span>' +
        '<span class="alert-type-status ' + (cfg.enabled ? 'on' : 'off') + '">' + (cfg.enabled ? 'ON' : 'OFF') + '</span>';
      btn.addEventListener('click', () => onAlertTypeSelect(type));
      container.appendChild(btn);
    }
  }

  function onAlertTypeSelect(type) {
    state.activeAlertType = type;
    state.activeLayerIndex = 0;
    renderAlertTypeGrid();
    renderAlertTypeProps();
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();
  }

  // ── Render: Alert Type Properties ──
  function renderAlertTypeProps() {
    const container = $('alert-type-props');
    if (!container) return;
    const cfg = currentAlertConfig();
    container.innerHTML =
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="prop-alert-enabled" ' + (cfg.enabled ? 'checked' : '') + '> 有効</label>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">表示時間 (ms)</label>' +
        '<input type="range" id="prop-alert-duration" min="1000" max="15000" step="500" value="' + cfg.duration + '">' +
        '<span class="val-display" id="val-alert-duration">' + cfg.duration + 'ms</span>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">優先度</label>' +
        '<input type="range" id="prop-alert-priority" min="0" max="10" step="1" value="' + cfg.priority + '">' +
        '<span class="val-display" id="val-alert-priority">' + cfg.priority + '</span>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">SE 音量</label>' +
        '<input type="range" id="prop-alert-volume" min="0" max="1" step="0.1" value="' + cfg.soundVolume + '">' +
        '<span class="val-display" id="val-alert-volume">' + (cfg.soundVolume * 100).toFixed(0) + '%</span>' +
      '</div>';

    $('prop-alert-enabled').addEventListener('change', function () {
      cfg.enabled = this.checked;
      renderAlertTypeGrid();
      saveState();
      updatePreview();
    });
    $('prop-alert-duration').addEventListener('input', function () {
      cfg.duration = parseInt(this.value, 10);
      $('val-alert-duration').textContent = cfg.duration + 'ms';
      saveState();
      updatePreview();
    });
    $('prop-alert-priority').addEventListener('input', function () {
      cfg.priority = parseInt(this.value, 10);
      $('val-alert-priority').textContent = cfg.priority;
      saveState();
    });
    $('prop-alert-volume').addEventListener('input', function () {
      cfg.soundVolume = parseFloat(this.value);
      $('val-alert-volume').textContent = (cfg.soundVolume * 100).toFixed(0) + '%';
      saveState();
    });
  }

  // ── Layer Management ──
  function renderLayerList() {
    const container = $('layer-list');
    if (!container) return;
    const cfg = currentAlertConfig();
    container.innerHTML = '';

    cfg.layers.forEach(function (layer, i) {
      const item = document.createElement('div');
      item.className = 'layer-item' + (i === state.activeLayerIndex ? ' active' : '');
      item.dataset.index = i;

      const typeIcons = { text: '\uD83D\uDCC4', emoji: '\uD83D\uDE00', shape: '\u25CF', particle: '\u2728' };
      const icon = typeIcons[layer.type] || '\u2753';
      const label = layer.type === 'text' ? (layer.content || 'Text').substring(0, 16) :
                    layer.type === 'emoji' ? layer.emoji :
                    layer.type === 'shape' ? layer.shape :
                    layer.particleType || 'particle';

      item.innerHTML =
        '<span class="layer-icon">' + icon + '</span>' +
        '<span class="layer-name">' + label + '</span>' +
        '<span class="layer-vis" data-action="toggle-vis" title="表示切替">' + (layer.visible ? '\uD83D\uDC41' : '\uD83D\uDEAB') + '</span>' +
        (i > 0 ? '<span class="layer-btn" data-action="move-up" title="上へ">\u25B2</span>' : '') +
        (i < cfg.layers.length - 1 ? '<span class="layer-btn" data-action="move-down" title="下へ">\u25BC</span>' : '') +
        '<span class="layer-btn layer-btn-del" data-action="remove" title="削除">\u2716</span>';

      // Click to select
      item.addEventListener('click', function (e) {
        const action = e.target.dataset.action;
        if (action === 'toggle-vis') {
          layer.visible = !layer.visible;
          renderLayerList();
          saveState();
          updatePreview();
        } else if (action === 'move-up') {
          moveLayer(i, i - 1);
        } else if (action === 'move-down') {
          moveLayer(i, i + 1);
        } else if (action === 'remove') {
          removeLayer(i);
        } else {
          selectLayer(i);
        }
      });

      container.appendChild(item);
    });
  }

  function addLayer(type) {
    const cfg = currentAlertConfig();
    let layer;
    switch (type) {
      case 'text':     layer = defaultTextLayer(); break;
      case 'emoji':    layer = defaultEmojiLayer(); break;
      case 'shape':    layer = defaultShapeLayer(); break;
      case 'particle': layer = defaultParticleLayer(); break;
      default:         layer = defaultTextLayer(); break;
    }
    cfg.layers.push(layer);
    state.activeLayerIndex = cfg.layers.length - 1;
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();
  }

  function removeLayer(index) {
    const cfg = currentAlertConfig();
    if (cfg.layers.length <= 1) return; // Keep at least one
    cfg.layers.splice(index, 1);
    if (state.activeLayerIndex >= cfg.layers.length) {
      state.activeLayerIndex = cfg.layers.length - 1;
    }
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();
  }

  function moveLayer(fromIndex, toIndex) {
    const cfg = currentAlertConfig();
    if (toIndex < 0 || toIndex >= cfg.layers.length) return;
    const item = cfg.layers.splice(fromIndex, 1)[0];
    cfg.layers.splice(toIndex, 0, item);
    if (state.activeLayerIndex === fromIndex) {
      state.activeLayerIndex = toIndex;
    }
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();
  }

  function selectLayer(index) {
    state.activeLayerIndex = index;
    renderLayerList();
    renderLayerProps();
  }

  // ── Layer Property Editors ──
  function renderLayerProps() {
    const container = $('layer-props');
    if (!container) return;
    const layer = currentLayer();
    if (!layer) {
      container.innerHTML = '<p class="empty-msg">レイヤーを選択してください</p>';
      return;
    }

    switch (layer.type) {
      case 'text':     renderTextProps(container, layer); break;
      case 'emoji':    renderEmojiProps(container, layer); break;
      case 'shape':    renderShapeProps(container, layer); break;
      case 'particle': renderParticleProps(container, layer); break;
      default:         container.innerHTML = '<p>不明なレイヤータイプ</p>';
    }
  }

  function renderTextProps(container, layer) {
    const vars = VARIABLES[state.activeAlertType] || ['{user}'];
    const varButtons = vars.map(function (v) {
      return '<button class="var-btn" data-var="' + v + '">' + v + '</button>';
    }).join('');

    const animOptions = ['fade-in', 'zoom-in', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'bounce', 'shake', 'flash', 'rotate'].map(function (a) {
      return '<option value="' + a + '"' + (layer.animation === a ? ' selected' : '') + '>' + a + '</option>';
    }).join('');

    const fontOptions = FONTS.map(function (f) {
      return '<option value="' + f + '"' + (layer.font === f ? ' selected' : '') + '>' + f + '</option>';
    }).join('');

    container.innerHTML =
      '<h4>テキストレイヤー</h4>' +
      '<div class="prop-group">' +
        '<label class="prop-label">テキスト内容</label>' +
        '<input type="text" id="lp-content" value="' + escAttr(layer.content) + '">' +
        '<div class="var-buttons">' + varButtons + '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">フォント</label>' +
        '<select id="lp-font">' + fontOptions + '</select>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">サイズ</label>' +
          '<input type="range" id="lp-fontSize" min="12" max="128" value="' + layer.fontSize + '">' +
          '<span class="val-display" id="val-lp-fontSize">' + layer.fontSize + 'px</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">色</label>' +
          '<input type="color" id="lp-color" value="' + layer.color + '">' +
        '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">X位置 (%)</label>' +
          '<input type="range" id="lp-x" min="0" max="100" value="' + layer.x + '">' +
          '<span class="val-display" id="val-lp-x">' + layer.x + '%</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Y位置 (%)</label>' +
          '<input type="range" id="lp-y" min="0" max="100" value="' + layer.y + '">' +
          '<span class="val-display" id="val-lp-y">' + layer.y + '%</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">アニメーション</label>' +
          '<select id="lp-animation">' + animOptions + '</select>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Anim 時間 (ms)</label>' +
          '<input type="range" id="lp-animDuration" min="100" max="2000" step="100" value="' + layer.animDuration + '">' +
          '<span class="val-display" id="val-lp-animDuration">' + layer.animDuration + 'ms</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-glow" ' + (layer.glow ? 'checked' : '') + '> グロー</label>' +
        '<div id="lp-glow-opts" style="display:' + (layer.glow ? 'block' : 'none') + '">' +
          '<div class="prop-row">' +
            '<input type="color" id="lp-glowColor" value="' + layer.glowColor + '">' +
            '<input type="range" id="lp-glowSize" min="0" max="60" value="' + layer.glowSize + '">' +
            '<span class="val-display" id="val-lp-glowSize">' + layer.glowSize + 'px</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-outline" ' + (layer.outline ? 'checked' : '') + '> アウトライン</label>' +
        '<div id="lp-outline-opts" style="display:' + (layer.outline ? 'block' : 'none') + '">' +
          '<div class="prop-row">' +
            '<input type="color" id="lp-outlineColor" value="' + layer.outlineColor + '">' +
            '<input type="range" id="lp-outlineW" min="1" max="10" value="' + layer.outlineW + '">' +
            '<span class="val-display" id="val-lp-outlineW">' + layer.outlineW + 'px</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-gradient" ' + (layer.gradient ? 'checked' : '') + '> グラデーション</label>' +
        '<div id="lp-gradient-opts" style="display:' + (layer.gradient ? 'block' : 'none') + '">' +
          '<div class="prop-row">' +
            '<input type="color" id="lp-gradColor1" value="' + layer.gradColor1 + '">' +
            '<input type="color" id="lp-gradColor2" value="' + layer.gradColor2 + '">' +
          '</div>' +
        '</div>' +
      '</div>';

    // Bind events
    bindLayerInput('lp-content', layer, 'content', 'text');
    bindLayerInput('lp-font', layer, 'font', 'select');
    bindLayerRange('lp-fontSize', layer, 'fontSize', 'val-lp-fontSize', 'px');
    bindLayerInput('lp-color', layer, 'color', 'color');
    bindLayerRange('lp-x', layer, 'x', 'val-lp-x', '%');
    bindLayerRange('lp-y', layer, 'y', 'val-lp-y', '%');
    bindLayerInput('lp-animation', layer, 'animation', 'select');
    bindLayerRange('lp-animDuration', layer, 'animDuration', 'val-lp-animDuration', 'ms');
    bindLayerCheckbox('lp-glow', layer, 'glow', 'lp-glow-opts');
    bindLayerInput('lp-glowColor', layer, 'glowColor', 'color');
    bindLayerRange('lp-glowSize', layer, 'glowSize', 'val-lp-glowSize', 'px');
    bindLayerCheckbox('lp-outline', layer, 'outline', 'lp-outline-opts');
    bindLayerInput('lp-outlineColor', layer, 'outlineColor', 'color');
    bindLayerRange('lp-outlineW', layer, 'outlineW', 'val-lp-outlineW', 'px');
    bindLayerCheckbox('lp-gradient', layer, 'gradient', 'lp-gradient-opts');
    bindLayerInput('lp-gradColor1', layer, 'gradColor1', 'color');
    bindLayerInput('lp-gradColor2', layer, 'gradColor2', 'color');

    // Variable insert buttons
    $$('.var-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var input = $('lp-content');
        var pos = input.selectionStart || input.value.length;
        var v = btn.dataset.var;
        input.value = input.value.slice(0, pos) + v + input.value.slice(pos);
        layer.content = input.value;
        renderLayerList();
        saveState();
        updatePreview();
      });
    });
  }

  function renderEmojiProps(container, layer) {
    var emojiGrid = COMMON_EMOJIS.map(function (e) {
      return '<button class="emoji-btn' + (layer.emoji === e ? ' active' : '') + '" data-emoji="' + e + '">' + e + '</button>';
    }).join('');

    var animOptions = ['fade-in', 'zoom-in', 'bounce', 'shake', 'rotate', 'slide-up'].map(function (a) {
      return '<option value="' + a + '"' + (layer.animation === a ? ' selected' : '') + '>' + a + '</option>';
    }).join('');

    container.innerHTML =
      '<h4>絵文字レイヤー</h4>' +
      '<div class="prop-group">' +
        '<label class="prop-label">絵文字を選択</label>' +
        '<div class="emoji-grid">' + emojiGrid + '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">サイズ</label>' +
        '<input type="range" id="lp-size" min="16" max="128" value="' + layer.size + '">' +
        '<span class="val-display" id="val-lp-size">' + layer.size + 'px</span>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">X位置 (%)</label>' +
          '<input type="range" id="lp-x" min="0" max="100" value="' + layer.x + '">' +
          '<span class="val-display" id="val-lp-x">' + layer.x + '%</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Y位置 (%)</label>' +
          '<input type="range" id="lp-y" min="0" max="100" value="' + layer.y + '">' +
          '<span class="val-display" id="val-lp-y">' + layer.y + '%</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">アニメーション</label>' +
          '<select id="lp-animation">' + animOptions + '</select>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Anim 時間 (ms)</label>' +
          '<input type="range" id="lp-animDuration" min="100" max="2000" step="100" value="' + layer.animDuration + '">' +
          '<span class="val-display" id="val-lp-animDuration">' + layer.animDuration + 'ms</span>' +
        '</div>' +
      '</div>';

    bindLayerRange('lp-size', layer, 'size', 'val-lp-size', 'px');
    bindLayerRange('lp-x', layer, 'x', 'val-lp-x', '%');
    bindLayerRange('lp-y', layer, 'y', 'val-lp-y', '%');
    bindLayerInput('lp-animation', layer, 'animation', 'select');
    bindLayerRange('lp-animDuration', layer, 'animDuration', 'val-lp-animDuration', 'ms');

    $$('.emoji-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        layer.emoji = btn.dataset.emoji;
        renderEmojiProps(container, layer);
        renderLayerList();
        saveState();
        updatePreview();
      });
    });
  }

  function renderShapeProps(container, layer) {
    var shapes = ['circle', 'star', 'heart', 'diamond'];
    var shapeButtons = shapes.map(function (s) {
      var icons = { circle: '\u25CF', star: '\u2605', heart: '\u2764', diamond: '\u25C6' };
      return '<button class="shape-btn' + (layer.shape === s ? ' active' : '') + '" data-shape="' + s + '">' + icons[s] + ' ' + s + '</button>';
    }).join('');

    var animOptions = ['fade-in', 'zoom-in', 'bounce', 'rotate', 'flash', 'shake'].map(function (a) {
      return '<option value="' + a + '"' + (layer.animation === a ? ' selected' : '') + '>' + a + '</option>';
    }).join('');

    container.innerHTML =
      '<h4>シェイプレイヤー</h4>' +
      '<div class="prop-group">' +
        '<label class="prop-label">シェイプ</label>' +
        '<div class="shape-grid">' + shapeButtons + '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">サイズ</label>' +
          '<input type="range" id="lp-size" min="10" max="300" value="' + layer.size + '">' +
          '<span class="val-display" id="val-lp-size">' + layer.size + 'px</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">色</label>' +
          '<input type="color" id="lp-color" value="' + layer.color + '">' +
        '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">X位置 (%)</label>' +
          '<input type="range" id="lp-x" min="0" max="100" value="' + layer.x + '">' +
          '<span class="val-display" id="val-lp-x">' + layer.x + '%</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Y位置 (%)</label>' +
          '<input type="range" id="lp-y" min="0" max="100" value="' + layer.y + '">' +
          '<span class="val-display" id="val-lp-y">' + layer.y + '%</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">アニメーション</label>' +
          '<select id="lp-animation">' + animOptions + '</select>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">Anim 時間 (ms)</label>' +
          '<input type="range" id="lp-animDuration" min="100" max="2000" step="100" value="' + layer.animDuration + '">' +
          '<span class="val-display" id="val-lp-animDuration">' + layer.animDuration + 'ms</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-stroke" ' + (layer.stroke ? 'checked' : '') + '> ストローク</label>' +
        '<div id="lp-stroke-opts" style="display:' + (layer.stroke ? 'block' : 'none') + '">' +
          '<div class="prop-row">' +
            '<input type="color" id="lp-strokeColor" value="' + layer.strokeColor + '">' +
            '<input type="range" id="lp-strokeW" min="1" max="10" value="' + layer.strokeW + '">' +
            '<span class="val-display" id="val-lp-strokeW">' + layer.strokeW + 'px</span>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-glow" ' + (layer.glow ? 'checked' : '') + '> グロー</label>' +
        '<div id="lp-glow-opts" style="display:' + (layer.glow ? 'block' : 'none') + '">' +
          '<div class="prop-row">' +
            '<input type="color" id="lp-glowColor" value="' + layer.glowColor + '">' +
            '<input type="range" id="lp-glowSize" min="0" max="60" value="' + layer.glowSize + '">' +
            '<span class="val-display" id="val-lp-glowSize">' + layer.glowSize + 'px</span>' +
          '</div>' +
        '</div>' +
      '</div>';

    bindLayerRange('lp-size', layer, 'size', 'val-lp-size', 'px');
    bindLayerInput('lp-color', layer, 'color', 'color');
    bindLayerRange('lp-x', layer, 'x', 'val-lp-x', '%');
    bindLayerRange('lp-y', layer, 'y', 'val-lp-y', '%');
    bindLayerInput('lp-animation', layer, 'animation', 'select');
    bindLayerRange('lp-animDuration', layer, 'animDuration', 'val-lp-animDuration', 'ms');
    bindLayerCheckbox('lp-stroke', layer, 'stroke', 'lp-stroke-opts');
    bindLayerInput('lp-strokeColor', layer, 'strokeColor', 'color');
    bindLayerRange('lp-strokeW', layer, 'strokeW', 'val-lp-strokeW', 'px');
    bindLayerCheckbox('lp-glow', layer, 'glow', 'lp-glow-opts');
    bindLayerInput('lp-glowColor', layer, 'glowColor', 'color');
    bindLayerRange('lp-glowSize', layer, 'glowSize', 'val-lp-glowSize', 'px');

    $$('.shape-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        layer.shape = btn.dataset.shape;
        renderShapeProps(container, layer);
        renderLayerList();
        saveState();
        updatePreview();
      });
    });
  }

  function renderParticleProps(container, layer) {
    var types = ['confetti', 'sparkle', 'heart', 'star', 'firework', 'emoji', 'snow', 'bubble'];
    var typeButtons = types.map(function (t) {
      return '<button class="particle-type-btn' + (layer.particleType === t ? ' active' : '') + '" data-ptype="' + t + '">' + t + '</button>';
    }).join('');

    var colorInputs = (layer.colors || []).map(function (c, i) {
      return '<input type="color" class="particle-color" data-ci="' + i + '" value="' + c + '">';
    }).join('');

    container.innerHTML =
      '<h4>パーティクルレイヤー</h4>' +
      '<div class="prop-group">' +
        '<label class="prop-label">パーティクルタイプ</label>' +
        '<div class="particle-type-grid">' + typeButtons + '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">数量</label>' +
        '<input type="range" id="lp-count" min="5" max="200" value="' + layer.count + '">' +
        '<span class="val-display" id="val-lp-count">' + layer.count + '</span>' +
      '</div>' +
      '<div class="prop-row">' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">速度</label>' +
          '<input type="range" id="lp-speed" min="0.5" max="10" step="0.5" value="' + layer.speed + '">' +
          '<span class="val-display" id="val-lp-speed">' + layer.speed + '</span>' +
        '</div>' +
        '<div class="prop-group prop-half">' +
          '<label class="prop-label">重力</label>' +
          '<input type="range" id="lp-gravity" min="0" max="5" step="0.1" value="' + layer.gravity + '">' +
          '<span class="val-display" id="val-lp-gravity">' + layer.gravity + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label">カラーパレット</label>' +
        '<div class="color-palette">' + colorInputs +
          '<button class="btn-small" id="btn-add-color">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="prop-group">' +
        '<label class="prop-label"><input type="checkbox" id="lp-burst" ' + (layer.burst ? 'checked' : '') + '> バースト (一斉放出)</label>' +
      '</div>';

    bindLayerRange('lp-count', layer, 'count', 'val-lp-count', '');
    bindLayerRangeFloat('lp-speed', layer, 'speed', 'val-lp-speed', '');
    bindLayerRangeFloat('lp-gravity', layer, 'gravity', 'val-lp-gravity', '');

    $('lp-burst').addEventListener('change', function () {
      layer.burst = this.checked;
      saveState();
      updatePreview();
    });

    $$('.particle-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        layer.particleType = btn.dataset.ptype;
        renderParticleProps(container, layer);
        renderLayerList();
        saveState();
        updatePreview();
      });
    });

    $$('.particle-color').forEach(function (input) {
      input.addEventListener('input', function () {
        var i = parseInt(this.dataset.ci, 10);
        layer.colors[i] = this.value;
        saveState();
        updatePreview();
      });
    });

    $('btn-add-color').addEventListener('click', function () {
      if (layer.colors.length < 8) {
        layer.colors.push('#ffffff');
        renderParticleProps(container, layer);
        saveState();
        updatePreview();
      }
    });
  }

  // ── Bind helpers ──
  function bindLayerInput(id, layer, key, type) {
    var el = $(id);
    if (!el) return;
    var handler = function () {
      layer[key] = el.value;
      renderLayerList();
      saveState();
      updatePreview();
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  }

  function bindLayerRange(id, layer, key, valId, unit) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () {
      layer[key] = parseInt(el.value, 10);
      var ve = $(valId);
      if (ve) ve.textContent = el.value + unit;
      saveState();
      updatePreview();
    });
  }

  function bindLayerRangeFloat(id, layer, key, valId, unit) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('input', function () {
      layer[key] = parseFloat(el.value);
      var ve = $(valId);
      if (ve) ve.textContent = el.value + unit;
      saveState();
      updatePreview();
    });
  }

  function bindLayerCheckbox(id, layer, key, subId) {
    var el = $(id);
    if (!el) return;
    el.addEventListener('change', function () {
      layer[key] = el.checked;
      if (subId) {
        var sub = $(subId);
        if (sub) sub.style.display = el.checked ? 'block' : 'none';
      }
      saveState();
      updatePreview();
    });
  }

  function escAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Theme tab ──
  function renderThemeGrid() {
    var container = $('theme-grid');
    if (!container) return;
    container.innerHTML = '';
    for (var key in THEMES) {
      var t = THEMES[key];
      var btn = document.createElement('button');
      btn.className = 'theme-btn' + (state.theme === key ? ' active' : '');
      btn.dataset.theme = key;
      btn.textContent = t.label;
      btn.style.borderColor = t.colors.glow !== 'none' ? t.colors.glow : t.colors.text;
      btn.addEventListener('click', (function (k) {
        return function () { applyTheme(k); };
      })(key));
      container.appendChild(btn);
    }
  }

  function applyTheme(themeKey) {
    state.theme = themeKey;
    var t = THEMES[themeKey];
    if (!t) return;
    // Apply theme colors to all layers of current alert type
    var cfg = currentAlertConfig();
    cfg.layers.forEach(function (layer) {
      if (layer.type === 'text') {
        layer.color = t.colors.text;
        if (t.colors.glow !== 'none') {
          layer.glow = true;
          layer.glowColor = t.colors.glow;
        } else {
          layer.glow = false;
        }
      }
      if (layer.type === 'particle' && t.colors.particle !== 'none') {
        layer.colors = [t.colors.particle, '#ffffff', t.colors.text];
      }
    });
    renderThemeGrid();
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();
  }

  // ── Font selector ──
  function renderFontSelector() {
    var sel = $('opt-font');
    if (!sel) return;
    sel.innerHTML = FONTS.map(function (f) {
      return '<option value="' + f + '"' + (state.font === f ? ' selected' : '') + '>' + f + '</option>';
    }).join('');
    sel.addEventListener('change', function () {
      state.font = sel.value;
      saveState();
      updatePreview();
    });
  }

  // ── Position grid ──
  function renderPositionGrid() {
    var container = $('position-grid');
    if (!container) return;
    container.innerHTML = '';
    POSITIONS.forEach(function (pos) {
      var btn = document.createElement('button');
      btn.className = 'pos-btn' + (state.position === pos ? ' active' : '');
      btn.dataset.pos = pos;
      btn.textContent = '\u25CF';
      btn.title = pos;
      btn.addEventListener('click', function () {
        state.position = pos;
        $$('.pos-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        saveState();
        updatePreview();
      });
      container.appendChild(btn);
    });
  }

  // ── Queue tab ──
  function initQueueTab() {
    var gapEl = $('opt-queueGap');
    var maxEl = $('opt-maxQueue');
    if (gapEl) {
      gapEl.value = state.queueGap;
      $('val-queueGap') && ($('val-queueGap').textContent = state.queueGap + 'ms');
      gapEl.addEventListener('input', function () {
        state.queueGap = parseInt(gapEl.value, 10);
        $('val-queueGap') && ($('val-queueGap').textContent = state.queueGap + 'ms');
        saveState();
        updatePreview();
      });
    }
    if (maxEl) {
      maxEl.value = state.maxQueue;
      maxEl.addEventListener('input', function () {
        state.maxQueue = Math.max(1, Math.min(50, parseInt(maxEl.value, 10) || 20));
        maxEl.value = state.maxQueue;
        saveState();
      });
    }
  }

  // ── Template gallery ──
  function renderTemplateGallery() {
    var container = $('template-gallery');
    if (!container) return;
    container.innerHTML = '';
    for (var key in TEMPLATES) {
      var t = TEMPLATES[key];
      var card = document.createElement('div');
      card.className = 'template-card';
      card.dataset.template = key;
      card.innerHTML =
        '<div class="template-icon">' + t.icon + '</div>' +
        '<div class="template-info">' +
          '<div class="template-name">' + t.label + '</div>' +
          '<div class="template-desc">' + t.desc + '</div>' +
        '</div>';
      card.addEventListener('click', (function (k) {
        return function () { applyTemplate(k); };
      })(key));
      container.appendChild(card);
    }
  }

  function applyTemplate(templateId) {
    var t = TEMPLATES[templateId];
    if (!t) return;
    var cfg = currentAlertConfig();
    // Deep copy layers from template, substituting correct variable tokens
    cfg.layers = t.layers.map(function (l) {
      var clone = JSON.parse(JSON.stringify(l));
      // Re-inject the alert type variable into text layers
      if (clone.type === 'text') {
        var vars = VARIABLES[state.activeAlertType] || ['{user}'];
        if (clone.content === '{user}') {
          // Keep as-is
        } else if (clone.content.indexOf('{') === -1) {
          clone.content = vars[0] + ' ' + clone.content;
        }
      }
      return clone;
    });
    state.activeLayerIndex = 0;
    renderLayerList();
    renderLayerProps();
    saveState();
    updatePreview();

    // Visual feedback
    $$('.template-card').forEach(function (c) { c.classList.remove('applied'); });
    var applied = document.querySelector('.template-card[data-template="' + templateId + '"]');
    if (applied) {
      applied.classList.add('applied');
      setTimeout(function () { applied.classList.remove('applied'); }, 1500);
    }
  }

  // ── API tab ──
  function renderAPITab() {
    var container = $('api-docs');
    if (!container) return;
    container.innerHTML =
      '<h3>API ドキュメント</h3>' +
      '<p>OBSブラウザソースに表示されたアラートページに対して、<code>postMessage</code> でアラートを送信できます。</p>' +
      '<div class="code-block"><pre>' +
        'const iframe = document.getElementById("preview-frame");\n' +
        'iframe.contentWindow.postMessage({\n' +
        '  type: "alert",\n' +
        '  alertType: "follow",\n' +
        '  data: {\n' +
        '    user: "ViewerName",\n' +
        '    // subscribe: months, tier\n' +
        '    // donation: amount, message\n' +
        '    // raid: viewers\n' +
        '  }\n' +
        '}, "*");\n' +
      '</pre></div>' +
      '<h4>テスト送信</h4>' +
      '<div class="api-test-buttons">' +
        '<button class="btn" id="test-follow">フォローテスト</button>' +
        '<button class="btn" id="test-subscribe">サブスクテスト</button>' +
        '<button class="btn" id="test-donation">ドネーションテスト</button>' +
        '<button class="btn" id="test-raid">レイドテスト</button>' +
      '</div>' +
      '<h4>キュー制御</h4>' +
      '<div class="api-test-buttons">' +
        '<button class="btn btn-secondary" id="test-clear-queue">キュークリア</button>' +
        '<button class="btn btn-secondary" id="test-skip">スキップ</button>' +
      '</div>';

    $('test-follow').addEventListener('click', function () {
      sendTestAlert('follow', { user: 'TestUser123' });
    });
    $('test-subscribe').addEventListener('click', function () {
      sendTestAlert('subscribe', { user: 'TestUser123', months: 3, tier: 'Tier 1' });
    });
    $('test-donation').addEventListener('click', function () {
      sendTestAlert('donation', { user: 'TestUser123', amount: 500, message: 'がんばって！' });
    });
    $('test-raid').addEventListener('click', function () {
      sendTestAlert('raid', { user: 'TestUser123', viewers: 42 });
    });
    $('test-clear-queue').addEventListener('click', function () {
      var frame = $('preview-frame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'clear-queue' }, '*');
      }
    });
    $('test-skip').addEventListener('click', function () {
      var frame = $('preview-frame');
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage({ type: 'skip' }, '*');
      }
    });
  }

  function sendTestAlert(alertType, data) {
    var frame = $('preview-frame');
    if (!frame || !frame.contentWindow) return;
    frame.contentWindow.postMessage({
      type: 'alert',
      alertType: alertType,
      data: data,
    }, '*');
  }

  // ── URL building ──
  function buildURL() {
    var base = new URL('index.html', location.href).href;
    var p = new URLSearchParams();

    p.set('preview', 'true');
    p.set('theme', state.theme);
    p.set('font', state.font);
    p.set('position', state.position);
    p.set('queueGap', state.queueGap);
    p.set('maxQueue', state.maxQueue);

    // Build alerts config (only enabled types)
    var alerts = {};
    for (var key in state.alertTypes) {
      var cfg = state.alertTypes[key];
      if (cfg.enabled) {
        alerts[key] = {
          duration: cfg.duration,
          priority: cfg.priority,
          soundId: cfg.soundId,
          soundTime: cfg.soundTime,
          soundVolume: cfg.soundVolume,
          layers: cfg.layers,
        };
      }
    }
    p.set('alerts', JSON.stringify(alerts));

    return base + '?' + p.toString();
  }

  // ── Preview ──
  var previewTimer;
  function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(function () {
      var url = buildURL();
      var obsUrl = $('obs-url');
      if (obsUrl) obsUrl.value = url;
      var frame = $('preview-frame');
      if (frame) frame.src = url;
    }, 250);
  }

  // ── Save tab: presets ──
  function initPresets() {
    $$('.preset-slot').forEach(function (slot) {
      var n = slot.dataset.slot;
      var saveBtn = slot.querySelector('[data-action="save"]');
      var loadBtn = slot.querySelector('[data-action="load"]');

      if (saveBtn) {
        saveBtn.addEventListener('click', function () {
          var presets = loadPresets();
          presets[n] = JSON.parse(JSON.stringify(state));
          localStorage.setItem('sap-presets', JSON.stringify(presets));
          saveBtn.textContent = '\u4FDD\u5B58\u6E08!';
          setTimeout(function () { saveBtn.textContent = '\u4FDD\u5B58' + n; }, 1500);
        });
      }

      if (loadBtn) {
        loadBtn.addEventListener('click', function () {
          var presets = loadPresets();
          if (presets[n]) {
            state = { ...defaultState(), ...presets[n] };
            // Deep merge alertTypes
            var def = defaultState();
            for (var k in def.alertTypes) {
              if (!state.alertTypes[k]) {
                state.alertTypes[k] = def.alertTypes[k];
              } else {
                state.alertTypes[k] = { ...def.alertTypes[k], ...state.alertTypes[k] };
              }
            }
            fullUIRefresh();
            saveState();
            updatePreview();
          }
        });
      }
    });
  }

  function loadPresets() {
    try {
      var s = localStorage.getItem('sap-presets');
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  }

  // ── Export / Import ──
  function initExportImport() {
    var btnExport = $('btn-export');
    var btnImport = $('btn-import');
    var fileInput = $('file-import');

    if (btnExport) {
      btnExport.addEventListener('click', function () {
        var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'stream-alert-pro-settings.json';
        a.click();
        URL.revokeObjectURL(a.href);
      });
    }

    if (btnImport) {
      btnImport.addEventListener('click', function () {
        if (fileInput) fileInput.click();
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', function (e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function () {
          try {
            var imported = JSON.parse(reader.result);
            state = { ...defaultState(), ...imported };
            // Deep merge alertTypes
            var def = defaultState();
            for (var k in def.alertTypes) {
              if (!state.alertTypes[k]) {
                state.alertTypes[k] = def.alertTypes[k];
              } else {
                state.alertTypes[k] = { ...def.alertTypes[k], ...state.alertTypes[k] };
              }
            }
            fullUIRefresh();
            saveState();
            updatePreview();
          } catch (err) {
            alert('\u8A2D\u5B9A\u30D5\u30A1\u30A4\u30EB\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F');
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });
    }
  }

  // ── Copy URL ──
  function initCopyURL() {
    var btn = $('btn-copy-url');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = buildURL();
      navigator.clipboard.writeText(url).then(function () {
        var msg = $('copy-msg');
        if (msg) {
          msg.textContent = 'URL\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\uFF01';
          setTimeout(function () { msg.textContent = ''; }, 3000);
        }
      });
    });
  }

  // ── Preview size buttons ──
  function initSizeButtons() {
    $$('.size-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.size-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var frame = $('preview-frame');
        if (frame) {
          frame.style.width = btn.dataset.w + 'px';
          frame.style.height = btn.dataset.h + 'px';
        }
      });
    });
  }

  // ── Tab switching ──
  function initTabs() {
    $$('.tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        $$('.tab').forEach(function (t) { t.classList.remove('active'); });
        $$('.tab-content').forEach(function (tc) { tc.classList.remove('active'); });
        tab.classList.add('active');
        var target = $('tab-' + tab.dataset.tab);
        if (target) target.classList.add('active');
        // Re-render timeline when switching to timeline tab
        if (tab.dataset.tab === 'timeline' && window.TimelineEditor) {
          window.TimelineEditor.render();
        }
      });
    });
  }

  // ── Add layer buttons ──
  function initAddLayerButtons() {
    var btns = {
      'btn-add-text': 'text',
      'btn-add-emoji': 'emoji',
      'btn-add-shape': 'shape',
      'btn-add-particle': 'particle',
    };
    for (var id in btns) {
      (function (btnId, layerType) {
        var el = $(btnId);
        if (el) {
          el.addEventListener('click', function () { addLayer(layerType); });
        }
      })(id, btns[id]);
    }
  }

  // ── Full UI refresh ──
  function fullUIRefresh() {
    renderAlertTypeGrid();
    renderAlertTypeProps();
    renderLayerList();
    renderLayerProps();
    renderThemeGrid();
    renderFontSelector();
    renderPositionGrid();
    renderTemplateGallery();
    renderAPITab();
    initQueueTab();
  }

  // ── Init ──
  function initTimeline() {
    var el = document.getElementById('timeline-editor');
    if (el && window.TimelineEditor) {
      window.TimelineEditor.init(el, state, {
        onUpdate: function () {
          saveState();
          updatePreview();
        },
        onSelectLayer: function (idx) {
          state.activeLayerIndex = idx;
          renderLayerList();
          renderLayerProps();
        },
      });
    }
  }

  function init() {
    initTabs();
    initAddLayerButtons();
    initPresets();
    initExportImport();
    initCopyURL();
    initSizeButtons();
    initTimeline();
    fullUIRefresh();
    updatePreview();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
