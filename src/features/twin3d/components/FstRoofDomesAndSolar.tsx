import React, { useMemo } from "react";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { FST_COLORS } from "../constants/fstColors";
import {
  createEaveFasciaGeometry,
  createHippedRoofGeometry,
  createRoofRidgesGeometry,
  getSolarTexture,
} from "../geometries/roofGeometry";

const SolarPanelArray = React.memo(function SolarPanelArray({
  width,
  length,
  cols = 12,
  rows = 4,
}: {
  width: number;
  length: number;
  cols?: number;
  rows?: number;
}) {
  const solarTexture = useMemo(() => getSolarTexture(cols, rows), [cols, rows]);

  return (
    <group>
      <mesh position={[0, -0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.06, 0.03, length + 0.06]} />
        <meshStandardMaterial color={FST_COLORS.solarBorder} roughness={0.3} metalness={0.85} />
      </mesh>

      <mesh position={[0, 0.015, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, 0.02, length]} />
        <meshStandardMaterial
          map={solarTexture || undefined}
          color={solarTexture ? "#FFFFFF" : FST_COLORS.solarBlue}
          roughness={0.18}
          metalness={0.8}
        />
      </mesh>
    </group>
  );
});

export const FstRoofDomesAndSolar = React.memo(function FstRoofDomesAndSolar({
  halfW,
  halfD,
  voidHalfW,
  voidHalfD,
}: {
  halfW: number;
  halfD: number;
  voidHalfW: number;
  voidHalfD: number;
}) {
  const roofSlabShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-halfW, -halfD);
    s.lineTo(halfW, -halfD);
    s.lineTo(halfW, halfD);
    s.lineTo(-halfW, halfD);
    s.closePath();

    const hole = new THREE.Path();
    hole.moveTo(-voidHalfW, -voidHalfD);
    hole.lineTo(voidHalfW, -voidHalfD);
    hole.lineTo(voidHalfW, voidHalfD);
    hole.lineTo(-voidHalfW, voidHalfD);
    hole.closePath();
    s.holes.push(hole);

    return s;
  }, [halfW, halfD, voidHalfW, voidHalfD]);

  const { allRoofTilesGeo, allRoofRidgesGeo, allRoofFasciaGeo } = useMemo(() => {
    const tileGeos: THREE.BufferGeometry[] = [];
    const ridgeGeos: THREE.BufferGeometry[] = [];
    const fasciaGeos: THREE.BufferGeometry[] = [];

    const cornerPositions = [
      [-28.2, 24.2],
      [28.2, 24.2],
      [-28.2, -24.2],
      [28.2, -24.2],
    ];

    cornerPositions.forEach(([cx, cz]) => {
      const gTile = createHippedRoofGeometry(10.8, 10.8, 3.8, 0.4);
      gTile.translate(cx, 2.4, cz);
      tileGeos.push(gTile);

      const gRidge = createRoofRidgesGeometry(10.8, 10.8, 3.8, 0.4);
      gRidge.translate(cx, 2.4, cz);
      ridgeGeos.push(gRidge);

      const gFascia = createEaveFasciaGeometry(10.8, 10.8, 0.4);
      gFascia.translate(cx, 2.4, cz);
      fasciaGeos.push(gFascia);
    });

    const wingNorthSouth = [
      { x: -15.0, z: 24.6 },
      { x: 15.0, z: 24.6 },
      { x: -15.0, z: -24.6 },
      { x: 15.0, z: -24.6 },
    ];

    wingNorthSouth.forEach(({ x, z }) => {
      const gTile = createHippedRoofGeometry(16.0, 7.4, 3.4, 0.4);
      gTile.translate(x, 0.5, z);
      tileGeos.push(gTile);

      const gRidge = createRoofRidgesGeometry(16.0, 7.4, 3.4, 0.4);
      gRidge.translate(x, 0.5, z);
      ridgeGeos.push(gRidge);

      const gFascia = createEaveFasciaGeometry(16.0, 7.4, 0.4);
      gFascia.translate(x, 0.5, z);
      fasciaGeos.push(gFascia);
    });

    const wingEastWest = [
      { x: -28.4, z: 0 },
      { x: 28.4, z: 0 },
    ];

    wingEastWest.forEach(({ x, z }) => {
      const gTile = createHippedRoofGeometry(7.4, 37.6, 3.4, 0.4);
      gTile.translate(x, 0.5, z);
      tileGeos.push(gTile);

      const gRidge = createRoofRidgesGeometry(7.4, 37.6, 3.4, 0.4);
      gRidge.translate(x, 0.5, z);
      ridgeGeos.push(gRidge);

      const gFascia = createEaveFasciaGeometry(7.4, 37.6, 0.4);
      gFascia.translate(x, 0.5, z);
      fasciaGeos.push(gFascia);
    });

    return {
      allRoofTilesGeo: BufferGeometryUtils.mergeGeometries(tileGeos, false),
      allRoofRidgesGeo: BufferGeometryUtils.mergeGeometries(ridgeGeos, false),
      allRoofFasciaGeo: BufferGeometryUtils.mergeGeometries(fasciaGeos, false),
    };
  }, []);

  return (
    <group>
      {/* 1. Dak Datar Beton Lantai Atap Berlubang Void Tengah */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow castShadow>
        <extrudeGeometry
          args={[
            roofSlabShape,
            { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08 },
          ]}
        />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.85} />
      </mesh>

      {/* Parapet Pengaman Bibir Void Atap */}
      <mesh position={[0, 0.65, voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[voidHalfW * 2, 1.2, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.65, -voidHalfD]} castShadow receiveShadow>
        <boxGeometry args={[voidHalfW * 2, 1.2, 0.25]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[voidHalfW, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.2, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>
      <mesh position={[-voidHalfW, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.25, 1.2, voidHalfD * 2]} />
        <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
      </mesh>

      {/* Lis Merah Bibir Void Atap */}
      <mesh position={[0, 1.28, voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2 + 0.3, 0.08, 0.32]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.28, -voidHalfD]}>
        <boxGeometry args={[voidHalfW * 2 + 0.3, 0.08, 0.32]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[voidHalfW, 1.28, 0]}>
        <boxGeometry args={[0.32, 0.08, voidHalfD * 2 + 0.3]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>
      <mesh position={[-voidHalfW, 1.28, 0]}>
        <boxGeometry args={[0.32, 0.08, voidHalfD * 2 + 0.3]} />
        <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
      </mesh>

      {/* 2. Genteng Atap Limasan & Piramida 4 Sisi Terakota */}
      {allRoofTilesGeo && (
        <mesh geometry={allRoofTilesGeo} castShadow receiveShadow>
          <meshStandardMaterial color={FST_COLORS.roofTile} roughness={0.7} />
        </mesh>
      )}

      {/* 3. Nok Bubungan Atap Gelap */}
      {allRoofRidgesGeo && (
        <mesh geometry={allRoofRidgesGeo} castShadow>
          <meshStandardMaterial color={FST_COLORS.roofRidge} roughness={0.5} />
        </mesh>
      )}

      {/* 4. Lis Hijau Eave Fascia */}
      {allRoofFasciaGeo && (
        <mesh geometry={allRoofFasciaGeo} castShadow>
          <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.6} />
        </mesh>
      )}

      {/* 5. Dinding Badan 4 Menara Sudut di Bawah Atap Piramida */}
      {[
        [-28.2, 24.2],
        [28.2, 24.2],
        [-28.2, -24.2],
        [28.2, -24.2],
      ].map(([tx, tz], i) => (
        <group key={i} position={[tx, 0, tz]}>
          <mesh position={[0, 1.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[10.5, 2.4, 10.5]} />
            <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
          </mesh>
          <mesh position={[0, 6.25, 0]}>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshStandardMaterial color={FST_COLORS.roofRidge} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* 6. Panel Surya PV Monokristalin */}
      <group position={[-15.0, 2.22, 26.65]} rotation={[0.69233, 0, 0]}>
        <SolarPanelArray width={8.4} length={2.6} cols={12} rows={4} />
      </group>
      <group position={[15.0, 2.22, 26.65]} rotation={[0.69233, 0, 0]}>
        <SolarPanelArray width={8.4} length={2.6} cols={12} rows={4} />
      </group>
      <group position={[-15.0, 2.22, -26.65]} rotation={[-0.69233, 0, 0]}>
        <SolarPanelArray width={8.4} length={2.6} cols={12} rows={4} />
      </group>
      <group position={[15.0, 2.22, -26.65]} rotation={[-0.69233, 0, 0]}>
        <SolarPanelArray width={8.4} length={2.6} cols={12} rows={4} />
      </group>

      <group position={[-30.45, 2.22, 0]} rotation={[0, 0, 0.69233]}>
        <SolarPanelArray width={2.6} length={14.0} cols={4} rows={20} />
      </group>
      <group position={[-26.35, 2.22, 0]} rotation={[0, 0, -0.69233]}>
        <SolarPanelArray width={2.6} length={14.0} cols={4} rows={20} />
      </group>
      <group position={[30.45, 2.22, 0]} rotation={[0, 0, -0.69233]}>
        <SolarPanelArray width={2.6} length={14.0} cols={4} rows={20} />
      </group>
      <group position={[26.35, 2.22, 0]} rotation={[0, 0, 0.69233]}>
        <SolarPanelArray width={2.6} length={14.0} cols={4} rows={20} />
      </group>

      {/* 7. 2 Kubah Hijau Ikonik FST (Menara Utara & Selatan) */}
      {[22.0, -22.0].map((zPos, idx) => (
        <group key={idx} position={[0, 0, zPos]}>
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[13.5, 3.6, 7.5]} />
            <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.75} />
          </mesh>
          <mesh position={[0, 4.0, 0]} castShadow>
            <cylinderGeometry args={[3.6, 3.8, 1.2, 32]} />
            <meshStandardMaterial color={FST_COLORS.whiteTrim} roughness={0.6} />
          </mesh>
          <mesh position={[0, 4.6, 0]} castShadow>
            <sphereGeometry args={[3.5, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
            <meshStandardMaterial color={FST_COLORS.domeGreen} roughness={0.4} metalness={0.15} />
          </mesh>
          <mesh position={[0, 8.4, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.22, 1.4, 12]} />
            <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.3} metalness={0.8} />
          </mesh>
          <mesh position={[0, 9.2, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color={FST_COLORS.finialGold} roughness={0.2} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* 8. Penutup Atap Silinder Core Menara Utara & Selatan */}
      <group position={[0, 0.25, 17.5]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[4.45, 4.45, 0.5, 32, 1, false, Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[4.52, 4.52, 0.1, 32, 1, false, Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      </group>

      <group position={[0, 0.25, -17.5]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[4.45, 4.45, 0.5, 32, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={FST_COLORS.creamWall} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[4.52, 4.52, 0.1, 32, 1, false, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial color={FST_COLORS.coralRed} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
});

