import React, { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useShallow } from "zustand/react/shallow";
import { FloorModel, RoomGeometry } from "../../building/params";
import { deriveRoomStatus, getStatusColor, RoomClimateStatus } from "../../domain/roomStatus";
import { useRoomStore } from "../../stores/roomStore";
import { useViewStore } from "../../stores/viewStore";
import {
  AtriumCutawayBalcony,
  CommunalTableSet,
  CutawayCoreStairsAndLifts,
  CutawayPerimeterWalls,
  SaintekHubLounge,
  TheaterAmphitheaterSeating,
} from "./components/FloorInteriorFixtures";

interface Floor3DCutawayProps {
  floor: FloorModel;
  isBuildingStack?: boolean;
  onRoomSelect: (slotId: string) => void;
}

export const Floor3DCutaway: React.FC<Floor3DCutawayProps> = React.memo(
  function Floor3DCutaway({ floor, isBuildingStack = false, onRoomSelect }) {
    const { selectedSlotId, hoveredSlotId, setHoveredSlotId, layer, objectFilters } =
      useViewStore(
        useShallow((s) => ({
          selectedSlotId: s.selectedSlotId,
          hoveredSlotId: s.hoveredSlotId,
          setHoveredSlotId: s.setHoveredSlotId,
          layer: s.layer,
          objectFilters: s.objectFilters,
        }))
      );
    const liveRooms = useRoomStore((s) => s.rooms);
    const now = new Date();

    return (
      <group position={[0, 0, 0]}>
        {/* 1. Pelat Dasar Lantai dengan Lubang Void Atrium */}
        <FloorCutawayBase floor={floor} />

        {/* 2. Dinding Perimeter Bertema FST */}
        {(!isBuildingStack || !objectFilters.roofAndFacade) && <CutawayPerimeterWalls />}

        {/* 3. Selasar Koridor Void Melingkar dengan Tanaman Gantung */}
        <AtriumCutawayBalcony
          showTrees={objectFilters.trees}
          isBuildingStack={isBuildingStack}
          level={floor.level}
        />

        {/* 4. Tangga Balok Setengah Lingkaran & Unit Lift */}
        <CutawayCoreStairsAndLifts
          showStairs={objectFilters.stairs && !isBuildingStack}
          showLifts={objectFilters.lifts}
        />

        {/* 5. Saintek Hub Lounge di Tengah Lantai */}
        <SaintekHubLounge
          level={floor.level}
          showFurniture={objectFilters.furniture && !isBuildingStack}
          showTrees={objectFilters.trees}
          showLifts={objectFilters.lifts}
        />

        {/* 6. Ruang Teater Amphitheater Berundak di Sudut Timur */}
        {objectFilters.furniture && !isBuildingStack && (
          <TheaterAmphitheaterSeating level={floor.level} />
        )}

        {/* 7. Seluruh Ruangan Interaktif */}
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
              onRoomSelect={onRoomSelect}
              onHoverRoom={setHoveredSlotId}
            />
          );
        })}
      </group>
    );
  }
);

// =========================================================================
// Singleton Shapes untuk Potongan Setengah Lingkaran Pelat Lantai
// =========================================================================
const NORTH_SLAB_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.4, -17.0);
  s.absarc(0, -17.0, 4.4, Math.PI, 0, true);
  s.closePath();
  return s;
})();

const SOUTH_SLAB_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.4, 17.0);
  s.absarc(0, 17.0, 4.4, Math.PI, 2 * Math.PI, false);
  s.closePath();
  return s;
})();

const FloorCutawayBase = React.memo(function FloorCutawayBase({
  floor,
}: {
  floor: FloorModel;
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
    <group rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]}>
      <mesh receiveShadow>
        <extrudeGeometry args={[shape, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>
      <mesh receiveShadow>
        <extrudeGeometry args={[NORTH_SLAB_SHAPE, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>
      <mesh receiveShadow>
        <extrudeGeometry args={[SOUTH_SLAB_SHAPE, { depth: 0.3, bevelEnabled: false }]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.85} />
      </mesh>
    </group>
  );
});

// =========================================================================
// Kotak Ruangan Interaktif (Memoized untuk Performa Tinggi saat Hover)
// =========================================================================
const InteractiveRoomBox = React.memo(function InteractiveRoomBox({
  room,
  color,
  isSelected,
  isHovered,
  showFurniture,
  showLabel,
  isBuildingStack = false,
  onRoomSelect,
  onHoverRoom,
}: {
  room: RoomGeometry;
  color: string;
  isSelected: boolean;
  isHovered: boolean;
  showFurniture: boolean;
  showLabel: boolean;
  isBuildingStack?: boolean;
  onRoomSelect: (slotId: string) => void;
  onHoverRoom: (slotId: string | null) => void;
}) {
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
      {!isCoreLounge && (
        <mesh
          position={[0, 0.02, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow={!isBuildingStack}
          onClick={(e) => {
            e.stopPropagation();
            onRoomSelect(room.slotId);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverRoom(room.slotId);
          }}
          onPointerOut={() => onHoverRoom(null)}
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

      {/* Dinding Partisi Pembatas Antar-Ruangan */}
      {!isFloor1Corridor && !isFloor1Lobby && !isFloor1Canteen && !isCoreLounge && (
        <>
          {isStackedAlongZ ? (
            <>
              <mesh
                position={[0, wallH / 2, -room.size[1] * 0.5]}
                castShadow={!isBuildingStack}
                receiveShadow={!isBuildingStack}
              >
                <boxGeometry args={[room.size[0], wallH, 0.2]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
              <mesh
                position={[0, wallH / 2, room.size[1] * 0.5]}
                castShadow={!isBuildingStack}
                receiveShadow={!isBuildingStack}
              >
                <boxGeometry args={[room.size[0], wallH, 0.2]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
            </>
          ) : (
            <>
              <mesh
                position={[-room.size[0] * 0.5, wallH / 2, 0]}
                castShadow={!isBuildingStack}
                receiveShadow={!isBuildingStack}
              >
                <boxGeometry args={[0.2, wallH, room.size[1]]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
              <mesh
                position={[room.size[0] * 0.5, wallH / 2, 0]}
                castShadow={!isBuildingStack}
                receiveShadow={!isBuildingStack}
              >
                <boxGeometry args={[0.2, wallH, room.size[1]]} />
                <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
              </mesh>
            </>
          )}
        </>
      )}

      {/* Dinding Partisi & Furnitur Ruang Kantin Lantai 1 */}
      {isFloor1Canteen && (
        <group>
          <mesh position={[0, wallH / 2, -room.size[1] * 0.5]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
            <boxGeometry args={[room.size[0], wallH, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh position={[0, wallH / 2, room.size[1] * 0.5]} castShadow={!isBuildingStack} receiveShadow={!isBuildingStack}>
            <boxGeometry args={[room.size[0], wallH, 0.22]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh
            position={[-room.size[0] * 0.48, wallH / 2, -room.size[1] * 0.28]}
            castShadow={!isBuildingStack}
            receiveShadow={!isBuildingStack}
          >
            <boxGeometry args={[0.22, wallH, room.size[1] * 0.38]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh
            position={[-room.size[0] * 0.48, wallH / 2, room.size[1] * 0.28]}
            castShadow={!isBuildingStack}
            receiveShadow={!isBuildingStack}
          >
            <boxGeometry args={[0.22, wallH, room.size[1] * 0.38]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>

          {showFurniture && (
            <>
              <mesh position={[room.size[0] * 0.3, 0.5, 0]} castShadow={!isBuildingStack}>
                <boxGeometry args={[1.2, 1.0, room.size[1] * 0.72]} />
                <meshStandardMaterial color="#1E293B" roughness={0.3} />
              </mesh>
              <mesh position={[room.size[0] * 0.3, 1.02, 0]}>
                <boxGeometry args={[1.35, 0.06, room.size[1] * 0.74]} />
                <meshStandardMaterial color="#F59E0B" roughness={0.3} />
              </mesh>

              {[-6.2, -2.1, 2.1, 6.2].map((zPos, idx) => (
                <group key={idx} position={[-room.size[0] * 0.1, 0, zPos]}>
                  <mesh position={[0, 0.46, 0]} castShadow={!isBuildingStack}>
                    <boxGeometry args={[1.7, 0.06, 0.95]} />
                    <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
                  </mesh>
                  <mesh position={[0, 0.23, 0]}>
                    <boxGeometry args={[0.08, 0.46, 0.08]} />
                    <meshStandardMaterial color="#475569" roughness={0.4} />
                  </mesh>
                  {[-0.6, 0.6].map((cx, cIdx) => (
                    <group key={cIdx} position={[cx, 0, 0]}>
                      <mesh position={[0, 0.26, 0]} castShadow={!isBuildingStack}>
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

      {/* Furnitur Simbolis di Dalam Ruang Kelas / Lab / Kantor */}
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
          <mesh position={[0, 0.35, -1.8]} castShadow={!isBuildingStack}>
            <boxGeometry args={[1.8, 0.35, 0.8]} />
            <meshStandardMaterial color={hasDevice ? "#0369A1" : "#64748B"} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.28, 0.8]} castShadow={!isBuildingStack}>
            <boxGeometry args={[3.2, 0.25, 1.3]} />
            <meshStandardMaterial color={hasDevice ? "#0EA5E9" : "#94A3B8"} roughness={0.6} />
          </mesh>
        </group>
      )}

      {/* Unit AC Split & Modul Sensor IoT Acoptimizer di Dinding Ruangan yang Memiliki Alat IoT (R.601) */}
      {hasDevice && (
        <group position={[0, 1.9, -room.size[1] * 0.44]}>
          <mesh castShadow={!isBuildingStack}>
            <boxGeometry args={[1.6, 0.38, 0.32]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.25} />
          </mesh>
          <mesh position={[0, -0.14, 0.16]}>
            <boxGeometry args={[1.45, 0.06, 0.02]} />
            <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[1.15, -0.25, 0.08]} castShadow={!isBuildingStack}>
            <boxGeometry args={[0.35, 0.42, 0.16]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} />
          </mesh>
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

      {/* Lantai 1 Meja Resepsionis Lobby */}
      {showFurniture && isFloor1Lobby && (
        <group position={[0, 0, 0]}>
          <mesh position={[0, 0.5, 0]} castShadow={!isBuildingStack}>
            <boxGeometry args={[3.8, 1.0, 0.9]} />
            <meshStandardMaterial color="#1E293B" roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.02, 0]}>
            <boxGeometry args={[4.0, 0.06, 1.0]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.2} />
          </mesh>
        </group>
      )}

      {/* Label 3D Teks Nama Ruang */}
      {showLabel && !isFloor1Corridor && !isFloor1Lobby && (
        <Html position={[0, 1.85, 0]} center distanceFactor={68} zIndexRange={[10, 0]}>
          <div
            onClick={(e) => {
              e.stopPropagation();
              onRoomSelect(room.slotId);
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
});
