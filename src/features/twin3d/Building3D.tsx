import React, { useMemo } from "react";
import * as THREE from "three";
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
      {/* Lantai Dasar Base / Tanah */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[55, 58, 0.8, 64]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {floors.map((floor) => {
        const isFloorFocus = mode !== "building" && selectedFloor === floor.level;
        // Jarak vertikal per lantai saat di mode building
        const yBase = (floor.level - 1) * 4.6;
        const isHiddenInFocus = mode !== "building" && selectedFloor !== floor.level;

        if (isHiddenInFocus) return null;

        return (
          <group key={floor.level} position={[0, yBase, 0]}>
            {/* Pelat Lantai Cincin dengan Void */}
            <FloorSlabMesh floor={floor} />

            {/* Fasad Kaca Melingkari Sisi Luar Gedung */}
            <GlassFacadeMesh floor={floor} height={3.6} />

            {/* Dinding Pembatas Void Atrium (Pagar Kaca / Railing) */}
            <AtriumRailingMesh floor={floor} height={1.1} />

            {/* Ruangan-Ruangan Berdinding Clay Cutaway */}
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
          </group>
        );
      })}

      {/* Atap Penutup Gedung (Roof Slab) */}
      {mode === "building" && (
        <group position={[0, 7 * 4.6, 0]}>
          <FloorSlabMesh floor={floors[floors.length - 1]} isRoof />
        </group>
      )}
    </group>
  );
};

// 1. Pelat Lantai Putih Clay Halus dengan Lubang Atrium
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

// 2. Ruangan 3D Style Cutaway (Dinding Putih + Lantai Berwarna Lembut)
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
  const wallH = 1.4; // Tinggi dinding cutaway agar perabotan/lantai terlihat seperti render referensi

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

      {/* Dinding Partisi Pembatas Ruangan (Clay Putih) */}
      {/* Dinding Sisi Barat & Timur */}
      <mesh position={[-room.size[0] * 0.47, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, wallH, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      <mesh position={[room.size[0] * 0.47, wallH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.2, wallH, room.size[1] * 0.94]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Dinding Belakang (Menghadap Koridor Dalam) */}
      <mesh position={[0, wallH / 2, -room.size[1] * 0.47]} castShadow receiveShadow>
        <boxGeometry args={[room.size[0] * 0.94, wallH, 0.2]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Meja / Kursi Simbolis Mini di Tengah Ruang (Sesuai Referensi Gambar) */}
      {room.hasAc && (
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[room.size[0] * 0.35, 0.3, room.size[1] * 0.35]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.8} />
        </mesh>
      )}

      {/* Pin Indikator Live Pulsing jika Ini Ruang Uji Coba */}
      {room.hasDevice && (
        <group position={[0, wallH + 0.8, 0]}>
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

// 3. Fasad Kaca Transparan di Bagian Luar Gedung (Seperti di Render building-view.jpg)
function GlassFacadeMesh({ floor, height }: { floor: FloorModel; height: number }) {
  const halfW = 32;
  const halfD = 28;

  return (
    <group position={[0, height / 2, 0]}>
      {/* Sisi Kaca Barat & Timur (Kaca Curtain Wall) */}
      <mesh position={[-halfW, 0, 0]}>
        <boxGeometry args={[0.08, height, halfD * 2]} />
        <meshPhysicalMaterial
          color="#E2E8F0"
          transparent
          opacity={0.3}
          roughness={0.1}
          transmission={0.7}
          thickness={0.5}
        />
      </mesh>
      <mesh position={[halfW, 0, 0]}>
        <boxGeometry args={[0.08, height, halfD * 2]} />
        <meshPhysicalMaterial
          color="#E2E8F0"
          transparent
          opacity={0.3}
          roughness={0.1}
          transmission={0.7}
          thickness={0.5}
        />
      </mesh>

      {/* Sisi Kaca Selatan (Sebagian dibuka cutaway agar interior tampak jelas) */}
      <mesh position={[-halfW / 2, 0, -halfD]}>
        <boxGeometry args={[halfW, height, 0.08]} />
        <meshPhysicalMaterial
          color="#E2E8F0"
          transparent
          opacity={0.25}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
}

// 4. Railing Void Atrium (Kaca Semi-Transparan Tipis Melingkari Void)
function AtriumRailingMesh({ floor, height }: { floor: FloorModel; height: number }) {
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
