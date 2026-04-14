/* Stream Alert Pro - Alert Engine
   OBS browser source で表示するアラート本体 */

(function () {
  'use strict';

  // ── URLパラメータ読み取り ──
  const params = new URLSearchParams(location.search);
  const stage = document.getElementById('alert-stage');

  // ── テーマプリセット ──
  const THEMES = {
    neon: {
      textColor: '#ffffff', accentColor: '#00aaff', bgAccent: '#0a0a2e',
      glow: true, glowColor: '#00aaff', glowSize: 20,
      particleColors: ['#00aaff', '#00ddff', '#7873f5', '#ffffff'],
    },
    gaming: {
      textColor: '#ffffff', accentColor: '#ff6ec7', bgAccent: '#1a0a2e',
      glow: true, glowColor: '#ff6ec7', glowSize: 15,
      gradient: true, gradColor1: '#ff6ec7', gradColor2: '#7873f5',
      particleColors: ['#ff6ec7', '#7873f5', '#ffdd57', '#00ff88'],
    },
    minimal: {
      textColor: '#333333', accentColor: '#666666', bgAccent: '#ffffff',
      glow: false, gradient: false,
      particleColors: ['#cccccc', '#aaaaaa', '#999999'],
    },
    pastel: {
      textColor: '#5a4e7c', accentColor: '#f7b2d9', bgAccent: '#fef0f5',
      glow: true, glowColor: '#f7b2d9', glowSize: 10,
      particleColors: ['#f7b2d9', '#b2d9f7', '#d9f7b2', '#f7d9b2'],
    },
    retro: {
      textColor: '#33ff33', accentColor: '#33ff33', bgAccent: '#0a0a0a',
      glow: true, glowColor: '#33ff33', glowSize: 12,
      particleColors: ['#33ff33', '#ffff33', '#ff3333'],
    },
  };

  // ── グローバル設定 ──
  let globalConfig = {
    theme: params.get('theme') || 'neon',
    font: decodeURIComponent(params.get('font') || 'Noto Sans JP'),
    position: params.get('pos') || 'top-center',
    queueGap: parseInt(params.get('gap') || '2000', 10),
    maxQueue: parseInt(params.get('max') || '20', 10),
    alertTypes: {},
  };

  // URLからalert設定をロード
  const alertsParam = params.get('alerts');
  if (alertsParam) {
    try { globalConfig.alertTypes = JSON.parse(decodeURIComponent(alertsParam)); }
    catch (e) { console.warn('Failed to parse alerts param:', e); }
  }

  // localStorageフォールバック
  if (!alertsParam || Object.keys(globalConfig.alertTypes).length === 0) {
    try {
      const saved = localStorage.getItem('sap-state');
      if (saved) {
        const s = JSON.parse(saved);
        if (s.alertTypes) globalConfig.alertTypes = s.alertTypes;
        if (s.theme) globalConfig.theme = s.theme;
        if (s.font) globalConfig.font = s.font;
        if (s.position) globalConfig.position = s.position;
        if (s.queueGap) globalConfig.queueGap = s.queueGap;
      }
    } catch (e) { /* ignore */ }
  }

  function getTheme() {
    return THEMES[globalConfig.theme] || THEMES.neon;
  }

  // ── デフォルトアラートタイプ（設定がない場合のフォールバック）──
  function defaultAlertType(type) {
    const theme = getTheme();
    return {
      id: type,
      name: type,
      enabled: true,
      duration: 4000,
      priority: 0,
      soundId: null,
      soundTime: 0,
      soundVolume: 0.8,
      layers: [
        {
          id: 'title_' + type,
          type: 'text',
          name: 'タイトル',
          visible: true,
          startTime: 0,
          endTime: 4000,
          x: 50, y: 35,
          scale: 1, rotation: 0, opacity: 1,
          entrance: { type: 'zoom-in', duration: 400, easing: 'ease-out' },
          exit: { type: 'fade-out', duration: 400, easing: 'ease-in' },
          keyframes: [],
          props: {
            text: getDefaultTitle(type),
            fontSize: 28,
            fontFamily: globalConfig.font,
            fontWeight: '700',
            color: theme.accentColor || '#00aaff',
            glow: theme.glow || false,
            glowColor: theme.glowColor || '#00aaff',
            glowSize: theme.glowSize || 10,
            gradient: theme.gradient || false,
            gradColor1: theme.gradColor1 || '#ff6ec7',
            gradColor2: theme.gradColor2 || '#7873f5',
            outline: false, shadow: false,
          },
        },
        {
          id: 'msg_' + type,
          type: 'text',
          name: 'メッセージ',
          visible: true,
          startTime: 200,
          endTime: 3800,
          x: 50, y: 60,
          scale: 1, rotation: 0, opacity: 1,
          entrance: { type: 'slide-up', duration: 500, easing: 'ease-out' },
          exit: { type: 'fade-out', duration: 400, easing: 'ease-in' },
          keyframes: [],
          props: {
            text: getDefaultMessage(type),
            fontSize: 22,
            fontFamily: globalConfig.font,
            fontWeight: '400',
            color: theme.textColor || '#ffffff',
            glow: false, gradient: false, outline: false, shadow: false,
          },
        },
      ],
    };
  }

  function getDefaultTitle(type) {
    const titles = {
      follow: '🎉 New Follow!',
      subscribe: '⭐ New Subscriber!',
      donation: '💰 Donation!',
      raid: '🚀 Raid!',
      custom1: '🔔 Alert!',
      custom2: '🔔 Alert!',
    };
    return titles[type] || '🔔 Alert!';
  }

  function getDefaultMessage(type) {
    const msgs = {
      follow: '{username}さんがフォローしました！',
      subscribe: '{username}さんがサブスクライブ！',
      donation: '{username}さんから{amount}円！ {message}',
      raid: '{username}さんが{viewers}人でレイド！',
      custom1: '{username}: {message}',
      custom2: '{username}: {message}',
    };
    return msgs[type] || '{message}';
  }

  // ── 変数展開 ──
  function expandVariables(text, data) {
    return text
      .replace(/\{username\}/g, escapeHTML(data.username || 'ゲスト'))
      .replace(/\{amount\}/g, escapeHTML(String(data.amount || '')))
      .replace(/\{message\}/g, escapeHTML(data.message || ''))
      .replace(/\{tier\}/g, escapeHTML(data.tier || ''))
      .replace(/\{viewers\}/g, escapeHTML(String(data.viewers || '')));
  }

  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // ── アラートキュー ──
  let queue = [];
  let currentAlert = null;
  let isPlaying = false;

  function enqueue(alertData) {
    if (queue.length >= globalConfig.maxQueue) return;
    queue.push(alertData);
    queue.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    if (!isPlaying) playNext();
  }

  function playNext() {
    if (queue.length === 0) {
      isPlaying = false;
      return;
    }
    isPlaying = true;
    const data = queue.shift();
    renderAlert(data);
  }

  // ── アラート描画 ──
  function renderAlert(data) {
    const type = data.type || 'follow';
    const alertCfg = globalConfig.alertTypes[type] || defaultAlertType(type);
    if (!alertCfg.enabled) { playNext(); return; }

    const duration = alertCfg.duration || 4000;

    // アラートボックス作成
    const box = document.createElement('div');
    box.className = 'alert-box pos-' + globalConfig.position;
    stage.appendChild(box);
    currentAlert = { box: box, startTime: performance.now(), duration: duration };

    // パーティクルレイヤーの処理
    const particleLayers = (alertCfg.layers || []).filter(l => l.type === 'particle' && l.visible);
    particleLayers.forEach(layer => {
      const delay = layer.startTime || 0;
      setTimeout(() => {
        if (window.AlertParticles) {
          window.AlertParticles.burst({
            particleType: layer.props.particleType || 'confetti',
            count: layer.props.count || 30,
            spread: layer.props.spread || 360,
            speed: layer.props.speed || 5,
            gravity: layer.props.gravity,
            colors: layer.props.colors || getTheme().particleColors,
            sizeMin: layer.props.sizeMin,
            sizeMax: layer.props.sizeMax,
            lifetime: layer.props.lifetime || 2000,
            emoji: layer.props.emoji || '🎉',
            originX: (layer.x / 100) * stage.offsetWidth,
            originY: (layer.y / 100) * stage.offsetHeight,
          });
        }
      }, delay);
    });

    // 通常レイヤーの描画
    const normalLayers = (alertCfg.layers || []).filter(l => l.type !== 'particle' && l.visible);
    normalLayers.forEach((layer, index) => {
      const el = createLayerElement(layer, data);
      el.style.zIndex = index + 1;
      box.appendChild(el);
      animateLayer(el, layer, duration);
    });

    // 終了後にクリア
    setTimeout(() => {
      box.remove();
      currentAlert = null;
      // ギャップ後に次のアラートを再生
      setTimeout(playNext, globalConfig.queueGap);
    }, duration);
  }

  // ── レイヤーDOM作成 ──
  function createLayerElement(layer, data) {
    const el = document.createElement('div');
    el.className = 'alert-layer type-' + layer.type;

    // 位置・変形（alert-box内の相対位置）
    el.style.left = layer.x + '%';
    el.style.top = layer.y + '%';
    el.style.transform = 'translate(-50%, -50%) scale(' + (layer.scale || 1) + ') rotate(' + (layer.rotation || 0) + 'deg)';
    el.style.opacity = '0';
    el.style.textAlign = 'center';

    const theme = getTheme();

    switch (layer.type) {
      case 'text': {
        const p = layer.props || {};
        const text = expandVariables(p.text || '', data);
        el.textContent = text;
        el.style.fontFamily = "'" + (p.fontFamily || globalConfig.font) + "', sans-serif";
        el.style.fontSize = (p.fontSize || 24) + 'px';
        el.style.fontWeight = p.fontWeight || '400';
        el.style.color = p.color || theme.textColor || '#ffffff';

        // テキストエフェクト
        if (p.glow) {
          el.classList.add('fx-glow');
          el.style.setProperty('--glow-color', p.glowColor || theme.glowColor || '#00aaff');
        }
        if (p.outline) {
          el.classList.add('fx-outline');
          el.style.setProperty('--outline-color', p.outlineColor || '#000');
          el.style.setProperty('--outline-width', (p.outlineWidth || 2) + 'px');
        }
        if (p.gradient) {
          el.classList.add('fx-gradient');
          el.style.setProperty('--grad-color1', p.gradColor1 || '#ff6ec7');
          el.style.setProperty('--grad-color2', p.gradColor2 || '#7873f5');
        }
        if (p.shadow) {
          el.classList.add('fx-shadow');
          el.style.setProperty('--shadow-color', p.shadowColor || 'rgba(0,0,0,0.5)');
        }
        break;
      }

      case 'image': {
        const p = layer.props || {};
        if (p.src) {
          const img = document.createElement('img');
          img.src = p.src;
          img.style.width = (p.size || 64) + 'px';
          img.style.height = (p.size || 64) + 'px';
          img.style.objectFit = p.fitMode || 'contain';
          el.appendChild(img);
        }
        break;
      }

      case 'emoji': {
        const p = layer.props || {};
        el.textContent = p.emoji || '🎉';
        el.style.fontSize = (p.size || 48) + 'px';
        el.style.lineHeight = '1';
        break;
      }

      case 'shape': {
        const p = layer.props || {};
        const shape = document.createElement('div');
        shape.className = 'shape-el shape-' + (p.shape || 'circle');
        shape.style.width = (p.size || 60) + 'px';
        shape.style.height = (p.size || 60) + 'px';
        shape.style.backgroundColor = p.strokeOnly ? 'transparent' : (p.color || '#ff6ec7');
        if (p.strokeOnly) {
          shape.style.border = (p.strokeWidth || 2) + 'px solid ' + (p.color || '#ff6ec7');
        }
        if (p.glow) {
          shape.style.boxShadow = '0 0 ' + (p.glowSize || 15) + 'px ' + (p.glowColor || p.color || '#ff6ec7');
        }
        el.appendChild(shape);
        break;
      }
    }

    return el;
  }

  // ── レイヤーアニメーション ──
  function animateLayer(el, layer, totalDuration) {
    const start = layer.startTime || 0;
    const end = layer.endTime || totalDuration;
    const entrance = layer.entrance || { type: 'fade-in', duration: 400 };
    const exit = layer.exit || { type: 'fade-out', duration: 400 };

    // 入場: startTime後に開始
    setTimeout(() => {
      el.style.opacity = '1';
      el.style.animation = 'enter-' + entrance.type + ' ' + entrance.duration + 'ms ' + (entrance.easing || 'ease-out') + ' forwards';

      // 入場完了後: ホールドアニメーション（もしあれば）
      setTimeout(() => {
        el.style.animation = '';
        // キーフレームアニメーションがあれば適用
        if (layer.keyframes && layer.keyframes.length > 0) {
          applyKeyframes(el, layer);
        }
      }, entrance.duration);
    }, start);

    // 退場: endTime - exit.duration で開始
    const exitStart = end - (exit.duration || 400);
    setTimeout(() => {
      el.style.animation = 'exit-' + exit.type + ' ' + exit.duration + 'ms ' + (exit.easing || 'ease-in') + ' forwards';
    }, Math.max(start + entrance.duration, exitStart));
  }

  // ── キーフレーム補間 ──
  function applyKeyframes(el, layer) {
    if (!layer.keyframes || layer.keyframes.length === 0) return;

    const sorted = layer.keyframes.slice().sort((a, b) => a.time - b.time);
    sorted.forEach(kf => {
      const delay = kf.time - (layer.startTime || 0) - (layer.entrance ? layer.entrance.duration : 0);
      if (delay < 0) return;

      setTimeout(() => {
        if (kf.props.scale != null) {
          el.style.transform = 'translate(-50%, -50%) scale(' + kf.props.scale + ') rotate(' + (kf.props.rotation || layer.rotation || 0) + 'deg)';
        }
        if (kf.props.opacity != null) el.style.opacity = kf.props.opacity;
        if (kf.props.x != null) el.style.left = kf.props.x + '%';
        if (kf.props.y != null) el.style.top = kf.props.y + '%';
        el.style.transition = 'all 0.3s ease';
      }, delay);
    });
  }

  // ── postMessage API ──
  window.addEventListener('message', function (e) {
    let data;
    try {
      data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    } catch (err) { return; }

    if (!data || !data.type) return;

    switch (data.type) {
      case 'alert':
      case 'trigger':
        enqueue({
          type: data.alertType || data.eventType || 'follow',
          username: data.username || data.name || '',
          amount: data.amount || '',
          message: data.message || data.msg || '',
          tier: data.tier || '',
          viewers: data.viewers || data.count || '',
          priority: data.priority || 0,
        });
        break;

      case 'clear':
        clearAll();
        break;

      case 'config-update':
        if (data.config) {
          Object.assign(globalConfig, data.config);
        }
        break;

      case 'timeline-seek':
        // タイムラインエディタからのプレビュー同期（Phase 4で拡張）
        break;
    }
  });

  // ── グローバルAPI ──
  window.StreamAlertPro = {
    trigger: function (alertType, data) {
      enqueue({
        type: alertType || 'follow',
        username: (data && data.username) || '',
        amount: (data && data.amount) || '',
        message: (data && data.message) || '',
        tier: (data && data.tier) || '',
        viewers: (data && data.viewers) || '',
        priority: (data && data.priority) || 0,
      });
    },

    clear: function () {
      clearAll();
    },

    getQueue: function () {
      return queue.slice();
    },

    getConfig: function () {
      return globalConfig;
    },

    updateConfig: function (cfg) {
      Object.assign(globalConfig, cfg);
    },
  };

  function clearAll() {
    queue = [];
    if (currentAlert && currentAlert.box) currentAlert.box.remove();
    currentAlert = null;
    isPlaying = false;
    stage.innerHTML = '';
    if (window.AlertParticles) window.AlertParticles.clearAll();
  }

  // ── デモモード（プレビュー用）──
  const isPreview = params.get('preview') === 'true' || params.get('demo') === 'true';
  if (isPreview) {
    const demoData = [
      { type: 'follow', username: 'さくら', message: '' },
      { type: 'subscribe', username: 'GameMaster', tier: 'Tier 1', message: 'いつも楽しみにしてます！' },
      { type: 'donation', username: 'MoonLight', amount: '500', message: 'がんばって！' },
      { type: 'raid', username: 'たくみ', viewers: '42', message: '' },
    ];
    let demoIndex = 0;

    function playDemo() {
      const d = demoData[demoIndex % demoData.length];
      enqueue(d);
      demoIndex++;
    }

    // 初回は1秒後、以降はqueueGap + duration + 1秒ごと
    setTimeout(playDemo, 1000);
    setInterval(playDemo, 7000);
  }

  // ── 初期化完了ログ ──
  console.log('Stream Alert Pro v1.0 loaded. Theme:', globalConfig.theme, 'Position:', globalConfig.position);

})();
