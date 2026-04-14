/* Stream Alert Pro - Audio Manager
   IndexedDB for storage, AudioContext for playback */

(function () {
  'use strict';

  var DB_NAME = 'StreamAlertProAudio';
  var DB_VERSION = 1;
  var STORE_NAME = 'sounds';
  var db = null;
  var audioCtx = null;
  var currentSource = null;

  // ── Open IndexedDB ──
  function openDB() {
    return new Promise(function (resolve, reject) {
      if (db) { resolve(db); return; }
      var req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = function (e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains(STORE_NAME)) {
          d.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      req.onsuccess = function (e) { db = e.target.result; resolve(db); };
      req.onerror = function (e) { reject(e.target.error); };
    });
  }

  // ── Save sound to IndexedDB ──
  function saveSound(id, name, arrayBuffer, mimeType) {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.put({ id: id, name: name, data: arrayBuffer, mime: mimeType, created: Date.now() });
        tx.oncomplete = function () { resolve(id); };
        tx.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  // ── Load sound from IndexedDB ──
  function loadSound(id) {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.get(id);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  // ── Delete sound from IndexedDB ──
  function deleteSound(id) {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readwrite');
        var store = tx.objectStore(STORE_NAME);
        store.delete(id);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  // ── List all sounds ──
  function listSounds() {
    return openDB().then(function (d) {
      return new Promise(function (resolve, reject) {
        var tx = d.transaction(STORE_NAME, 'readonly');
        var store = tx.objectStore(STORE_NAME);
        var req = store.getAll();
        req.onsuccess = function () {
          resolve((req.result || []).map(function (s) {
            return { id: s.id, name: s.name, mime: s.mime, created: s.created };
          }));
        };
        req.onerror = function (e) { reject(e.target.error); };
      });
    });
  }

  // ── Get AudioContext (lazy init) ──
  function getAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // ── Play sound by ID ──
  function playSound(id, options) {
    options = options || {};
    var volume = options.volume != null ? options.volume : 0.8;
    var fadeIn = options.fadeIn || 0;
    var fadeOut = options.fadeOut || 0;
    var delay = options.delay || 0;

    return loadSound(id).then(function (record) {
      if (!record || !record.data) return null;
      var ctx = getAudioCtx();

      return ctx.decodeAudioData(record.data.slice(0)).then(function (buffer) {
        // Stop previous sound
        stopCurrent();

        var source = ctx.createBufferSource();
        source.buffer = buffer;

        var gainNode = ctx.createGain();
        source.connect(gainNode);
        gainNode.connect(ctx.destination);

        var startTime = ctx.currentTime + delay / 1000;
        var duration = buffer.duration;

        // Volume & fade
        if (fadeIn > 0) {
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(volume, startTime + fadeIn / 1000);
        } else {
          gainNode.gain.setValueAtTime(volume, startTime);
        }

        if (fadeOut > 0) {
          var fadeOutStart = startTime + duration - fadeOut / 1000;
          if (fadeOutStart > startTime) {
            gainNode.gain.setValueAtTime(volume, fadeOutStart);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
          }
        }

        source.start(startTime);
        currentSource = { source: source, gainNode: gainNode };

        source.onended = function () {
          if (currentSource && currentSource.source === source) currentSource = null;
        };

        return source;
      });
    });
  }

  // ── Stop current playback ──
  function stopCurrent() {
    if (currentSource) {
      try { currentSource.source.stop(); } catch (e) { /* already stopped */ }
      currentSource = null;
    }
  }

  // ── Upload from File ──
  function uploadFromFile(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        var id = 'snd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
        saveSound(id, file.name, reader.result, file.type).then(function () {
          resolve({ id: id, name: file.name, mime: file.type });
        }).catch(reject);
      };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsArrayBuffer(file);
    });
  }

  // ── Export sound as base64 ──
  function exportSound(id) {
    return loadSound(id).then(function (record) {
      if (!record) return null;
      var bytes = new Uint8Array(record.data);
      var binary = '';
      for (var i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      return {
        id: record.id,
        name: record.name,
        mime: record.mime,
        data: btoa(binary),
      };
    });
  }

  // ── Import sound from base64 ──
  function importSound(exported) {
    var binary = atob(exported.data);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return saveSound(exported.id, exported.name, bytes.buffer, exported.mime);
  }

  // ── Expose Global API ──
  window.AlertAudio = {
    saveSound: saveSound,
    loadSound: loadSound,
    deleteSound: deleteSound,
    listSounds: listSounds,
    playSound: playSound,
    stopCurrent: stopCurrent,
    uploadFromFile: uploadFromFile,
    exportSound: exportSound,
    importSound: importSound,
  };

})();
