import React from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FloorModel } from "../../building/params";
import { FstRoofDomesAndSolar } from "./components/FstRoofDomesAndSolar";
import { FLOOR_HEIGHT, FST_COLORS } from "./constants/fstColors";
import { createPointedArchWindowGeometry } from "./geometries/roofGeometry";

export { FST_COLORS, FLOOR_HEIGHT };

interface FstBuildingExteriorProps {
  floors: FloorModel[];
  hoveredFloor: number | null;
  onFloorDoubleClick: (level: number) => void;
  onFloorHover: (level: number | null) => void;
}

const HALF_W = 32;
const HALF_D = 28;
const VOID_HALF_W = 21;
const VOID_HALF_D = 17;
const TOP_ELEVATION = 7 * FLOOR_HEIGHT;

export const FstBuildingExterior: React.FC<FstBuildingExteriorProps> = React.memo(
  function FstBuildingExterior({
    floors,
    hoveredFloor,
    onFloorDoubleClick,
    onFloorHover,
  }) {
    return (
      <group>
        {/* 1. Tiap Lantai Fasad Luar (Lantai 1 s/d 7) */}
        {floors.map((floor) => {
          const yBase = (floor.level - 1) * FLOOR_HEIGHT;
          const isHovered = hoveredFloor === floor.level;

          return (
            <group
              key={floor.level}
              position={[0, yBase, 0]}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onFloorDoubleClick(floor.level);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                onFloorHover(floor.level);
              }}
              onPointerOut={() => onFloorHover(null)}
            >
              <InteractiveFloorSlab isHovered={isHovered} />
              <CornerPavilions />

              {floor.level === 1 ? (
                <GroundFloorFacade />
              ) : floor.level === 7 ? (
                <TopFloorArchedFacade />
              ) : (
                <StandardFloorFacade />
              )}

              <CenterTowerFacade />
            </group>
          );
        })}

        {/* 2. Atap Genteng Terakota, Panel Surya, 4 Menara Limasan, 2 Kubah Hijau, & Void Atrium */}
        <group position={[0, TOP_ELEVATION, 0]}>
          <FstRoofDomesAndSolar
            halfW={HALF_W}
            halfD={HALF_D}
            voidHalfW={VOID_HALF_W}
            voidHalfD={VOID_HALF_D}
          />
        </group>
      </group>
    );
  }
);

// =========================================================================
// Singleton Geometry Cache: Dibuat 1x di Memori GPU dan Dipakai Bersama
// oleh Seluruh Lantai (Menghemat ~80% Alokasi BufferGeometry Eksterior)
// =========================================================================
let cachedCornerGeos: {
  wallGeo: THREE.BufferGeometry;
  trimGeo: THREE.BufferGeometry;
  glassGeo: THREE.BufferGeometry;
} | null = null;

function getCornerPavilionGeometries() {
  if (cachedCornerGeos) return cachedCornerGeos;
  const height = FLOOR_HEIGHT;
  const yCenter = height / 2;
  const corners = [
    { x: -28.2, z: 24.2 },
    { x: 28.2, z: 24.2 },
    { x: -28.2, z: -24.2 },
    { x: 28.2, z: -24.2 },
  ];

  const wallBoxes: THREE.BufferGeometry[] = [];
  const trimBoxes: THREE.BufferGeometry[] = [];
  const glassPlanes: THREE.BufferGeometry[] = [];

  corners.forEach(({ x, z }) => {
    const signX = x > 0 ? 1 : -1;
    const signZ = z > 0 ? 1 : -1;

    const b = new THREE.BoxGeometry(10.2, height, 10.2);
    b.translate(x, yCenter, z);
    wallBoxes.push(b);

    const pCorner = new THREE.BoxGeometry(0.42, height, 0.42);
    pCorner.translate(x + signX * 5.12, yCenter, z + signZ * 5.12);
    wallBoxes.push(pCorner);

    const pMidX = new THREE.BoxGeometry(0.16, height, 0.14);
    pMidX.translate(x + signX * 5.14, yCenter, z);
    trimBoxes.push(pMidX);

    const pMidZ = new THREE.BoxGeometry(0.14, height, 0.16);
    pMidZ.translate(x, yCenter, z + signZ * 5.14);
    trimBoxes.push(pMidZ);

    const sillX = new THREE.BoxGeometry(0.16, 0.18, 2.4);
    sillX.translate(x + signX * 5.14, 1.05, z);
    trimBoxes.push(sillX);

    const sillZ = new THREE.BoxGeometry(2.4, 0.18, 0.16);
    sillZ.translate(x, 1.05, z + signZ * 5.14);
    trimBoxes.push(sillZ);

    const winX = new THREE.BoxGeometry(0.1, 2.1, 1.8);
    winX.translate(x + signX * 5.16, yCenter + 0.1, z);
    glassPlanes.push(winX);

    const winZ = new THREE.BoxGeometry(1.8, 2.1, 0.1);
    winZ.translate(x, yCenter + 0.1, z + signZ * 5.16);
    glassPlanes.push(winZ);
  });

  cachedCornerGeos = {
    wallGeo: BufferGeometryUtils.mergeGeometries(wallBoxes, false),
    trimGeo: BufferGeometryUtils.mergeGeometries(trimBoxes, false),
    glassGeo: BufferGeometryUtils.mergeGeometries(glassPlanes, false),
  };
  return cachedCornerGeos;
}

let cachedGroundFacadeGeos: {
  creamUpperGeo: THREE.BufferGeometry;
  lowerPillarsGeo: THREE.BufferGeometry;
} | null = null;

function getGroundFacadeGeometries() {
  if (cachedGroundFacadeGeos) return cachedGroundFacadeGeos;
  const height = FLOOR_HEIGHT;
  const upperH = height * 0.45;
  const upperY = height - upperH / 2;
  const lowerH = height * 0.55;
  const lowerY = lowerH / 2;

  const creamBoxes: THREE.BufferGeometry[] = [];
  const redBoxes: THREE.BufferGeometry[] = [];

  for (let x = -20; x <= 20; x += 4.5) {
    if (Math.abs(x) < 4.5) continue;
    const uN = new THREE.BoxGeometry(0.72, upperH, 0.72);
    uN.translate(x, upperY, HALF_D);
    creamBoxes.push(uN);

    const uS = new THREE.BoxGeometry(0.72, upperH, 0.72);
    uS.translate(x, upperY, -HALF_D);
    creamBoxes.push(uS);

    const lN = new THREE.BoxGeometry(0.76, lowerH, 0.76);
    lN.translate(x, lowerY, HALF_D);
    redBoxes.push(lN);

    const lS = new THREE.BoxGeometry(0.76, lowerH, 0.76);
    lS.translate(x, lowerY, -HALF_D);
    redBoxes.push(lS);
  }

  for (let z = -16; z <= 16; z += 5.5) {
    const uE = new THREE.BoxGeometry(0.72, upperH, 0.72);
    uE.translate(HALF_W, upperY, z);
    creamBoxes.push(uE);

    const uW = new THREE.BoxGeometry(0.72, upperH, 0.72);
    uW.translate(-HALF_W, upperY, z);
    creamBoxes.push(uW);

    const lE = new THREE.BoxGeometry(0.76, lowerH, 0.76);
    lE.translate(HALF_W, lowerY, z);
    redBoxes.push(lE);

    const lW = new THREE.BoxGeometry(0.76, lowerH, 0.76);
    lW.translate(-HALF_W, lowerY, z);
    redBoxes.push(lW);
  }

  const lintelN = new THREE.BoxGeometry(43, 0.65, 0.82);
  lintelN.translate(0, height - 0.32, HALF_D);
  creamBoxes.push(lintelN);

  const lintelS = new THREE.BoxGeometry(43, 0.65, 0.82);
  lintelS.translate(0, height - 0.32, -HALF_D);
  creamBoxes.push(lintelS);

  const lintelE = new THREE.BoxGeometry(0.82, 0.65, 39);
  lintelE.translate(HALF_W, height - 0.32, 0);
  creamBoxes.push(lintelE);

  const lintelW = new THREE.BoxGeometry(0.82, 0.65, 39);
  lintelW.translate(-HALF_W, height - 0.32, 0);
  creamBoxes.push(lintelW);

  cachedGroundFacadeGeos = {
    creamUpperGeo: BufferGeometryUtils.mergeGeometries(creamBoxes, false),
    lowerPillarsGeo: BufferGeometryUtils.mergeGeometries(redBoxes, false),
  };
  return cachedGroundFacadeGeos;
}

let cachedStandardFacadeGeos: {
  wallsGeo: THREE.BufferGeometry;
  rosterSpandrelGeo: THREE.BufferGeometry;
  redAccentGeo: THREE.BufferGeometry;
  greenTrimGeo: THREE.BufferGeometry;
  windowsGeo: THREE.BufferGeometry;
  acUnitsGeo: THREE.BufferGeometry;
} | null = null;

function getStandardFacadeGeometries() {
  if (cachedStandardFacadeGeos) return cachedStandardFacadeGeos;
  const height = FLOOR_HEIGHT;
  const yCenter = height / 2;

  const wallBoxes: THREE.BufferGeometry[] = [];
  const rosterBoxes: THREE.BufferGeometry[] = [];
  const redBoxes: THREE.BufferGeometry[] = [];
  const greenBoxes: THREE.BufferGeometry[] = [];
  const windowBoxes: THREE.BufferGeometry[] = [];
  const acBoxes: THREE.BufferGeometry[] = [];

  // Dinding utama
  const wallE = new THREE.BoxGeometry(0.24, height, 38.2);
  wallE.translate(HALF_W, yCenter, 0);
  wallBoxes.push(wallE);

  const wallW = new THREE.BoxGeometry(0.24, height, 38.2);
  wallW.translate(-HALF_W, yCenter, 0);
  wallBoxes.push(wallW);

  const wallN1 = new THREE.BoxGeometry(15.8, height, 0.24);
  wallN1.translate(-14.5, yCenter, HALF_D);
  wallBoxes.push(wallN1);
  const wallN2 = new THREE.BoxGeometry(15.8, height, 0.24);
  wallN2.translate(14.5, yCenter, HALF_D);
  wallBoxes.push(wallN2);

  const wallS1 = new THREE.BoxGeometry(15.8, height, 0.24);
  wallS1.translate(-14.5, yCenter, -HALF_D);
  wallBoxes.push(wallS1);
  const wallS2 = new THREE.BoxGeometry(15.8, height, 0.24);
  wallS2.translate(14.5, yCenter, -HALF_D);
  wallBoxes.push(wallS2);

  const winHeight = 2.25;

  for (let z = -18; z <= 18; z += 3.2) {
    const pE = new THREE.BoxGeometry(0.32, height, 0.42);
    pE.translate(HALF_W + 0.08, yCenter, z);
    wallBoxes.push(pE);

    const pW = new THREE.BoxGeometry(0.32, height, 0.42);
    pW.translate(-HALF_W - 0.08, yCenter, z);
    wallBoxes.push(pW);

    const trimE = new THREE.BoxGeometry(0.35, height, 0.08);
    trimE.translate(HALF_W + 0.09, yCenter, z);
    redBoxes.push(trimE);

    const trimW = new THREE.BoxGeometry(0.35, height, 0.08);
    trimW.translate(-HALF_W - 0.09, yCenter, z);
    redBoxes.push(trimW);

    if (z < 17) {
      const rTopE = new THREE.BoxGeometry(0.26, 0.78, 2.5);
      rTopE.translate(HALF_W + 0.06, height - 0.45, z + 1.6);
      rosterBoxes.push(rTopE);

      const rTopW = new THREE.BoxGeometry(0.26, 0.78, 2.5);
      rTopW.translate(-HALF_W - 0.06, height - 0.45, z + 1.6);
      rosterBoxes.push(rTopW);

      const rBotE = new THREE.BoxGeometry(0.24, 0.65, 2.5);
      rBotE.translate(HALF_W + 0.05, 0.45, z + 1.6);
      rosterBoxes.push(rBotE);

      const rBotW = new THREE.BoxGeometry(0.24, 0.65, 2.5);
      rBotW.translate(-HALF_W - 0.05, 0.45, z + 1.6);
      rosterBoxes.push(rBotW);

      const sillE = new THREE.BoxGeometry(0.28, 0.42, 1.85);
      sillE.translate(HALF_W + 0.07, 0.98, z + 1.6);
      redBoxes.push(sillE);

      const sillW = new THREE.BoxGeometry(0.28, 0.42, 1.85);
      sillW.translate(-HALF_W - 0.07, 0.98, z + 1.6);
      redBoxes.push(sillW);

      const wE = new THREE.BoxGeometry(0.1, winHeight, 2.15);
      wE.translate(HALF_W + 0.12, 2.38, z + 1.6);
      windowBoxes.push(wE);

      const wW = new THREE.BoxGeometry(0.1, winHeight, 2.15);
      wW.translate(-HALF_W - 0.12, 2.38, z + 1.6);
      windowBoxes.push(wW);
    }
  }

  for (let x = -21; x <= 21; x += 2.6) {
    if (Math.abs(x) < 6.2) continue;

    const pN = new THREE.BoxGeometry(0.42, height, 0.32);
    pN.translate(x, yCenter, HALF_D + 0.08);
    wallBoxes.push(pN);

    const pS = new THREE.BoxGeometry(0.42, height, 0.32);
    pS.translate(x, yCenter, -HALF_D - 0.08);
    wallBoxes.push(pS);

    const trimN = new THREE.BoxGeometry(0.08, height, 0.35);
    trimN.translate(x, yCenter, HALF_D + 0.09);
    redBoxes.push(trimN);

    const trimS = new THREE.BoxGeometry(0.08, height, 0.35);
    trimS.translate(x, yCenter, -HALF_D - 0.09);
    redBoxes.push(trimS);

    if (x < 20 && Math.abs(x + 1.3) >= 6.2) {
      const rTopN = new THREE.BoxGeometry(2.05, 0.78, 0.26);
      rTopN.translate(x + 1.3, height - 0.45, HALF_D + 0.06);
      rosterBoxes.push(rTopN);

      const rTopS = new THREE.BoxGeometry(2.05, 0.78, 0.26);
      rTopS.translate(x + 1.3, height - 0.45, -HALF_D - 0.06);
      rosterBoxes.push(rTopS);

      const rBotN = new THREE.BoxGeometry(2.05, 0.65, 0.24);
      rBotN.translate(x + 1.3, 0.45, HALF_D + 0.05);
      rosterBoxes.push(rBotN);

      const rBotS = new THREE.BoxGeometry(2.05, 0.65, 0.24);
      rBotS.translate(x + 1.3, 0.45, -HALF_D - 0.05);
      rosterBoxes.push(rBotS);

      const sillN = new THREE.BoxGeometry(1.65, 0.42, 0.28);
      sillN.translate(x + 1.3, 0.98, HALF_D + 0.07);
      redBoxes.push(sillN);

      const sillS = new THREE.BoxGeometry(1.65, 0.42, 0.28);
      sillS.translate(x + 1.3, 0.98, -HALF_D - 0.07);
      redBoxes.push(sillS);

      const wN = new THREE.BoxGeometry(1.9, winHeight, 0.1);
      wN.translate(x + 1.3, 2.38, HALF_D + 0.12);
      windowBoxes.push(wN);

      const wS = new THREE.BoxGeometry(1.9, winHeight, 0.1);
      wS.translate(x + 1.3, 2.38, -HALF_D - 0.12);
      windowBoxes.push(wS);
    }
  }

  for (let z = -18; z <= 18; z += 6.4) {
    const gE = new THREE.BoxGeometry(0.36, height, 0.07);
    gE.translate(HALF_W + 0.09, yCenter, z + 0.14);
    greenBoxes.push(gE);

    const gW = new THREE.BoxGeometry(0.36, height, 0.07);
    gW.translate(-HALF_W - 0.09, yCenter, z + 0.14);
    greenBoxes.push(gW);
  }

  for (let x = -21; x <= 21; x += 5.2) {
    if (Math.abs(x) < 6.2) continue;
    const gN = new THREE.BoxGeometry(0.07, height, 0.36);
    gN.translate(x + 0.14, yCenter, HALF_D + 0.09);
    greenBoxes.push(gN);

    const gS = new THREE.BoxGeometry(0.07, height, 0.36);
    gS.translate(x + 0.14, yCenter, -HALF_D - 0.09);
    greenBoxes.push(gS);
  }

  for (let x = -20; x <= 20; x += 5.2) {
    if (Math.abs(x) < 6.5) continue;
    const acN = new THREE.BoxGeometry(0.85, 0.52, 0.42);
    acN.translate(x, 1.02, HALF_D + 0.36);
    acBoxes.push(acN);

    const acS = new THREE.BoxGeometry(0.85, 0.52, 0.42);
    acS.translate(x, 1.02, -HALF_D - 0.36);
    acBoxes.push(acS);
  }

  for (let z = -15; z <= 15; z += 6.4) {
    const acE = new THREE.BoxGeometry(0.42, 0.52, 0.85);
    acE.translate(HALF_W + 0.36, 1.02, z);
    acBoxes.push(acE);

    const acW = new THREE.BoxGeometry(0.42, 0.52, 0.85);
    acW.translate(-HALF_W - 0.36, 1.02, z);
    acBoxes.push(acW);
  }

  cachedStandardFacadeGeos = {
    wallsGeo: BufferGeometryUtils.mergeGeometries(wallBoxes, false),
    rosterSpandrelGeo: BufferGeometryUtils.mergeGeometries(rosterBoxes, false),
    redAccentGeo: BufferGeometryUtils.mergeGeometries(redBoxes, false),
    greenTrimGeo: BufferGeometryUtils.mergeGeometries(greenBoxes, false),
    windowsGeo: BufferGeometryUtils.mergeGeometries(windowBoxes, false),
    acUnitsGeo: BufferGeometryUtils.mergeGeometries(acBoxes, false),
  };
  return cachedStandardFacadeGeos;
}

let cachedTopFacadeGeos: {
  wallsGeo: THREE.BufferGeometry;
  archTrimGeo: THREE.BufferGeometry;
  greenFasciaGeo: THREE.BufferGeometry;
  windowsGeo: THREE.BufferGeometry;
  acUnitsGeo: THREE.BufferGeometry;
} | null = null;

function getTopFloorArchedGeometries() {
  if (cachedTopFacadeGeos) return cachedTopFacadeGeos;
  const height = FLOOR_HEIGHT;
  const yCenter = height / 2;

  const stdGeos = getStandardFacadeGeometries();
  const redBoxes: THREE.BufferGeometry[] = [];
  const fasciaBoxes: THREE.BufferGeometry[] = [];
  const windowGeos: THREE.BufferGeometry[] = [];

  // Sabuk horizontal merah di puncak Lantai 7 tepat di bawah lisplang hijau atap
  const topBandE = new THREE.BoxGeometry(0.34, 0.38, 38.4);
  topBandE.translate(HALF_W + 0.09, height - 0.38, 0);
  redBoxes.push(topBandE);

  const topBandW = new THREE.BoxGeometry(0.34, 0.38, 38.4);
  topBandW.translate(-HALF_W - 0.09, height - 0.38, 0);
  redBoxes.push(topBandW);

  const topBandN1 = new THREE.BoxGeometry(16.0, 0.38, 0.34);
  topBandN1.translate(-14.5, height - 0.38, HALF_D + 0.09);
  redBoxes.push(topBandN1);
  const topBandN2 = new THREE.BoxGeometry(16.0, 0.38, 0.34);
  topBandN2.translate(14.5, height - 0.38, HALF_D + 0.09);
  redBoxes.push(topBandN2);

  const topBandS1 = new THREE.BoxGeometry(16.0, 0.38, 0.34);
  topBandS1.translate(-14.5, height - 0.38, -HALF_D - 0.09);
  redBoxes.push(topBandS1);
  const topBandS2 = new THREE.BoxGeometry(16.0, 0.38, 0.34);
  topBandS2.translate(14.5, height - 0.38, -HALF_D - 0.09);
  redBoxes.push(topBandS2);

  for (let z = -18; z <= 18; z += 3.2) {
    const trimE = new THREE.BoxGeometry(0.35, height, 0.08);
    trimE.translate(HALF_W + 0.09, yCenter, z);
    redBoxes.push(trimE);

    const trimW = new THREE.BoxGeometry(0.35, height, 0.08);
    trimW.translate(-HALF_W - 0.09, yCenter, z);
    redBoxes.push(trimW);

    if (z < 17) {
      const sillE = new THREE.BoxGeometry(0.28, 0.42, 1.85);
      sillE.translate(HALF_W + 0.07, 0.88, z + 1.6);
      redBoxes.push(sillE);

      const sillW = new THREE.BoxGeometry(0.28, 0.42, 1.85);
      sillW.translate(-HALF_W - 0.07, 0.88, z + 1.6);
      redBoxes.push(sillW);

      const gE = createPointedArchWindowGeometry(2.1, 1.55, 0.85, 0.1);
      gE.rotateY(Math.PI / 2);
      gE.translate(HALF_W + 0.14, 1.15, z + 1.6);
      windowGeos.push(gE);

      const gW = createPointedArchWindowGeometry(2.1, 1.55, 0.85, 0.1);
      gW.rotateY(-Math.PI / 2);
      gW.translate(-HALF_W - 0.14, 1.15, z + 1.6);
      windowGeos.push(gW);
    }
  }

  for (let x = -21; x <= 21; x += 2.6) {
    if (Math.abs(x) < 6.2) continue;

    const trimN = new THREE.BoxGeometry(0.08, height, 0.35);
    trimN.translate(x, yCenter, HALF_D + 0.09);
    redBoxes.push(trimN);

    const trimS = new THREE.BoxGeometry(0.08, height, 0.35);
    trimS.translate(x, yCenter, -HALF_D - 0.09);
    redBoxes.push(trimS);

    if (x < 20 && Math.abs(x + 1.3) >= 6.2) {
      const sillN = new THREE.BoxGeometry(1.65, 0.42, 0.28);
      sillN.translate(x + 1.3, 0.88, HALF_D + 0.07);
      redBoxes.push(sillN);

      const sillS = new THREE.BoxGeometry(1.65, 0.42, 0.28);
      sillS.translate(x + 1.3, 0.88, -HALF_D - 0.07);
      redBoxes.push(sillS);

      const gN = createPointedArchWindowGeometry(1.9, 1.55, 0.85, 0.1);
      gN.translate(x + 1.3, 1.15, HALF_D + 0.14);
      windowGeos.push(gN);

      const gS = createPointedArchWindowGeometry(1.9, 1.55, 0.85, 0.1);
      gS.rotateY(Math.PI);
      gS.translate(x + 1.3, 1.15, -HALF_D - 0.14);
      windowGeos.push(gS);
    }
  }

  const fE = new THREE.BoxGeometry(0.38, 0.22, 64.4);
  fE.translate(HALF_W + 0.12, height - 0.11, 0);
  fasciaBoxes.push(fE);

  const fW = new THREE.BoxGeometry(0.38, 0.22, 64.4);
  fW.translate(-HALF_W - 0.12, height - 0.11, 0);
  fasciaBoxes.push(fW);

  const fN = new THREE.BoxGeometry(64.4, 0.22, 0.38);
  fN.translate(0, height - 0.11, HALF_D + 0.12);
  fasciaBoxes.push(fN);

  const fS = new THREE.BoxGeometry(64.4, 0.22, 0.38);
  fS.translate(0, height - 0.11, -HALF_D - 0.12);
  fasciaBoxes.push(fS);

  cachedTopFacadeGeos = {
    wallsGeo: stdGeos.wallsGeo,
    archTrimGeo: BufferGeometryUtils.mergeGeometries(redBoxes, false),
    greenFasciaGeo: BufferGeometryUtils.mergeGeometries(fasciaBoxes, false),
    windowsGeo: BufferGeometryUtils.mergeGeometries(windowGeos, false),
    acUnitsGeo: stdGeos.acUnitsGeo,
  };
  return cachedTopFacadeGeos;
}

// =========================================================================
// Komponen Fasad Per Lantai (Memoized & Menggunakan Cached Geometry)
// =========================================================================
const InteractiveFloorSlab = React.memo(function InteractiveFloorSlab({
  isHovered,
}: {
  isHovered: boolean;
}) {
  const beltColor = isHovered ? "#3B82F6" : "#EDE9DF";

  return (
    <group>
      <mesh position={[0, 0.16, 28.06]}>
        <boxGeometry args={[64.16, 0.32, 0.16]} />
        <meshStandardMaterial color={beltColor} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.16, -28.06]}>
        <boxGeometry args={[64.16, 0.32, 0.16]} />
        <meshStandardMaterial color={beltColor} roughness={0.8} />
      </mesh>
      <mesh position={[32.06, 0.16, 0]}>
        <boxGeometry args={[0.16, 0.32, 56.16]} />
        <meshStandardMaterial color={beltColor} roughness={0.8} />
      </mesh>
      <mesh position={[-32.06, 0.16, 0]}>
        <boxGeometry args={[0.16, 0.32, 56.16]} />
        <meshStandardMaterial color={beltColor} roughness={0.8} />
      </mesh>
    </group>
  );
});

const CornerPavilions = React.memo(function CornerPavilions() {
  const { wallGeo, trimGeo, glassGeo } = getCornerPavilionGeometries();

  return (
    <group>
      <mesh geometry={wallGeo} castShadow receiveShadow>
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh geometry={trimGeo}>
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh geometry={glassGeo}>
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.42}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
});

const GroundFloorFacade = React.memo(function GroundFloorFacade() {
  const height = FLOOR_HEIGHT;
  const yCenter = height / 2;
  const { creamUpperGeo, lowerPillarsGeo } = getGroundFacadeGeometries();

  return (
    <group>
      <mesh geometry={creamUpperGeo} castShadow receiveShadow>
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.78} />
      </mesh>
      <mesh geometry={lowerPillarsGeo} castShadow receiveShadow>
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {/* Kanopi Teras Samping Slate-Blue Abu Kebiruan */}
      <mesh position={[-15, height - 0.75, HALF_D + 1.1]} receiveShadow>
        <boxGeometry args={[14.5, 0.28, 2.0]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>
      <mesh position={[15, height - 0.75, HALF_D + 1.1]} receiveShadow>
        <boxGeometry args={[14.5, 0.28, 2.0]} />
        <meshStandardMaterial color="#475569" roughness={0.6} />
      </mesh>

      {/* Dinding Kaca Lobi Dalam Lantai 1 */}
      <mesh position={[0, yCenter, HALF_D - 3.5]}>
        <boxGeometry args={[36, height, 0.12]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.35}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, yCenter, -HALF_D + 3.5]}>
        <boxGeometry args={[36, height, 0.12]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.35}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Kanopi Lobi Masuk FST (Kuning Piramida) */}
      <group position={[0, 0, HALF_D + 1.8]}>
        <mesh position={[0, height + 0.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.8, 1.8, 4]} />
          <meshStandardMaterial color={FST_COLORS.canopyYellow} roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0, height - 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.4, 5.0]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>
        <mesh position={[-3.6, yCenter, 1.8]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.7} />
        </mesh>
        <mesh position={[3.6, yCenter, 1.8]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.7} />
        </mesh>
        <mesh position={[0, height - 0.1, 2.55]}>
          <boxGeometry args={[8.2, 0.68, 0.14]} />
          <meshStandardMaterial color={FST_COLORS.fasciaBlue} roughness={0.5} />
        </mesh>
      </group>

      {/* Kanopi Lobi Pascasarjana (Sisi Selatan) */}
      <group position={[0, 0, -HALF_D - 1.8]}>
        <mesh position={[0, height - 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.0, 0.4, 4.5]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>
        <mesh position={[-3.4, yCenter, -1.6]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.7} />
        </mesh>
        <mesh position={[3.4, yCenter, -1.6]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
});

const StandardFloorFacade = React.memo(function StandardFloorFacade() {
  const {
    wallsGeo,
    rosterSpandrelGeo,
    redAccentGeo,
    greenTrimGeo,
    windowsGeo,
    acUnitsGeo,
  } = getStandardFacadeGeometries();

  return (
    <group>
      <mesh geometry={wallsGeo} castShadow receiveShadow>
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh geometry={rosterSpandrelGeo} receiveShadow>
        <meshStandardMaterial color={FST_COLORS.rosterCream} roughness={0.85} />
      </mesh>
      <mesh geometry={redAccentGeo}>
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh geometry={greenTrimGeo}>
        <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.65} />
      </mesh>
      <mesh geometry={windowsGeo}>
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.45}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={acUnitsGeo}>
        <meshStandardMaterial color={FST_COLORS.acCompressor} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
});

const TopFloorArchedFacade = React.memo(function TopFloorArchedFacade() {
  const { wallsGeo, archTrimGeo, greenFasciaGeo, windowsGeo, acUnitsGeo } =
    getTopFloorArchedGeometries();

  return (
    <group>
      <mesh geometry={wallsGeo} castShadow receiveShadow>
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh geometry={archTrimGeo}>
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh geometry={greenFasciaGeo}>
        <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.6} />
      </mesh>
      <mesh geometry={windowsGeo}>
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.5}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={acUnitsGeo}>
        <meshStandardMaterial color={FST_COLORS.acCompressor} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  );
});

const CenterTowerFacade = React.memo(function CenterTowerFacade() {
  const height = FLOOR_HEIGHT;
  const yCenter = height / 2;

  return (
    <group>
      {/* Menara Tengah Utara (Lobby Sarjana) - Krem Putih Bersih */}
      <mesh position={[0, yCenter, HALF_D + 0.7]} castShadow receiveShadow>
        <boxGeometry args={[13.2, height, 1.4]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      <mesh position={[-6.6, yCenter, HALF_D + 0.85]}>
        <boxGeometry args={[0.48, height, 0.55]} />
        <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.7} />
      </mesh>
      <mesh position={[6.6, yCenter, HALF_D + 0.85]}>
        <boxGeometry args={[0.48, height, 0.55]} />
        <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.7} />
      </mesh>
      {[-1.8, 0, 1.8].map((xOff, i) => (
        <mesh key={`n-win-${i}`} position={[xOff, yCenter, HALF_D + 1.42]}>
          <boxGeometry args={[0.95, height - 0.55, 0.08]} />
          <meshStandardMaterial
            color={FST_COLORS.glassSky}
            transparent
            opacity={0.45}
            roughness={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Menara Tengah Selatan (Lobby Pascasarjana) - Krem Putih Bersih */}
      <mesh position={[0, yCenter, -HALF_D - 0.7]} castShadow receiveShadow>
        <boxGeometry args={[13.2, height, 1.4]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      <mesh position={[-6.6, yCenter, -HALF_D - 0.85]}>
        <boxGeometry args={[0.48, height, 0.55]} />
        <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.7} />
      </mesh>
      <mesh position={[6.6, yCenter, -HALF_D - 0.85]}>
        <boxGeometry args={[0.48, height, 0.55]} />
        <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.7} />
      </mesh>
      {[-1.8, 0, 1.8].map((xOff, i) => (
        <mesh key={`s-win-${i}`} position={[xOff, yCenter, -HALF_D - 1.42]}>
          <boxGeometry args={[0.95, height - 0.55, 0.08]} />
          <meshStandardMaterial
            color={FST_COLORS.glassSky}
            transparent
            opacity={0.45}
            roughness={0.15}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
});
