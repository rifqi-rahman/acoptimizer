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
        <boxGeometry args={[72, 0.4, 64]} />
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

            {/* Fasad Luar: 4 Menara Sudut Mencuat Lebih Besar (Toilet/Tangga di Barat, Teater di Timur) */}
            <ProtrudingCornerTowers level={floor.level} />

            {/* Fasad Luar Sayap Bangunan (6 Ruang Kelas di Kiri & Kanan) */}
            {floor.level === 1 ? (
              <GroundFloorColonnade />
            ) : floor.level === 7 ? (
              <TopFloorArchedFacade />
            ) : (
              <StandardFloorFacade />
            )}

            {/* Dinding Penghalang Void (Tinggi 1/3 Lantai) & Selasar Koridor (Sesuai Gambar 1) */}
            <AtriumVoidCorridorParapet />

            {/* Dinding Ruangan Tertutup Menghadap Void & Pintu-Pintu Ruangan (Sesuai Gambar 1) */}
            <AtriumInnerRoomWallsWithDoors />

            {/* Menara Tangga/Lift Melengkung di Dalam Courtyard (Sesuai Gambar 1 & 2) */}
            <CourtyardCurvedCoreTowers />

            {/* Ruangan-Ruangan Efisien (Interaktif, 60 FPS Performance-Optimized) */}
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

      {/* 3. Struktur Atap, 4 Menara Sudut Limasan & 2 Kubah Ikonik (Sesuai Gambar 2) */}
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
// 2. 4 Menara Sudut Mencuat Lebih Besar (Balok Berdiri Sesuai Foto Udara 2)
// Sisi Kiri (Barat): Toilet + Tangga Evakuasi
// Sisi Kanan (Timur): Ruang Teater
// Bagian sudut mencuat 1.5m keluar dari garis fasad utama
// =========================================================================
function ProtrudingCornerTowers({ level }: { level: number }) {
  const height = 4.1;
  const yCenter = height / 2;

  const cornerGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // 4 Sudut: Barat Laut (NW), Timur Laut (NE), Barat Daya (SW), Tenggara (SE)
    const corners = [
      { x: -28.2, z: 24.2, label: "NW" },
      { x: 28.2, z: 24.2, label: "NE" },
      { x: -28.2, z: -24.2, label: "SW" },
      { x: 28.2, z: -24.2, label: "SE" },
    ];

    corners.forEach(({ x, z }) => {
      // Badan menara sudut balok masif (ukuran 10.5m x 10.5m, mencuat keluar)
      const body = new THREE.BoxGeometry(10.5, height, 10.5);
      body.translate(x, yCenter, z);
      boxes.push(body);

      // Pilaster penegas vertikal pada sudut terluar (relief balok berdiri)
      const signX = x > 0 ? 1 : -1;
      const signZ = z > 0 ? 1 : -1;
      const pier = new THREE.BoxGeometry(0.5, height, 0.5);
      pier.translate(x + signX * 5.25, yCenter, z + signZ * 5.25);
      boxes.push(pier);

      // Detail strip jendela vertikal / panel relief kisi-kisi (seperti foto udara)
      const panelOuterX = new THREE.BoxGeometry(0.3, height - 1.2, 5.0);
      panelOuterX.translate(x + signX * 5.35, yCenter, z);
      boxes.push(panelOuterX);

      const panelOuterZ = new THREE.BoxGeometry(5.0, height - 1.2, 0.3);
      panelOuterZ.translate(x, yCenter, z + signZ * 5.35);
      boxes.push(panelOuterZ);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, yCenter]);

  // Jendela sempit kaca pada menara sudut
  const cornerGlass = useMemo(() => {
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

      // Jendela vertikal pada sisi luar
      const winX = new THREE.BoxGeometry(0.08, height - 1.6, 2.2);
      winX.translate(x + signX * 5.32, yCenter, z);
      planes.push(winX);

      const winZ = new THREE.BoxGeometry(2.2, height - 1.6, 0.08);
      winZ.translate(x, yCenter, z + signZ * 5.32);
      planes.push(winZ);
    });

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [height, yCenter]);

  return (
    <group>
      {cornerGeometry && (
        <mesh geometry={cornerGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}
      {cornerGlass && (
        <mesh geometry={cornerGlass}>
          <meshStandardMaterial color="#2563EB" transparent opacity={0.35} roughness={0.25} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 3. Fasad Lantai 1: Pilotis Terbuka & Kanopi Lobi Masuk FST
// =========================================================================
function GroundFloorColonnade() {
  const height = 4.1;
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  const colonnadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Kolom Utara & Selatan (antara menara sudut)
    for (let x = -20; x <= 20; x += 5.0) {
      const colN = new THREE.BoxGeometry(0.65, height, 0.65);
      colN.translate(x, yCenter, halfD);
      boxes.push(colN);

      const colS = new THREE.BoxGeometry(0.65, height, 0.65);
      colS.translate(x, yCenter, -halfD);
      boxes.push(colS);
    }

    // Kolom Timur & Barat (Sayap 6 Ruang Kelas)
    for (let z = -16; z <= 16; z += 6.5) {
      const colE = new THREE.BoxGeometry(0.65, height, 0.65);
      colE.translate(halfW, yCenter, z);
      boxes.push(colE);

      const colW = new THREE.BoxGeometry(0.65, height, 0.65);
      colW.translate(-halfW, yCenter, z);
      boxes.push(colW);
    }

    // Balok lintel atas
    const lintelN = new THREE.BoxGeometry(46, 0.4, 0.65);
    lintelN.translate(0, height - 0.2, halfD);
    boxes.push(lintelN);

    const lintelS = new THREE.BoxGeometry(46, 0.4, 0.65);
    lintelS.translate(0, height - 0.2, -halfD);
    boxes.push(lintelS);

    const lintelE = new THREE.BoxGeometry(0.65, 0.4, 38);
    lintelE.translate(halfW, height - 0.2, 0);
    boxes.push(lintelE);

    const lintelW = new THREE.BoxGeometry(0.65, 0.4, 38);
    lintelW.translate(-halfW, height - 0.2, 0);
    boxes.push(lintelW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {colonnadeGeometry && (
        <mesh geometry={colonnadeGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}

      {/* Dinding Kaca Lobi Dalam Lantai 1 */}
      <mesh position={[0, yCenter, -halfD + 4]}>
        <boxGeometry args={[26, height, 0.05]} />
        <meshStandardMaterial color="#2563EB" transparent opacity={0.3} roughness={0.25} depthWrite={false} />
      </mesh>
      <mesh position={[0, yCenter, halfD - 4]}>
        <boxGeometry args={[26, height, 0.05]} />
        <meshStandardMaterial color="#2563EB" transparent opacity={0.3} roughness={0.25} depthWrite={false} />
      </mesh>

      {/* Kanopi Lobi Masuk Utama FST dengan Skylight Prisma Kaca (Foto 1 & 3) */}
      <group position={[0, 0, -halfD - 2.5]}>
        <mesh position={[0, height - 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[16, 0.35, 6]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        <mesh position={[-6.5, yCenter, -2.5]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        <mesh position={[6.5, yCenter, -2.5]} castShadow>
          <boxGeometry args={[0.45, height, 0.45]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
        <mesh position={[0, height + 1.1, 0]} rotation={[0, Math.PI / 4, 0]}>
          <coneGeometry args={[3.2, 1.8, 4]} />
          <meshStandardMaterial color="#10B981" transparent opacity={0.65} roughness={0.2} />
        </mesh>
        <mesh position={[0, height - 0.2, -3.05]}>
          <boxGeometry args={[15.6, 0.5, 0.1]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// 4. Fasad Lantai 2 s/d 6: 6 Ruang Kelas di Sayap Sisi & Pilaster Vertikal
// =========================================================================
function StandardFloorFacade() {
  const height = 4.1;
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  const facadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Timur & Barat: 6 Ruang Kelas (antara Z = -19.5 s/d +19.5, total 39m)
    // Setiap ruang kelas berukuran 6.5m memiliki 2 kolom jendela + pilaster
    for (let z = -18; z <= 18; z += 3.25) {
      const pierE = new THREE.BoxGeometry(0.28, height, 0.3);
      pierE.translate(halfW, yCenter, z);
      boxes.push(pierE);

      const pierW = new THREE.BoxGeometry(0.28, height, 0.3);
      pierW.translate(-halfW, yCenter, z);
      boxes.push(pierW);

      if (z < 17) {
        const spanE = new THREE.BoxGeometry(0.16, 0.7, 2.95);
        spanE.translate(halfW, 0.35, z + 1.625);
        boxes.push(spanE);

        const spanW = new THREE.BoxGeometry(0.16, 0.7, 2.95);
        spanW.translate(-halfW, 0.35, z + 1.625);
        boxes.push(spanW);
      }
    }

    // Fasad Utara & Selatan: 6 Ruangan di sisi kiri/kanan core
    for (let x = -21; x <= 21; x += 2.6) {
      // Lewatkan zona lounge/core tengah
      if (Math.abs(x) < 6.5) continue;

      const pierN = new THREE.BoxGeometry(0.3, height, 0.28);
      pierN.translate(x, yCenter, halfD);
      boxes.push(pierN);

      const pierS = new THREE.BoxGeometry(0.3, height, 0.28);
      pierS.translate(x, yCenter, -halfD);
      boxes.push(pierS);

      if (x < 20 && Math.abs(x + 1.3) >= 6.5) {
        const spanN = new THREE.BoxGeometry(2.3, 0.7, 0.16);
        spanN.translate(x + 1.3, 0.35, halfD);
        boxes.push(spanN);

        const spanS = new THREE.BoxGeometry(2.3, 0.7, 0.16);
        spanS.translate(x + 1.3, 0.35, -halfD);
        boxes.push(spanS);
      }
    }

    // Dinding Fasad Core Tengah (Menonjol Vertikal)
    const coreWallN = new THREE.BoxGeometry(14, height, 0.3);
    coreWallN.translate(0, yCenter, halfD + 0.6);
    boxes.push(coreWallN);

    const coreWallS = new THREE.BoxGeometry(14, height, 0.3);
    coreWallS.translate(0, yCenter, -halfD - 0.6);
    boxes.push(coreWallS);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  // Window panes (single merged geometry)
  const windowGeometry = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];

    // Jendela Timur & Barat (Sayap 6 Ruang Kelas)
    const winE = new THREE.BoxGeometry(0.05, height - 0.8, 38);
    winE.translate(halfW, yCenter + 0.2, 0);
    planes.push(winE);

    const winW = new THREE.BoxGeometry(0.05, height - 0.8, 38);
    winW.translate(-halfW, yCenter + 0.2, 0);
    planes.push(winW);

    // Jendela Utara & Selatan
    const winN1 = new THREE.BoxGeometry(15, height - 0.8, 0.05);
    winN1.translate(-14.5, yCenter + 0.2, halfD);
    planes.push(winN1);
    const winN2 = new THREE.BoxGeometry(15, height - 0.8, 0.05);
    winN2.translate(14.5, yCenter + 0.2, halfD);
    planes.push(winN2);

    const winS1 = new THREE.BoxGeometry(15, height - 0.8, 0.05);
    winS1.translate(-14.5, yCenter + 0.2, -halfD);
    planes.push(winS1);
    const winS2 = new THREE.BoxGeometry(15, height - 0.8, 0.05);
    winS2.translate(14.5, yCenter + 0.2, -halfD);
    planes.push(winS2);

    // Kaca Vertikal Core Tengah (Foto 1)
    const winCoreN = new THREE.BoxGeometry(4.5, height - 0.4, 0.05);
    winCoreN.translate(0, yCenter, halfD + 0.75);
    planes.push(winCoreN);

    const winCoreS = new THREE.BoxGeometry(4.5, height - 0.4, 0.05);
    winCoreS.translate(0, yCenter, -halfD - 0.75);
    planes.push(winCoreS);

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
// 5. Fasad Lantai 7: Lengkungan Islamik Lancip (Pointed Arches Khas FST)
// =========================================================================
function TopFloorArchedFacade() {
  const height = 4.1;
  const halfW = 31.8;
  const halfD = 27.8;
  const yCenter = height / 2;

  const archFacadeGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Fasad Timur & Barat: 6 Ruang Kelas beratap lengkungan lancip
    for (let z = -18; z <= 18; z += 3.25) {
      const pierE = new THREE.BoxGeometry(0.28, height, 0.3);
      pierE.translate(halfW, yCenter, z);
      boxes.push(pierE);

      const pierW = new THREE.BoxGeometry(0.28, height, 0.3);
      pierW.translate(-halfW, yCenter, z);
      boxes.push(pierW);

      if (z < 17) {
        // Puncak lengkungan lancip (Pointed Arch Peak)
        const peakE = new THREE.BoxGeometry(0.2, 0.75, 2.0);
        peakE.translate(halfW, height - 0.45, z + 1.625);
        boxes.push(peakE);

        const peakW = new THREE.BoxGeometry(0.2, 0.75, 2.0);
        peakW.translate(-halfW, height - 0.45, z + 1.625);
        boxes.push(peakW);

        const spanE = new THREE.BoxGeometry(0.16, 0.6, 2.95);
        spanE.translate(halfW, 0.3, z + 1.625);
        boxes.push(spanE);

        const spanW = new THREE.BoxGeometry(0.16, 0.6, 2.95);
        spanW.translate(-halfW, 0.3, z + 1.625);
        boxes.push(spanW);
      }
    }

    // Fasad Utara & Selatan: Lengkungan lancip di tiap bay
    for (let x = -21; x <= 21; x += 2.6) {
      if (Math.abs(x) < 6.5) continue;

      const pierN = new THREE.BoxGeometry(0.32, height, 0.28);
      pierN.translate(x, yCenter, halfD);
      boxes.push(pierN);

      const pierS = new THREE.BoxGeometry(0.32, height, 0.28);
      pierS.translate(x, yCenter, -halfD);
      boxes.push(pierS);

      if (x < 20 && Math.abs(x + 1.3) >= 6.5) {
        const peakN = new THREE.BoxGeometry(1.6, 0.75, 0.2);
        peakN.translate(x + 1.3, height - 0.45, halfD);
        boxes.push(peakN);

        const peakS = new THREE.BoxGeometry(1.6, 0.75, 0.2);
        peakS.translate(x + 1.3, height - 0.45, -halfD);
        boxes.push(peakS);

        const spanN = new THREE.BoxGeometry(2.3, 0.6, 0.16);
        spanN.translate(x + 1.3, 0.3, halfD);
        boxes.push(spanN);

        const spanS = new THREE.BoxGeometry(2.3, 0.6, 0.16);
        spanS.translate(x + 1.3, 0.3, -halfD);
        boxes.push(spanS);
      }
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, halfW, halfD, yCenter]);

  return (
    <group>
      {archFacadeGeometry && (
        <mesh geometry={archFacadeGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 6. Dinding Penghalang Void (Tinggi 1/3 Lantai) & Selasar Koridor (Gambar 1)
// Sesuai Foto 1: Dinding penghalang setinggi 1/3 lantai (1.35m) melingkari void
// dengan lis pegangan dan pot tanaman hijau di atasnya
// =========================================================================
function AtriumVoidCorridorParapet() {
  const parapetH = 1.35; // Tepat 1/3 dari tinggi lantai (4.1m)
  const voidHalfW = 21.0;
  const voidHalfD = 17.0;

  const parapetGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Dinding penghalang solid setinggi 1.35m di keliling void
    // Sisi Utara & Selatan
    const pN = new THREE.BoxGeometry(voidHalfW * 2, parapetH, 0.18);
    pN.translate(0, parapetH / 2, voidHalfD);
    boxes.push(pN);

    const pS = new THREE.BoxGeometry(voidHalfW * 2, parapetH, 0.18);
    pS.translate(0, parapetH / 2, -voidHalfD);
    boxes.push(pS);

    // Sisi Barat & Timur
    const pE = new THREE.BoxGeometry(0.18, parapetH, voidHalfD * 2);
    pE.translate(voidHalfW, parapetH / 2, 0);
    boxes.push(pE);

    const pW = new THREE.BoxGeometry(0.18, parapetH, voidHalfD * 2);
    pW.translate(-voidHalfW, parapetH / 2, 0);
    boxes.push(pW);

    // Lis penutup atas (Handrail ledge)
    const capN = new THREE.BoxGeometry(voidHalfW * 2 + 0.2, 0.08, 0.26);
    capN.translate(0, parapetH + 0.04, voidHalfD);
    boxes.push(capN);

    const capS = new THREE.BoxGeometry(voidHalfW * 2 + 0.2, 0.08, 0.26);
    capS.translate(0, parapetH + 0.04, -voidHalfD);
    boxes.push(capS);

    const capE = new THREE.BoxGeometry(0.26, 0.08, voidHalfD * 2 + 0.2);
    capE.translate(voidHalfW, parapetH + 0.04, 0);
    boxes.push(capE);

    const capW = new THREE.BoxGeometry(0.26, 0.08, voidHalfD * 2 + 0.2);
    capW.translate(-voidHalfW, parapetH + 0.04, 0);
    boxes.push(capW);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [parapetH, voidHalfW, voidHalfD]);

  // Tanaman / Planters hijau di sepanjang lis penghalang void (Sesuai Foto 1)
  const planterGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Deretan tanaman gantung / pot kecil di atas dinding void
    for (let x = -18; x <= 18; x += 3.6) {
      const plN = new THREE.BoxGeometry(2.2, 0.16, 0.2);
      plN.translate(x, parapetH + 0.12, voidHalfD);
      boxes.push(plN);

      const plS = new THREE.BoxGeometry(2.2, 0.16, 0.2);
      plS.translate(x, parapetH + 0.12, -voidHalfD);
      boxes.push(plS);
    }

    for (let z = -14; z <= 14; z += 3.5) {
      const plE = new THREE.BoxGeometry(0.2, 0.16, 2.2);
      plE.translate(voidHalfW, parapetH + 0.12, z);
      boxes.push(plE);

      const plW = new THREE.BoxGeometry(0.2, 0.16, 2.2);
      plW.translate(-voidHalfW, parapetH + 0.12, z);
      boxes.push(plW);
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [parapetH, voidHalfW, voidHalfD]);

  return (
    <group>
      {parapetGeometry && (
        <mesh geometry={parapetGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}
      {planterGeometry && (
        <mesh geometry={planterGeometry}>
          <meshStandardMaterial color="#16A34A" roughness={0.7} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 7. Dinding Ruangan Tertutup Menghadap Void & Pintu-Pintu Ruangan (Gambar 1)
// Sesuai Foto 1: Dinding tertutup tembok dengan pintu kayu dan jendela ventilasi atas
// =========================================================================
function AtriumInnerRoomWallsWithDoors() {
  const height = 4.1;
  const innerWallW = 24.0; // Batas dalam ruang kelas (lebar koridor ~3.0m)
  const innerWallD = 20.0;
  const yCenter = height / 2;

  // Dinding putih masif menghadap koridor
  const wallGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Sayap Barat & Timur (menghadap koridor, panjang 38m)
    const wE = new THREE.BoxGeometry(0.18, height, 38);
    wE.translate(innerWallW, yCenter, 0);
    boxes.push(wE);

    const wW = new THREE.BoxGeometry(0.18, height, 38);
    wW.translate(-innerWallW, yCenter, 0);
    boxes.push(wW);

    // Sayap Utara & Selatan (kiri & kanan core, panjang 16m)
    const wN1 = new THREE.BoxGeometry(16, height, 0.18);
    wN1.translate(-15, yCenter, innerWallD);
    boxes.push(wN1);
    const wN2 = new THREE.BoxGeometry(16, height, 0.18);
    wN2.translate(15, yCenter, innerWallD);
    boxes.push(wN2);

    const wS1 = new THREE.BoxGeometry(16, height, 0.18);
    wS1.translate(-15, yCenter, -innerWallD);
    boxes.push(wS1);
    const wS2 = new THREE.BoxGeometry(16, height, 0.18);
    wS2.translate(15, yCenter, -innerWallD);
    boxes.push(wS2);

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [height, innerWallW, innerWallD, yCenter]);

  // Kusen & Daun Pintu Kayu Ruangan (Penanda Tiap Ruang Kelas Sesuai Foto 1)
  const doorsGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    const doorW = 1.05;
    const doorH = 2.3;

    // Pintu-pintu di Sayap Barat & Timur (6 ruang kelas per sayap)
    for (let z = -16.25; z <= 16.25; z += 6.5) {
      // Pintu Sayap Timur
      const dE = new THREE.BoxGeometry(0.08, doorH, doorW);
      dE.translate(innerWallW - 0.12, doorH / 2, z);
      boxes.push(dE);

      // Pintu Sayap Barat
      const dW = new THREE.BoxGeometry(0.08, doorH, doorW);
      dW.translate(-innerWallW + 0.12, doorH / 2, z);
      boxes.push(dW);
    }

    // Pintu-pintu di Sayap Utara & Selatan (6 ruang kelas)
    const xSlots = [-19, -15, -11, 11, 15, 19];
    xSlots.forEach((x) => {
      const dN = new THREE.BoxGeometry(doorW, doorH, 0.08);
      dN.translate(x, doorH / 2, innerWallD - 0.12);
      boxes.push(dN);

      const dS = new THREE.BoxGeometry(doorW, doorH, 0.08);
      dS.translate(x, doorH / 2, -innerWallD + 0.12);
      boxes.push(dS);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [innerWallW, innerWallD]);

  // Jendela Ventilasi Atas (Transom Windows di Bagian Atas Dinding Koridor - Foto 1)
  const transomGlassGeometry = useMemo(() => {
    const planes: THREE.BufferGeometry[] = [];
    const tH = 0.9;
    const tY = 3.2;

    // Sayap Timur & Barat
    const tE = new THREE.BoxGeometry(0.06, tH, 36);
    tE.translate(innerWallW - 0.1, tY, 0);
    planes.push(tE);

    const tW = new THREE.BoxGeometry(0.06, tH, 36);
    tW.translate(-innerWallW + 0.1, tY, 0);
    planes.push(tW);

    // Sayap Utara & Selatan
    const tN1 = new THREE.BoxGeometry(15, tH, 0.06);
    tN1.translate(-15, tY, innerWallD - 0.1);
    planes.push(tN1);
    const tN2 = new THREE.BoxGeometry(15, tH, 0.06);
    tN2.translate(15, tY, innerWallD - 0.1);
    planes.push(tN2);

    const tS1 = new THREE.BoxGeometry(15, tH, 0.06);
    tS1.translate(-15, tY, -innerWallD + 0.1);
    planes.push(tS1);
    const tS2 = new THREE.BoxGeometry(15, tH, 0.06);
    tS2.translate(15, tY, -innerWallD + 0.1);
    planes.push(tS2);

    return BufferGeometryUtils.mergeGeometries(planes, false);
  }, [innerWallW, innerWallD]);

  return (
    <group>
      {/* Tembok Putih Pembatas Ruang Menghadap Void */}
      {wallGeometry && (
        <mesh geometry={wallGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
        </mesh>
      )}

      {/* Pintu Kayu Cokelat (Penanda Visual Ruangan) */}
      {doorsGeometry && (
        <mesh geometry={doorsGeometry} castShadow>
          <meshStandardMaterial color="#78350F" roughness={0.65} />
        </mesh>
      )}

      {/* Jendela Ventilasi Atas Kaca */}
      {transomGlassGeometry && (
        <mesh geometry={transomGlassGeometry}>
          <meshStandardMaterial color="#60A5FA" transparent opacity={0.4} roughness={0.2} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 8. Menara Tangga Melengkung di Sudut Courtyard (Foto 1 & 2)
// Sesuai Foto 1 (kiri & kanan depan): Dua menara setengah silinder berbalok kaca
// =========================================================================
function CourtyardCurvedCoreTowers() {
  const height = 4.1;
  const yCenter = height / 2;

  return (
    <group>
      {/* Menara Lengkung Core Utara (Menghadap Void) */}
      <mesh position={[0, yCenter, 18.0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.2, height, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      {/* Grid Kaca Balok (Roster Kaca di Dinding Lengkung Menara - Foto 1) */}
      <mesh position={[0, yCenter, 13.8]}>
        <boxGeometry args={[3.2, height - 1.2, 0.05]} />
        <meshStandardMaterial color="#BAE6FD" transparent opacity={0.6} roughness={0.3} depthWrite={false} />
      </mesh>

      {/* Menara Lengkung Core Selatan (Menghadap Void) */}
      <mesh position={[0, yCenter, -18.0]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.2, height, 24, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
      </mesh>
      <mesh position={[0, yCenter, -13.8]}>
        <boxGeometry args={[3.2, height - 1.2, 0.05]} />
        <meshStandardMaterial color="#BAE6FD" transparent opacity={0.6} roughness={0.3} depthWrite={false} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 9. Struktur Atap, 4 Menara Sudut Limasan & 2 Kubah Ikonik (Foto 2)
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

      {/* 4 Menara Sudut Mencuat dengan Atap Limasan / Piramida (Sesuai Foto Udara 2) */}
      {[
        [-28.2, 24.2],
        [28.2, 24.2],
        [-28.2, -24.2],
        [28.2, -24.2],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0.5, tz]}>
          {/* Badan Menara Sudut Tinggi */}
          <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.5, 3.0, 10.5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
          </mesh>
          {/* Atap Limasan Piramida Menara Sudut (Foto 2) */}
          <mesh position={[0, 4.4, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[7.8, 2.8, 4]} />
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
          <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[3.2, 3.4, 1.2, 24]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[3.1, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.7} />
          </mesh>
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
// 10. Ruangan 3D Style Cutaway (Performance-Optimized, 60 FPS)
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
  const wallH = 1.2;

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
