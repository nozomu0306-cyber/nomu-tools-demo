/* Stream Alert Pro - Timeline Editor */

(function () {
  'use strict';

  let container = null;
  let state = null;       // reference to settings state
  let onUpdate = null;    // callback when timeline changes
  let onSelectLayer = null;

  let isPlaying = false;
  let playheadTime = 0;
  let playStartReal = 0;
  let rafId = null;
  let dragState = null;

  // ── Initialize ──
  function init(containerEl, stateRef, callbacks) {
    container = containerEl;
    state = stateRef;
    onUpdate = callbacks.onUpdate || function () {};
    onSelectLayer = callbacks.onSelectLayer || function () {};
    render();
  }

  // ── Get Current Alert Config ──
  function getAlertConfig() {
    if (!state) return null;
    const type = state.activeAlertType || 'follow';
    return state.alertTypes && state.alertTypes[type] ? state.alertTypes[type] : null;
  }

  function getDuration() {
    const cfg = getAlertConfig();
    return cfg ? cfg.duration || 4000 : 4000;
  }

  function getLayers() {
    const cfg = getAlertConfig();
    return cfg ? (cfg.layers || []) : [];
  }

  // ── Render Timeline ──
  function render() {
    if (!container) return;
    const layers = getLayers();
    const duration = getDuration();

    if (layers.length === 0) {
      container.innerHTML = '<div class="timeline-empty">レイヤーを追加してタイムラインを編集</div>';
      return;
    }

    const trackAreaWidth = container.offsetWidth - 100; // minus label width

    let html = '';

    // Ruler
    html += '<div class="timeline-ruler">';
    const tickInterval = duration <= 3000 ? 500 : 1000;
    for (let t = 0; t <= duration; t += tickInterval) {
      const left = (t / duration * 100) + '%';
      const isMajor = t % 1000 === 0;
      html += '<div class="ruler-tick' + (isMajor ? ' major' : '') + '" style="left:' + left + '"></div>';
      if (isMajor) {
        html += '<div class="ruler-label" style="left:' + left + '">' + (t / 1000).toFixed(1) + 's</div>';
      }
    }
    html += '</div>';

    // Tracks
    html += '<div class="timeline-tracks">';
    const typeIcons = { text: '📝', emoji: '😀', shape: '◆', particle: '✨' };
    const activeIdx = state ? state.activeLayerIndex : 0;

    layers.forEach(function (layer, i) {
      const barLeft = (layer.startTime || 0) / duration * 100;
      const barWidth = ((layer.endTime || duration) - (layer.startTime || 0)) / duration * 100;
      const isActive = i === activeIdx;

      html += '<div class="timeline-track" data-layer-index="' + i + '">';
      html += '<div class="track-label' + (isActive ? ' active' : '') + '" data-layer-index="' + i + '">';
      html += '<span class="track-type-icon">' + (typeIcons[layer.type] || '📝') + '</span>';
      html += '<span>' + escapeHTML(layer.name || layer.type) + '</span>';
      html += '</div>';
      html += '<div class="track-area">';
      html += '<div class="track-bar bar-' + layer.type + (isActive ? ' active' : '') + '" '
        + 'data-layer-index="' + i + '" '
        + 'style="left:' + barLeft + '%;width:' + Math.max(barWidth, 2) + '%;">';
      html += '<div class="track-handle handle-left" data-layer-index="' + i + '" data-handle="left"></div>';
      html += '<div class="track-handle handle-right" data-layer-index="' + i + '" data-handle="right"></div>';

      // Keyframe markers
      if (layer.keyframes) {
        layer.keyframes.forEach(function (kf, ki) {
          const kfLeft = ((kf.time - (layer.startTime || 0)) / ((layer.endTime || duration) - (layer.startTime || 0))) * 100;
          html += '<div class="keyframe-marker" style="left:' + kfLeft + '%" data-kf-index="' + ki + '"></div>';
        });
      }

      html += '</div>'; // track-bar
      html += '</div>'; // track-area
      html += '</div>'; // timeline-track
    });

    // Playhead
    html += '<div class="timeline-playhead" id="tl-playhead" style="left:0%"></div>';
    html += '</div>'; // timeline-tracks

    // Controls
    html += '<div class="timeline-controls">';
    html += '<button class="tl-play-btn' + (isPlaying ? ' active' : '') + '" id="tl-btn-play" title="再生">▶</button>';
    html += '<button class="tl-play-btn" id="tl-btn-stop" title="停止">■</button>';
    html += '<span class="tl-time-display" id="tl-time">0.0s / ' + (duration / 1000).toFixed(1) + 's</span>';
    html += '<div class="tl-duration">';
    html += '<span>長さ</span>';
    html += '<input type="number" id="tl-duration-input" value="' + (duration / 1000) + '" min="1" max="15" step="0.5">s';
    html += '</div>';
    html += '</div>';

    container.innerHTML = html;
    bindEvents();
  }

  // ── Bind Events ──
  function bindEvents() {
    if (!container) return;

    // Track label click → select layer
    container.querySelectorAll('.track-label').forEach(function (el) {
      el.addEventListener('click', function () {
        const idx = parseInt(el.dataset.layerIndex, 10);
        if (onSelectLayer) onSelectLayer(idx);
        render();
      });
    });

    // Track bar click → select layer
    container.querySelectorAll('.track-bar').forEach(function (el) {
      el.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('track-handle')) return;
        const idx = parseInt(el.dataset.layerIndex, 10);
        if (onSelectLayer) onSelectLayer(idx);

        // Start drag (move entire bar)
        startDrag(e, idx, 'move');
      });
    });

    // Handle drags
    container.querySelectorAll('.track-handle').forEach(function (el) {
      el.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        const idx = parseInt(el.dataset.layerIndex, 10);
        const handle = el.dataset.handle;
        if (onSelectLayer) onSelectLayer(idx);
        startDrag(e, idx, 'resize-' + handle);
      });
    });

    // Play button
    var playBtn = container.querySelector('#tl-btn-play');
    if (playBtn) playBtn.addEventListener('click', togglePlay);

    // Stop button
    var stopBtn = container.querySelector('#tl-btn-stop');
    if (stopBtn) stopBtn.addEventListener('click', stop);

    // Duration input
    var durInput = container.querySelector('#tl-duration-input');
    if (durInput) {
      durInput.addEventListener('change', function () {
        var cfg = getAlertConfig();
        if (cfg) {
          cfg.duration = Math.max(1000, Math.min(15000, parseFloat(durInput.value) * 1000));
          onUpdate();
          render();
        }
      });
    }
  }

  // ── Drag Logic ──
  function startDrag(e, layerIndex, dragType) {
    const layers = getLayers();
    const layer = layers[layerIndex];
    if (!layer) return;

    const trackArea = e.target.closest('.track-area') || container.querySelector('.track-area');
    const trackWidth = trackArea ? trackArea.offsetWidth : 400;
    const duration = getDuration();

    dragState = {
      type: dragType,
      layerIndex: layerIndex,
      startX: e.clientX,
      origStart: layer.startTime || 0,
      origEnd: layer.endTime || duration,
      trackWidth: trackWidth,
      duration: duration,
    };

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    e.preventDefault();
  }

  function onDragMove(e) {
    if (!dragState) return;
    const dx = e.clientX - dragState.startX;
    const dtMs = (dx / dragState.trackWidth) * dragState.duration;
    const layers = getLayers();
    const layer = layers[dragState.layerIndex];
    if (!layer) return;

    if (dragState.type === 'move') {
      const newStart = Math.max(0, Math.min(dragState.duration - (dragState.origEnd - dragState.origStart), dragState.origStart + dtMs));
      const barDuration = dragState.origEnd - dragState.origStart;
      layer.startTime = Math.round(newStart);
      layer.endTime = Math.round(newStart + barDuration);
    } else if (dragState.type === 'resize-left') {
      const newStart = Math.max(0, Math.min(dragState.origEnd - 200, dragState.origStart + dtMs));
      layer.startTime = Math.round(newStart);
    } else if (dragState.type === 'resize-right') {
      const newEnd = Math.max(dragState.origStart + 200, Math.min(dragState.duration, dragState.origEnd + dtMs));
      layer.endTime = Math.round(newEnd);
    }

    // Update bar visually without full re-render
    const bar = container.querySelector('.track-bar[data-layer-index="' + dragState.layerIndex + '"]');
    if (bar) {
      const barLeft = layer.startTime / dragState.duration * 100;
      const barWidth = (layer.endTime - layer.startTime) / dragState.duration * 100;
      bar.style.left = barLeft + '%';
      bar.style.width = Math.max(barWidth, 2) + '%';
    }
  }

  function onDragEnd() {
    if (dragState) {
      onUpdate();
      dragState = null;
    }
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    render();
  }

  // ── Playback ──
  function togglePlay() {
    if (isPlaying) { pause(); } else { play(); }
  }

  function play() {
    isPlaying = true;
    playStartReal = performance.now() - playheadTime;

    // Send play command to preview iframe
    sendToPreview({ type: 'trigger', alertType: state.activeAlertType || 'follow',
      username: 'テスト', amount: '500', message: 'テストメッセージ', viewers: '10' });

    tick();
    render();
  }

  function pause() {
    isPlaying = false;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    render();
  }

  function stop() {
    isPlaying = false;
    playheadTime = 0;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    updatePlayhead();
    render();
  }

  function tick() {
    if (!isPlaying) return;
    playheadTime = performance.now() - playStartReal;
    const duration = getDuration();

    if (playheadTime >= duration) {
      playheadTime = 0;
      isPlaying = false;
      updatePlayhead();
      render();
      return;
    }

    updatePlayhead();
    rafId = requestAnimationFrame(tick);
  }

  function updatePlayhead() {
    const playhead = container ? container.querySelector('#tl-playhead') : null;
    const timeDisplay = container ? container.querySelector('#tl-time') : null;
    const duration = getDuration();

    if (playhead) {
      playhead.style.left = (playheadTime / duration * 100) + '%';
    }
    if (timeDisplay) {
      timeDisplay.textContent = (playheadTime / 1000).toFixed(1) + 's / ' + (duration / 1000).toFixed(1) + 's';
    }
  }

  function sendToPreview(data) {
    var iframe = document.getElementById('preview-frame');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(data, '*');
    }
  }

  // ── Utils ──
  function escapeHTML(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ── Expose API ──
  window.TimelineEditor = {
    init: init,
    render: render,
    play: play,
    pause: pause,
    stop: stop,
    isPlaying: function () { return isPlaying; },
  };

})();
