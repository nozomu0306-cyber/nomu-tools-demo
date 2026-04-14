/*  Stream Scenes Pro - Scene Renderer
    OBS browser source で表示するシーン本体 */

(function () {
  'use strict';

  // ── URLパラメータから設定を読み取り ──
  const params = new URLSearchParams(location.search);
  const cfg = {
    // シーン種類: waiting / starting / brb / ending
    scene:        params.get('scene')       || 'waiting',
    // テーマ: neon / gaming / minimal / pastel / retro / custom
    theme:        params.get('theme')       || 'neon',
    // テキスト
    mainText:     decodeURIComponent(params.get('text')      || '配信準備中'),
    labelTop:     decodeURIComponent(params.get('labelTop')  || ''),
    labelBottom:  decodeURIComponent(params.get('labelBot')  || ''),
    // フォント
    font:         decodeURIComponent(params.get('font')      || 'Noto Sans JP'),
    fontSize:     parseInt(params.get('fontSize') || '64', 10),
    labelSize:    parseInt(params.get('labelSize') || '24', 10),
    // カラー
    textColor:    params.get('textColor')    || '#ffffff',
    labelColor:   params.get('labelColor')   || '#cccccc',
    bgColor1:     params.get('bgColor1')     || '#0a0a2e',
    bgColor2:     params.get('bgColor2')     || '#1a1a4e',
    // エフェクト
    glow:         params.get('glow')         === 'true',
    glowColor:    params.get('glowColor')    || '#00aaff',
    glowSize:     parseInt(params.get('glowSize') || '20', 10),
    outline:      params.get('outline')      === 'true',
    outlineColor: params.get('outlineColor') || '#000000',
    outlineWidth: parseInt(params.get('outlineW') || '2', 10),
    gradient:     params.get('gradient')     === 'true',
    gradColor1:   params.get('gradColor1')   || '#ff6ec7',
    gradColor2:   params.get('gradColor2')   || '#7873f5',
    shadow:       params.get('shadow')       === 'true',
    shadowColor:  params.get('shadowColor')  || 'rgba(0,0,0,0.5)',
    // アニメーション
    textAnim:     params.get('textAnim')     || 'fade-in-up',  // fade-in-up / fade-in-down / pulse / glow / float / shimmer / none
    // パーティクル
    particles:    params.get('particles')    !== 'false',
    particleColor:params.get('particleColor')|| '#ffffff',
    particleCount:parseInt(params.get('particleN') || '30', 10),
    particleType: params.get('particleType') || 'circle', // circle / star / snow / bubble
    // 背景
    bgStyle:      params.get('bgStyle')      || 'gradient', // gradient / solid / animated / transparent
    bgAnimSpeed:  parseFloat(params.get('bgSpeed') || '1'),
    // プログレスバー
    progressBar:  params.get('progress')     === 'true',
    progressColor:params.get('progressColor')|| '#00aaff',
    progressH:    parseInt(params.get('progressH') || '4', 10),
    // カウントダウン
    countdown:    params.get('countdown')    === 'true',
    countdownMin: parseInt(params.get('cdMin') || '5', 10),
    countdownSec: parseInt(params.get('cdSec') || '0', 10),
    countdownFmt: params.get('cdFmt')        || 'mm:ss', // mm:ss / hh:mm:ss / ss
    countdownFont:decodeURIComponent(params.get('cdFont') || ''),
    countdownSize:parseInt(params.get('cdSize') || '48', 10),
    countdownColor:params.get('cdColor')     || '',
    // 枠線
    border:       params.get('border')       === 'true',
    borderColor:  params.get('borderColor')  || '#ffffff',
    borderWidth:  parseInt(params.get('borderW') || '2', 10),
    borderRadius: parseInt(params.get('borderR') || '0', 10),
    borderGlow:   params.get('borderGlow')   === 'true',
  };

  // ── テーマプリセット ──
  const THEMES = {
    neon: {
      bgColor1: '#0a0a2e', bgColor2: '#1a0a3e', textColor: '#ffffff',
      labelColor: '#88ccff', glow: true, glowColor: '#00aaff', glowSize: 25,
      particleColor: '#00aaff', bgStyle: 'animated', particles: true,
      gradient: false, progressColor: '#00aaff',
    },
    gaming: {
      bgColor1: '#0d0d0d', bgColor2: '#1a0a2e', textColor: '#ffffff',
      labelColor: '#ff6ec7', glow: true, glowColor: '#ff6ec7', glowSize: 20,
      gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5',
      particleColor: '#ff6ec7', bgStyle: 'animated', particles: true,
      progressColor: '#ff6ec7',
    },
    minimal: {
      bgColor1: '#1a1a1a', bgColor2: '#2a2a2a', textColor: '#ffffff',
      labelColor: '#888888', glow: false, particles: false,
      bgStyle: 'gradient', gradient: false, progressColor: '#ffffff',
    },
    pastel: {
      bgColor1: '#fce4ec', bgColor2: '#e1bee7', textColor: '#5d4037',
      labelColor: '#8d6e63', glow: false, particles: true,
      particleColor: '#ce93d8', bgStyle: 'gradient', gradient: false,
      progressColor: '#ce93d8',
    },
    retro: {
      bgColor1: '#001100', bgColor2: '#002200', textColor: '#00ff41',
      labelColor: '#00cc33', glow: true, glowColor: '#00ff41', glowSize: 15,
      particles: true, particleColor: '#00ff41', bgStyle: 'gradient',
      gradient: false, font: 'DotGothic16', progressColor: '#00ff41',
    },
  };

  // テーマ適用（customでなければテーマの値で上書き）
  if (cfg.theme !== 'custom' && THEMES[cfg.theme]) {
    const t = THEMES[cfg.theme];
    for (const [k, v] of Object.entries(t)) {
      // URLで明示指定されてなければテーマ値を使う
      if (!params.has(mapKey(k))) {
        cfg[k] = v;
      }
    }
  }

  function mapKey(k) {
    const map = {
      bgColor1: 'bgColor1', bgColor2: 'bgColor2', textColor: 'textColor',
      labelColor: 'labelColor', glowColor: 'glowColor', glowSize: 'glowSize',
      particleColor: 'particleColor', bgStyle: 'bgStyle', gradColor1: 'gradColor1',
      gradColor2: 'gradColor2', progressColor: 'progressColor', font: 'font',
    };
    return map[k] || k;
  }

  // ── シーンごとのデフォルトテキスト ──
  const SCENE_DEFAULTS = {
    waiting:  { text: '配信準備中',       labelTop: 'PLEASE WAIT',    labelBot: 'まもなく始まります' },
    starting: { text: 'STARTING SOON',    labelTop: '',               labelBot: 'もう少々お待ちください' },
    brb:      { text: '少々お待ちください', labelTop: 'BE RIGHT BACK', labelBot: '' },
    ending:   { text: 'ご視聴ありがとうございました', labelTop: 'STREAM ENDED', labelBot: '' },
  };

  if (!params.has('text') && SCENE_DEFAULTS[cfg.scene]) {
    cfg.mainText = SCENE_DEFAULTS[cfg.scene].text;
  }
  if (!params.has('labelTop') && SCENE_DEFAULTS[cfg.scene]) {
    cfg.labelTop = SCENE_DEFAULTS[cfg.scene].labelTop;
  }
  if (!params.has('labelBot') && SCENE_DEFAULTS[cfg.scene]) {
    cfg.labelBottom = SCENE_DEFAULTS[cfg.scene].labelBot;
  }

  // ── DOM要素 ──
  const $mainText   = document.getElementById('main-text');
  const $labelTop   = document.getElementById('label-top');
  const $labelBot   = document.getElementById('label-bottom');
  const $countdown  = document.getElementById('countdown-timer');
  const $canvas     = document.getElementById('bg-canvas');
  const $particles  = document.getElementById('particles-container');
  const $progress   = document.getElementById('progress-bar');
  const $progressF  = document.getElementById('progress-fill');
  const $border     = document.getElementById('border-overlay');

  // ── テキスト設定 ──
  function applyText() {
    $mainText.textContent = cfg.mainText;
    $labelTop.textContent = cfg.labelTop;
    $labelBot.textContent = cfg.labelBottom;

    // フォント
    const fontFamily = `"${cfg.font}", sans-serif`;
    $mainText.style.fontFamily = fontFamily;
    $labelTop.style.fontFamily = fontFamily;
    $labelBot.style.fontFamily = fontFamily;

    // サイズ
    $mainText.style.fontSize = cfg.fontSize + 'px';
    $labelTop.style.fontSize = cfg.labelSize + 'px';
    $labelBot.style.fontSize = cfg.labelSize + 'px';

    // カラー
    $mainText.style.color = cfg.textColor;
    $labelTop.style.color = cfg.labelColor;
    $labelBot.style.color = cfg.labelColor;

    // エフェクト
    let textShadow = [];
    if (cfg.glow) {
      textShadow.push(`0 0 ${cfg.glowSize}px ${cfg.glowColor}`);
      textShadow.push(`0 0 ${cfg.glowSize * 2}px ${cfg.glowColor}40`);
    }
    if (cfg.shadow) {
      textShadow.push(`2px 2px 4px ${cfg.shadowColor}`);
    }
    if (cfg.outline) {
      const w = cfg.outlineWidth;
      const c = cfg.outlineColor;
      textShadow.push(`${w}px 0 0 ${c}`, `-${w}px 0 0 ${c}`, `0 ${w}px 0 ${c}`, `0 -${w}px 0 ${c}`);
    }
    $mainText.style.textShadow = textShadow.join(', ');

    // グラデーション文字
    if (cfg.gradient) {
      $mainText.style.background = `linear-gradient(90deg, ${cfg.gradColor1}, ${cfg.gradColor2})`;
      $mainText.style.webkitBackgroundClip = 'text';
      $mainText.style.webkitTextFillColor = 'transparent';
      $mainText.style.backgroundClip = 'text';
    }

    // アニメーション
    if (cfg.textAnim === 'shimmer' && cfg.gradient) {
      $mainText.style.backgroundSize = '200% auto';
      $mainText.style.animation = 'shimmer 3s linear infinite';
    } else if (cfg.textAnim !== 'none') {
      $mainText.classList.add('anim-' + cfg.textAnim);
    }

    // 上ラベルアニメーション
    if (cfg.labelTop) {
      $labelTop.style.animation = 'fadeInDown 0.8s ease-out forwards';
    }
    if (cfg.labelBottom) {
      $labelBot.style.animation = 'fadeInUp 1.2s ease-out forwards';
      $labelBot.style.animationDelay = '0.3s';
      $labelBot.style.opacity = '0';
    }

    // 非表示処理
    if (!cfg.labelTop) $labelTop.style.display = 'none';
    if (!cfg.labelBottom) $labelBot.style.display = 'none';
  }

  // ── 背景描画 ──
  function applyBackground() {
    if (cfg.bgStyle === 'transparent') {
      document.body.classList.add('bg-transparent');
      return;
    }

    const ctx = $canvas.getContext('2d');
    let w = $canvas.width = window.innerWidth;
    let h = $canvas.height = window.innerHeight;
    let time = 0;

    function drawGradient() {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, cfg.bgColor1);
      grad.addColorStop(1, cfg.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    }

    if (cfg.bgStyle === 'solid') {
      ctx.fillStyle = cfg.bgColor1;
      ctx.fillRect(0, 0, w, h);
      return;
    }

    if (cfg.bgStyle === 'gradient') {
      drawGradient();
      return;
    }

    // animated background
    function animate() {
      time += 0.005 * cfg.bgAnimSpeed;
      const grad = ctx.createLinearGradient(
        w * (0.5 + 0.5 * Math.sin(time)),
        0,
        w * (0.5 + 0.5 * Math.cos(time)),
        h
      );
      grad.addColorStop(0, cfg.bgColor1);
      grad.addColorStop(0.5, blendColors(cfg.bgColor1, cfg.bgColor2, 0.5 + 0.3 * Math.sin(time * 1.5)));
      grad.addColorStop(1, cfg.bgColor2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // subtle grid overlay for gaming/neon
      if (cfg.theme === 'neon' || cfg.theme === 'gaming') {
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x < w; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      requestAnimationFrame(animate);
    }
    animate();

    window.addEventListener('resize', () => {
      w = $canvas.width = window.innerWidth;
      h = $canvas.height = window.innerHeight;
    });
  }

  // ── パーティクル ──
  function applyParticles() {
    if (!cfg.particles) return;

    const particles = [];
    for (let i = 0; i < cfg.particleCount; i++) {
      particles.push(createParticle());
    }

    function createParticle() {
      const el = document.createElement('div');
      el.className = 'particle';
      const size = 2 + Math.random() * 6;
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = cfg.particleColor;
      el.style.opacity = (0.2 + Math.random() * 0.5).toString();

      if (cfg.particleType === 'star') {
        el.style.borderRadius = '0';
        el.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
        el.style.width = (size * 2) + 'px';
        el.style.height = (size * 2) + 'px';
      } else if (cfg.particleType === 'snow') {
        el.style.background = 'white';
        el.style.boxShadow = `0 0 ${size}px rgba(255,255,255,0.5)`;
      } else if (cfg.particleType === 'bubble') {
        el.style.background = 'transparent';
        el.style.border = `1px solid ${cfg.particleColor}`;
        el.style.width = (size * 3) + 'px';
        el.style.height = (size * 3) + 'px';
      }

      $particles.appendChild(el);

      return {
        el,
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: -0.2 - Math.random() * 0.8,
        size,
      };
    }

    function updateParticles() {
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (cfg.particleType === 'snow') {
          p.x += Math.sin(Date.now() * 0.001 + p.size) * 0.3;
          p.vy = Math.abs(p.vy); // snow falls down
        }

        if (p.y < -20) { p.y = window.innerHeight + 20; p.x = Math.random() * window.innerWidth; }
        if (p.y > window.innerHeight + 20) { p.y = -20; p.x = Math.random() * window.innerWidth; }
        if (p.x < -20) p.x = window.innerWidth + 20;
        if (p.x > window.innerWidth + 20) p.x = -20;

        p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
      });
      requestAnimationFrame(updateParticles);
    }
    updateParticles();
  }

  // ── カウントダウン ──
  function applyCountdown() {
    if (!cfg.countdown) {
      $countdown.style.display = 'none';
      return;
    }

    let totalSec = cfg.countdownMin * 60 + cfg.countdownSec;
    const startTotal = totalSec;

    $countdown.style.fontFamily = cfg.countdownFont
      ? `"${cfg.countdownFont}", monospace`
      : `"${cfg.font}", monospace`;
    $countdown.style.fontSize = cfg.countdownSize + 'px';
    $countdown.style.color = cfg.countdownColor || cfg.textColor;

    if (cfg.glow) {
      $countdown.style.textShadow = `0 0 ${cfg.glowSize}px ${cfg.glowColor}`;
    }

    function formatTime(sec) {
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      const s = sec % 60;
      if (cfg.countdownFmt === 'hh:mm:ss') {
        return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
      } else if (cfg.countdownFmt === 'ss') {
        return String(sec);
      }
      return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    }

    $countdown.textContent = formatTime(totalSec);

    const interval = setInterval(() => {
      totalSec--;
      if (totalSec <= 0) {
        totalSec = 0;
        clearInterval(interval);
        $countdown.style.animation = 'pulse 1s ease-in-out infinite';
      }
      $countdown.textContent = formatTime(totalSec);

      // プログレスバー連動
      if (cfg.progressBar && startTotal > 0) {
        const pct = ((startTotal - totalSec) / startTotal) * 100;
        $progressF.style.width = pct + '%';
      }
    }, 1000);
  }

  // ── プログレスバー ──
  function applyProgressBar() {
    if (!cfg.progressBar) return;
    $progress.style.display = 'block';
    $progress.style.height = cfg.progressH + 'px';
    $progressF.style.background = cfg.progressColor;
  }

  // ── 枠線 ──
  function applyBorder() {
    if (!cfg.border) return;
    $border.style.border = `${cfg.borderWidth}px solid ${cfg.borderColor}`;
    $border.style.borderRadius = cfg.borderRadius + 'px';
    $border.style.margin = '10px';
    $border.style.top = '0'; $border.style.left = '0';
    $border.style.width = 'calc(100% - 20px)';
    $border.style.height = 'calc(100% - 20px)';

    if (cfg.borderGlow) {
      $border.style.boxShadow = `0 0 15px ${cfg.borderColor}40, inset 0 0 15px ${cfg.borderColor}20`;
      $border.style.animation = 'border-glow 3s ease-in-out infinite';
    }
  }

  // ── ユーティリティ ──
  function blendColors(c1, c2, t) {
    const r1 = parseInt(c1.slice(1,3), 16), g1 = parseInt(c1.slice(3,5), 16), b1 = parseInt(c1.slice(5,7), 16);
    const r2 = parseInt(c2.slice(1,3), 16), g2 = parseInt(c2.slice(3,5), 16), b2 = parseInt(c2.slice(5,7), 16);
    const r = Math.round(r1 + (r2 - r1) * t), g = Math.round(g1 + (g2 - g1) * t), b = Math.round(b1 + (b2 - b1) * t);
    return `rgb(${r},${g},${b})`;
  }

  // ── 初期化 ──
  applyText();
  applyBackground();
  applyParticles();
  applyProgressBar();
  applyCountdown();
  applyBorder();
})();
