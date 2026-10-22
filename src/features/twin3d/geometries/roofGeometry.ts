import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";

// =========================================================================
// Geometri Helper Atap Limasan, Piramida 4 Sisi, Jendela Lengkungan Islamik,
// dan Cache Tekstur Panel Surya PV Gedung FST
// =========================================================================

/**
 * Menghasilkan geometri jendela lancip Islamik (Pointed Arch Window)
 */
export function createPointedArchWindowGeometry(
  width: number,
  baseHeight: number,
  peakHeight: number,
  depth: number = 0.08
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const halfW = width / 2;
  shape.moveTo(-halfW, 0);
  shape.lineTo(halfW, 0);
  shape.lineTo(halfW, baseHeight);
  shape.lineTo(0, baseHeight + peakHeight);
  shape.lineTo(-halfW, baseHeight);
  shape.closePath();

  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

/**
 * Menghasilkan geometri Atap Limasan / Piramida 4 Sisi Otentik (Hipped / Pyramid Roof)
 */
export function createHippedRoofGeometry(
  width: number,
  depth: number,
  height: number,
  overhang: number = 0.4
): THREE.BufferGeometry {
  const w = width + overhang * 2;
  const d = depth + overhang * 2;
  const h = height;

  const positions: number[] = [];
  const uvs: number[] = [];

  const addQuad = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number],
    p3: [number, number, number]
  ) => {
    positions.push(...p0, ...p1, ...p2);
    positions.push(...p0, ...p2, ...p3);
    uvs.push(0, 0, 1, 0, 1, 1);
    uvs.push(0, 0, 1, 1, 0, 1);
  };

  const addTri = (
    p0: [number, number, number],
    p1: [number, number, number],
    p2: [number, number, number]
  ) => {
    positions.push(...p0, ...p1, ...p2);
    uvs.push(0, 0, 1, 0, 0.5, 1);
  };

  const v0: [number, number, number] = [-w / 2, 0, d / 2];
  const v1: [number, number, number] = [w / 2, 0, d / 2];
  const v2: [number, number, number] = [w / 2, 0, -d / 2];
  const v3: [number, number, number] = [-w / 2, 0, -d / 2];

  if (Math.abs(w - d) < 0.3) {
    const apex: [number, number, number] = [0, h, 0];
    addTri(v0, v1, apex);
    addTri(v1, v2, apex);
    addTri(v2, v3, apex);
    addTri(v3, v0, apex);
  } else if (w > d) {
    const ridgeLen = Math.max(0.6, w - d * 0.95);
    const rLeft: [number, number, number] = [-ridgeLen / 2, h, 0];
    const rRight: [number, number, number] = [ridgeLen / 2, h, 0];

    addQuad(v0, v1, rRight, rLeft);
    addQuad(v2, v3, rLeft, rRight);
    addTri(v3, v0, rLeft);
    addTri(v1, v2, rRight);
  } else {
    const ridgeLen = Math.max(0.6, d - w * 0.95);
    const rFront: [number, number, number] = [0, h, ridgeLen / 2];
    const rBack: [number, number, number] = [0, h, -ridgeLen / 2];

    addQuad(v3, v0, rFront, rBack);
    addQuad(v1, v2, rBack, rFront);
    addTri(v0, v1, rFront);
    addTri(v2, v3, rBack);
  }

  addQuad(v0, v3, v2, v1);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/**
 * Garis nok bubungan gelap (ridge caps) untuk atap limasan & piramida 4 sisi
 */
export function createRoofRidgesGeometry(
  width: number,
  depth: number,
  height: number,
  overhang: number = 0.4
): THREE.BufferGeometry {
  const w = width + overhang * 2;
  const d = depth + overhang * 2;
  const h = height;
  const boxes: THREE.BufferGeometry[] = [];

  const addRidge = (pA: THREE.Vector3, pB: THREE.Vector3, th: number = 0.28) => {
    const dir = new THREE.Vector3().subVectors(pB, pA);
    const len = dir.length();
    if (len < 0.05) return;
    const mid = new THREE.Vector3().addVectors(pA, pB).multiplyScalar(0.5);

    const b = new THREE.BoxGeometry(th, th, len);
    b.lookAt(dir);
    b.translate(mid.x, mid.y, mid.z);
    boxes.push(b);
  };

  const v0 = new THREE.Vector3(-w / 2, 0, d / 2);
  const v1 = new THREE.Vector3(w / 2, 0, d / 2);
  const v2 = new THREE.Vector3(w / 2, 0, -d / 2);
  const v3 = new THREE.Vector3(-w / 2, 0, -d / 2);

  if (Math.abs(w - d) < 0.3) {
    const apex = new THREE.Vector3(0, h, 0);
    addRidge(v0, apex);
    addRidge(v1, apex);
    addRidge(v2, apex);
    addRidge(v3, apex);
  } else if (w > d) {
    const ridgeLen = Math.max(0.6, w - d * 0.95);
    const rLeft = new THREE.Vector3(-ridgeLen / 2, h, 0);
    const rRight = new THREE.Vector3(ridgeLen / 2, h, 0);
    addRidge(rLeft, rRight, 0.35);
    addRidge(v0, rLeft);
    addRidge(v3, rLeft);
    addRidge(v1, rRight);
    addRidge(v2, rRight);
  } else {
    const ridgeLen = Math.max(0.6, d - w * 0.95);
    const rFront = new THREE.Vector3(0, h, ridgeLen / 2);
    const rBack = new THREE.Vector3(0, h, -ridgeLen / 2);
    addRidge(rFront, rBack, 0.35);
    addRidge(v0, rFront);
    addRidge(v1, rFront);
    addRidge(v2, rBack);
    addRidge(v3, rBack);
  }

  return BufferGeometryUtils.mergeGeometries(boxes, false);
}

/**
 * Lis hijau eave fascia bawah atap khas FST
 */
export function createEaveFasciaGeometry(
  width: number,
  depth: number,
  overhang: number = 0.4
): THREE.BufferGeometry {
  const w = width + overhang * 2;
  const d = depth + overhang * 2;
  const boxes: THREE.BufferGeometry[] = [];
  const th = 0.18;
  const fh = 0.32;

  const fN = new THREE.BoxGeometry(w, fh, th);
  fN.translate(0, -fh / 2, d / 2);
  boxes.push(fN);

  const fS = new THREE.BoxGeometry(w, fh, th);
  fS.translate(0, -fh / 2, -d / 2);
  boxes.push(fS);

  const fW = new THREE.BoxGeometry(th, fh, d);
  fW.translate(-w / 2, -fh / 2, 0);
  boxes.push(fW);

  const fE = new THREE.BoxGeometry(th, fh, d);
  fE.translate(w / 2, -fh / 2, 0);
  boxes.push(fE);

  return BufferGeometryUtils.mergeGeometries(boxes, false);
}

// =========================================================================
// Singleton Cache untuk Tekstur Panel Surya PV (Menghindari Pembuatan
// 8 Canvas 2D Identik Berulang-ulang di Memori GPU)
// =========================================================================
const solarTextureCache = new Map<string, THREE.CanvasTexture>();

export function getSolarTexture(cols: number, rows: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const key = `${cols}x${rows}`;
  const cached = solarTextureCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  const isRotated = cols < rows;
  canvas.width = isRotated ? 512 : 1024;
  canvas.height = isRotated ? 2048 : 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#0A1728";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const padX = canvas.width / cols;
  const padY = canvas.height / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * padX;
      const y = r * padY;

      ctx.fillStyle = "#94A3B8";
      ctx.fillRect(x, y, padX, padY);

      const m = isRotated ? 1.5 : 2;
      ctx.fillStyle = "#0D213A";
      ctx.fillRect(x + m, y + m, padX - m * 2, padY - m * 2);

      const subCols = 2;
      const subRows = isRotated ? 3 : 4;
      const sw = (padX - m * 2) / subCols;
      const sh = (padY - m * 2) / subRows;

      for (let sc = 0; sc < subCols; sc++) {
        for (let sr = 0; sr < subRows; sr++) {
          const sx = x + m + sc * sw;
          const sy = y + m + sr * sh;

          ctx.fillStyle = "#122A48";
          ctx.fillRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);

          ctx.fillStyle = "rgba(226, 232, 240, 0.4)";
          ctx.fillRect(sx + sw * 0.33, sy + 0.5, 1, sh - 1);
          ctx.fillRect(sx + sw * 0.66, sy + 0.5, 1, sh - 1);
        }
      }
    }
  }

  ctx.strokeStyle = "#CBD5E1";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  solarTextureCache.set(key, tex);
  return tex;
}

