/*  Stream Info Panel - Settings App */

(function () {
  'use strict';

  let state = loadState();

  function defaultState() {
    return { theme: 'neon', font: 'Noto Sans JP', widgets: [] };
  }

  function loadState() {
    try {
      const s = localStorage.getItem('sip-state');
      return s ? { ...defaultState(), ...JSON.parse(s) } : defaultState();
    } catch { return defaultState(); }
  }

  function saveState() { localStorage.setItem('sip-state', JSON.stringify(state)); }

  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);
  let editingIdx = null;

  // ── ウィジェットのデフォルト値 ──
  const WIDGET_DEFAULTS = {
    goal:    { type: 'goal', label: 'フォロワー目標', current: 847, target: 1000, x: 20, y: 20, width: 300, anim: 'slide-left' },
    clock:   { type: 'clock', label: '配信時間', x: 20, y: 20, width: 200, anim: 'fade' },
    counter: { type: 'counter', label: 'デスカウント', value: 0, id: 'counter1', x: 20, y: 20, width: 120, anim: 'fade' },
    text:    { type: 'text', text: '次回配信: 毎週金曜 21:00〜', fontSize: 14, x: 20, y: 20, width: 300, anim: 'fade' },
    ticker:  { type: 'ticker', text: '配信をご覧いただきありがとうございます！チャンネル登録よろしくお願いします！', speed: 15, fontSize: 16, x: 0, y: 0, width: 500, anim: 'fade' },
    event:   { type: 'event', label: 'LATEST FOLLOW', name: 'ユーザー名', detail: 'フォローありがとう！', x: 20, y: 20, width: 250, anim: 'slide-left' },
    social:  { type: 'social', icon: '🐦', text: '@your_channel', x: 20, y: 20, width: 200, anim: 'fade' },
  };

  const TYPE_LABELS = {
    goal: '📊 目標バー', clock: '⏱ 配信時間', counter: '🔢 カウンター',
    text: '📝 テキスト', ticker: '📜 ティッカー', event: '🎉 イベント', social: '🔗 SNS',
  };

  // ── ウィジェットリスト描画 ──
  function renderWidgetList() {
    const $list = $('widget-list');
    $list.innerHTML = '';

    if (state.widgets.length === 0) {
      $list.innerHTML = '<p style="font-size:12px;color:var(--text-dim);text-align:center;padding:16px;">ウィジェットがありません。<br>下のボタンから追加してください。</p>';
      return;
    }

    state.widgets.forEach((w, i) => {
      const item = document.createElement('div');
      item.className = 'widget-item';
      item.innerHTML = `
        <div class="widget-item-info">
          <span class="widget-item-type">${TYPE_LABELS[w.type] || w.type}</span>
          <span>${esc(w.label || w.text || w.name || '')}</span>
        </div>
        <div class="widget-item-actions">
          <button class="btn btn-xs btn-outline" data-edit="${i}">編集</button>
          <button class="btn btn-xs btn-danger" data-delete="${i}">削除</button>
        </div>`;

      item.querySelector('[data-edit]').addEventListener('click', () => editWidget(i));
      item.querySelector('[data-delete]').addEventListener('click', () => {
        state.widgets.splice(i, 1);
        editingIdx = null;
        saveState();
        renderWidgetList();
        renderEditPanel();
        updatePreview();
      });

      $list.appendChild(item);
    });
  }

  // ── ウィジェット編集パネル ──
  function editWidget(idx) {
    editingIdx = idx;
    renderEditPanel();
  }

  function renderEditPanel() {
    const $area = $('edit-area');

    if (editingIdx === null || !state.widgets[editingIdx]) {
      $area.innerHTML = '';
      return;
    }

    const w = state.widgets[editingIdx];
    let html = `<div class="edit-panel">
      <div class="edit-panel-title">
        <span>${TYPE_LABELS[w.type] || w.type} を編集</span>
        <button class="btn btn-xs btn-outline" id="btn-close-edit">閉じる</button>
      </div>`;

    // 共通: 位置・サイズ
    html += `
      <div class="field-row">
        <div class="field"><label>X座標</label><input type="number" class="input input-sm" data-key="x" value="${w.x || 0}"></div>
        <div class="field"><label>Y座標</label><input type="number" class="input input-sm" data-key="y" value="${w.y || 0}"></div>
        <div class="field"><label>幅</label><input type="number" class="input input-sm" data-key="width" value="${w.width || 200}"></div>
      </div>
      <div class="field"><label>アニメーション</label>
        <select class="select" data-key="anim">
          <option value="fade" ${w.anim==='fade'?'selected':''}>フェードイン</option>
          <option value="slide-left" ${w.anim==='slide-left'?'selected':''}>左スライド</option>
          <option value="slide-right" ${w.anim==='slide-right'?'selected':''}>右スライド</option>
          <option value="" ${!w.anim?'selected':''}>なし</option>
        </select>
      </div>`;

    // タイプ別フィールド
    if (w.type === 'goal') {
      html += `
        <div class="field"><label>ラベル</label><input type="text" class="input" data-key="label" value="${esc(w.label || '')}"></div>
        <div class="field-row">
          <div class="field"><label>現在値</label><input type="number" class="input input-sm" data-key="current" value="${w.current || 0}"></div>
          <div class="field"><label>目標値</label><input type="number" class="input input-sm" data-key="target" value="${w.target || 100}"></div>
        </div>`;
    } else if (w.type === 'clock') {
      html += `<div class="field"><label>ラベル</label><input type="text" class="input" data-key="label" value="${esc(w.label || '')}"></div>`;
    } else if (w.type === 'counter') {
      html += `
        <div class="field"><label>ラベル</label><input type="text" class="input" data-key="label" value="${esc(w.label || '')}"></div>
        <div class="field"><label>初期値</label><input type="number" class="input input-sm" data-key="value" value="${w.value || 0}"></div>
        <div class="field"><label>ID（API用）</label><input type="text" class="input" data-key="id" value="${esc(w.id || '')}"></div>`;
    } else if (w.type === 'text') {
      html += `
        <div class="field"><label>テキスト</label><input type="text" class="input" data-key="text" value="${esc(w.text || '')}"></div>
        <div class="field"><label>サイズ</label><input type="range" class="range" data-key="fontSize" min="10" max="48" value="${w.fontSize||16}"><span class="range-val">${w.fontSize||16}px</span></div>
        <div class="field"><label class="checkbox-label"><input type="checkbox" data-key="bold" ${w.bold?'checked':''}> 太字</label></div>`;
    } else if (w.type === 'ticker') {
      html += `
        <div class="field"><label>テキスト</label><input type="text" class="input" data-key="text" value="${esc(w.text || '')}"></div>
        <div class="field"><label>速度（秒）</label><input type="range" class="range" data-key="speed" min="5" max="40" value="${w.speed||15}"><span class="range-val">${w.speed||15}s</span></div>
        <div class="field"><label>サイズ</label><input type="range" class="range" data-key="fontSize" min="10" max="32" value="${w.fontSize||16}"><span class="range-val">${w.fontSize||16}px</span></div>`;
    } else if (w.type === 'event') {
      html += `
        <div class="field"><label>ラベル</label><input type="text" class="input" data-key="label" value="${esc(w.label || '')}"></div>
        <div class="field"><label>名前</label><input type="text" class="input" data-key="name" value="${esc(w.name || '')}"></div>
        <div class="field"><label>詳細</label><input type="text" class="input" data-key="detail" value="${esc(w.detail || '')}"></div>`;
    } else if (w.type === 'social') {
      html += `
        <div class="field"><label>アイコン</label><input type="text" class="input input-sm" data-key="icon" value="${w.icon || ''}"></div>
        <div class="field"><label>テキスト</label><input type="text" class="input" data-key="text" value="${esc(w.text || '')}"></div>`;
    }

    html += '</div>';
    $area.innerHTML = html;

    // イベント
    $area.querySelector('#btn-close-edit').addEventListener('click', () => {
      editingIdx = null;
      renderEditPanel();
    });

    $area.querySelectorAll('[data-key]').forEach(el => {
      const handler = () => {
        const key = el.dataset.key;
        if (el.type === 'checkbox') {
          w[key] = el.checked;
        } else if (el.type === 'number' || el.type === 'range') {
          w[key] = parseFloat(el.value) || 0;
          const rangeVal = el.nextElementSibling;
          if (rangeVal && rangeVal.classList.contains('range-val')) {
            const unit = key === 'speed' ? 's' : 'px';
            rangeVal.textContent = el.value + unit;
          }
        } else {
          w[key] = el.value;
        }
        saveState();
        updatePreview();
      };
      el.addEventListener('input', handler);
      el.addEventListener('change', handler);
    });
  }

  // ── URL生成 ──
  function buildURL() {
    const base = new URL('index.html', location.href).href;
    const p = new URLSearchParams();
    p.set('theme', state.theme);
    p.set('font', state.font);
    p.set('widgets', JSON.stringify(state.widgets));
    return base + '?' + p.toString();
  }

  let previewTimer;
  function updatePreview() {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => {
      const url = buildURL();
      $('obs-url').value = url;
      $('preview-frame').src = url;
    }, 300);
  }

  // ── イベント ──
  function initEvents() {
    // テーマ
    $$('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state.theme = btn.dataset.theme;
        $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
        saveState();
        updatePreview();
      });
    });

    // フォント
    $('opt-font').value = state.font;
    $('opt-font').addEventListener('change', () => {
      state.font = $('opt-font').value;
      saveState();
      updatePreview();
    });

    // ウィジェット追加
    $$('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.add;
        const newW = { ...WIDGET_DEFAULTS[type] };
        // 重ならないよう位置をずらす
        newW.y = 20 + state.widgets.length * 60;
        state.widgets.push(newW);
        saveState();
        renderWidgetList();
        editWidget(state.widgets.length - 1);
        updatePreview();
      });
    });

    // URLコピー
    $('btn-copy-url').addEventListener('click', () => {
      navigator.clipboard.writeText($('obs-url').value).then(() => {
        $('copy-msg').textContent = 'URLをコピーしました！';
        setTimeout(() => { $('copy-msg').textContent = ''; }, 3000);
      });
    });

    // エクスポート/インポート
    $('btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'stream-info-panel-settings.json';
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
          saveState();
          renderWidgetList();
          editingIdx = null;
          renderEditPanel();
          updatePreview();
          $$('.theme-btn').forEach(b => b.classList.toggle('active', b.dataset.theme === state.theme));
          $('opt-font').value = state.font;
        } catch { alert('読み込みに失敗しました'); }
      };
      reader.readAsText(file);
      e.target.value = '';
    });
  }

  function esc(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  // ── 初期化 ──
  initEvents();
  renderWidgetList();
  updatePreview();
})();
