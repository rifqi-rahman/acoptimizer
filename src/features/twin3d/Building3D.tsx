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
      {/* =================================================================== */}
      {/* 1. MODEL UTUH GEDUNG FST (TAMPILAN MODE BUILDING)                   */}
      {/* =================================================================== */}
      {mode === "building" && (
        <group>
          {/* Kolom Merah & Area Parkir / Drop-off Terbuka Lantai 1 */}
          <GroundFloorColonnade />

          {/* Fasad Eksterior Otentik (Krem, Terracotta, Pinstripe Hijau & Ornamen) */}
          <AuthenticExteriorFacade />

          {/* Atap Genteng Merah Bata, Panel Surya (PV) & Kubah Hijau */}
          <AuthenticRoofSystem />

          {/* Halaman Atrium Dalam (Taman, Parkir & Tanaman Koridor) */}
          <CourtyardGarden />
        </group>
      )}

      {/* =================================================================== */}
      {/* 2. DIGITAL TWIN INTERAKTIF: SLAB LANTAI & RUANGAN                    */}
      {/* =================================================================== */}
      {floors.map((floor) => {
        const yBase = (floor.level - 1) * 4.6;
        const isHiddenInFocus = mode !== "building" && selectedFloor !== floor.level;

        if (isHiddenInFocus) return null;

        return (
          <group key={floor.level} position={[0, yBase, 0]}>
            {/* Pelat Lantai Putih dengan Void Atrium Tengah */}
            <FloorSlabMesh floor={floor} isFloorFocus={mode !== "building"} />

            {/* Dinding Pembatas / Railing Void Atrium Dalam */}
            <AtriumInnerCorridorRail floor={floor} />

            {/* Ruangan-ruangan Berwarna Status AC (Interactive Digital Twin) */}
            {floor.rooms.map((room) => {
              const live = liveRooms[room.slotId];
              const status = live
                ? deriveRoomStatus(live, now)
                : room.hasDevice
                ? "OCCUPIED"
                : "NO_DEVICE";

              const color = getStatusColor(status, layer, live?.temperature ?? null);

              return (
                <InteractiveRoomBox
                  key={room.slotId}
                  room={room}
                  color={color}
                  isFloorFocus={mode !== "building"}
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
    </group>
  );
};

// =========================================================================
// 1. ATAP GENTENG MERAH BATA, PANEL SURYA (PV) & KUBAH HIJAU (FOTO 2 & 5)
// =========================================================================
function AuthenticRoofSystem() {
  const roofY = 7 * 4.6; // Elevasi di atas lantai 7 (Y = 32.2)

  // Merged geometry untuk atap genteng merah limasan di sekeliling 4 sayap
  const roofTilesGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    const roofH = 3.6;
    const slopeW = 11.5;

    // Sayap Utara & Selatan (atap miring merah)
    // Utara
    const northRoof = new THREE.BoxGeometry(65, 0.4, slopeW);
    northRoof.rotateX(0.28);
    northRoof.translate(0, roofY + roofH / 2, 22.5);
    boxes.push(northRoof);

    // Selatan
    const southRoof = new THREE.BoxGeometry(65, 0.4, slopeW);
    southRoof.rotateX(-0.28);
    southRoof.translate(0, roofY + roofH / 2, -22.5);
    boxes.push(southRoof);

    // Sayap Timur & Barat
    // Timur
    const eastRoof = new THREE.BoxGeometry(slopeW, 0.4, 38);
    eastRoof.rotateZ(-0.28);
    eastRoof.translate(26.5, roofY + roofH / 2, 0);
    boxes.push(eastRoof);

    // Barat
    const westRoof = new THREE.BoxGeometry(slopeW, 0.4, 38);
    westRoof.rotateZ(0.28);
    westRoof.translate(-26.5, roofY + roofH / 2, 0);
    boxes.push(westRoof);

    // 4 Piramida Paviliun Sudut (Corner Towers)
    [
      [-32, -28],
      [32, -28],
      [32, 28],
      [-32, 28],
    ].forEach(([cx, cz]) => {
      const cornerPyramid = new THREE.ConeGeometry(9.5, 4.2, 4);
      cornerPyramid.rotateY(Math.PI / 4);
      cornerPyramid.translate(cx, roofY + 2.1, cz);
      boxes.push(cornerPyramid);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [roofY]);

  // Merged geometry untuk Solar Panels (PV Arrays) di atap (Foto 2 & 5)
  const solarPanelsGeometry = useMemo(() => {
    const panels: THREE.BufferGeometry[] = [];

    // Array panel surya sisi Selatan (menghadap matahari)
    for (let x = -18; x <= 18; x += 4.5) {
      const pv = new THREE.BoxGeometry(3.8, 0.08, 6.2);
      pv.rotateX(-0.28);
      pv.translate(x, roofY + 2.4, -22.5);
      panels.push(pv);
    }

    // Array panel surya sisi Utara
    for (let x = -18; x <= 18; x += 4.5) {
      const pv = new THREE.BoxGeometry(3.8, 0.08, 6.2);
      pv.rotateX(0.28);
      pv.translate(x, roofY + 2.4, 22.5);
      panels.push(pv);
    }

    return BufferGeometryUtils.mergeGeometries(panels, false);
  }, [roofY]);

  return (
    <group>
      {/* Atap Genteng Merah Bata Terracotta */}
      {roofTilesGeometry && (
        <mesh geometry={roofTilesGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#A63D24" roughness={0.75} />
        </mesh>
      )}

      {/* Array Panel Surya (Photovoltaic) Biru Gelap */}
      {solarPanelsGeometry && (
        <mesh geometry={solarPanelsGeometry}>
          <meshStandardMaterial color="#1E3A8A" roughness={0.3} metalness={0.7} />
        </mesh>
      )}

      {/* Tower Tangga/Lift Tengah dengan Kubah Hijau Otentik FST (Foto 2 & 5) */}
      <group position={[0, roofY, 20]}>
        {/* Struktur Dinding Tower Putih/Krem */}
        <mesh position={[0, 2.5, 0]} castShadow>
          <boxGeometry args={[11, 5, 9]} />
          <meshStandardMaterial color="#F5EFEB" roughness={0.8} />
        </mesh>
        {/* Silinder Dudukan Kubah (Drum) */}
        <mesh position={[0, 5.8, 0]} castShadow>
          <cylinderGeometry args={[4.4, 4.4, 1.6, 32]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>
        {/* Kubah Hijau Khas FST */}
        <mesh position={[0, 6.6, 0]} castShadow>
          <sphereGeometry args={[4.4, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#558B6E" roughness={0.5} />
        </mesh>
        {/* Spire / Ujung Kubah */}
        <mesh position={[0, 11.4, 0]}>
          <cylinderGeometry args={[0.08, 0.18, 1.2, 8]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// 2. FASAD EKSTERIOR OTENTIK FST (KREM, TERRACOTTA, PINSTRIPE HIJAU, ROSTER)
// Sesuai Foto 1, 3, dan 4
// =========================================================================
function AuthenticExteriorFacade() {
  const h = 6 * 4.6; // Tinggi dari Lantai 2 sampai 7 (6 lantai x 4.6m = 27.6m)
  const yCenter = 4.6 + h / 2; // Mulai di atas lobi lantai 1 (Y = 18.4)
  const halfW = 32.1;
  const halfD = 28.1;

  // 1. Dinding Utama Warna Krem/Off-White
  const creamWallsGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];
    const wallThick = 0.3;

    // Fasad Utara & Selatan
    const northW = new THREE.BoxGeometry(halfW * 2, h, wallThick);
    northW.translate(0, yCenter, halfD);
    boxes.push(northW);

    const southW = new THREE.BoxGeometry(halfW * 2, h, wallThick);
    southW.translate(0, yCenter, -halfD);
    boxes.push(southW);

    // Fasad Timur & Barat
    const eastW = new THREE.BoxGeometry(wallThick, h, halfD * 2);
    eastW.translate(halfW, yCenter, 0);
    boxes.push(eastW);

    const westW = new THREE.BoxGeometry(wallThick, h, halfD * 2);
    westW.translate(-halfW, yCenter, 0);
    boxes.push(westW);

    // Menara Sudut Vertikal Menonjol
    [
      [-halfW, -halfD],
      [halfW, -halfD],
      [halfW, halfD],
      [-halfW, halfD],
    ].forEach(([cx, cz]) => {
      const tower = new THREE.BoxGeometry(2.4, h + 1.5, 2.4);
      tower.translate(cx, yCenter + 0.75, cz);
      boxes.push(tower);
    });

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [h, yCenter, halfW, halfD]);

  // 2. Pilaster Garis Terracotta-Red & Ornamen Ventilasi Roster (Foto 1 & 4)
  const terracottaAccentsGeometry = useMemo(() => {
    const boxes: THREE.BufferGeometry[] = [];

    // Pilaster Vertikal Terracotta di Sisi Selatan (Fasad Depan) & Utara
    for (let x = -26; x <= 26; x += 4.0) {
      // Pilaster Vertikal Penuh
      const pNorth = new THREE.BoxGeometry(0.7, h, 0.45);
      pNorth.translate(x, yCenter, halfD + 0.05);
      boxes.push(pNorth);

      const pSouth = new THREE.BoxGeometry(0.7, h, 0.45);
      pSouth.translate(x, yCenter, -halfD - 0.05);
      boxes.push(pSouth);

      // Panel Roster / Kisi Ornamen Islami di antara jendela tiap lantai
      for (let floorIdx = 0; floorIdx < 6; floorIdx++) {
        const floorY = 4.6 + floorIdx * 4.6 + 1.2;
        const rosterN = new THREE.BoxGeometry(1.6, 1.4, 0.42);
        rosterN.translate(x + 2.0, floorY, halfD + 0.03);
        boxes.push(rosterN);

        const rosterS = new THREE.BoxGeometry(1.6, 1.4, 0.42);
        rosterS.translate(x + 2.0, floorY, -halfD - 0.03);
        boxes.push(rosterS);
      }
    }

    // Pilaster Vertikal Sisi Timur & Barat
    for (let z = -22; z <= 22; z += 4.0) {
      const pEast = new THREE.BoxGeometry(0.45, h, 0.7);
      pEast.translate(halfW + 0.05, yCenter, z);
      boxes.push(pEast);

      const pWest = new THREE.BoxGeometry(0.45, h, 0.7);
      pWest.translate(-halfW - 0.05, yCenter, z);
      boxes.push(pWest);
    }

    return BufferGeometryUtils.mergeGeometries(boxes, false);
  }, [h, yCenter, halfW, halfD]);

  // 3. Pinstripe Vertikal Hijau Khas FST di Samping Tiang Terracotta (Foto 1 & 4)
  const greenPinstripesGeometry = useMemo(() => {
    const strips: THREE.BufferGeometry[] = [];

    // Garis hijau mengapit pilaster terracotta di Fasad Depan (Selatan) & Utara
    for (let x = -26; x <= 26; x += 4.0) {
      // Sisi kiri & kanan tiang terracotta
      [-0.42, 0.42].forEach((offset) => {
        const sNorth = new THREE.BoxGeometry(0.12, h, 0.48);
        sNorth.translate(x + offset, yCenter, halfD + 0.06);
        strips.push(sNorth);

        const sSouth = new THREE.BoxGeometry(0.12, h, 0.48);
        sSouth.translate(x + offset, yCenter, -halfD - 0.06);
        strips.push(sSouth);
      });
    }

    // Arch Islami / Lengkungan Hijau di Lantai 7 (Lantai Paling Atas)
    const topFloorY = 4.6 + 5 * 4.6 + 3.2;
    for (let x = -24; x <= 24; x += 4.0) {
      const archFrame = new THREE.BoxGeometry(1.6, 0.25, 0.5);
      archFrame.translate(x, topFloorY, -halfD - 0.06);
      strips.push(archFrame);
    }

    return BufferGeometryUtils.mergeGeometries(strips, false);
  }, [h, yCenter, halfW, halfD]);

  // 4. Jendela-Jendela Kaca Gelap Ritmik Fasad Luar
  const windowPanesGeometry = useMemo(() => {
    const panes: THREE.BufferGeometry[] = [];

    for (let floorIdx = 0; floorIdx < 6; floorIdx++) {
      const winY = 4.6 + floorIdx * 4.6 + 2.8;

      // Jendela di Fasad Depan (Selatan) & Belakang (Utara)
      for (let x = -24; x <= 24; x += 4.0) {
        const winN = new THREE.BoxGeometry(1.5, 1.8, 0.38);
        winN.translate(x, winY, halfD + 0.02);
        panes.push(winN);

        const winS = new THREE.BoxGeometry(1.5, 1.8, 0.38);
        winS.translate(x, winY, -halfD - 0.02);
        panes.push(winS);
      }

      // Jendela di Fasad Timur & Barat
      for (let z = -20; z <= 20; z += 4.0) {
        const winE = new THREE.BoxGeometry(0.38, 1.8, 1.5);
        winE.translate(halfW + 0.02, winY, z);
        panes.push(winE);

        const winW = new THREE.BoxGeometry(0.38, 1.8, 1.5);
        winW.translate(-halfW - 0.02, winY, z);
        panes.push(winW);
      }
    }

    return BufferGeometryUtils.mergeGeometries(panes, false);
  }, [halfW, halfD]);

  return (
    <group>
      {/* 1. Dinding Utama Krem/Off-White */}
      {creamWallsGeometry && (
        <mesh geometry={creamWallsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#F7F2EB" roughness={0.8} />
        </mesh>
      )}

      {/* 2. Aksen Terracotta Red & Ornamen Kisi Roster */}
      {terracottaAccentsGeometry && (
        <mesh geometry={terracottaAccentsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#C85A3E" roughness={0.7} />
        </mesh>
      )}

      {/* 3. Pinstripe Vertikal Hijau & Arch Islami */}
      {greenPinstripesGeometry && (
        <mesh geometry={greenPinstripesGeometry} castShadow>
          <meshStandardMaterial color="#2E7D32" roughness={0.6} />
        </mesh>
      )}

      {/* 4. Kaca Jendela Gelap */}
      {windowPanesGeometry && (
        <mesh geometry={windowPanesGeometry}>
          <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.8} />
        </mesh>
      )}
    </group>
  );
}

// =========================================================================
// 3. LANTAI 1: KOLOM MERAH, KANOPI UTAMA & AREA PARKIR DROP-OFF (FOTO 1 & 3)
// =========================================================================
function GroundFloorColonnade() {
  const colH = 4.4;
  const colY = colH / 2;

  // Merged geometry untuk tiang-tiang kolom merah terracotta lantai dasar
  const columnsGeometry = useMemo(() => {
    const cols: THREE.BufferGeometry[] = [];
    const halfW = 31.5;
    const halfD = 27.5;

    // Baris tiang depan (Selatan - Area Drop off)
    for (let x = -28; x <= 28; x += 4.0) {
      const c = new THREE.BoxGeometry(0.75, colH, 0.75);
      c.translate(x, colY, -halfD);
      cols.push(c);
    }

    // Baris tiang belakang (Utara)
    for (let x = -28; x <= 28; x += 4.0) {
      const c = new THREE.BoxGeometry(0.75, colH, 0.75);
      c.translate(x, colY, halfD);
      cols.push(c);
    }

    // Baris tiang sisi Barat & Timur
    for (let z = -24; z <= 24; z += 4.0) {
      const cEast = new THREE.BoxGeometry(0.75, colH, 0.75);
      cEast.translate(halfW, colY, z);
      cols.push(cEast);

      const cWest = new THREE.BoxGeometry(0.75, colH, 0.75);
      cWest.translate(-halfW, colY, z);
      cols.push(cWest);
    }

    return BufferGeometryUtils.mergeGeometries(cols, false);
  }, [colH, colY]);

  return (
    <group>
      {/* Tiang Merah Terracotta Lantai Dasar */}
      {columnsGeometry && (
        <mesh geometry={columnsGeometry} castShadow receiveShadow>
          <meshStandardMaterial color="#C84A30" roughness={0.7} />
        </mesh>
      )}

      {/* Kanopi Lobi Masuk Utama FST (Foto 1 & 3) */}
      <group position={[0, 0, -28]}>
        {/* Fascia Abu-abu Metalik dengan Plakat "FAKULTAS SAINS DAN TEKNOLOGI" */}
        <mesh position={[0, 4.4, -3.5]} castShadow receiveShadow>
          <boxGeometry args={[18, 1.2, 7.5]} />
          <meshStandardMaterial color="#64748B" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* Kubah Kaca Piramida Hijau Emerald di Atas Kanopi Masuk (Foto 1) */}
        <mesh position={[4.5, 5.6, -3.5]} castShadow>
          <coneGeometry args={[3.4, 2.2, 4]} />
          <meshStandardMaterial
            color="#10B981"
            transparent
            opacity={0.8}
            roughness={0.2}
            metalness={0.3}
          />
        </mesh>

        {/* Tiang Penyangga Kanopi Ramping */}
        <mesh position={[-7.5, colY, -7.0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, colH, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
        <mesh position={[7.5, colY, -7.0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, colH, 16]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}

// =========================================================================
// 4. ATRIUM HALAMAN DALAM (TAMAN, PARKIR & TANAMAN KORIDOR) (FOTO 2 & 5)
// =========================================================================
function CourtyardGarden() {
  const voidHalfW = 21;
  const voidHalfD = 17;

  return (
    <group position={[0, 0, 0]}>
      {/* Lantai Courtyard Paving & Aspal Parkir */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[voidHalfW * 2 - 0.2, voidHalfD * 2 - 0.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.85} />
      </mesh>

      {/* Pulau Taman Hijau di Tengah Courtyard */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[16, 0.25, 12]} />
        <meshStandardMaterial color="#2D6A4F" roughness={0.9} />
      </mesh>

      {/* Pohon-Pohon Hias di Taman Tengah (Low Poly Cepat & Ringan) */}
      {[
        [-5, 3],
        [5, 3],
        [0, -2],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0.25, tz]}>
          <mesh position={[0, 1.2, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.25, 2.4, 8]} />
            <meshStandardMaterial color="#78350F" roughness={0.9} />
          </mesh>
          <mesh position={[0, 3.2, 0]} castShadow>
            <sphereGeometry args={[1.6, 12, 10]} />
            <meshStandardMaterial color="#15803D" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =========================================================================
// 5. PELAT LANTAI (SLAB) PUTIH CLAY DENGAN LUBANG ATRIUM
// =========================================================================
function FloorSlabMesh({
  floor,
  isFloorFocus = false,
}: {
  floor: FloorModel;
  isFloorFocus?: boolean;
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
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
      <extrudeGeometry
        args={[
          shape,
          { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 },
        ]}
      />
      <meshStandardMaterial
        color={isFloorFocus ? "#FFFFFF" : "#F8FAFC"}
        roughness={0.85}
      />
    </mesh>
  );
}

// =========================================================================
// 6. RAILING KORIDOR DALAM (PAGAR VOID ATRIUM DENGAN TANAMAN GANTUNG)
// =========================================================================
function AtriumInnerCorridorRail({ floor: _floor }: { floor: FloorModel }) {
  const voidHalfW = 21;
  const voidHalfD = 17;
  const railH = 1.0;

  return (
    <group position={[0, railH / 2, 0]}>
      {/* Railing Putih Void Atrium */}
      <mesh position={[0, 0, voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, railH, 0.08]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, -voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2, railH, 0.08]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
      </mesh>
      <mesh position={[-voidHalfW, 0, 0]}>
        <boxGeometry args={[0.08, railH, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
      </mesh>
      <mesh position={[voidHalfW, 0, 0]}>
        <boxGeometry args={[0.08, railH, voidHalfD * 2]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.4} />
      </mesh>

      {/* Planter Box Tanaman Gantung Hijau di Bibir Void (Foto 2 & 5) */}
      <mesh position={[0, -0.2, voidHalfD + 0.1]}>
        <boxGeometry args={[voidHalfW * 2, 0.35, 0.2]} />
        <meshStandardMaterial color="#15803D" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.2, -voidHalfD - 0.1]}>
        <boxGeometry args={[voidHalfW * 2, 0.35, 0.2]} />
        <meshStandardMaterial color="#15803D" roughness={0.8} />
      </mesh>
    </group>
  );
}

// =========================================================================
// 7. RUANGAN DIGITAL TWIN INTERAKTIF (BERWARNA SESUAI STATUS AC)
// =========================================================================
function InteractiveRoomBox({
  room,
  color,
  isFloorFocus,
  onClick,
}: {
  room: RoomGeometry;
  color: string;
  isFloorFocus: boolean;
  onClick: () => void;
}) {
  const { selectedSlotId } = useViewStore();
  const isSelected = selectedSlotId === room.slotId;
  const wallH = isFloorFocus ? 1.4 : 0.4;

  return (
    <group position={[room.center[0], 0, -room.center[1]]}>
      {/* Lantai Ruang (Floor Plate Berwarna Telemetri) */}
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
          emissiveIntensity={isSelected ? 0.4 : 0.15}
        />
      </mesh>

      {/* Dinding Partisi Pembatas Ruangan saat Mode Fokus Lantai */}
      {isFloorFocus && (
        <group>
          {/* Partisi Kiri & Kanan */}
          <mesh position={[-room.size[0] * 0.47, wallH / 2, 0]} castShadow>
            <boxGeometry args={[0.15, wallH, room.size[1] * 0.94]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          <mesh position={[room.size[0] * 0.47, wallH / 2, 0]} castShadow>
            <boxGeometry args={[0.15, wallH, room.size[1] * 0.94]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
          {/* Dinding Menghadap Koridor */}
          <mesh position={[0, wallH / 2, -room.size[1] * 0.47]} castShadow>
            <boxGeometry args={[room.size[0] * 0.94, wallH, 0.15]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
          </mesh>
        </group>
      )}

      {/* Pin Indikator Live Pulsing jika Ini Ruang Uji Coba Pilot R.601 */}
      {room.hasDevice && (
        <group position={[0, 2.2, 0]}>
          <mesh>
            <sphereGeometry args={[0.6, 16, 16]} />
            <meshStandardMaterial
              color="#EF4444"
              emissive="#EF4444"
              emissiveIntensity={0.9}
            />
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
