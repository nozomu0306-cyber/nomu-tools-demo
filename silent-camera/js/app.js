(function () {
  'use strict';

  // ── Elements ──
  const $ = (id) => document.getElementById(id);
  const preview      = $('preview');
  const statusEl     = $('status');
  const btnClose     = $('btn-close');
  const btnHelp      = $('btn-help');
  const btnGrid      = $('btn-grid');
  const btnTorch     = $('btn-torch');
  const btnNight     = $('btn-night');
  const btnAudio     = $('btn-audio');
  const dimRange     = $('dim-range');
  const dimOverlay   = $('dim-overlay');
  const nightOverlay = $('night-overlay');
  const gridOverlay  = $('grid-overlay');
  const zoomWrap     = $('zoom-wrap');
  const zoomRange    = $('zoom-range');
  const zoomLabel    = $('zoom-label');
  const recInd       = $('rec-indicator');
  const recTime      = $('rec-time');
  const flashHint    = $('flash-hint');
  const shutter      = $('btn-shutter');
  const btnFlip      = $('btn-flip');
  const btnGallery   = $('btn-gallery');
  const galleryThumb = $('gallery-thumb');
  const galleryPh    = $('gallery-placeholder');
  const modeBtns     = document.querySelectorAll('.mode-btn');

  const resultOverlay = $('result-overlay');
  const resultMedia   = $('result-media');
  const resultSave    = $('result-save');
  const resultShare   = $('result-share');
  const resultDelete  = $('result-delete');
  const resultTitle   = $('result-title');
  const resultClose   = $('result-close');

  const helpOverlay = $('help-overlay');
  const helpClose   = $('help-close');

  // ── State ──
  const state = {
    stream: null,
    videoTrack: null,
    audioEnabled: true,
    facing: 'environment',
    mode: 'photo', // 'photo' | 'video'
    recorder: null,
    recordedChunks: [],
    recordStartAt: 0,
    recTimer: null,
    torchOn: false,
    gridOn: false,
    nightOn: false,
    currentResult: null, // { url, blob, type, name }
    capabilities: null,
  };

  // ── Utils ──
  function setStatus(msg) { statusEl.textContent = msg; }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function ts() {
    const d = new Date();
    return d.getFullYear()
      + pad(d.getMonth() + 1)
      + pad(d.getDate()) + '-'
      + pad(d.getHours())
      + pad(d.getMinutes())
      + pad(d.getSeconds());
  }

  function pickVideoMime() {
    const tries = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const m of tries) {
      if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m;
    }
    return '';
  }

  function extFromMime(mime) {
    if (!mime) return 'bin';
    if (mime.indexOf('mp4')  >= 0) return 'mp4';
    if (mime.indexOf('webm') >= 0) return 'webm';
    if (mime.indexOf('jpeg') >= 0) return 'jpg';
    if (mime.indexOf('png')  >= 0) return 'png';
    return 'bin';
  }

  // ── Camera ──
  async function startCamera() {
    stopCamera();
    setStatus('カメラ起動中…');

    const constraints = {
      audio: false, // live preview is always silent; audio only when recording
      video: {
        facingMode: { ideal: state.facing },
        width:  { ideal: 1920 },
        height: { ideal: 1080 },
      },
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      state.stream = stream;
      state.videoTrack = stream.getVideoTracks()[0];
      preview.srcObject = stream;
      // Mirror front camera for natural self-view
      preview.style.transform = state.facing === 'user' ? 'scaleX(-1)' : 'none';

      // Query capabilities (zoom/torch)
      try {
        state.capabilities = state.videoTrack.getCapabilities
          ? state.videoTrack.getCapabilities()
          : {};
      } catch (_) { state.capabilities = {}; }

      setupZoom();
      updateTorchButton();
      setStatus('READY');
    } catch (err) {
      console.error(err);
      const msg = (err && err.name === 'NotAllowedError')
        ? 'カメラ使用が許可されていません'
        : 'カメラを起動できません';
      setStatus(msg);
      alert(msg + '\n\nHTTPS でアクセスし、設定からカメラを許可してください。');
    }
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach(t => t.stop());
    }
    state.stream = null;
    state.videoTrack = null;
  }

  // ── Zoom ──
  function setupZoom() {
    const caps = state.capabilities || {};
    if (caps.zoom) {
      zoomWrap.hidden = false;
      zoomRange.min  = caps.zoom.min;
      zoomRange.max  = caps.zoom.max;
      zoomRange.step = caps.zoom.step || 0.1;
      zoomRange.value = state.videoTrack.getSettings().zoom || caps.zoom.min;
      zoomLabel.textContent = (+zoomRange.value).toFixed(1) + 'x';
    } else {
      zoomWrap.hidden = true;
    }
  }

  zoomRange.addEventListener('input', async () => {
    if (!state.videoTrack || !state.capabilities || !state.capabilities.zoom) return;
    try {
      await state.videoTrack.applyConstraints({
        advanced: [{ zoom: parseFloat(zoomRange.value) }],
      });
      zoomLabel.textContent = (+zoomRange.value).toFixed(1) + 'x';
    } catch (e) { /* ignore */ }
  });

  // ── Torch ──
  function updateTorchButton() {
    const hasTorch = !!(state.capabilities && state.capabilities.torch);
    btnTorch.style.opacity = hasTorch ? '1' : '0.35';
    btnTorch.disabled = !hasTorch;
    btnTorch.classList.toggle('is-on', state.torchOn && hasTorch);
  }

  btnTorch.addEventListener('click', async () => {
    if (!state.videoTrack) return;
    const hasTorch = !!(state.capabilities && state.capabilities.torch);
    if (!hasTorch) {
      setStatus('このカメラはライト非対応');
      return;
    }
    state.torchOn = !state.torchOn;
    try {
      await state.videoTrack.applyConstraints({ advanced: [{ torch: state.torchOn }] });
    } catch (e) {
      state.torchOn = false;
    }
    updateTorchButton();
  });

  // ── Flip camera ──
  btnFlip.addEventListener('click', async () => {
    if (state.recorder && state.recorder.state === 'recording') return;
    state.facing = state.facing === 'user' ? 'environment' : 'user';
    await startCamera();
  });

  // ── Grid ──
  btnGrid.addEventListener('click', () => {
    state.gridOn = !state.gridOn;
    gridOverlay.hidden = !state.gridOn;
    btnGrid.classList.toggle('is-on', state.gridOn);
  });

  // ── Night mode ──
  btnNight.addEventListener('click', () => {
    state.nightOn = !state.nightOn;
    nightOverlay.hidden = !state.nightOn;
    btnNight.classList.toggle('is-on', state.nightOn);
  });

  // ── Audio toggle ──
  function updateAudioButton() {
    btnAudio.querySelector('span').textContent = state.audioEnabled ? '🎙' : '🔇';
    btnAudio.querySelector('em').textContent = state.audioEnabled ? 'MIC ON' : 'MIC OFF';
    btnAudio.classList.toggle('is-on', state.audioEnabled);
  }
  btnAudio.addEventListener('click', () => {
    state.audioEnabled = !state.audioEnabled;
    updateAudioButton();
  });
  updateAudioButton();

  // ── Dim ──
  dimRange.addEventListener('input', () => {
    dimOverlay.style.opacity = dimRange.value;
  });

  // ── Mode switch ──
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (state.recorder && state.recorder.state === 'recording') return;
      modeBtns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.mode = btn.dataset.mode;
      shutter.classList.toggle('is-video', state.mode === 'video');
    });
  });

  // ── Capture photo (silent via canvas.toBlob) ──
  async function capturePhoto() {
    if (!state.videoTrack) return;
    const track = state.videoTrack;

    let width, height, bitmap = null;
    // Prefer ImageCapture when available
    try {
      if (window.ImageCapture) {
        const ic = new ImageCapture(track);
        if (typeof ic.grabFrame === 'function') {
          bitmap = await ic.grabFrame();
          width = bitmap.width; height = bitmap.height;
        }
      }
    } catch (_) { bitmap = null; }

    const canvas = document.createElement('canvas');
    if (bitmap) {
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(bitmap, 0, 0);
    } else {
      width  = preview.videoWidth  || 1280;
      height = preview.videoHeight || 720;
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (state.facing === 'user') {
        ctx.translate(width, 0); ctx.scale(-1, 1);
      }
      ctx.drawImage(preview, 0, 0, width, height);
    }

    // Subtle visual flash (no sound)
    flashHint.classList.add('flash');
    setTimeout(() => flashHint.classList.remove('flash'), 90);

    const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
    if (!blob) { setStatus('キャプチャ失敗'); return; }

    const name = 'silent-' + ts() + '.jpg';
    handleResult(blob, 'image/jpeg', name);
  }

  // ── Record video ──
  async function startRecording() {
    if (!state.stream) return;

    let recStream = state.stream;

    // Attach audio if enabled
    if (state.audioEnabled) {
      try {
        const audio = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        const combined = new MediaStream([
          ...state.stream.getVideoTracks(),
          ...audio.getAudioTracks(),
        ]);
        recStream = combined;
        state._extraAudio = audio;
      } catch (e) {
        console.warn('audio unavailable', e);
      }
    }

    const mime = pickVideoMime();
    const opts = mime ? { mimeType: mime } : undefined;
    let rec;
    try {
      rec = new MediaRecorder(recStream, opts);
    } catch (e) {
      alert('この端末は動画録画に対応していません。'); return;
    }

    state.recorder = rec;
    state.recordedChunks = [];
    rec.ondataavailable = e => { if (e.data && e.data.size) state.recordedChunks.push(e.data); };
    rec.onstop = () => finishRecording(mime);
    rec.start(1000);

    state.recordStartAt = Date.now();
    recInd.hidden = false;
    recTime.textContent = '00:00';
    state.recTimer = setInterval(updateRecTime, 500);
    shutter.classList.add('is-recording');
    setStatus('REC');
  }

  function updateRecTime() {
    const s = Math.floor((Date.now() - state.recordStartAt) / 1000);
    recTime.textContent = pad(Math.floor(s / 60)) + ':' + pad(s % 60);
  }

  function stopRecording() {
    if (state.recorder && state.recorder.state === 'recording') {
      state.recorder.stop();
    }
  }

  function finishRecording(mime) {
    clearInterval(state.recTimer);
    state.recTimer = null;
    recInd.hidden = true;
    shutter.classList.remove('is-recording');
    setStatus('READY');

    if (state._extraAudio) {
      state._extraAudio.getTracks().forEach(t => t.stop());
      state._extraAudio = null;
    }

    const blob = new Blob(state.recordedChunks, { type: mime || 'video/mp4' });
    const ext  = extFromMime(mime);
    const name = 'silent-' + ts() + '.' + ext;
    handleResult(blob, mime || 'video/mp4', name);
    state.recorder = null;
    state.recordedChunks = [];
  }

  // ── Shutter ──
  shutter.addEventListener('click', async () => {
    if (state.mode === 'photo') {
      await capturePhoto();
    } else {
      if (state.recorder && state.recorder.state === 'recording') {
        stopRecording();
      } else {
        await startRecording();
      }
    }
  });

  // ── Result / gallery ──
  function handleResult(blob, type, name) {
    if (state.currentResult && state.currentResult.url) {
      URL.revokeObjectURL(state.currentResult.url);
    }
    const url = URL.createObjectURL(blob);
    state.currentResult = { url, blob, type, name };

    // Thumbnail
    if (type.indexOf('image/') === 0) {
      galleryThumb.src = url;
      galleryPh.style.display = 'none';
    } else {
      // extract a video frame for thumb
      const v = document.createElement('video');
      v.src = url; v.muted = true; v.playsInline = true;
      v.addEventListener('loadeddata', () => {
        try {
          const c = document.createElement('canvas');
          c.width = v.videoWidth; c.height = v.videoHeight;
          c.getContext('2d').drawImage(v, 0, 0);
          galleryThumb.src = c.toDataURL('image/jpeg', 0.7);
          galleryPh.style.display = 'none';
        } catch (_) {
          galleryThumb.removeAttribute('src');
          galleryPh.style.display = '';
        }
      });
    }
  }

  function openResult() {
    if (!state.currentResult) return;
    const { url, type, name } = state.currentResult;
    resultMedia.innerHTML = '';
    let el;
    if (type.indexOf('image/') === 0) {
      el = document.createElement('img');
      el.src = url;
      resultTitle.textContent = '写真プレビュー';
    } else {
      el = document.createElement('video');
      el.src = url; el.controls = true; el.playsInline = true;
      resultTitle.textContent = 'ビデオプレビュー';
    }
    resultMedia.appendChild(el);
    resultSave.href = url;
    resultSave.download = name;
    resultOverlay.hidden = false;
  }

  btnGallery.addEventListener('click', openResult);

  resultClose.addEventListener('click', () => {
    resultOverlay.hidden = true;
    resultMedia.innerHTML = '';
  });

  resultDelete.addEventListener('click', () => {
    if (state.currentResult && state.currentResult.url) {
      URL.revokeObjectURL(state.currentResult.url);
    }
    state.currentResult = null;
    galleryThumb.removeAttribute('src');
    galleryPh.style.display = '';
    resultOverlay.hidden = true;
    resultMedia.innerHTML = '';
  });

  resultShare.addEventListener('click', async () => {
    if (!state.currentResult) return;
    const { blob, name, type } = state.currentResult;
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); }
      catch (_) { /* cancelled */ }
    } else {
      // Fallback: trigger download
      resultSave.click();
    }
  });

  // ── Help ──
  btnHelp.addEventListener('click', () => { helpOverlay.hidden = false; });
  helpClose.addEventListener('click', () => { helpOverlay.hidden = true; });

  // ── Close ──
  btnClose.addEventListener('click', () => {
    stopCamera();
    if (history.length > 1) history.back();
    else location.href = '../';
  });

  // ── Prevent iOS double-tap zoom on controls ──
  document.addEventListener('gesturestart', e => e.preventDefault());

  // ── Wake lock (keep screen on during recording) ──
  let wakeLock = null;
  async function requestWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try { wakeLock = await navigator.wakeLock.request('screen'); } catch (_) {}
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && state.recorder && state.recorder.state === 'recording') {
      requestWakeLock();
    }
  });

  // ── Kick off ──
  startCamera();
  requestWakeLock();

})();
