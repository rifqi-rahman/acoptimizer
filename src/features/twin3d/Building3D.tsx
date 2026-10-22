import React, { useCallback, useMemo } from "react";
import { Html } from "@react-three/drei";
import { Sparkles } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { FloorModel } from "../../building/params";
import { useViewStore } from "../../stores/viewStore";
import { Floor3DCutaway } from "./Floor3DCutaway";
import { FstBuildingExterior, FST_COLORS } from "./FstBuildingExterior";

interface Building3DProps {
  floors: FloorModel[];
}

export const Building3D: React.FC<Building3DProps> = React.memo(function Building3D({
  floors,
}) {
  const {
    mode,
    selectedFloor,
    selectFloor,
    selectRoom,
    hoveredFloor,
    setHoveredFloor,
    objectFilters,
  } = useViewStore(
    useShallow((s) => ({
      mode: s.mode,
      selectedFloor: s.selectedFloor,
      selectFloor: s.selectFloor,
      selectRoom: s.selectRoom,
      hoveredFloor: s.hoveredFloor,
      setHoveredFloor: s.setHoveredFloor,
      objectFilters: s.objectFilters,
    }))
  );

  const currentFloor = useMemo(
    () => floors.find((f) => f.level === selectedFloor) ?? floors[5],
    [floors, selectedFloor]
  );

  const handleRoomSelectSingleFloor = useCallback(
    (slotId: string) => {
      selectRoom(slotId);
    },
    [selectRoom]
  );

  return (
    <group position={[0, -12, 0]}>
      {/* TAMPILAN 3D UTAMA */}
      {mode === "building" ? (
        <group>
          {/* 1. Lingkungan Kampus Sekitar: Jalan Aspal, Area Parkir & Pohon Tropis */}
          <GroundCampusEnvironment
            showCars={objectFilters.cars}
            showTrees={objectFilters.trees}
          />

          {/* 2. Taman & Pohon Cemara di Tengah Void Atrium */}
          <AtriumCourtyardGarden
            showTrees={objectFilters.trees}
            showFurniture={objectFilters.furniture}
          />

          {/* 3. Stack 7 Lantai Penuh (Setiap Lantai Merender Komponen Floor3DCutaway yang Sama) */}
          {floors.map((floor) => (
            <group key={floor.level} position={[0, (floor.level - 1) * 4.6, 0]}>
              <Floor3DCutaway
                floor={floor}
                isBuildingStack={true}
                onRoomSelect={(slotId) => {
                  selectFloor(floor.level);
                  selectRoom(slotId);
                }}
              />
            </group>
          ))}

          {/* 4. Cangkang Fasad Luar & Atap Kubah/Panel Surya (Dapat Disembunyikan via Filter Objek) */}
          {objectFilters.roofAndFacade && (
            <FstBuildingExterior
              floors={floors}
              hoveredFloor={hoveredFloor}
              onFloorDoubleClick={selectFloor}
              onFloorHover={setHoveredFloor}
            />
          )}

          {/* Floating Tooltip saat Hover Lantai di Mode Gedung */}
          {hoveredFloor && (
            <FloatingFloorHoverTag
              level={hoveredFloor}
              yBase={(hoveredFloor - 1) * 4.6 + 2.5}
            />
          )}
        </group>
      ) : (
        /* Mode Lantai & Ruang: Tampilan 1 Lantai Spesifik Interaktif */
        <group position={[0, (selectedFloor - 1) * 4.6, 0]}>
          <Floor3DCutaway
            floor={currentFloor}
            isBuildingStack={false}
            onRoomSelect={handleRoomSelectSingleFloor}
          />
        </group>
      )}
    </group>
  );
});

// =========================================================================
// Lingkungan Kampus Sekitar: Jalan Aspal, Parkiran Mobil, Trotoar & Pepohonan
// =========================================================================
const GroundCampusEnvironment = React.memo(function GroundCampusEnvironment({
  showCars,
  showTrees,
}: {
  showCars: boolean;
  showTrees: boolean;
}) {
  // Diletakkan di y = -0.42 (di bawah dasar pelat Lantai 1 y = -0.32) agar 100% bebas z-fighting / glitch!
  return (
    <group position={[0, -0.42, 0]}>
      {/* 1. Bidang Tanah Utama Kampus (Abu-abu Muda Netral Bersih) */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <boxGeometry args={[116, 0.4, 102]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
      </mesh>

      {/* 2. Rumput Hijau Taman di Keliling Gedung */}
      <mesh position={[0, 0.0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[108, 94]} />
        <meshStandardMaterial color="#86EFAC" roughness={0.8} />
      </mesh>

      {/* 3. Jalan Aspal Akses & Parkir Depan (Utara & Selatan) */}
      <mesh position={[0, 0.04, 37.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[84, 16]} />
        <meshStandardMaterial color={FST_COLORS.asphaltGray} roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.04, -37.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[84, 16]} />
        <meshStandardMaterial color={FST_COLORS.asphaltGray} roughness={0.85} />
      </mesh>

      {/* Garis Parkir Kuning di Bawah Colonnade & Sepanjang Jalan */}
      {[-16, -11, -6, 6, 11, 16].map((x, i) => (
        <group key={i}>
          <mesh position={[x, 0.08, 33.5]}>
            <boxGeometry args={[0.15, 0.02, 7.5]} />
            <meshStandardMaterial color="#FBBF24" roughness={0.4} />
          </mesh>
          <mesh position={[x, 0.08, -33.5]}>
            <boxGeometry args={[0.15, 0.02, 7.5]} />
            <meshStandardMaterial color="#FBBF24" roughness={0.4} />
          </mesh>
        </group>
      ))}

      {/* Mobil Parkir Miniatur (Dapat Disembunyikan via Filter Objek) */}
      {showCars &&
        [
          { x: -13.5, z: 33.5, color: "#1E293B" }, // Hitam
          { x: -8.5, z: 33.5, color: "#2563EB" }, // Biru
          { x: 8.5, z: 33.5, color: "#FFFFFF" }, // Putih
          { x: 13.5, z: 33.5, color: "#94A3B8" }, // Abu-abu
          { x: -13.5, z: -33.5, color: "#DC2626" }, // Merah
          { x: 8.5, z: -33.5, color: "#1E293B" }, // Hitam
        ].map((car, i) => (
          <group key={i} position={[car.x, 0.1, car.z]}>
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[2.0, 0.65, 4.4]} />
              <meshStandardMaterial color={car.color} roughness={0.3} metalness={0.4} />
            </mesh>
            <mesh position={[0, 0.95, -0.2]} castShadow>
              <boxGeometry args={[1.8, 0.55, 2.4]} />
              <meshStandardMaterial color="#0F172A" roughness={0.2} />
            </mesh>
          </group>
        ))}

      {/* Deretan Pohon Pelindung Kampus di Sepanjang Jalan Luar (Dapat Disembunyikan via Filter Objek) */}
      {showTrees &&
        [-38, -26, -14, 14, 26, 38].map((x, i) => (
          <group key={i}>
            <group position={[x, 0, 47.0]}>
              <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 2.8, 8]} />
                <meshStandardMaterial color="#78350F" roughness={0.8} />
              </mesh>
              <mesh position={[0, 4.2, 0]} castShadow>
                <sphereGeometry args={[2.2, 12, 12]} />
                <meshStandardMaterial color={FST_COLORS.pineTreeGreen} roughness={0.6} />
              </mesh>
            </group>

            <group position={[x, 0, -47.0]}>
              <mesh position={[0, 1.4, 0]} castShadow>
                <cylinderGeometry args={[0.25, 0.35, 2.8, 8]} />
                <meshStandardMaterial color="#78350F" roughness={0.8} />
              </mesh>
              <mesh position={[0, 4.2, 0]} castShadow>
                <sphereGeometry args={[2.2, 12, 12]} />
                <meshStandardMaterial color={FST_COLORS.pineTreeGreen} roughness={0.6} />
              </mesh>
            </group>
          </group>
        ))}
    </group>
  );
});

// =========================================================================
// Taman & Pohon Cemara di Tengah Void Atrium
// =========================================================================
const AtriumCourtyardGarden = React.memo(function AtriumCourtyardGarden({
  showTrees,
  showFurniture,
}: {
  showTrees: boolean;
  showFurniture: boolean;
}) {
  return (
    <group position={[0, -0.35, 0]}>
      {/* 1. Rumput Hijau Lapangan Taman Atrium */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[41.0, 33.0]} />
        <meshStandardMaterial color={FST_COLORS.lawnGreen} roughness={0.8} />
      </mesh>

      {/* 2. Jalur Setapak Paving Pejalan Kaki Melintang di Taman */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 32.5]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40.5, 3.2]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>

      {/* 3. Kolam Bundar / Plaza Tengah Taman */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[3.8, 4.2, 0.25, 32]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[3.2, 3.2, 0.1, 32]} />
        <meshStandardMaterial color="#38BDF8" roughness={0.2} metalness={0.1} />
      </mesh>

      {/* 4. Pohon Cemara Pinus Menjulang Tinggi (Dapat Disembunyikan via Filter Objek) */}
      {showTrees &&
        [
          { x: -7.5, z: -5.5, h: 16 },
          { x: -5.0, z: 6.5, h: 18 },
          { x: 6.0, z: -6.0, h: 17 },
          { x: 8.5, z: 5.0, h: 15 },
        ].map((tree, i) => (
          <group key={i} position={[tree.x, 0, tree.z]}>
            <mesh position={[0, tree.h * 0.25, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.5, tree.h * 0.5, 8]} />
              <meshStandardMaterial color="#78350F" roughness={0.9} />
            </mesh>
            {[0.4, 0.65, 0.85].map((factor, j) => (
              <mesh key={j} position={[0, tree.h * factor, 0]} castShadow>
                <coneGeometry args={[3.2 - j * 0.8, tree.h * 0.35, 8]} />
                <meshStandardMaterial color={FST_COLORS.pineTreeGreen} roughness={0.65} />
              </mesh>
            ))}
          </group>
        ))}

      {/* 5. Bangku Taman Belajar Mahasiswa di Sekitar Plaza */}
      {showFurniture &&
        [
          { x: -8.0, z: 0 },
          { x: 8.0, z: 0 },
          { x: 0, z: -8.0 },
          { x: 0, z: 8.0 },
        ].map((bench, i) => (
          <group key={i} position={[bench.x, 0.2, bench.z]}>
            <mesh castShadow>
              <boxGeometry args={[2.2, 0.35, 0.6]} />
              <meshStandardMaterial color="#78350F" roughness={0.7} />
            </mesh>
          </group>
        ))}
    </group>
  );
});

// =========================================================================
// Tooltip Mengambang saat Cursor Menyorot (Hover) Lantai di Mode Gedung
// =========================================================================
const FloatingFloorHoverTag = React.memo(function FloatingFloorHoverTag({
  level,
  yBase,
}: {
  level: number;
  yBase: number;
}) {
  const isPilotFloor = level === 6;

  return (
    <Html position={[0, yBase, 30.5]} center distanceFactor={55} zIndexRange={[10, 0]}>
      <div className="pointer-events-none px-3.5 py-1.5 rounded-full bg-slate-900/95 backdrop-blur-md text-white text-xs font-black shadow-2xl border-2 border-blue-500/80 flex items-center gap-2 whitespace-nowrap animate-fade-in">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
        <span>Lantai {level} • 24 Ruangan</span>
        {isPilotFloor && (
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-[10px] text-white flex items-center gap-1 font-bold">
            <Sparkles className="w-2.5 h-2.5" />
            Pilot R.601
          </span>
        )}
        <span className="text-[10px] text-blue-300 font-normal">Klik 2x untuk masuk</span>
      </div>
    </Html>
  );
});
