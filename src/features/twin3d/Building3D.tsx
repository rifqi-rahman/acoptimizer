import React, { useMemo } from "react";
import { Html } from "@react-three/drei";
import { Sparkles } from "lucide-react";
import { FloorModel } from "../../building/params";
import { useViewStore } from "../../stores/viewStore";
import { Floor3DCutaway } from "./Floor3DCutaway";
import { FstBuildingExterior, FST_COLORS } from "./FstBuildingExterior";

interface Building3DProps {
  floors: FloorModel[];
}

export const Building3D: React.FC<Building3DProps> = ({ floors }) => {
  const {
    mode,
    selectedFloor,
    selectFloor,
    selectRoom,
    isCutaway,
    hoveredFloor,
    setHoveredFloor,
  } = useViewStore();

  const currentFloor = useMemo(
    () => floors.find((f) => f.level === selectedFloor) ?? floors[5],
    [floors, selectedFloor]
  );

  return (
    <group position={[0, -12, 0]}>
      {/* TAMPILAN 3D UTAMA */}
      {mode === "building" ? (
        <group>
          {/* 1. Lingkungan Kampus Sekitar: Jalan Aspal, Area Parkir Berkanopi & Pohon Tropis (Hanya di Mode Gedung) */}
          <GroundCampusEnvironment />

          {/* 2. Taman & Pohon Cemara di Tengah Void Atrium (Hanya di Mode Gedung) */}
          <AtriumCourtyardGarden />

          {/* 3. Tinjauan Gedung FST Utuh dengan Fasad Otentik, Kubah Hijau & Panel Surya */}
          <FstBuildingExterior
            floors={floors}
            isCutaway={isCutaway}
            hoveredFloor={hoveredFloor}
            onFloorDoubleClick={(lvl) => selectFloor(lvl)}
            onFloorHover={(lvl) => setHoveredFloor(lvl)}
          />

          {/* Floating Tooltip saat Hover Lantai di Mode Gedung */}
          {hoveredFloor && (
            <FloatingFloorHoverTag
              level={hoveredFloor}
              yBase={(hoveredFloor - 1) * 4.6 + 2.5}
            />
          )}
        </group>
      ) : (
        /* Mode Lantai & Ruang: Tampilan Denah Potongan 3D (Cutaway) Interaktif */
        /* Objek lantai 1 & ground disembunyikan total, hanya tersisa 1 lantai yang mengambang */
        <group position={[0, (selectedFloor - 1) * 4.6, 0]}>
          <Floor3DCutaway floor={currentFloor} onRoomSelect={(slotId) => selectRoom(slotId)} />
        </group>
      )}
    </group>
  );
};

// =========================================================================
// Lingkungan Kampus Sekitar: Jalan Aspal, Parkiran Mobil, Trotoar & Pepohonan
// Sesuai Foto 1 (ground-floor.png) & Foto 2 (tampak-atas.png)
// =========================================================================
function GroundCampusEnvironment() {
  return (
    <group position={[0, -0.2, 0]}>
      {/* 1. Bidang Tanah Utama Kampus (Abu-abu Muda Netral Bersih) */}
      <mesh position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[116, 0.4, 102]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.9} />
      </mesh>

      {/* 2. Rumput Hijau Taman di Keliling Gedung */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[108, 94]} />
        <meshStandardMaterial color="#86EFAC" roughness={0.8} />
      </mesh>

      {/* 3. Jalan Aspal Akses & Parkir Depan (Utara & Selatan) */}
      {/* Jalan Aspal Utara */}
      <mesh position={[0, 0.05, 37.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[84, 16]} />
        <meshStandardMaterial color={FST_COLORS.asphaltGray} roughness={0.85} />
      </mesh>

      {/* Jalan Aspal Selatan */}
      <mesh position={[0, 0.05, -37.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[84, 16]} />
        <meshStandardMaterial color={FST_COLORS.asphaltGray} roughness={0.85} />
      </mesh>

      {/* Garis Parkir Kuning di Bawah Colonnade & Sepanjang Jalan (Foto 1) */}
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

      {/* Mobil Parkir Miniatur di Bawah Colonnade & Luar (Foto 1) */}
      {[
        { x: -13.5, z: 33.5, color: "#1E293B" }, // Hitam
        { x: -8.5, z: 33.5, color: "#2563EB" },  // Biru
        { x: 8.5, z: 33.5, color: "#FFFFFF" },   // Putih
        { x: 13.5, z: 33.5, color: "#94A3B8" },  // Abu-abu
        { x: -13.5, z: -33.5, color: "#DC2626" },// Merah
        { x: 8.5, z: -33.5, color: "#1E293B" },  // Hitam
      ].map((car, i) => (
        <group key={i} position={[car.x, 0.1, car.z]}>
          {/* Badan Mobil */}
          <mesh position={[0, 0.45, 0]} castShadow>
            <boxGeometry args={[2.0, 0.65, 4.4]} />
            <meshStandardMaterial color={car.color} roughness={0.3} metalness={0.4} />
          </mesh>
          {/* Kabin Mobil */}
          <mesh position={[0, 0.95, -0.2]} castShadow>
            <boxGeometry args={[1.8, 0.55, 2.4]} />
            <meshStandardMaterial color="#0F172A" roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Deretan Pohon Pelindung Kampus di Sepanjang Jalan Luar */}
      {[-38, -26, -14, 14, 26, 38].map((x, i) => (
        <group key={i}>
          {/* Pohon Sisi Utara */}
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

          {/* Pohon Sisi Selatan */}
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
}

// =========================================================================
// Taman & Pohon Cemara di Tengah Void Atrium (Ciri Khas Terbesar FST!)
// Berdasarkan Foto Udara 2 (tampak-atas.png) & Foto 1 (side-view-from-the-void.png)
// Menampilkan rumput hijau, jalan setapak batu, dan pohon cemara tinggi menjulang
// =========================================================================
function AtriumCourtyardGarden() {
  return (
    <group position={[0, 0, 0]}>
      {/* 1. Rumput Hijau Lapangan Taman Atrium */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[41.0, 33.0]} />
        <meshStandardMaterial color={FST_COLORS.lawnGreen} roughness={0.8} />
      </mesh>

      {/* 2. Jalur Setapak Paving Pejalan Kaki Melintang di Taman */}
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.2, 32.5]} />
        <meshStandardMaterial color="#CBD5E1" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
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

      {/* 4. Pohon Cemara Pinus Menjulang Tinggi (Sesuai Foto 1 - Mencapai Lantai 4!) */}
      {[
        { x: -7.5, z: -5.5, h: 16 },
        { x: -5.0, z: 6.5, h: 18 },
        { x: 6.0, z: -6.0, h: 17 },
        { x: 8.5, z: 5.0, h: 15 },
      ].map((tree, i) => (
        <group key={i} position={[tree.x, 0, tree.z]}>
          {/* Batang Pohon */}
          <mesh position={[0, tree.h * 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.5, tree.h * 0.5, 8]} />
            <meshStandardMaterial color="#78350F" roughness={0.9} />
          </mesh>
          {/* Rimbunan Daun Cemara Kerucut Berlapis (Foto 1) */}
          {[0.4, 0.65, 0.85].map((factor, j) => (
            <mesh key={j} position={[0, tree.h * factor, 0]} castShadow>
              <coneGeometry args={[3.2 - j * 0.8, tree.h * 0.35, 8]} />
              <meshStandardMaterial color={FST_COLORS.pineTreeGreen} roughness={0.65} />
            </mesh>
          ))}
        </group>
      ))}

      {/* 5. Bangku Taman Belajar Mahasiswa di Sekitar Plaza */}
      {[
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
}

// =========================================================================
// Tooltip Mengambang saat Cursor Menyorot (Hover) Lantai di Mode Gedung
// =========================================================================
function FloatingFloorHoverTag({ level, yBase }: { level: number; yBase: number }) {
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
}
