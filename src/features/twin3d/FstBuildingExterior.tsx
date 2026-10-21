import React, { useMemo } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FloorModel } from "../../building/params";

// =========================================================================
// Warna & Material Otentik Gedung FST UIN Syarif Hidayatullah Jakarta
// Disesuaikan persis dengan foto referensi udara dan fasad gedung
// =========================================================================
export const FST_COLORS = {
  creamWall: "#F8F6F0",       // Dinding utama krem cerah / broken white
  whiteTrim: "#FFFFFF",       // Lis profil putih bersih
  coralRed: "#D9534F",        // Warna khas FST: coral / terracotta salmon red
  coralRedDark: "#BD3E3A",    // Lis bingkai fasad merah pekat
  roofTile: "#B24A29",        // Genteng tanah liat terakota Indonesia
  roofRidge: "#8E361A",       // Nok bubungan genteng terakota
  solarBlue: "#1E3A8A",       // Panel surya PV biru pekat
  solarBorder: "#94A3B8",     // Bingkai aluminium panel surya
  domeGreen: "#2E7D32",       // Kubah hijau ikonik FST
  finialGold: "#F59E0B",      // Jarum bulan sabit emas di puncak kubah
  canopyYellow: "#FBBF24",    // Kanopi lobi masuk kuning cerah (Foto 1 & 3)
  fasciaBlue: "#1E40AF",      // Papan nama FAKULTAS SAINS DAN TEKNOLOGI
  glassSky: "#38BDF8",        // Kaca jendela biru langit semi-reflektif
  glassBlock: "#BAE6FD",      // Roster balok kaca buram pada menara tangga
  foliageGreen: "#16A34A",    // Tanaman gantung & pot hijau di lis void
  pineTreeGreen: "#15803D",   // Pohon cemara pinus di taman void
  lawnGreen: "#34D399",       // Rumput taman atrium
  asphaltGray: "#475569",     // Jalan aspal & parkiran
  paverLight: "#E2E8F0",      // Paving plaza jalan masuk
  doorBrown: "#854D0E",       // Pintu kayu jati cokelat
  acCompressor: "#F1F5F9",    // Kotak outdoor AC di luar fasad jendela
  rosterCream: "#F3EFE6",     // Kisi-kisi roster ventilasi krem
};

// Tinggi per lantai presisi: 4.6 meter
const FLOOR_HEIGHT = 4.6;

interface FstBuildingExteriorProps {
  floors: FloorModel[];
  isCutaway: boolean;
  hoveredFloor: number | null;
  onFloorClick: (level: number) => void;
  onFloorHover: (level: number | null) => void;
}

export const FstBuildingExterior: React.FC<FstBuildingExteriorProps> = ({
  floors,
  isCutaway,
  hoveredFloor,
  onFloorClick,
  onFloorHover,
}) => {
  const halfW = 32;
  const halfD = 28;
  const voidHalfW = 21;
  const voidHalfD = 17;
  const topElevation = 7 * FLOOR_HEIGHT;

  return (
    <group>
      {/* 1. Tiap Lantai Fasad Luar & Selasar Koridor Void (Lantai 1 s/d 7) */}
      {floors.map((floor) => {
        const yBase = (floor.level - 1) * FLOOR_HEIGHT;
        const isHovered = hoveredFloor === floor.level;

        return (
          <group key={floor.level} position={[0, yBase, 0]}>
            {/* Pelat Lantai & Balok Sabuk Spandrel Fasad Tembus Rapat */}
            <InteractiveFloorSlab
              floor={floor}
              isHovered={isHovered}
              onClick={() => onFloorClick(floor.level)}
              onPointerOver={(e) => {
                e.stopPropagation();
                onFloorHover(floor.level);
              }}
              onPointerOut={() => onFloorHover(null)}
            />

            {/* 4 Menara Sudut Menonjol (Grid Coral-Red & Krem) - Tinggi Penuh 4.6m Rapat */}
            <CornerPavilions />

            {/* Fasad Sisi Luar Bangunan - Tinggi Penuh 4.6m Rapat Tanpa Celah */}
            {floor.level === 1 ? (
              <GroundFloorFacade halfW={halfW} halfD={halfD} />
            ) : floor.level === 7 ? (
              <TopFloorArchedFacade halfW={halfW} halfD={halfD} />
            ) : (
              <StandardFloorFacade halfW={halfW} halfD={halfD} />
            )}

            {/* Fasad Menara Tengah (Kubah Sarjana di Utara & Pascasarjana di Selatan) */}
            <CenterTowerFacade halfD={halfD} />

            {/* Selasar Koridor Melingkar Void Atrium dengan Tanaman Gantung Hijau */}
            <AtriumInnerBalconies voidHalfW={voidHalfW} voidHalfD={voidHalfD} />

            {/* Menara Tangga/Lift Silinder Melengkung di Sisi Void Atrium */}
            <CourtyardCurvedCores />
          </group>
        );
      })}

      {/* 2. Atap Genteng Terakota, Panel Surya, 4 Menara Limasan, 2 Kubah Hijau,
          DAN VOID ATRIUM TERBUKA KE LANGIT (Dapat Melihat Taman Lantai 1 dari Atas) */}
      {!isCutaway && (
        <group position={[0, topElevation, 0]}>
          <FstRoofDomesAndSolar
            halfW={halfW}
            halfD={halfD}
            voidHalfW={voidHalfW}
            voidHalfD={voidHalfD}
          />
        </group>
      )}
    </group>
  );
};

// =========================================================================
// Pelat Lantai Interaktif dengan Balok Sabuk Spandrel Keliling Fasad
// Menutup rapat pertemuan antar-lantai (zero gap / anti-bocor)
// =========================================================================
function InteractiveFloorSlab({
  floor,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  floor: FloorModel;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: (e: any) => void;
  onPointerOut: () => void;
}) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const [first, ...rest] = floor.outerPolygon;
    s.moveTo(first[0], -first[1]);
    rest.forEach(([x, y]) => s.lineTo(x, -y));
    s.closePath();

    const hole = new THREE.Path();
    const [hFirst, ...hRest] = floor.voidPolygon;
    hole.moveTo(hFirst[0], -hFirst[1]);
    hRest.forEach(([x, y]) => hole.lineTo(x, -y));
    hole.closePath();
    s.holes.push(hole);

    return s;
  }, [floor]);

  return (
    <group>
      {/* Pelat Lantai Beton Putih */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <extrudeGeometry
          args={[
            shape,
            { depth: 0.5, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06 },
          ]}
        />
        <meshStandardMaterial
          color={isHovered ? "#93C5FD" : FST_COLORS.creamWall}
          roughness={0.7}
          emissive={isHovered ? "#3B82F6" : "#000000"}
          emissiveIntensity={isHovered ? 0.35 : 0}
        />
      </mesh>

      {/* Balok Sabuk Spandrel Merah Terakota Keliling Fasad (Tinggi 0.6m, Menutup Pertemuan Lantai) */}
      <mesh position={[0, 0.25, 28.08]}>
        <boxGeometry args={[64.2, 0.58, 0.2]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.25, -28.08]}>
        <boxGeometry args={[64.2, 0.58, 0.2]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.75} />
      </mesh>
      <mesh position={[32.08, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.58, 56.2]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.75} />
      </mesh>
      <mesh position={[-32.08, 0.25, 0]}>
        <boxGeometry args={[0.2, 0.58, 56.2]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.75} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 4 Menara Sudut Menonjol (Corner Pavilions)
// Berdasarkan Foto Udara: Blok menara sudut berbingkai grid merah terakota
// Tinggi penuh 4.6m dari y=0 ke y=4.6 rapat tanpa celah
// =========================================================================
function CornerPavilions() {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  // Dinding krem menara sudut rapat
  const wallGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    const corners = [
      { x: -28.2, z: 24.2 },
      { x: 28.2, z: 24.2 },
      { x: -28.2, z: -24.2 },
      { x: 28.2, z: -24.2 },
    ];

    corners.forEach(({ x, z }) => {
      const b = new THREE.BoxGeometry(10.2, height, 10.2);
      b.translate(x, yCenter, z);
      boxes.push(b);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, yCenter]);

  // Lis & Pilaster Coral-Red Pembentuk Grid Khas FST
  const trimGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    const corners = [
      { x: -28.2, z: 24.2 },
      { x: 28.2, z: 24.2 },
      { x: -28.2, z: -24.2 },
      { x: 28.2, z: -24.2 },
    ];

    corners.forEach(({ x, z }) => {
      const signX = x > 0 ? 1 : -1;
      const signZ = z > 0 ? 1 : -1;

      // 4 Pilaster sudut vertikal penuh 4.6m
      const pCorner = new THREE.BoxGeometry(0.5, height, 0.5);
      pCorner.translate(x + signX * 5.15, yCenter, z + signZ * 5.15);
      boxes.push(pCorner);

      // Pilaster tengah sisi luar X
      const pMidX = new THREE.BoxGeometry(0.38, height, 0.42);
      pMidX.translate(x + signX * 5.15, yCenter, z);
      boxes.push(pMidX);

      // Pilaster tengah sisi luar Z
      const pMidZ = new THREE.BoxGeometry(0.42, height, 0.38);
      pMidZ.translate(x, yCenter, z + signZ * 5.15);
      boxes.push(pMidZ);

      // Balok sabuk horizontal merah di tengah lantai
      const beltX = new THREE.BoxGeometry(0.28, 0.42, 10.3);
      beltX.translate(x + signX * 5.15, yCenter, z);
      boxes.push(beltX);

      const beltZ = new THREE.BoxGeometry(10.3, 0.42, 0.28);
      beltZ.translate(x, yCenter, z + signZ * 5.15);
      boxes.push(beltZ);

      // Balok sabuk atas rapat menyentuh lantai berikutnya (y = 4.4m)
      const topBeltX = new THREE.BoxGeometry(0.28, 0.45, 10.3);
      topBeltX.translate(x + signX * 5.15, height - 0.22, z);
      boxes.push(topBeltX);

      const topBeltZ = new THREE.BoxGeometry(10.3, 0.45, 0.28);
      topBeltZ.translate(x, height - 0.22, z + signZ * 5.15);
      boxes.push(topBeltZ);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, yCenter]);

  // Jendela Kaca Kecil Vertikal pada Menara Sudut
  const glassGeo = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];
    const corners = [
      { x: -28.2, z: 24.2 },
      { x: 28.2, z: 24.2 },
      { x: -28.2, z: -24.2 },
      { x: 28.2, z: -24.2 },
    ];

    corners.forEach(({ x, z }) => {
      const signX = x > 0 ? 1 : -1;
      const signZ = z > 0 ? 1 : -1;

      // Jendela atas dan bawah di sisi luar
      const winX1 = new THREE.BoxGeometry(0.12, 1.3, 2.2);
      winX1.translate(x + signX * 5.18, yCenter + 1.15, z);
      planes.push(winX1);

      const winX2 = new THREE.BoxGeometry(0.12, 1.3, 2.2);
      winX2.translate(x + signX * 5.18, yCenter - 1.15, z);
      planes.push(winX2);

      const winZ1 = new THREE.BoxGeometry(2.2, 1.3, 0.12);
      winZ1.translate(x, yCenter + 1.15, z + signZ * 5.18);
      planes.push(winZ1);

      const winZ2 = new THREE.BoxGeometry(2.2, 1.3, 0.12);
      winZ2.translate(x, yCenter - 1.15, z + signZ * 5.18);
      planes.push(winZ2);
    });

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [height, yCenter]);

  return (
    <group>
      {wallGeo && (
        <mesh geometry={wallGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
        </mesh>
      )}
      {trimGeo && (
        <mesh geometry={trimGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      )}
      {glassGeo && (
        <mesh geometry={glassGeo}>
          <meshStandardMaterial
            color={FST_COLORS.glassSky}
            transparent
            opacity={0.4}
            roughness={0.2}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// Fasad Lantai 1: Colonnade Pilar Merah Terbuka & Kanopi Kuning FST
// Sesuai Foto 1 (ground-floor.png) & Foto 3 (top-view-3.png)
// Rapat penuh 4.6m dengan balok lintel atas menutup ke lantai 2
// =========================================================================
function GroundFloorFacade({ halfW, halfD }: { halfW: number; halfD: number }) {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  // Kolom pilar merah terakota colonnade + balok lintel atas
  const pillarsGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Pilar Utara & Selatan tinggi penuh 4.6m
    for (let x = -20; x <= 20; x += 4.5) {
      if (Math.abs(x) < 4.5) continue; // Ruang gerbang lobi tengah
      const colN = new THREE.BoxGeometry(0.75, height, 0.75);
      colN.translate(x, yCenter, halfD);
      boxes.push(colN);

      const colS = new THREE.BoxGeometry(0.75, height, 0.75);
      colS.translate(x, yCenter, -halfD);
      boxes.push(colS);
    }

    // Pilar Timur & Barat tinggi penuh 4.6m
    for (let z = -16; z <= 16; z += 5.5) {
      const colE = new THREE.BoxGeometry(0.75, height, 0.75);
      colE.translate(halfW, yCenter, z);
      boxes.push(colE);

      const colW = new THREE.BoxGeometry(0.75, height, 0.75);
      colW.translate(-halfW, yCenter, z);
      boxes.push(colW);
    }

    // Balok Lintel Atas Rapat (Spans y = 4.0 ke y = 4.6, menutup ke lantai 2)
    const lintelN = new THREE.BoxGeometry(43, 0.6, 0.85);
    lintelN.translate(0, height - 0.3, halfD);
    boxes.push(lintelN);

    const lintelS = new THREE.BoxGeometry(43, 0.6, 0.85);
    lintelS.translate(0, height - 0.3, -halfD);
    boxes.push(lintelS);

    const lintelE = new THREE.BoxGeometry(0.85, 0.6, 39);
    lintelE.translate(halfW, height - 0.3, 0);
    boxes.push(lintelE);

    const lintelW = new THREE.BoxGeometry(0.85, 0.6, 39);
    lintelW.translate(-halfW, height - 0.3, 0);
    boxes.push(lintelW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {/* Kolom Colonnade & Balok Lintel Merah Terakota */}
      {pillarsGeo && (
        <mesh geometry={pillarsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      )}

      {/* Dinding Kaca Lobi Dalam Lantai 1 (Mundur 3.5m dari pilar colonnade) */}
      <mesh position={[0, yCenter, halfD - 3.5]}>
        <boxGeometry args={[36, height, 0.12]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.35}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, yCenter, -halfD + 3.5]}>
        <boxGeometry args={[36, height, 0.12]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.35}
          roughness={0.2}
          depthWrite={false}
        />
      </mesh>

      {/* Kanopi Lobi Masuk FST (Kuning Piramida Khas Foto 1 & 3) */}
      <group position={[0, 0, halfD + 1.8]}>
        {/* Atap Kanopi Piramida Kuning */}
        <mesh position={[0, height + 0.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
          <coneGeometry args={[3.8, 1.8, 4]} />
          <meshStandardMaterial color={FST_COLORS.canopyYellow} roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Plat Dak Kanopi Putih */}
        <mesh position={[0, height - 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.5, 0.4, 5.0]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>

        {/* Tiang Penopang Kanopi */}
        <mesh position={[-3.6, yCenter, 1.8]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
        <mesh position={[3.6, yCenter, 1.8]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>

        {/* Papan Tulisan FAKULTAS SAINS DAN TEKNOLOGI (Banner Biru) */}
        <mesh position={[0, height - 0.1, 2.55]}>
          <boxGeometry args={[8.2, 0.68, 0.14]} />
          <meshStandardMaterial color={FST_COLORS.fasciaBlue} roughness={0.5} />
        </mesh>
      </group>

      {/* Kanopi Lobi Pascasarjana (Sisi Selatan) */}
      <group position={[0, 0, -halfD - 1.8]}>
        <mesh position={[0, height - 0.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[8.0, 0.4, 4.5]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>
        <mesh position={[-3.4, yCenter, -1.6]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
        <mesh position={[3.4, yCenter, -1.6]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// Fasad Standar Lantai 2 s/d 6
// Berdasarkan Foto 1 & 2: Dinding krem dengan pilaster coral, spandrel merah,
// roster kisi-kisi dan unit outdoor AC di bawah jendela!
// DIBUAT RAPAT PENUH: Memiliki balok spandrel bawah DAN balok lintel atas
// sehingga menutup 100% tinggi 4.6m tanpa celah/bocor pandangan!
// =========================================================================
function StandardFloorFacade({ halfW, halfD }: { halfW: number; halfD: number }) {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  // Dinding krem fasad solid
  const wallsGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Timur & Barat: Panel dinding solid penuh 4.6m
    const wallE = new THREE.BoxGeometry(0.24, height, 38.2);
    wallE.translate(halfW, yCenter, 0);
    boxes.push(wallE);

    const wallW = new THREE.BoxGeometry(0.24, height, 38.2);
    wallW.translate(-halfW, yCenter, 0);
    boxes.push(wallW);

    // Fasad Utara & Selatan (kiri dan kanan core tengah)
    const wallN1 = new THREE.BoxGeometry(15.8, height, 0.24);
    wallN1.translate(-14.5, yCenter, halfD);
    boxes.push(wallN1);
    const wallN2 = new THREE.BoxGeometry(15.8, height, 0.24);
    wallN2.translate(14.5, yCenter, halfD);
    boxes.push(wallN2);

    const wallS1 = new THREE.BoxGeometry(15.8, height, 0.24);
    wallS1.translate(-14.5, yCenter, -halfD);
    boxes.push(wallS1);
    const wallS2 = new THREE.BoxGeometry(15.8, height, 0.24);
    wallS2.translate(14.5, yCenter, -halfD);
    boxes.push(wallS2);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // Pilaster & Spandrel Coral-Salmon Red (Rapat Penuh Atas & Bawah)
  const pilastersGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Pilaster Timur & Barat
    for (let z = -18; z <= 18; z += 3.2) {
      // Pilaster vertikal tinggi penuh 4.6m
      const pE = new THREE.BoxGeometry(0.35, height, 0.38);
      pE.translate(halfW + 0.1, yCenter, z);
      boxes.push(pE);

      const pW = new THREE.BoxGeometry(0.35, height, 0.38);
      pW.translate(-halfW - 0.1, yCenter, z);
      boxes.push(pW);

      if (z < 17) {
        // 1. Balok spandrel bawah (y = 0 s/d y = 1.0, tinggi 1.0m)
        const spBottomE = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spBottomE.translate(halfW + 0.08, 0.5, z + 1.6);
        boxes.push(spBottomE);

        const spBottomW = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spBottomW.translate(-halfW - 0.08, 0.5, z + 1.6);
        boxes.push(spBottomW);

        // 2. Balok lintel atas RAPAT (y = 3.6 s/d y = 4.6, tinggi 1.0m, menutup ke lantai atas!)
        const spTopE = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spTopE.translate(halfW + 0.08, height - 0.5, z + 1.6);
        boxes.push(spTopE);

        const spTopW = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spTopW.translate(-halfW - 0.08, height - 0.5, z + 1.6);
        boxes.push(spTopW);
      }
    }

    // Pilaster Utara & Selatan
    for (let x = -21; x <= 21; x += 2.6) {
      if (Math.abs(x) < 6.2) continue; // Skip zona menara tengah

      // Pilaster vertikal tinggi penuh 4.6m
      const pN = new THREE.BoxGeometry(0.38, height, 0.35);
      pN.translate(x, yCenter, halfD + 0.1);
      boxes.push(pN);

      const pS = new THREE.BoxGeometry(0.38, height, 0.35);
      pS.translate(x, yCenter, -halfD - 0.1);
      boxes.push(pS);

      if (x < 20 && Math.abs(x + 1.3) >= 6.2) {
        // Balok spandrel bawah (y = 0 s/d 1.0m)
        const spBottomN = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spBottomN.translate(x + 1.3, 0.5, halfD + 0.08);
        boxes.push(spBottomN);

        const spBottomS = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spBottomS.translate(x + 1.3, 0.5, -halfD - 0.08);
        boxes.push(spBottomS);

        // Balok lintel atas RAPAT (y = 3.6 s/d 4.6m, tinggi 1.0m, menutup ke lantai atas!)
        const spTopN = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spTopN.translate(x + 1.3, height - 0.5, halfD + 0.08);
        boxes.push(spTopN);

        const spTopS = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spTopS.translate(x + 1.3, height - 0.5, -halfD - 0.08);
        boxes.push(spTopS);
      }
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // Jendela Kaca Biru Langit (Berada di antara spandrel bawah y=1.0 dan spandrel atas y=3.6)
  const windowsGeo = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];
    const winHeight = 2.4; // Dari y = 1.1 s/d y = 3.5

    // Jendela Timur & Barat
    for (let z = -18; z < 17; z += 3.2) {
      const wE = new THREE.BoxGeometry(0.1, winHeight, 2.2);
      wE.translate(halfW + 0.12, 2.3, z + 1.6);
      planes.push(wE);

      const wW = new THREE.BoxGeometry(0.1, winHeight, 2.2);
      wW.translate(-halfW - 0.12, 2.3, z + 1.6);
      planes.push(wW);
    }

    // Jendela Utara & Selatan
    for (let x = -21; x < 20; x += 2.6) {
      if (Math.abs(x + 1.3) < 6.2) continue;

      const wN = new THREE.BoxGeometry(2.0, winHeight, 0.1);
      wN.translate(x + 1.3, 2.3, halfD + 0.12);
      planes.push(wN);

      const wS = new THREE.BoxGeometry(2.0, winHeight, 0.1);
      wS.translate(x + 1.3, 2.3, -halfD - 0.12);
      planes.push(wS);
    }

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [halfW, halfD]);

  // Unit Outdoor AC Compressor pada Fasad Luar (Detail Khas IoT Gedung FST!)
  const acUnitsGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Unit AC di Sayap Utara & Selatan (di atas spandrel bawah pada y = 1.1)
    for (let x = -20; x <= 20; x += 5.2) {
      if (Math.abs(x) < 6.5) continue;

      const acN = new THREE.BoxGeometry(0.85, 0.55, 0.45);
      acN.translate(x, 1.25, halfD + 0.4);
      boxes.push(acN);

      const acS = new THREE.BoxGeometry(0.85, 0.55, 0.45);
      acS.translate(x, 1.25, -halfD - 0.4);
      boxes.push(acS);
    }

    // Unit AC di Sayap Timur & Barat
    for (let z = -15; z <= 15; z += 6.4) {
      const acE = new THREE.BoxGeometry(0.45, 0.55, 0.85);
      acE.translate(halfW + 0.4, 1.25, z);
      boxes.push(acE);

      const acW = new THREE.BoxGeometry(0.45, 0.55, 0.85);
      acW.translate(-halfW - 0.4, 1.25, z);
      boxes.push(acW);
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [halfW, halfD]);

  return (
    <group>
      {wallsGeo && (
        <mesh geometry={wallsGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
        </mesh>
      )}
      {pilastersGeo && (
        <mesh geometry={pilastersGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      )}
      {windowsGeo && (
        <mesh geometry={windowsGeo}>
          <meshStandardMaterial
            color={FST_COLORS.glassSky}
            transparent
            opacity={0.45}
            roughness={0.15}
            depthWrite={false}
          />
        </mesh>
      )}
      {acUnitsGeo && (
        <mesh geometry={acUnitsGeo} castShadow>
          <meshStandardMaterial color={FST_COLORS.acCompressor} roughness={0.5} metalness={0.2} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// Fasad Lantai 7: Lengkungan Islamik Lancip (Pointed Lancet Arches)
// Ciri Khas Utama Arsitektur FST pada Foto Udara 2 & 3
// Dibuat rapat penuh 4.6m hingga menyentuh dasar lantai atap
// =========================================================================
function TopFloorArchedFacade({ halfW, halfD }: { halfW: number; halfD: number }) {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  const archTrimGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Timur & Barat: Lengkungan Lancip di Tiap Bay
    for (let z = -18; z <= 18; z += 3.2) {
      // Pilaster vertikal tinggi penuh 4.6m
      const pE = new THREE.BoxGeometry(0.38, height, 0.4);
      pE.translate(halfW + 0.1, yCenter, z);
      boxes.push(pE);

      const pW = new THREE.BoxGeometry(0.38, height, 0.4);
      pW.translate(-halfW - 0.1, yCenter, z);
      boxes.push(pW);

      if (z < 17) {
        // Puncak lancip lengkungan (Pointed Arch Peak)
        const peakE = new THREE.BoxGeometry(0.3, 1.1, 2.2);
        peakE.translate(halfW + 0.08, height - 0.65, z + 1.6);
        boxes.push(peakE);

        const peakW = new THREE.BoxGeometry(0.3, 1.1, 2.2);
        peakW.translate(-halfW - 0.08, height - 0.65, z + 1.6);
        boxes.push(peakW);

        // Balok spandrel bawah
        const spE = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spE.translate(halfW + 0.08, 0.5, z + 1.6);
        boxes.push(spE);

        const spW = new THREE.BoxGeometry(0.3, 1.0, 2.9);
        spW.translate(-halfW - 0.08, 0.5, z + 1.6);
        boxes.push(spW);

        // Balok lintel atas penutup rapat ke lantai atap
        const lintelE = new THREE.BoxGeometry(0.32, 0.5, 2.9);
        lintelE.translate(halfW + 0.08, height - 0.25, z + 1.6);
        boxes.push(lintelE);

        const lintelW = new THREE.BoxGeometry(0.32, 0.5, 2.9);
        lintelW.translate(-halfW - 0.08, height - 0.25, z + 1.6);
        boxes.push(lintelW);
      }
    }

    // Fasad Utara & Selatan: Lengkungan Lancip di Tiap Bay
    for (let x = -21; x <= 21; x += 2.6) {
      if (Math.abs(x) < 6.2) continue;

      const pN = new THREE.BoxGeometry(0.4, height, 0.38);
      pN.translate(x, yCenter, halfD + 0.1);
      boxes.push(pN);

      const pS = new THREE.BoxGeometry(0.4, height, 0.38);
      pS.translate(x, yCenter, -halfD - 0.1);
      boxes.push(pS);

      if (x < 20 && Math.abs(x + 1.3) >= 6.2) {
        // Puncak lancip lengkungan
        const peakN = new THREE.BoxGeometry(1.8, 1.1, 0.3);
        peakN.translate(x + 1.3, height - 0.65, halfD + 0.08);
        boxes.push(peakN);

        const peakS = new THREE.BoxGeometry(1.8, 1.1, 0.3);
        peakS.translate(x + 1.3, height - 0.65, -halfD - 0.08);
        boxes.push(peakS);

        // Balok spandrel bawah
        const spN = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spN.translate(x + 1.3, 0.5, halfD + 0.08);
        boxes.push(spN);

        const spS = new THREE.BoxGeometry(2.3, 1.0, 0.3);
        spS.translate(x + 1.3, 0.5, -halfD - 0.08);
        boxes.push(spS);

        // Balok lintel atas penutup rapat ke lantai atap
        const lintelN = new THREE.BoxGeometry(2.3, 0.5, 0.32);
        lintelN.translate(x + 1.3, height - 0.25, halfD + 0.08);
        boxes.push(lintelN);

        const lintelS = new THREE.BoxGeometry(2.3, 0.5, 0.32);
        lintelS.translate(x + 1.3, height - 0.25, -halfD - 0.08);
        boxes.push(lintelS);
      }
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {archTrimGeo && (
        <mesh geometry={archTrimGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// Fasad Menara Tengah (North & South Core Tower)
// Menonjol keluar dari fasad dengan jendela vertikal bertingkat
// Dibuat tinggi penuh 4.6m rapat tanpa celah
// =========================================================================
function CenterTowerFacade({ halfD }: { halfD: number }) {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  return (
    <group>
      {/* Menara Tengah Utara (Lobby Sarjana) */}
      <mesh position={[0, yCenter, halfD + 0.7]} castShadow receiveShadow>
        <boxGeometry args={[13.5, height, 1.4]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      {/* Kolom Pembingkai Merah pada Menara Tengah */}
      <mesh position={[-6.8, yCenter, halfD + 0.85]}>
        <boxGeometry args={[0.55, height, 0.65]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[6.8, yCenter, halfD + 0.85]}>
        <boxGeometry args={[0.55, height, 0.65]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      {/* Jendela Kaca Vertikal Tengah Menara */}
      <mesh position={[0, yCenter, halfD + 1.42]}>
        <boxGeometry args={[4.8, height - 0.3, 0.1]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.4}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Menara Tengah Selatan (Lobby Pascasarjana) */}
      <mesh position={[0, yCenter, -halfD - 0.7]} castShadow receiveShadow>
        <boxGeometry args={[13.5, height, 1.4]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      <mesh position={[-6.8, yCenter, -halfD - 0.85]}>
        <boxGeometry args={[0.55, height, 0.65]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[6.8, yCenter, -halfD - 0.85]}>
        <boxGeometry args={[0.55, height, 0.65]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, yCenter, -halfD - 1.42]}>
        <boxGeometry args={[4.8, height - 0.3, 0.1]} />
        <meshStandardMaterial
          color={FST_COLORS.glassSky}
          transparent
          opacity={0.4}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// =========================================================================
// Selasar Koridor Melingkar Void Atrium dengan Tanaman Gantung Hijau
// Berdasarkan Foto 1 (side-view-from-the-void.png) & Foto 2 (tampak-atas.png)
// =========================================================================
function AtriumInnerBalconies({ voidHalfW, voidHalfD }: { voidHalfW: number; voidHalfD: number }) {
  const parapetH = 1.25;

  // Dinding penghalang void krem
  const parapetGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Sisi Utara & Selatan
    const pN = new THREE.BoxGeometry(voidHalfW * 2, parapetH, 0.22);
    pN.translate(0, parapetH / 2, voidHalfD);
    boxes.push(pN);

    const pS = new THREE.BoxGeometry(voidHalfW * 2, parapetH, 0.22);
    pS.translate(0, parapetH / 2, -voidHalfD);
    boxes.push(pS);

    // Sisi Barat & Timur
    const pE = new THREE.BoxGeometry(0.22, parapetH, voidHalfD * 2);
    pE.translate(voidHalfW, parapetH / 2, 0);
    boxes.push(pE);

    const pW = new THREE.BoxGeometry(0.22, parapetH, voidHalfD * 2);
    pW.translate(-voidHalfW, parapetH / 2, 0);
    boxes.push(pW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [parapetH, voidHalfW, voidHalfD]);

  // Lis pembatas merah terakota di atas parapet
  const capTrimGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    const capN = new THREE.BoxGeometry(voidHalfW * 2 + 0.3, 0.1, 0.3);
    capN.translate(0, parapetH + 0.05, voidHalfD);
    boxes.push(capN);

    const capS = new THREE.BoxGeometry(voidHalfW * 2 + 0.3, 0.1, 0.3);
    capS.translate(0, parapetH + 0.05, -voidHalfD);
    boxes.push(capS);

    const capE = new THREE.BoxGeometry(0.3, 0.1, voidHalfD * 2 + 0.3);
    capE.translate(voidHalfW, parapetH + 0.05, 0);
    boxes.push(capE);

    const capW = new THREE.BoxGeometry(0.3, 0.1, voidHalfD * 2 + 0.3);
    capW.translate(-voidHalfW, parapetH + 0.05, 0);
    boxes.push(capW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [parapetH, voidHalfW, voidHalfD]);

  // Tanaman Gantung & Planters Hijau Rimbun yang Menjuntai (Signature FST!)
  const hangingPlantsGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Pot & daun menjuntai di sisi Utara & Selatan
    for (let x = -19; x <= 19; x += 3.2) {
      if (Math.abs(x) < 4.5) continue; // Ruang tangga/lift
      const plN = new THREE.BoxGeometry(2.6, 0.35, 0.28);
      plN.translate(x, parapetH - 0.1, voidHalfD - 0.14);
      boxes.push(plN);

      // Daun menjuntai ke bawah
      const vineN = new THREE.BoxGeometry(2.4, 0.85, 0.18);
      vineN.translate(x, parapetH - 0.52, voidHalfD - 0.2);
      boxes.push(vineN);

      const plS = new THREE.BoxGeometry(2.6, 0.35, 0.28);
      plS.translate(x, parapetH - 0.1, -voidHalfD + 0.14);
      boxes.push(plS);

      const vineS = new THREE.BoxGeometry(2.4, 0.85, 0.18);
      vineS.translate(x, parapetH - 0.52, -voidHalfD + 0.2);
      boxes.push(vineS);
    }

    // Pot & daun menjuntai di sisi Timur & Barat
    for (let z = -14; z <= 14; z += 3.2) {
      const plE = new THREE.BoxGeometry(0.28, 0.35, 2.6);
      plE.translate(voidHalfW - 0.14, parapetH - 0.1, z);
      boxes.push(plE);

      const vineE = new THREE.BoxGeometry(0.18, 0.85, 2.4);
      vineE.translate(voidHalfW - 0.2, parapetH - 0.52, z);
      boxes.push(vineE);

      const plW = new THREE.BoxGeometry(0.28, 0.35, 2.6);
      plW.translate(-voidHalfW + 0.14, parapetH - 0.1, z);
      boxes.push(plW);

      const vineW = new THREE.BoxGeometry(0.18, 0.85, 2.4);
      vineW.translate(-voidHalfW + 0.2, parapetH - 0.52, z);
      boxes.push(vineW);
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [parapetH, voidHalfW, voidHalfD]);

  return (
    <group>
      {parapetGeo && (
        <mesh geometry={parapetGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
        </mesh>
      )}
      {capTrimGeo && (
        <mesh geometry={capTrimGeo} castShadow>
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      )}
      {hangingPlantsGeo && (
        <mesh geometry={hangingPlantsGeo}>
          <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// Menara Tangga/Lift Silinder Melengkung di Sisi Void Atrium
// Berdasarkan Foto 1 (side-view-from-the-void.png)
// Tinggi penuh 4.6m rapat dari y=0 ke y=4.6
// =========================================================================
function CourtyardCurvedCores() {
  const height = FLOOR_HEIGHT; // 4.6m
  const yCenter = height / 2;  // 2.3m

  return (
    <group>
      {/* Menara Silinder Core Utara */}
      <mesh position={[0, yCenter, 17.5]} castShadow receiveShadow>
        <cylinderGeometry args={[4.4, 4.4, height, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      {/* Roster Balok Kaca Buram Menara Utara */}
      <mesh position={[0, yCenter, 13.1]}>
        <boxGeometry args={[3.4, height - 0.8, 0.1]} />
        <meshStandardMaterial
          color={FST_COLORS.glassBlock}
          transparent
          opacity={0.65}
          roughness={0.3}
          depthWrite={false}
        />
      </mesh>
      {/* Lis Garis Merah Horizontal pada Silinder */}
      <mesh position={[0, height - 0.15, 17.5]} rotation={[0, 0, 0]}>
        <cylinderGeometry args={[4.46, 4.46, 0.28, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {/* Menara Silinder Core Selatan */}
      <mesh position={[0, yCenter, -17.5]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.4, 4.4, height, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      {/* Roster Balok Kaca Buram Menara Selatan */}
      <mesh position={[0, yCenter, -13.1]}>
        <boxGeometry args={[3.4, height - 0.8, 0.1]} />
        <meshStandardMaterial
          color={FST_COLORS.glassBlock}
          transparent
          opacity={0.65}
          roughness={0.3}
          depthWrite={false}
        />
      </mesh>
      {/* Lis Garis Merah Horizontal pada Silinder */}
      <mesh position={[0, height - 0.15, -17.5]} rotation={[0, Math.PI, 0]}>
        <cylinderGeometry args={[4.46, 4.46, 0.28, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
    </group>
  );
}

// =========================================================================
// Struktur Atap Lengkap: Genteng Terakota, Panel Surya, 4 Menara Limasan,
// dan 2 Kubah Hijau Ikonik Gedung FST
// Sesuai Foto Udara 2 (tampak-atas.png) & Foto Udara 3 (top-view-3.png)
//
// PENTING: DAK ATAP MEMILIKI LUBANG VOID TENGAH (HOLLOW SHAPE DENGAN HOLE)
// SEHINGGA DARI SUDUT TOP VIEW VOID DAPAT TERLIHAT JELAS HINGGA LANTAI DASAR!
// =========================================================================
function FstRoofDomesAndSolar({
  halfW,
  halfD,
  voidHalfW,
  voidHalfD,
}: {
  halfW: number;
  halfD: number;
  voidHalfW: number;
  voidHalfD: number;
}) {
  // Dak Atap Beton Berlubang Void (Hollow Rectangle Shape with Hole)
  const roofSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-halfW, -halfD);
    s.lineTo(halfW, -halfD);
    s.lineTo(halfW, halfD);
    s.lineTo(-halfW, halfD);
    s.closePath();

    // Lubang Void Atrium di Tengah (Ukuran 42m x 34m)
    const hole = new THREE.Path();
    hole.moveTo(-voidHalfW, -voidHalfD);
    hole.lineTo(voidHalfW, -voidHalfD);
    hole.lineTo(voidHalfW, voidHalfD);
    hole.lineTo(-voidHalfW, voidHalfD);
    hole.closePath();
    s.holes.push(hole);

    return s;
  }, [halfW, halfD, voidHalfW, voidHalfD]);

  // Atap Genteng Sayap Utara & Selatan (Pitched Roof Genteng Terakota)
  const roofTileGeo = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Sayap Utara (Panjang 41m di antara menara sudut, di luar void)
    const rN1 = new THREE.BoxGeometry(41, 1.2, 6.5);
    rN1.rotateX(0.25);
    rN1.translate(0, 1.8, 25.0);
    boxes.push(rN1);

    // Sayap Selatan
    const rS1 = new THREE.BoxGeometry(41, 1.2, 6.5);
    rS1.rotateX(-0.25);
    rS1.translate(0, 1.8, -25.0);
    boxes.push(rS1);

    // Sayap Barat
    const rW1 = new THREE.BoxGeometry(6.5, 1.2, 34);
    rW1.rotateZ(-0.25);
    rW1.translate(-28.5, 1.8, 0);
    boxes.push(rW1);

    // Sayap Timur
    const rE1 = new THREE.BoxGeometry(6.5, 1.2, 34);
    rE1.rotateZ(0.25);
    rE1.translate(28.5, 1.8, 0);
    boxes.push(rE1);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, []);

  return (
    <group>
      {/* 1. Dak Datar Beton Lantai Atap BERLUBANG VOID TENGAH (Bisa melihat langsung ke taman lt 1) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry
          args={[
            roofSlabShape,
            { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 },
          ]}
        />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.85} />
      </mesh>

      {/* Parapet Pengaman Bibir Void Atap (Tinggi 1.2m, Mengelilingi Lubang Void di Atap) */}
      <mesh position={[0, 0.65, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[voidHalfW * 2, 1.2, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.65, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[voidHalfW * 2, 1.2, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[voidHalfW, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.2, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-voidHalfW, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.2, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Lis Merah & Tanaman Bibir Void Atap */}
      <mesh position={[0, 1.28, voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2 + 0.3, 0.08, 0.32]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.28, -voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2 + 0.3, 0.08, 0.32]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[voidHalfW, 1.28, 0]}>
        <boxGeometry args={[0.32, 0.08, voidHalfD * 2 + 0.3]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[-voidHalfW, 1.28, 0]}>
        <boxGeometry args={[0.32, 0.08, voidHalfD * 2 + 0.3]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {/* 2. Genteng Terakota Miring di 4 Sayap Luar */}
      {roofTileGeo && (
        <mesh geometry={roofTileGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.7} />
        </mesh>
      )}

      {/* 3. 4 Menara Sudut dengan Atap Limasan Piramida (Foto 2 & 3) */}
      {[
        [-28.2, 24.2],
        [28.2, 24.2],
        [-28.2, -24.2],
        [28.2, -24.2],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          {/* Peninggi Badan Menara Sudut */}
          <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.5, 2.8, 10.5]} />
            <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
          </mesh>
          {/* Atap Limasan Piramida Genteng Terakota */}
          <mesh position={[0, 4.2, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[7.8, 3.2, 4]} />
            <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.65} />
          </mesh>
          {/* Nok Bubungan Piramida Gelap */}
          <mesh position={[0, 5.85, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshStandardMaterial color={FST_COLORS.roofRidge} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 4. Susunan Panel Surya PV Biru Gelap (Foto Udara 2 & 3) */}
      {/* 2 Array Panel Surya Besar di Sayap Utara */}
      <group position={[-12.5, 2.5, 24.8]} rotation={[0.25, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[13.5, 0.12, 4.6]} />
          <meshStandardMaterial color={FST_COLORS.solarBlue} roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[13.6, 0.04, 4.7]} />
          <meshStandardMaterial color={FST_COLORS.solarBorder} roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      <group position={[12.5, 2.5, 24.8]} rotation={[0.25, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[13.5, 0.12, 4.6]} />
          <meshStandardMaterial color={FST_COLORS.solarBlue} roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[13.6, 0.04, 4.7]} />
          <meshStandardMaterial color={FST_COLORS.solarBorder} roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* Array Panel Surya di Sayap Selatan */}
      <group position={[0, 2.5, -24.8]} rotation={[-0.25, 0, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[22.0, 0.12, 4.6]} />
          <meshStandardMaterial color={FST_COLORS.solarBlue} roughness={0.2} metalness={0.6} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[22.1, 0.04, 4.7]} />
          <meshStandardMaterial color={FST_COLORS.solarBorder} roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* 5. 2 Kubah Hijau Ikonik FST (Menara Utara & Selatan) */}
      {/* 1. Menara Kubah Utara (Lobby Sarjana) */}
      <group position={[0, 0, 22.0]}>
        {/* Struktur Dasar Menara Putih Kotak */}
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[13.5, 3.6, 7.5]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        {/* Drum Silinder Penopang Kubah */}
        <mesh position={[0, 4.0, 0]} castShadow>
          <cylinderGeometry args={[3.6, 3.8, 1.2, 32]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>
        {/* Kubah Hijau Ikonik FST */}
        <mesh position={[0, 4.6, 0]} castShadow>
          <sphereGeometry args={[3.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.4} metalness={0.15} />
        </mesh>
        {/* Jarum Emas & Bulan Sabit Finial */}
        <mesh position={[0, 8.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.22, 1.4, 12]} />
          <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 9.2, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.2} metalness={0.9} />
        </mesh>
      </group>

      {/* 2. Menara Kubah Selatan (Lobby Pascasarjana) */}
      <group position={[0, 0, -22.0]}>
        <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
          <boxGeometry args={[13.5, 3.6, 7.5]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        <mesh position={[0, 4.0, 0]} castShadow>
          <cylinderGeometry args={[3.6, 3.8, 1.2, 32]} />
          <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.6, 0]} castShadow>
          <sphereGeometry args={[3.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.4} metalness={0.15} />
        </mesh>
        <mesh position={[0, 8.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.22, 1.4, 12]} />
          <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 9.2, 0]}>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    </group>
  );
}
