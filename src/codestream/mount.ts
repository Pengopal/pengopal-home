/**
 * The 3D code stream (spec §5). The only module that imports three.js; loaded after first paint.
 * Glyphs flow along the wake's curve with real depth; the camera tilts with the mouse, and
 * glyphs near the cursor ease aside.
 */
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
} from 'three';
import { buildGlyphAtlas } from './glyphAtlas';
import { createRng, GLYPHS, makeGlyphs, pathPoint, type GlyphSpec } from './stream';

/** The stream is laid out in a virtual 1280×720 frame, the same one the server-rendered poster uses. */
const FRAME_W = 1280;
const FRAME_H = 720;
const DEPTH_UNIT = 70; // world units per unit of glyph z
const BASE_SIZE = 18; // glyph height in frame px at z = 0
const MAX_TILT = (6 * Math.PI) / 180;
const PUSH_RADIUS = 110;
const PUSH_STRENGTH = 46;
const FPS_BUDGET_MS = 22;
const WATCHDOG_WINDOW_MS = 2000;

const vertexShader = /* glsl */ `
  attribute vec4 aUv;
  attribute vec3 aColor;
  attribute float aAlpha;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vUv = mix(aUv.xy, aUv.zw, uv);
    vColor = aColor;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  uniform float uFade;
  varying vec2 vUv;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float a = texture2D(uAtlas, vUv).a * vAlpha * uFade;
    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

export function mountCodeStream(canvas: HTMLCanvasElement, poster: Element): () => void {
  // Visible but fully transparent from the start, so layout and IntersectionObserver see it.
  canvas.hidden = false;
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new Scene();
  const fov = 40;
  const camera = new PerspectiveCamera(fov, 16 / 9, 1, 5000);
  const camDist = FRAME_H / 2 / Math.tan((fov * Math.PI) / 360);
  camera.position.set(0, 0, camDist);

  const atlas = buildGlyphAtlas(GLYPHS, '600 48px "JetBrains Mono", ui-monospace, monospace');
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uAtlas: { value: atlas.texture }, uFade: { value: 0 } },
    transparent: true,
    depthWrite: false,
  });

  const max = window.innerWidth < 768 ? 300 : 600;
  let count = max;
  const glyphs: (GlyphSpec & { push: Vector3 })[] = makeGlyphs(max, createRng(11)).map((g) => ({ ...g, push: new Vector3() }));
  const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, max);
  const uvs = new Float32Array(max * 4);
  const colors = new Float32Array(max * 3);
  const alphas = new Float32Array(max);
  const c = new Color();
  glyphs.forEach((g, i) => {
    uvs.set(atlas.uv.get(g.char)!, i * 4);
    c.set(g.color);
    colors.set([c.r, c.g, c.b], i * 3);
  });
  mesh.geometry.setAttribute('aUv', new InstancedBufferAttribute(uvs, 4));
  mesh.geometry.setAttribute('aColor', new InstancedBufferAttribute(colors, 3));
  const alphaAttr = new InstancedBufferAttribute(alphas, 1);
  mesh.geometry.setAttribute('aAlpha', alphaAttr);
  mesh.frustumCulled = false;
  scene.add(mesh);

  // Cover the canvas with the 1280×720 frame like the poster's "xMaxYMid slice": fit the width on
  // wide screens; on narrow ones fit the height and keep the right edge, where the penguin is.
  const resize = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const half = Math.tan((fov * Math.PI) / 360);
    if (camera.aspect >= FRAME_W / FRAME_H) {
      camera.position.set(0, 0, FRAME_W / camera.aspect / 2 / half);
    } else {
      const visibleW = FRAME_H * camera.aspect;
      camera.position.set(FRAME_W / 2 - visibleW / 2, 0, camDist);
    }
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Pointer → camera tilt and a repulsion point in frame space.
  const pointer = { x: 0, y: 0, active: false, fx: -9999, fy: -9999 };
  const onMove = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width, ny = (e.clientY - r.top) / r.height;
    pointer.x = nx * 2 - 1;
    pointer.y = ny * 2 - 1;
    pointer.fx = nx * FRAME_W;
    pointer.fy = ny * FRAME_H;
    pointer.active = true;
  };
  const onLeave = () => { pointer.active = false; pointer.x = pointer.y = 0; };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', onLeave);

  // Pause when the hero is off-screen or the tab is hidden.
  let visible = true, inView = true, raf = 0, last = performance.now();
  const io = new IntersectionObserver((es) => { inView = es.some((e) => e.isIntersecting); schedule(); });
  io.observe(canvas);
  const onVis = () => { visible = document.visibilityState === 'visible'; last = performance.now(); schedule(); };
  document.addEventListener('visibilitychange', onVis);

  const m = new Matrix4(), q = new Quaternion(), s = new Vector3(), p = new Vector3();
  let fade = 0, firstFrame = true, frameSum = 0, frameN = 0, windowStart = last;

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(now - last, 100) / 1000;
    last = now;

    // Watchdog: halve the instance count if frames are too slow on average.
    frameSum += dt * 1000; frameN++;
    if (now - windowStart > WATCHDOG_WINDOW_MS) {
      if (frameSum / frameN > FPS_BUDGET_MS && count > 75) { count = Math.floor(count / 2); mesh.count = count; }
      frameSum = 0; frameN = 0; windowStart = now;
    }

    camera.rotation.y += (pointer.x * MAX_TILT - camera.rotation.y) * 0.05;
    camera.rotation.x += (pointer.y * MAX_TILT * 0.6 - camera.rotation.x) * 0.05;

    for (let i = 0; i < count; i++) {
      const g = glyphs[i];
      g.u += g.speed * dt;
      if (g.u >= 1) g.u -= 1;
      const pt = pathPoint(g.u, g.lane, FRAME_W, FRAME_H);
      // Ease aside from the cursor, then drift back.
      const dx = pt.x - pointer.fx, dy = pt.y - pointer.fy, d = Math.hypot(dx, dy);
      const tx = pointer.active && d < PUSH_RADIUS ? (dx / (d || 1)) * (1 - d / PUSH_RADIUS) * PUSH_STRENGTH : 0;
      const ty = pointer.active && d < PUSH_RADIUS ? (dy / (d || 1)) * (1 - d / PUSH_RADIUS) * PUSH_STRENGTH : 0;
      g.push.x += (tx - g.push.x) * 0.12;
      g.push.y += (ty - g.push.y) * 0.12;

      p.set(pt.x + g.push.x - FRAME_W / 2, FRAME_H / 2 - (pt.y + g.push.y), g.z * DEPTH_UNIT);
      const h = BASE_SIZE;
      s.set(h * atlas.aspect.get(g.char)!, h, 1);
      m.compose(p, q, s);
      mesh.setMatrixAt(i, m);
      // Fade in at the wake, out at the left exit; far glyphs are fainter.
      const ends = Math.min(1, g.u / 0.08, (1 - g.u) / 0.2);
      alphas[i] = Math.max(0, ends) * (0.35 + 0.65 * ((g.z + 6) / 8));
    }
    mesh.instanceMatrix.needsUpdate = true;
    alphaAttr.needsUpdate = true;

    fade = Math.min(1, fade + dt / 0.7);
    material.uniforms.uFade.value = fade;
    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      canvas.dataset.ready = 'true';
    }
    // SVG elements have no .hidden property; the attribute is what hides them.
    if (fade >= 1 && !poster.hasAttribute('hidden')) poster.setAttribute('hidden', '');
    schedule();
  }

  function schedule() {
    if (!raf && visible && inView) raf = requestAnimationFrame(frame);
  }
  schedule();

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', onLeave);
    document.removeEventListener('visibilitychange', onVis);
    mesh.geometry.dispose();
    material.dispose();
    atlas.texture.dispose();
    renderer.dispose();
  };
}
