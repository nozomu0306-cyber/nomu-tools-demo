/*  Stream Soundboard - Main Application
    配信用サウンドボードアプリ */

(function () {
  'use strict';

  // ── パッドカラー一覧 ──
  const COLORS = [
    '#6c5ce7', '#a29bfe', '#fd79a8', '#e84393',
    '#00cec9', '#00b894', '#55efc4', '#81ecec',
    '#fdcb6e', '#ffeaa7', '#fab1a0', '#ff7675',
    '#74b9ff', '#0984e3', '#636e72', '#b2bec3',
    '#e17055', '#d63031', '#2d3436', '#dfe6e9',
  ];

  // ── 状態管理 ──
  let data = loadData();

  function defaultData() {
    return {
      groups: [
        { id: 'default', name: 'サウンド', sounds: [] }
      ],
      masterVol: 0.8,
    };
  }

  function loadData() {
    try {
      const d = localStorage.getItem('ssb-data');
      return d ? { ...defaultData(), ...JSON.parse(d) } : defaultData();
    } catch { return defaultData(); }
  }

  function saveData() {
    // 音声データはIndexedDBに保存するため、ここではメタデータのみ
    const toSave = {
      ...data,
      groups: data.groups.map(g => ({
        ...g,
        sounds: g.sounds.map(s => ({
          ...s,
          audioData: undefined, // 音声データは除外
        })),
      })),
    };
    localStorage.setItem('ssb-data', JSON.stringify(toSave));
  }

  // ── IndexedDB for audio data ──
  let db;
  function openDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('StreamSoundboard', 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sounds')) {
          db.createObjectStore('sounds', { keyPath: 'id' });
        }
      };
      req.onsuccess = (e) => { db = e.target.result; resolve(db); };
      req.onerror = () => reject(req.error);
    });
  }

  function saveAudio(id, arrayBuffer) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sounds', 'readwrite');
      tx.objectStore('sounds').put({ id, data: arrayBuffer });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function loadAudio(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sounds', 'readonly');
      const req = tx.objectStore('sounds').get(id);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  }

  function deleteAudio(id) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sounds', 'readwrite');
      tx.objectStore('sounds').delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── オーディオ管理 ──
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const playingSources = new Map(); // id -> { source, gainNode }

  function playSound(soundId) {
    // 既に再生中なら停止
    stopSound(soundId);

    loadAudio(soundId).then(arrayBuf => {
      if (!arrayBuf) return;
      audioCtx.decodeAudioData(arrayBuf.slice(0)).then(buffer => {
        const source = audioCtx.createBufferSource();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = data.masterVol;
        source.buffer = buffer;
        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        source.start(0);

        playingSources.set(soundId, { source, gainNode });

        // パッドの再生状態
        const pad = document.querySelector(`.pad[data-id="${soundId}"]`);
        if (pad) pad.classList.add('playing');

        source.onended = () => {
          playingSources.delete(soundId);
          if (pad) pad.classList.remove('playing');
        };
      });
    });
  }

  function stopSound(soundId) {
    const entry = playingSources.get(soundId);
    if (entry) {
      try { entry.source.stop(); } catch {}
      playingSources.delete(soundId);
      const pad = document.querySelector(`.pad[data-id="${soundId}"]`);
      if (pad) pad.classList.remove('playing');
    }
  }

  function stopAll() {
    for (const [id] of playingSources) {
      stopSound(id);
    }
  }

  // ── DOM ──
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);
  const $board = $('board');

  // ── レンダリング ──
  function render(filter) {
    $board.innerHTML = '';
    const searchTerm = filter || $('search').value.toLowerCase();

    if (data.groups.length === 0 || data.groups.every(g => g.sounds.length === 0)) {
      $board.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔊</div>
          <div class="empty-state-text">サウンドを追加して配信を盛り上げよう！<br>「＋ サウンド追加」ボタンから音声ファイルを登録できます</div>
        </div>`;
      return;
    }

    data.groups.forEach(group => {
      const filteredSounds = searchTerm
        ? group.sounds.filter(s => s.name.toLowerCase().includes(searchTerm))
        : group.sounds;

      if (searchTerm && filteredSounds.length === 0) return;

      const groupEl = document.createElement('div');
      groupEl.className = 'group';
      groupEl.innerHTML = `
        <div class="group-header">
          <span class="group-title">${escapeHTML(group.name)}</span>
          <div class="group-actions">
            ${group.id !== 'default' ? `<button class="btn btn-xs btn-outline" data-rename-group="${group.id}">名前変更</button>` : ''}
            ${group.id !== 'default' ? `<button class="btn btn-xs btn-outline danger" data-delete-group="${group.id}">削除</button>` : ''}
          </div>
        </div>
        <div class="group-body" data-group-id="${group.id}"></div>`;

      const body = groupEl.querySelector('.group-body');

      filteredSounds.forEach(sound => {
        const pad = document.createElement('div');
        pad.className = 'pad';
        pad.dataset.id = sound.id;
        pad.draggable = !searchTerm;
        pad.style.background = sound.color || COLORS[0];
        pad.innerHTML = `
          <button class="pad-menu" data-menu="${sound.id}">⋯</button>
          <div class="pad-name">${escapeHTML(sound.name)}</div>
          ${sound.hotkey ? `<div class="pad-hotkey">${escapeHTML(sound.hotkey)}</div>` : ''}`;

        pad.addEventListener('click', (e) => {
          if (e.target.classList.contains('pad-menu')) return;
          if (audioCtx.state === 'suspended') audioCtx.resume();
          playSound(sound.id);
        });

        // ドラッグ&ドロップ
        pad.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', sound.id);
          e.dataTransfer.effectAllowed = 'move';
          pad.classList.add('dragging');
        });
        pad.addEventListener('dragend', () => pad.classList.remove('dragging'));
        pad.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          pad.classList.add('drag-over');
        });
        pad.addEventListener('dragleave', () => pad.classList.remove('drag-over'));
        pad.addEventListener('drop', (e) => {
          e.preventDefault();
          pad.classList.remove('drag-over');
          const fromId = e.dataTransfer.getData('text/plain');
          const toId = sound.id;
          if (fromId === toId) return;
          reorderPad(fromId, toId, group.id);
        });

        body.appendChild(pad);
      });

      $board.appendChild(groupEl);
    });

    // グループアクション
    $$('[data-rename-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.renameGroup;
        const group = data.groups.find(g => g.id === gid);
        if (!group) return;
        const name = prompt('新しいグループ名:', group.name);
        if (name && name.trim()) {
          group.name = name.trim();
          saveData();
          render();
        }
      });
    });

    $$('[data-delete-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gid = btn.dataset.deleteGroup;
        const group = data.groups.find(g => g.id === gid);
        if (!group) return;
        if (!confirm(`グループ「${group.name}」と中のサウンドを削除しますか？`)) return;
        // 音声データも削除
        group.sounds.forEach(s => deleteAudio(s.id));
        data.groups = data.groups.filter(g => g.id !== gid);
        saveData();
        render();
      });
    });

    // パッドメニュー
    $$('[data-menu]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        showContextMenu(e, btn.dataset.menu);
      });
    });
  }

  // ── ドラッグ並び替え ──
  function reorderPad(fromId, toId, targetGroupId) {
    const fromGroup = findSoundGroup(fromId);
    const toGroup = data.groups.find(g => g.id === targetGroupId) || findSoundGroup(toId);
    if (!fromGroup || !toGroup) return;

    const fromIdx = fromGroup.sounds.findIndex(s => s.id === fromId);
    const sound = fromGroup.sounds.splice(fromIdx, 1)[0];

    const toIdx = toGroup.sounds.findIndex(s => s.id === toId);
    toGroup.sounds.splice(toIdx, 0, sound);

    saveData();
    render();
  }

  // ── コンテキストメニュー ──
  let contextMenu = null;

  function showContextMenu(e, soundId) {
    closeContextMenu();

    const sound = findSound(soundId);
    if (!sound) return;

    contextMenu = document.createElement('div');
    contextMenu.className = 'context-menu';
    contextMenu.style.left = e.clientX + 'px';
    contextMenu.style.top = e.clientY + 'px';

    contextMenu.innerHTML = `
      <button data-action="edit">編集</button>
      <button data-action="duplicate">複製</button>
      <button class="danger" data-action="delete">削除</button>`;

    contextMenu.querySelector('[data-action="edit"]').addEventListener('click', () => {
      closeContextMenu();
      openEditModal(soundId);
    });

    contextMenu.querySelector('[data-action="duplicate"]').addEventListener('click', () => {
      closeContextMenu();
      duplicateSound(soundId);
    });

    contextMenu.querySelector('[data-action="delete"]').addEventListener('click', () => {
      closeContextMenu();
      deleteSound(soundId);
    });

    document.body.appendChild(contextMenu);
  }

  function closeContextMenu() {
    if (contextMenu) { contextMenu.remove(); contextMenu = null; }
  }

  document.addEventListener('click', closeContextMenu);

  // ── サウンド操作 ──
  function findSound(id) {
    for (const g of data.groups) {
      const s = g.sounds.find(s => s.id === id);
      if (s) return s;
    }
    return null;
  }

  function findSoundGroup(id) {
    return data.groups.find(g => g.sounds.some(s => s.id === id));
  }

  function deleteSound(id) {
    const group = findSoundGroup(id);
    if (!group) return;
    group.sounds = group.sounds.filter(s => s.id !== id);
    deleteAudio(id);
    stopSound(id);
    saveData();
    render();
  }

  function duplicateSound(id) {
    const sound = findSound(id);
    const group = findSoundGroup(id);
    if (!sound || !group) return;
    const newId = genId();
    const newSound = { ...sound, id: newId, name: sound.name + ' (コピー)' };
    group.sounds.push(newSound);
    // 音声データもコピー
    loadAudio(id).then(buf => {
      if (buf) saveAudio(newId, buf);
    });
    saveData();
    render();
  }

  // ── モーダル ──
  let editingId = null;
  let selectedColor = COLORS[0];
  let pendingAudioBuffer = null;

  function initColorGrid() {
    const grid = $('color-grid');
    COLORS.forEach(c => {
      const swatch = document.createElement('div');
      swatch.className = 'color-swatch' + (c === selectedColor ? ' active' : '');
      swatch.style.background = c;
      swatch.addEventListener('click', () => {
        $$('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        selectedColor = c;
      });
      grid.appendChild(swatch);
    });
  }

  function updateGroupSelect() {
    const sel = $('snd-group');
    sel.innerHTML = '<option value="">なし（デフォルト）</option>';
    data.groups.forEach(g => {
      if (g.id === 'default') return;
      sel.innerHTML += `<option value="${g.id}">${escapeHTML(g.name)}</option>`;
    });
  }

  function openAddModal() {
    editingId = null;
    pendingAudioBuffer = null;
    $('modal-title').textContent = 'サウンド追加';
    $('snd-name').value = '';
    $('snd-file').value = '';
    $('snd-hotkey').value = '';
    selectedColor = COLORS[0];
    $$('.color-swatch').forEach((s, i) => s.classList.toggle('active', i === 0));
    updateGroupSelect();
    $('snd-group').value = '';
    $('modal-overlay').classList.remove('hidden');
  }

  function openEditModal(id) {
    const sound = findSound(id);
    if (!sound) return;
    editingId = id;
    pendingAudioBuffer = null;
    $('modal-title').textContent = 'サウンド編集';
    $('snd-name').value = sound.name;
    $('snd-file').value = '';
    $('snd-hotkey').value = sound.hotkey || '';
    selectedColor = sound.color || COLORS[0];
    $$('.color-swatch').forEach(s => s.classList.toggle('active', s.style.background === selectedColor || rgbToHex(s.style.background) === selectedColor));
    updateGroupSelect();
    const group = findSoundGroup(id);
    $('snd-group').value = group && group.id !== 'default' ? group.id : '';
    $('modal-overlay').classList.remove('hidden');
  }

  function closeModal() {
    $('modal-overlay').classList.add('hidden');
    editingId = null;
    pendingAudioBuffer = null;
  }

  function saveModal() {
    const name = $('snd-name').value.trim();
    if (!name) { alert('名前を入力してください'); return; }

    const file = $('snd-file').files[0];
    const hotkey = $('snd-hotkey').value.trim();
    const groupId = $('snd-group').value || 'default';

    if (editingId) {
      // 編集モード
      const sound = findSound(editingId);
      if (!sound) return;
      const oldGroup = findSoundGroup(editingId);
      sound.name = name;
      sound.color = selectedColor;
      sound.hotkey = hotkey;

      // グループ移動
      if (oldGroup && oldGroup.id !== groupId) {
        oldGroup.sounds = oldGroup.sounds.filter(s => s.id !== editingId);
        const newGroup = data.groups.find(g => g.id === groupId);
        if (newGroup) newGroup.sounds.push(sound);
      }

      if (file) {
        readFileAsArrayBuffer(file).then(buf => {
          saveAudio(editingId, buf);
        });
      }

      saveData();
      render();
      closeModal();
    } else {
      // 新規追加
      if (!file) { alert('音声ファイルを選択してください'); return; }

      const id = genId();
      readFileAsArrayBuffer(file).then(buf => {
        saveAudio(id, buf).then(() => {
          const targetGroup = data.groups.find(g => g.id === groupId);
          if (!targetGroup) return;
          targetGroup.sounds.push({ id, name, color: selectedColor, hotkey });
          saveData();
          render();
          closeModal();
        });
      });
    }
  }

  // ── グループモーダル ──
  function openGroupModal() {
    $('grp-name').value = '';
    $('group-modal-overlay').classList.remove('hidden');
  }

  function closeGroupModal() {
    $('group-modal-overlay').classList.add('hidden');
  }

  function saveGroup() {
    const name = $('grp-name').value.trim();
    if (!name) { alert('グループ名を入力してください'); return; }
    data.groups.push({ id: genId(), name, sounds: [] });
    saveData();
    render();
    closeGroupModal();
  }

  // ── キーボードショートカット ──
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    for (const group of data.groups) {
      for (const sound of group.sounds) {
        if (sound.hotkey && sound.hotkey.toLowerCase() === key) {
          e.preventDefault();
          if (audioCtx.state === 'suspended') audioCtx.resume();
          playSound(sound.id);
          return;
        }
      }
    }

    // ESCで全停止
    if (e.key === 'Escape') {
      stopAll();
    }
  });

  // ── エクスポート / インポート ──
  async function exportData() {
    const exportObj = {
      version: 1,
      groups: [],
    };

    for (const group of data.groups) {
      const exportGroup = { ...group, sounds: [] };
      for (const sound of group.sounds) {
        const audioBuf = await loadAudio(sound.id);
        exportGroup.sounds.push({
          ...sound,
          audioBase64: audioBuf ? arrayBufferToBase64(audioBuf) : null,
        });
      }
      exportObj.groups.push(exportGroup);
    }

    const blob = new Blob([JSON.stringify(exportObj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'stream-soundboard-backup.json';
    a.click();
  }

  async function importData(file) {
    const text = await file.text();
    let importObj;
    try {
      importObj = JSON.parse(text);
    } catch {
      alert('ファイルの読み込みに失敗しました');
      return;
    }

    if (!importObj.groups) { alert('無効なファイルです'); return; }

    // 音声データを復元
    for (const group of importObj.groups) {
      for (const sound of group.sounds) {
        if (sound.audioBase64) {
          const buf = base64ToArrayBuffer(sound.audioBase64);
          await saveAudio(sound.id, buf);
          delete sound.audioBase64;
        }
      }
    }

    data.groups = importObj.groups;
    data.masterVol = importObj.masterVol || 0.8;
    $('master-vol').value = data.masterVol;
    $('vol-val').textContent = Math.round(data.masterVol * 100) + '%';
    saveData();
    render();
  }

  // ── ユーティリティ ──
  function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function escapeHTML(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    const m = rgb.match(/\d+/g);
    if (!m || m.length < 3) return rgb;
    return '#' + m.slice(0,3).map(n => parseInt(n).toString(16).padStart(2,'0')).join('');
  }

  // ── イベント設定 ──
  function initEvents() {
    $('btn-add').addEventListener('click', openAddModal);
    $('btn-add-group').addEventListener('click', openGroupModal);
    $('btn-stop-all').addEventListener('click', stopAll);

    $('btn-modal-cancel').addEventListener('click', closeModal);
    $('btn-modal-save').addEventListener('click', saveModal);
    $('modal-overlay').addEventListener('click', (e) => { if (e.target === $('modal-overlay')) closeModal(); });

    $('btn-grp-cancel').addEventListener('click', closeGroupModal);
    $('btn-grp-save').addEventListener('click', saveGroup);
    $('group-modal-overlay').addEventListener('click', (e) => { if (e.target === $('group-modal-overlay')) closeGroupModal(); });

    $('master-vol').addEventListener('input', () => {
      data.masterVol = parseFloat($('master-vol').value);
      $('vol-val').textContent = Math.round(data.masterVol * 100) + '%';
      // 再生中の音量も更新
      for (const [, entry] of playingSources) {
        entry.gainNode.gain.value = data.masterVol;
      }
      saveData();
    });

    $('search').addEventListener('input', () => render());

    $('btn-export').addEventListener('click', exportData);
    $('btn-import').addEventListener('click', () => $('file-import').click());
    $('file-import').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) importData(file);
      e.target.value = '';
    });
  }

  // ── 初期化 ──
  openDB().then(() => {
    initColorGrid();
    initEvents();
    render();
  });
})();
