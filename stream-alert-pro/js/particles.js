/* Stream Alert Pro - Particle System */

(function () {
  'use strict';

  const container = document.getElementById('particles-container');
  let particles = [];
  let rafId = null;

  // ── Particle Types ──
  const PARTICLE_TYPES = {
    confetti: { className: 'particle-confetti', minSize: 6, maxSize: 12, gravity: 0.15, rotates: true },
    sparkle:  { className: 'particle-sparkle',  minSize: 3, maxSize: 8,  gravity: 0.02, rotates: false },
    firework: { className: 'particle-sparkle',  minSize: 2, maxSize: 6,  gravity: 0.08, rotates: false },
    hearts:   { className: 'particle-heart',    minSize: 10, maxSize: 20, gravity: -0.03, rotates: false },
    stars:    { className: 'particle-star',     minSize: 8, maxSize: 16, gravity: 0.05, rotates: true },
    emoji:    { className: 'particle-emoji',    minSize: 16, maxSize: 32, gravity: 0.1, rotates: true },
  };

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function randomColor(colors) {
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ── Create Single Particle ──
  function createParticle(config, originX, originY) {
    const type = PARTICLE_TYPES[config.particleType] || PARTICLE_TYPES.confetti;
    const size = randomRange(config.sizeMin || type.minSize, config.sizeMax || type.maxSize);
    const angle = randomRange(0, (config.spread || 360)) * Math.PI / 180;
    const speed = randomRange(1, config.speed || 5);

    const el = document.createElement('div');
    el.className = 'particle ' + type.className;

    if (config.particleType === 'emoji') {
      el.textContent = config.emoji || '🎉';
      el.style.fontSize = size + 'px';
    } else {
      el.style.width = size + 'px';
      el.style.height = config.particleType === 'confetti' ? (size * 0.6) + 'px' : size + 'px';
      el.style.backgroundColor = randomColor(config.colors || ['#ff6ec7', '#7873f5', '#00aaff', '#ffd700', '#00ff88']);
    }

    const p = {
      el: el,
      x: originX,
      y: originY,
      vx: Math.cos(angle - Math.PI / 2) * speed,
      vy: Math.sin(angle - Math.PI / 2) * speed,
      gravity: type.gravity * (config.gravity != null ? config.gravity : 1),
      rotation: 0,
      rotationSpeed: type.rotates ? randomRange(-5, 5) : 0,
      opacity: 1,
      lifetime: config.lifetime || 2000,
      born: performance.now(),
      size: size,
    };

    el.style.left = p.x + 'px';
    el.style.top = p.y + 'px';
    container.appendChild(el);
    return p;
  }

  // ── Burst: One-shot particle emission ──
  function burst(config) {
    if (!container) return;
    const count = config.count || 30;
    const cx = config.originX != null ? config.originX : container.offsetWidth / 2;
    const cy = config.originY != null ? config.originY : container.offsetHeight / 2;

    for (let i = 0; i < count; i++) {
      particles.push(createParticle(config, cx, cy));
    }

    if (!rafId) tick();
  }

  // ── Stream: Continuous particle emission ──
  let streamIntervals = [];

  function startStream(config) {
    if (!container) return;
    const interval = setInterval(() => {
      const cx = config.originX != null ? config.originX : randomRange(0, container.offsetWidth);
      const cy = config.originY != null ? config.originY : 0;
      particles.push(createParticle(config, cx, cy));
    }, Math.max(50, (config.lifetime || 2000) / (config.count || 30)));

    streamIntervals.push(interval);
    if (!rafId) tick();
    return interval;
  }

  function stopStream(intervalId) {
    clearInterval(intervalId);
    streamIntervals = streamIntervals.filter(id => id !== intervalId);
  }

  function stopAllStreams() {
    streamIntervals.forEach(id => clearInterval(id));
    streamIntervals = [];
  }

  // ── Animation Loop ──
  function tick() {
    const now = performance.now();
    let alive = false;

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.born;

      if (age >= p.lifetime) {
        p.el.remove();
        particles.splice(i, 1);
        continue;
      }

      alive = true;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.opacity = Math.max(0, 1 - (age / p.lifetime) * 0.8);

      p.el.style.transform = 'translate(' + p.x + 'px,' + p.y + 'px) rotate(' + p.rotation + 'deg)';
      p.el.style.opacity = p.opacity;
    }

    if (alive || streamIntervals.length > 0) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  // ── Clear All ──
  function clearAll() {
    stopAllStreams();
    particles.forEach(p => p.el.remove());
    particles = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  // ── Expose Global API ──
  window.AlertParticles = {
    burst: burst,
    startStream: startStream,
    stopStream: stopStream,
    stopAllStreams: stopAllStreams,
    clearAll: clearAll,
    TYPES: Object.keys(PARTICLE_TYPES),
  };

})();
