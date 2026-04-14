/**
 * 配信タイマー Pro - タイマーロジック
 * URLパラメータ or localStorage から設定を読み込み
 */
(function () {
  const display = document.getElementById('timer-display');
  const labelTop = document.getElementById('label-top');
  const labelBottom = document.getElementById('label-bottom');
  const progressContainer = document.getElementById('progress-bar-container');
  const progressBar = document.getElementById('progress-bar');
  const STORAGE_KEY = 'stream-timer-settings';

  const defaults = {
    mode: 'countdown',
    hours: 0,
    minutes: 5,
    seconds: 0,
    format: 'MM:SS',
    separator: ':',
    fontFamily: 'Noto Sans JP',
    fontSize: 72,
    color: '#ffffff',
    bgColor: '#000000',
    transparent: true,
    finishText: '',
    finishColor: '',
    finishSize: 0,
    finishEffect: 'blink',
    autoStart: true,
    // エフェクト
    glowEnabled: false,
    glowColor: '#00aaff',
    outlineEnabled: false,
    outlineColor: '#000000',
    outlineWidth: 2,
    gradientEnabled: false,
    gradColor1: '#ff6b6b',
    gradColor2: '#4ecdc4',
    shadowEnabled: false,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowX: 3,
    shadowY: 3,
    shadowBlur: 6,
    // ラベル
    labelTop: '',
    labelBottom: '',
    labelSize: 20,
    labelColor: '#ffffff',
    // プログレスバー
    progressEnabled: false,
    progressColor: '#00aaff',
    progressHeight: 4,
    progressPosition: 'bottom',
    progressGradient: false,
    progressGrad1: '#ff6b6b',
    progressGrad2: '#4ecdc4',
  };

  let settings = { ...defaults };
  let totalSeconds = 0;
  let elapsed = 0;
  let intervalId = null;
  let running = false;
  let finished = false;

  // URLパラメータから設定を読み込む
  function loadFromURL() {
    const params = new URLSearchParams(window.location.search);
    if (params.size === 0) return false;

    const mapping = {
      m: 'mode', h: 'hours', mi: 'minutes', s: 'seconds',
      fmt: 'format', sep: 'separator', ff: 'fontFamily',
      fs: 'fontSize', c: 'color', bg: 'bgColor',
      tr: 'transparent', ft: 'finishText', fc: 'finishColor',
      fz: 'finishSize', fe: 'finishEffect', as: 'autoStart',
      ge: 'glowEnabled', gc: 'glowColor',
      oe: 'outlineEnabled', oc: 'outlineColor', ow: 'outlineWidth',
      gre: 'gradientEnabled', gr1: 'gradColor1', gr2: 'gradColor2',
      se: 'shadowEnabled', sc: 'shadowColor',
      sx: 'shadowX', sy: 'shadowY', sb: 'shadowBlur',
      lt: 'labelTop', lb: 'labelBottom', ls: 'labelSize', lc: 'labelColor',
      pe: 'progressEnabled', pc: 'progressColor',
      ph: 'progressHeight', pp: 'progressPosition',
      pg: 'progressGradient', pg1: 'progressGrad1', pg2: 'progressGrad2',
    };

    const booleans = ['transparent','autoStart','glowEnabled','outlineEnabled',
      'gradientEnabled','shadowEnabled','progressEnabled','progressGradient'];
    const numbers = ['hours','minutes','seconds','fontSize','outlineWidth',
      'shadowX','shadowY','shadowBlur','labelSize','progressHeight','finishSize'];

    for (const [short, full] of Object.entries(mapping)) {
      if (params.has(short)) {
        let val = params.get(short);
        if (booleans.includes(full)) {
          val = val === '1' || val === 'true';
        } else if (numbers.includes(full)) {
          val = parseFloat(val) || 0;
        }
        settings[full] = val;
      }
    }
    return true;
  }

  // localStorageから設定を読み込む
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        settings = { ...defaults, ...JSON.parse(saved) };
        return true;
      }
    } catch (e) { /* ignore */ }
    return false;
  }

  // スタイルを適用
  function applyStyles() {
    const root = document.documentElement;
    root.style.setProperty('--timer-font', `'${settings.fontFamily}', sans-serif`);
    root.style.setProperty('--timer-size', `${settings.fontSize}px`);
    root.style.setProperty('--timer-color', settings.color);
    root.style.setProperty('--timer-bg', settings.bgColor);

    document.body.classList.toggle('has-bg', !settings.transparent);

    // エフェクト適用
    display.classList.toggle('fx-glow', settings.glowEnabled);
    display.classList.toggle('fx-outline', settings.outlineEnabled);
    display.classList.toggle('fx-gradient', settings.gradientEnabled);
    display.classList.toggle('fx-shadow', settings.shadowEnabled);

    if (settings.glowEnabled) {
      root.style.setProperty('--glow-color', settings.glowColor);
    }
    if (settings.outlineEnabled) {
      root.style.setProperty('--outline-color', settings.outlineColor);
      root.style.setProperty('--outline-width', `${settings.outlineWidth}px`);
    }
    if (settings.gradientEnabled) {
      root.style.setProperty('--grad-color1', settings.gradColor1);
      root.style.setProperty('--grad-color2', settings.gradColor2);
    }
    if (settings.shadowEnabled) {
      root.style.setProperty('--shadow-color', settings.shadowColor);
      root.style.setProperty('--shadow-x', `${settings.shadowX}px`);
      root.style.setProperty('--shadow-y', `${settings.shadowY}px`);
      root.style.setProperty('--shadow-blur', `${settings.shadowBlur}px`);
    }

    // ラベル
    labelTop.textContent = settings.labelTop;
    labelBottom.textContent = settings.labelBottom;
    root.style.setProperty('--label-size', `${settings.labelSize}px`);
    root.style.setProperty('--label-color', settings.labelColor);

    // プログレスバー
    if (settings.progressEnabled && settings.mode === 'countdown') {
      progressContainer.classList.add('active');
      progressContainer.classList.toggle('pos-top', settings.progressPosition === 'top');
      root.style.setProperty('--progress-height', `${settings.progressHeight}px`);
      root.style.setProperty('--progress-color', settings.progressColor);
      if (settings.progressGradient) {
        progressBar.classList.add('gradient');
        root.style.setProperty('--progress-grad1', settings.progressGrad1);
        root.style.setProperty('--progress-grad2', settings.progressGrad2);
      } else {
        progressBar.classList.remove('gradient');
      }
    } else {
      progressContainer.classList.remove('active');
    }
  }

  // 秒数をフォーマット
  function formatTime(sec) {
    const s = Math.max(0, sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const sep = settings.separator;
    const pad = (n) => String(n).padStart(2, '0');

    switch (settings.format) {
      case 'HH:MM:SS':
        return `${pad(h)}${sep}${pad(m)}${sep}${pad(ss)}`;
      case 'MM:SS':
        return `${pad(h * 60 + m)}${sep}${pad(ss)}`;
      case 'SS':
        return String(s);
      default:
        return `${pad(m)}${sep}${pad(ss)}`;
    }
  }

  // 表示を更新
  function updateDisplay(sec) {
    const text = formatTime(sec);
    if (display.textContent !== text) {
      display.textContent = text;
      display.classList.add('digit-change');
      setTimeout(() => display.classList.remove('digit-change'), 150);
    }
  }

  // プログレスバー更新
  function updateProgress() {
    if (!settings.progressEnabled || totalSeconds === 0) return;
    const pct = Math.max(0, (totalSeconds - elapsed) / totalSeconds * 100);
    progressBar.style.width = `${pct}%`;
  }

  // タイマー終了処理
  function onFinish() {
    finished = true;
    running = false;
    clearInterval(intervalId);
    intervalId = null;

    const effect = settings.finishEffect || 'blink';
    display.classList.add(`finish-${effect}`);

    const delay = effect === 'fade' ? 2000 : effect === 'bounce' ? 800 : 3000;

    setTimeout(() => {
      display.classList.remove(`finish-${effect}`);
      if (settings.finishText) {
        display.classList.add('finished');
        display.textContent = settings.finishText;
        if (settings.finishColor) {
          display.style.setProperty('color', settings.finishColor);
          display.style.setProperty('-webkit-text-fill-color', settings.finishColor);
        }
        if (settings.finishSize > 0) {
          display.style.fontSize = `${settings.finishSize}px`;
        }
      }
    }, delay);
  }

  function tickCountdown() {
    elapsed++;
    const remaining = totalSeconds - elapsed;
    updateProgress();
    if (remaining <= 0) {
      updateDisplay(0);
      progressBar.style.width = '0%';
      onFinish();
      return;
    }
    updateDisplay(remaining);
  }

  function tickCountup() {
    elapsed++;
    updateDisplay(elapsed);
  }

  function start() {
    if (running) return;
    running = true;
    finished = false;
    const tick = settings.mode === 'countdown' ? tickCountdown : tickCountup;
    intervalId = setInterval(tick, 1000);
  }

  // プレビューモード（設定画面のiframe用）
  function checkPreviewMode() {
    const params = new URLSearchParams(window.location.search);
    return params.has('preview');
  }

  function init() {
    // URLパラメータ優先、なければlocalStorage
    if (!loadFromURL()) {
      loadFromStorage();
    }
    applyStyles();

    totalSeconds = settings.hours * 3600 + settings.minutes * 60 + settings.seconds;
    elapsed = 0;

    if (settings.mode === 'countdown') {
      updateDisplay(totalSeconds);
      updateProgress();
    } else {
      updateDisplay(0);
    }

    if (!checkPreviewMode() && settings.autoStart) {
      start();
    }
  }

  // 設定変更の監視（localStorage経由 - 設定画面プレビュー用）
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      loadFromStorage();
      applyStyles();
      if (!running && !finished) {
        totalSeconds = settings.hours * 3600 + settings.minutes * 60 + settings.seconds;
        elapsed = 0;
        if (settings.mode === 'countdown') {
          updateDisplay(totalSeconds);
          updateProgress();
        } else {
          updateDisplay(0);
        }
      }
    }
  });

  init();
})();
