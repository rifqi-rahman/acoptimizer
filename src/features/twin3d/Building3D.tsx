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
      {/* 1. Bidang Tanah Bawah Gedung (Warna #5b8efc Sesuai Permintaan) */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[68, 0.4, 60]} />
        <meshStandardMaterial color="#5b8efc" roughness={0.75} />
      </mesh>

      {/* 2. Seluruh Lantai Gedung (Lantai 1 s/d 7) */}
      {floors.map((floor) => {
        const yBase = (floor.level - 1) * 4.6;
        const isHiddenInFocus = mode !== "building" && selectedFloor !== floor.level;

        if (isHiddenInFocus) return null;

        return (
          <group key={floor.level} position={[0, yBase, 0]}>
            {/* Pelat Lantai Putih dengan Void Atrium Tengah */}
            <FloorSlabMesh floor={floor} />

            {/* Fasad Sesuai Foto Asli Gedung FST */}
            {floor.level === 1 ? (
              <GroundFloorColonnade />
            ) : floor.level === 7 ? (
              <TopFloorArchedFacade />
            ) : (
              <StandardFloorFacade />
            )}

            {/* Pagar Pengaman Kaca Void Atrium */}
            <AtriumRailingMesh height={1.1} />

            {/* Ruangan-Ruangan Efisien (60 FPS Performance-Optimized) */}
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

      {/* 3. Struktur Atap, Menara Sudut & Kubah Ikonik FST (Foto Tampak Atas) */}
      {mode === "building" && (
        <group position={[0, 7 * 4.6, 0]}>
          <RoofAndDomesStructure floor={floors[floors.length - 1]} />
        </group>
      )}
    </group>
  );
};

// =========================================================================
// 1. Pelat Lantai Putih Halus dengan Void Atrium Tengah
// =========================================================================
function FloorSlabMesh({ floor }: { floor: FloorModel }) {
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 }]} />
      <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
    </mesh>
  );
}

// =========================================================================
// 2. Lantai 1 (Ground Floor): Pilotis / Kolom Terbuka & Kanopi Lobi FST
// Sesuai Foto 1 & 3: Lantai dasar terbuka berkolom untuk drop-off / parkir mobil
// =========================================================================
function GroundFloorColonnade() {
  const height = 4.1;
  const halfW = 32;
  const halfD = 28;
  const yCenter = height / 2;

  // Single merged geometry untuk kolom pilotis lantai 1
  const colonnadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Kolom Utara & Selatan (spacing ~4.5m)
    for (let x = -29; x <= 29; x += 4.5) {
      const colN = new THREE.BoxGeometry(0.6, height, 0.6);
      colN.translate(x, yCenter, halfD);
      boxes.push(colN);

      const colS = new THREE.BoxGeometry(0.6, height, 0.6);
      colS.translate(x, yCenter, -halfD);
      boxes.push(colS);
    }

    // Kolom Timur & Barat (spacing ~4.5m)
    for (let z = -25; z <= 25; z += 4.5) {
      const colE = new THREE.BoxGeometry(0.6, height, 0.6);
      colE.translate(halfW, yCenter, z);
      boxes.push(colE);

      const colW = new THREE.BoxGeometry(0.6, height, 0.6);
      colW.translate(-halfW, yCenter, z);
      boxes.push(colW);
    }

    // Balok lintel atas
    const lintelN = new THREE.BoxGeometry(halfW * 2, 0.4, 0.6);
    lintelN.translate(0, height - 0.2, halfD);
    boxes.push(lintelN);

    const lintelS = new THREE.BoxGeometry(halfW * 2, 0.4, 0.6);
    lintelS.translate(0, height - 0.2, -halfD);
    boxes.push(lintelS);

    const lintelE = new THREE.BoxGeometry(0.6, 0.4, halfD * 2);
    lintelE.translate(halfW, height - 0.2, 0);
    boxes.push(lintelE);

    const lintelW = new THREE.BoxGeometry(0.6, 0.4, halfD * 2);
    lintelW.translate(-halfW, height - 0.2, 0);
    boxes.push(lintelW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {/* Kolom Pilotis Lantai 1 (White Clay) */}
      {colonnadeGeometry && (
        <mesh geometry={colonnadeGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}

      {/* Dinding Kaca Lobi Dalam (Recessed) */}
      <mesh position={[0, yCenter, -halfD + 4]}>
        <boxGeometry args={[28, height, 0.05]} />
        <meshStandardMaterial color="#2563EB" transparent opacity={0.3} roughness={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, yCenter, halfD - 4]}>
        <boxGeometry args={[28, height, 0.05]} />
        <meshStandardMaterial color="#2563EB" transparent opacity={0.3} roughness={0.25} depthWrite={false} />
      </mesh>

      {/* Kanopi Lobi Masuk Utama FST dengan Skylight Prisma Kaca (Sesuai Foto 1 & 3) */}
      <group position={[0, 0, -halfD - 2.5]}>
        {/* Pelat Atap Kanopi */}
        <mesh position={[0, height - 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 0.35, 6]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        {/* Tiang Penyangga Depan Kanopi */}
        <mesh position={[-6.5, yCenter, -2.5]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        <mesh position={[6.5, yCenter, -2.5]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        {/* Skylight Prisma Kaca Hijau di Atas Kanopi (Foto 1) */}
        <mesh position={[0, height + 1.1, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.2, 1.8, 4]} />
          <meshStandardMaterial color="#10B981" transparent opacity={0.65} roughness={0.2} />
        </mesh>
        {/* Plang Fascia "FAKULTAS SAINS DAN TEKNOLOGI" */}
        <mesh position={[0, height - 0.2, -3.05]}>
          <boxGeometry args={[15.6, 0.5, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// 3. Lantai 2 s/d 6: Fasad Vertikal Berpilaster Khas Gedung FST
// Sesuai Foto 1, 3, 4: Deretan jendela vertikal berirama dengan pilaster
// =========================================================================
function StandardFloorFacade() {
  const height = 4.1;
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  // Single merged geometry untuk semua pilaster vertikal & panel spandrel (krawangan)
  const facadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Utara & Selatan: Pilaster vertikal setiap 2.6 meter
    for (let x = -30; x <= 30; x += 2.6) {
      const pierN = new THREE.BoxGeometry(0.3, height, 0.28);
      pierN.translate(x, yCenter, halfD);
      boxes.push(pierN);

      const pierS = new THREE.BoxGeometry(0.3, height, 0.28);
      pierS.translate(x, yCenter, -halfD);
      boxes.push(pierS);

      // Panel spandrel (krawangan/ventilasi) di bawah ambang jendela
      if (x < 29) {
        const spanN = new THREE.BoxGeometry(2.3, 0.7, 0.16);
        spanN.translate(x + 1.3, 0.35, halfD);
        boxes.push(spanN);

        const spanS = new THREE.BoxGeometry(2.3, 0.7, 0.16);
        spanS.translate(x + 1.3, 0.35, -halfD);
        boxes.push(spanS);
      }
    }

    // Fasad Timur & Barat: Pilaster vertikal setiap 2.6 meter
    for (let z = -26; z <= 26; z += 2.6) {
      const pierE = new THREE.BoxGeometry(0.28, height, 0.3);
      pierE.translate(halfW, yCenter, z);
      boxes.push(pierE);

      const pierW = new THREE.BoxGeometry(0.28, height, 0.3);
      pierW.translate(-halfW, yCenter, z);
      boxes.push(pierW);

      if (z < 25) {
        const spanE = new THREE.BoxGeometry(0.16, 0.7, 2.3);
        spanE.translate(halfW, 0.35, z + 1.3);
        boxes.push(spanE);

        const spanW = new THREE.BoxGeometry(0.16, 0.7, 2.3);
        spanW.translate(-halfW, 0.35, z + 1.3);
        boxes.push(spanW);
      }
    }

    // 4 Tiang Sudut Masif
    [
      [-halfW, -halfD],
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD],
    ].forEach(([cx, cz]) => {
      const cp = new THREE.BoxGeometry(0.8, height, 0.8);
      cp.translate(cx, yCenter, cz);
      boxes.push(cp);
    });

    // Balok spandrel atas (head rail)
    [
      [0, height - 0.2, halfD, halfW * 2, 0.4, 0.28],
      [0, height - 0.2, -halfD, halfW * 2, 0.4, 0.28],
      [halfW, height - 0.2, 0, 0.28, 0.4, halfD * 2],
      [-halfW, height - 0.2, 0, 0.28, 0.4, halfD * 2],
    ].forEach(([rx, ry, rz, w, h, d]) => {
      const r = new THREE.BoxGeometry(w, h, d);
      r.translate(rx, ry, rz);
      boxes.push(r);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // Window panes (single merged geometry)
  const windowGeometry = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];

    const winN = new THREE.BoxGeometry(halfW * 2, height - 0.8, 0.05);
    winN.translate(0, yCenter + 0.2, halfD);
    planes.push(winN);

    const winS = new THREE.BoxGeometry(halfW * 2, height - 0.8, 0.05);
    winS.translate(0, yCenter + 0.2, -halfD);
    planes.push(winS);

    const winE = new THREE.BoxGeometry(0.05, height - 0.8, halfD * 2);
    winE.translate(halfW, yCenter + 0.2, 0);
    planes.push(winE);

    const winW = new THREE.BoxGeometry(0.05, height - 0.8, halfD * 2);
    winW.translate(-halfW, yCenter + 0.2, 0);
    planes.push(winW);

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {facadeGeometry && (
        <mesh geometry={facadeGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}
      {windowGeometry && (
        <mesh geometry={windowGeometry}>
          <meshStandardMaterial color="#2563EB" transparent opacity={0.35} roughness={0.25} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 4. Lantai 7 (Top Floor): Fasad dengan Lengkungan Islamik Lancip (Pointed Arches)
// Sesuai Foto 1 & 4: Deretan lengkungan lancip khas FST UIN di lantai teratas
// =========================================================================
function TopFloorArchedFacade() {
  const height = 4.1;
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  const archFacadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Utara & Selatan: Tiang vertikal + Lengkungan Lancip (Pointed Arches)
    for (let x = -30; x <= 30; x += 2.6) {
      const pierN = new THREE.BoxGeometry(0.32, height, 0.28);
      pierN.translate(x, yCenter, halfD);
      boxes.push(pierN);

      const pierS = new THREE.BoxGeometry(0.32, height, 0.28);
      pierS.translate(x, yCenter, -halfD);
      boxes.push(pierS);

      // Lengkungan Lancip (Pointed Arch Peak) di puncak tiap bay jendela
      if (x < 29) {
        // Balok segitiga / arch header lancip
        const archPeakN = new THREE.BoxGeometry(1.6, 0.7, 0.22);
        archPeakN.translate(x + 1.3, height - 0.45, halfD);
        boxes.push(archPeakN);

        const archPeakS = new THREE.BoxGeometry(1.6, 0.7, 0.22);
        archPeakS.translate(x + 1.3, height - 0.45, -halfD);
        boxes.push(archPeakS);

        // Ambang spandrel bawah
        const spanN = new THREE.BoxGeometry(2.3, 0.6, 0.16);
        spanN.translate(x + 1.3, 0.3, halfD);
        boxes.push(spanN);

        const spanS = new THREE.BoxGeometry(2.3, 0.6, 0.16);
        spanS.translate(x + 1.3, 0.3, -halfD);
        boxes.push(spanS);
      }
    }

    // Fasad Timur & Barat: Tiang vertikal + Lengkungan Lancip
    for (let z = -26; z <= 26; z += 2.6) {
      const pierE = new THREE.BoxGeometry(0.28, height, 0.32);
      pierE.translate(halfW, yCenter, z);
      boxes.push(pierE);

      const pierW = new THREE.BoxGeometry(0.28, height, 0.32);
      pierW.translate(-halfW, yCenter, z);
      boxes.push(pierW);

      if (z < 25) {
        const archPeakE = new THREE.BoxGeometry(0.22, 0.7, 1.6);
        archPeakE.translate(halfW, height - 0.45, z + 1.3);
        boxes.push(archPeakE);

        const archPeakW = new THREE.BoxGeometry(0.22, 0.7, 1.6);
        archPeakW.translate(-halfW, height - 0.45, z + 1.3);
        boxes.push(archPeakW);

        const spanE = new THREE.BoxGeometry(0.16, 0.6, 2.3);
        spanE.translate(halfW, 0.3, z + 1.3);
        boxes.push(spanE);

        const spanW = new THREE.BoxGeometry(0.16, 0.6, 2.3);
        spanW.translate(-halfW, 0.3, z + 1.3);
        boxes.push(spanW);
      }
    }

    // 4 Tiang Sudut Masif
    [
      [-halfW, -halfD],
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD],
    ].forEach(([cx, cz]) => {
      const cp = new THREE.BoxGeometry(0.8, height, 0.8);
      cp.translate(cx, yCenter, cz);
      boxes.push(cp);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // Window panes under pointed arches
  const windowGeometry = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];

    const winN = new THREE.BoxGeometry(halfW * 2, height - 1.1, 0.05);
    winN.translate(0, yCenter, halfD);
    planes.push(winN);

    const winS = new THREE.BoxGeometry(halfW * 2, height - 1.1, 0.05);
    winS.translate(0, yCenter, -halfD);
    planes.push(winS);

    const winE = new THREE.BoxGeometry(0.05, height - 1.1, halfD * 2);
    winE.translate(halfW, yCenter, 0);
    planes.push(winE);

    const winW = new THREE.BoxGeometry(0.05, height - 1.1, halfD * 2);
    winW.translate(-halfW, yCenter, 0);
    planes.push(winW);

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {archFacadeGeometry && (
        <mesh geometry={archFacadeGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}
      {windowGeometry && (
        <mesh geometry={windowGeometry}>
          <meshStandardMaterial color="#2563EB" transparent opacity={0.35} roughness={0.25} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 5. Atap, Menara Sudut Limasan & Kubah Ikonik (Foto Tampak Atas 2)
// Sesuai Foto Udara 2: Atap limasan melingkar void tengah, 4 menara sudut & 2 kubah
// =========================================================================
function RoofAndDomesStructure({ floor }: { floor: FloorModel }) {
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
      {/* Pelat Atap Datar Utama dengan Void */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry args={[shape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1 }]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* Parapet Keliling Atap */}
      <mesh position={[0, 0.6, 28]}>
        <boxGeometry args={[64, 0.7, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.6, -28]}>
        <boxGeometry args={[64, 0.7, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[32, 0.6, 0]}>
        <boxGeometry args={[0.4, 0.7, 56]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[-32, 0.6, 0]}>
        <boxGeometry args={[0.4, 0.7, 56]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>

      {/* 4 Menara Sudut dengan Atap Limasan / Piramida (Foto 2) */}
      {[
        [-28.5, -24.5],
        [28.5, -24.5],
        [28.5, 24.5],
        [-28.5, 24.5],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0.5, tz]}>
          {/* Badan Menara */}
          <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
            <boxGeometry args={[7, 2.5, 7]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
          </mesh>
          {/* Atap Limasan Piramida Menara */}
          <mesh position={[0, 3.5, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[5.2, 2.2, 4]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {/* 2 Kubah Ikonik Gedung FST (Sayap Utara & Selatan pada Foto 2) */}
      {[
        [0, 22],
        [0, -22],
      ].map(([dx, dz], i) => (
        <group key={i} position={[dx, 0.5, dz]}>
          {/* Drum Silinder Dasar Kubah */}
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.2, 3.4, 1.2, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
          </mesh>
          {/* Setengah Bola Kubah Bulat Khas UIN */}
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[3.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
          </mesh>
          {/* Ujung Puncak Spire Kubah */}
          <mesh position={[0, 4.4, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.25, 1.2, 8]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =========================================================================
// 6. Ruangan 3D Style Cutaway (Performance-Optimized, Buttery Smooth 60 FPS)
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
  const wallH = 1.3;

  return (
    <group position={[room.center[0], 0, -room.center[1]]}>
      {/* Lantai Ruang (Interaktif, Menampilkan Status AC / Telemetri) */}
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

      {/* Dinding Partisi Antar Ruang (Solid White Clay Ringan) */}
      <mesh position={[-room.size[0] * 0.47, wallH / 2, 0]}>
        <boxGeometry args={[0.16, wallH, room.size[1] * 0.92]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      <mesh position={[room.size[0] * 0.47, wallH / 2, 0]}>
        <boxGeometry args={[0.16, wallH, room.size[1] * 0.92]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Dinding Belakang Koridor Dalam */}
      <mesh position={[0, wallH / 2, -room.size[1] * 0.47]}>
        <boxGeometry args={[room.size[0] * 0.92, wallH, 0.16]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* Meja Simbolis di Tengah Ruangan */}
      {room.hasAc && (
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[room.size[0] * 0.35, 0.3, room.size[1] * 0.35]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.8} />
        </mesh>
      )}

      {/* Pin Indikator Pulsing pada Ruang Uji Coba Pilot R.601 */}
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

// =========================================================================
// 7. Railing Void Atrium (Pagar Pengaman Kaca Koridor Void)
// =========================================================================
function AtriumRailingMesh({ height }: { height: number }) {
  const voidHalfW = 21;
  const voidHalfD = 17;

  return (
    <group position={[0, height / 2, 0]}>
      <mesh position={[0, 0, voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, height, 0.05]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.5} roughness={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[0, 0, -voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, height, 0.05]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.5} roughness={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[-voidHalfW, 0, 0]}>
        <boxGeometry args={[0.05, height, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.5} roughness={0.3} depthWrite={false} />
      </mesh>
      <mesh position={[voidHalfW, 0, 0]}>
        <boxGeometry args={[0.05, height, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" transparent opacity={0.5} roughness={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}
