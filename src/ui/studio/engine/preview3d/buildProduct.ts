import * as THREE from "three";
import { makeDropletNormal, makePaperGrain } from "./labelTexture";

export type ProductKind = "pet" | "can" | "cup" | "shiva" | "aqua" | "cooler";

export type ProductConfig = {
  kind: ProductKind;
  slug: string;
  volumeMl?: number | null;
  cap: string;
  finish: "matte" | "gloss";
  water: string;
  labelKind: string;
};

export function previewKind(slug: string, categorySlug: string): ProductKind {
  if (categorySlug === "energidryck") return "can";
  if (categorySlug === "pappersmuggar") return "cup";
  if (categorySlug === "kyl") return "cooler";
  if (slug.includes("aquarefill")) return "aqua";
  if (categorySlug === "sportflaskor") return "shiva";
  return "pet";
}

function lathe(points: Array<[number, number]>, segs = 96) {
  return new THREE.LatheGeometry(
    points.map(([x, y]) => new THREE.Vector2(x, y)),
    segs,
  );
}

function radiusAt(points: Array<[number, number]>, y: number) {
  if (y <= points[0][1]) return points[0][0];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    if (y <= y2) {
      const t = (y - y1) / Math.max(0.0001, y2 - y1);
      return x1 + (x2 - x1) * t;
    }
  }
  return points[points.length - 1][0];
}

function petPoints(scaleH: number): Array<[number, number]> {
  const s = 0.74;
  return [
    [0, 0],
    [0.12 * s, 0.012],
    [0.3 * s, 0.045],
    [0.42 * s, 0.1],
    [0.48 * s, 0.2],
    [0.5 * s, 0.38],
    [0.505 * s, 0.85 * scaleH],
    [0.49 * s, 1.32 * scaleH],
    [0.42 * s, 1.5 * scaleH],
    [0.26 * s, 1.64 * scaleH],
    [0.175 * s, 1.74 * scaleH],
    [0.148 * s, 1.88 * scaleH],
    [0.142 * s, 2.0 * scaleH],
    [0.162 * s, 2.05 * scaleH],
    [0.148 * s, 2.12 * scaleH],
  ];
}

function liquidFor(slug: string, water: string) {
  if (slug.includes("julmust")) return { color: 0x2c1810, atten: 0x140a06, alpha: 0.92 };
  if (slug.includes("lask")) {
    if (slug.includes("cola")) return { color: 0x3a2016, atten: 0x1a0e08, alpha: 0.9 };
    if (slug.includes("apelsin")) return { color: 0xde7a30, atten: 0xa04a10, alpha: 0.78 };
    return { color: 0xc44a6c, atten: 0x8a2042, alpha: 0.72 };
  }
  const still = water !== "kolsyrat";
  return {
    color: still ? 0xd8eef6 : 0xcfe8f4,
    atten: still ? 0x8ec0d4 : 0x7eb4cc,
    alpha: 0.42,
  };
}

function labelMaterial(map: THREE.Texture, finish: "matte" | "gloss", paper: boolean) {
  const grain = new THREE.CanvasTexture(makePaperGrain());
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping;
  grain.repeat.set(2.4, 1.2);
  return new THREE.MeshPhysicalMaterial({
    map,
    roughnessMap: grain,
    roughness: paper ? (finish === "gloss" ? 0.38 : 0.78) : finish === "gloss" ? 0.18 : 0.42,
    metalness: 0,
    clearcoat: finish === "gloss" ? 0.55 : 0.08,
    clearcoatRoughness: finish === "gloss" ? 0.18 : 0.7,
    envMapIntensity: 0.55,
  });
}

function dropletMaps() {
  const n = new THREE.CanvasTexture(makeDropletNormal());
  n.wrapS = n.wrapT = THREE.RepeatWrapping;
  n.repeat.set(2.2, 2.8);
  return n;
}

function dropletShell() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.07,
    roughness: 0.08,
    transmission: 0.85,
    thickness: 0.05,
    ior: 1.33,
    normalMap: dropletMaps(),
    normalScale: new THREE.Vector2(0.35, 0.35),
    depthWrite: false,
    envMapIntensity: 0.9,
  });
}

function knurledCap(radius: number, height: number, color: number, sport: boolean) {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.42,
    metalness: 0.04,
    clearcoat: 0.25,
    clearcoatRoughness: 0.45,
  });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.96, radius, height, 48), mat);
  body.castShadow = true;
  g.add(body);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.92, radius * 0.96, 0.03, 48), mat);
  top.position.y = height / 2 + 0.012;
  g.add(top);
  const knurl = new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0.02 });
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.012, height * 0.78, 0.018), knurl);
    rib.position.set(Math.cos(a) * radius, 0, Math.sin(a) * radius);
    rib.rotation.y = -a;
    g.add(rib);
  }
  if (sport) {
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.42, radius * 0.55, 0.16, 24), mat);
    neck.position.y = height / 2 + 0.1;
    g.add(neck);
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.12, 16), mat);
    nozzle.position.y = height / 2 + 0.22;
    g.add(nozzle);
  }
  return g;
}

function addLabel(
  group: THREE.Group,
  map: THREE.Texture,
  cfg: ProductConfig,
  radius: number,
  y: number,
  height: number,
) {
  const paper = cfg.labelKind !== "transparent";
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, 72, 1, true, -Math.PI * 0.82, Math.PI * 1.64),
    labelMaterial(map, cfg.finish, paper),
  );
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.name = "label";
  group.add(mesh);
  return mesh;
}

function addBubbles(group: THREE.Group, count: number, r: number, y0: number, y1: number) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    transmission: 0.9,
    roughness: 0.05,
    thickness: 0.04,
    ior: 1.33,
    transparent: true,
    opacity: 0.55,
  });
  for (let i = 0; i < count; i++) {
    const s = 0.012 + Math.random() * 0.022;
    const b = new THREE.Mesh(new THREE.SphereGeometry(s, 10, 10), mat);
    const a = Math.random() * Math.PI * 2;
    const rr = Math.random() * r * 0.72;
    b.position.set(Math.cos(a) * rr, y0 + Math.random() * (y1 - y0), Math.sin(a) * rr);
    group.add(b);
  }
}

function buildPet(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const scaleH = cfg.volumeMl && cfg.volumeMl <= 350 ? 0.86 : 1;
  const dew = dropletMaps();
  const pet = new THREE.MeshPhysicalMaterial({
    color: 0xf7fcff,
    roughness: 0.06,
    metalness: 0,
    transmission: 0.88,
    thickness: 0.18,
    ior: 1.5,
    clearcoat: 0.85,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.2,
    transparent: true,
    opacity: 0.35,
    depthWrite: true,
    normalMap: dew,
    normalScale: new THREE.Vector2(0.1, 0.1),
  });
  const shell = new THREE.Mesh(lathe(petPoints(scaleH)), pet);
  shell.castShadow = true;
  group.add(shell);

  const liq = liquidFor(cfg.slug, cfg.water);
  const fillY = 1.42 * scaleH;
  const profile = petPoints(scaleH);
  const inner: Array<[number, number]> = [[0, 0.05]];
  for (const [x, y] of profile) {
    if (y > 0.05 && y < fillY) inner.push([Math.max(0.03, x * 0.9), y]);
  }
  inner.push([Math.max(0.03, radiusAt(profile, fillY) * 0.9), fillY]);
  inner.push([0, fillY]);
  const water = new THREE.Mesh(
    lathe(inner, 64),
    new THREE.MeshPhysicalMaterial({
      color: liq.color,
      roughness: 0.08,
      metalness: 0,
      transmission: 0.35,
      thickness: 1.2,
      ior: 1.33,
      attenuationColor: new THREE.Color(liq.atten),
      attenuationDistance: 0.55,
      transparent: true,
      opacity: 0.78,
    }),
  );
  group.add(water);

  const surfaceR = Math.max(0.08, radiusAt(profile, fillY) * 0.88);
  const meniscus = new THREE.Mesh(
    new THREE.CircleGeometry(surfaceR, 64),
    new THREE.MeshPhysicalMaterial({
      color: liq.color,
      roughness: 0.03,
      metalness: 0.05,
      transmission: 0.25,
      transparent: true,
      opacity: 0.7,
    }),
  );
  meniscus.rotation.x = -Math.PI / 2;
  meniscus.position.y = fillY + 0.002;
  group.add(meniscus);

  if (cfg.water === "kolsyrat" || cfg.slug.includes("lask") || cfg.slug.includes("julmust")) {
    addBubbles(group, 18, 0.26, 0.18, fillY * 0.9);
  }

  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const foot = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 16, 12),
      pet,
    );
    foot.scale.set(0.85, 0.32, 1);
    foot.position.set(Math.cos(a) * 0.22, 0.03, Math.sin(a) * 0.22);
    group.add(foot);
  }

  addLabel(group, map, cfg, 0.505 * 0.74 + 0.006, 0.86 * scaleH, 0.62 * scaleH);

  const sport = cfg.cap === "sportkork";
  const capColor = cfg.slug.includes("lask") || cfg.slug.includes("julmust") ? 0x161618 : 0xf4f4f6;
  const cap = knurledCap(0.132, sport ? 0.18 : 0.14, capColor, sport);
  cap.position.y = 2.1 * scaleH + (sport ? 0.12 : 0.095);
  group.add(cap);

  return group;
}

function buildCan(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const h = 1.62;
  const r = 0.355;
  const aluminum = new THREE.MeshStandardMaterial({ color: 0xc5c8cc, metalness: 0.88, roughness: 0.28 });
  const black = new THREE.MeshPhysicalMaterial({
    color: 0x111113,
    metalness: 0.72,
    roughness: 0.38,
    clearcoat: 0.22,
    clearcoatRoughness: 0.48,
  });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 96), black);
  body.position.y = h / 2;
  body.castShadow = true;
  group.add(body);

  const dew = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.012, r * 1.012, h, 64), dropletShell());
  dew.position.y = h / 2;
  group.add(dew);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.92, 0.028, 12, 48), aluminum);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h + 0.01;
  group.add(rim);

  const lid = new THREE.Mesh(
    lathe([
      [0, h],
      [0.2, h + 0.01],
      [0.3, h + 0.018],
      [0.33, h + 0.01],
    ]),
    aluminum,
  );
  group.add(lid);

  const tab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.01, 0.055), aluminum);
  tab.position.set(0.08, h + 0.028, 0);
  group.add(tab);

  const foot = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.92, r * 0.78, 0.06, 48), aluminum);
  foot.position.y = 0.02;
  group.add(foot);

  addLabel(group, map, cfg, r * 1.012, h * 0.5, h * 0.52);
  return group;
}

function buildCup(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const tall = cfg.volumeMl && cfg.volumeMl >= 340 ? 1.22 : cfg.volumeMl && cfg.volumeMl <= 140 ? 0.78 : 1;
  const h = 1.38 * tall;
  const r0 = 0.38 * (tall > 1 ? 1.06 : 1);
  const r1 = 0.56 * (tall > 1 ? 1.08 : tall < 1 ? 0.88 : 1);
  const paper = new THREE.MeshPhysicalMaterial({
    color: 0xf6f1e8,
    roughness: cfg.finish === "gloss" ? 0.32 : 0.86,
    metalness: 0,
    clearcoat: cfg.finish === "gloss" ? 0.32 : 0.04,
    clearcoatRoughness: 0.72,
  });
  const wall = new THREE.Mesh(
    lathe([
      [r0, 0.02],
      [r0 + 0.01, 0.08],
      [r1 - 0.02, h - 0.08],
      [r1, h],
    ]),
    paper,
  );
  wall.castShadow = true;
  group.add(wall);
  addLabel(group, map, cfg, (r0 + r1) / 2 + 0.01, h * 0.5, h * 0.55);

  const inner = new THREE.Mesh(
    lathe([
      [r1 - 0.03, h],
      [r0 - 0.01, 0.1],
      [0.02, 0.08],
    ]),
    new THREE.MeshPhysicalMaterial({ color: 0xefe8dc, roughness: 0.7, side: THREE.BackSide }),
  );
  group.add(inner);

  const coffee = new THREE.Mesh(
    new THREE.CylinderGeometry(r1 * 0.82, r0 * 0.88, 0.04, 48),
    new THREE.MeshPhysicalMaterial({ color: 0x2a1810, roughness: 0.22, metalness: 0.08 }),
  );
  coffee.position.y = h * 0.78;
  group.add(coffee);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry((r0 + r1) / 2 + (r1 - r0) * 0.92, 0.028, 10, 48),
    new THREE.MeshPhysicalMaterial({ color: 0xf3eee4, roughness: 0.55 }),
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  rim.scale.set(1, 1, 0.55);
  rim.scale.x = r1 / ((r0 + r1) / 2);
  rim.scale.z = r1 / ((r0 + r1) / 2);
  group.add(rim);

  return group;
}

function buildShiva(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const scaleH = cfg.volumeMl && cfg.volumeMl >= 700 ? 1.18 : 1;
  const body = new THREE.MeshPhysicalMaterial({
    color: 0xd2c2a4,
    roughness: 0.72,
    metalness: 0.02,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xe8dcc4),
  });
  const shell = new THREE.Mesh(
    lathe([
      [0, 0],
      [0.28, 0.03],
      [0.4, 0.12],
      [0.42, 0.35],
      [0.425, 1.15 * scaleH],
      [0.4, 1.55 * scaleH],
      [0.28, 1.72 * scaleH],
      [0.2, 1.82 * scaleH],
      [0.175, 1.92 * scaleH],
    ]),
    body,
  );
  shell.castShadow = true;
  group.add(shell);
  const dew = new THREE.Mesh(
    lathe([
      [0.29, 0.03],
      [0.405, 0.12],
      [0.428, 0.35],
      [0.432, 1.15 * scaleH],
      [0.406, 1.55 * scaleH],
      [0.286, 1.72 * scaleH],
      [0.206, 1.82 * scaleH],
    ]),
    dropletShell(),
  );
  group.add(dew);

  addLabel(group, map, cfg, 0.432, 0.95 * scaleH, 0.78 * scaleH);

  const capMat = new THREE.MeshPhysicalMaterial({ color: 0x2b2d31, roughness: 0.48 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.2, 24), capMat);
  cap.position.y = 2.02 * scaleH;
  group.add(cap);
  const wedge = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.12, 3), capMat);
  wedge.position.y = 2.16 * scaleH;
  wedge.rotation.y = Math.PI / 6;
  group.add(wedge);
  const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.1, 12), capMat);
  nozzle.position.y = 2.24 * scaleH;
  group.add(nozzle);
  return group;
}

function buildAqua(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const plastic = new THREE.MeshPhysicalMaterial({
    color: 0x5a6f82,
    roughness: 0.62,
    metalness: 0.06,
    sheen: 0.15,
    sheenColor: new THREE.Color(0x7a8ea0),
  });
  const shell = new THREE.Mesh(
    lathe([
      [0, 0],
      [0.3, 0.04],
      [0.42, 0.14],
      [0.44, 0.45],
      [0.43, 1.15],
      [0.4, 1.45],
      [0.36, 1.62],
      [0.4, 1.78],
      [0.38, 1.92],
      [0.22, 2.02],
      [0.2, 2.1],
    ]),
    plastic,
  );
  shell.castShadow = true;
  group.add(shell);
  const dew = new THREE.Mesh(
    lathe([
      [0.308, 0.04],
      [0.428, 0.14],
      [0.448, 0.45],
      [0.438, 1.15],
      [0.408, 1.45],
      [0.368, 1.62],
      [0.408, 1.78],
      [0.388, 1.92],
      [0.228, 2.02],
    ]),
    dropletShell(),
  );
  group.add(dew);
  addLabel(group, map, cfg, 0.442, 0.92, 0.82);
  const cap = knurledCap(0.2, 0.16, 0x5a6f82, true);
  cap.position.y = 2.22;
  group.add(cap);
  return group;
}

function buildCooler(map: THREE.Texture, cfg: ProductConfig) {
  const group = new THREE.Group();
  const navy = new THREE.MeshPhysicalMaterial({ color: 0x1d2b4a, roughness: 0.55, metalness: 0.08 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.15, 0.95), navy);
  body.position.y = 0.58;
  body.castShadow = true;
  group.add(body);
  const lid = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 0.12, 0.98),
    new THREE.MeshPhysicalMaterial({ color: 0xf4f4f6, roughness: 0.4 }),
  );
  lid.position.set(0.08, 1.22, 0);
  lid.rotation.z = -0.22;
  group.add(lid);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.7), labelMaterial(map, cfg.finish, true));
  plate.position.set(0, 0.62, 0.481);
  plate.name = "label";
  group.add(plate);
  return group;
}

export function buildProduct(map: THREE.Texture, cfg: ProductConfig) {
  if (cfg.kind === "can") return buildCan(map, cfg);
  if (cfg.kind === "cup") return buildCup(map, cfg);
  if (cfg.kind === "shiva") return buildShiva(map, cfg);
  if (cfg.kind === "aqua") return buildAqua(map, cfg);
  if (cfg.kind === "cooler") return buildCooler(map, cfg);
  return buildPet(map, cfg);
}

export function disposeObject(obj: THREE.Object3D, keep?: THREE.Texture) {
  obj.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const m of mats) {
      const std = m as THREE.MeshPhysicalMaterial;
      if (std.normalMap) std.normalMap.dispose();
      if (std.roughnessMap) std.roughnessMap.dispose();
      if (std.map && std.map !== keep) {
        /* label map is owned by the scene */
      }
      m.dispose();
    }
  });
}

export function applyLabelMap(group: THREE.Group, map: THREE.Texture) {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh || mesh.name !== "label") return;
    const mat = mesh.material as THREE.MeshPhysicalMaterial;
    mat.map = map;
    mat.needsUpdate = true;
  });
}
