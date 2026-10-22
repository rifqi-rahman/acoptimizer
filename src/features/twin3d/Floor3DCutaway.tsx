import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { Activity, Flame, Sparkles, User, Zap } from "lucide-react";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus, RoomClimateStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";
import { getStatusColor } from "../plan2d/FloorPlan2D";
import { FST_COLORS } from "./FstBuildingExterior";

interface Floor3DCutawayProps {
  floor: FloorModel;
  onRoomSelect: (slotId: string) => void;
}

export const Floor3DCutaway: React.FC<Floor3DCutawayProps> = ({ floor, onRoomSelect }) => {
  const { selectedSlotId, hoveredSlotId, setHoveredSlotId, layer } = useViewStore();
  const { rooms: liveRooms } = useRoomStore();
  const now = new Date();

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Pelat Dasar Lantai dengan Lubang Void Atrium */}
      <FloorCutawayBase floor={floor} />

      {/* 2. Dinding Perimeter Rendah (Cutaway Style ~1.2m) Bertema FST (Krem + Pilaster Coral) */}
      <CutawayPerimeterWalls />

      {/* 3. Selasar Koridor Void Melingkar dengan Tanaman Gantung */}
      <AtriumCutawayBalcony />

      {/* 4. Menara Tangga Imperial & 2 Lift Melengkung di Sisi Void */}
      <CutawayCoreStairsAndLifts level={floor.level} />

      {/* 5. Saintek Hub Lounge di Tengah Lantai (Foto Lounge Asli FST) */}
      <SaintekHubLounge level={floor.level} />

      {/* 6. Ruang Teater Amphitheater Berundak di Sudut Timur (Foto Teater Asli FST) */}
      <TheaterAmphitheaterSeating level={floor.level} />

      {/* 7. Seluruh Ruangan Interaktif (Warna Heatmap / Status IoT & Furnitur Simbolis) */}
      {floor.rooms.map((room) => {
        const live = liveRooms[room.slotId];
        const status: RoomClimateStatus = live
          ? deriveRoomStatus(live, now)
          : room.hasDevice
          ? "OCCUPIED"
          : "NO_DEVICE";

        const color = getStatusColor(status, layer, live?.temperature ?? null);
        const isSelected = selectedSlotId === room.slotId;
        const isHovered = hoveredSlotId === room.slotId;

        const temp = live?.temperature ?? (room.hasDevice ? 23.8 : 25.5);
        const humidity = live?.humidity ?? (room.hasDevice ? 58 : 62);
        const presence = live?.presence ?? (room.hasDevice ? true : false);
        const acMode = live?.acMode ?? (room.hasDevice ? "COOL" : null);

        return (
          <InteractiveRoomBox
            key={room.slotId}
            room={room}
            color={color}
            status={status}
            temp={temp}
            humidity={humidity}
            presence={presence}
            acMode={acMode}
            isSelected={isSelected}
            isHovered={isHovered}
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
// Sisi Utara & Selatan Menghadap ke Void (Lokasi Tangga Imperial & 2 Lift)
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
  // Menjorok dari Z = 17.0 ke Z = 12.6, radius 4.4m
  const northSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, -17.0);
    s.absarc(0, -17.0, 4.4, Math.PI, 0, true);
    s.closePath();
    return s;
  }, []);

  // Potongan Datar Setengah Lingkaran Lantai Sisi Selatan (Menghadap Void Atrium)
  // Menjorok dari Z = -17.0 ke Z = -12.6, radius 4.4m
  const southSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-4.4, 17.0);
    s.absarc(0, 17.0, 4.4, Math.PI, 2 * Math.PI, false);
    s.closePath();
    return s;
  }, []);

  return (
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
      {/* 1. Pelat Lantai Utama dengan Lubang Void */}
      <mesh receiveShadow>
        <extrudeGeometry
          args={[
            shape,
            { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 },
          ]}
        />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>

      {/* 2. Potongan Datar Setengah Lingkaran Sisi Utara (Bordes Tangga/Lift Core Utara) */}
      <mesh receiveShadow>
        <extrudeGeometry
          args={[
            northSlabShape,
            { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 },
          ]}
        />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>

      {/* 3. Potongan Datar Setengah Lingkaran Sisi Selatan (Bordes Tangga/Lift Core Selatan) */}
      <mesh receiveShadow>
        <extrudeGeometry
          args={[
            southSlabShape,
            { depth: 0.4, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05 },
          ]}
        />
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
  const wallH = 1.35;
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
function AtriumCutawayBalcony() {
  const parapetH = 1.15;
  const voidHalfW = 21.0;
  const voidHalfD = 17.0;

  return (
    <group>
      {/* A. Dinding Lurus Pembatas Void (Terbuka di Tengah x in [-4.4, 4.4] untuk Akses Core) */}
      {/* Sisi Utara: Sayap Kiri (x in [-21, -4.4]) & Sayap Kanan (x in [4.4, 21]) */}
      <mesh position={[-12.7, parapetH / 2, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Sisi Selatan: Sayap Kiri & Sayap Kanan */}
      <mesh position={[-12.7, parapetH / 2, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Sisi Timur & Barat: Dinding Lurus Penuh */}
      <mesh position={[voidHalfW, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-voidHalfW, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* B. Dinding Setengah Lingkaran Melengkung Mengelilingi Core Tangga/Lift Menghadap Void */}
      {/* 1. Silinder Setengah Lingkaran Core Utara (Menjorok ke arah Z = 12.6) */}
      <mesh position={[0, parapetH / 2, voidHalfD]} castShadow receiveShadow>
        <cylinderGeometry args={[4.4, 4.4, parapetH, 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      {/* Lis Garis Merah Coral pada Silinder Utara */}
      <mesh position={[0, parapetH + 0.04, voidHalfD]}>
        <cylinderGeometry args={[4.46, 4.46, 0.08, 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      {/* Roster Balok Kaca Buram pada Silinder Utara */}
      <mesh position={[0, parapetH / 2, voidHalfD]}>
        <cylinderGeometry args={[4.38, 4.38, 0.55, 32, 1, false, Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color={FST_COLORS.glassBlock}
          transparent
          opacity={0.65}
          roughness={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Silinder Setengah Lingkaran Core Selatan (Menjorok ke arah Z = -12.6) */}
      <mesh position={[0, parapetH / 2, -voidHalfD]} castShadow receiveShadow>
        <cylinderGeometry args={[4.4, 4.4, parapetH, 32, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
      </mesh>
      {/* Lis Garis Merah Coral pada Silinder Selatan */}
      <mesh position={[0, parapetH + 0.04, -voidHalfD]}>
        <cylinderGeometry args={[4.46, 4.46, 0.08, 32, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      {/* Roster Balok Kaca Buram pada Silinder Selatan */}
      <mesh position={[0, parapetH / 2, -voidHalfD]}>
        <cylinderGeometry args={[4.38, 4.38, 0.55, 32, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial
          color={FST_COLORS.glassBlock}
          transparent
          opacity={0.65}
          roughness={0.3}
          depthWrite={false}
        />
      </mesh>

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

      {/* Tanaman Hijau di Lis Koridor */}
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
    </group>
  );
}

// =========================================================================
// 4. Tangga di dalam Core Setengah Lingkaran Sisi Void (Berseberangan dengan Lift)
// Visual geometri berundak (kotak-kotak tangga) di area setengah lingkaran & tepi selasar
// =========================================================================
function CoreCutawayStairs() {
  // Anak tangga lurus dari selasar menuju bordes setengah lingkaran
  const centralSteps = [
    { z: 0.60, y: 0.35, w: 3.2, d: 0.28 },
    { z: 0.32, y: 0.28, w: 3.2, d: 0.28 },
    { z: 0.04, y: 0.21, w: 3.2, d: 0.28 },
    { z: -0.24, y: 0.14, w: 3.2, d: 0.28 },
    { z: -0.52, y: 0.07, w: 3.2, d: 0.28 },
  ];

  // Dua cabang tangga (kiri & kanan) di dalam area setengah lingkaran menjorok ke arah void
  const branchSteps = [
    { z: -1.35, y: 0.10, w: 1.4, d: 0.28 },
    { z: -1.63, y: 0.17, w: 1.4, d: 0.28 },
    { z: -1.91, y: 0.24, w: 1.4, d: 0.28 },
    { z: -2.19, y: 0.31, w: 1.4, d: 0.28 },
    { z: -2.47, y: 0.38, w: 1.4, d: 0.28 },
  ];

  return (
    <group>
      {/* A. Anak Tangga Utama di Selasar (Kotak-kotak tangga bertingkat) */}
      {centralSteps.map((s, i) => (
        <group key={`c-step-${i}`} position={[0, 0, s.z]}>
          {/* Badan Riser Tangga */}
          <mesh position={[0, s.y / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[s.w, s.y, s.d]} />
            <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
          </mesh>
          {/* Plat Tread Pijakan Tangga */}
          <mesh position={[0, s.y + 0.01, 0]}>
            <boxGeometry args={[s.w + 0.04, 0.02, s.d + 0.02]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.6} />
          </mesh>
          {/* Lis Nosing Anti-Slip Kontras Tinggi (Tampak Jelas dari Atas) */}
          <mesh position={[0, s.y + 0.022, -s.d / 2 + 0.025]}>
            <boxGeometry args={[s.w + 0.04, 0.008, 0.05]} />
            <meshStandardMaterial color="#334155" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Handrail Tangga Utama (Kiri & Kanan) */}
      {[-1.65, 1.65].map((x, i) => (
        <group key={`c-rail-${i}`} position={[x, 0, 0]}>
          <mesh position={[0, 0.58, 0.04]} rotation={[-0.24, 0, 0]}>
            <boxGeometry args={[0.04, 0.06, 1.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.45, 0.6]}>
            <boxGeometry args={[0.04, 0.8, 0.04]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.45, -0.52]}>
            <boxGeometry args={[0.04, 0.8, 0.04]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* B. Bordes / Landing Tengah Tangga di Titik Transisi Setengah Lingkaran */}
      <group position={[0, 0, -0.9]}>
        <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.8, 0.08, 0.85]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[3.84, 0.02, 0.87]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.6} />
        </mesh>
      </group>

      {/* C. Dua Cabang Tangga Ganda di dalam Area Setengah Lingkaran */}
      {[-2.05, 2.05].map((xBranch, bIdx) => (
        <group key={`branch-${bIdx}`} position={[xBranch, 0, 0]}>
          {branchSteps.map((s, i) => (
            <group key={`b-step-${i}`} position={[0, 0, s.z]}>
              {/* Badan Riser Tangga Cabang */}
              <mesh position={[0, s.y / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[s.w, s.y, s.d]} />
                <meshStandardMaterial color="#E2E8F0" roughness={0.7} />
              </mesh>
              {/* Plat Tread Pijakan Tangga Cabang */}
              <mesh position={[0, s.y + 0.01, 0]}>
                <boxGeometry args={[s.w + 0.04, 0.02, s.d + 0.02]} />
                <meshStandardMaterial color="#F8FAFC" roughness={0.6} />
              </mesh>
              {/* Lis Nosing Anti-Slip */}
              <mesh position={[0, s.y + 0.022, -s.d / 2 + 0.025]}>
                <boxGeometry args={[s.w + 0.04, 0.008, 0.05]} />
                <meshStandardMaterial color="#334155" roughness={0.5} />
              </mesh>
            </group>
          ))}

          {/* Handrail Cabang Luar */}
          <group position={[bIdx === 0 ? -0.75 : 0.75, 0, 0]}>
            <mesh position={[0, 0.58, -1.91]} rotation={[0.24, 0, 0]}>
              <boxGeometry args={[0.04, 0.06, 1.4]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.45, -1.35]}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.45, -2.47]}>
              <boxGeometry args={[0.04, 0.8, 0.04]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
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
      {/* Kusen Pintu Lift Champagne/Beige (Sesuai Foto Asli FST) */}
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[1.7, 2.3, 0.12]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
      </mesh>
      {/* Daun Pintu Stainless Steel Double Leaf */}
      <mesh position={[-0.39, 1.1, 0.02]}>
        <boxGeometry args={[0.74, 2.15, 0.03]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.39, 1.1, 0.02]}>
        <boxGeometry args={[0.74, 2.15, 0.03]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Garis Aksen Grafis Kuning FST pada Pintu (Sesuai Foto Asli Saintek Hub) */}
      <mesh position={[-0.39, 0.8, 0.036]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      <mesh position={[0.39, 0.8, 0.036]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      {/* Display Indikator Lantai Digital di Atas Pintu */}
      <mesh position={[0, 2.12, 0.07]}>
        <boxGeometry args={[0.42, 0.14, 0.02]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.12, 0.082]}>
        <boxGeometry args={[0.3, 0.07, 0.005]} />
        <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.9} />
      </mesh>
      {/* Panel Tombol Panggil Lift di Samping Kusen */}
      <mesh position={[0.74, 1.1, 0.05]}>
        <boxGeometry args={[0.08, 0.22, 0.02]} />
        <meshStandardMaterial color="#475569" roughness={0.3} />
      </mesh>
      <mesh position={[0.74, 1.1, 0.062]}>
        <boxGeometry args={[0.04, 0.04, 0.005]} />
        <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function CutawayCoreStairsAndLifts({ level: _level }: { level: number }) {
  return (
    <group>
      {/* Tangga Sisi Utara: di dalam Area Setengah Lingkaran Menghadap Void */}
      <group position={[0, 0, 17.0]}>
        <CoreCutawayStairs />
      </group>

      {/* Tangga Sisi Selatan: di dalam Area Setengah Lingkaran Menghadap Void (Diputar 180°) */}
      <group position={[0, 0, -17.0]} rotation={[0, Math.PI, 0]}>
        <CoreCutawayStairs />
      </group>

      {/* 2 Unit Lift Sisi Selatan: Berseberangan dengan Tangga Selatan, Menempel di Dinding (Z = -20.0) */}
      <group position={[0, 0, 0]}>
        <LiftUnit position={[-1.8, 0, -19.94]} rotation={[0, 0, 0]} />
        <LiftUnit position={[1.8, 0, -19.94]} rotation={[0, 0, 0]} />
      </group>
    </group>
  );
}

// =========================================================================
// 5. Saintek Hub Lounge di Tengah Lantai
// Sesuai Foto Asli (lobby-lounge-area-in-the-middle-of-every-floor.png & Foto Lift):
// Berisi 2 Lift Menghadap Tangga/Void, Dinding Bata & Banner Biru, Meja & Benches, Pot Lidah Mertua
// =========================================================================
function SaintekHubLounge({ level }: { level: number }) {
  if (level === 1) return null; // Lantai 1 adalah area lobby & void taman

  return (
    <group position={[0, 0, 0]}>
      {/* Area Lantai Lounge Bertekstur Kayu Hangat di Sisi Selasar (Foto Asli) */}
      <mesh position={[0, 0.02, 18.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[11.5, 3.0]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>

      {/* Dinding Belakang Lounge (Z = 20.0) - Tepat di Bawah Bubble Teks Lounge */}
      {/* A. Sisi Kiri: Dinding Bata Merah & Jendela Bar (Foto Asli) */}
      <mesh position={[-4.2, 1.2, 20.0]} castShadow>
        <boxGeometry args={[2.8, 2.2, 0.2]} />
        <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.8} />
      </mesh>
      <mesh position={[-4.2, 1.5, 19.98]}>
        <boxGeometry args={[2.4, 0.9, 0.05]} />
        <meshStandardMaterial color="#0284C7" transparent opacity={0.6} roughness={0.1} />
      </mesh>
      <mesh position={[-4.2, 0.9, 19.6]} castShadow>
        <boxGeometry args={[2.6, 0.08, 0.55]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
      </mesh>

      {/* B. Sisi Tengah: KEDUA LIFT TERTEMPEL DI DINDING DI BAWAH BUBBLE LOUNGE (Foto Asli) */}
      {/* Menghadap koridor/tangga (arah -Z) */}
      <LiftUnit position={[-1.8, 0, 19.94]} rotation={[0, Math.PI, 0]} />
      <LiftUnit position={[1.8, 0, 19.94]} rotation={[0, Math.PI, 0]} />

      {/* Dinding Biru Banner Visi "Innovation, Green, Humanity" di Antara Kedua Lift (Foto Asli) */}
      <mesh position={[0, 1.2, 19.98]}>
        <boxGeometry args={[1.7, 2.1, 0.04]} />
        <meshStandardMaterial color="#1E40AF" roughness={0.5} />
      </mesh>

      {/* C. Sisi Kanan: Papan Foto Tematik Berbingkai Bata (Foto Asli) */}
      <mesh position={[4.2, 1.2, 20.0]} castShadow>
        <boxGeometry args={[2.8, 2.2, 0.2]} />
        <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.8} />
      </mesh>
      <mesh position={[4.2, 1.25, 19.98]}>
        <boxGeometry args={[2.2, 1.6, 0.04]} />
        <meshStandardMaterial color="#FBBF24" roughness={0.6} />
      </mesh>

      {/* Kisi-kisi Balok Kayu Plafon Sisi Kiri (Wooden Slat Pergola Trellis - Foto Asli) */}
      {[-4.8, -4.3, -3.8, -3.3, -2.8].map((x, i) => (
        <mesh key={i} position={[x, 2.4, 18.5]}>
          <boxGeometry args={[0.12, 0.16, 2.8]} />
          <meshStandardMaterial color="#B45309" roughness={0.5} />
        </mesh>
      ))}

      {/* Meja Komunal & Bangku Kayu Mahasiswa di Depan Lift (Foto Asli) */}
      {[-1.8, 1.8].map((x, i) => (
        <group key={i} position={[x, 0, 18.3]}>
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[1.8, 0.08, 0.85]} />
            <meshStandardMaterial color="#78350F" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.25, -0.55]} castShadow>
            <boxGeometry args={[1.6, 0.06, 0.28]} />
            <meshStandardMaterial color="#451A03" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.25, 0.55]} castShadow>
            <boxGeometry args={[1.6, 0.06, 0.28]} />
            <meshStandardMaterial color="#451A03" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Pot Semen dengan Tanaman Sansevieria / Lidah Mertua (Foto Asli) */}
      {[-3.6, 0, 3.6].map((x, i) => (
        <group key={i} position={[x, 0, 17.2]}>
          <mesh position={[0, 0.2, 0]} castShadow>
            <boxGeometry args={[1.5, 0.38, 0.35]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[1.3, 0.55, 0.22]} />
            <meshStandardMaterial color="#15803D" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Label 3D Lounge (Mengambang Tepat di Atas Area Lounge & Kedua Lift) */}
      <Html position={[0, 2.7, 18.5]} center distanceFactor={42}>
        <div className="pointer-events-none px-2.5 py-1 rounded-full bg-amber-600/90 backdrop-blur-md text-white text-[11px] font-black shadow-lg border border-amber-400/80 flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="w-3 h-3 text-amber-200" />
          <span>Lounge</span>
        </div>
      </Html>
    </group>
  );
}

// =========================================================================
// 6. Ruang Teater Amphitheater Berundak di Sudut Timur (NE & SE)
// Sesuai Foto Asli (teater-room-in-corner-every-floor.png):
// Tempat duduk oranye-emas berundak menurun ke arah panggung & dinding biru
// =========================================================================
function TheaterAmphitheaterSeating({ level: _level }: { level: number }) {
  return (
    <group>
      {/* Teater 1 (Pojok Timur Laut - NE) */}
      <group position={[28.0, 0, 24.0]}>
        {/* Dinding Biru Akustik (Foto Asli) */}
        <mesh position={[0, 1.2, 4.4]}>
          <boxGeometry args={[8.8, 2.2, 0.15]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.6} />
        </mesh>

        {/* Layar Proyektor Putih Besar */}
        <mesh position={[0, 1.4, 4.3]}>
          <boxGeometry args={[5.2, 1.6, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>

        {/* Panggung Kayu di Depan Layar */}
        <mesh position={[0, 0.2, 3.2]} castShadow>
          <boxGeometry args={[6.8, 0.35, 1.8]} />
          <meshStandardMaterial color="#B45309" roughness={0.6} />
        </mesh>

        {/* 3 Tingkat Tempat Duduk Berundak Oranye (Foto Asli) */}
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

      {/* Teater 2 (Pojok Tenggara - SE) */}
      <group position={[28.0, 0, -24.0]}>
        <mesh position={[0, 1.2, -4.4]}>
          <boxGeometry args={[8.8, 2.2, 0.15]} />
          <meshStandardMaterial color="#1D4ED8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.4, -4.3]}>
          <boxGeometry args={[5.2, 1.6, 0.05]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
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
    </group>
  );
}

// =========================================================================
// 7. Kotak Ruangan Interaktif (Lantai Berwarna Heatmap, Dinding Partisi,
// Badge 3D, Indikator Pilot R.601, & Tooltip Sensor Live)
// =========================================================================
function InteractiveRoomBox({
  room,
  color,
  status,
  temp,
  humidity,
  presence,
  acMode,
  isSelected,
  isHovered,
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  room: RoomGeometry;
  color: string;
  status: RoomClimateStatus;
  temp: number;
  humidity: number;
  presence: boolean;
  acMode: string | null;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}) {
  const wallH = 1.15;
  const isPilot = room.hasDevice;

  return (
    <group position={[room.center[0], 0, -room.center[1]]}>
      {/* Lantai Ruang (Interaktif, Menampilkan Warna Status AC / Heatmap) */}
      <mesh
        position={[0, 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
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
        <planeGeometry args={[room.size[0] * 0.94, room.size[1] * 0.94]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          emissive={isSelected ? "#2563EB" : isHovered ? "#60A5FA" : color}
          emissiveIntensity={isSelected ? 0.45 : isHovered ? 0.3 : 0.06}
        />
      </mesh>

      {/* Dinding Partisi Pembatas Ruang (Tembok Putih Halus) */}
      <mesh position={[-room.size[0] * 0.47, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, wallH, room.size[1] * 0.92]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>
      <mesh position={[room.size[0] * 0.47, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, wallH, room.size[1] * 0.92]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>

      {/* Furnitur Simbolis di Dalam Ruang Kelas / Lab */}
      {room.kind === "classroom" && (
        <group position={[0, 0, 0]}>
          {/* Meja Dosen & Podium */}
          <mesh position={[0, 0.35, -room.size[1] * 0.28]} castShadow>
            <boxGeometry args={[1.8, 0.35, 0.8]} />
            <meshStandardMaterial color="#64748B" roughness={0.7} />
          </mesh>
          {/* Deretan Meja Mahasiswa */}
          <mesh position={[0, 0.28, room.size[1] * 0.15]} castShadow>
            <boxGeometry args={[room.size[0] * 0.65, 0.25, 1.2]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.7} />
          </mesh>
        </group>
      )}

      {/* Ruang Pilot Uji Coba: R.601 (Glowing Cyan Beacon & Pulsing Ring) */}
      {isPilot && (
        <group position={[0, 0.08, 0]}>
          {/* Cincin Emissive Berpendar */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.4, 1.8, 32]} />
            <meshBasicMaterial color="#10B981" transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.2, 2.45, 32]} />
            <meshBasicMaterial color="#34D399" transparent opacity={0.4} side={THREE.DoubleSide} />
          </mesh>

          {/* Floating Telemetry Pill Khusus Pilot */}
          <Html position={[0, 2.3, 0]} center distanceFactor={40}>
            <div className="pointer-events-none px-3 py-1.5 rounded-2xl bg-emerald-600/95 backdrop-blur-md text-white shadow-2xl border-2 border-white flex items-center gap-2 whitespace-nowrap animate-bounce">
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <div className="flex flex-col text-left">
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-200">
                  PILOT RUANG 601
                </span>
                <span className="text-xs font-black">
                  {temp.toFixed(1)}°C • {status} • {acMode ?? "AUTO"}
                </span>
              </div>
            </div>
          </Html>
        </group>
      )}

      {/* Label 3D Teks Nama Ruang (Kecil, Rapi, & Selalu Terbaca) */}
      {!isPilot && (
        <Html position={[0, 0.8, 0]} center distanceFactor={50}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm transition-transform cursor-pointer select-none whitespace-nowrap ${
              isSelected
                ? "bg-blue-600 text-white scale-110 shadow-md ring-2 ring-white"
                : isHovered
                ? "bg-slate-900 text-white scale-105"
                : "bg-white/90 text-slate-800 border border-slate-200/80"
            }`}
          >
            {room.displayName.replace("Ruang ", "R.")}
          </div>
        </Html>
      )}

      {/* Floating Tooltip Sensor Saat Cursor Hover di Atas Ruangan */}
      {isHovered && !isPilot && (
        <Html position={[0, 2.0, 0]} center distanceFactor={42}>
          <div className="pointer-events-none p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white shadow-2xl border border-slate-700/80 w-44 flex flex-col gap-1.5 z-50">
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1">
              <span className="text-xs font-black text-slate-100 truncate">
                {room.displayName}
              </span>
              <span
                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <div className="flex items-center gap-1 text-slate-300">
                <Flame className="w-3 h-3 text-amber-400" />
                <span>{temp.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Activity className="w-3 h-3 text-blue-400" />
                <span>{humidity}% RH</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <User className="w-3 h-3 text-emerald-400" />
                <span>{presence ? "Ada Orang" : "Kosong"}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Zap className="w-3 h-3 text-amber-300" />
                <span>AC: {acMode ?? "OFF"}</span>
              </div>
            </div>

            <div className="text-[9px] text-blue-300 font-semibold text-center pt-0.5">
              Klik untuk inspeksi ruangan
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
