// Hero scene: the Lumora symbol in 3D. The three modules are extruded from the exact logo
// outlines, and the sphere is a glowing light that shades the modules around it.
import * as THREE from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const host = document.getElementById('hero-scene');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Same outlines as brand/logo (56-unit grid, y pointing down).
const MODULE_PATHS = [
  'M3 0H23A3 3 0 0 1 26 3V8.8197A15 15 0 0 0 22.2523 26H3A3 3 0 0 1 0 23V3A3 3 0 0 1 3 0Z',
  'M3 30H23A3 3 0 0 1 26 33V53A3 3 0 0 1 23 56H3A3 3 0 0 1 0 53V33A3 3 0 0 1 3 30Z',
  'M47.1803 30H53A3 3 0 0 1 56 33V53A3 3 0 0 1 53 56H33A3 3 0 0 1 30 53V33.7477A15 15 0 0 0 47.1803 30Z',
];
const LIGHT = { x: 36, y: 20, r: 11 };
const DEPTH = 9;
const ORB_Z = 5; // the orb sits slightly proud of the front faces
const LIGHT_Z = 7; // light offset toward the viewer, still inside the orb
const GLOW_BACK = 30;
const INK = 0x111113;
const INDIGO = 0x7c6cff;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2'));
  } catch {
    return false;
  }
}

function moduleGeometry(d) {
  const shapes = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`)
    .paths[0].toShapes(true);
  const geo = new THREE.ExtrudeGeometry(shapes, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 1.4,
    bevelSize: 0.9,
    bevelSegments: 6,
    curveSegments: 48,
  });
  geo.translate(0, 0, -DEPTH / 2);
  return geo;
}

function init() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.4).texture;
  scene.environmentIntensity = 0.22;

  const camera = new THREE.PerspectiveCamera(30, 1, 1, 1000);
  camera.position.set(0, 0, 190);

  // The symbol lives in its own group, centered on the 56-unit grid and flipped to y-up.
  const symbol = new THREE.Group();
  const grid = new THREE.Group();
  grid.scale.set(1, -1, 1);
  grid.position.set(-28, 28, 0);
  symbol.add(grid);
  scene.add(symbol);

  const moduleMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc9c7d4,
    roughness: 0.38,
    metalness: 0.0,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
  });
  const modules = MODULE_PATHS.map((d) => {
    const mesh = new THREE.Mesh(moduleGeometry(d), moduleMaterial);
    grid.add(mesh);
    return mesh;
  });

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(LIGHT.r, 64, 48),
    new THREE.MeshStandardMaterial({ color: INDIGO, emissive: INDIGO, emissiveIntensity: 0.85, roughness: 0.22, toneMapped: false }),
  );
  orb.position.set(LIGHT.x, LIGHT.y, ORB_Z);
  grid.add(orb);

  const orbLight = new THREE.PointLight(0xb4a9ff, 1300, 0, 2);
  orbLight.position.set(LIGHT.x, LIGHT.y, ORB_Z + LIGHT_Z);
  grid.add(orbLight);

  // A dim cool key from the upper left keeps the far faces readable.
  const key = new THREE.DirectionalLight(0xeeeeff, 0.55);
  key.position.set(-80, 90, 120);
  scene.add(key);

  // Additive backlight behind the orb, set back so it never cuts through the modules.
  // It is drawn without tone mapping so the indigo stays exact.
  const glowTexture = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grad.addColorStop(0, 'rgba(255,255,255,0.9)');
    grad.addColorStop(0.22, 'rgba(255,255,255,0.45)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture, color: INDIGO, blending: THREE.AdditiveBlending,
    transparent: true, depthWrite: false, toneMapped: false,
  }));
  glow.scale.setScalar(LIGHT.r * 12);
  glow.position.set(LIGHT.x, LIGHT.y, ORB_Z - GLOW_BACK);
  grid.add(glow);


  // Layout: on wide screens the symbol sits to the right of the headline, on narrow ones above it.
  function layout() {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w / h > 1.05;
    const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
    const visibleWidth = visibleHeight * camera.aspect;
    if (wide) {
      symbol.position.set(visibleWidth * 0.24, -visibleHeight * 0.02, 0);
      symbol.scale.setScalar(Math.min(visibleHeight / 118, (visibleWidth * 0.34) / 56));
    } else {
      // Size and place the symbol in viewport pixels so it stays above the headline,
      // which starts at 52vh on narrow screens (see styles.css).
      const viewport = Math.min(h, window.innerHeight);
      const unitsPerPx = visibleHeight / h;
      const sizePx = Math.min(viewport * 0.34, w * 0.62);
      symbol.scale.setScalar((sizePx * unitsPerPx) / 56);
      symbol.position.set(0, (h / 2 - viewport * 0.27) * unitsPerPx, 0);
    }
  }
  new ResizeObserver(layout).observe(host);
  layout();

  // Pointer tilts the symbol toward the cursor.
  const pointer = new THREE.Vector2(0, 0);
  window.addEventListener('pointermove', (e) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  }, { passive: true });

  const rest = new THREE.Euler(-0.32, -0.42, 0.04);
  const clock = new THREE.Clock();
  const ASSEMBLE = 1.6;
  const starts = modules.map((m, i) => ({
    position: new THREE.Vector3([-14, -10, 16][i], [18, -16, -12][i], [-50, 30, -30][i]),
    rotation: new THREE.Euler([0.8, -0.6, 0.5][i], [-0.7, 0.5, 0.9][i], [0.3, -0.4, 0.2][i]),
  }));
  const ease = (t) => 1 - Math.pow(1 - t, 4);

  let start = null;
  function frame(time) {
    if (start === null) start = time;
    const t = reduceMotion ? 10 : time - start;
    // Entrance: the modules fly into place, then the light switches on.
    modules.forEach((m, i) => {
      const k = ease(THREE.MathUtils.clamp((t - i * 0.12) / ASSEMBLE, 0, 1));
      m.position.copy(starts[i].position).multiplyScalar(1 - k);
      m.rotation.set(starts[i].rotation.x * (1 - k), starts[i].rotation.y * (1 - k), starts[i].rotation.z * (1 - k));
    });
    const on = THREE.MathUtils.smoothstep(t, ASSEMBLE * 0.55, ASSEMBLE + 0.3);
    const breathe = reduceMotion ? 1 : 1 + Math.sin(t * 1.4) * 0.06;
    orb.scale.setScalar(Math.max(0.001, on));
    orb.material.emissiveIntensity = 0.85 * on;
    glow.material.opacity = 0.9 * on * breathe;
    orbLight.intensity = 1300 * on * breathe;
    orb.position.z = ORB_Z + (reduceMotion ? 0 : Math.sin(t * 0.9) * 1.2);
    orbLight.position.z = orb.position.z + LIGHT_Z;
    glow.position.z = orb.position.z - GLOW_BACK;

    const tx = rest.x + (reduceMotion ? 0 : pointer.y * 0.22);
    const ty = rest.y + (reduceMotion ? 0 : pointer.x * 0.35 + Math.sin(t * 0.35) * 0.05);
    symbol.rotation.x += (tx - symbol.rotation.x) * 0.06;
    symbol.rotation.y += (ty - symbol.rotation.y) * 0.06;
    symbol.rotation.z = rest.z;
    renderer.render(scene, camera);
  }

  if (reduceMotion) {
    symbol.rotation.copy(rest);
    frame(0);
    new ResizeObserver(() => frame(0)).observe(host);
  } else {
    let visible = true;
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }).observe(host);
    renderer.setAnimationLoop(() => {
      if (visible && !document.hidden) frame(clock.getElapsedTime());
    });
  }
  host.classList.add('is-live');
}

if (host && supportsWebGL()) {
  try {
    init();
  } catch (err) {
    console.warn('3D hero unavailable, showing the static logo instead.', err);
  }
}
