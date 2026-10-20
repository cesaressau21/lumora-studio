// Hero light stage: the Lumora symbol as a tiny relighting scene. The three modules become a
// height map, its normals give per-pixel diffuse shading, and a short march toward the light
// gives screen-space shadows. The sphere of light can be dragged or moved with the keyboard.
(() => {
  const canvas = document.getElementById('light-stage');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Scene in symbol units (the symbol is 56 x 56), framed with a margin around it.
  const N = 240;                 // simulation resolution in pixels
  const VIEW = 104;              // symbol units visible across the canvas
  const ORIGIN = (VIEW - 56) / 2;
  const UNIT = N / VIEW;         // pixels per symbol unit
  const HEIGHT = 7;              // module height
  const BEVEL = 3.5;
  const HOME = { x: 36, y: 20, z: 18 };
  const LIGHT_R = 11;

  const INK = [17, 17, 19];
  const MODULE_DARK = [34, 34, 39];
  const LIGHT_RGB = [206, 199, 255];

  const toUnits = (px) => px / UNIT - ORIGIN;

  function sdRoundRect(px, py, cx, cy, half, r) {
    const qx = Math.abs(px - cx) - (half - r);
    const qy = Math.abs(py - cy) - (half - r);
    const ox = Math.max(qx, 0), oy = Math.max(qy, 0);
    return Math.hypot(ox, oy) + Math.min(Math.max(qx, qy), 0) - r;
  }

  function sdSymbol(x, y) {
    const modules = Math.min(
      sdRoundRect(x, y, 13, 13, 13, 3),
      sdRoundRect(x, y, 13, 43, 13, 3),
      sdRoundRect(x, y, 43, 43, 13, 3),
    );
    const halo = Math.hypot(x - 36, y - 20) - 15;
    return Math.max(modules, -halo);
  }

  // Height map and normals, computed once.
  const height = new Float32Array(N * N);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const inside = -sdSymbol(toUnits(i + 0.5), toUnits(j + 0.5));
      const t = Math.min(Math.max(inside / BEVEL, 0), 1);
      height[j * N + i] = inside > 0 ? HEIGHT * Math.sqrt(1 - (1 - t) * (1 - t)) : 0;
    }
  }
  const normals = new Float32Array(N * N * 3);
  const h = (i, j) => height[Math.min(N - 1, Math.max(0, j)) * N + Math.min(N - 1, Math.max(0, i))];
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const dx = (h(i + 1, j) - h(i - 1, j)) * UNIT / 2;
      const dy = (h(i, j + 1) - h(i, j - 1)) * UNIT / 2;
      const len = Math.hypot(dx, dy, 1);
      const k = (j * N + i) * 3;
      normals[k] = -dx / len; normals[k + 1] = -dy / len; normals[k + 2] = 1 / len;
    }
  }

  const sim = document.createElement('canvas');
  sim.width = sim.height = N;
  const simCtx = sim.getContext('2d');
  const image = simCtx.createImageData(N, N);
  const light = { ...HOME };

  function shade() {
    const data = image.data;
    const lx = (light.x + ORIGIN) * UNIT, ly = (light.y + ORIGIN) * UNIT;
    for (let j = 0; j < N; j++) {
      for (let i = 0; i < N; i++) {
        const p = j * N + i;
        const ph = height[p];
        const vx = lx - (i + 0.5), vy = ly - (j + 0.5);
        const planar = Math.hypot(vx, vy);
        const vz = light.z - ph;
        const dist = Math.hypot(planar / UNIT, vz);
        const k = p * 3;
        let diffuse = (normals[k] * vx / UNIT + normals[k + 1] * vy / UNIT + normals[k + 2] * vz) / dist;
        if (diffuse < 0) diffuse = 0;

        // Screen-space shadow: march toward the light and test the ray against the height map.
        let visible = 1;
        if (diffuse > 0 && planar > 1) {
          const steps = Math.min(48, Math.ceil(planar));
          for (let s = 1; s < steps; s++) {
            const f = s / steps;
            const si = (i + 0.5 + vx * f) | 0, sj = (j + 0.5 + vy * f) | 0;
            if (si < 0 || sj < 0 || si >= N || sj >= N) break;
            const block = height[sj * N + si] - (ph + vz * f);
            if (block > 0) { visible = Math.max(0, visible - block * 0.5); if (visible === 0) break; }
          }
        }

        const falloff = 1 / (1 + (dist / 40) ** 2);
        // Fade the lit floor toward the canvas edges so the stage blends into the page.
        const edge = Math.min(1, Math.min(i, j, N - 1 - i, N - 1 - j) / (N * 0.2));
        const energy = diffuse * visible * falloff * (ph > 0 ? 1 : edge * edge * (3 - 2 * edge));
        const isModule = ph > 0;
        const albedo = isModule ? 0.92 : 0.16;
        const base = isModule ? MODULE_DARK : INK;
        const o = p * 4;
        for (let c = 0; c < 3; c++) {
          data[o + c] = Math.min(255, base[c] + albedo * energy * LIGHT_RGB[c] * 1.6);
        }
        data[o + 3] = 255;
      }
    }
    simCtx.putImageData(image, 0, 0);
  }

  function draw() {
    shade();
    const w = canvas.width;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sim, 0, 0, w, w);
    const s = w / VIEW;
    ctx.beginPath();
    ctx.arc((light.x + ORIGIN) * s, (light.y + ORIGIN) * s, LIGHT_R * s, 0, Math.PI * 2);
    ctx.fillStyle = '#7c6cff';
    ctx.fill();
  }

  let frame = 0;
  const requestDraw = () => {
    if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
  };

  function resize() {
    const size = Math.round(canvas.clientWidth * Math.min(window.devicePixelRatio || 1, 2));
    if (size && size !== canvas.width) { canvas.width = canvas.height = size; requestDraw(); }
  }
  new ResizeObserver(resize).observe(canvas);

  const MIN = -ORIGIN + LIGHT_R / 2, MAX = 56 + ORIGIN - LIGHT_R / 2;
  const clamp = (v) => Math.min(MAX, Math.max(MIN, v));

  function moveTo(x, y) {
    light.x = clamp(x); light.y = clamp(y);
    requestDraw();
  }

  function fromPointer(e) {
    const r = canvas.getBoundingClientRect();
    moveTo(((e.clientX - r.left) / r.width) * VIEW - ORIGIN, ((e.clientY - r.top) / r.height) * VIEW - ORIGIN);
  }

  let animation = 0;
  const stopAnimation = () => { cancelAnimationFrame(animation); animation = 0; };

  canvas.addEventListener('pointerdown', (e) => {
    stopAnimation();
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
    fromPointer(e);
  });
  canvas.addEventListener('pointermove', (e) => { if (canvas.hasPointerCapture(e.pointerId)) fromPointer(e); });
  const endDrag = () => canvas.classList.remove('dragging');
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  canvas.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 8 : 2;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      stopAnimation();
      moveTo(light.x + moves[e.key][0], light.y + moves[e.key][1]);
    } else if (e.key === 'Home' || e.key === 'Escape') {
      e.preventDefault();
      glideHome();
    }
  });

  // Eases the light back into its place in the symbol.
  function glideHome(from) {
    stopAnimation();
    const start = from || { x: light.x, y: light.y };
    if (reduceMotion) { moveTo(HOME.x, HOME.y); return; }
    const t0 = performance.now();
    const duration = 1100;
    const step = (now) => {
      const t = Math.min(1, (now - t0) / duration);
      const e = 1 - Math.pow(1 - t, 3);
      moveTo(start.x + (HOME.x - start.x) * e, start.y + (HOME.y - start.y) * e);
      animation = t < 1 ? requestAnimationFrame(step) : 0;
    };
    animation = requestAnimationFrame(step);
  }

  document.getElementById('reset-light')?.addEventListener('click', () => glideHome());

  resize();
  // One entrance: the light sweeps in from the lower left and settles into the symbol.
  if (reduceMotion) requestDraw(); else glideHome({ x: -18, y: 66 });
})();
