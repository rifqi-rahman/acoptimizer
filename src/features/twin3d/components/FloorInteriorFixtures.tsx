import React from "react";
import * as THREE from "three";
import { FST_COLORS } from "../constants/fstColors";

// =========================================================================
// Singleton Shapes untuk Dinding Lengkung Setengah Lingkaran & Tutup Atap Core
// =========================================================================
const VOID_HALF_W = 21.0;
const VOID_HALF_D = 17.0;

const NORTH_ARC_WALL_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.4, -VOID_HALF_D);
  s.absarc(0, -VOID_HALF_D, 4.4, Math.PI, 0, true);
  s.lineTo(4.18, -VOID_HALF_D);
  s.absarc(0, -VOID_HALF_D, 4.18, 0, Math.PI, false);
  s.closePath();
  return s;
})();

const SOUTH_ARC_WALL_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.4, VOID_HALF_D);
  s.absarc(0, VOID_HALF_D, 4.4, Math.PI, 2 * Math.PI, false);
  s.lineTo(4.18, VOID_HALF_D);
  s.absarc(0, VOID_HALF_D, 4.18, 2 * Math.PI, Math.PI, true);
  s.closePath();
  return s;
})();

const NORTH_CAP_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.45, -VOID_HALF_D);
  s.absarc(0, -VOID_HALF_D, 4.45, Math.PI, 0, true);
  s.closePath();
  return s;
})();

const SOUTH_CAP_SHAPE = (() => {
  const s = new THREE.Shape();
  s.moveTo(-4.45, VOID_HALF_D);
  s.absarc(0, VOID_HALF_D, 4.45, Math.PI, 2 * Math.PI, false);
  s.closePath();
  return s;
})();

// =========================================================================
// 1. Dinding Perimeter Luar Rendah (~2.5m Cutaway) Khas FST
// =========================================================================
export const CutawayPerimeterWalls = React.memo(function CutawayPerimeterWalls() {
  const wallH = 2.5;
  const halfW = 31.9;
  const halfD = 27.9;

  return (
    <group>
      <mesh position={[0, wallH / 2, halfD]} castShadow receiveShadow>
        <boxGeometry args={[63.8, wallH, 0.35]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[0, wallH / 2, -halfD]} castShadow receiveShadow>
        <boxGeometry args={[63.8, wallH, 0.35]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

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
});

// =========================================================================
// 2. Selasar Koridor Void Melingkar & Dinding Setengah Lingkaran Core Tangga
// =========================================================================
export const AtriumCutawayBalcony = React.memo(function AtriumCutawayBalcony({
  showTrees,
  isBuildingStack,
  level,
}: {
  showTrees: boolean;
  isBuildingStack: boolean;
  level: number;
}) {
  const parapetH = 1.15;
  const arcWallH = isBuildingStack ? 4.6 : parapetH;

  return (
    <group>
      {/* A. Dinding Lurus Pembatas Void */}
      <mesh position={[-12.7, parapetH / 2, VOID_HALF_D]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, VOID_HALF_D]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      <mesh position={[-12.7, parapetH / 2, -VOID_HALF_D]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[12.7, parapetH / 2, -VOID_HALF_D]} castShadow receiveShadow>
        <boxGeometry args={[16.6, parapetH, 0.18]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      <mesh position={[VOID_HALF_W, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, VOID_HALF_D * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-VOID_HALF_W, parapetH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.18, parapetH, VOID_HALF_D * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* B. Dinding Melengkung Setengah Lingkaran Mengelilingi Area Tangga */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[NORTH_ARC_WALL_SHAPE, { depth: arcWallH, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0, isBuildingStack ? arcWallH - 0.18 : parapetH]}>
          <extrudeGeometry args={[NORTH_ARC_WALL_SHAPE, { depth: 0.18, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>

        <mesh castShadow receiveShadow>
          <extrudeGeometry args={[SOUTH_ARC_WALL_SHAPE, { depth: arcWallH, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
        </mesh>
        <mesh position={[0, 0, isBuildingStack ? arcWallH - 0.18 : parapetH]}>
          <extrudeGeometry args={[SOUTH_ARC_WALL_SHAPE, { depth: 0.18, bevelEnabled: false }]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>

        {isBuildingStack && level === 7 && (
          <>
            <mesh position={[0, 0, arcWallH]} castShadow receiveShadow>
              <extrudeGeometry args={[NORTH_CAP_SHAPE, { depth: 0.25, bevelEnabled: false }]} />
              <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
            </mesh>
            <mesh position={[0, 0, arcWallH]} castShadow receiveShadow>
              <extrudeGeometry args={[SOUTH_CAP_SHAPE, { depth: 0.25, bevelEnabled: false }]} />
              <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
            </mesh>
          </>
        )}
      </group>

      {/* C. Lis Merah & Tanaman Gantung di Dinding Lurus */}
      <mesh position={[-12.7, parapetH + 0.04, VOID_HALF_D]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[12.7, parapetH + 0.04, VOID_HALF_D]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[-12.7, parapetH + 0.04, -VOID_HALF_D]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[12.7, parapetH + 0.04, -VOID_HALF_D]}>
        <boxGeometry args={[16.8, 0.08, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {showTrees && (
        <>
          <mesh position={[-12.7, parapetH + 0.1, VOID_HALF_D - 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[12.7, parapetH + 0.1, VOID_HALF_D - 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[-12.7, parapetH + 0.1, -VOID_HALF_D + 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
          <mesh position={[12.7, parapetH + 0.1, -VOID_HALF_D + 0.1]}>
            <boxGeometry args={[15.0, 0.2, 0.22]} />
            <meshStandardMaterial color={FST_COLORS.foliageGreen} roughness={0.6} />
          </mesh>
        </>
      )}
    </group>
  );
});

// =========================================================================
// 3. Tangga Imperial Bercabang Dua (T-Shape Split Staircase) & Unit Lift
// =========================================================================
const CENTER_LOWER_STEPS = [
  { z: -0.45, y: 0.15 },
  { z: -0.78, y: 0.3 },
  { z: -1.11, y: 0.45 },
  { z: -1.44, y: 0.6 },
  { z: -1.77, y: 0.75 },
  { z: -2.1, y: 0.9 },
];

const SPLIT_UPPER_STEPS = [
  { z: -2.1, y: 1.22 },
  { z: -1.77, y: 1.38 },
  { z: -1.44, y: 1.54 },
  { z: -1.11, y: 1.7 },
  { z: -0.78, y: 1.86 },
  { z: -0.45, y: 2.02 },
];

export const CoreCutawayStairs = React.memo(function CoreCutawayStairs() {
  return (
    <group>
      {/* A. Tiang Kolom Silinder Putih Penyangga Bordes Tengah */}
      <mesh position={[0, 0.52, -2.85]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.2, 1.04, 20]} />
        <meshStandardMaterial color="#F8FAFC" roughness={0.5} />
      </mesh>

      {/* B. Bordes Tengah */}
      <group position={[0, 1.05, -2.82]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[4.1, 0.14, 0.96]} />
          <meshStandardMaterial color="#CBD5E1" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.08, 0]} receiveShadow>
          <boxGeometry args={[4.06, 0.03, 0.92]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.2} />
        </mesh>
        <mesh position={[0, 0.48, -0.44]}>
          <boxGeometry args={[4.0, 0.05, 0.05]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* C. Jalur Tangga Tengah Bawah */}
      <group position={[0, 0, 0]}>
        <mesh position={[-0.58, 0.52, -1.3]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.14, 2.25]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.58, 0.52, -1.3]} rotation={[0.42, 0, 0]} castShadow>
          <boxGeometry args={[0.08, 0.14, 2.25]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
        </mesh>

        {CENTER_LOWER_STEPS.map((s, i) => (
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

        <mesh position={[-0.64, 0.95, -1.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 2.25]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0.64, 0.95, -1.3]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[0.04, 0.05, 2.25]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* D. Dua Jalur Cabang Kiri & Kanan Naik ke Lantai Atas */}
      {[-1.45, 1.45].map((branchX, bIdx) => (
        <group key={`branch-${bIdx}`} position={[branchX, 0, 0]}>
          <mesh position={[-0.46, 1.56, -1.3]} rotation={[-0.44, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 0.14, 2.25]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh position={[0.46, 1.56, -1.3]} rotation={[-0.44, 0, 0]} castShadow>
            <boxGeometry args={[0.07, 0.14, 2.25]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.5} roughness={0.4} />
          </mesh>

          {SPLIT_UPPER_STEPS.map((s, i) => (
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
});

export const LiftUnit = React.memo(function LiftUnit({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 1.15, -0.1]} castShadow>
        <boxGeometry args={[1.8, 2.3, 0.25]} />
        <meshStandardMaterial color="#334155" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.15, 0.04]} castShadow>
        <boxGeometry args={[1.7, 2.3, 0.08]} />
        <meshStandardMaterial color="#E2E8F0" roughness={0.5} />
      </mesh>
      <mesh position={[-0.39, 1.1, 0.08]}>
        <boxGeometry args={[0.74, 2.15, 0.02]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.39, 1.1, 0.08]}>
        <boxGeometry args={[0.74, 2.15, 0.02]} />
        <meshStandardMaterial color="#F1F5F9" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-0.39, 0.8, 0.095]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      <mesh position={[0.39, 0.8, 0.095]}>
        <boxGeometry args={[0.12, 1.2, 0.005]} />
        <meshStandardMaterial color="#F59E0B" roughness={0.4} />
      </mesh>
      <mesh position={[0, 2.12, 0.09]}>
        <boxGeometry args={[0.42, 0.14, 0.02]} />
        <meshStandardMaterial color="#0F172A" roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.12, 0.102]}>
        <boxGeometry args={[0.3, 0.07, 0.005]} />
        <meshStandardMaterial color="#38BDF8" emissive="#38BDF8" emissiveIntensity={0.9} />
      </mesh>
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
});

export const CutawayCoreStairsAndLifts = React.memo(function CutawayCoreStairsAndLifts({
  showStairs,
  showLifts,
}: {
  showStairs: boolean;
  showLifts: boolean;
}) {
  return (
    <group>
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

      {showLifts && (
        <group position={[0, 0, 0]}>
          <LiftUnit position={[-4.5, 0, -27.7]} rotation={[0, 0, 0]} />
          <LiftUnit position={[4.5, 0, -27.7]} rotation={[0, 0, 0]} />
        </group>
      )}
    </group>
  );
});

// =========================================================================
// 4. Furnitur Komunal, Saintek Hub Lounge, & Teater Amphitheater
// =========================================================================
export const WoodenBarStool = React.memo(function WoodenBarStool({
  position,
}: {
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[0.38, 0.05, 0.38]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>
      {[-0.14, 0.14].map((lx, i) =>
        [-0.14, 0.14].map((lz, j) => (
          <mesh key={`${i}-${j}`} position={[lx, 0.3, lz]}>
            <boxGeometry args={[0.04, 0.6, 0.04]} />
            <meshStandardMaterial color="#B45309" roughness={0.6} />
          </mesh>
        ))
      )}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.32, 0.03, 0.32]} />
        <meshStandardMaterial color="#92400E" roughness={0.6} />
      </mesh>
    </group>
  );
});

export const CommunalTableSet = React.memo(function CommunalTableSet({
  position,
  rotation,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.62, 0]} castShadow>
        <boxGeometry args={[2.2, 0.07, 0.95]} />
        <meshStandardMaterial color="#78350F" roughness={0.55} />
      </mesh>
      {[-0.85, 0.85].map((lx, i) => (
        <group key={i} position={[lx, 0, 0]}>
          <mesh position={[0, 0.3, 0]}>
            <boxGeometry args={[0.06, 0.6, 0.88]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} />
          </mesh>
        </group>
      ))}

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
});

export const SaintekHubLounge = React.memo(function SaintekHubLounge({
  level,
  showFurniture,
  showTrees,
  showLifts,
}: {
  level: number;
  showFurniture: boolean;
  showTrees: boolean;
  showLifts: boolean;
}) {
  if (level === 1) return null;

  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.02, 22.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[13.6, 9.6]} />
        <meshStandardMaterial color="#D97706" roughness={0.5} />
      </mesh>

      {showLifts && (
        <>
          <LiftUnit position={[-4.5, 0, 27.7]} rotation={[0, Math.PI, 0]} />
          <LiftUnit position={[4.5, 0, 27.7]} rotation={[0, Math.PI, 0]} />
        </>
      )}

      <mesh position={[0, 1.2, 27.75]}>
        <boxGeometry args={[6.8, 2.2, 0.06]} />
        <meshStandardMaterial color="#1E40AF" roughness={0.5} />
      </mesh>

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
          <mesh position={[0, 0.9, 27.2]} castShadow>
            <boxGeometry args={[6.4, 0.08, 0.45]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.4} />
          </mesh>

          {[-2.3, -0.8, 0.8, 2.3].map((x, i) => (
            <WoodenBarStool key={`stool-c-${i}`} position={[x, 0, 26.6]} />
          ))}

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

          {[-6.2, -5.6, -5.0, -4.4, -3.8].map((x, i) => (
            <mesh key={i} position={[x, 2.4, 24.5]}>
              <boxGeometry args={[0.14, 0.16, 4.8]} />
              <meshStandardMaterial color="#B45309" roughness={0.5} />
            </mesh>
          ))}

          <mesh position={[-5.0, 2.1, 24.5]}>
            <torusGeometry args={[0.35, 0.03, 16, 32]} />
            <meshStandardMaterial color="#FEF08A" emissive="#FEF08A" emissiveIntensity={0.8} />
          </mesh>

          <CommunalTableSet position={[-1.7, 0, 22.5]} />
          <CommunalTableSet position={[1.7, 0, 22.5]} />
        </>
      )}

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
});

export const TheaterAmphitheaterSeating = React.memo(function TheaterAmphitheaterSeating({
  level,
}: {
  level: number;
}) {
  if (level === 1) return null;

  return (
    <group>
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
});

