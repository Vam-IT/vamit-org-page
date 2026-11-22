// Hero scene: loose, hand-made ("ClickOps") resources are scanned, snap into an
// ordered platform below the VAMIT cloud, and then keep running.
//
// Plain Canvas 2D with a small orthographic 3D projection, no library.
// - animates only while visible, at 30 fps on touch devices
// - static final frame with prefers-reduced-motion
// - pause button, required for motion longer than 5 s (WCAG 2.2.2)
(function () {
  const root = document.getElementById('heroScene');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const toggle = root.querySelector('button');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const TAU = Math.PI * 2;
  const RISE = 0.84; // screen height of one unit of z
  const TILT = 0.52; // screen height of one unit of depth
  const SETTLED = 5; // seconds until everything is in place

  // RGB, matching the tokens in styles.css
  const CYAN = [0, 245, 255];
  const AMBER = [224, 161, 63];
  const INK = [13, 20, 33];
  const PANEL = [26, 37, 54];
  const EDGE = [62, 82, 110];
  const WHITE = [224, 227, 229];
  const GREEN = [88, 196, 154];

  const clamp = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, p) => a + (b - a) * p;
  const mix = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
  const rgba = (c, alpha = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${alpha})`;
  const smooth = (p) => p * p * (3 - 2 * p);
  // ease-out with a slight overshoot, so blocks "click" into place
  const snap = (p) => 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2);

  // x, y, height, kind, then where the block floats before it is sorted
  const blocks = [
    [-2.15, -2.15, 1.45, 'server', -0.9, 1.2, 0.9, 0.7],
    [0, -2.3, 1.0, 'database', 0.9, -0.2, 1.6, -0.5],
    [2.15, -2.15, 1.7, 'server', 0.7, 0.3, 0.4, 1.1],
    [-2.3, 0, 0.8, 'container', -0.6, 0.9, 2.0, -0.9],
    [2.3, 0, 1.0, 'database', 0.5, 0.9, 1.3, 0.4],
    [-2.15, 2.15, 1.2, 'server', 0.7, 0.8, 0.6, -0.6],
    [0, 2.3, 0.8, 'container', -0.4, -0.9, 1.7, 0.8],
    [2.15, 2.15, 1.3, 'server', -0.3, 0.5, 1.0, -1.2]
  ].map(([x, y, height, kind, dx, dy, dz, turn], i) => ({
    x, y, height, kind, dx, dy, dz, turn, i, start: 1.1 + i * 0.3
  }));

  // Outline of the cloud: four arcs on a flat base
  const cloud = new Path2D();
  cloud.moveTo(-1.35, 0.62);
  cloud.bezierCurveTo(-2.0, 0.62, -2.15, -0.28, -1.48, -0.4);
  cloud.bezierCurveTo(-1.56, -1.02, -0.86, -1.3, -0.5, -0.86);
  cloud.bezierCurveTo(-0.18, -1.55, 1.0, -1.45, 1.05, -0.5);
  cloud.bezierCurveTo(1.95, -0.62, 2.15, 0.62, 1.35, 0.62);
  cloud.closePath();

  const logo = new Image();
  logo.addEventListener('load', () => draw());
  logo.src = canvas.dataset.logo;

  // Pre-rendered glow, much cheaper than shadowBlur on phones
  const glow = document.createElement('canvas');
  glow.width = glow.height = 64;
  const glowCtx = glow.getContext('2d');
  if (glowCtx) {
    const g = glowCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, rgba(CYAN, 0.9));
    g.addColorStop(0.2, rgba(CYAN, 0.3));
    g.addColorStop(1, rgba(CYAN, 0));
    glowCtx.fillStyle = g;
    glowCtx.fillRect(0, 0, 64, 64);
  }

  let width = 0;
  let height = 0;
  let dpr = 1;
  let scale = 1;
  let originX = 0;
  let originY = 0;
  let cos = 1;
  let sin = 0;
  let time = 0;
  let pointer = 0;
  let pointerTarget = 0;

  const project = (x, y, z) => [
    originX + (x * cos - y * sin) * scale,
    originY + ((x * sin + y * cos) * TILT - z * RISE) * scale
  ];

  function trace(points) {
    ctx.beginPath();
    points.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  }

  function polygon(points, fill, stroke) {
    trace(points);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function line(points, stroke) {
    trace(points);
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }

  function spark(point, size, alpha) {
    const s = size * scale;
    ctx.globalAlpha = alpha;
    ctx.drawImage(glow, point[0] - s / 2, point[1] - s / 2, s, s);
    ctx.globalAlpha = 1;
  }

  function corners(x, y, half, angle) {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    return [[-half, -half], [half, -half], [half, half], [-half, half]]
      .map(([a, b]) => [x + a * c - b * s, y + a * s + b * c]);
  }

  // A prism standing on the points in `base`. `decorate` gets each visible side.
  function prism(base, z, tall, colors, decorate) {
    for (let i = 0; i < base.length; i++) {
      const a = base[i];
      const b = base[(i + 1) % base.length];
      const nx = b[1] - a[1];
      const ny = a[0] - b[0];
      if (nx * sin + ny * cos <= 0) continue; // faces away from the viewer

      const light = clamp(0.5 + (nx * cos - ny * sin) / Math.hypot(nx, ny) * 0.5);
      polygon([
        project(a[0], a[1], z), project(b[0], b[1], z),
        project(b[0], b[1], z + tall), project(a[0], a[1], z + tall)
      ], rgba(mix(colors.dark, colors.side, light)), colors.edge);

      if (decorate) {
        decorate((u, v) => project(lerp(a[0], b[0], u), lerp(a[1], b[1], u), z + tall * v), i);
      }
    }
    polygon(base.map((p) => project(p[0], p[1], z + tall)), colors.top, colors.edge);
  }

  function drawPlatform(order) {
    const base = corners(0, 0, 3.35, 0);
    prism(base, -0.32, 0.32, {
      dark: INK,
      side: mix(INK, PANEL, 0.9),
      top: rgba(mix(INK, PANEL, 0.55), 0.96),
      edge: rgba(mix(EDGE, CYAN, order * 0.35))
    });

    for (let v = -3; v <= 3; v++) {
      line([project(v, -3.35, 0), project(v, 3.35, 0)], rgba(EDGE, 0.28));
      line([project(-3.35, v, 0), project(3.35, v, 0)], rgba(EDGE, 0.28));
    }

    if (!order) return;
    ctx.setLineDash([4, 5]);
    polygon(corners(0, 0, 3.05, 0).map((p) => project(p[0], p[1], 0)), null, rgba(CYAN, 0.3 * order));
    ctx.setLineDash([]);
  }

  function drawScan() {
    const p = (time - 0.6) / 3.4;
    if (p <= 0 || p >= 1) return;
    const x = lerp(-3.5, 3.5, smooth(p));
    const alpha = Math.sin(p * Math.PI);
    polygon([
      project(x, -3.5, 0), project(x, 3.5, 0), project(x, 3.5, 2.3), project(x, -3.5, 2.3)
    ], rgba(AMBER, 0.07 * alpha), rgba(AMBER, 0.55 * alpha));
  }

  function drawCables() {
    blocks.forEach((b) => {
      const live = clamp((time - b.start - 0.9) / 0.6);
      if (!live) return;

      // right-angled cable from the hub to the block
      const bend = [b.x, 0];
      const first = Math.abs(b.x);
      const total = first + Math.abs(b.y);
      const reach = (d) => (d < first
        ? project(lerp(0, b.x, d / first), 0, 0.02)
        : project(b.x, Math.sign(b.y) * (d - first), 0.02));

      const points = [project(0, 0, 0.02)];
      if (total * live > first) points.push(project(bend[0], bend[1], 0.02));
      points.push(reach(total * live));
      line(points, rgba(CYAN, 0.38));

      if (live < 1) return;
      let p = (time * 0.42 + b.i * 0.37) % 1;
      if (b.i % 2) p = 1 - p; // traffic runs in both directions
      spark(reach(total * p), 0.65, 1);
    });
  }

  function drawHub(order) {
    prism(corners(0, 0, 0.58, 0), 0, 0.22, {
      dark: INK,
      side: PANEL,
      top: rgba(mix(PANEL, CYAN, 0.35 * order)),
      edge: rgba(mix(EDGE, CYAN, order))
    });
    spark(project(0, 0, 0.22), 1.7 + Math.sin(time * 2.2) * 0.2, 0.7 * order);
  }

  function blockState(b) {
    const raw = clamp((time - b.start) / 1.1);
    const p = raw === 1 ? 1 : snap(raw);
    const loose = 1 - p;
    const x = b.x + b.dx * loose;
    const y = b.y + b.dy * loose;
    const bob = Math.sin(time * 1.4 + b.i) * 0.12;
    return {
      b,
      raw,
      x,
      y,
      z: Math.max(0, (b.dz + bob) * loose),
      angle: b.turn * loose,
      depth: x * sin + y * cos
    };
  }

  function drawBlock({ b, raw, x, y, z, angle }) {
    const tone = mix(AMBER, CYAN, smooth(raw));
    const colors = {
      dark: mix(INK, tone, 0.07),
      side: mix(PANEL, tone, 0.16),
      top: rgba(mix(PANEL, tone, 0.36)),
      edge: rgba(tone, 0.8)
    };
    const half = b.kind === 'container' ? 0.65 : 0.55;

    if (z > 0.1) {
      // drop line and footprint: where the block is going to land
      ctx.setLineDash([2, 4]);
      line([project(x, y, 0), project(x, y, z)], rgba(tone, 0.4));
      polygon(corners(b.x, b.y, half, 0).map((p) => project(p[0], p[1], 0)), null, rgba(tone, 0.3));
      ctx.setLineDash([]);
    }

    if (b.kind === 'database') {
      const ring = [];
      for (let i = 0; i < 20; i++) {
        const a = angle + i / 20 * TAU;
        ring.push([x + Math.cos(a) * 0.6, y + Math.sin(a) * 0.6]);
      }
      const stripe = rgba(tone, 0.75);
      prism(ring, z, b.height, { ...colors, edge: null }, (at) => {
        [0, 0.36, 0.7, 1].forEach((v) => line([at(0, v), at(1, v)], stripe));
      });
      return;
    }

    prism(corners(x, y, half, angle), z, b.height, colors, (at, face) => {
      if (b.kind === 'container') {
        for (let u = 0.18; u < 0.9; u += 0.16) line([at(u, 0.18), at(u, 0.82)], rgba(tone, 0.45));
        return;
      }
      const rows = Math.round(b.height / 0.3);
      for (let r = 0; r < rows; r++) {
        const v = (r + 0.5) / rows;
        line([at(0.14, v), at(0.64, v)], rgba(tone, 0.4));
        const on = raw === 1 && Math.sin(time * (2 + r * 0.7) + b.i * 2 + face) > -0.6;
        const led = at(0.8, v);
        const size = Math.max(1.2, scale * 0.045);
        ctx.fillStyle = rgba(raw < 1 ? AMBER : on ? GREEN : EDGE);
        ctx.fillRect(led[0] - size / 2, led[1] - size / 2, size, size);
      }
    });
  }

  function drawUplink(order, cloudZ) {
    if (!order) return;
    const from = project(0, 0, 0.22);
    const to = project(0, 0, cloudZ - 0.65);
    const beam = ctx.createLinearGradient(0, from[1], 0, to[1]);
    beam.addColorStop(0, rgba(CYAN, 0.2 * order));
    beam.addColorStop(1, rgba(CYAN, 0.02));
    polygon([
      [from[0] - 0.22 * scale, from[1]], [from[0] + 0.22 * scale, from[1]],
      [to[0] + 0.5 * scale, to[1]], [to[0] - 0.5 * scale, to[1]]
    ], beam);

    for (let i = 0; i < 4; i++) {
      let p = (time * 0.35 + i / 4) % 1;
      const alpha = Math.sin(p * Math.PI) * order;
      if (i % 2) p = 1 - p;
      spark(project(i % 2 ? 0.12 : -0.12, 0, lerp(0.3, cloudZ - 0.7, p)), 0.6, alpha);
    }
  }

  function drawCloud(order, cloudZ) {
    const [x, y] = project(0, 0, cloudZ);
    const depthX = 0.025 + pointer * 0.025;

    ctx.globalAlpha = 0.12 + order * 0.14;
    ctx.drawImage(glow, x - 3 * scale, y - 1.65 * scale, 6 * scale, 3.3 * scale);
    ctx.globalAlpha = 1;
    for (let i = 10; i >= 0; i--) {
      ctx.save();
      ctx.translate(x + i * depthX * scale, y + i * 0.022 * scale);
      ctx.scale(scale, scale);
      ctx.lineWidth = 1.4 / scale;
      if (i) {
        ctx.fillStyle = rgba(mix(INK, CYAN, 0.08 + (10 - i) * 0.012));
        ctx.fill(cloud);
        if (i === 10) {
          ctx.strokeStyle = rgba(CYAN, 0.35);
          ctx.stroke(cloud);
        }
      } else {
        const face = ctx.createLinearGradient(0, -1.3, 0, 0.62);
        face.addColorStop(0, rgba(mix(PANEL, CYAN, 0.28)));
        face.addColorStop(1, rgba(mix(INK, CYAN, 0.06)));
        ctx.fillStyle = face;
        ctx.fill(cloud);
        ctx.strokeStyle = rgba(mix(WHITE, CYAN, 0.5 + order * 0.5), 0.9);
        ctx.stroke(cloud);
        if (logo.complete && logo.naturalWidth) ctx.drawImage(logo, -0.64, -0.64, 1.28, 0.864);
      }
      ctx.restore();
    }
  }

  function draw() {
    if (!width || !height) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const yaw = Math.PI / 4 + Math.sin(time * 0.17) * 0.13 + pointer * 0.2;
    cos = Math.cos(yaw);
    sin = Math.sin(yaw);
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';

    const order = smooth(clamp((time - 3.4) / (SETTLED - 3.4)));
    const cloudZ = 4.9 + Math.sin(time * 0.9) * 0.1;
    const items = blocks.map(blockState).sort((a, b) => a.depth - b.depth);

    drawPlatform(order);
    drawCables();
    // back to front: blocks behind the hub, hub and uplink, blocks in front
    items.filter((s) => s.depth < 0).forEach(drawBlock);
    drawHub(order);
    drawUplink(order, cloudZ);
    items.filter((s) => s.depth >= 0).forEach(drawBlock);
    drawScan();
    drawCloud(order, cloudZ);
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (w === width && h === height && ratio === dpr) return;
    width = w;
    height = h;
    dpr = ratio;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    scale = Math.min(w / 10, h / 8.9);
    originX = w / 2;
    originY = h / 2 + 1.38 * scale; // cloud and platform centered together
    draw(); // resizing clears the canvas
  }

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  const interval = touch ? 1000 / 30 : 1000 / 60;
  let frame = 0;
  let last = null;
  let inView = !('IntersectionObserver' in window);
  let paused = false;

  function tick(now) {
    frame = requestAnimationFrame(tick);
    if (last === null) last = now;
    const elapsed = now - last;
    if (elapsed < interval - 2) return;
    last = now;
    // capped, so the story doesn't jump after a slow frame
    time += Math.min(elapsed, 100) / 1000;
    pointer += (pointerTarget - pointer) * 0.07;
    draw();
  }

  function update() {
    cancelAnimationFrame(frame);
    last = null;
    toggle.hidden = motion.matches;
    if (motion.matches) {
      time = Math.max(time, SETTLED + 1);
      pointer = 0;
      draw();
      return;
    }
    if (inView && !paused && !document.hidden) frame = requestAnimationFrame(tick);
  }

  toggle.addEventListener('click', () => {
    paused = !paused;
    root.classList.toggle('is-paused', paused);
    toggle.setAttribute('aria-label', paused ? toggle.dataset.play : toggle.dataset.pause);
    update();
  });

  if (!touch) {
    const hero = root.closest('.hero-wrap');
    hero.addEventListener('pointermove', (event) => {
      pointerTarget = event.clientX / window.innerWidth * 2 - 1;
    });
    hero.addEventListener('pointerleave', () => { pointerTarget = 0; });
  }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  if ('IntersectionObserver' in window) {
    // On phones the scene sits below the buttons: the story starts once it's seen.
    new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      update();
    }, { threshold: 0.2 }).observe(root);
  }

  document.addEventListener('visibilitychange', update);
  motion.addEventListener('change', update);

  if (motion.matches) time = SETTLED + 1;
  resize();
  update();
})();
