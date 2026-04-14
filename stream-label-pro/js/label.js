/* Stream Label Pro - Label Display Engine
   OBS browser source で表示するラベル本体 */

(function () {
  'use strict';

  // ── テーマプリセット ──
  const THEMES = {
    neon: { textColor: '#ffffff', accentColor: '#00aaff', bgColor: 'rgba(10,10,46,0.8)', glow: true, glowColor: '#00aaff' },
    gaming: { textColor: '#ffffff', accentColor: '#ff6ec7', bgColor: 'rgba(26,10,46,0.8)', gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5' },
    minimal: { textColor: '#ffffff', accentColor: '#888888', bgColor: 'rgba(30,30,30,0.7)' },
    pastel: { textColor: '#5d4037', accentColor: '#ce93d8', bgColor: 'rgba(252,228,236,0.85)' },
    retro: { textColor: '#00ff41', accentColor: '#00ff41', bgColor: 'rgba(0,17,0,0.85)', glow: true, glowColor: '#00ff41' },
  };

  // ── コンテナ ──
  const container = document.getElementById('label-container');

  // ── デフォルトスロット ──
  function defaultSlot(index) {
    return {
      enabled: true,
      layout: 'lower-third',
      position: 'bottom-left',
      offsetX: 0,
      offsetY: 0,
      line1: 'ラベル ' + (index + 1),
      line2: '',
      icon: '',
      socials: [],
      scroll: false,
      scrollDuration: 15,
      entrance: 'slide-left',
      exit: 'slide-left',
      entranceDuration: 500,
      exitDuration: 500,
      autoHide: 0,
      blur: false,
      borderRadius: 0,
      textEffect: '',
      bgOverride: '',
    };
  }

  // ── URLパラメータ読み取り ──
  const params = new URLSearchParams(location.search);
  let themeName = params.get('th') || 'neon';
  let fontFamily = decodeURIComponent(params.get('f') || 'Noto Sans JP');
  let slots = [];

  const slotsParam = params.get('slots');
  if (slotsParam) {
    try { slots = JSON.parse(decodeURIComponent(slotsParam)); }
    catch (e) { console.warn('Failed to parse slots param:', e); }
  }

  // localStorageフォールバック
  if (!slotsParam || slots.length === 0) {
    try {
      const saved = localStorage.getItem('slp-state');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.slots && s.slots.length > 0) slots = s.slots;
        if (s.theme) themeName = s.theme;
        if (s.font) fontFamily = s.font;
      }
    } catch (e) { /* ignore */ }
  }

  // デフォルトスロットがなければ1つ作成
  if (slots.length === 0) {
    slots.push(defaultSlot(0));
  }

  function getTheme() {
    return THEMES[themeName] || THEMES.neon;
  }

  // ── スロット要素の管理 ──
  const slotElements = [];

  // ── レイアウトビルダー ──

  function buildLowerThird(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-lower-third';

    var bar = document.createElement('div');
    bar.className = 'lt-accent-bar';
    bar.style.background = slot.accentOverride || theme.accentColor;
    wrapper.appendChild(bar);

    var content = document.createElement('div');
    content.className = 'lt-content';
    content.style.background = slot.bgOverride || theme.bgColor;

    var l1 = document.createElement('div');
    l1.className = 'lt-line1';
    l1.textContent = slot.line1 || '';
    content.appendChild(l1);

    if (slot.line2) {
      var l2 = document.createElement('div');
      l2.className = 'lt-line2';
      l2.textContent = slot.line2;
      content.appendChild(l2);
    }

    wrapper.appendChild(content);
    return wrapper;
  }

  function buildCard(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-card';
    wrapper.style.background = slot.bgOverride || theme.bgColor;

    var icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.style.background = slot.accentOverride || theme.accentColor;
    icon.textContent = slot.icon || '';
    wrapper.appendChild(icon);

    var content = document.createElement('div');
    content.className = 'card-content';

    var l1 = document.createElement('div');
    l1.className = 'card-line1';
    l1.textContent = slot.line1 || '';
    content.appendChild(l1);

    if (slot.line2) {
      var l2 = document.createElement('div');
      l2.className = 'card-line2';
      l2.textContent = slot.line2;
      content.appendChild(l2);
    }

    wrapper.appendChild(content);
    return wrapper;
  }

  function buildSocial(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-social';

    var socials = slot.socials || [];
    socials.forEach(function (s) {
      var pill = document.createElement('div');
      pill.className = 'social-pill';
      pill.style.background = slot.bgOverride || theme.bgColor;

      var iconEl = document.createElement('span');
      iconEl.className = 'social-pill-icon';
      iconEl.textContent = s.icon || '';
      pill.appendChild(iconEl);

      var handle = document.createElement('span');
      handle.textContent = s.handle || '';
      pill.appendChild(handle);

      wrapper.appendChild(pill);
    });

    return wrapper;
  }

  function buildTelop(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-telop';
    wrapper.style.background = slot.bgOverride || theme.bgColor;

    var text = document.createElement('span');
    text.className = 'telop-text';
    text.textContent = slot.line1 || '';

    if (slot.scroll) {
      text.classList.add('telop-scroll');
      text.style.setProperty('--scroll-duration', (slot.scrollDuration || 15) + 's');
    }

    wrapper.appendChild(text);
    return wrapper;
  }

  function buildMini(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-mini';
    wrapper.style.background = slot.bgOverride || theme.bgColor;

    if (slot.icon) {
      var iconEl = document.createElement('span');
      iconEl.className = 'mini-icon';
      iconEl.textContent = slot.icon;
      wrapper.appendChild(iconEl);
    }

    var text = document.createElement('span');
    text.textContent = slot.line1 || '';
    wrapper.appendChild(text);

    return wrapper;
  }

  function buildSchedule(slot, theme) {
    var wrapper = document.createElement('div');
    wrapper.className = 'layout-schedule';
    wrapper.style.background = slot.bgOverride || theme.bgColor;

    var cal = document.createElement('div');
    cal.className = 'schedule-cal';
    cal.style.background = slot.accentOverride || theme.accentColor;
    cal.textContent = slot.icon || '\uD83D\uDCC5';
    wrapper.appendChild(cal);

    var content = document.createElement('div');
    content.className = 'schedule-content';

    var l1 = document.createElement('div');
    l1.className = 'schedule-line1';
    l1.textContent = slot.line1 || '';
    content.appendChild(l1);

    if (slot.line2) {
      var l2 = document.createElement('div');
      l2.className = 'schedule-line2';
      l2.textContent = slot.line2;
      content.appendChild(l2);
    }

    wrapper.appendChild(content);
    return wrapper;
  }

  // ── レイアウトディスパッチ ──
  var layoutBuilders = {
    'lower-third': buildLowerThird,
    'card': buildCard,
    'social': buildSocial,
    'telop': buildTelop,
    'mini': buildMini,
    'schedule': buildSchedule,
  };

  // ── スロット描画 ──
  function renderSlot(slotConfig, index) {
    var theme = getTheme();
    var cfg = Object.assign({}, defaultSlot(index), slotConfig);

    var el = document.createElement('div');
    el.className = 'label-slot pos-' + cfg.position;
    el.style.setProperty('--offset-x', cfg.offsetX + 'px');
    el.style.setProperty('--offset-y', cfg.offsetY + 'px');
    el.style.fontFamily = "'" + fontFamily + "', sans-serif";
    el.style.color = theme.textColor;

    if (cfg.blur) {
      el.setAttribute('data-blur', 'true');
    }

    if (cfg.borderRadius > 0) {
      el.style.borderRadius = cfg.borderRadius + 'px';
    }

    // レイアウトビルダー呼び出し
    var builder = layoutBuilders[cfg.layout] || layoutBuilders['lower-third'];
    var layoutEl = builder(cfg, theme);
    el.appendChild(layoutEl);

    // テキストエフェクト適用
    applyTextEffect(el, cfg.textEffect, theme);

    el.dataset.slotIndex = index;
    return el;
  }

  // ── テキストエフェクト ──
  function applyTextEffect(el, effect, theme) {
    if (!effect) return;
    el.classList.add('fx-' + effect);

    switch (effect) {
      case 'glow':
        el.style.setProperty('--glow-color', theme.glowColor || theme.accentColor);
        break;
      case 'outline':
        el.style.setProperty('--outline-color', theme.accentColor);
        el.style.setProperty('--outline-width', '2px');
        break;
      case 'gradient':
        el.style.setProperty('--grad-color1', theme.gradColor1 || theme.accentColor);
        el.style.setProperty('--grad-color2', theme.gradColor2 || '#7873f5');
        break;
      case 'shadow':
        el.style.setProperty('--shadow-color', 'rgba(0,0,0,0.5)');
        break;
    }
  }

  // ── アニメーション適用 ──
  function applyEntrance(el, cfg) {
    var name = cfg.entrance || 'fade-in';
    var dur = cfg.entranceDuration || 500;
    el.style.opacity = '0';
    el.style.animation = 'enter-' + name + ' ' + dur + 'ms ease-out forwards';

    // autoHide対応
    if (cfg.autoHide > 0) {
      setTimeout(function () {
        applyExit(el, cfg);
      }, cfg.autoHide);
    }
  }

  function applyExit(el, cfg) {
    var name = cfg.exit || 'fade-out';
    var dur = cfg.exitDuration || 500;
    el.style.animation = 'exit-' + name + ' ' + dur + 'ms ease-in forwards';

    setTimeout(function () {
      el.style.opacity = '0';
      el.style.animation = '';
    }, dur);
  }

  // ── 公開メソッド ──
  function showSlot(index) {
    var el = slotElements[index];
    if (!el) return;
    container.appendChild(el);
    var cfg = Object.assign({}, defaultSlot(index), slots[index]);
    applyEntrance(el, cfg);
  }

  function hideSlot(index) {
    var el = slotElements[index];
    if (!el || !el.parentNode) return;
    var cfg = Object.assign({}, defaultSlot(index), slots[index]);
    applyExit(el, cfg);

    var dur = cfg.exitDuration || 500;
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, dur);
  }

  function updateSlot(index, updates) {
    if (!slots[index]) return;
    Object.assign(slots[index], updates);

    // 再描画
    var wasVisible = slotElements[index] && slotElements[index].parentNode;
    if (wasVisible) {
      slotElements[index].parentNode.removeChild(slotElements[index]);
    }

    slotElements[index] = renderSlot(slots[index], index);

    if (wasVisible) {
      var cfg = Object.assign({}, defaultSlot(index), slots[index]);
      container.appendChild(slotElements[index]);
      applyEntrance(slotElements[index], cfg);
    }
  }

  function showAll() {
    for (var i = 0; i < slotElements.length; i++) {
      showSlot(i);
    }
  }

  function hideAll() {
    for (var i = 0; i < slotElements.length; i++) {
      hideSlot(i);
    }
  }

  // ── postMessage API ──
  window.addEventListener('message', function (e) {
    var data;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch (err) { return; }

    if (!data || !data.type) return;

    switch (data.type) {
      case 'show':
        showSlot(data.slot || 0);
        break;
      case 'hide':
        hideSlot(data.slot || 0);
        break;
      case 'show-all':
        showAll();
        break;
      case 'hide-all':
        hideAll();
        break;
      case 'update':
        var idx = data.slot || 0;
        var updates = {};
        if (data.line1 !== undefined) updates.line1 = data.line1;
        if (data.line2 !== undefined) updates.line2 = data.line2;
        if (data.icon !== undefined) updates.icon = data.icon;
        if (data.layout !== undefined) updates.layout = data.layout;
        if (data.socials !== undefined) updates.socials = data.socials;
        updateSlot(idx, updates);
        break;
    }
  });

  // ── グローバルAPI ──
  window.StreamLabelPro = {
    show: showSlot,
    hide: hideSlot,
    showAll: showAll,
    hideAll: hideAll,
    update: updateSlot,

    getSlots: function () {
      return slots.slice();
    },

    getTheme: function () {
      return themeName;
    },

    getConfig: function () {
      return { theme: themeName, font: fontFamily, slots: slots };
    },
  };

  // ── 初期化 ──
  slots.forEach(function (slotCfg, i) {
    slotElements[i] = renderSlot(slotCfg, i);
  });

  // enabled なスロットをエントランス付きで表示
  slots.forEach(function (slotCfg, i) {
    var cfg = Object.assign({}, defaultSlot(i), slotCfg);
    if (cfg.enabled) {
      showSlot(i);
    }
  });

  console.log('Stream Label Pro v1.0 loaded. Theme:', themeName, 'Slots:', slots.length);

})();
