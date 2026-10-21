import React, { useMemo } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";
import { getStatusColor } from "../plan2d/FloorPlan2D";

interface Building3DProps {
  floors: FloorModel[];
}

export const Building3D: React.FC<Building3DProps> = ({ floors }) => {
  const { mode, selectedFloor, selectFloor, selectRoom, layer } = useViewStore();
  const { rooms: liveRooms } = useRoomStore();
  const now = new Date();

  return (
    <group position={[0, -12, 0]}>
      {/* 1. Lantai Dasar Base / Tanah Pijakan (Biru Slate Gelap yang Kontras terhadap World & Gedung) */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[56, 58, 0.8, 64]} />
        <meshStandardMaterial color="#2B4158" roughness={0.75} />
      </mesh>
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <cylinderGeometry args={[58, 60, 0.3, 64]} />
        <meshStandardMaterial color="#1E2F40" roughness={0.8} />
      </mesh>

      {/* 2. Seluruh Lantai Gedung (Lantai 1 s/d 7) */}
      {floors.map((floor) => {
        // Jarak vertikal per lantai saat di mode building
        const yBase = (floor.level - 1) * 4.6;
        const isHiddenInFocus = mode !== "building" && selectedFloor !== floor.level;

        if (isHiddenInFocus) return null;

        return (
          <group key={floor.level} position={[0, yBase, 0]}>
            {/* Pelat Lantai Cincin dengan Void */}
            <FloorSlabMesh floor={floor} />

            {/* Fasad Kaca Melingkari Sisi Luar Gedung dengan Sekat / Mullions Vertikal */}
            <GlassFacadeMesh height={4.1} />

            {/* Dinding Pembatas Void Atrium (Pagar Kaca / Railing) */}
            <AtriumRailingMesh floor={floor} height={1.1} />

            {/* Ruangan-Ruangan Berdinding Clay Cutaway & Sekat Kaca */}
            {floor.rooms.map((room) => {
              const live = liveRooms[room.slotId];
              const status = live
                ? deriveRoomStatus(live, now)
                : room.hasDevice
                ? "OCCUPIED"
                : "NO_DEVICE";

              const color = getStatusColor(status, layer, live?.temperature ?? null);

              return (
                <RoomBoxCutaway
                  key={room.slotId}
                  room={room}
                  color={color}
                  onClick={() => {
                    if (mode === "building") {
                      selectFloor(floor.level);
                    } else {
                      selectRoom(room.slotId);
                    }
                  }}
                />
              );
            })}

            {/* Kanopi Pintu Masuk Utama di Lantai 1 */}
            {floor.level === 1 && <EntranceCanopy />}
          </group>
        );
      })}

      {/* 3. Atap Penutup Gedung (Roof Slab) */}
      {mode === "building" && (
        <group position={[0, 7 * 4.6, 0]}>
          <FloorSlabMesh floor={floors[floors.length - 1]} isRoof />
        </group>
      )}
    </group>
  );
};

// =========================================================================
// 1. Pelat Lantai Putih Clay Halus dengan Lubang Atrium
// =========================================================================
function FloorSlabMesh({ floor, isRoof = false }: { floor: FloorModel; isRoof?: boolean }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    const [first, ...rest] = floor.outerPolygon;
    s.moveTo(first[0], -first[1]);
    rest.forEach(([x, y]) => s.lineTo(x, -y));
    s.closePath();

    // Buat void tengah (atap tetap memiliki void atau skylight)
    const hole = new THREE.Path();
    const [hFirst, ...hRest] = floor.voidPolygon;
    hole.moveTo(hFirst[0], -hFirst[1]);
    hRest.forEach(([x, y]) => hole.lineTo(x, -y));
    hole.closePath();
    s.holes.push(hole);

    return s;
  }, [floor]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 }]} />
      <meshStandardMaterial color={isRoof ? "#F1F5F9" : "#FFFFFF"} roughness={0.85} />
    </mesh>
  );
}

// =========================================================================
// 2. Fasad Kaca Luar Gedung dengan Sekat Vertikal (Mullions) Sesuai Referensi
// =========================================================================
function GlassFacadeMesh({ height }: { height: number }) {
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  // 1. Single merged geometry untuk semua tiang sekat (mullions vertikal) & kusen horizontal
  const mullionsGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Utara & Selatan: Tiang sekat vertikal setiap 2.0 meter
    for (let x = -30; x <= 30; x += 2) {
      const northM = new THREE.BoxGeometry(0.12, height, 0.16);
      northM.translate(x, yCenter, halfD);
      boxes.push(northM);

      const southM = new THREE.BoxGeometry(0.12, height, 0.16);
      southM.translate(x, yCenter, -halfD);
      boxes.push(southM);
    }

    // Fasad Timur & Barat: Tiang sekat vertikal setiap 2.0 meter
    for (let z = -26; z <= 26; z += 2) {
      const eastM = new THREE.BoxGeometry(0.16, height, 0.12);
      eastM.translate(halfW, yCenter, z);
      boxes.push(eastM);

      const westM = new THREE.BoxGeometry(0.16, height, 0.12);
      westM.translate(-halfW, yCenter, z);
      boxes.push(westM);
    }

    // 4 Tiang Sudut Utama (Corner Columns)
    [
      [-halfW, -halfD],
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD],
    ].forEach(([cx, cz]) => {
      const cp = new THREE.BoxGeometry(0.24, height, 0.24);
      cp.translate(cx, yCenter, cz);
      boxes.push(cp);
    });

    // Kusen Horizontal Bawah (Sill) & Atas (Head Rail)
    const railH = 0.12;
    // Rel Utara & Selatan
    [
      [0, railH / 2, halfD],
      [0, height - railH / 2, halfD],
      [0, railH / 2, -halfD],
      [0, height - railH / 2, -halfD],
    ].forEach(([rx, ry, rz]) => {
      const r = new THREE.BoxGeometry(halfW * 2, railH, 0.16);
      r.translate(rx, ry, rz);
      boxes.push(r);
    });

    // Rel Timur & Barat
    [
      [halfW, railH / 2, 0],
      [halfW, height - railH / 2, 0],
      [-halfW, railH / 2, 0],
      [-halfW, height - railH / 2, 0],
    ].forEach(([rx, ry, rz]) => {
      const r = new THREE.BoxGeometry(0.16, railH, halfD * 2);
      r.translate(rx, ry, rz);
      boxes.push(r);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // 2. Single merged geometry untuk 4 dinding kaca transparan perimeter
  const glassGeometry = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];

    // Kaca Utara & Selatan
    const northG = new THREE.BoxGeometry(halfW * 2, height, 0.05);
    northG.translate(0, yCenter, halfD);
    planes.push(northG);

    const southG = new THREE.BoxGeometry(halfW * 2, height, 0.05);
    southG.translate(0, yCenter, -halfD);
    planes.push(southG);

    // Kaca Timur & Barat
    const eastG = new THREE.BoxGeometry(0.05, height, halfD * 2);
    eastG.translate(halfW, yCenter, 0);
    planes.push(eastG);

    const westG = new THREE.BoxGeometry(0.05, height, halfD * 2);
    westG.translate(-halfW, yCenter, 0);
    planes.push(westG);

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {/* Tiang Sekat Vertikal & Kusen Putih (Mullions & Frames) */}
      {mullionsGeometry && (
        <mesh geometry={mullionsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}

      {/* Bidang Kaca Transparan dengan Tint Biru Lembut */}
      {glassGeometry && (
        <mesh geometry={glassGeometry}>
          <meshPhysicalMaterial
            color="#B8D5E5"
            transparent
            opacity={0.38}
            roughness={0.12}
            metalness={0.05}
            transmission={0.65}
            thickness={0.5}
            ior={1.48}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 3. Ruangan 3D Style Cutaway dengan Sekat Kaca di Tiap Ruangan
// =========================================================================
function RoomBoxCutaway({
  room,
  color,
  onClick,
}: {
  room: RoomGeometry;
  color: string;
  onClick: () => void;
}) {
  const { selectedSlotId } = useViewStore();
  const isSelected = selectedSlotId === room.slotId;
  const solidH = 1.1; // Dinding dasar putih solid
  const glassH = 2.5; // Sekat kaca di atas dinding pembatas ruangan (hingga tinggi 3.6m)

  return (
    <group position={[room.center[0], 0, -room.center[1]]}>
      {/* Lantai Ruang (Floor Plate Berwarna Sesuai Status) */}
      <mesh
        position={[0, 0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <planeGeometry args={[room.size[0] * 0.94, room.size[1] * 0.94]} />
        <meshStandardMaterial
          color={color}
          roughness={0.5}
          emissive={isSelected ? "#2563EB" : color}
          emissiveIntensity={isSelected ? 0.35 : 0.08}
        />
      </mesh>

      {/* Dinding Sisi Barat & Timur (Partisi Pembatas Antar Ruang) */}
      {/* Sisi Kiri (Barat) */}
      <mesh position={[-room.size[0] * 0.47, solidH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, solidH, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      {/* Sekat Kaca Ruangan di Sisi Kiri */}
      <mesh position={[-room.size[0] * 0.47, solidH + glassH / 2, 0]}>
        <boxGeometry args={[0.04, glassH, room.size[1] * 0.92]} />
        <meshPhysicalMaterial
          color="#C0D6E4"
          transparent
          opacity={0.32}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      {/* Frame Atas Sekat Kaca Kiri */}
      <mesh position={[-room.size[0] * 0.47, solidH + glassH - 0.04, 0]}>
        <boxGeometry args={[0.08, 0.08, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Sisi Kanan (Timur) */}
      <mesh position={[room.size[0] * 0.47, solidH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, solidH, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      {/* Sekat Kaca Ruangan di Sisi Kanan */}
      <mesh position={[room.size[0] * 0.47, solidH + glassH / 2, 0]}>
        <boxGeometry args={[0.04, glassH, room.size[1] * 0.92]} />
        <meshPhysicalMaterial
          color="#C0D6E4"
          transparent
          opacity={0.32}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>
      {/* Frame Atas Sekat Kaca Kanan */}
      <mesh position={[room.size[0] * 0.47, solidH + glassH - 0.04, 0]}>
        <boxGeometry args={[0.08, 0.08, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Dinding Belakang (Menghadap Koridor Dalam) */}
      <mesh position={[0, solidH / 2, -room.size[1] * 0.47]} castShadow receiveShadow>
        <boxGeometry args={[room.size[0] * 0.94, solidH, 0.18]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      {/* Sekat Kaca Menghadap Koridor */}
      <mesh position={[0, solidH + glassH / 2, -room.size[1] * 0.47]}>
        <boxGeometry args={[room.size[0] * 0.92, glassH, 0.04]} />
        <meshPhysicalMaterial
          color="#C0D6E4"
          transparent
          opacity={0.3}
          roughness={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Meja / Fasilitas Simbolis Mini di Tengah Ruang */}
      {room.hasAc && (
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[room.size[0] * 0.35, 0.3, room.size[1] * 0.35]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.8} />
        </mesh>
      )}

      {/* Pin Indikator Live Pulsing jika Ini Ruang Uji Coba */}
      {room.hasDevice && (
        <group position={[0, solidH + glassH + 0.5, 0]}>
          <mesh>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial color="#EF4444" emissive="#EF4444" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshStandardMaterial color="#EF4444" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// =========================================================================
// 4. Railing Void Atrium (Pagar Kaca Transparan Melingkari Void Tengah)
// =========================================================================
function AtriumRailingMesh({ floor: _floor, height }: { floor: FloorModel; height: number }) {
  const voidHalfW = 21;
  const voidHalfD = 17;

  return (
    <group position={[0, height / 2, 0]}>
      {/* Railing Utara & Selatan Void */}
      <mesh position={[0, 0, voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, height, 0.05]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, -voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, height, 0.05]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.6} roughness={0.3} />
      </mesh>

      {/* Railing Barat & Timur Void */}
      <mesh position={[-voidHalfW, 0, 0]}>
        <boxGeometry args={[0.05, height, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[voidHalfW, 0, 0]}>
        <boxGeometry args={[0.05, height, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.6} roughness={0.3} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 5. Kanopi Pintu Masuk Utama di Lantai 1 (Sesuai Referensi Gambar)
// =========================================================================
function EntranceCanopy() {
  return (
    <group position={[0, 0, 0]}>
      {/* Kanopi Sisi Selatan (Lobby Sarjana) */}
      <mesh position={[0, 4.1, -30.0]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.25, 4.2]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[-5.5, 2.05, -31.9]} castShadow>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[5.5, 2.05, -31.9]} castShadow>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* Kanopi Sisi Utara (Lobby Pascasarjana) */}
      <mesh position={[0, 4.1, 30.0]} castShadow receiveShadow>
        <boxGeometry args={[14, 0.25, 4.2]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[-5.5, 2.05, 31.9]} castShadow>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[5.5, 2.05, 31.9]} castShadow>
        <boxGeometry args={[0.22, 4.1, 0.22]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
    </group>
  );
}
