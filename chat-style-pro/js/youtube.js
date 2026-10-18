/*  Chat Style Pro - YouTube Live Chat 連携
    YouTube のポップアウトチャットURLと、OBSブラウザソースの
    「カスタムCSS」に貼り付けるCSSを生成する。
    （YouTubeチャットはCORS制限で直接取得できないため、
      OBSにYouTubeのチャット画面を読み込ませてCSSで見た目を差し替える方式） */

(function (root) {
  'use strict';

  // chat.css のテーマ定義と同じ配色
  const THEMES = {
    neon:    { bg: 'rgba(10,10,50,0.85)',  border: '1px solid rgba(0,170,255,0.3)',   name: '#00ccff', text: '#e0e8ff', accent: '#00ccff', accentBg: 'rgba(0,170,255,0.15)' },
    gaming:  { bg: 'rgba(20,0,40,0.85)',   border: '1px solid rgba(255,110,199,0.3)', name: '#ff6ec7', text: '#f0e0ff', accent: '#ff6ec7', accentBg: 'rgba(255,110,199,0.15)' },
    minimal: { bg: 'rgba(30,30,30,0.8)',   border: 'none',                            name: '#aaaaaa', text: '#ffffff', accent: '#ffffff', accentBg: 'rgba(255,255,255,0.1)' },
    pastel:  { bg: 'rgba(255,240,245,0.9)', border: '1px solid rgba(206,147,216,0.3)', name: '#9c27b0', text: '#4a2040', accent: '#ce93d8', accentBg: 'rgba(206,147,216,0.2)' },
    retro:   { bg: 'rgba(0,20,0,0.9)',     border: '1px solid rgba(0,255,65,0.2)',    name: '#00ff41', text: '#00cc33', accent: '#00ff41', accentBg: 'rgba(0,255,65,0.1)', font: 'DotGothic16' },
    bubble:  { bg: 'linear-gradient(135deg, rgba(108,92,231,0.85), rgba(0,206,201,0.85))', border: 'none', name: 'rgba(255,255,255,0.8)', text: '#ffffff', accent: '#ffffff', accentBg: 'linear-gradient(135deg, rgba(108,92,231,1), rgba(0,206,201,1))', radius: 18 },
    glass:   { bg: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', name: 'rgba(255,255,255,0.9)', text: 'rgba(255,255,255,0.8)', accent: 'rgba(255,255,255,0.5)', accentBg: 'rgba(255,255,255,0.15)', blur: true },
  };

  // YouTube 既定のロール色
  const ROLE_COLORS = { owner: '#ffd600', moderator: '#5e84f1', member: '#2ba640' };

  const ANIMATIONS = {
    default: 'from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); }',
    slide:   'from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); }',
    scale:   'from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); }',
    bounce:  '0% { opacity: 0; transform: translateY(30px); } 60% { opacity: 1; transform: translateY(-5px); } 100% { opacity: 1; transform: translateY(0); }',
  };

  const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/;

  // 動画ID / 各種YouTube URL から 11桁の動画IDを取り出す。取れなければ null
  function parseVideoId(input) {
    const s = String(input || '').trim();
    if (!s) return null;
    if (VIDEO_ID_RE.test(s)) return s;
    let url;
    try {
      url = new URL(/^https?:\/\//i.test(s) ? s : 'https://' + s);
    } catch { return null; }
    const host = url.hostname.replace(/^(www|m|music)\./, '');
    let id = null;
    if (host === 'youtu.be') {
      id = url.pathname.split('/')[1];
    } else if (host === 'youtube.com' || host === 'studio.youtube.com') {
      id = url.searchParams.get('v');
      if (!id) {
        // /live/ID, /shorts/ID, /embed/ID, /video/ID/livestreaming (Studio)
        const m = url.pathname.match(/^\/(?:live|shorts|embed|video)\/([A-Za-z0-9_-]{11})/);
        if (m) id = m[1];
      }
    }
    return id && VIDEO_ID_RE.test(id) ? id : null;
  }

  function buildChatURL(videoId) {
    return 'https://www.youtube.com/live_chat?is_popout=1&v=' + videoId;
  }

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  // settings.js の state から OBS カスタムCSS を生成
  function buildCSS(state) {
    const t = THEMES[state.theme] || THEMES.neon;
    const font = t.font || state.font;
    const radius = t.radius || state.radius;
    const bg = state.bgColorOn ? hexToRgba(state.bgColor, state.bgOpacity) : t.bg;
    const nameColor = state.nameColorOn ? state.nameColor : t.name;
    const textColor = state.textColorOn ? state.textColor : t.text;
    const anim = ANIMATIONS[state.anim] || ANIMATIONS.default;
    const MSG = 'yt-live-chat-text-message-renderer';

    const css = [];
    css.push(`/* Chat Style Pro - YouTube Live Chat 用 (theme: ${state.theme}) */`);
    css.push(`@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(font).replace(/%20/g, '+')}:wght@400;700&display=swap');`);
    css.push('');

    css.push('/* 背景を透過・不要なUIを非表示 */');
    css.push(`html, body, yt-live-chat-app, yt-live-chat-renderer, yt-live-chat-item-list-renderer, #item-list, #items, #item-offset, #item-scroller {
  background: transparent !important;
  --yt-live-chat-background-color: transparent !important;
}
body { overflow: hidden !important; margin: 0 !important; }
#item-scroller { overflow: hidden !important; }
yt-live-chat-header-renderer,
yt-live-chat-message-input-renderer,
yt-live-chat-viewer-engagement-message-renderer,
yt-live-chat-banner-manager,
yt-live-chat-restricted-participation-renderer,
#panel-pages, #contents > #separator,
#show-more { display: none !important; }`);
    if (!state.ytTicker) {
      css.push('yt-live-chat-ticker-renderer, #ticker { display: none !important; }');
    }
    css.push('');

    css.push('/* メッセージ */');
    css.push(`${MSG} {
  font-family: "${font}", sans-serif !important;
  background: ${bg} !important;${t.border !== 'none' ? `\n  border: ${t.border} !important;` : ''}${t.blur ? '\n  backdrop-filter: blur(10px);\n  -webkit-backdrop-filter: blur(10px);' : ''}
  border-radius: ${radius}px !important;
  padding: 8px 12px !important;
  margin: 0 10px ${state.gap}px !important;
  align-items: flex-start !important;
  overflow: visible !important;
  animation: csp-in 0.3s ease-out forwards${state.fade > 0 ? `, csp-out 0.3s ease-in ${state.fade}s forwards` : ''};
}
${MSG} #content { display: flex !important; flex-direction: column !important; }
${MSG} #author-name {
  color: ${nameColor} !important;
  font-size: ${state.nameSize}px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
}
${MSG} #message {
  display: block !important;
  color: ${textColor} !important;
  font-size: ${state.fontSize}px !important;
  line-height: 1.5 !important;
  word-break: break-word;
}
${MSG} #message img.emoji, ${MSG} #message .emoji { width: 1.4em !important; height: 1.4em !important; vertical-align: middle; }`);

    if (state.ytHideTimestamp !== false) css.push(`${MSG} #timestamp { display: none !important; }`);
    if (!state.avatar) css.push(`${MSG} #author-photo { display: none !important; }`);
    else css.push(`${MSG} #author-photo { width: 28px !important; height: 28px !important; margin-right: 8px !important; }
${MSG} #author-photo img { width: 28px !important; height: 28px !important; border-radius: 50% !important; }`);
    if (!state.name) css.push(`${MSG} yt-live-chat-author-chip { display: none !important; }`);
    if (state.ytHideBadges) css.push(`${MSG} #chat-badges { display: none !important; }`);
    css.push('');

    if (state.ytRoleColors !== false) {
      css.push('/* 配信者・モデレーター・メンバーの名前色 */');
      Object.keys(ROLE_COLORS).forEach(role => {
        css.push(`${MSG}[author-type="${role}"] #author-name { color: ${ROLE_COLORS[role]} !important; background: transparent !important; }`);
      });
      css.push(`${MSG}[author-type="owner"] { border-left: 3px solid ${ROLE_COLORS.owner} !important; }`);
      css.push('');
    }

    css.push('/* スーパーチャット / スーパーステッカー / メンバーシップ */');
    const special = 'yt-live-chat-paid-message-renderer, yt-live-chat-paid-sticker-renderer, yt-live-chat-membership-item-renderer, ytd-sponsorships-live-chat-gift-purchase-announcement-renderer, ytd-sponsorships-live-chat-gift-redemption-announcement-renderer';
    if (state.ytSuperchat === false) {
      css.push(`yt-live-chat-paid-message-renderer, yt-live-chat-paid-sticker-renderer { display: none !important; }`);
    }
    if (state.ytMembership === false) {
      css.push(`yt-live-chat-membership-item-renderer, ytd-sponsorships-live-chat-gift-purchase-announcement-renderer, ytd-sponsorships-live-chat-gift-redemption-announcement-renderer { display: none !important; }`);
    }
    css.push(`${special} {
  font-family: "${font}", sans-serif !important;
  display: block;
  margin: 0 10px ${state.gap}px !important;
  border-radius: ${radius}px !important;
  overflow: hidden !important;
  box-shadow: 0 0 0 2px ${t.accent};
  animation: csp-in 0.3s ease-out forwards${state.fade > 0 ? `, csp-out 0.3s ease-in ${state.fade * 2}s forwards` : ''};
}
${special.split(', ').map(s => s + ' #author-name').join(', ')} { font-size: ${state.nameSize}px !important; }
yt-live-chat-paid-message-renderer #message, yt-live-chat-membership-item-renderer #message { font-size: ${state.fontSize}px !important; }`);
    if (!state.avatar) css.push(`${special.split(', ').map(s => s + ' #author-photo').join(', ')} { display: none !important; }`);
    if (state.ytHideTimestamp !== false) css.push(`${special.split(', ').map(s => s + ' #timestamp').join(', ')} { display: none !important; }`);
    css.push('');

    css.push('/* 最大表示数 */');
    css.push(`#items > *:nth-last-child(n+${state.max + 1}) { display: none !important; }`);
    css.push('');

    css.push('/* アニメーション */');
    css.push(`@keyframes csp-in { ${anim} }`);
    css.push(`@keyframes csp-out { from { opacity: 1; } to { opacity: 0; height: 0; margin: 0; padding: 0; } }`);
    return css.join('\n') + '\n';
  }

  const api = { parseVideoId, buildChatURL, buildCSS, THEMES };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ChatStyleYouTube = api;
})(typeof window !== 'undefined' ? window : this);
