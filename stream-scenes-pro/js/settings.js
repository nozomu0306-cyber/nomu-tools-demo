/*  Stream Scenes Pro - Settings Controller */

(function () {
  'use strict';

  // ── 状態 ──
  let state = loadState();

  function defaultState() {
    return {
      scene: 'waiting', theme: 'neon',
      mainText: '配信準備中', labelTop: 'PLEASE WAIT', labelBot: 'まもなく始まります',
      font: 'Noto Sans JP', fontSize: 64, labelSize: 24,
      textColor: '#ffffff', labelColor: '#cccccc',
      textAnim: 'fade-in-up',
      glow: true, glowColor: '#00aaff', glowSize: 20,
      gradient: false, gradColor1: '#ff6ec7', gradColor2: '#7873f5',
      outline: false, outlineColor: '#000000', outlineW: 2,
      shadow: false,
      bgStyle: 'animated', bgColor1: '#0a0a2e', bgColor2: '#1a1a4e', bgSpeed: 1,
      particles: true, particleType: 'circle', particleColor: '#00aaff', particleN: 30,
      border: false, borderColor: '#ffffff', borderW: 2, borderR: 0, borderGlow: false,
      countdown: false, cdMin: 5, cdSec: 0, cdFmt: 'mm:ss', cdSize: 48, cdColor: '#ffffff',
      progress: false, progressColor: '#00aaff', progressH: 4,
    };
  }

  function loadState() {
    try {
      const s = localStorage.getItem('ssp-state');
      return s ? { ...defaultState(), ...JSON.parse(s) } : defaultState();
    } catch { return defaultState(); }
  }

  function saveState() {
    localStorage.setItem('ssp-state', JSON.stringify(state));
  }

  // ── シーンごとのデフォルトテキスト ──
  const SCENE_TEXTS = {
    waiting:  { mainText: '配信準備中',             labelTop: 'PLEASE WAIT',    labelBot: 'まもなく始まります' },
    starting: { mainText: 'STARTING SOON',          labelTop: '',               labelBot: 'もう少々お待ちください' },
    brb:      { mainText: '少々お待ちください',       labelTop: 'BE RIGHT BACK', labelBot: '' },
    ending:   { mainText: 'ご視聴ありがとうございました', labelTop: 'STREAM ENDED', labelBot: '' },
  };

  // ── テーマ定義 ──
  const THEMES = {
    neon: {
      textColor: '#ffffff', labelColor: '#88ccff',
      glow: true, glowColor: '#00aaff', glowSize: 25, gradient: false,
      bgColor1: '#0a0a2e', bgColor2: '#1a0a3e', bgStyle: 'animated',
      particles: true, particleColor: '#00aaff',
      progressColor: '#00aaff',
    },
    gaming: {
      textColor: '#ffffff', labelColor: '#ff6ec7',
      glow: true, glowColor: '#ff6ec7', glowSize: 20,
      gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5',
      bgColor1: '#0d0d0d', bgColor2: '#1a0a2e', bgStyle: 'animated',
      particles: true, particleColor: '#ff6ec7',
      progressColor: '#ff6ec7',
    },
    minimal: {
      textColor: '#ffffff', labelColor: '#888888',
      glow: false, gradient: false, particles: false,
      bgColor1: '#1a1a1a', bgColor2: '#2a2a2a', bgStyle: 'gradient',
      progressColor: '#ffffff',
    },
    pastel: {
      textColor: '#5d4037', labelColor: '#8d6e63',
      glow: false, gradient: false,
      bgColor1: '#fce4ec', bgColor2: '#e1bee7', bgStyle: 'gradient',
      particles: true, particleColor: '#ce93d8',
      progressColor: '#ce93d8',
    },
    retro: {
      textColor: '#00ff41', labelColor: '#00cc33',
      glow: true, glowColor: '#00ff41', glowSize: 15, gradient: false,
      bgColor1: '#001100', bgColor2: '#002200', bgStyle: 'gradient',
      particles: true, particleColor: '#00ff41', font: 'DotGothic16',
      progressColor: '#00ff41',
    },
  };

  // ── DOM取得ヘルパー ──
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // ── UI ↔ State 同期 ──
  const FIELD_MAP = {
    'opt-mainText': { key: 'mainText', type: 'text' },
    'opt-labelTop': { key: 'labelTop', type: 'text' },
    'opt-labelBot': { key: 'labelBot', type: 'text' },
    'opt-font': { key: 'font', type: 'select' },
    'opt-fontSize': { key: 'fontSize', type: 'range', valEl: 'val-fontSize', unit: 'px' },
    'opt-labelSize': { key: 'labelSize', type: 'range', valEl: 'val-labelSize', unit: 'px' },
    'opt-textColor': { key: 'textColor', type: 'color' },
    'opt-labelColor': { key: 'labelColor', type: 'color' },
    'opt-textAnim': { key: 'textAnim', type: 'select' },
    'opt-glow': { key: 'glow', type: 'checkbox', sub: 'glow-opts' },
    'opt-glowColor': { key: 'glowColor', type: 'color' },
    'opt-glowSize': { key: 'glowSize', type: 'range', valEl: 'val-glowSize', unit: 'px' },
    'opt-gradient': { key: 'gradient', type: 'checkbox', sub: 'gradient-opts' },
    'opt-gradColor1': { key: 'gradColor1', type: 'color' },
    'opt-gradColor2': { key: 'gradColor2', type: 'color' },
    'opt-outline': { key: 'outline', type: 'checkbox', sub: 'outline-opts' },
    'opt-outlineColor': { key: 'outlineColor', type: 'color' },
    'opt-outlineW': { key: 'outlineW', type: 'range', valEl: 'val-outlineW', unit: 'px' },
    'opt-shadow': { key: 'shadow', type: 'checkbox' },
    'opt-bgStyle': { key: 'bgStyle', type: 'select' },
    'opt-bgColor1': { key: 'bgColor1', type: 'color' },
    'opt-bgColor2': { key: 'bgColor2', type: 'color' },
    'opt-bgSpeed': { key: 'bgSpeed', type: 'range', valEl: 'val-bgSpeed', unit: 'x', float: true },
    'opt-particles': { key: 'particles', type: 'checkbox', sub: 'particle-opts' },
    'opt-particleType': { key: 'particleType', type: 'select' },
    'opt-particleColor': { key: 'particleColor', type: 'color' },
    'opt-particleN': { key: 'particleN', type: 'range', valEl: 'val-particleN', unit: '' },
    'opt-border': { key: 'border', type: 'checkbox', sub: 'border-opts' },
    'opt-borderColor': { key: 'borderColor', type: 'color' },
    'opt-borderW': { key: 'borderW', type: 'range', valEl: 'val-borderW', unit: 'px' },
    'opt-borderR': { key: 'borderR', type: 'range', valEl: 'val-borderR', unit: 'px' },
    'opt-borderGlow': { key: 'borderGlow', type: 'checkbox' },
    'opt-countdown': { key: 'countdown', type: 'checkbox', sub: 'countdown-opts' },
    'opt-cdMin': { key: 'cdMin', type: 'number' },
    'opt-cdSec': { key: 'cdSec', type: 'number' },
    'opt-cdFmt': { key: 'cdFmt', type: 'select' },
    'opt-cdSize': { key: 'cdSize', type: 'range', valEl: 'val-cdSize', unit: 'px' },
    'opt-cdColor': { key: 'cdColor', type: 'color' },
    'opt-progress': { key: 'progress', type: 'checkbox', sub: 'progress-opts' },
    'opt-progressColor': { key: 'progressColor', type: 'color' },
    'opt-progressH': { key: 'progressH', type: 'range', valEl: 'val-progressH', unit: 'px' },
  };

  function stateToUI() {
    for (const [id, cfg] of Object.entries(FIELD_MAP)) {
      const el = $(id);
      if (!el) continue;
      const val = state[cfg.key];

      if (cfg.type === 'checkbox') {
        el.checked = !!val;
        if (cfg.sub) {
          const sub = $(cfg.sub);
          if (sub) sub.style.display = val ? 'block' : 'none';
        }
      } else if (cfg.type === 'range' || cfg.type === 'number') {
        el.value = val;
        if (cfg.valEl) {
          const ve = $(cfg.valEl);
          if (ve) ve.textContent = (cfg.float ? parseFloat(val).toFixed(1) : val) + cfg.unit;
        }
      } else {
        el.value = val;
      }
    }

    // シーンボタン
    $$('.scene-btn').forEach(b => b.classList.toggle('active', b.dataset.scene === state.scene));
    // テーマボタン
    $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
  }

  function uiToState() {
    for (const [id, cfg] of Object.entries(FIELD_MAP)) {
      const el = $(id);
      if (!el) continue;
      if (cfg.type === 'checkbox') {
        state[cfg.key] = el.checked;
      } else if (cfg.type === 'range') {
        state[cfg.key] = cfg.float ? parseFloat(el.value) : parseInt(el.value, 10);
      } else if (cfg.type === 'number') {
        state[cfg.key] = parseInt(el.value, 10) || 0;
      } else {
        state[cfg.key] = el.value;
      }
    }
  }

  // ── URL生成 ──
  function buildURL() {
    const base = new URL('index.html', location.href).href;
    const p = new URLSearchParams();

    p.set('scene', state.scene);
    p.set('theme', 'custom'); // 常にカスタムとしてURL生成
    p.set('text', state.mainText);
    if (state.labelTop) p.set('labelTop', state.labelTop);
    if (state.labelBot) p.set('labelBot', state.labelBot);
    p.set('font', state.font);
    p.set('fontSize', state.fontSize);
    p.set('labelSize', state.labelSize);
    p.set('textColor', state.textColor);
    p.set('labelColor', state.labelColor);
    p.set('textAnim', state.textAnim);

    // エフェクト
    if (state.glow) {
      p.set('glow', 'true');
      p.set('glowColor', state.glowColor);
      p.set('glowSize', state.glowSize);
    }
    if (state.gradient) {
      p.set('gradient', 'true');
      p.set('gradColor1', state.gradColor1);
      p.set('gradColor2', state.gradColor2);
    }
    if (state.outline) {
      p.set('outline', 'true');
      p.set('outlineColor', state.outlineColor);
      p.set('outlineW', state.outlineW);
    }
    if (state.shadow) p.set('shadow', 'true');

    // 背景
    p.set('bgStyle', state.bgStyle);
    if (state.bgStyle !== 'transparent') {
      p.set('bgColor1', state.bgColor1);
      p.set('bgColor2', state.bgColor2);
    }
    if (state.bgStyle === 'animated') p.set('bgSpeed', state.bgSpeed);

    // パーティクル
    if (state.particles) {
      p.set('particles', 'true');
      p.set('particleColor', state.particleColor);
      p.set('particleN', state.particleN);
      p.set('particleType', state.particleType);
    } else {
      p.set('particles', 'false');
    }

    // 枠線
    if (state.border) {
      p.set('border', 'true');
      p.set('borderColor', state.borderColor);
      p.set('borderW', state.borderW);
      p.set('borderR', state.borderR);
      if (state.borderGlow) p.set('borderGlow', 'true');
    }

    // カウントダウン
    if (state.countdown) {
      p.set('countdown', 'true');
      p.set('cdMin', state.cdMin);
      p.set('cdSec', state.cdSec);
      p.set('cdFmt', state.cdFmt);
      p.set('cdSize', state.cdSize);
      if (state.cdColor) p.set('cdColor', state.cdColor);
    }

    // プログレスバー
    if (state.progress) {
      p.set('progress', 'true');
      p.set('progressColor', state.progressColor);
      p.set('progressH', state.progressH);
    }

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
    stateToUI(); // sub-fields の表示切替
    saveState();
    updatePreview();
  }

  // ── イベントリスナー設定 ──
  function initEvents() {
    // 全フィールドにchangeイベント
    for (const id of Object.keys(FIELD_MAP)) {
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

    // シーンボタン
    $$('.scene-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.scene = btn.dataset.scene;
        const txt = SCENE_TEXTS[state.scene];
        if (txt) {
          state.mainText = txt.mainText;
          state.labelTop = txt.labelTop;
          state.labelBot = txt.labelBot;
        }
        stateToUI();
        saveState();
        updatePreview();
      });
    });

    // テーマボタン
    $$('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        const t = THEMES[state.theme];
        if (t) {
          Object.assign(state, t);
        }
        stateToUI();
        saveState();
        updatePreview();
      });
    });

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

    // プリセット
    $$('.preset-slot').forEach(slot => {
      const n = slot.dataset.slot;
      slot.querySelector('[data-action="save"]').addEventListener('click', () => {
        localStorage.setItem('ssp-preset-' + n, JSON.stringify(state));
        slot.querySelector('[data-action="save"]').textContent = '保存済!';
        setTimeout(() => { slot.querySelector('[data-action="save"]').textContent = '保存' + n; }, 1500);
      });
      slot.querySelector('[data-action="load"]').addEventListener('click', () => {
        const data = localStorage.getItem('ssp-preset-' + n);
        if (data) {
          state = { ...defaultState(), ...JSON.parse(data) };
          stateToUI();
          saveState();
          updatePreview();
        }
      });
    });

    // エクスポート
    $('btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'stream-scenes-pro-settings.json';
      a.click();
    });

    // インポート
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
        } catch (err) {
          alert('設定ファイルの読み込みに失敗しました');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  // ── 初期化 ──
  stateToUI();
  initEvents();
  updatePreview();
})();
