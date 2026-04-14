/*  Chat Style Pro - Settings Controller */

(function () {
  'use strict';

  let state = loadState();

  function defaultState() {
    return {
      theme: 'neon', anim: 'default',
      font: 'Noto Sans JP', fontSize: 14, nameSize: 13,
      max: 15, fade: 0, gap: 6, radius: 8,
      avatar: true, name: true, demoSpeed: 3000,
      nameColorOn: false, nameColor: '#00ccff',
      textColorOn: false, textColor: '#ffffff',
      bgColorOn: false, bgColor: '#1a1a2e', bgOpacity: 0.85,
    };
  }

  function loadState() {
    try {
      const s = localStorage.getItem('csp-state');
      return s ? { ...defaultState(), ...JSON.parse(s) } : defaultState();
    } catch { return defaultState(); }
  }

  function saveState() {
    localStorage.setItem('csp-state', JSON.stringify(state));
  }

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  function stateToUI() {
    // テーマ
    $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
    // セレクト
    $('opt-anim').value = state.anim;
    $('opt-font').value = state.font;
    // レンジ
    setRange('opt-fontSize', state.fontSize, 'val-fontSize', 'px');
    setRange('opt-nameSize', state.nameSize, 'val-nameSize', 'px');
    setRange('opt-max', state.max, 'val-max', '');
    setRange('opt-fade', state.fade, 'val-fade', '');
    setRange('opt-gap', state.gap, 'val-gap', 'px');
    setRange('opt-radius', state.radius, 'val-radius', 'px');
    setRange('opt-demoSpeed', state.demoSpeed, 'val-demoSpeed', 'ms');
    setRange('opt-bgOpacity', state.bgOpacity, 'val-bgOpacity', '');
    // チェックボックス
    $('opt-avatar').checked = state.avatar;
    $('opt-name').checked = state.name;
    $('opt-nameColorOn').checked = state.nameColorOn;
    $('opt-textColorOn').checked = state.textColorOn;
    $('opt-bgColorOn').checked = state.bgColorOn;
    // カラー
    $('opt-nameColor').value = state.nameColor;
    $('opt-textColor').value = state.textColor;
    $('opt-bgColor').value = state.bgColor;
  }

  function setRange(id, val, valId, unit) {
    $(id).value = val;
    const ve = $(valId);
    if (ve) ve.textContent = val + unit;
  }

  function uiToState() {
    state.anim = $('opt-anim').value;
    state.font = $('opt-font').value;
    state.fontSize = parseInt($('opt-fontSize').value);
    state.nameSize = parseInt($('opt-nameSize').value);
    state.max = parseInt($('opt-max').value);
    state.fade = parseInt($('opt-fade').value);
    state.gap = parseInt($('opt-gap').value);
    state.radius = parseInt($('opt-radius').value);
    state.avatar = $('opt-avatar').checked;
    state.name = $('opt-name').checked;
    state.demoSpeed = parseInt($('opt-demoSpeed').value);
    state.nameColorOn = $('opt-nameColorOn').checked;
    state.nameColor = $('opt-nameColor').value;
    state.textColorOn = $('opt-textColorOn').checked;
    state.textColor = $('opt-textColor').value;
    state.bgColorOn = $('opt-bgColorOn').checked;
    state.bgColor = $('opt-bgColor').value;
    state.bgOpacity = parseFloat($('opt-bgOpacity').value);
  }

  function buildURL() {
    const base = new URL('index.html', location.href).href;
    const p = new URLSearchParams();
    p.set('theme', state.theme);
    p.set('anim', state.anim);
    p.set('font', state.font);
    p.set('fontSize', state.fontSize);
    p.set('nameSize', state.nameSize);
    p.set('max', state.max);
    if (state.fade > 0) p.set('fade', state.fade);
    p.set('gap', state.gap);
    p.set('radius', state.radius);
    if (!state.avatar) p.set('avatar', 'false');
    if (!state.name) p.set('name', 'false');
    if (state.nameColorOn) p.set('nameColor', state.nameColor);
    if (state.textColorOn) p.set('textColor', state.textColor);
    if (state.bgColorOn) {
      p.set('bgColor', state.bgColor);
      p.set('bgOpacity', state.bgOpacity);
    }
    p.set('source', 'demo');
    p.set('demoSpeed', state.demoSpeed);
    return base + '?' + p.toString();
  }

  let previewTimer;
  function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const url = buildURL();
      $('obs-url').value = url.replace('&source=demo&demoSpeed=' + state.demoSpeed, '');
      $('preview-frame').src = url;
    }, 300);
  }

  function onChange() {
    uiToState();
    stateToUI();
    saveState();
    updatePreview();
  }

  function initEvents() {
    // 全input/select
    $$('input, select').forEach(el => {
      el.addEventListener('input', onChange);
      el.addEventListener('change', onChange);
    });

    // タブ
    $$('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.tab').forEach(t => t.classList.remove('active'));
        $$('.tab-content').forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        $('tab-' + tab.dataset.tab).classList.add('active');
      });
    });

    // テーマ
    $$('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        stateToUI();
        saveState();
        updatePreview();
      });
    });

    // URLコピー
    $('btn-copy-url').addEventListener('click', () => {
      const url = $('obs-url').value;
      navigator.clipboard.writeText(url).then(() => {
        $('copy-msg').textContent = 'URLをコピーしました！';
        setTimeout(() => { $('copy-msg').textContent = ''; }, 3000);
      });
    });

    // プリセット
    $$('.preset-slot').forEach(slot => {
      const n = slot.dataset.slot;
      slot.querySelector('[data-action="save"]').addEventListener('click', () => {
        localStorage.setItem('csp-preset-' + n, JSON.stringify(state));
        slot.querySelector('[data-action="save"]').textContent = '保存済!';
        setTimeout(() => { slot.querySelector('[data-action="save"]').textContent = '保存' + n; }, 1500);
      });
      slot.querySelector('[data-action="load"]').addEventListener('click', () => {
        const data = localStorage.getItem('csp-preset-' + n);
        if (data) {
          state = { ...defaultState(), ...JSON.parse(data) };
          stateToUI();
          saveState();
          updatePreview();
        }
      });
    });

    // エクスポート/インポート
    $('btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'chat-style-pro-settings.json';
      a.click();
    });
    $('btn-import').addEventListener('click', () => $('file-import').click());
    $('file-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          state = { ...defaultState(), ...JSON.parse(reader.result) };
          stateToUI();
          saveState();
          updatePreview();
        } catch { alert('読み込みに失敗しました'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  stateToUI();
  initEvents();
  updatePreview();
})();
