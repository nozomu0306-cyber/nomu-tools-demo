/*  Chat Style Pro - Chat Display Engine
    OBSブラウザソースで表示するチャットオーバーレイ
    YouTube Live / Twitch のチャットURLと連携、
    またはデモモードでサンプル表示 */

(function () {
  'use strict';

  const params = new URLSearchParams(location.search);
  const cfg = {
    // テーマ
    theme:       params.get('theme')      || 'neon',
    // アニメーション: default / slide / scale / bounce
    animation:   params.get('anim')       || 'default',
    // フォント
    font:        decodeURIComponent(params.get('font') || 'Noto Sans JP'),
    fontSize:    parseInt(params.get('fontSize') || '14', 10),
    nameSize:    parseInt(params.get('nameSize') || '13', 10),
    // 表示
    maxMessages: parseInt(params.get('max') || '15', 10),
    fadeTime:    parseInt(params.get('fade') || '0', 10), // 秒。0=フェードなし
    showAvatar:  params.get('avatar')     !== 'false',
    showName:    params.get('name')       !== 'false',
    // カスタムカラー
    nameColor:   params.get('nameColor')  || '',
    textColor:   params.get('textColor')  || '',
    bgColor:     params.get('bgColor')    || '',
    bgOpacity:   parseFloat(params.get('bgOpacity') || '1'),
    // 角丸
    borderRadius: parseInt(params.get('radius') || '8', 10),
    // メッセージ間隔
    gap:         parseInt(params.get('gap') || '6', 10),
    // チャットソース (demo / yt:<videoId> / twitch:<channel>)
    source:      params.get('source')     || 'demo',
    // デモ速度（ミリ秒）
    demoSpeed:   parseInt(params.get('demoSpeed') || '3000', 10),
  };

  const $container = document.getElementById('chat-container');
  const $messages  = document.getElementById('chat-messages');

  // テーマ適用
  $container.classList.add('theme-' + cfg.theme);
  if (cfg.animation !== 'default') {
    $container.classList.add('anim-' + cfg.animation);
  }

  // フォント適用
  document.body.style.fontFamily = `"${cfg.font}", sans-serif`;

  // メッセージ間隔
  $messages.style.gap = cfg.gap + 'px';

  // ── メッセージ追加 ──
  function addMessage(name, text, color, isHighlighted) {
    const msg = document.createElement('div');
    msg.className = 'chat-msg' + (isHighlighted ? ' highlighted' : '');
    msg.style.borderRadius = cfg.borderRadius + 'px';

    // カスタムBG
    if (cfg.bgColor) {
      const r = parseInt(cfg.bgColor.slice(1,3),16);
      const g = parseInt(cfg.bgColor.slice(3,5),16);
      const b = parseInt(cfg.bgColor.slice(5,7),16);
      msg.style.background = `rgba(${r},${g},${b},${cfg.bgOpacity})`;
    }

    let html = '';

    // アバター
    if (cfg.showAvatar) {
      const avatarColor = color || stringToColor(name);
      const initial = name.charAt(0).toUpperCase();
      html += `<div class="chat-avatar" style="background:${avatarColor}">${initial}</div>`;
    }

    html += '<div class="chat-body">';

    // 名前
    if (cfg.showName) {
      const nameStyle = cfg.nameColor
        ? `style="color:${cfg.nameColor};font-size:${cfg.nameSize}px"`
        : `style="font-size:${cfg.nameSize}px"`;
      html += `<div class="chat-name" ${nameStyle}>${escapeHTML(name)}</div>`;
    }

    // テキスト
    const textStyle = cfg.textColor
      ? `style="color:${cfg.textColor};font-size:${cfg.fontSize}px"`
      : `style="font-size:${cfg.fontSize}px"`;
    html += `<div class="chat-text" ${textStyle}>${escapeHTML(text)}</div>`;

    html += '</div>';
    msg.innerHTML = html;

    $messages.appendChild(msg);

    // 最大メッセージ数を超えたら古いものを削除
    while ($messages.children.length > cfg.maxMessages) {
      const oldest = $messages.children[0];
      oldest.classList.add('removing');
      setTimeout(() => oldest.remove(), 300);
    }

    // 自動フェード
    if (cfg.fadeTime > 0) {
      setTimeout(() => {
        msg.classList.add('removing');
        setTimeout(() => msg.remove(), 300);
      }, cfg.fadeTime * 1000);
    }
  }

  // ── デモモード ──
  const DEMO_MESSAGES = [
    { name: 'さくら', text: 'こんばんは！配信待ってました！', color: '#e91e63' },
    { name: 'GameMaster', text: '今日は何のゲームやるの？', color: '#2196f3' },
    { name: 'たくみ', text: 'わくわく', color: '#4caf50' },
    { name: 'MoonLight', text: 'Hello from overseas!', color: '#ff9800' },
    { name: 'はるか', text: 'BGMいい感じだね', color: '#9c27b0' },
    { name: 'Shadow_X', text: 'GG', color: '#607d8b' },
    { name: 'ゆいな', text: 'かわいい！！', color: '#f44336', highlight: true },
    { name: 'TechNerd', text: 'マイク音質すごく良くなってる', color: '#00bcd4' },
    { name: 'りょう', text: '初見です！よろしくお願いします', color: '#ff5722' },
    { name: 'StarDust', text: 'この配信最高', color: '#673ab7' },
    { name: 'けんた', text: 'うぽつ！', color: '#795548' },
    { name: 'Luna_ch', text: 'スパチャ投げたい', color: '#ffc107', highlight: true },
    { name: 'あおい', text: 'アーカイブ残りますか？', color: '#03a9f4' },
    { name: 'Ninja42', text: 'nice play!', color: '#8bc34a' },
    { name: 'まりん', text: '笑った', color: '#e91e63' },
  ];

  function startDemo() {
    let idx = 0;
    function next() {
      const m = DEMO_MESSAGES[idx % DEMO_MESSAGES.length];
      addMessage(m.name, m.text, m.color, m.highlight || false);
      idx++;
      setTimeout(next, cfg.demoSpeed + Math.random() * 1500);
    }
    // 最初に数個すぐ表示
    for (let i = 0; i < 3; i++) {
      const m = DEMO_MESSAGES[i];
      setTimeout(() => addMessage(m.name, m.text, m.color, m.highlight || false), i * 500);
      idx++;
    }
    setTimeout(next, 2000);
  }

  // ── ユーティリティ ──
  function escapeHTML(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 65%, 55%)`;
  }

  // ── YouTube Live チャット連携 ──
  // 注: YouTube Live チャットはiframeのCORS制限があるため、
  // 実際の連携にはサーバーサイドか拡張機能が必要。
  // ここではChat v2.0 Style Generator互換のURLパラメータ形式をサポート。
  // 実用的にはYouTube Live Chat CSS等と組み合わせて使用。

  // ── 外部メッセージ受信（postMessage API） ──
  window.addEventListener('message', (e) => {
    try {
      const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      if (data.type === 'chat-message') {
        addMessage(
          data.name || 'Anonymous',
          data.text || '',
          data.color || null,
          data.highlighted || false
        );
      }
    } catch {}
  });

  // ── グローバルAPI（外部スクリプトから呼び出し可能） ──
  window.ChatStylePro = {
    addMessage: addMessage,
    clear: () => { $messages.innerHTML = ''; },
  };

  // ── 初期化 ──
  if (cfg.source === 'demo') {
    startDemo();
  }

})();
