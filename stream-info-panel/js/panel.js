/*  Stream Info Panel - Widget Renderer
    OBSブラウザソースで配信情報ウィジェットを表示 */

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);

  // ── 設定読み取り ──
  let widgets;
  try {
    widgets = JSON.parse(decodeURIComponent(params.get('widgets') || '[]'));
  } catch {
    widgets = [];
  }

  const globalCfg = {
    theme: params.get('theme') || 'neon',
    font: decodeURIComponent(params.get('font') || 'Noto Sans JP'),
  };

  // ── テーマカラー ──
  const THEMES = {
    neon: { bg: 'rgba(10,10,50,0.85)', text: '#ffffff', accent: '#00aaff', bar: '#00aaff', border: 'rgba(0,170,255,0.3)' },
    gaming: { bg: 'rgba(20,0,40,0.85)', text: '#ffffff', accent: '#ff6ec7', bar: '#ff6ec7', border: 'rgba(255,110,199,0.3)' },
    minimal: { bg: 'rgba(30,30,30,0.8)', text: '#ffffff', accent: '#ffffff', bar: '#ffffff', border: 'rgba(255,255,255,0.1)' },
    pastel: { bg: 'rgba(255,240,245,0.9)', text: '#4a2040', accent: '#9c27b0', bar: '#ce93d8', border: 'rgba(206,147,216,0.3)' },
    retro: { bg: 'rgba(0,20,0,0.9)', text: '#00ff41', accent: '#00ff41', bar: '#00ff41', border: 'rgba(0,255,65,0.2)' },
  };

  const theme = THEMES[globalCfg.theme] || THEMES.neon;
  const $container = document.getElementById('panel-container');
  document.body.style.fontFamily = `"${globalCfg.font}", sans-serif`;

  // ── ウィジェット生成 ──
  widgets.forEach((w, i) => {
    const el = document.createElement('div');
    el.className = `widget widget-${w.type}`;
    el.style.left = (w.x || 0) + 'px';
    el.style.top = (w.y || 0) + 'px';
    if (w.width) el.style.width = w.width + 'px';
    el.style.background = w.bg || theme.bg;
    el.style.color = w.textColor || theme.text;
    el.style.fontFamily = w.font ? `"${w.font}", sans-serif` : 'inherit';
    if (w.border !== false) el.style.border = `1px solid ${theme.border}`;
    if (w.anim) el.classList.add('anim-' + w.anim);
    el.style.animationDelay = (i * 0.15) + 's';

    switch (w.type) {
      case 'goal':
        renderGoal(el, w);
        break;
      case 'clock':
        renderClock(el, w);
        break;
      case 'text':
        renderText(el, w);
        break;
      case 'ticker':
        renderTicker(el, w);
        break;
      case 'event':
        renderEvent(el, w);
        break;
      case 'social':
        renderSocial(el, w);
        break;
      case 'counter':
        renderCounter(el, w);
        break;
    }

    $container.appendChild(el);
  });

  // ── 目標バー ──
  function renderGoal(el, w) {
    const current = w.current || 0;
    const target = w.target || 100;
    const pct = Math.min(100, Math.round((current / target) * 100));

    el.innerHTML = `
      <div class="goal-label" style="color:${theme.accent}">${esc(w.label || 'フォロワー目標')}</div>
      <div class="goal-value" style="color:${theme.accent}">${current} / ${target}</div>
      <div class="goal-bar-wrap">
        <div class="goal-bar-bg"></div>
        <div class="goal-bar-fill" style="width:${pct}%;background:${w.barColor || theme.bar}"></div>
      </div>
      <div class="goal-numbers">
        <span>${pct}%</span>
        <span>あと${target - current}</span>
      </div>`;
  }

  // ── 配信時間 ──
  function renderClock(el, w) {
    const label = w.label || '配信時間';
    el.innerHTML = `
      <div class="clock-label">${esc(label)}</div>
      <div class="clock-time" id="clock-${Date.now()}">00:00:00</div>`;

    const $time = el.querySelector('.clock-time');
    const startTime = Date.now();
    const offsetSec = (w.offsetMin || 0) * 60;

    function update() {
      const elapsed = Math.floor((Date.now() - startTime) / 1000) + offsetSec;
      const h = Math.floor(elapsed / 3600);
      const m = Math.floor((elapsed % 3600) / 60);
      const s = elapsed % 60;
      $time.textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    setInterval(update, 1000);
    update();
  }

  // ── テキスト ──
  function renderText(el, w) {
    const size = w.fontSize || 16;
    el.innerHTML = `<div class="text-content" style="font-size:${size}px;font-weight:${w.bold ? '700' : '400'}">${esc(w.text || 'テキスト')}</div>`;
  }

  // ── ティッカー ──
  function renderTicker(el, w) {
    const speed = w.speed || 15;
    const size = w.fontSize || 16;
    el.innerHTML = `<div class="ticker-inner" style="font-size:${size}px;animation-duration:${speed}s">${esc(w.text || 'スクロールテキスト')}</div>`;
  }

  // ── 最新イベント ──
  function renderEvent(el, w) {
    el.innerHTML = `
      <div class="event-label">${esc(w.label || 'LATEST')}</div>
      <div class="event-name" style="color:${theme.accent}">${esc(w.name || 'ユーザー名')}</div>
      <div class="event-detail">${esc(w.detail || 'フォローありがとう！')}</div>`;
  }

  // ── SNS ──
  function renderSocial(el, w) {
    el.style.flexDirection = 'row';
    el.innerHTML = `
      <div class="social-icon">${w.icon || '🐦'}</div>
      <div class="social-text">${esc(w.text || '@username')}</div>`;
  }

  // ── カウンター ──
  function renderCounter(el, w) {
    const value = w.value || 0;
    el.innerHTML = `
      <div class="counter-label">${esc(w.label || 'デスカウント')}</div>
      <div class="counter-value" style="color:${theme.accent}">${value}</div>`;

    // カウンター操作API
    const $val = el.querySelector('.counter-value');
    let count = value;

    window.addEventListener('message', (e) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data.type === 'counter-update' && data.id === w.id) {
          if (data.action === 'increment') count++;
          if (data.action === 'decrement') count = Math.max(0, count - 1);
          if (data.action === 'set') count = parseInt(data.value) || 0;
          if (data.action === 'reset') count = 0;
          $val.textContent = count;
        }
      } catch {}
    });
  }

  // ── ユーティリティ ──
  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function pad(n) { return String(n).padStart(2, '0'); }

  // ── 外部API ──
  window.StreamInfoPanel = {
    updateCounter: (id, action, value) => {
      window.postMessage(JSON.stringify({ type: 'counter-update', id, action, value }), '*');
    },
  };

  // デモ: ウィジェットが0個ならサンプル表示
  if (widgets.length === 0) {
    renderDemo();
  }

  function renderDemo() {
    // デモ用ウィジェット
    const demoWidgets = [
      { type: 'clock', x: 20, y: 20, width: 200, label: '配信時間', anim: 'fade' },
      { type: 'goal', x: 20, y: 110, width: 300, label: 'フォロワー目標', current: 847, target: 1000, anim: 'slide-left' },
      { type: 'event', x: 20, y: 260, width: 250, label: 'LATEST FOLLOW', name: 'さくらちゃん', detail: 'フォローありがとう！', anim: 'slide-left' },
      { type: 'social', x: 20, y: 370, width: 200, icon: '🐦', text: '@your_channel', anim: 'fade' },
      { type: 'counter', x: 250, y: 20, width: 120, label: 'デスカウント', value: 42, id: 'deaths', anim: 'slide-right' },
      { type: 'text', x: 20, y: 430, width: 350, text: '次回配信: 毎週金曜 21:00〜', fontSize: 14, anim: 'fade' },
    ];

    demoWidgets.forEach((w, i) => {
      const el = document.createElement('div');
      el.className = `widget widget-${w.type}`;
      el.style.left = w.x + 'px';
      el.style.top = w.y + 'px';
      if (w.width) el.style.width = w.width + 'px';
      el.style.background = theme.bg;
      el.style.color = theme.text;
      el.style.border = `1px solid ${theme.border}`;
      if (w.anim) el.classList.add('anim-' + w.anim);
      el.style.animationDelay = (i * 0.15) + 's';

      switch (w.type) {
        case 'goal': renderGoal(el, w); break;
        case 'clock': renderClock(el, w); break;
        case 'text': renderText(el, w); break;
        case 'event': renderEvent(el, w); break;
        case 'social': renderSocial(el, w); break;
        case 'counter': renderCounter(el, w); break;
      }

      $container.appendChild(el);
    });
  }
})();
