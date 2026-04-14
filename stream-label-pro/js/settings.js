/*  Stream Label Pro - Settings Controller */

(function () {
  'use strict';

  // ── デフォルトスロット ──
  function defaultSlot(index) {
    return {
      enabled: true,
      layout: 'lower-third',
      icon: '',
      line1: index === 0 ? '配信者名' : 'スロット' + (index + 1),
      line2: 'ゲーム実況中',
      socials: [],
      scheduleText: '次回配信: 土曜 20:00',
      font: 'Noto Sans JP',
      fontSize1: 24,
      fontSize2: 16,
      textColor: '#ffffff',
      accentColor: '#00aaff',
      bgColor: 'rgba(0,0,0,0.6)',
      bgBlur: 0,
      borderRadius: 8,
      glow: false,
      glowColor: '#00aaff',
      outline: false,
      gradient: false,
      gradColor1: '#ff6ec7',
      gradColor2: '#7873f5',
      shadow: false,
      position: 'bottom-left',
      offsetX: 5,
      offsetY: 5,
      maxWidth: 500,
      padding: 12,
      entrance: 'slide-left',
      exit: 'slide-left',
      duration: 600,
      autoHide: false,
      autoHideDelay: 10000,
    };
  }

  // ── デフォルト状態 ──
  function defaultState() {
    return {
      theme: 'neon',
      font: 'Noto Sans JP',
      activeSlotIndex: 0,
      slots: [defaultSlot(0)],
    };
  }

  // ── ストレージ ──
  const STORAGE_KEY = 'slp-state';
  const PRESETS_KEY = 'slp-presets';

  function loadState() {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) {
        const parsed = JSON.parse(s);
        // スロットにデフォルト値をマージ
        if (parsed.slots) {
          parsed.slots = parsed.slots.map((sl, i) => ({ ...defaultSlot(i), ...sl }));
        }
        return { ...defaultState(), ...parsed };
      }
      return defaultState();
    } catch { return defaultState(); }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  let state = loadState();

  // ── DOM取得ヘルパー ──
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── スロットフィールドマップ ──
  const SLOT_FIELD_MAP = {
    'opt-enabled':       { key: 'enabled',       type: 'checkbox' },
    'opt-icon':          { key: 'icon',          type: 'text' },
    'opt-line1':         { key: 'line1',         type: 'text' },
    'opt-line2':         { key: 'line2',         type: 'text' },
    'opt-scheduleText':  { key: 'scheduleText',  type: 'text' },
    'opt-font':          { key: 'font',          type: 'select' },
    'opt-fontSize1':     { key: 'fontSize1',     type: 'range', valEl: 'val-fontSize1', unit: 'px' },
    'opt-fontSize2':     { key: 'fontSize2',     type: 'range', valEl: 'val-fontSize2', unit: 'px' },
    'opt-textColor':     { key: 'textColor',     type: 'color' },
    'opt-accentColor':   { key: 'accentColor',   type: 'color' },
    'opt-bgColor':       { key: 'bgColor',       type: 'text' },
    'opt-bgBlur':        { key: 'bgBlur',        type: 'range', valEl: 'val-bgBlur', unit: 'px' },
    'opt-borderRadius':  { key: 'borderRadius',  type: 'range', valEl: 'val-borderRadius', unit: 'px' },
    'opt-glow':          { key: 'glow',          type: 'checkbox', sub: 'glow-opts' },
    'opt-glowColor':     { key: 'glowColor',     type: 'color' },
    'opt-outline':       { key: 'outline',       type: 'checkbox' },
    'opt-gradient':      { key: 'gradient',      type: 'checkbox', sub: 'gradient-opts' },
    'opt-gradColor1':    { key: 'gradColor1',    type: 'color' },
    'opt-gradColor2':    { key: 'gradColor2',    type: 'color' },
    'opt-shadow':        { key: 'shadow',        type: 'checkbox' },
    'opt-offsetX':       { key: 'offsetX',       type: 'range', valEl: 'val-offsetX', unit: '%' },
    'opt-offsetY':       { key: 'offsetY',       type: 'range', valEl: 'val-offsetY', unit: '%' },
    'opt-maxWidth':      { key: 'maxWidth',      type: 'range', valEl: 'val-maxWidth', unit: 'px' },
    'opt-padding':       { key: 'padding',       type: 'range', valEl: 'val-padding', unit: 'px' },
    'opt-entrance':      { key: 'entrance',      type: 'select' },
    'opt-exit':          { key: 'exit',           type: 'select' },
    'opt-duration':      { key: 'duration',      type: 'range', valEl: 'val-duration', unit: 'ms' },
    'opt-autoHide':      { key: 'autoHide',      type: 'checkbox', sub: 'autohide-opts' },
    'opt-autoHideDelay': { key: 'autoHideDelay', type: 'range', valEl: 'val-autoHideDelay', unit: 's', divisor: 1000 },
  };

  // ── アクティブスロット取得 ──
  function activeSlot() {
    return state.slots[state.activeSlotIndex] || state.slots[0];
  }

  // ── UI ↔ State 同期 ──
  function stateToUI() {
    const slot = activeSlot();

    for (const [id, cfg] of Object.entries(SLOT_FIELD_MAP)) {
      const el = $(id);
      if (!el) continue;
      const val = slot[cfg.key];

      if (cfg.type === 'checkbox') {
        el.checked = !!val;
        if (cfg.sub) {
          const sub = $(cfg.sub);
          if (sub) sub.style.display = val ? 'block' : 'none';
        }
      } else if (cfg.type === 'range') {
        el.value = val;
        if (cfg.valEl) {
          const ve = $(cfg.valEl);
          if (ve) {
            const display = cfg.divisor ? (val / cfg.divisor) : val;
            ve.textContent = display + cfg.unit;
          }
        }
      } else {
        el.value = val != null ? val : '';
      }
    }

    // スロットタブ
    renderSlotTabs();

    // レイアウトグリッド
    $$('.layout-btn').forEach(b => b.classList.toggle('active', b.dataset.layout === slot.layout));

    // テーマボタン
    $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));

    // ポジショングリッド
    $$('.position-btn').forEach(b => b.classList.toggle('active', b.dataset.pos === slot.position));

    // レイアウト依存フィールド表示
    updateLayoutFields(slot.layout);

    // ソーシャルリスト
    renderSocialList();
  }

  function uiToState() {
    const slot = activeSlot();

    for (const [id, cfg] of Object.entries(SLOT_FIELD_MAP)) {
      const el = $(id);
      if (!el) continue;
      if (cfg.type === 'checkbox') {
        slot[cfg.key] = el.checked;
      } else if (cfg.type === 'range') {
        slot[cfg.key] = parseInt(el.value, 10);
      } else if (cfg.type === 'color') {
        slot[cfg.key] = el.value;
      } else {
        slot[cfg.key] = el.value;
      }
    }

    // ソーシャルリスト読取
    slot.socials = readSocialList();
  }

  // ── レイアウト依存フィールド表示 ──
  function updateLayoutFields(layout) {
    const fieldIcon     = $('field-icon');
    const fieldLine2    = $('field-line2');
    const fieldSocial   = $('field-social');
    const fieldSchedule = $('field-schedule');

    // デフォルト: 全表示
    if (fieldIcon)     fieldIcon.style.display = '';
    if (fieldLine2)    fieldLine2.style.display = '';
    if (fieldSocial)   fieldSocial.style.display = 'none';
    if (fieldSchedule) fieldSchedule.style.display = 'none';

    if (layout === 'social') {
      if (fieldLine2)    fieldLine2.style.display = 'none';
      if (fieldIcon)     fieldIcon.style.display = 'none';
      if (fieldSocial)   fieldSocial.style.display = '';
    } else if (layout === 'schedule') {
      if (fieldLine2)    fieldLine2.style.display = 'none';
      if (fieldSocial)   fieldSocial.style.display = 'none';
      if (fieldSchedule) fieldSchedule.style.display = '';
    } else if (layout === 'mini') {
      if (fieldLine2)    fieldLine2.style.display = 'none';
    }
    // lower-third, card, telop: デフォルト表示
  }

  // ── スロット管理 ──
  function renderSlotTabs() {
    const container = $('slot-tabs');
    if (!container) return;
    container.innerHTML = '';
    state.slots.forEach((sl, i) => {
      const btn = document.createElement('button');
      btn.className = 'slot-tab' + (i === state.activeSlotIndex ? ' active' : '');
      btn.textContent = 'スロット' + (i + 1);
      btn.addEventListener('click', () => switchSlot(i));
      container.appendChild(btn);
    });
  }

  function addSlot() {
    if (state.slots.length >= 5) return;
    const idx = state.slots.length;
    state.slots.push(defaultSlot(idx));
    state.activeSlotIndex = idx;
    fullUIRefresh();
  }

  function removeSlot() {
    if (state.slots.length <= 1) return;
    state.slots.splice(state.activeSlotIndex, 1);
    if (state.activeSlotIndex >= state.slots.length) {
      state.activeSlotIndex = state.slots.length - 1;
    }
    fullUIRefresh();
  }

  function switchSlot(index) {
    uiToState(); // 現在のスロットを保存
    state.activeSlotIndex = index;
    stateToUI();
    saveState();
    updatePreview();
  }

  // ── ソーシャルリスト ──
  function renderSocialList() {
    const container = $('social-list');
    if (!container) return;
    container.innerHTML = '';
    const slot = activeSlot();
    (slot.socials || []).forEach((item, i) => {
      const row = document.createElement('div');
      row.className = 'social-row';
      row.innerHTML =
        '<select class="select social-platform">' +
          '<option value="twitter"' + (item.platform === 'twitter' ? ' selected' : '') + '>Twitter/X</option>' +
          '<option value="youtube"' + (item.platform === 'youtube' ? ' selected' : '') + '>YouTube</option>' +
          '<option value="twitch"' + (item.platform === 'twitch' ? ' selected' : '') + '>Twitch</option>' +
          '<option value="instagram"' + (item.platform === 'instagram' ? ' selected' : '') + '>Instagram</option>' +
          '<option value="tiktok"' + (item.platform === 'tiktok' ? ' selected' : '') + '>TikTok</option>' +
          '<option value="discord"' + (item.platform === 'discord' ? ' selected' : '') + '>Discord</option>' +
        '</select>' +
        '<input type="text" class="input social-handle" value="' + escapeAttr(item.handle || '') + '" placeholder="@handle">' +
        '<button class="btn-del" data-idx="' + i + '">x</button>';
      row.querySelector('.btn-del').addEventListener('click', () => removeSocialRow(i));
      row.querySelector('.social-platform').addEventListener('change', onChange);
      row.querySelector('.social-handle').addEventListener('input', onChange);
      container.appendChild(row);
    });
  }

  function addSocialRow() {
    const slot = activeSlot();
    if (!slot.socials) slot.socials = [];
    slot.socials.push({ platform: 'twitter', handle: '' });
    renderSocialList();
    onChange();
  }

  function removeSocialRow(index) {
    const slot = activeSlot();
    slot.socials.splice(index, 1);
    renderSocialList();
    onChange();
  }

  function readSocialList() {
    const rows = document.querySelectorAll('.social-row');
    const list = [];
    rows.forEach(row => {
      const platform = row.querySelector('.social-platform').value;
      const handle = row.querySelector('.social-handle').value;
      list.push({ platform, handle });
    });
    return list;
  }

  function escapeAttr(str) {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  // ── テーマ定義 ──
  const THEMES = {
    neon: {
      textColor: '#ffffff', accentColor: '#00aaff',
      bgColor: 'rgba(10,10,46,0.8)', glow: true, glowColor: '#00aaff',
      gradient: false, shadow: false,
    },
    gaming: {
      textColor: '#ffffff', accentColor: '#ff6ec7',
      bgColor: 'rgba(13,13,13,0.85)', glow: true, glowColor: '#ff6ec7',
      gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5', shadow: false,
    },
    minimal: {
      textColor: '#ffffff', accentColor: '#888888',
      bgColor: 'rgba(26,26,26,0.7)', glow: false,
      gradient: false, shadow: false,
    },
    pastel: {
      textColor: '#5d4037', accentColor: '#ce93d8',
      bgColor: 'rgba(252,228,236,0.8)', glow: false,
      gradient: false, shadow: false,
    },
    retro: {
      textColor: '#00ff41', accentColor: '#00cc33',
      bgColor: 'rgba(0,17,0,0.85)', glow: true, glowColor: '#00ff41',
      gradient: false, shadow: false,
    },
  };

  // ── テンプレート定義 ──
  const TEMPLATES = [
    { name: 'ネオンゲーマー',    swatch: 'linear-gradient(135deg,#00aaff,#6c5ce7)', layout: 'lower-third', textColor: '#ffffff', accentColor: '#00aaff', bgColor: 'rgba(10,10,46,0.8)', glow: true, glowColor: '#00aaff', gradient: false, line1: 'Player Name', line2: 'Playing Game' },
    { name: 'ミニマルクリーン',   swatch: 'linear-gradient(135deg,#333,#666)',       layout: 'lower-third', textColor: '#ffffff', accentColor: '#aaaaaa', bgColor: 'rgba(0,0,0,0.5)', glow: false, gradient: false, line1: '配信者名', line2: '' },
    { name: 'VTuberかわいい',    swatch: 'linear-gradient(135deg,#ff9a9e,#fad0c4)',  layout: 'card', textColor: '#5d4037', accentColor: '#ff6b9d', bgColor: 'rgba(255,200,220,0.8)', glow: false, gradient: true, gradColor1: '#ff6b9d', gradColor2: '#c44dff', line1: 'VTuber名', line2: 'ファンネーム' },
    { name: 'プロ放送',          swatch: 'linear-gradient(135deg,#1a237e,#0d47a1)',  layout: 'lower-third', textColor: '#ffffff', accentColor: '#42a5f5', bgColor: 'rgba(13,71,161,0.85)', glow: false, gradient: false, line1: 'キャスター名', line2: 'NEWS' },
    { name: 'SNSバー',          swatch: 'linear-gradient(135deg,#7c4dff,#18ffff)',   layout: 'social', textColor: '#ffffff', accentColor: '#18ffff', bgColor: 'rgba(0,0,0,0.7)', glow: true, glowColor: '#18ffff', gradient: false, line1: 'フォローしてね' },
    { name: 'レトロピクセル',    swatch: 'linear-gradient(135deg,#001100,#003300)',   layout: 'mini', textColor: '#00ff41', accentColor: '#00cc33', bgColor: 'rgba(0,17,0,0.9)', glow: true, glowColor: '#00ff41', gradient: false, font: 'DotGothic16', line1: 'RETRO' },
    { name: 'スケジュール',      swatch: 'linear-gradient(135deg,#4a148c,#7b1fa2)',  layout: 'schedule', textColor: '#ffffff', accentColor: '#ce93d8', bgColor: 'rgba(74,20,140,0.8)', glow: false, gradient: false, line1: '配信スケジュール', scheduleText: '毎週土曜 20:00' },
    { name: 'ミニタグ',          swatch: 'linear-gradient(135deg,#ff6f00,#ffc107)',   layout: 'mini', textColor: '#ffffff', accentColor: '#ffc107', bgColor: 'rgba(255,111,0,0.85)', glow: false, gradient: false, line1: 'LIVE' },
  ];

  // ── URL生成 ──
  function buildURL() {
    const base = new URL('index.html', location.href).href;
    const p = new URLSearchParams();

    p.set('theme', state.theme);
    p.set('font', state.font);
    p.set('slots', JSON.stringify(state.slots));

    return base + '?' + p.toString();
  }

  // ── プレビュー更新 ──
  let previewTimer;
  function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const url = buildURL();
      $('obs-url').value = url;
      $('preview-frame').src = url;
    }, 200);
  }

  function onChange() {
    uiToState();
    stateToUI();
    saveState();
    updatePreview();
  }

  function fullUIRefresh() {
    stateToUI();
    saveState();
    updatePreview();
  }

  // ── テンプレート描画 ──
  function renderTemplates() {
    const grid = $('template-grid');
    if (!grid) return;
    grid.innerHTML = '';
    TEMPLATES.forEach((tpl, i) => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.innerHTML =
        '<div class="template-swatch" style="background:' + tpl.swatch + '"></div>' +
        '<span>' + tpl.name + '</span>';
      card.addEventListener('click', () => applyTemplate(i));
      grid.appendChild(card);
    });
  }

  function applyTemplate(index) {
    const tpl = TEMPLATES[index];
    if (!tpl) return;
    const slot = activeSlot();
    const keys = ['layout','textColor','accentColor','bgColor','glow','glowColor','gradient','gradColor1','gradColor2','shadow','line1','line2','scheduleText','font'];
    keys.forEach(k => {
      if (tpl[k] !== undefined) slot[k] = tpl[k];
    });
    fullUIRefresh();
  }

  // ── プリセット ──
  function loadPresets() {
    try {
      const p = localStorage.getItem(PRESETS_KEY);
      return p ? JSON.parse(p) : {};
    } catch { return {}; }
  }

  function savePreset(n) {
    const presets = loadPresets();
    presets[n] = JSON.parse(JSON.stringify(state));
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }

  function loadPreset(n) {
    const presets = loadPresets();
    if (presets[n]) {
      state = { ...defaultState(), ...presets[n] };
      if (state.slots) {
        state.slots = state.slots.map((sl, i) => ({ ...defaultSlot(i), ...sl }));
      }
      fullUIRefresh();
    }
  }

  function deletePreset(n) {
    const presets = loadPresets();
    delete presets[n];
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  }

  // ── エクスポート / インポート ──
  function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stream-label-pro-settings.json';
    a.click();
  }

  function importState(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        state = { ...defaultState(), ...parsed };
        if (state.slots) {
          state.slots = state.slots.map((sl, i) => ({ ...defaultSlot(i), ...sl }));
        }
        fullUIRefresh();
      } catch (err) {
        alert('設定ファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  }

  // ── イベントリスナー設定 ──
  function init() {
    // 全スロットフィールドにchangeイベント
    for (const id of Object.keys(SLOT_FIELD_MAP)) {
      const el = $(id);
      if (!el) continue;
      el.addEventListener('input', onChange);
      el.addEventListener('change', onChange);
    }

    // タブ切替
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        $$('.tab-content').forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        $('tab-' + tab.dataset.tab).classList.add('active');
      });
    });

    // スロットボタン
    $('btn-add-slot').addEventListener('click', addSlot);
    $('btn-remove-slot').addEventListener('click', removeSlot);

    // レイアウトグリッド
    $$('.layout-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = activeSlot();
        slot.layout = btn.dataset.layout;
        $$('.layout-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        updateLayoutFields(slot.layout);
        onChange();
      });
    });

    // テーマボタン
    $$('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        const t = THEMES[state.theme];
        if (t) {
          // テーマ色を全スロットに適用
          state.slots.forEach(sl => {
            Object.assign(sl, t);
          });
        }
        stateToUI();
        saveState();
        updatePreview();
      });
    });

    // ポジショングリッド
    $$('.position-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = activeSlot();
        slot.position = btn.dataset.pos;
        $$('.position-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        onChange();
      });
    });

    // ソーシャル追加
    const btnAddSocial = $('btn-add-social');
    if (btnAddSocial) {
      btnAddSocial.addEventListener('click', addSocialRow);
    }

    // テンプレート描画
    renderTemplates();

    // URLコピー
    $('btn-copy-url').addEventListener('click', () => {
      const url = buildURL();
      navigator.clipboard.writeText(url).then(() => {
        $('copy-msg').textContent = 'URLをコピーしました！';
        setTimeout(() => { $('copy-msg').textContent = ''; }, 3000);
      });
    });

    // プレビューサイズ
    $$('.size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const frame = $('preview-frame');
        frame.style.width = btn.dataset.w + 'px';
        frame.style.height = btn.dataset.h + 'px';
      });
    });

    // テスト表示/非表示
    const btnShow = $('btn-test-show');
    const btnHide = $('btn-test-hide');
    if (btnShow) {
      btnShow.addEventListener('click', () => {
        const frame = $('preview-frame');
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ action: 'show' }, '*');
        }
      });
    }
    if (btnHide) {
      btnHide.addEventListener('click', () => {
        const frame = $('preview-frame');
        if (frame && frame.contentWindow) {
          frame.contentWindow.postMessage({ action: 'hide' }, '*');
        }
      });
    }

    // プリセット
    $$('.preset-slot').forEach(slot => {
      const n = slot.dataset.slot;
      slot.querySelector('[data-action="save"]').addEventListener('click', () => {
        savePreset(n);
        slot.querySelector('[data-action="save"]').textContent = '保存済!';
        setTimeout(() => { slot.querySelector('[data-action="save"]').textContent = '保存' + n; }, 1500);
      });
      slot.querySelector('[data-action="load"]').addEventListener('click', () => {
        loadPreset(n);
      });
      slot.querySelector('[data-action="delete"]').addEventListener('click', () => {
        deletePreset(n);
        slot.querySelector('[data-action="delete"]').textContent = '削除済!';
        setTimeout(() => { slot.querySelector('[data-action="delete"]').textContent = '削除' + n; }, 1500);
      });
    });

    // エクスポート
    $('btn-export').addEventListener('click', exportState);

    // インポート
    $('btn-import').addEventListener('click', () => $('file-import').click());
    $('file-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      importState(file);
      e.target.value = '';
    });

    // 初期描画
    fullUIRefresh();
  }

  // ── DOMContentLoaded ──
  document.addEventListener('DOMContentLoaded', init);
})();
