import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus, getStatusColor, RoomClimateStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";
import { FST_COLORS } from "./FstBuildingExterior";

interface Floor3DCutawayProps {
  floor: FloorModel;
  isBuildingStack?: boolean;
  onRoomSelect: (slotId: string) => void;
}

export const Floor3DCutaway: React.FC<Floor3DCutawayProps> = ({
  floor,
  isBuildingStack = false,
  onRoomSelect,
}) => {
  const { selectedSlotId, hoveredSlotId, setHoveredSlotId, layer, objectFilters } =
    useViewStore();
  const { rooms: liveRooms } = useRoomStore();
  const now = new Date();

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Pelat Dasar Lantai dengan Lubang Void Atrium (Permukaan atas di y = -0.02, bebas z-fighting) */}
      <FloorCutawayBase floor={floor} />

      {/* 2. Dinding Perimeter Bertema FST (Hanya dirender saat mode lantai atau saat fasad luar disembunyikan agar tidak z-fighting dengan fasad) */}
      {(!isBuildingStack || !objectFilters.roofAndFacade) && <CutawayPerimeterWalls />}

      {/* 3. Selasar Koridor Void Melingkar dengan Tanaman Gantung */}
      <AtriumCutawayBalcony
        showTrees={objectFilters.trees}
        isBuildingStack={isBuildingStack}
        level={floor.level}
      />

      {/* 4. Tangga Balok Setengah Lingkaran & 4 Unit Lift di Sisi Void/Core
          (Saat full-view gedung, silinder tangga tertutup rapat sehingga mesh tangga di dalamnya di-cull untuk performa 60fps) */}
      <CutawayCoreStairsAndLifts
        level={floor.level}
        showStairs={objectFilters.stairs && !isBuildingStack}
        showLifts={objectFilters.lifts}
      />

      {/* 5. Saintek Hub Lounge di Tengah Lantai */}
      <SaintekHubLounge
        level={floor.level}
        showFurniture={objectFilters.furniture && !isBuildingStack}
        showTrees={objectFilters.trees}
      />

      {/* 6. Ruang Teater Amphitheater Berundak di Sudut Timur */}
      {objectFilters.furniture && !isBuildingStack && (
        <TheaterAmphitheaterSeating level={floor.level} />
      )}

      {/* 7. Seluruh Ruangan Interaktif (Warna Heatmap / Status IoT & Furnitur Simbolis) */}
      {floor.rooms.map((room) => {
        const live = liveRooms[room.slotId];
        const status: RoomClimateStatus = !room.hasDevice
          ? "NO_DEVICE"
          : live
          ? deriveRoomStatus(live, now)
          : "OCCUPIED";

        const color = getStatusColor(status, layer, live?.temperature ?? null);
        const isSelected = selectedSlotId === room.slotId;
        const isHovered = hoveredSlotId === room.slotId;

        return (
          <InteractiveRoomBox
            key={room.slotId}
            room={room}
            color={color}
            isSelected={isSelected}
            isHovered={isHovered}
            isBuildingStack={isBuildingStack}
            showFurniture={objectFilters.furniture && (!isBuildingStack || room.hasDevice)}
            showLabel={objectFilters.roomLabels && (!isBuildingStack || room.hasDevice)}
            onClick={() => onRoomSelect(room.slotId)}
            onPointerOver={() => setHoveredSlotId(room.slotId)}
            onPointerOut={() => setHoveredSlotId(null)}
          />
        );
      })}
    </group>
  );
};

// =========================================================================
// 1. Pelat Lantai Dasar dengan Void Atrium & Potongan Datar Setengah Lingkaran
// Permukaan atas berada di y = -0.02 (dari -0.32 s/d -0.02) agar 100% bebas glitch/z-fighting!
// =========================================================================
function FloorCutawayBase({ floor }: { floor: FloorModel }) {
  // Pelat Utama dengan Lubang Void Persegi
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

  // Potongan Datar Setengah Lingkaran Lantai Sisi Utara (Menghadap Void Atrium)
  const northSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, -17.0);
    s.absarc(0, -17.0, 4.4, Math.PI, 0, true);
    s.closePath();
    return s;
  }, []);

  // Potongan Datar Setengah Lingkaran Lantai Sisi Selatan (Menghadap Void Atrium)
  const southSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, 17.0);
    s.absarc(0, 17.0, 4.4, Math.PI, 2 * Math.PI, false);
    s.closePath();
    return s;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
      {/* 1. Pelat Lantai Utama dengan Lubang Void */}
      <mesh receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>

      {/* 2. Potongan Datar Setengah Lingkaran Sisi Utara */}
      <mesh receiveShadow>
        <extrudeGeometry args={[northSlabShape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>

      {/* 3. Potongan Datar Setengah Lingkaran Sisi Selatan */}
      <mesh receiveShadow>
        <extrudeGeometry args={[southSlabShape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 2. Dinding Perimeter Luar Rendah (~1.2m Cutaway) Khas FST
// Menampilkan identitas krem + pilaster coral red tanpa menghalangi pandangan ke dalam ruang
// =========================================================================
function CutawayPerimeterWalls() {
  const wallH = 2.5;
  const halfW = 31.9;
  const halfD = 27.9;

  return (
    <group>
      {/* Dinding Rendah Utara & Selatan */}
      <mesh position={[0, wallH / 2, halfD]} castShadow receiveShadow>
        <boxGeometry args={[63.8, wallH, 0.35]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[0, wallH / 2, -halfD]} castShadow receiveShadow>
        <boxGeometry args={[63.8, wallH, 0.35]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Dinding Rendah Timur & Barat */}
      <mesh position={[halfW, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, wallH, 55.8]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-halfW, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.35, wallH, 55.8]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Lis Penutup Atas Coral-Red Khas FST */}
      <mesh position={[0, wallH + 0.04, halfD]}>
        <boxGeometry args={[64.0, 0.08, 0.45]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, wallH + 0.04, -halfD]}>
        <boxGeometry args={[64.0, 0.08, 0.45]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[halfW, wallH + 0.04, 0]}>
        <boxGeometry args={[0.45, 0.08, 56.0]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[-halfW, wallH + 0.04, 0]}>
        <boxGeometry args={[0.45, 0.08, 56.0]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 3. Selasar Koridor Void Melingkar dengan Tanaman Gantung &
// Dinding Melengkung Setengah Lingkaran Mengelilingi Core Tangga Utara & Selatan
// =========================================================================
function AtriumCutawayBalcony({
  showTrees,
  isBuildingStack,
  level,
}: {
  showTrees: boolean;
  isBuildingStack: boolean;
  level: number;
}) {
  const parapetH = 1.15;
  // Saat full-view gedung (isBuildingStack), silinder 2x setengah lingkaran tertutup penuh (4.6m) menutupi tangga di dalamnya
  const arcWallH = isBuildingStack ? 4.6 : parapetH;
  const voidHalfW = 21.0;
  const voidHalfD = 17.0;

  // Geometri dinding melengkung setengah lingkaran BERLUBANG (Hollow Arc Ring)
  // untuk Core Utara (menjorok ke Z = +12.6) dan Core Selatan (menjorok ke Z = -12.6)
  const northArcWallShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, -voidHalfD);
    s.absarc(0, -voidHalfD, 4.4, Math.PI, 0, true);
    s.lineTo(4.18, -voidHalfD);
    s.absarc(0, -voidHalfD, 4.18, 0, Math.PI, false);
    s.closePath();
    return s;
  }, [voidHalfD]);

  const southArcWallShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, voidHalfD);
    s.absarc(0, voidHalfD, 4.4, Math.PI, 2 * Math.PI, false);
    s.lineTo(4.18, voidHalfD);
    s.absarc(0, voidHalfD, 4.18, 2 * Math.PI, Math.PI, true);
    s.closePath();
    return s;
  }, [voidHalfD]);

  // Penutup atas (Roof Cap) setengah lingkaran saat mode full-view gedung di puncak Lantai 7
  const northCapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.45, -voidHalfD);
    s.absarc(0, -voidHalfD, 4.45, Math.PI, 0, true);
    s.closePath();
    return s;
  }, [voidHalfD]);

  const southCapShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.45, voidHalfD);
    s.absarc(0, voidHalfD, 4.45, Math.PI, 2 * Math.PI, false);
    s.closePath();
    return s;
  }, [voidHalfD]);

  return (
    <group>
      {/* A. Dinding Lurus Pembatas Void (Terbuka di Tengah x in [-4.4, 4.4] untuk Akses Core) */}
      <mesh position={[-12.7, parapetH / 2, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      <mesh position={[-12.7, parapetH / 2, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      <mesh position={[voidHalfW, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-voidHalfW, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* B. Dinding Melengkung Setengah Lingkaran Mengelilingi Area Tangga:
          Tertutup penuh (4.6m + tutup atap di Lt.7) saat full-view gedung, dan cutaway (1.15m) saat fokus lantai */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        {/* 1. Dinding Lengkung Core Utara */}
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[northArcWallShape, { depth: arcWallH, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        {/* Lis Merah di Atas Bibir Dinding Lengkung Utara */}
        <mesh position={[0, 0, isBuildingStack ? arcWallH - 0.18 : parapetH]}>
          <extrudeGeometry args={[northArcWallShape, { depth: 0.18, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>

        {/* 2. Dinding Lengkung Core Selatan */}
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[southArcWallShape, { depth: arcWallH, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        {/* Lis Merah di Atas Bibir Dinding Lengkung Selatan */}
        <mesh position={[0, 0, isBuildingStack ? arcWallH - 0.18 : parapetH]}>
          <extrudeGeometry args={[southArcWallShape, { depth: 0.18, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>

        {/* 3. Penutup Atap Setengah Lingkaran (Hanya saat Full-View Gedung di Lantai 7 agar Tangga Tertutup dari Atas) */}
        {isBuildingStack && level === 7 && (
          <>
            <mesh position={[0, 0, arcWallH]} castShadow receiveShadow>
              <extrudeGeometry args={[northCapShape, { depth: 0.25, bevelEnabled: false }]} />
              <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0, arcWallH]} castShadow receiveShadow>
              <extrudeGeometry args={[southCapShape, { depth: 0.25, bevelEnabled: false }]} />
              <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
            </mesh>
          </>
        )}
      </group>

      {/* C. Lis Merah & Tanaman Gantung di Dinding Lurus */}
      <mesh position={[-12.7, parapetH + 0.04, voidHalfD]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[12.7, parapetH + 0.04, voidHalfD]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[-12.7, parapetH + 0.04, -voidHalfD]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[12.7, parapetH + 0.04, -voidHalfD]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {/* Tanaman Hijau di Lis Koridor (Dapat Disembunyikan via Filter Objek) */}
      {showTrees && (
        <>
          <mesh position={[-12.7, parapetH + 0.1, voidHalfD - 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[12.7, parapetH + 0.1, voidHalfD - 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[-12.7, parapetH + 0.1, -voidHalfD + 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[12.7, parapetH + 0.1, -voidHalfD + 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
}

// =========================================================================
// 4. Tangga Imperial Bercabang Dua (T-Shape / Y-Shape Split Staircase)
// Sesuai Foto Referensi:
// - 1 Jalur tangga tengah bawah naik menuju bordes tengah
// - Tiang silinder putih penyangga di bawah bordes tengah
// - 2 Jalur cabang kiri & kanan naik berbalik arah dari bordes menuju lantai atas
// Masuk sepenuhnya dengan rapi di dalam area setengah lingkaran (r < 4.18m)
// =========================================================================
function CoreCutawayStairs() {
  // 1. Anak tangga jalur tengah bawah (naik dari z = -0.45 menuju bordes di z = -2.35)
  const centerLowerSteps = [
    { z: -0.45, y: 0.15 },
    { z: -0.78, y: 0.30 },
    { z: -1.11, y: 0.45 },
    { z: -1.44, y: 0.60 },
    { z: -1.77, y: 0.75 },
    { z: -2.10, y: 0.90 },
  ];

  // 2. Anak tangga cabang kiri & kanan atas (naik berbalik arah dari bordes z = -2.10 menuju z = -0.45)
  const splitUpperSteps = [
    { z: -2.10, y: 1.22 },
    { z: -1.77, y: 1.38 },
    { z: -1.44, y: 1.54 },
    { z: -1.11, y: 1.70 },
    { z: -0.78, y: 1.86 },
    { z: -0.45, y: 2.02 },
  ];

  return (
    <group>
      {/* A. Tiang Kolom Silinder Putih Penyangga Bordes Tengah (Sesuai Foto Referensi) */}
      <mesh position={[0, 0.52, -2.85]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, 1.04, 20]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.5} />
      </mesh>

      {/* B. Bordes Tengah (Split Landing Platform) di Ujung Dalam Setengah Lingkaran */}
      <group position={[0, 1.05, -2.82]}>
        {/* Pelat Utama Bordes */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.1, 0.14, 0.96]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
        </mesh>
        {/* Permukaan Kaca/Marmer Terang di Atas Bordes */}
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[4.06, 0.03, 0.92]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Railing Pengaman Belakang Bordes */}
        <mesh position={[0, 0.48, -0.44]}>
          <boxGeometry args={[4.0, 0.05, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* C. Jalur Tangga Tengah Bawah (Central Flight: Lebar 1.36m di x = 0) */}
      <group position={[0, 0, 0]}>
        {/* Balok Stringer Miring Penyangga Kiri & Kanan Jalur Tengah */}
        <mesh position={[-0.58, 0.52, -1.3]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.14, 2.25]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.58, 0.52, -1.3]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.14, 2.25]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
        </mesh>

        {/* Deretan Balok Anak Tangga Tengah */}
        {centerLowerSteps.map((s, i) => (
          <group key={`c-step-${i}`} position={[0, s.y, s.z]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[1.36, 0.07, 0.31]} />
              <meshStandardMaterial color="#CBD5E1" roughness={0.4} metalness={0.2} />
            </mesh>
            <mesh position={[0, 0.04, 0.13]}>
              <boxGeometry args={[1.36, 0.015, 0.04]} />
              <meshStandardMaterial color="#475569" roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Handrail Pegangan Kiri & Kanan Jalur Tengah */}
        <mesh position={[-0.64, 0.95, -1.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 2.25]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.64, 0.95, -1.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 2.25]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* D. Dua Jalur Cabang Kiri (x = -1.45) & Kanan (x = +1.45) Naik ke Lantai Atas */}
      {[-1.45, 1.45].map((branchX, bIdx) => (
        <group key={`branch-${bIdx}`} position={[branchX, 0, 0]}>
          {/* Balok Stringer Miring Penyangga Cabang */}
          <mesh position={[-0.46, 1.56, -1.3]} rotation={[-0.44, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 0.14, 2.25]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.46, 1.56, -1.3]} rotation={[-0.44, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 0.14, 2.25]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
          </mesh>

          {/* Deretan Balok Anak Tangga Cabang Kiri/Kanan */}
          {splitUpperSteps.map((s, i) => (
            <group key={`u-step-${i}`} position={[0, s.y, s.z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.12, 0.07, 0.31]} />
                <meshStandardMaterial color="#CBD5E1" roughness={0.4} metalness={0.2} />
              </mesh>
              <mesh position={[0, 0.04, -0.13]}>
                <boxGeometry args={[1.12, 0.015, 0.04]} />
                <meshStandardMaterial color="#475569" roughness={0.4} />
              </mesh>
            </group>
          ))}

          {/* Handrail Pegangan Cabang */}
          <mesh position={[-0.52, 2.0, -1.3]} rotation={[-0.44, 0, 0]}>
            <boxGeometry args={[0.04, 0.05, 2.25]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0.52, 2.0, -1.3]} rotation={[-0.44, 0, 0]}>
            <boxGeometry args={[0.04, 0.05, 2.25]} />
            <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Unit Lift Realistis Sesuai Foto Asli FST (Champagne Frame, Stainless Double Leaf, Lis Kuning, Display LCD)
function LiftUnit({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Box Menara / Shaft Lift Tegak */}
      <mesh position={[0, 1.15, -0.1]} castShadow>
        <boxGeometry args={[1.8, 2.3, 0.25]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      {/* Kusen Pintu Lift Champagne/Beige (Sesuai Foto Asli FST) */}
      <mesh position={[0, 1.15, 0.04]} castShadow>
        <boxGeometry args={[1.7, 2.3, 0.08]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
      </mesh>
      {/* Daun Pintu Stainless Steel Double Leaf */}
      <mesh position={[-0.39, 1.1, 0.08]}>
        <boxGeometry args={[0.74, 2.15, 0.02]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.39, 1.1, 0.08]}>
        <boxGeometry args={[0.74, 2.15, 0.02]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Garis Aksen Grafis Kuning FST pada Pintu (Sesuai Foto Asli Saintek Hub) */}
      <mesh position={[-0.39, 0.8, 0.095]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      <mesh position={[0.39, 0.8, 0.095]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      {/* Display Indikator Lantai Digital di Atas Pintu */}
      <mesh position={[0, 2.12, 0.09]}>
        <boxGeometry args={[0.42, 0.14, 0.02]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.12, 0.102]}>
        <boxGeometry args={[0.3, 0.07, 0.005]} />
        <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.9} />
      </mesh>
      {/* Panel Tombol Panggil Lift di Samping Kusen */}
      <mesh position={[0.74, 1.1, 0.08]}>
        <boxGeometry args={[0.08, 0.22, 0.02]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>
      <mesh position={[0.74, 1.1, 0.092]}>
        <boxGeometry args={[0.04, 0.04, 0.005]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function CutawayCoreStairsAndLifts({
  level: _level,
  showStairs,
  showLifts,
}: {
  level: number;
  showStairs: boolean;
  showLifts: boolean;
}) {
  return (
    <group>
      {/* Tangga Sisi Utara & Selatan: di dalam Area Setengah Lingkaran Menghadap Void */}
      {showStairs && (
        <>
          <group position={[0, 0, 17.0]}>
            <CoreCutawayStairs />
          </group>
          <group position={[0, 0, -17.0]} rotation={[0, Math.PI, 0]}>
            <CoreCutawayStairs />
          </group>
        </>
      )}

      {/* 2 Unit Lift Sisi Selatan: Menempel di Dinding Bergaris Merah Selatan (Z = -27.7) */}
      {showLifts && (
        <group position={[0, 0, 0]}>
          <LiftUnit position={[-4.5, 0, -27.7]} rotation={[0, 0, 0]} />
          <LiftUnit position={[4.5, 0, -27.7]} rotation={[0, 0, 0]} />
        </group>
      )}
    </group>
  );
}

// Kursi Bar Kayu Tinggi 4 Kaki (Sesuai Foto Asli Saintek Hub)
function WoodenBarStool({ position }: { position: [number, number, number] }) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]}>
      {/* Dudukan Kursi Kayu Persegi */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.38, 0.05, 0.38]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>
      {/* 4 Kaki Kayu Miring */}
      {[-0.14, 0.14].map((lx, i) =>
        [-0.14, 0.14].map((lz, j) => (
          <mesh key={`${i}-${j}`} position={[lx, 0.3, lz]}>
            <boxGeometry args={[0.04, 0.6, 0.04]} />
            <meshStandardMaterial color="#B45309" roughness={0.6} />
          </mesh>
        ))
      )}
      {/* Pijakan Kaki (Footrest Crossbar) */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.32, 0.03, 0.32]} />
        <meshStandardMaterial color="#92400E" roughness={0.6} />
      </mesh>
    </group>
  );
}

// Meja Belajar Komunal & Bangku Rangka Hitam (Sesuai Foto Asli Saintek Hub)
function CommunalTableSet({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const [x, y, z] = position;
  return (
    <group position={[x, y, z]} rotation={rotation}>
      {/* Daun Meja Kayu Hangat */}
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[2.2, 0.07, 0.95]} />
        <meshStandardMaterial color="#78350F" roughness={0.55} />
      </mesh>
      {/* Rangka Kaki Metal Hitam Model Trapesium / A-Frame (Foto Asli) */}
      {[-0.85, 0.85].map((lx, i) => (
        <group key={i} position={[lx, 0, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.06, 0.6, 0.88]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Bangku Kayu Sisi Depan */}
      <mesh position={[0, 0.32, -0.65]} castShadow>
        <boxGeometry args={[2.0, 0.05, 0.32]} />
        <meshStandardMaterial color="#92400E" roughness={0.55} />
      </mesh>
      {[-0.75, 0.75].map((bx, i) => (
        <mesh key={`bf-${i}`} position={[bx, 0.16, -0.65]}>
          <boxGeometry args={[0.05, 0.32, 0.28]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} />
        </mesh>
      ))}

      {/* Bangku Kayu Sisi Belakang */}
      <mesh position={[0, 0.32, 0.65]} castShadow>
        <boxGeometry args={[2.0, 0.05, 0.32]} />
        <meshStandardMaterial color="#92400E" roughness={0.55} />
      </mesh>
      {[-0.75, 0.75].map((bx, i) => (
        <mesh key={`bb-${i}`} position={[bx, 0.16, 0.65]}>
          <boxGeometry args={[0.05, 0.32, 0.28]} />
          <meshStandardMaterial color="#0F172A" roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

// =========================================================================
// 5. Saintek Hub Lounge di Tengah Lantai
// =========================================================================
function SaintekHubLounge({
  level,
  showFurniture,
  showTrees,
}: {
  level: number;
  showFurniture: boolean;
  showTrees: boolean;
}) {
  const { objectFilters } = useViewStore();
  if (level === 1) return null; // Lantai 1 adalah area lobby & void taman

  return (
    <group position={[0, 0, 0]}>
      {/* Area Lantai Lounge Bertekstur Kayu Hangat dari Selasar hingga Dinding Luar */}
      <mesh position={[0, 0.02, 22.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.6, 9.6]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>

      {/* KEDUA LIFT UTARA TERTEMPEL DI SISI DINDING DENGAN GARIS MERAH (Z = 27.7) */}
      {objectFilters.lifts && (
        <>
          <LiftUnit position={[-4.5, 0, 27.7]} rotation={[0, Math.PI, 0]} />
          <LiftUnit position={[4.5, 0, 27.7]} rotation={[0, Math.PI, 0]} />
        </>
      )}

      {/* Dinding Biru Banner Visi "Innovation, Green, Humanity" di Tengah Antara Kedua Lift */}
      <mesh position={[0, 1.2, 27.75]}>
        <boxGeometry args={[6.8, 2.2, 0.06]} />
        <meshStandardMaterial color="#1E40AF" roughness={0.5} />
      </mesh>

      {/* Sisi Kiri & Kanan: Aksen Dinding Bata Merah */}
      <mesh position={[-6.2, 1.2, 27.75]} castShadow>
        <boxGeometry args={[1.4, 2.2, 0.08]} />
        <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.8} />
      </mesh>
      <mesh position={[6.2, 1.2, 27.75]} castShadow>
        <boxGeometry args={[1.4, 2.2, 0.08]} />
        <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.8} />
      </mesh>

      {showFurniture && (
        <>
          {/* Meja Bar Panjang di Bawah Banner Visi */}
          <mesh position={[0, 0.9, 27.2]} castShadow>
            <boxGeometry args={[6.4, 0.08, 0.45]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>

          {/* Kursi Bar Kayu Berjejer di Meja Bar Banner Tengah */}
          {[-2.3, -0.8, 0.8, 2.3].map((x, i) => (
            <WoodenBarStool key={`stool-c-${i}`} position={[x, 0, 26.6]} />
          ))}

          {/* Jendela Bar Samping & Meja Bar Samping */}
          <mesh position={[-6.7, 1.5, 24.5]} rotation={[0, Math.PI / 2, 0]}>
            <boxGeometry args={[3.2, 0.9, 0.04]} />
            <meshStandardMaterial color="#0284C7" transparent opacity={0.6} roughness={0.1} />
          </mesh>
          <mesh position={[-6.4, 0.9, 24.5]} rotation={[0, Math.PI / 2, 0]} castShadow>
            <boxGeometry args={[3.0, 0.08, 0.5]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>
          {[23.2, 24.4, 25.6].map((z, i) => (
            <WoodenBarStool key={`stool-w-${i}`} position={[-5.8, 0, z]} />
          ))}

          {/* Kisi-kisi Balok Kayu Plafon Sisi Kiri */}
          {[-6.2, -5.6, -5.0, -4.4, -3.8].map((x, i) => (
            <mesh key={i} position={[x, 2.4, 24.5]}>
              <boxGeometry args={[0.14, 0.16, 4.8]} />
              <meshStandardMaterial color="#B45309" roughness={0.5} />
            </mesh>
          ))}

          {/* Lampu Gantung Cincin Modern di Bawah Pergola Kayu */}
          <mesh position={[-5.0, 2.1, 24.5]}>
            <torusGeometry args={[0.35, 0.03, 16, 32]} />
            <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={0.8} />
          </mesh>

          {/* DI TENGAH RUANG LOUNGE: KURSI-KURSI DAN MEJA BELAJAR KOMUNAL */}
          <CommunalTableSet position={[-1.7, 0, 22.5]} />
          <CommunalTableSet position={[1.7, 0, 22.5]} />
        </>
      )}

      {/* Pot Semen dengan Tanaman Sansevieria / Lidah Mertua di Batas Selasar */}
      {showTrees &&
        [-4.6, 0, 4.6].map((x, i) => (
          <group key={i} position={[x, 0, 18.2]}>
            <mesh position={[0, 0.2, 0]} castShadow>
              <boxGeometry args={[1.6, 0.38, 0.35]} />
              <meshStandardMaterial color="#94A3B8" roughness={0.7} />
            </mesh>
            <mesh position={[0, 0.62, 0]}>
              <boxGeometry args={[1.4, 0.55, 0.22]} />
              <meshStandardMaterial color="#15803D" roughness={0.4} />
            </mesh>
          </group>
        ))}
    </group>
  );
}

// =========================================================================
// 6. Ruang Teater Amphitheater Berundak di Sudut (TR1 & TR2)
// =========================================================================
function TheaterAmphitheaterSeating({ level }: { level: number }) {
  if (level === 1) return null; // Lantai 1 adalah Mushola & Dapur Kantin

  return (
    <group>
      {/* Teater 1 (Pojok Kiri Depan / Barat Laut: Ruang TR1 di [-28.0, 0, -24.0]) */}
      <group position={[-28.0, 0, -24.0]}>
        <mesh position={[0, 1.2, -4.4]}>
          <boxGeometry args={[8.8, 2.2, 0.15]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.6} />
        </mesh>

        <mesh position={[0, 1.4, -4.3]}>
          <boxGeometry args={[5.2, 1.6, 0.05]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.2, -3.2]} castShadow>
          <boxGeometry args={[6.8, 0.35, 1.8]} />
          <meshStandardMaterial color="#B45309" roughness={0.6} />
        </mesh>

        {[0, 1, 2].map((step) => {
          const z = -1.2 + step * 1.6;
          const y = 0.2 + step * 0.32;
          return (
            <group key={step} position={[0, y, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[7.2, 0.3, 1.2]} />
                <meshStandardMaterial color="#D97706" roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Teater 2 (Pojok Kanan Belakang / Tenggara: Ruang TR2 di [28.0, 0, 24.0]) */}
      <group position={[28.0, 0, 24.0]}>
        <mesh position={[0, 1.2, 4.4]}>
          <boxGeometry args={[8.8, 2.2, 0.15]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.6} />
        </mesh>

        <mesh position={[0, 1.4, 4.3]}>
          <boxGeometry args={[5.2, 1.6, 0.05]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.3} />
        </mesh>

        <mesh position={[0, 0.2, 3.2]} castShadow>
          <boxGeometry args={[6.8, 0.35, 1.8]} />
          <meshStandardMaterial color="#B45309" roughness={0.6} />
        </mesh>

        {[0, 1, 2].map((step) => {
          const z = 1.2 - step * 1.6;
          const y = 0.2 + step * 0.32;
          return (
            <group key={step} position={[0, y, z]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[7.2, 0.3, 1.2]} />
                <meshStandardMaterial color="#D97706" roughness={0.5} />
              </mesh>
            </group>
          );
        })}
      </group>
    </group>
  );
}

// =========================================================================
// 7. Kotak Ruangan Interaktif (Lantai Berwarna Heatmap / Grayscale,
// Dinding Partisi Presisi Sesuai Sayap Gedung, Furnitur, & Label 3D)
// =========================================================================
function InteractiveRoomBox({
  room,
  color,
  isSelected,
  isHovered,
  showFurniture,
  showLabel,
  isBuildingStack = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  room: RoomGeometry;
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  showFurniture: boolean;
  showLabel: boolean;
  isBuildingStack?: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  // Taman void lantai 1 tidak perlu digambar kotak ruangan di atas rumput
  if (room.kind === "garden") return null;

  const wallH = 2.35;
  const hasDevice = room.hasDevice;
  const isCoreLounge = room.kind === "core";
  const isFloor1Corridor =
    room.level === 1 &&
    (room.slotId.includes("-U") ||
      room.slotId.includes("-S") ||
      room.slotId.includes("-B") ||
      (room.slotId.includes("-T") && room.slotId !== "1-T-KANTIN"));
  const isFloor1Lobby =
    room.level === 1 && (room.slotId === "1-CU" || room.slotId === "1-CS");
  const isFloor1Canteen = room.level === 1 && room.slotId === "1-T-KANTIN";

  // Deteksi apakah ruangan berada di Sayap Barat (-B), Sayap Timur (-T), atau Toilet/Tangga Darurat (-WC, -TD)
  // yang berjejer dari Selatan ke Utara (sepanjang sumbu Z).
  const isWestWing = room.slotId.includes("-B");
  const isEastWing = room.slotId.includes("-T") && !room.slotId.includes("-TR");
  const isCornerService = room.slotId.includes("-WC") || room.slotId.includes("-TD");
  const isStackedAlongZ = isWestWing || isEastWing || isCornerService;

  const hasStandardFurniture =
    room.level > 1 &&
    (room.kind === "classroom" ||
      room.kind === "lab" ||
      room.kind === "office" ||
      room.kind === "deanery" ||
      room.kind === "meeting");

  return (
    <group position={[room.center[0], 0, -room.center[1]]}>
      {/* Lantai Ruang (Interaktif: Berwarna Aktif untuk Ruang Ber-IoT R.601, Netral untuk Ruang Tanpa IoT) */}
      {!isCoreLounge && (
        <mesh
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow={!isBuildingStack}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onPointerOver();
          }}
          onPointerOut={onPointerOut}
        >
          <planeGeometry args={[room.size[0] * 0.96, room.size[1] * 0.96]} />
          <meshStandardMaterial
            color={color}
            roughness={0.4}
            emissive={isSelected ? "#2563EB" : isHovered ? "#60A5FA" : color}
            emissiveIntensity={isSelected ? 0.45 : isHovered ? 0.3 : hasDevice ? 0.12 : 0.02}
          />
        </mesh>
      )}

      {/* Dinding Partisi Pembatas Antar-Ruangan:
          - Untuk Sayap Utara (-U) & Selatan (-S): ruangan berjejer sepanjang X, maka partisi tepat di x = ±room.size[0]/2 (menyatu tunggal tanpa celah ganda!)
          - Untuk Sayap Barat (-B) & Timur (-T): ruangan berjejer sepanjang Z, maka partisi melintang di z = ±room.size[1]/2 memisahkan antar-ruangan! */}
      {!isFloor1Corridor && !isFloor1Lobby && !isFloor1Canteen && !isCoreLounge && (
        <>
          {isStackedAlongZ ? (
            <>
              {/* Partisi Utara & Selatan (Memisahkan antar-ruangan di Sayap Barat & Timur, misal Lab 714 - 715 - 716) */}
              <mesh position={[0, wallH / 2, -room.size[1] * 0.5]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
                <boxGeometry args={[room.size[0], wallH, 0.2]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
              <mesh position={[0, wallH / 2, room.size[1] * 0.5]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
                <boxGeometry args={[room.size[0], wallH, 0.2]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
            </>
          ) : (
            <>
              {/* Partisi Kiri & Kanan Tepat di Tepi Batas (±0.5) sehingga Menyatu Tunggal (Contoh R.707 - R.708 - R.709) */}
              <mesh position={[-room.size[0] * 0.5, wallH / 2, 0]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
                <boxGeometry args={[0.2, wallH, room.size[1]]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
              <mesh position={[room.size[0] * 0.5, wallH / 2, 0]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
                <boxGeometry args={[0.2, wallH, room.size[1]]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
            </>
          )}
        </>
      )}

      {/* Dinding Partisi Khusus Ruang Kantin Lantai 1 */}
      {isFloor1Canteen && (
        <group>
          <mesh position={[0, wallH / 2, -room.size[1] * 0.5]} castShadow receiveShadow>
            <boxGeometry args={[room.size[0], wallH, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh position={[0, wallH / 2, room.size[1] * 0.5]} castShadow receiveShadow>
            <boxGeometry args={[room.size[0], wallH, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh
            position={[-room.size[0] * 0.48, wallH / 2, -room.size[1] * 0.28]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.22, wallH, room.size[1] * 0.38]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh
            position={[-room.size[0] * 0.48, wallH / 2, room.size[1] * 0.28]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[0.22, wallH, room.size[1] * 0.38]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>

          {showFurniture && (
            <>
              <mesh position={[room.size[0] * 0.3, 0.5, 0]} castShadow>
                <boxGeometry args={[1.2, 1.0, room.size[1] * 0.72]} />
                <meshStandardMaterial color="#1E293B" roughness={0.3} />
              </mesh>
              <mesh position={[room.size[0] * 0.3, 1.02, 0]}>
                <boxGeometry args={[1.35, 0.06, room.size[1] * 0.74]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.3} />
              </mesh>

              {[-6.2, -2.1, 2.1, 6.2].map((zPos, idx) => (
                <group key={idx} position={[-room.size[0] * 0.1, 0, zPos]}>
                  <mesh position={[0, 0.46, 0]} castShadow>
                    <boxGeometry args={[1.7, 0.06, 0.95]} />
                    <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
                  </mesh>
                  <mesh position={[0, 0.23, 0]}>
                    <boxGeometry args={[0.08, 0.46, 0.08]} />
                    <meshStandardMaterial color="#475569" roughness={0.4} />
                  </mesh>
                  {[-0.6, 0.6].map((cx, cIdx) => (
                    <group key={cIdx} position={[cx, 0, 0]}>
                      <mesh position={[0, 0.26, 0]} castShadow>
                        <cylinderGeometry args={[0.2, 0.2, 0.05, 16]} />
                        <meshStandardMaterial color="#0284C7" roughness={0.5} />
                      </mesh>
                      <mesh position={[0, 0.13, 0]}>
                        <cylinderGeometry args={[0.03, 0.03, 0.26, 8]} />
                        <meshStandardMaterial color="#475569" roughness={0.4} />
                      </mesh>
                    </group>
                  ))}
                </group>
              ))}
            </>
          )}
        </group>
      )}

      {/* Furnitur Simbolis di Dalam Ruang Kelas / Lab / Kantor (Lantai 2 - 7) */}
      {showFurniture && hasStandardFurniture && (
        <group
          position={[0, 0, 0]}
          rotation={
            isWestWing
              ? [0, Math.PI / 2, 0]
              : isEastWing
              ? [0, -Math.PI / 2, 0]
              : room.slotId.includes("-S")
              ? [0, Math.PI, 0]
              : [0, 0, 0]
          }
        >
          {/* Meja Dosen / Pimpinan */}
          <mesh position={[0, 0.35, -1.8]} castShadow>
            <boxGeometry args={[1.8, 0.35, 0.8]} />
            <meshStandardMaterial color={hasDevice ? "#0369A1" : "#64748B"} roughness={0.6} />
          </mesh>
          {/* Deretan Meja Mahasiswa / Staf */}
          <mesh position={[0, 0.28, 0.8]} castShadow>
            <boxGeometry args={[3.2, 0.25, 1.3]} />
            <meshStandardMaterial color={hasDevice ? "#0EA5E9" : "#94A3B8"} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Unit AC Split & Modul Sensor IoT Acoptimizer di Dinding Ruangan yang Memiliki Alat IoT (R.601) */}
      {hasDevice && (
        <group position={[0, 1.9, -room.size[1] * 0.44]}>
          {/* Unit Indoor AC Split Putih */}
          <mesh castShadow>
            <boxGeometry args={[1.6, 0.38, 0.32]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </mesh>
          {/* kisi Hembusan AC */}
          <mesh position={[0, -0.14, 0.16]}>
            <boxGeometry args={[1.45, 0.06, 0.02]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.6} />
          </mesh>
          {/* Kotak Mikrokontroler IoT ESP32 (mmWave + DHT22 + IR Transmitter) di Samping AC */}
          <mesh position={[1.15, -0.25, 0.08]} castShadow>
            <boxGeometry args={[0.35, 0.42, 0.16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} />
          </mesh>
          {/* Indikator LED Hijau Kehadiran pada Modul IoT */}
          <mesh position={[1.15, -0.15, 0.17]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={1.2} />
          </mesh>
        </group>
      )}

      {/* Lantai 1 Bagian Lorong: Meja & Kursi Komunal */}
      {showFurniture && isFloor1Corridor && (
        <CommunalTableSet
          position={[0, 0, 0]}
          rotation={
            room.slotId.includes("-B") || room.slotId.includes("-T")
              ? [0, Math.PI / 2, 0]
              : [0, 0, 0]
          }
        />
      )}

      {/* Lantai 1 Meja Resepsionis Lobby Sarjana & Pascasarjana */}
      {showFurniture && isFloor1Lobby && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[3.8, 1.0, 0.9]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[4.0, 0.06, 1.0]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Label 3D Teks Nama Ruang (Diperbesar sedikit agar sangat jelas pada View Tampak Atas) */}
      {showLabel && !isFloor1Corridor && !isFloor1Lobby && (
        <Html position={[0, 1.85, 0]} center distanceFactor={68} zIndexRange={[10, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`px-2.5 py-1 rounded-full text-xs font-extrabold shadow-md transition-transform cursor-pointer select-none whitespace-nowrap ${
              isSelected
                ? "bg-blue-600 text-white scale-110 shadow-lg ring-2 ring-white"
                : isHovered
                ? "bg-slate-900 text-white scale-105"
                : hasDevice
                ? "bg-emerald-600 text-white ring-2 ring-white shadow-md"
                : "bg-white/95 text-slate-800 border border-slate-200"
            }`}
          >
            {room.displayName.replace("Ruang ", "R.").replace(" (Pilot AC)", "")}
          </div>
        </Html>
      )}
    </group>
  );
}
