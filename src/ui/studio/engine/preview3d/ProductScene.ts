import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { applyLabelMap, buildProduct, disposeObject, type ProductConfig } from "./buildProduct";
import { blankLabelCanvas, composeLabelCanvas, labelMapFromCanvas } from "./labelTexture";
import type { Layer } from "../types";

export type SceneHandle = {
  canvas: HTMLCanvasElement;
  setView: (yaw: number, zoom: number) => void;
  setConfig: (cfg: ProductConfig) => void;
  setLayers: (layers: Layer[]) => void;
  resize: () => void;
  dispose: () => void;
};

function lookTarget(kind: ProductConfig["kind"]) {
  if (kind === "can") return 0.82;
  if (kind === "cup") return 0.72;
  if (kind === "cooler") return 0.7;
  return 1.02;
}

export function mountProductScene(host: HTMLElement, initial: { cfg: ProductConfig; layers: Layer[]; yaw: number; zoom: number }): SceneHandle {
  const canvas = document.createElement("canvas");
  canvas.className = "h-full w-full touch-none";
  host.appendChild(canvas);

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, failIfMajorPerformanceCaveat: false });
  } catch {
    canvas.remove();
    throw new Error("WEBGL_UNAVAILABLE");
  }
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f4f5f7");

  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = env;
  scene.environmentIntensity = 1.15;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 40);
  camera.position.set(0.28, 1.35, 4.35);

  const key = new THREE.DirectionalLight(0xfff6ea, 1.7);
  key.position.set(-2.6, 3.4, 2.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 12;
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -1;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xdfe8ff, 0.55);
  fill.position.set(2.8, 1.6, -1.4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffffff, 1.1);
  rim.position.set(-3.2, 1.8, -2.2);
  scene.add(rim);
  scene.add(new THREE.HemisphereLight(0xf7f4ee, 0xb7c0c8, 0.62));

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    new THREE.MeshStandardMaterial({ color: 0xf4f5f7, roughness: 0.96, metalness: 0 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.48, 48),
    new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.1 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.002;
  scene.add(shadow);

  const root = new THREE.Group();
  scene.add(root);

  let cfg = initial.cfg;
  let yaw = initial.yaw;
  let zoom = initial.zoom;
  let product = new THREE.Group();
  let labelTex = labelMapFromCanvas(blankLabelCanvas());
  let raf = 0;
  let disposed = false;

  function frame() {
    const y = lookTarget(cfg.kind);
    camera.position.set(0.1, y + 0.12, 5.6 / Math.max(0.55, zoom));
    camera.lookAt(0, y, 0);
    root.rotation.y = THREE.MathUtils.degToRad(yaw);
  }

  function rebuild() {
    disposeObject(product, labelTex);
    root.remove(product);
    product = buildProduct(labelTex, cfg);
    root.add(product);
    shadow.scale.setScalar(cfg.kind === "cooler" ? 1.6 : cfg.kind === "cup" ? 0.95 : 0.85);
    frame();
  }

  function resize() {
    const w = host.clientWidth || 1;
    const h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  rebuild();
  resize();

  void composeLabelCanvas(initial.layers).then((c) => {
    if (disposed) return;
    labelTex.dispose();
    labelTex = labelMapFromCanvas(c);
    applyLabelMap(product, labelTex);
  });

  const loop = () => {
    if (disposed) return;
    frame();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  const ro = new ResizeObserver(resize);
  ro.observe(host);

  return {
    canvas,
    setView(nextYaw, nextZoom) {
      yaw = nextYaw;
      zoom = nextZoom;
    },
    setConfig(next) {
      cfg = next;
      rebuild();
    },
    setLayers(layers) {
      void composeLabelCanvas(layers).then((c) => {
        if (disposed) return;
        const prev = labelTex;
        labelTex = labelMapFromCanvas(c);
        applyLabelMap(product, labelTex);
        prev.dispose();
      });
    },
    resize,
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      disposeObject(product);
      labelTex.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
